import { faker } from "@faker-js/faker"
import prisma from "../src/services/prisma"
import { hash } from "../src/services/password"
import type { BranchStatus, SaleStatus } from "../src/generated/prisma"
import seedData from "./seed-data/seed.json"

type SeedData = typeof seedData

interface SeedBranch extends SeedData["branches"][number] {}
interface SeedUser extends SeedData["users"][number] {}
interface SeedRolePermission extends SeedData["rolePermissions"][number] {}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50) || `cat-${Date.now()}`
}

const CATEGORY_NAMES: Record<string, string> = {
  "Cosmetics": "ផលិតផលអនាម៉ាក់",
  "Beverages": "ភេសជ្ជៈ",
  "Food": "អាហារ",
  "Essentials": "សំខាន់ៗ",
  "Household": "ផ្ទះបាយ",
  "Snacks": "ការីក្រៅ",
  "Electronics": "អេឡិចត្រូនិស៊ី",
  "Clothing": "សម្លៀកបំពាក់",
}

const PRODUCT_TEMPLATES: Record<string, Array<{ name: string; priceRange: [number, number]; costRange: [number, number] }>> = {
  "Cosmetics": [
    { name: "ក្លាស់ជូនមុខ", priceRange: [5, 25], costRange: [2, 10] },
    { name: "បរិសុទ្ធស្មៀរ", priceRange: [3, 15], costRange: [1, 6] },
    { name: "ក្រេមថ្មី", priceRange: [10, 40], costRange: [4, 18] },
    { name: "គ្រឿងសម្អាង", priceRange: [8, 30], costRange: [3, 12] },
    { name: "ទឹកត្រាស់មុខ", priceRange: [2, 10], costRange: [1, 4] },
    { name: "ព្រះព្រាត់មុខ", priceRange: [6, 20], costRange: [2, 8] },
    { name: "ថ្នាំលាប់ស្បែក", priceRange: [4, 18], costRange: [2, 7] },
    { name: "កាសែត", priceRange: [1, 5], costRange: [0.5, 2] },
    { name: "បារាំងមុខ", priceRange: [15, 50], costRange: [6, 22] },
    { name: "ទឹកលាយអនាម៉ាក់", priceRange: [3, 12], costRange: [1, 5] },
    { name: "គ្រឿងប្រដាប់", priceRange: [2, 8], costRange: [1, 3] },
    { name: "ព្រះព្រាត់ដៃ", priceRange: [5, 15], costRange: [2, 6] },
  ],
  "Beverages": [
    { name: "ទឹកកក", priceRange: [1, 3], costRange: [0.5, 1.5] },
    { name: "ទឹកផ្លែឈើ", priceRange: [2, 6], costRange: [1, 3] },
    { name: "កាហ្វេ", priceRange: [3, 10], costRange: [1.5, 4] },
    { name: "តែកាហ្វេ", priceRange: [3, 10], costRange: [1.5, 4] },
    { name: "ទឹកអំពិល", priceRange: [1, 3], costRange: [0.5, 1.5] },
    { name: "ស្រាប៉ាង", priceRange: [2, 8], costRange: [1, 3.5] },
    { name: "ទឹកផ្កា", priceRange: [2, 6], costRange: [1, 2.5] },
    { name: "ត្រីហ្គ្រេ", priceRange: [1, 4], costRange: [0.5, 2] },
    { name: "ទឹកផ្លែប៉ោម", priceRange: [2, 5], costRange: [1, 2.5] },
    { name: "កាហ្វេជាតិ", priceRange: [5, 15], costRange: [2, 7] },
  ],
  "Food": [
    { name: "អង្គរ", priceRange: [3, 10], costRange: [1.5, 4] },
    { name: "បាយសាច់", priceRange: [5, 15], costRange: [2, 7] },
    { name: "មីការ៉ុង", priceRange: [4, 12], costRange: [2, 5] },
    { name: "ខ្ទិះខ្ទឹង", priceRange: [3, 10], costRange: [1.5, 4] },
    { name: "ហ្គាស", priceRange: [2, 8], costRange: [1, 3] },
    { name: "សាច់ជ្រូកទឹក", priceRange: [8, 25], costRange: [3, 12] },
    { name: "ត្រីខ្លះ", priceRange: [10, 30], costRange: [4, 15] },
    { name: "សាច់ជ្រូកចម្លែក", priceRange: [6, 18], costRange: [2.5, 8] },
    { name: "បន្លែសម្ពោង", priceRange: [2, 8], costRange: [1, 3] },
    { name: "ខាត់អាំង", priceRange: [3, 10], costRange: [1.5, 4] },
    { name: "ហ្គាសអាំង", priceRange: [4, 12], costRange: [2, 5] },
    { name: "បារីមី", priceRange: [5, 15], costRange: [2, 6] },
  ],
  "Essentials": [
    { name: "ជាតិម្កះ", priceRange: [2, 8], costRange: [1, 3] },
    { name: "ទឹកស្អាត", priceRange: [1, 4], costRange: [0.5, 1.5] },
    { name: "សាប៊ូ", priceRange: [3, 10], costRange: [1.5, 4] },
    { name: "ធ្នាក់", priceRange: [1, 3], costRange: [0.5, 1.5] },
    { name: "ទឹកលាយបន្លែ", priceRange: [2, 6], costRange: [1, 2.5] },
    { name: "ទឹកអង្គរ", priceRange: [1, 3], costRange: [0.5, 1.5] },
    { name: "ទឹកត្រាស់", priceRange: [1, 3], costRange: [0.5, 1.5] },
    { name: "ទឹកផ្កាមាន់", priceRange: [2, 5], costRange: [1, 2] },
    { name: "ទឹកកកធំ", priceRange: [1, 3], costRange: [0.5, 1.5] },
    { name: "ទឹកសុទ្ធស្មៀរ", priceRange: [1, 3], costRange: [0.5, 1.5] },
  ],
  "Household": [
    { name: "ការីខោ", priceRange: [5, 15], costRange: [2, 6] },
    { name: "ខោអាវ", priceRange: [3, 10], costRange: [1.5, 4] },
    { name: "គ្រឿងប្រេង", priceRange: [2, 8], costRange: [1, 3] },
    { name: "ក្រណាត់", priceRange: [1, 5], costRange: [0.5, 2] },
    { name: "បន្លែកាហ្វេ", priceRange: [3, 10], costRange: [1.5, 4] },
    { name: "ការីធូលី", priceRange: [4, 12], costRange: [2, 5] },
    { name: "ការីចាន", priceRange: [2, 8], costRange: [1, 3] },
    { name: "ការីបាយ", priceRange: [3, 10], costRange: [1.5, 4] },
    { name: "ការីផ្ទះ", priceRange: [5, 20], costRange: [2, 8] },
    { name: "ការីអាហារ", priceRange: [4, 15], costRange: [2, 6] },
  ],
  "Snacks": [
    { name: "ខ្ចាស់", priceRange: [1, 5], costRange: [0.5, 2] },
    { name: "ខ្ទឹងខ្ទី", priceRange: [1, 4], costRange: [0.5, 1.5] },
    { name: "ការ៉ុងខ្ទឹង", priceRange: [2, 6], costRange: [1, 2.5] },
    { name: "ខ្ទឹងខ្ទឹង", priceRange: [1, 4], costRange: [0.5, 1.5] },
    { name: "ខ្ទឹងខ្ទី", priceRange: [1, 4], costRange: [0.5, 1.5] },
    { name: "ការ៉ុងខ្ទឹង", priceRange: [2, 6], costRange: [1, 2.5] },
    { name: "ខ្ទឹងខ្ទី", priceRange: [1, 4], costRange: [0.5, 1.5] },
    { name: "ការ៉ុងខ្ទឹង", priceRange: [2, 6], costRange: [1, 2.5] },
  ],
  "Electronics": [
    { name: "ថ្មី", priceRange: [10, 50], costRange: [5, 25] },
    { name: "បញ្ចាំថ្មី", priceRange: [5, 25], costRange: [2, 12] },
    { name: "ការីថ្មី", priceRange: [3, 15], costRange: [1.5, 7] },
    { name: "បញ្ចាំការី", priceRange: [2, 10], costRange: [1, 5] },
    { name: "ការីថ្មី", priceRange: [5, 20], costRange: [2, 10] },
    { name: "បញ្ចាំទឹក", priceRange: [3, 12], costRange: [1.5, 6] },
    { name: "ការីទឹក", priceRange: [2, 8], costRange: [1, 4] },
    { name: "បញ្ចាំអាហារ", priceRange: [4, 15], costRange: [2, 7] },
  ],
  "Clothing": [
    { name: "ខោអាវបុរាណ", priceRange: [10, 40], costRange: [5, 18] },
    { name: "ស្លៀកចំណេីស", priceRange: [8, 30], costRange: [4, 14] },
    { name: "ស្លៀកក្មេង", priceRange: [5, 20], costRange: [2.5, 9] },
    { name: "កាប់សំពត់", priceRange: [3, 12], costRange: [1.5, 5] },
    { name: "ស្រោងជ្រៅ", priceRange: [2, 8], costRange: [1, 3.5] },
    { name: "ក្រណាត់ខោ", priceRange: [4, 15], costRange: [2, 7] },
    { name: "ស្លៀកចាស់", priceRange: [6, 25], costRange: [3, 11] },
    { name: "កាប់ស្តាំ", priceRange: [3, 10], costRange: [1.5, 4.5] },
  ],
}

