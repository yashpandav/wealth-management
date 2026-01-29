/**
 * Prisma Database Seed Script
 * Populates development database with realistic test data
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data in correct order (respecting foreign keys)
  console.log('📝 Clearing existing data...');
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.payout.deleteMany(); // Delete payouts before schedules
  await prisma.payoutSchedule.deleteMany(); // Delete schedules before purchase requests
  await prisma.productPurchaseRequest.deleteMany();
  await prisma.investmentOption.deleteMany();
  await prisma.investment.deleteMany();
  await prisma.userLead.deleteMany();
  await prisma.document.deleteMany(); // Delete documents before clients
  await prisma.client.deleteMany();
  await prisma.relationshipManager.deleteMany();
  await prisma.user.deleteMany();

  // Hash password for all users (password: "Password123!")
  const hashedPassword = await bcrypt.hash('Password123!', 12);

  // ========================================
  // USERS
  // ========================================
  console.log('👤 Creating users...');

  // Admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@wealthcrm.com',
      password: hashedPassword,
      role: 'ADMIN',
      firstName: 'Admin',
      lastName: 'User',
      phone: '+1234567890',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  // DocAdmin user (Document Administrator for KYC verification)
  await prisma.user.create({
    data: {
      email: 'docadmin@wealthcrm.com',
      password: hashedPassword,
      role: 'DOCADMIN',
      firstName: 'Document',
      lastName: 'Admin',
      phone: '+1234567899',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  // Relationship Managers
  const rm1User = await prisma.user.create({
    data: {
      email: 'john.smith@wealthcrm.com',
      password: hashedPassword,
      role: 'RM',
      firstName: 'John',
      lastName: 'Smith',
      phone: '+1234567891',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  const rm2User = await prisma.user.create({
    data: {
      email: 'sarah.johnson@wealthcrm.com',
      password: hashedPassword,
      role: 'RM',
      firstName: 'Sarah',
      lastName: 'Johnson',
      phone: '+1234567892',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  // Client users
  const client1User = await prisma.user.create({
    data: {
      email: 'alice.williams@example.com',
      password: hashedPassword,
      role: 'CLIENT',
      firstName: 'Alice',
      lastName: 'Williams',
      phone: '+1234567893',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  const client2User = await prisma.user.create({
    data: {
      email: 'bob.davis@example.com',
      password: hashedPassword,
      role: 'CLIENT',
      firstName: 'Bob',
      lastName: 'Davis',
      phone: '+1234567894',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  const client3User = await prisma.user.create({
    data: {
      email: 'carol.martinez@example.com',
      password: hashedPassword,
      role: 'CLIENT',
      firstName: 'Carol',
      lastName: 'Martinez',
      phone: '+1234567895',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  console.log('✅ Created 7 base users (1 admin, 1 docadmin, 2 RMs, 3 clients)');

  // ========================================
  // RELATIONSHIP MANAGERS
  // ========================================
  console.log('👔 Creating relationship managers...');

  const rm1 = await prisma.relationshipManager.create({
    data: {
      userId: rm1User.id,
      specialization: 'High Net Worth',
      certifications: JSON.stringify(['CFP', 'CFA Level II']),
      maxClientLimit: 50,
      totalAUM: 5000000,
    },
  });

  const rm2 = await prisma.relationshipManager.create({
    data: {
      userId: rm2User.id,
      specialization: 'Retirement Planning',
      certifications: JSON.stringify(['CFP', 'RICP']),
      maxClientLimit: 40,
      totalAUM: 3500000,
    },
  });

  console.log('✅ Created 2 RMs');

  // ========================================
  // CLIENTS
  // ========================================
  console.log('👥 Creating clients...');

  const client1 = await prisma.client.create({
    data: {
      userId: client1User.id,
      assignedRMId: rm1.id,
      riskTolerance: 'HIGH',
      investmentGoals: 'Aggressive growth, tech sector focus',
      kycVerified: true,
      kycDocuments: JSON.stringify(['/docs/kyc-alice-1.pdf', '/docs/kyc-alice-2.pdf']),
    },
  });

  await prisma.client.create({
    data: {
      userId: client2User.id,
      assignedRMId: rm1.id,
      riskTolerance: 'MEDIUM',
      investmentGoals: 'Balanced growth with dividend income',
      kycVerified: true,
      kycDocuments: JSON.stringify(['/docs/kyc-bob-1.pdf']),
    },
  });

  await prisma.client.create({
    data: {
      userId: client3User.id,
      assignedRMId: rm2.id,
      riskTolerance: 'LOW',
      investmentGoals: 'Capital preservation and steady income',
      kycVerified: true,
      kycDocuments: JSON.stringify(['/docs/kyc-carol-1.pdf']),
    },
  });

  console.log('✅ Created 3 clients');

  // ========================================
  // TEST USERS FOR EMAIL CRON JOBS
  // ========================================
  console.log('📧 Creating test users for email cron jobs...');

  // Calculate test dates for cron matching
  // CRITICAL: Cron queries check: createdAt >= (N+1 days ago 00:00) AND < (N days ago 00:00)
  // Example for Day 7: createdAt >= (8 days ago 00:00) AND < (7 days ago 00:00)
  // This means we need to create users at noon on day 7-8 (the EARLIER boundary)

  const now = new Date();

  // Day 3 cron looks for: createdAt >= (4 days ago 00:00) AND < (3 days ago 00:00)
  // So create user at noon 3.5 days ago (between the boundaries)
  const day3TestDate = new Date();
  day3TestDate.setDate(day3TestDate.getDate() - 4); // Go back 4 days
  day3TestDate.setHours(12, 0, 0, 0); // Set to noon (middle of the 24hr window)

  // Day 6 cron looks for: createdAt >= (7 days ago 00:00) AND < (6 days ago 00:00)
  const day6TestDate = new Date();
  day6TestDate.setDate(day6TestDate.getDate() - 7); // Go back 7 days
  day6TestDate.setHours(12, 0, 0, 0); // Set to noon

  // Day 7 cron looks for: createdAt >= (8 days ago 00:00) AND < (7 days ago 00:00)
  const day7TestDate = new Date();
  day7TestDate.setDate(day7TestDate.getDate() - 8); // Go back 8 days
  day7TestDate.setHours(12, 0, 0, 0); // Set to noon

  // Already archived user (created 9 days ago, archived 8 days ago)
  const day8TestDate = new Date();
  day8TestDate.setDate(day8TestDate.getDate() - 9);
  day8TestDate.setHours(12, 0, 0, 0);

  // Test User 1: Day 3 Reminder (created 3 days ago, should receive Day 3 KYC reminder)
  const testUser1 = await prisma.user.create({
    data: {
      email: 'test.day3@example.com',
      password: hashedPassword,
      role: 'CLIENT',
      firstName: 'TestDay3',
      lastName: 'User',
      phone: '+1234567896',
      status: 'ACTIVE',
      emailVerified: true,
      createdAt: day3TestDate,
    },
  });

  await prisma.client.create({
    data: {
      userId: testUser1.id,
      verificationStatus: 'NOT_SUBMITTED',
      kycVerified: false,
    },
  });

  // Test User 2: Day 6 Warning (created 6 days ago, should receive Day 6 KYC warning)
  const testUser2 = await prisma.user.create({
    data: {
      email: 'test.day6@example.com',
      password: hashedPassword,
      role: 'CLIENT',
      firstName: 'TestDay6',
      lastName: 'User',
      phone: '+1234567897',
      status: 'ACTIVE',
      emailVerified: true,
      createdAt: day6TestDate,
    },
  });

  await prisma.client.create({
    data: {
      userId: testUser2.id,
      verificationStatus: 'NOT_SUBMITTED',
      kycVerified: false,
    },
  });

  // Test User 3: Day 7 Archival (created 7 days ago, should be archived by KYC expiry cron)
  const testUser3 = await prisma.user.create({
    data: {
      email: 'test.day7@example.com',
      password: hashedPassword,
      role: 'CLIENT',
      firstName: 'TestDay7',
      lastName: 'User',
      phone: '+1234567898',
      status: 'ACTIVE',
      emailVerified: true,
      createdAt: day7TestDate,
    },
  });

  await prisma.client.create({
    data: {
      userId: testUser3.id,
      verificationStatus: 'NOT_SUBMITTED',
      kycVerified: false,
    },
  });

  // Test User 4: Already Archived (created 8 days ago, already archived - to test idempotency)
  const testUser4 = await prisma.user.create({
    data: {
      email: 'test.archived@example.com',
      password: hashedPassword,
      role: 'CLIENT',
      firstName: 'TestArchived',
      lastName: 'User',
      phone: '+1234567899',
      status: 'INACTIVE',
      emailVerified: true,
      isArchived: true,
      archivedAt: new Date(day8TestDate.getTime() + 24 * 60 * 60 * 1000), // Archived 1 day after creation
      createdAt: day8TestDate,
    },
  });

  await prisma.client.create({
    data: {
      userId: testUser4.id,
      verificationStatus: 'EXPIRED',
      kycVerified: false,
      archivedReason: 'KYC_EXPIRED_DAY_7',
    },
  });

  // Test User 5: Normal Active User (created today, should NOT receive any emails yet)
  const testUser5 = await prisma.user.create({
    data: {
      email: 'test.active@example.com',
      password: hashedPassword,
      role: 'CLIENT',
      firstName: 'TestActive',
      lastName: 'User',
      phone: '+1234567900',
      status: 'ACTIVE',
      emailVerified: true,
      createdAt: now,
    },
  });

  await prisma.client.create({
    data: {
      userId: testUser5.id,
      verificationStatus: 'NOT_SUBMITTED',
      kycVerified: false,
    },
  });

  // Test User 6: KYC Verified User (created 5 days ago but KYC verified - should NOT receive emails)
  // This user is used for payout testing with completed investment contracts
  const testUser6 = await prisma.user.create({
    data: {
      email: 'test.verified@example.com',
      password: hashedPassword,
      role: 'CLIENT',
      firstName: 'TestVerified',
      lastName: 'User',
      phone: '+1234567901',
      status: 'ACTIVE',
      emailVerified: true,
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.client.create({
    data: {
      userId: testUser6.id,
      assignedRMId: rm1.id,
      verificationStatus: 'VERIFIED',
      kycVerified: true,
      kycDocuments: JSON.stringify(['/docs/kyc-verified-1.pdf']),
      riskTolerance: 'MEDIUM',
      investmentGoals: 'Regular monthly income through fixed returns',
    },
  });

  console.log('✅ Created 6 test users for email cron jobs:');
  console.log('  - test.day3@example.com (Day 3 reminder)');
  console.log('  - test.day6@example.com (Day 6 warning)');
  console.log('  - test.day7@example.com (Day 7 archival)');
  console.log('  - test.archived@example.com (Already archived)');
  console.log('  - test.active@example.com (Active, no emails yet)');
  console.log('  - test.verified@example.com (KYC verified, no emails)');
  console.log('  - All test users use password: Password123!');

  // ========================================
  // INVESTMENTS (Investment Range Categories)
  // ========================================
  console.log('💼 Creating investments...');

  // Investment Range 1: AED 50,000 – 99,999
  const investment50k = await prisma.investment.create({
    data: {
      name: 'AED 50,000 - 99,999',
      description: 'Entry-level investment tier for amounts between AED 50,000 and AED 99,999. Ideal for first-time investors looking for stable returns.',
      minAmount: 50000,
      maxAmount: 99999,
      currency: 'AED',
      displayOrder: 1,
      isActive: true,
    },
  });

  // Investment Range 1 Options
  await prisma.investmentOption.createMany({
    data: [
      {
        investmentId: investment50k.id,
        duration: '2 Years',
        withdrawalFrequency: 'Monthly',
        roi: 3.00,
        annualReturn: 36.00,
        displayOrder: 1,
        isActive: true,
      },
      {
        investmentId: investment50k.id,
        duration: '2 Years',
        withdrawalFrequency: 'Quarterly',
        roi: 10.00,
        annualReturn: 40.00,
        displayOrder: 2,
        isActive: true,
      },
    ],
  });

  // Investment Range 2: AED 100,000 – 499,999
  const investment100k = await prisma.investment.create({
    data: {
      name: 'AED 100,000 - 499,999',
      description: 'Mid-tier investment tier for amounts between AED 100,000 and AED 499,999. Offers flexible duration options with competitive returns.',
      minAmount: 100000,
      maxAmount: 499999,
      currency: 'AED',
      displayOrder: 2,
      isActive: true,
    },
  });

  // Investment Range 2 Options
  await prisma.investmentOption.createMany({
    data: [
      {
        investmentId: investment100k.id,
        duration: '1 Year',
        withdrawalFrequency: 'Monthly',
        roi: 3.00,
        annualReturn: 36.00,
        displayOrder: 2,
        isActive: true,
      },
      {
        investmentId: investment100k.id,
        duration: '2 Years',
        withdrawalFrequency: 'Monthly',
        roi: 3.50,
        annualReturn: 42.00,
        displayOrder: 3,
        isActive: true,
      },
      {
        investmentId: investment100k.id,
        duration: '2 Years',
        withdrawalFrequency: 'Quarterly',
        roi: 11.00,
        annualReturn: 44.00,
        displayOrder: 4,
        isActive: true,
      },
    ],
  });

  // Investment Range 4: AED >100,000 (General tier for amounts above 100,000)
  const investmentAbove100k = await prisma.investment.create({
    data: {
      name: 'AED >100,000',
      description: 'General investment tier for amounts above AED 100,000 with flexible options.',
      minAmount: 100000,
      maxAmount: null,
      currency: 'AED',
      displayOrder: 4,
      isActive: true,
    },
  });

  // Investment Range 4 Options
  await prisma.investmentOption.createMany({
    data: [
      {
        investmentId: investmentAbove100k.id,
        duration: '1 Year',
        withdrawalFrequency: 'Monthly',
        roi: 2.00,
        annualReturn: 24.00,
        displayOrder: 1,
        isActive: true,
      },
    ],
  });

  // Investment Range 3: AED 500,000 and Above
  const investment500k = await prisma.investment.create({
    data: {
      name: 'AED 500,000 and Above',
      description: 'Premium investment tier for amounts of AED 500,000 and above. Highest returns for substantial investments.',
      minAmount: 500000,
      maxAmount: null, // No upper limit
      currency: 'AED',
      displayOrder: 3,
      isActive: true,
    },
  });

  // Investment Range 3 Options
  await prisma.investmentOption.createMany({
    data: [
      {
        investmentId: investment500k.id,
        duration: '1 Year',
        withdrawalFrequency: 'Monthly',
        roi: 4.00,
        annualReturn: 48.00,
        displayOrder: 1,
        isActive: true,
      },
      {
        investmentId: investment500k.id,
        duration: '2 Years',
        withdrawalFrequency: 'Quarterly',
        roi: 15.00,
        annualReturn: 60.00,
        displayOrder: 2,
        isActive: true,
      },
    ],
  });

  console.log('✅ Created 4 investment ranges with 9 options');
  console.log('');
  console.log('💡 Note: test.verified@example.com is ready for payout testing');
  console.log('   Run: npx tsx src/scripts/payout-test-manager.ts setup');

  // ========================================
  // NOTIFICATIONS
  // ========================================
  console.log('🔔 Creating notifications...');

  await prisma.notification.create({
    data: {
      user: { connect: { id: client1User.id } },
      type: 'SUCCESS',
      category: 'REQUEST',
      title: 'Investment Request Approved',
      message: 'Your investment product request has been approved and is being processed.',
      isRead: true,
      readAt: new Date('2024-10-15T10:30:00'),
      actionUrl: '/client/investments',
      actionText: 'View Investment',
      entityType: 'ProductPurchaseRequest',
      entityId: client1.id,
      priority: 'NORMAL',
    },
  });

  await prisma.notification.create({
    data: {
      user: { connect: { id: client2User.id } },
      type: 'INFO',
      category: 'SYSTEM',
      title: 'KYC Verification Reminder',
      message: 'Please complete your KYC verification to access all investment products.',
      isRead: false,
      actionUrl: '/client/kyc',
      actionText: 'Complete KYC',
      priority: 'HIGH',
    },
  });

  await prisma.notification.create({
    data: {
      user: { connect: { id: rm1User.id } },
      type: 'ALERT',
      category: 'ASSIGNMENT',
      title: 'New Client Assigned',
      message: 'You have been assigned new clients. Please review their profiles.',
      isRead: false,
      actionUrl: '/rm/clients',
      actionText: 'View Clients',
      priority: 'HIGH',
    },
  });

  console.log('✅ Created 4 notifications');

  // ========================================
  // AUDIT LOGS
  // ========================================
  console.log('📝 Creating audit logs...');

  await prisma.auditLog.create({
    data: {
      user: { connect: { id: client1User.id } },
      action: 'LOGIN',
      description: 'User logged in successfully',
      entityType: 'User',
      entityId: client1User.id,
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/119.0.0.0',
      severity: 'INFO',
      success: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      user: { connect: { id: rm1User.id } },
      action: 'CLIENT_ASSIGN',
      description: 'RM assigned to client',
      entityType: 'Client',
      entityId: client1.id,
      oldValues: {},
      newValues: { assignedRMId: rm1.id },
      ipAddress: '192.168.1.50',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      severity: 'INFO',
      success: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      user: { connect: { id: admin.id } },
      action: 'WITHDRAWAL_REQUEST_ADMIN_APPROVE',
      description: 'Admin approved withdrawal request',
      entityType: 'WithdrawalRequest',
      entityId: client1.id,
      oldValues: { status: 'RM_APPROVED' },
      newValues: { status: 'ADMIN_APPROVED', approvedByAdminId: admin.id },
      ipAddress: '192.168.1.10',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      severity: 'INFO',
      success: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      user: { connect: { id: admin.id } },
      action: 'CLIENT_ASSIGN',
      description: 'Client assigned to relationship manager',
      entityType: 'Client',
      entityId: client1.id,
      newValues: { assignedRMId: rm1.id },
      ipAddress: '192.168.1.10',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      severity: 'INFO',
      success: true,
    },
  });

  console.log('✅ Created 4 audit logs');

  // ========================================
  // USER LEADS
  // ========================================
  console.log('📧 Creating user leads...');

  await prisma.userLead.create({
    data: {
      firstName: 'David',
      lastName: 'Thompson',
      email: 'david.thompson@example.com',
      phoneNumber: '+1234567896',
      leadSource: 'INSTAGRAM',
      status: 'NEW',
      rmReference: `${rm1User.firstName} ${rm1User.lastName} (${rm1.id})`,
    },
  });

  await prisma.userLead.create({
    data: {
      firstName: 'Emma',
      lastName: 'Rodriguez',
      email: 'emma.rodriguez@example.com',
      phoneNumber: '+1234567897',
      leadSource: 'WEBSITE',
      status: 'CONTACTED',
      rmReference: `${rm1User.firstName} ${rm1User.lastName} (${rm1.id})`,
    },
  });

  await prisma.userLead.create({
    data: {
      firstName: 'Frank',
      lastName: 'Chen',
      email: 'frank.chen@example.com',
      phoneNumber: '+1234567898',
      leadSource: 'GOOGLE_ADS',
      status: 'INTERESTED',
      rmReference: `${rm2User.firstName} ${rm2User.lastName} (${rm2.id})`,
    },
  });

  await prisma.userLead.create({
    data: {
      firstName: 'Grace',
      lastName: 'Anderson',
      email: 'grace.anderson@example.com',
      phoneNumber: '+1234567899',
      leadSource: 'REFERRAL',
      status: 'NOT_INTERESTED',
      rmReference: `${rm2User.firstName} ${rm2User.lastName} (${rm2.id})`,
    },
  });

  await prisma.userLead.create({
    data: {
      firstName: 'Henry',
      lastName: 'Parker',
      email: 'henry.parker@example.com',
      phoneNumber: '+1234567800',
      leadSource: 'FACEBOOK_ADS',
      status: 'NEW',
      rmReference: null,
    },
  });

  console.log('✅ Created 5 user leads');

  console.log('');
  console.log('🎉 Database seeding complete!');
  console.log('');
  console.log('📊 Summary:');
  console.log('  - 13 users (1 admin, 1 docadmin, 2 RMs, 9 clients including 6 test users)');
  console.log('  - 2 relationship managers');
  console.log('  - 9 clients (3 verified + 6 test users for email crons)');
  console.log('  - 4 investment product ranges with 9 options');
  console.log('  - 3 notifications');
  console.log('  - 4 audit log entries');
  console.log('  - 5 user leads (with various statuses)');
  console.log('');
  console.log('🔑 Login credentials (all users):');
  console.log('  Email: [see above] | Password: Password123!');
  console.log('');
  console.log('🧪 Payout Testing (test.verified@example.com):');
  console.log('  - User is KYC verified with RM assigned');
  console.log('  - Ready for investment contract creation');
  console.log('  - Run: npx tsx src/scripts/payout-test-manager.ts setup');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
