require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const email = 'admin@followpro.com';
    const password = 'admin123';
    
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({ where: { email } });
    if (existingAdmin) {
      console.log('Admin user already exists:', email);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    
    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'ADMIN',
        name: 'System Admin',
        verified: true,
        profileCompleted: true,
        skills: ['Project Management', 'System Administration']
      }
    });

    console.log('Admin user created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('User ID:', admin.id);
    
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();