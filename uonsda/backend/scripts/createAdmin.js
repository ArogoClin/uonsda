import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createFirstAdmin() {
  try {
    console.log('🔍 Checking for existing admin...');
    
    // Check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: 'elder@uonsda.com' }
    });

    if (existingAdmin) {
      console.log('⚠️  Admin already exists!');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      console.log('\n❓ Do you want to reset the password? (This will set it to: admin123)');
      console.log('   Run this script with --reset flag to reset password');
      
      // Check if reset flag is passed
      if (process.argv.includes('--reset')) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        await prisma.admin.update({
          where: { email: 'elder@uonsda.com' },
          data: { 
            password: hashedPassword,
            isActive: true 
          }
        });
        
        console.log('✅ Password reset successfully!');
        console.log('Email: elder@uonsda.com');
        console.log('Password: admin123');
      }
      
      return;
    }

    console.log('📝 Creating first admin...');
    
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Create admin
    const admin = await prisma.admin.create({
      data: {
        firstName: 'Church',
        lastName: 'Elder',
        email: 'elder@uonsda.com',
        password: hashedPassword,
        role: 'ELDER',
        phone: '+254712345678',
        isActive: true
      }
    });

    console.log('✅ First admin created successfully!');
    console.log('=================================');
    console.log('Email:', admin.email);
    console.log('Password: admin123');
    console.log('Role:', admin.role);
    console.log('=================================');
    console.log('\n⚠️  Please change the password after first login!');
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createFirstAdmin();