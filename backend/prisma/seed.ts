import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Realistic company/advertiser names
const ADVERTISERS = [
  'Coca-Cola India',
  'PepsiCo',
  'Amazon India',
  'Flipkart',
  'Tata Motors',
  'Reliance Retail',
  'Lulu Mall',
  'Bosch India',
  'Infosys',
  'Wipro',
  'TCS',
  'IBM India',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Kerala Tourism',
  'Cochin Shipyard',
  'Apollo Tyres',
  'Maruti Suzuki',
  'Hyundai India',
];

// Realistic locations
const DEPOT_LOCATIONS = [
  { name: 'Muttom Depot', location: 'Muttom, Kochi', bays: 40, capacity: 50 },
  { name: 'Kalamassery Depot', location: 'Kalamassery, Kochi', bays: 35, capacity: 45 },
  { name: 'Aluva Maintenance Yard', location: 'Aluva, Kochi', bays: 25, capacity: 30 },
  { name: 'Petta Stabling Yard', location: 'Petta, Kochi', bays: 20, capacity: 25 },
];

// Route numbers
const ROUTES = ['R001', 'R002', 'R003', 'R004', 'R005', 'R006', 'R007', 'R008'];

// Event types for emergencies
const EVENT_TYPES = [
  'brake_failure',
  'traction_motor_fault',
  'door_malfunction',
  'air_conditioning_failure',
  'signal_communication_error',
  'power_supply_interruption',
  'pantograph_issue',
  'wheel_bearing_overheat',
];

// Job types
const JOB_TYPES = [
  'preventive_maintenance',
  'corrective_maintenance',
  'overhaul',
  'inspection',
  'repair',
  'calibration',
  'testing',
  'safety_check',
];

// Departments for fitness certificates
const DEPARTMENTS = [
  'rolling_stock',
  'signalling',
  'telecom',
  'electrical',
  'mechanical',
  'safety',
  'environmental',
];

// Status options
const TRAIN_STATUSES = ['active', 'standby', 'maintenance', 'cleaning', 'inspection', 'offline'];
const JOB_STATUSES = ['open', 'in_progress', 'on_hold', 'completed', 'cancelled'];
const PRIORITIES = ['critical', 'high', 'medium', 'low'];
const BRANDING_STATUSES = ['active', 'pending', 'completed', 'cancelled'];
const CLEANING_STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled'];
const DECISION_TYPES = ['induction', 'withdrawal', 'replacement', 'standby_activation'];