const BRANCH_PLACEHOLDER = "__BRANCH_"
const PLACEHOLDER_REGEX = /__BRANCH_(\d+)__/

function resolveBranchId(placeholder: string, branchIdMap: Map<string, string>): string {
  const match = placeholder.match(PLACEHOLDER_REGEX)
  if (!match) return placeholder
  const key = `branch_${match[1]}`
  return branchIdMap.get(key) || placeholder
}

function resolvePlaceholders(obj: any, branchIdMap: Map<string, string>): any {
  if (typeof obj === "string") {
    return resolveBranchId(obj, branchIdMap)
  }
  if (Array.isArray(obj)) {
    return obj.map(item => resolvePlaceholders(item, branchIdMap))
  }
  if (obj && typeof obj === "object") {
    const resolved: Record<string, any> = {}
    for (const [key, value] of Object.entries(obj)) {
      resolved[key] = resolvePlaceholders(value, branchIdMap)
    }
    return resolved
  }
  return obj
}

function generateSku(branchIndex: number, categoryIndex: number, productIndex: number): string {
  const branchCode = `B${String(branchIndex + 1).padStart(2, "0")}`
  const catCode = `C${String(categoryIndex + 1).padStart(2, "0")}`
  const prodCode = `P${String(productIndex + 1).padStart(3, "0")}`
  return `${branchCode}-${catCode}-${prodCode}`
}

