import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function seedLocations() {
  try {
    console.log('🌱 Seeding church locations...\n');

    // Example locations - Replace with actual coordinates
    const locations = [
      {
        name: 'Main Campus Church',
        description: 'University of Nairobi Main Campus',
        latitude: -1.2794,
        longitude: 36.8156,
        radius: 100,
        address: 'University Way, Nairobi',
        isActiveSabbath: true, // Active for Sabbath by default
        isActiveWednesday: false,
        isActiveFriday: false
      },
      {
        name: 'Chiromo Campus',
        description: 'Chiromo Campus Venue',
        latitude: -1.2958,
        longitude: 36.8063,
        radius: 100,
        address: 'Riverside Drive, Nairobi',
        isActiveSabbath: false,
        isActiveWednesday: true, // Active for Wednesday vespers
        isActiveFriday: true      // Active for Friday vespers
      },
      {
        name: 'Off-Campus Hall',
        description: 'Community Hall for Special Services',
        latitude: -1.2921,
        longitude: 36.8219,
        radius: 100,
        address: 'Kenyatta Avenue, Nairobi',
        isActiveSabbath: false,
        isActiveWednesday: false,
        isActiveFriday: false
      }
    ];

    for (const location of locations) {
      const created = await prisma.churchLocation.upsert({
        where: { name: location.name },
        update: location,
        create: location
      });
      console.log(`✅ ${created.name} - ${created.isActiveSabbath || created.isActiveWednesday || created.isActiveFriday ? 'ACTIVE' : 'Saved'}`);
    }

    console.log('\n✅ Locations seeded successfully!');
    console.log('\n⚠️  Please update the coordinates with actual church locations!');
    
  } catch (error) {
    console.error('❌ Error seeding locations:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedLocations();