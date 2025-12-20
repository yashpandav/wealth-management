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
  await prisma.purchaseRequest.deleteMany();
  await prisma.withdrawalRequest.deleteMany();
  await prisma.holding.deleteMany();
  await prisma.portfolio.deleteMany();
  await prisma.instrument.deleteMany();
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

  console.log('✅ Created 6 users');

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

  const client2 = await prisma.client.create({
    data: {
      userId: client2User.id,
      assignedRMId: rm1.id,
      riskTolerance: 'MEDIUM',
      investmentGoals: 'Balanced growth with dividend income',
      kycVerified: true,
      kycDocuments: JSON.stringify(['/docs/kyc-bob-1.pdf']),
    },
  });

  const client3 = await prisma.client.create({
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
  // PORTFOLIOS
  // ========================================
  console.log('💼 Creating portfolios...');

  const portfolio1 = await prisma.portfolio.create({
    data: {
      clientId: client1.id,
      totalValue: 285000,
      totalInvested: 250000,
      totalGainLoss: 35000,
      totalGainLossPercent: 14.0,
      dayChange: 1250,
      dayChangePercent: 0.44,
    },
  });

  const portfolio2 = await prisma.portfolio.create({
    data: {
      clientId: client2.id,
      totalValue: 165000,
      totalInvested: 150000,
      totalGainLoss: 15000,
      totalGainLossPercent: 10.0,
      dayChange: 825,
      dayChangePercent: 0.50,
    },
  });

  const portfolio3 = await prisma.portfolio.create({
    data: {
      clientId: client3.id,
      totalValue: 108000,
      totalInvested: 100000,
      totalGainLoss: 8000,
      totalGainLossPercent: 8.0,
      dayChange: 540,
      dayChangePercent: 0.50,
    },
  });

  console.log('✅ Created 3 portfolios');

  // ========================================
  // INSTRUMENTS
  // ========================================
  console.log('📈 Creating instruments...');

  const aapl = await prisma.instrument.create({
    data: {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      type: 'STOCK',
      isin: 'US0378331005',
      description: 'Technology company specializing in consumer electronics',
      currentPrice: 175.50,
      exchange: 'NASDAQ',
      sector: 'Technology',
      marketCap: 2800000000000,
      yearlyHigh: 198.23,
      yearlyLow: 164.08,
      dividendYield: 0.0052,
      peRatio: 28.5,
      riskRating: 'Medium',
      isActive: true,
      isPublic: true,
    },
  });

  const googl = await prisma.instrument.create({
    data: {
      symbol: 'GOOGL',
      name: 'Alphabet Inc. Class A',
      type: 'STOCK',
      isin: 'US02079K3059',
      description: 'Technology company specializing in internet services',
      currentPrice: 140.25,
      exchange: 'NASDAQ',
      sector: 'Technology',
      marketCap: 1750000000000,
      yearlyHigh: 152.10,
      yearlyLow: 121.46,
      dividendYield: 0.0,
      peRatio: 25.8,
      riskRating: 'Medium',
      isActive: true,
      isPublic: true,
    },
  });

  const msft = await prisma.instrument.create({
    data: {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      type: 'STOCK',
      isin: 'US5949181045',
      description: 'Technology company developing software and services',
      currentPrice: 380.75,
      exchange: 'NASDAQ',
      sector: 'Technology',
      marketCap: 2850000000000,
      yearlyHigh: 398.52,
      yearlyLow: 309.45,
      dividendYield: 0.0078,
      peRatio: 32.1,
      riskRating: 'Low',
      isActive: true,
      isPublic: true,
    },
  });

  const vti = await prisma.instrument.create({
    data: {
      symbol: 'VTI',
      name: 'Vanguard Total Stock Market ETF',
      type: 'ETF',
      isin: 'US9229087690',
      description: 'ETF tracking the entire US stock market',
      currentPrice: 245.80,
      exchange: 'NYSE',
      sector: 'Diversified',
      marketCap: 345000000000,
      yearlyHigh: 258.32,
      yearlyLow: 210.15,
      dividendYield: 0.0135,
      riskRating: 'Low',
      isActive: true,
      isPublic: true,
    },
  });

  const bnd = await prisma.instrument.create({
    data: {
      symbol: 'BND',
      name: 'Vanguard Total Bond Market ETF',
      type: 'BOND',
      isin: 'US9219378356',
      description: 'Bond ETF providing broad exposure to US investment-grade bonds',
      currentPrice: 76.40,
      exchange: 'NASDAQ',
      sector: 'Fixed Income',
      marketCap: 98000000000,
      yearlyHigh: 78.95,
      yearlyLow: 72.20,
      dividendYield: 0.0398,
      riskRating: 'Low',
      isActive: true,
      isPublic: true,
    },
  });

  console.log('✅ Created 5 instruments');

  // ========================================
  // HOLDINGS
  // ========================================
  console.log('💰 Creating holdings...');

  // Client 1 holdings (Aggressive)
  await prisma.holding.create({
    data: {
      portfolioId: portfolio1.id,
      instrumentId: aapl.id,
      quantity: 500,
      averagePurchasePrice: 165.50,
      totalCost: 82750,
      currentPrice: 175.50,
      currentValue: 87750,
      gainLoss: 5000,
      gainLossPercent: 6.04,
      dayChange: 500,
      dayChangePercent: 0.57,
      allocationPercent: 30.79,
      firstPurchasedAt: new Date('2024-01-15'),
    },
  });

  await prisma.holding.create({
    data: {
      portfolioId: portfolio1.id,
      instrumentId: googl.id,
      quantity: 600,
      averagePurchasePrice: 135.25,
      totalCost: 81150,
      currentPrice: 140.25,
      currentValue: 84150,
      gainLoss: 3000,
      gainLossPercent: 3.70,
      dayChange: 300,
      dayChangePercent: 0.36,
      allocationPercent: 29.53,
      firstPurchasedAt: new Date('2024-02-10'),
    },
  });

  await prisma.holding.create({
    data: {
      portfolioId: portfolio1.id,
      instrumentId: msft.id,
      quantity: 300,
      averagePurchasePrice: 355.50,
      totalCost: 106650,
      currentPrice: 380.75,
      currentValue: 114225,
      gainLoss: 7575,
      gainLossPercent: 7.10,
      dayChange: 450,
      dayChangePercent: 0.39,
      allocationPercent: 40.08,
      firstPurchasedAt: new Date('2024-03-05'),
    },
  });

  // Client 2 holdings (Moderate)
  await prisma.holding.create({
    data: {
      portfolioId: portfolio2.id,
      instrumentId: vti.id,
      quantity: 400,
      averagePurchasePrice: 230.50,
      totalCost: 92200,
      currentPrice: 245.80,
      currentValue: 98320,
      gainLoss: 6120,
      gainLossPercent: 6.64,
      dayChange: 400,
      dayChangePercent: 0.41,
      allocationPercent: 59.59,
      firstPurchasedAt: new Date('2024-01-20'),
    },
  });

  await prisma.holding.create({
    data: {
      portfolioId: portfolio2.id,
      instrumentId: bnd.id,
      quantity: 850,
      averagePurchasePrice: 74.90,
      totalCost: 63665,
      currentPrice: 76.40,
      currentValue: 64940,
      gainLoss: 1275,
      gainLossPercent: 2.00,
      dayChange: 425,
      dayChangePercent: 0.66,
      allocationPercent: 39.36,
      firstPurchasedAt: new Date('2024-02-15'),
    },
  });

  // Client 3 holdings (Conservative)
  await prisma.holding.create({
    data: {
      portfolioId: portfolio3.id,
      instrumentId: bnd.id,
      quantity: 1200,
      averagePurchasePrice: 74.50,
      totalCost: 89400,
      currentPrice: 76.40,
      currentValue: 91680,
      gainLoss: 2280,
      gainLossPercent: 2.55,
      dayChange: 360,
      dayChangePercent: 0.39,
      allocationPercent: 84.89,
      firstPurchasedAt: new Date('2024-01-10'),
    },
  });

  await prisma.holding.create({
    data: {
      portfolioId: portfolio3.id,
      instrumentId: vti.id,
      quantity: 65,
      averagePurchasePrice: 238.50,
      totalCost: 15502.50,
      currentPrice: 245.80,
      currentValue: 15977,
      gainLoss: 474.50,
      gainLossPercent: 3.06,
      dayChange: 130,
      dayChangePercent: 0.82,
      allocationPercent: 14.79,
      firstPurchasedAt: new Date('2024-03-01'),
    },
  });

  console.log('✅ Created 7 holdings');

  // ========================================
  // PURCHASE REQUESTS
  // ========================================
  console.log('📋 Creating purchase requests...');

  const purchaseReq1 = await prisma.purchaseRequest.create({
    data: {
      trackingNumber: 'PR-20241015-ABC123',
      client: { connect: { id: client1.id } },
      instrument: { connect: { id: aapl.id } },
      amount: 87750,
      quantity: 500,
      requestedPrice: 175.50,
      status: 'APPROVED',
      processedBy: { connect: { id: rm1.id } },
      processedAt: new Date('2024-10-15'),
      bankStatementRef: 'BS-2024-001',
      paymentProof: '/uploads/proof-001.pdf',
      clientNotes: 'Investing bonus payment into tech stocks',
      rmNotes: 'Bank statement verified. Payment confirmed.',
    },
  });

  await prisma.purchaseRequest.create({
    data: {
      trackingNumber: 'PR-20241020-DEF456',
      client: { connect: { id: client2.id } },
      instrument: { connect: { id: msft.id } },
      amount: 19037.50,
      quantity: 50,
      requestedPrice: 380.75,
      status: 'PENDING',
      clientNotes: 'Additional investment from savings',
    },
  });

  await prisma.purchaseRequest.create({
    data: {
      trackingNumber: 'PR-20241020-GHI789',
      client: { connect: { id: client3.id } },
      instrument: { connect: { id: googl.id } },
      amount: 28050,
      quantity: 200,
      requestedPrice: 140.25,
      status: 'REJECTED',
      processedBy: { connect: { id: rm2.id } },
      processedAt: new Date('2024-10-20'),
      rejectionReason: 'Insufficient documentation. Please provide updated bank statement.',
      rmNotes: 'Bank statement date mismatch',
    },
  });

  console.log('✅ Created 3 purchase requests');

  // ========================================
  // WITHDRAWAL REQUESTS
  // ========================================
  console.log('💸 Creating withdrawal requests...');

  await prisma.withdrawalRequest.create({
    data: {
      trackingNumber: 'WR-20241018-ABC123',
      client: { connect: { id: client1.id } },
      amount: 50000,
      bankAccountName: 'Alice Williams',
      bankAccountNumber: '1234567890',
      bankName: 'Chase Bank',
      bankBranch: '001',
      swiftCode: 'CHASUS33',
      status: 'ADMIN_APPROVED',
      processedByRM: { connect: { id: rm1.id } },
      rmProcessedAt: new Date('2024-10-18'),
      rmApproved: true,
      rmNotes: 'Portfolio has sufficient liquidity',
      approvedByAdmin: { connect: { id: admin.id } },
      adminProcessedAt: new Date('2024-10-19'),
      adminApproved: true,
      adminNotes: 'Approved after verification',
      reason: 'Home renovation down payment',
    },
  });

  await prisma.withdrawalRequest.create({
    data: {
      trackingNumber: 'WR-20241020-DEF456',
      client: { connect: { id: client2.id } },
      amount: 15000,
      bankAccountName: 'Bob Davis',
      bankAccountNumber: '0987654321',
      bankName: 'Bank of America',
      bankBranch: '002',
      swiftCode: 'BOFAUS3N',
      status: 'PENDING',
      reason: 'Emergency medical expenses',
      clientNotes: 'Urgent withdrawal needed',
    },
  });

  await prisma.withdrawalRequest.create({
    data: {
      trackingNumber: 'WR-20241021-GHI789',
      client: { connect: { id: client3.id } },
      amount: 75000,
      bankAccountName: 'Carol Martinez',
      bankAccountNumber: '5555666677',
      bankName: 'Wells Fargo',
      bankBranch: '003',
      swiftCode: 'WFBIUS6S',
      status: 'RM_REJECTED',
      processedByRM: { connect: { id: rm2.id } },
      rmProcessedAt: new Date('2024-10-21'),
      rmApproved: false,
      rmNotes: 'Withdrawal amount exceeds available portfolio value',
      rejectionReason: 'Requested amount exceeds portfolio value',
      rejectedBy: 'RM',
      rejectedAt: new Date('2024-10-21'),
      reason: 'Investment in new business',
    },
  });

  console.log('✅ Created 3 withdrawal requests');

  // ========================================
  // TRANSACTIONS
  // ========================================
  console.log('💳 Creating transactions...');

  await prisma.transaction.create({
    data: {
      client: { connect: { id: client1.id } },
      instrument: { connect: { id: aapl.id } },
      type: 'PURCHASE',
      status: 'COMPLETED',
      amount: 87750,
      price: 175.50,
      quantity: 500,
      total: 87750,
      fees: 175.50,
      netAmount: 87924.50,
      bankStatementReference: 'BS-2024-001',
      paymentProof: '/uploads/proof-001.pdf',
      processedBy: { connect: { id: rm1.id } },
      completedAt: new Date('2024-10-15'),
      purchaseRequest: { connect: { id: purchaseReq1.id } },
      notes: 'Tech stock investment',
    },
  });

  await prisma.transaction.create({
    data: {
      client: { connect: { id: client2.id } },
      instrument: { connect: { id: vti.id } },
      type: 'DIVIDEND',
      status: 'COMPLETED',
      amount: 542.40,
      total: 542.40,
      fees: 0,
      netAmount: 542.40,
      processedBy: { connect: { id: rm1.id } },
      completedAt: new Date('2024-10-01'),
      notes: 'Quarterly dividend payment',
    },
  });

  await prisma.transaction.create({
    data: {
      client: { connect: { id: client3.id } },
      instrument: { connect: { id: bnd.id } },
      type: 'PURCHASE',
      status: 'FAILED',
      amount: 7640,
      price: 76.40,
      quantity: 100,
      total: 7640,
      fees: 15.28,
      netAmount: 7655.28,
      processedBy: { connect: { id: rm2.id } },
      completedAt: new Date('2024-10-22'),
      failureReason: 'Payment verification failed',
      notes: 'Bank statement mismatch',
    },
  });

  console.log('✅ Created 3 transactions');

  // ========================================
  // NOTIFICATIONS
  // ========================================
  console.log('🔔 Creating notifications...');

  await prisma.notification.create({
    data: {
      user: { connect: { id: client1User.id } },
      type: 'SUCCESS',
      category: 'REQUEST',
      title: 'Purchase Request Approved',
      message: 'Your purchase request for 500 shares of AAPL has been approved and processed.',
      isRead: true,
      readAt: new Date('2024-10-15T10:30:00'),
      actionUrl: '/dashboard/transactions',
      actionText: 'View Transaction',
      entityType: 'PurchaseRequest',
      entityId: purchaseReq1.id,
      priority: 'NORMAL',
    },
  });

  await prisma.notification.create({
    data: {
      user: { connect: { id: client2User.id } },
      type: 'INFO',
      category: 'REQUEST',
      title: 'Withdrawal Request Received',
      message: 'Your withdrawal request for $15,000 is being reviewed by your relationship manager.',
      isRead: false,
      actionUrl: '/dashboard/withdrawals',
      actionText: 'View Status',
      priority: 'HIGH',
    },
  });

  await prisma.notification.create({
    data: {
      user: { connect: { id: client3User.id } },
      type: 'WARNING',
      category: 'REQUEST',
      title: 'Withdrawal Request Rejected',
      message: 'Your withdrawal request was rejected. Reason: Requested amount exceeds portfolio value.',
      isRead: false,
      actionUrl: '/dashboard/withdrawals',
      actionText: 'View Details',
      priority: 'URGENT',
    },
  });

  await prisma.notification.create({
    data: {
      user: { connect: { id: rm1User.id } },
      type: 'ALERT',
      category: 'SYSTEM',
      title: 'New Purchase Request',
      message: 'Bob Davis has submitted a new purchase request for MSFT shares.',
      isRead: false,
      actionUrl: '/rm/requests',
      actionText: 'Review Request',
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
      action: 'PURCHASE_REQUEST_APPROVE',
      description: 'RM approved purchase request',
      entityType: 'PurchaseRequest',
      entityId: purchaseReq1.id,
      oldValues: { status: 'PENDING' },
      newValues: { status: 'APPROVED', processedById: rm1.id },
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

  console.log('');
  console.log('🎉 Database seeding complete!');
  console.log('');
  console.log('📊 Summary:');
  console.log('  - 6 users (1 admin, 2 RMs, 3 clients)');
  console.log('  - 2 relationship managers');
  console.log('  - 3 clients with portfolios');
  console.log('  - 5 instruments (AAPL, GOOGL, MSFT, VTI, BND)');
  console.log('  - 7 holdings across portfolios');
  console.log('  - 3 purchase requests (approved, pending, rejected)');
  console.log('  - 3 withdrawal requests (admin approved, pending, RM rejected)');
  console.log('  - 3 transactions (2 completed, 1 failed)');
  console.log('  - 4 notifications');
  console.log('  - 4 audit log entries');
  console.log('');
  console.log('🔑 Login credentials (all users):');
  console.log('  Email: [see above] | Password: Password123!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