function generateCategoriesForBranch(branchId: string, branchIndex: number): Array<{ name: string; slug: string; desc: string | null; active: boolean; branchId: string }> {
  const categories: Array<{ name: string; slug: string; desc: string | null; active: boolean; branchId: string }> = []
  const categoryKeys = Object.keys(CATEGORY_NAMES)
  const numCategories = 4 + Math.floor(Math.random() * 3)
  const shuffledKeys = faker.helpers.shuffle(categoryKeys).slice(0, numCategories)

  for (let i = 0; i < shuffledKeys.length; i++) {
    const key = shuffledKeys[i]
    const khmerName = CATEGORY_NAMES[key]
    const baseSlug = key.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `cat-${branchIndex}-${i}`
    categories.push({
      name: khmerName,
      slug: `${baseSlug}-${branchIndex}-${i}`.slice(0, 60) || `cat-${branchIndex}-${i}`,
      desc: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.7 }) || null,
      active: faker.datatype.boolean(0.9),
      branchId,
    })
  }

  return categories
}

function generateProductsForCategory(category: { name: string; slug: string; desc: string | null; active: boolean; branchId: string }, branchIndex: number, categoryIndex: number): Array<{
  name: string
  description: string | null
  price: number
  cost: number
  sku: string
  barcode: string | null
  taxable: boolean
  active: boolean
  categoryId: string
  branchId: string
  initialQuantity: number
  minStock: number
}> {
  const products: any[] = []
  const templates = PRODUCT_TEMPLATES[Object.keys(CATEGORY_NAMES).find(k => CATEGORY_NAMES[k] === category.name) || "Essentials"] || PRODUCT_TEMPLATES["Essentials"]
  const numProducts = 6 + Math.floor(Math.random() * 6)

  for (let i = 0; i < numProducts && i < templates.length; i++) {
    const template = templates[i]
    const price = faker.number.float({ min: template.priceRange[0], max: template.priceRange[1], fractionDigits: 2 })
    const cost = faker.number.float({ min: template.costRange[0], max: template.costRange[1], fractionDigits: 2 })

    products.push({
      name: template.name,
      description: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.6 }) || null,
      price: Math.round(price * 100) / 100,
      cost: Math.round(cost * 100) / 100,
      sku: generateSku(branchIndex, categoryIndex, i),
      barcode: faker.helpers.maybe(() => faker.string.numeric(13), { probability: 0.8 }) || null,
      taxable: faker.datatype.boolean(0.85),
      active: faker.datatype.boolean(0.9),
      categoryId: category.id,
      branchId: category.branchId,
      initialQuantity: faker.number.int({ min: 10, max: 500 }),
      minStock: faker.number.int({ min: 5, max: 50 }),
    })
  }

  return products
}

