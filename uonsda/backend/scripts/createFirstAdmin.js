import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createFirstAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: 'admin@uonsda.com' }
    });

    if (existingAdmin) {
      console.log('⚠️  Admin already exists!');
      console.log('Email:', existingAdmin.email);
      return;
    }

    // Create admin
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    
    const admin = await prisma.admin.create({
      data: {
        firstName: 'Admin',
        lastName: 'UONSDA',
        email: 'admin@uonsda.com',
        password: hashedPassword,
        role: 'ELDER',
        phone: '+254712345678',
        isActive: true
      }
    });

    console.log('\n✅ First admin created successfully!\n');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Password: Admin@123');
    console.log('👤 Role:', admin.role);
    console.log('\n⚠️  IMPORTANT: Please change this password after first login!\n');
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createFirstAdmin();