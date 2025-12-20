/**
 * TypeScript type definitions
 * Shared types, interfaces, and enums
 */

// User roles
export enum UserRole {
  CLIENT = 'CLIENT',
  RM = 'RM',
  ADMIN = 'ADMIN',
}

// Transaction status
export enum TransactionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
}

// Instrument types
export enum InstrumentType {
  STOCK = 'STOCK',
  BOND = 'BOND',
  MUTUAL_FUND = 'MUTUAL_FUND',
  ETF = 'ETF',
  ALTERNATIVE = 'ALTERNATIVE',
}

// Risk levels
export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

// Notification types (matching Prisma enums)
export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  ALERT = 'ALERT',
}

export enum NotificationCategory {
  TRANSACTION = 'TRANSACTION',
  REQUEST = 'REQUEST',
  ASSIGNMENT = 'ASSIGNMENT',
  SYSTEM = 'SYSTEM',
  PORTFOLIO = 'PORTFOLIO',
  SECURITY = 'SECURITY',
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

// Notification interfaces
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  isRead: boolean;
  readAt: Date | null;
  isDismissed: boolean;
  actionUrl: string | null;
  actionText: string | null;
  entityType: string | null;
  entityId: string | null;
  priority: NotificationPriority;
  expiresAt: Date | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  entityType?: string;
  entityId?: string;
  priority?: NotificationPriority;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface NotificationPreferences {
  emailNotifications: {
    transactions: boolean;
    requests: boolean;
    assignments: boolean;
    system: boolean;
    portfolio: boolean;
    security: boolean;
  };
  inAppNotifications: {
    transactions: boolean;
    requests: boolean;
    assignments: boolean;
    system: boolean;
    portfolio: boolean;
    security: boolean;
  };
}

// Add more types as needed
