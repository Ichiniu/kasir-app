import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database for Multi-Tenant (Multi-Outlet)...')

  // 1. Create Outlets
  const mainOutlet = await prisma.outlet.upsert({
    where: { id: 'outlet-main' },
    update: { nama: 'Outlet Pusat (Main Branch)', alamat: 'Jl. Sudirman No. 1, Jakarta Pusat' },
    create: {
      id: 'outlet-main',
      nama: 'Outlet Pusat (Main Branch)',
      alamat: 'Jl. Sudirman No. 1, Jakarta Pusat',
    }
  })

  const branch1Outlet = await prisma.outlet.upsert({
    where: { id: 'outlet-branch-1' },
    update: { nama: 'Outlet Cabang 1 (Branch 1)', alamat: 'Jl. Dago No. 45, Bandung' },
    create: {
      id: 'outlet-branch-1',
      nama: 'Outlet Cabang 1 (Branch 1)',
      alamat: 'Jl. Dago No. 45, Bandung',
    }
  })

  console.log('✅ Outlets created:', mainOutlet.nama, '|', branch1Outlet.nama)

  // 2. Create Superadmin User (Global - No outlet constraint)
  const superadminPassword = await bcrypt.hash('superadmin123', 10)
  const superadmin = await prisma.user.upsert({
    where: { email: 'superadmin@admin.com' },
    update: {
      password: superadminPassword,
      role: 'SUPERADMIN',
      isActive: true,
      outletId: null,
    },
    create: {
      email: 'superadmin@admin.com',
      name: 'Super Admin',
      password: superadminPassword,
      role: 'SUPERADMIN',
      isActive: true,
      outletId: null,
      accounts: {
        create: {
          accountId: 'superadmin@admin.com',
          providerId: 'credential',
          password: superadminPassword,
        }
      }
    }
  })

  await prisma.account.upsert({
    where: { id: 'acc-superadmin' },
    update: { password: superadminPassword },
    create: {
      id: 'acc-superadmin',
      userId: superadmin.id,
      accountId: 'superadmin@admin.com',
      providerId: 'credential',
      password: superadminPassword,
    }
  })
  console.log('✅ Superadmin created:', superadmin.email)

  // 3. Create Admin for Main Outlet
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@admin.com' },
    update: {
      password: adminPassword,
      role: 'ADMIN',
      isActive: true,
      outletId: mainOutlet.id,
    },
    create: {
      email: 'admin@admin.com',
      name: 'Admin Outlet Pusat',
      password: adminPassword,
      role: 'ADMIN',
      isActive: true,
      outletId: mainOutlet.id,
      accounts: {
        create: {
          accountId: 'admin@admin.com',
          providerId: 'credential',
          password: adminPassword,
        }
      }
    }
  })
  console.log('✅ Admin user created:', admin.email, `(${mainOutlet.nama})`)

  // 4. Create Cashier for Branch 1
  const cashierPassword = await bcrypt.hash('kasir123', 10)
  const cashierBranch1 = await prisma.user.upsert({
    where: { email: 'kasir_branch1@kasir.com' },
    update: {
      password: cashierPassword,
      role: 'CASHIER',
      isActive: true,
      outletId: branch1Outlet.id,
    },
    create: {
      email: 'kasir_branch1@kasir.com',
      name: 'Kasir Cabang 1',
      password: cashierPassword,
      role: 'CASHIER',
      isActive: true,
      outletId: branch1Outlet.id,
      accounts: {
        create: {
          accountId: 'kasir_branch1@kasir.com',
          providerId: 'credential',
          password: cashierPassword,
        }
      }
    }
  })
  console.log('✅ Cashier Branch 1 created:', cashierBranch1.email, `(${branch1Outlet.nama})`)

  // Keep legacy cashier account mapped to Main Outlet for backwards compatibility
  const cashierMain = await prisma.user.upsert({
    where: { email: 'kasir@kasir.com' },
    update: {
      password: cashierPassword,
      role: 'CASHIER',
      isActive: true,
      outletId: mainOutlet.id,
    },
    create: {
      email: 'kasir@kasir.com',
      name: 'Kasir Utama',
      password: cashierPassword,
      role: 'CASHIER',
      isActive: true,
      outletId: mainOutlet.id,
      accounts: {
        create: {
          accountId: 'kasir@kasir.com',
          providerId: 'credential',
          password: cashierPassword,
        }
      }
    }
  })
  console.log('✅ Cashier Main Outlet created:', cashierMain.email)

  // 5. Create Categories per Outlet
  // Categories for Main Outlet
  const catMainFood = await prisma.category.upsert({
    where: { id: 'cat-main-1' },
    update: {},
    create: {
      id: 'cat-main-1',
      outletId: mainOutlet.id,
      name: 'Makanan (Pusat)',
      description: 'Menu makanan utama di pusat',
    }
  })

  const catMainDrink = await prisma.category.upsert({
    where: { id: 'cat-main-2' },
    update: {},
    create: {
      id: 'cat-main-2',
      outletId: mainOutlet.id,
      name: 'Minuman (Pusat)',
      description: 'Menu minuman segar di pusat',
    }
  })

  // Categories for Branch 1 Outlet
  const catBranchFood = await prisma.category.upsert({
    where: { id: 'cat-branch1-1' },
    update: {},
    create: {
      id: 'cat-branch1-1',
      outletId: branch1Outlet.id,
      name: 'Makanan (Cabang 1)',
      description: 'Menu makanan khas Cabang 1',
    }
  })

  const catBranchDrink = await prisma.category.upsert({
    where: { id: 'cat-branch1-2' },
    update: {},
    create: {
      id: 'cat-branch1-2',
      outletId: branch1Outlet.id,
      name: 'Minuman (Cabang 1)',
      description: 'Menu minuman Cabang 1',
    }
  })

  console.log('✅ Categories created for both outlets')

  // 6. Create Products per Outlet
  // Main Outlet Products
  const prodMain1 = await prisma.product.upsert({
    where: { outletId_sku: { outletId: mainOutlet.id, sku: 'PRD-001' } },
    update: {},
    create: {
      outletId: mainOutlet.id,
      sku: 'PRD-001',
      name: 'Nasi Goreng Spesial Pusat',
      description: 'Nasi goreng khas outlet pusat',
      price: 30000,
      cost: 18000,
      stock: 50,
      unit: 'Porsi',
      categoryId: catMainFood.id,
    }
  })

  const prodMain2 = await prisma.product.upsert({
    where: { outletId_sku: { outletId: mainOutlet.id, sku: 'PRD-002' } },
    update: {},
    create: {
      outletId: mainOutlet.id,
      sku: 'PRD-002',
      name: 'Es Kopi Susu Pusat',
      description: 'Kopi susu gula aren signature',
      price: 18000,
      cost: 9000,
      stock: 100,
      unit: 'Cup',
      categoryId: catMainDrink.id,
    }
  })

  // Branch 1 Products (using same/different SKUs safely isolated by outletId)
  const prodBranch1 = await prisma.product.upsert({
    where: { outletId_sku: { outletId: branch1Outlet.id, sku: 'PRD-001' } },
    update: {},
    create: {
      outletId: branch1Outlet.id,
      sku: 'PRD-001',
      name: 'Mie Ayam Jamur Cabang 1',
      description: 'Mie ayam jamur gurih khas cabang 1',
      price: 25000,
      cost: 14000,
      stock: 40,
      unit: 'Porsi',
      categoryId: catBranchFood.id,
    }
  })

  const prodBranch2 = await prisma.product.upsert({
    where: { outletId_sku: { outletId: branch1Outlet.id, sku: 'PRD-003' } },
    update: {},
    create: {
      outletId: branch1Outlet.id,
      sku: 'PRD-003',
      name: 'Teh Tarik Bandung',
      description: 'Teh tarik autentik',
      price: 12000,
      cost: 5000,
      stock: 80,
      unit: 'Gelas',
      categoryId: catBranchDrink.id,
    }
  })

  console.log('✅ Products created for Main Outlet and Branch 1')

  // 7. Create Dummy Transaction for Branch 1
  const invNumber = 'INV-20260921-B101'
  await prisma.transaction.upsert({
    where: { invoiceNumber: invNumber },
    update: {},
    create: {
      outletId: branch1Outlet.id,
      invoiceNumber: invNumber,
      totalAmount: 37000,
      discountAmount: 0,
      taxAmount: 0,
      finalAmount: 37000,
      paymentMethod: 'CASH',
      paymentStatus: 'COMPLETED',
      cashReceived: 50000,
      changeAmount: 13000,
      customerName: 'Budi Santoso',
      userId: cashierBranch1.id,
      transactionItems: {
        create: [
          {
            outletId: branch1Outlet.id,
            productId: prodBranch1.id,
            productName: prodBranch1.name,
            quantity: 1,
            price: 25000,
            subtotal: 25000,
          },
          {
            outletId: branch1Outlet.id,
            productId: prodBranch2.id,
            productName: prodBranch2.name,
            quantity: 1,
            price: 12000,
            subtotal: 12000,
          }
        ]
      }
    }
  })
  console.log('✅ Dummy transaction seeded for Branch 1')

  // 8. Settings
  await Promise.all([
    prisma.setting.upsert({
      where: { key: 'store_name' },
      update: {},
      create: { key: 'store_name', value: 'Multi-Outlet POS Chain' }
    }),
    prisma.setting.upsert({
      where: { key: 'tax_rate' },
      update: {},
      create: { key: 'tax_rate', value: '10' }
    })
  ])

  console.log('\n🎉 Multi-Tenant Seeding completed!')
  console.log('==================================================')
  console.log('Kredensial Login Pengujian Multi-Tenant:')
  console.log('1. Superadmin (Akses Global):')
  console.log('   Email: superadmin@admin.com | Password: superadmin123')
  console.log('2. Admin Outlet Pusat (Tied to Outlet Pusat):')
  console.log('   Email: admin@admin.com | Password: admin123')
  console.log('3. Kasir Cabang 1 (Tied to Branch 1):')
  console.log('   Email: kasir_branch1@kasir.com | Password: kasir123')
  console.log('4. Kasir Outlet Pusat:')
  console.log('   Email: kasir@kasir.com | Password: kasir123')
  console.log('==================================================')
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
