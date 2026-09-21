import prisma from "../src/services/prisma"

async function clear() {
  console.log("🧹 Clearing all data...")

  await prisma.$transaction([
    prisma.saleItem.deleteMany(),
    prisma.sale.deleteMany(),
    prisma.inventoryItem.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
    prisma.user.deleteMany(),
    prisma.branch.deleteMany(),
    prisma.rolePermission.deleteMany(),
  ])

  console.log("✅ All data cleared successfully!")
  await prisma.$disconnect()
}

clear().catch((err) => {
  console.error("❌ Clear failed:", err)
  process.exit(1)
})