function generateInventoryForProduct(product: any): { quantity: number; minStock: number; productId: string; branchId: string } {
  return {
    quantity: product.initialQuantity,
    minStock: product.minStock,
    productId: product.id,
    branchId: product.branchId,
  }
}

function generateSalesForBranch(branchId: string, products: any[]): Array<{ receiptNo: string | null; subtotal: number; tax: number; total: number; status: SaleStatus; branchId: string; items: any[] }> {
  const sales: any[] = []
  const numSales = 2 + Math.floor(Math.random() * 5)

  for (let i = 0; i < numSales; i++) {
    const numItems = 1 + Math.floor(Math.random() * 4)
    const shuffledProducts = faker.helpers.shuffle([...products]).slice(0, numItems)
    const items: any[] = []
    let subtotal = 0

    for (const product of shuffledProducts) {
      const quantity = 1 + Math.floor(Math.random() * 5)
      const unitPrice = product.price
      const total = Math.round(unitPrice * quantity * 100) / 100
      subtotal += total

      items.push({
        quantity,
        unitPrice,
        total,
        productId: product.id,
      })
    }

    const taxRate = 0.1
    const tax = Math.round(subtotal * taxRate * 100) / 100
    const total = Math.round((subtotal + tax) * 100) / 100

    sales.push({
      receiptNo: faker.helpers.maybe(() => `RCP-${faker.string.alphanumeric(8).toUpperCase()}`, { probability: 0.9 }) || null,
      subtotal: Math.round(subtotal * 100) / 100,
      tax,
      total,
      status: "COMPLETED",
      branchId,
      items,
    })
  }

  return sales
}

