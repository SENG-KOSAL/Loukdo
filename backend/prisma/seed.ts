import { z } from "zod"
import prisma from "../src/services/prisma"
import { hash } from "../src/services/password"
import seedFixture from "./seed-data.json"

const branchAdminSchema = z.object({
  name: z.string().trim().min(1),
  username: z.string().trim().min(1),
  email: z.string().trim().email(),
  password: z.string().min(8),
}).strict()

const categorySchema = z.object({
  key: z.string().trim().min(1).max(60),
  name: z.string().trim().min(1),
  description: z.string().trim().min(1).optional(),
  active: z.boolean().optional(),
}).strict()

const productSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().min(1).optional(),
  categoryKey: z.string().trim().min(1).max(60),
  price: z.number().nonnegative(),
  cost: z.number().nonnegative(),
  sku: z.string().trim().min(1),
  barcode: z.string().trim().min(1).optional(),
  taxable: z.boolean().optional(),
  active: z.boolean().optional(),
  quantity: z.number().int().nonnegative(),
  minStock: z.number().int().nonnegative(),
}).strict()

const branchSchema = z.object({
  name: z.string().trim().min(1),
  code: z.string().trim().min(1).max(20),
  url: z.string().url().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
  admin: branchAdminSchema,
  categories: z.array(categorySchema).min(1),
  products: z.array(productSchema).min(1),
}).strict()

const seedDataSchema = z.object({
  branches: z.array(branchSchema).min(1),
}).strict()

type SeedData = z.infer<typeof seedDataSchema>

function assertUnique(values: string[], label: string) {
  const duplicates = values.filter((value, index) => values.indexOf(value) !== index)
  if (duplicates.length > 0) {
    throw new Error(`Seed fixture contains duplicate ${label}: ${[...new Set(duplicates)].join(", ")}`)
  }
}

function assertFixtureConsistency(data: SeedData) {
  assertUnique(data.branches.map((branch) => branch.name), "branch names")
  assertUnique(data.branches.map((branch) => branch.code), "branch codes")
  assertUnique(data.branches.map((branch) => branch.admin.username), "branch-admin usernames")
  assertUnique(data.branches.map((branch) => branch.admin.email), "branch-admin emails")

  for (const branch of data.branches) {
    assertUnique(branch.categories.map((category) => category.key), `category keys for ${branch.code}`)
    assertUnique(branch.products.map((product) => product.sku), `product SKUs for ${branch.code}`)

    const categoryKeys = new Set(branch.categories.map((category) => category.key))
    for (const product of branch.products) {
      if (!categoryKeys.has(product.categoryKey)) {
        throw new Error(
          `Product "${product.sku}" in ${branch.code} references missing category "${product.categoryKey}".`,
        )
      }
    }
  }
}

async function seedDatabase(data: SeedData) {
  await prisma.$transaction(async (tx) => {
    await tx.stockMovement.deleteMany()
    await tx.purchaseOrderItem.deleteMany()
    await tx.purchaseOrder.deleteMany()
    await tx.vendor.deleteMany()
    await tx.saleItem.deleteMany()
    await tx.sale.deleteMany()
    await tx.inventoryItem.deleteMany()
    await tx.product.deleteMany()
    await tx.category.deleteMany()
    await tx.user.deleteMany()
    await tx.rolePermission.deleteMany()
    await tx.branch.deleteMany()

    for (const seedBranch of data.branches) {
      const branch = await tx.branch.create({
        data: {
          name: seedBranch.name,
          code: seedBranch.code,
          url: seedBranch.url ?? null,
          adminName: seedBranch.admin.name,
          adminEmail: seedBranch.admin.email,
          status: seedBranch.status,
        },
      })

      await tx.user.create({
        data: {
          name: seedBranch.admin.name,
          username: seedBranch.admin.username,
          email: seedBranch.admin.email,
          password: hash(seedBranch.admin.password),
          role: "BRANCH_ADMIN",
          branchId: branch.id,
        },
      })

      const categoryIds = new Map<string, string>()
      for (const seedCategory of seedBranch.categories) {
        const category = await tx.category.create({
          data: {
            name: seedCategory.name,
            slug: seedCategory.key,
            desc: seedCategory.description ?? null,
            active: seedCategory.active ?? true,
            branchId: branch.id,
          },
        })
        categoryIds.set(seedCategory.key, category.id)
      }

      for (const seedProduct of seedBranch.products) {
        await tx.product.create({
          data: {
            name: seedProduct.name,
            description: seedProduct.description ?? null,
            price: seedProduct.price,
            cost: seedProduct.cost,
            sku: seedProduct.sku,
            barcode: seedProduct.barcode ?? null,
            taxable: seedProduct.taxable ?? true,
            active: seedProduct.active ?? true,
            categoryId: categoryIds.get(seedProduct.categoryKey),
            branchId: branch.id,
            inventory: {
              create: {
                branchId: branch.id,
                quantity: seedProduct.quantity,
                minStock: seedProduct.minStock,
              },
            },
          },
        })
      }
    }
  })
}

async function main() {
  const data = seedDataSchema.parse(seedFixture)
  assertFixtureConsistency(data)
  await seedDatabase(data)

  const categoryCount = data.branches.reduce((count, branch) => count + branch.categories.length, 0)
  const productCount = data.branches.reduce((count, branch) => count + branch.products.length, 0)
  console.log(`Seeded ${data.branches.length} branches, ${data.branches.length} branch-admin users, ${categoryCount} categories, ${productCount} products, and ${productCount} inventory items.`)
}

main()
  .catch((error: unknown) => {
    console.error("Database seeding failed:", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
