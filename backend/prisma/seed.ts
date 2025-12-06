import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create depots
  const mainDepot = await prisma.depot.create({
    data: {
      depotName: 'Main Depot',
      location: 'Kochi Metro Depot',
      totalBays: 30,
      maxCapacity: 40,
      bayConfiguration: {
        'B01': { capacity: 1, position: { x: 0, y: 0, z: 0 }, type: 'stabling' },
        'B02': { capacity: 1, position: { x: 50, y: 0, z: 0 }, type: 'stabling' },
        'B03': { capacity: 1, position: { x: 100, y: 0, z: 0 }, type: 'cleaning' },
      },
    },
  });

  console.log('Created depot:', mainDepot.depotName);

  // Create sample trainsets
  const trainsets = [];
  for (let i = 1; i <= 25; i++) {
    const trainNumber = `T${String(i).padStart(3, '0')}`;
    const train = await prisma.trainset.create({
      data: {
        trainNumber,
        carCount: 4,
        currentStatus: i <= 20 ? 'active' : 'standby',
        depotId: mainDepot.id,
        stablingPosition: `B${String(Math.floor((i - 1) / 3) + 1).padStart(2, '0')}`,
        totalMileage: 10000 + (i * 200),
        lastMaintenanceDate: new Date(Date.now() - (i * 7 * 24 * 60 * 60 * 1000)),
      },
    });
    trainsets.push(train);

    // Create fitness certificates
    const departments = ['rolling_stock', 'signalling', 'telecom'];
    for (const dept of departments) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + (30 + Math.floor(Math.random() * 60)));
      
      await prisma.fitnessCertificate.create({
        data: {
          trainId: train.id,
          department: dept,
          certificateNumber: `FC-${dept.toUpperCase()}-2024-${String(i).padStart(3, '0')}`,
          issuedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          expiryDate,
          validityStatus: 'valid',
          issuedBy: `${dept} Department`,
        },
      });
    }

    // Create sample mileage tracking
    await prisma.mileageTracking.create({
      data: {
        trainId: train.id,
        recordedDate: new Date(),
        dailyMileage: 400 + Math.random() * 100,
        cumulativeMileage: Number(train.totalMileage),
        componentType: 'overall',
      },
    });
  }

  console.log(`Created ${trainsets.length} trainsets`);

  // Create sample branding contracts
  for (let i = 1; i <= 10; i++) {
    const train = trainsets[i - 1];
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (30 + Math.floor(Math.random() * 60)));
    
    await prisma.brandingContract.create({
      data: {
        trainId: train.id,
        advertiserName: `Advertiser ${i}`,
        contractNumber: `CONTRACT-2024-${String(i).padStart(3, '0')}`,
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate,
        requiredExposureHours: 500,
        currentExposureHours: 300 + Math.random() * 200,
        priorityScore: Math.floor(Math.random() * 100),
        status: 'active',
      },
    });
  }

  console.log('Created sample branding contracts');

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