async function seed() {
  console.log("🌱 Starting seed...")

  const branchIdMap = new Map<string, string>()
  const userBranchIdMap = new Map<string, string>()
  const categoryIdMap = new Map<string, string>()
  const productIdMap = new Map<string, string>()

  const rawData = JSON.parse(JSON.stringify(seedData)) as SeedData

  for (const branch of rawData.branches) {
    const created = await prisma.branch.create({
      data: {
        name: branch.name,
        code: branch.code,
        url: branch.url || null,
        adminName: branch.adminName || null,
        adminEmail: branch.adminEmail || null,
        status: branch.status as BranchStatus,
      },
    })
    branchIdMap.set(`branch_${rawData.branches.indexOf(branch) + 1}`, created.id)
    console.log(`  ✅ Created branch: ${created.name} (${created.id})`)
  }

  const resolvedData = resolvePlaceholders(rawData, branchIdMap)

  for (const branch of resolvedData.branches) {
    const branchIndex = resolvedData.branches.indexOf(branch)
    const branchId = branchIdMap.get(`branch_${branchIndex + 1}`) || ""
    branch.id = branchId
  }

  for (const user of resolvedData.users) {
    const created = await prisma.user.create({
      data: {
        name: user.name || null,
        username: user.username,
        email: user.email,
        password: hash(user.password),
        role: user.role,
        branchId: user.branchId || null,
      },
    })
    console.log(`  ✅ Created user: ${created.username} (${created.role})`)
  }

  for (const perm of resolvedData.rolePermissions) {
    await prisma.rolePermission.upsert({
      where: { role_permission: { role: perm.role, permission: perm.permission } },
      create: { role: perm.role, permission: perm.permission, allowed: perm.allowed },
      update: { allowed: perm.allowed },
    })
  }
  console.log(`  ✅ Seeded ${resolvedData.rolePermissions.length} role permissions`)

  const allProductsByBranch = new Map<string, any[]>()

  for (const branch of resolvedData.branches) {
    const branchId = branch.id
    const branchIndex = resolvedData.branches.indexOf(branch)
    const categories = generateCategoriesForBranch(branchId, branchIndex)

    const createdCategories: any[] = []
    for (const category of categories) {
      const created = await prisma.category.create({
        data: {
          name: category.name,
          slug: category.slug,
          desc: category.desc,
          active: category.active,
          branchId: category.branchId,
        },
      })
      createdCategories.push(created)
      console.log(`  ✅ Created category: ${created.name}`)
    }

    const productsForBranch: any[] = []
    for (let catIndex = 0; catIndex < createdCategories.length; catIndex++) {
      const category = createdCategories[catIndex]
      const products = generateProductsForCategory(category, branchIndex, catIndex)

      const createdProducts: any[] = []
      for (const product of products) {
        const created = await prisma.product.create({
          data: {
            name: product.name,
            description: product.description,
            price: product.price,
            cost: product.cost,
            sku: product.sku,
            barcode: product.barcode,
            taxable: product.taxable,
            active: product.active,
            categoryId: product.categoryId,
            branchId: product.branchId,
            inventory: {
              create: {
                quantity: product.initialQuantity,
                minStock: product.minStock,
                productId: product.id,
                branchId: product.branchId,
              },
            },
          },
          include: { inventory: true },
        })
        createdProducts.push(created)
        console.log(`  ✅ Created product: ${created.name} (${created.sku})`)
      }

      productsForBranch.push(...createdProducts)
    }

    allProductsByBranch.set(branchId, productsForBranch)

    const sales = generateSalesForBranch(branchId, productsForBranch)
    for (const sale of sales) {
      const created = await prisma.sale.create({
        data: {
          receiptNo: sale.receiptNo,
          subtotal: sale.subtotal,
          tax: sale.tax,
          total: sale.total,
          status: sale.status,
          branchId: sale.branchId,
          items: {
            create: sale.items.map((item: any) => ({
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total,
              productId: item.productId,
            })),
          },
        },
      })
      console.log(`  ✅ Created sale: ${created.receiptNo || created.id} - $${created.total}`)
    }
  }

  console.log("🎉 Seed completed successfully!")
}

seed()
  .catch((err) => {
    console.error("❌ Seed failed:", err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
