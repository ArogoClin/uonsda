import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function setChurchLocation() {
  try {
    // University of Nairobi Main Campus coordinates (example)
    // Replace with actual UONSDA church coordinates
    const churchLocation = await prisma.churchLocation.create({
      data: {
        name: 'UONSDA Church - Main Campus',
        latitude: -1.2794, // Replace with actual latitude
        longitude: 36.8156, // Replace with actual longitude
        radius: 100, // 100 meters radius
        isActive: true
      }
    });

    console.log('✅ Church location set successfully!');
    console.log('Location:', churchLocation);
    console.log('\n⚠️  Please update the coordinates with the actual church location!');
  } catch (error) {
    console.error('❌ Error setting church location:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setChurchLocation();