function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDecimal(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomPastDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

function randomFutureDate(daysAhead: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date;
}

async function main() {
  console.log('🌱 Starting comprehensive database seeding...');

  // Clear existing data (in reverse order of dependencies)
  console.log('🗑️  Clearing existing data...');
  await prisma.learningFeedback.deleteMany();
  await prisma.decisionHistory.deleteMany();
  await prisma.emergencyPlan.deleteMany();
  await prisma.emergencyLog.deleteMany();
  await prisma.conflictAlert.deleteMany();
  await prisma.inductionDecision.deleteMany();
  await prisma.routeAssignment.deleteMany();
  await prisma.stablingGeometry.deleteMany();
  await prisma.cleaningSlot.deleteMany();
  await prisma.mileageTracking.deleteMany();
  await prisma.brandingContract.deleteMany();
  await prisma.jobCard.deleteMany();
  await prisma.fitnessCertificate.deleteMany();
  await prisma.trainset.deleteMany();
  await prisma.crisisMode.deleteMany();
  await prisma.depot.deleteMany();

  // 1. Create Depots
  console.log('📦 Creating depots...');
  const depots = [];
  for (const depotInfo of DEPOT_LOCATIONS) {
    const bayConfig: Record<string, any> = {};
    for (let i = 1; i <= depotInfo.bays; i++) {
      const bayType = i % 3 === 0 ? 'cleaning' : 'stabling';
      bayConfig[`B${String(i).padStart(2, '0')}`] = {
        capacity: 1,
        position: {
          x: ((i - 1) % 10) * 50,
          y: Math.floor((i - 1) / 10) * 100,
          z: 0,
        },
        type: bayType,
      };
    }

    const depot = await prisma.depot.create({
      data: {
        depotName: depotInfo.name,
        location: depotInfo.location,
        totalBays: depotInfo.bays,
        maxCapacity: depotInfo.capacity,
        bayConfiguration: bayConfig,
        activeTrainsets: 0,
      },
    });
    depots.push(depot);
    console.log(`  ✓ Created depot: ${depot.depotName}`);
  }

  // 2. Create Trainsets (75 trains)
  console.log('🚆 Creating trainsets...');
  const trainsets = [];
  const trainStatusDistribution = {
    active: 45,
    standby: 15,
    maintenance: 8,
    cleaning: 4,
    inspection: 2,
    offline: 1,
  };

  let statusIndex = 0;
  const statusArray = Object.entries(trainStatusDistribution).flatMap(([status, count]) =>
    Array(count).fill(status)
  );

  for (let i = 1; i <= 75; i++) {
    const trainNumber = `T${String(i).padStart(3, '0')}`;
    const depot = depots[i % depots.length];
    const currentStatus = statusArray[statusIndex % statusArray.length];
    statusIndex++;

    const baseMileage = randomInt(5000, 150000);
    const daysSinceMaintenance = randomInt(0, 90);
    const lastMaintenanceDate = randomPastDate(daysSinceMaintenance);

    const train = await prisma.trainset.create({
      data: {
        trainNumber,
        carCount: 4,
        currentStatus,
        depotId: depot.id,
        stablingPosition: `B${String((i % depot.totalBays) + 1).padStart(2, '0')}`,
        totalMileage: baseMileage,
        lastMaintenanceDate,
      },
    });
    trainsets.push(train);
  }

  // Update depot active trainsets count
  for (const depot of depots) {
    const activeCount = trainsets.filter(
      (t) => t.depotId === depot.id && t.currentStatus === 'active'
    ).length;
    await prisma.depot.update({
      where: { id: depot.id },
      data: { activeTrainsets: activeCount },
    });
  }

  console.log(`  ✓ Created ${trainsets.length} trainsets`);

  // 3. Create Fitness Certificates
  console.log('📜 Creating fitness certificates...');
  let fitnessCount = 0;
  const fitnessData: any[] = [];

  for (const train of trainsets) {
    // Each train gets certificates from 3-5 departments
    const numCertificates = randomInt(3, 5);
    const selectedDepts = DEPARTMENTS.sort(() => 0.5 - Math.random()).slice(0, numCertificates);

    for (const dept of selectedDepts) {
      const issuedDate = randomPastDate(randomInt(15, 180));
      const validityDays = randomInt(30, 365);
      const expiryDate = new Date(issuedDate);
      expiryDate.setDate(expiryDate.getDate() + validityDays);

      const validityStatus =
        expiryDate > new Date()
          ? randomItem(['valid', 'valid', 'valid', 'expiring_soon'])
          : 'expired';

      fitnessData.push({
        trainId: train.id,
        department: dept,
        certificateNumber: `FC-${dept.toUpperCase()}-${train.trainNumber}-${Date.now()}-${fitnessCount}`,
        issuedDate,
        expiryDate,
        validityStatus,
        issuedBy: `${dept.replace('_', ' ').toUpperCase()} Department Head`,
        notes: validityStatus === 'expiring_soon' ? 'Renewal required within 30 days' : null,
      });
      fitnessCount++;
    }

    // Batch insert every 100 records
    if (fitnessData.length >= 100) {
      await prisma.fitnessCertificate.createMany({ data: fitnessData });
      fitnessData.length = 0;
    }
  }

  // Insert remaining records
  if (fitnessData.length > 0) {
    await prisma.fitnessCertificate.createMany({ data: fitnessData });
  }
  console.log(`  ✓ Created ${fitnessCount} fitness certificates`);

  // 4. Create Job Cards
  console.log('📋 Creating job cards...');
  let jobCardCount = 0;
  const jobCardData: any[] = [];

  for (const train of trainsets) {
    // Each train gets 1-4 job cards
    const numJobCards = randomInt(1, 4);
    for (let j = 0; j < numJobCards; j++) {
      const jobType = randomItem(JOB_TYPES);
      const status = randomItem(JOB_STATUSES);
      const priority = randomItem(PRIORITIES);
      const openedDate = randomPastDate(randomInt(1, 60));
      const maximoJobNumber = `MX-${train.trainNumber}-${randomInt(1000, 9999)}`;

      let closedDate: Date | null = null;
      let actualCompletionDate: Date | null = null;
      if (status === 'completed') {
        closedDate = randomDate(openedDate, new Date());
        actualCompletionDate = closedDate;
      }

      const estimatedCompletionDate =
        status === 'open' || status === 'in_progress'
          ? randomFutureDate(randomInt(1, 30))
          : null;

      jobCardData.push({
        trainId: train.id,
        maximoJobNumber,
        jobType,
        priority,
        status,
        description: `${jobType.replace('_', ' ')} for ${train.trainNumber} - ${priority} priority`,
        assignedTo: `Technician ${randomInt(1, 50)}`,
        openedDate,
        closedDate,
        estimatedCompletionDate,
        actualCompletionDate,
      });
      jobCardCount++;
    }

    // Batch insert every 100 records
    if (jobCardData.length >= 100) {
      await prisma.jobCard.createMany({ data: jobCardData });
      jobCardData.length = 0;
    }
  }

  // Insert remaining records
  if (jobCardData.length > 0) {
    await prisma.jobCard.createMany({ data: jobCardData });
  }
  console.log(`  ✓ Created ${jobCardCount} job cards`);

  // 5. Create Branding Contracts
  console.log('📢 Creating branding contracts...');
  let contractCount = 0;
  const activeTrains = trainsets.filter((t) => t.currentStatus === 'active');
  const trainsWithContracts = activeTrains.sort(() => 0.5 - Math.random()).slice(0, 35);

  for (const train of trainsWithContracts) {
    const advertiserName = randomItem(ADVERTISERS);
    const startDate = randomPastDate(randomInt(10, 180));
    const contractDuration = randomInt(30, 365);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + contractDuration);

    const requiredHours = randomInt(200, 1000);
    const currentHours =
      endDate > new Date()
        ? randomDecimal(0, requiredHours * 0.9)
        : randomDecimal(requiredHours * 0.7, requiredHours * 1.1);

    const status =
      endDate < new Date()
        ? randomItem(['completed', 'completed', 'completed', 'cancelled'])
        : randomItem(['active', 'active', 'active', 'pending']);

    const priorityScore =
      status === 'active' && currentHours < requiredHours * 0.7
        ? randomInt(70, 100)
        : randomInt(0, 100);

    const penaltyAmount =
      status === 'active' && currentHours < requiredHours * 0.5 && endDate > new Date()
        ? randomDecimal(50000, 500000)
        : null;

    await prisma.brandingContract.create({
      data: {
        trainId: train.id,
        advertiserName,
        contractNumber: `CONTRACT-${advertiserName.toUpperCase().replace(/\s/g, '-')}-${randomInt(2023, 2024)}-${String(contractCount + 1).padStart(4, '0')}`,
        startDate,
        endDate,
        requiredExposureHours: requiredHours,
        currentExposureHours: currentHours,
        priorityScore,
        penaltyAmount,
        status,
      },
    });
    contractCount++;
  }
  console.log(`  ✓ Created ${contractCount} branding contracts`);

  // 6. Create Mileage Tracking (Historical data for last 30 days, sampled)
  console.log('📊 Creating mileage tracking data...');
  let mileageCount = 0;
  const today = new Date();
  const mileageData: any[] = [];

  for (const train of trainsets) {
    // Generate daily mileage tracking for last 30 days (sampled - not every day)
    let cumulativeMileage = Number(train.totalMileage) - randomInt(10000, 15000);
    const componentTypes = ['overall', 'traction_motor', 'brake_system', 'bogie', 'pantograph'];

    // Sample 15-20 days out of 30 to reduce data volume
    for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
      // Sample only about 60% of days
      if (Math.random() > 0.4) {
        const recordedDate = new Date(today);
        recordedDate.setDate(recordedDate.getDate() - daysAgo);

        const dailyMileage = randomDecimal(300, 600);
        cumulativeMileage += dailyMileage;

        const componentType =
          daysAgo % 10 === 0 ? randomItem(componentTypes) : 'overall';

        const wearIndicator =
          componentType !== 'overall' ? randomDecimal(0.1, 0.95) : null;

        const maintenanceThreshold =
          componentType !== 'overall' ? randomDecimal(50000, 200000) : null;

        mileageData.push({
          trainId: train.id,
          recordedDate,
          dailyMileage,
          cumulativeMileage: cumulativeMileage,
          componentType: componentType === 'overall' ? null : componentType,
          wearIndicator,
          maintenanceThreshold,
        });
        mileageCount++;

        // Batch insert every 500 records
        if (mileageData.length >= 500) {
          await prisma.mileageTracking.createMany({ data: mileageData });
          mileageData.length = 0;
          process.stdout.write(`\r  Progress: ${mileageCount} records created...`);
        }
      }
    }
  }

  // Insert remaining records
  if (mileageData.length > 0) {
    await prisma.mileageTracking.createMany({ data: mileageData });
  }
  console.log(`\r  ✓ Created ${mileageCount} mileage tracking records`);

  // 7. Create Cleaning Slots (for next 30 days)
  console.log('🧹 Creating cleaning slots...');
  let cleaningCount = 0;
  const cleaningData: any[] = [];

  for (const train of trainsets) {
    // Each train gets 4-8 cleaning slots over next 30 days
    const numSlots = randomInt(4, 8);
    const slotDates = new Set<string>();

    for (let i = 0; i < numSlots; i++) {
      const daysAhead = randomInt(1, 30);
      const slotDate = new Date(today);
      slotDate.setDate(slotDate.getDate() + daysAhead);
      const dateKey = slotDate.toISOString().split('T')[0];

      if (!slotDates.has(dateKey)) {
        slotDates.add(dateKey);
        const slotTime = new Date(slotDate);
        slotTime.setHours(randomInt(6, 22), randomInt(0, 59), 0, 0);

        const status =
          daysAhead <= 2 ? randomItem(['scheduled', 'in_progress']) : 'scheduled';

        const cleaningType = randomItem([
          'deep_cleaning',
          'regular_cleaning',
          'sanitization',
          'detailing',
        ]);

        const depot = depots.find((d) => d.id === train.depotId);
        const bayNumber = `B${String(randomInt(1, depot?.totalBays || 30)).padStart(2, '0')}`;

        cleaningData.push({
          trainId: train.id,
          slotDate,
          slotTime,
          durationMinutes: cleaningType === 'deep_cleaning' ? 240 : 120,
          bayNumber,
          manpowerAssigned: randomInt(2, 6),
          manpowerRequired: cleaningType === 'deep_cleaning' ? 4 : 2,
          status,
          cleaningType,
        });
        cleaningCount++;
      }
    }

    // Batch insert every 100 records
    if (cleaningData.length >= 100) {
      await prisma.cleaningSlot.createMany({ data: cleaningData });
      cleaningData.length = 0;
    }
  }

  // Insert remaining records
  if (cleaningData.length > 0) {
    await prisma.cleaningSlot.createMany({ data: cleaningData });
  }
  console.log(`  ✓ Created ${cleaningCount} cleaning slots`);

  // 8. Create Stabling Geometry
  console.log('📍 Creating stabling geometry...');
  let stablingCount = 0;
  const stablingData: any[] = [];

  for (const train of trainsets) {
    if (train.depotId) {
      const depot = depots.find((d) => d.id === train.depotId);
      const bayNumber = train.stablingPosition || `B${String(randomInt(1, depot?.totalBays || 30)).padStart(2, '0')}`;

      stablingData.push({
        trainId: train.id,
        depotId: train.depotId,
        bayNumber,
        positionX: randomDecimal(0, 1000),
        positionY: randomDecimal(0, 2000),
        positionZ: 0,
        shuntingDistance: randomDecimal(50, 500),
        shuntingTimeMinutes: randomInt(5, 30),
        assignedDate: randomPastDate(randomInt(0, 30)),
        isOptimal: Math.random() > 0.3,
      });
      stablingCount++;
    }
  }

  // Batch insert all stabling geometry
  if (stablingData.length > 0) {
    await prisma.stablingGeometry.createMany({ data: stablingData });
  }
  console.log(`  ✓ Created ${stablingCount} stabling geometry records`);

  // 9. Create Induction Decisions
  console.log('🎯 Creating induction decisions...');
  const decisions = [];
  const decisionDate = new Date();
  decisionDate.setDate(decisionDate.getDate() - 1);

  for (let i = 0; i < 50; i++) {
    const decisionType = randomItem(DECISION_TYPES);
    const train = randomItem(trainsets);
    const decisionTime = new Date(decisionDate);
    decisionTime.setHours(randomInt(6, 22), randomInt(0, 59), 0, 0);

    const decision = await prisma.inductionDecision.create({
      data: {
        decisionDate,
        decisionTime,
        decisionType,
        trainId: decisionType === 'withdrawal' ? null : train.id,
        decisionScore: randomDecimal(60, 95),
        reasoningSummary: `${decisionType} decision for ${train?.trainNumber || 'system'} - Score: ${randomDecimal(60, 95).toFixed(2)}`,
        reasoningDetails: {
          factors: [
            { name: 'fitness_status', value: randomItem(['good', 'fair', 'excellent']) },
            { name: 'mileage', value: Number(train?.totalMileage || 0) },
            { name: 'maintenance_due', value: Math.random() > 0.5 },
          ],
        },
        conflictsDetected: Math.random() > 0.7 ? [{ type: 'scheduling', severity: 'medium' }] : null,
        createdBy: `Agent-${randomInt(1, 10)}`,
        isOverride: Math.random() > 0.9,
        overrideReason:
          Math.random() > 0.9 ? 'Manual override due to operational requirements' : null,
      },
    });
    decisions.push(decision);
  }
  console.log(`  ✓ Created ${decisions.length} induction decisions`);

  // 10. Create Decision History
  console.log('📚 Creating decision history...');
  let historyCount = 0;
  for (const decision of decisions.slice(0, 30)) {
    // Only create history for older decisions
    if (decision.trainId) {
      await prisma.decisionHistory.create({
        data: {
          decisionId: decision.id,
          trainId: decision.trainId,
          outcomeStatus: randomItem(['successful', 'successful', 'successful', 'partial', 'failed']),
          punctualityImpact: randomDecimal(-5, 5),
          actualMileage: randomDecimal(400, 650),
          issuesEncountered:
            Math.random() > 0.7
              ? 'Minor delay during deployment, resolved within 15 minutes'
              : null,
          feedbackScore: randomInt(1, 10),
          feedbackNotes:
            Math.random() > 0.5
              ? 'Decision performed as expected with minimal disruptions'
              : null,
        },
      });
      historyCount++;
    }
  }
  console.log(`  ✓ Created ${historyCount} decision history records`);

  // 11. Create Conflict Alerts
  console.log('⚠️  Creating conflict alerts...');
  let conflictCount = 0;
  const conflictTypes = [
    'schedule_conflict',
    'resource_overlap',
    'maintenance_overlap',
    'cleaning_schedule_conflict',
    'stabling_space_conflict',
  ];

  for (let i = 0; i < 25; i++) {
    const train = randomItem(trainsets);
    const conflictType = randomItem(conflictTypes);
    const severity = randomItem(['low', 'medium', 'medium', 'high', 'critical']);
    const status = Math.random() > 0.6 ? 'active' : 'resolved';

    const alert = await prisma.conflictAlert.create({
      data: {
        trainId: train.id,
        conflictType,
        severity,
        description: `${conflictType.replace('_', ' ')} detected for ${train.trainNumber}`,
        suggestedResolution: `Review and reschedule conflicting activities for ${train.trainNumber}`,
        detectedAt: randomPastDate(randomInt(0, 7)),
        resolvedAt: status === 'resolved' ? new Date() : null,
        status,
      },
    });
    conflictCount++;
  }
  console.log(`  ✓ Created ${conflictCount} conflict alerts`);

  // 12. Create Learning Feedback
  console.log('🧠 Creating learning feedback...');
  let feedbackCount = 0;
  for (const decision of decisions.slice(0, 20)) {
    await prisma.learningFeedback.create({
      data: {
        decisionId: decision.id,
        featureVector: {
          mileage: randomInt(5000, 150000),
          fitness_score: randomDecimal(0.7, 1.0),
          maintenance_due: Math.random() > 0.5,
          job_cards_pending: randomInt(0, 5),
        },
        predictedOutcome: {
          success_probability: randomDecimal(0.6, 0.95),
          expected_delay: randomDecimal(0, 10),
        },
        actualOutcome: {
          success: Math.random() > 0.2,
          delay: randomDecimal(0, 15),
        },
        accuracyScore: randomDecimal(70, 95),
        modelVersion: `v${randomInt(1, 3)}.${randomInt(0, 9)}.${randomInt(0, 9)}`,
      },
    });
    feedbackCount++;
  }
  console.log(`  ✓ Created ${feedbackCount} learning feedback records`);

  // 13. Create Emergency Logs
  console.log('🚨 Creating emergency logs...');
  const emergencyLogs = [];
  for (let i = 0; i < 15; i++) {
    const train = randomItem(trainsets);
    const eventType = randomItem(EVENT_TYPES);
    const severity = randomItem(['low', 'medium', 'high', 'critical']);
    const status = Math.random() > 0.4 ? 'active' : 'resolved';

    const locations = [
      'Aluva Station',
      'Kalamassery Station',
      'Edapally Station',
      'Cochin University Station',
      'Pathadipalam Station',
      'Kaloor Station',
      'Town Hall Station',
      'Muttom Depot',
    ];

    const emergencyLog = await prisma.emergencyLog.create({
      data: {
        trainId: train.id,
        eventType,
        timestamp: randomPastDate(randomInt(0, 7)),
        location: randomItem(locations),
        faultCode: `FAULT-${eventType.toUpperCase()}-${randomInt(100, 999)}`,
        severity,
        passengersOnboard: severity === 'critical' ? randomInt(100, 500) : randomInt(0, 200),
        immediateActionRequired:
          severity === 'critical' || severity === 'high'
            ? randomItem(['immediate_withdrawal', 'emergency_repair', 'evacuation'])
            : null,
        routeAffected: randomItem(ROUTES),
        status,
        resolvedAt: status === 'resolved' ? new Date() : null,
        resolutionNotes:
          status === 'resolved'
            ? 'Emergency resolved successfully with minimal service disruption'
            : null,
      },
    });
    emergencyLogs.push(emergencyLog);
  }
  console.log(`  ✓ Created ${emergencyLogs.length} emergency logs`);

  // 14. Create Emergency Plans
  console.log('📋 Creating emergency plans...');
  let planCount = 0;
  for (const emergencyLog of emergencyLogs) {
    if (emergencyLog.severity === 'critical' || emergencyLog.severity === 'high') {
      const withdrawnTrain = randomItem(trainsets.filter((t) => t.id === emergencyLog.trainId));
      const replacementTrains = trainsets.filter(
        (t) =>
          t.id !== emergencyLog.trainId &&
          t.currentStatus === 'standby' &&
          t.depotId === withdrawnTrain?.depotId
      );

      if (replacementTrains.length > 0) {
        const replacementTrain = randomItem(replacementTrains);
        const planType = randomItem(['immediate_replacement', 'scheduled_replacement']);

        await prisma.emergencyPlan.create({
          data: {
            emergencyLogId: emergencyLog.id,
            planType,
            withdrawnTrainId: withdrawnTrain?.id,
            replacementTrainId: replacementTrain.id,
            deploymentTimeMinutes: randomInt(15, 60),
            routeAssignment: emergencyLog.routeAffected || randomItem(ROUTES),
            confidenceScore: randomDecimal(75, 95),
            reasoning: {
              reason: 'High confidence replacement plan',
              factors: ['train_availability', 'route_compatibility', 'depot_proximity'],
            },
            executionSteps: [
              { step: 1, action: 'Withdraw affected train', duration: 10 },
              { step: 2, action: 'Deploy replacement train', duration: 20 },
              { step: 3, action: 'Resume service', duration: 5 },
            ],
            impactMitigation: {
              service_disruption: 'minimal',
              passenger_impact: 'low',
              estimated_delay: randomInt(15, 45),
            },
            fallbackOptions: [
              { option: 'Alternative route', confidence: 0.8 },
              { option: 'Standby train from different depot', confidence: 0.6 },
            ],
            status: Math.random() > 0.5 ? 'approved' : 'pending',
            approvedBy: Math.random() > 0.5 ? `Manager-${randomInt(1, 5)}` : null,
            approvedAt:
              Math.random() > 0.5 ? randomPastDate(randomInt(0, 2)) : null,
          },
        });
        planCount++;
      }
    }
  }
  console.log(`  ✓ Created ${planCount} emergency plans`);

  // 15. Create Crisis Mode
  console.log('🔥 Creating crisis mode entries...');
  if (emergencyLogs.filter((e) => e.severity === 'critical').length >= 3) {
    await prisma.crisisMode.create({
      data: {
        crisisId: `CRISIS-${Date.now()}`,
        activatedAt: randomPastDate(randomInt(0, 3)),
        withdrawalCount: randomInt(3, 8),
        affectedRoutes: ROUTES.slice(0, randomInt(2, 5)),
        serviceDeficit: randomInt(10, 40),
        actions: {
          immediate: ['Activate standby fleet', 'Notify management', 'Alert passengers'],
          short_term: ['Deploy replacement trains', 'Adjust schedule'],
        },
        projectedRecoveryTime: randomFutureDate(randomInt(2, 6)),
        status: Math.random() > 0.3 ? 'active' : 'resolved',
        managementNotified: true,
        publicCommunicated: Math.random() > 0.5,
      },
    });
    console.log('  ✓ Created crisis mode entry');
  }

  // 16. Create Route Assignments
  console.log('🗺️  Creating route assignments...');
  let routeCount = 0;
  const activeTrainsForRoutes = trainsets.filter((t) => t.currentStatus === 'active');

  for (const train of activeTrainsForRoutes.slice(0, 40)) {
    const assignmentType = randomItem(['revenue', 'revenue', 'revenue', 'standby', 'reassigned']);
    const assignedDate = randomPastDate(randomInt(0, 30));
    const assignedTime = new Date(assignedDate);
    assignedTime.setHours(randomInt(5, 23), randomInt(0, 59), 0, 0);

    const status = assignedDate.getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000 
      ? randomItem(['active', 'active', 'completed']) 
      : 'active';

    await prisma.routeAssignment.create({
      data: {
        trainId: train.id,
        routeNumber: randomItem(ROUTES),
        assignmentType,
        assignedDate,
        assignedTime,
        frequencyMinutes: assignmentType === 'revenue' ? randomInt(5, 15) : null,
        priority: assignmentType === 'revenue' ? 'high' : randomItem(PRIORITIES),
        status,
        endedAt: status === 'completed' ? randomDate(assignedDate, new Date()) : null,
        notes:
          assignmentType === 'reassigned'
            ? 'Reassigned due to operational requirements'
            : null,
      },
    });
    routeCount++;
  }
  console.log(`  ✓ Created ${routeCount} route assignments`);

  console.log('\n✅ Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Depots: ${depots.length}`);
  console.log(`   - Trainsets: ${trainsets.length}`);
  console.log(`   - Fitness Certificates: ${fitnessCount}`);
  console.log(`   - Job Cards: ${jobCardCount}`);
  console.log(`   - Branding Contracts: ${contractCount}`);
  console.log(`   - Mileage Tracking Records: ${mileageCount}`);
  console.log(`   - Cleaning Slots: ${cleaningCount}`);
  console.log(`   - Stabling Geometry: ${stablingCount}`);
  console.log(`   - Induction Decisions: ${decisions.length}`);
  console.log(`   - Decision History: ${historyCount}`);
  console.log(`   - Conflict Alerts: ${conflictCount}`);
  console.log(`   - Learning Feedback: ${feedbackCount}`);
  console.log(`   - Emergency Logs: ${emergencyLogs.length}`);
  console.log(`   - Emergency Plans: ${planCount}`);
  console.log(`   - Route Assignments: ${routeCount}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });