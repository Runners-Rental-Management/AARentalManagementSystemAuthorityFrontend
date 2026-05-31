export type AuthorityRole = "admin" | "dara_agent" | "system_admin";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: AuthorityRole;
  isVerified: boolean;
  createdAt: string;
}

export type PropertyStatus =
  | "pending_verification"
  | "available"
  | "rejected"
  | "rented";

export interface Property {
  id: string;
  title: string;
  address: string;
  subCity: string;
  woreda: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  monthlyRent: number;
  status: PropertyStatus;
  landlordId: string;
  landlordName: string;
  landlordEmail?: string;
  landlordPhone?: string;
  description: string;
  amenities: string[];
  homeCondition?: string;
  verifiedAt?: string;
  createdAt: string;
}

export type AgreementStatus =
  | "draft"
  | "pending_tenant_signature"
  | "pending_verification"
  | "pending_dara_verification"
  | "active"
  | "extended"
  | "terminated"
  | "expired"
  | "rejected";

export interface TenancyAgreement {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  landlordId: string;
  landlordName: string;
  tenantId: string;
  tenantName: string;
  monthlyRent: number;
  advancePayment: number;
  startDate: string;
  endDate: string;
  status: AgreementStatus;
  utilities: string[];
  tenantSignedAt?: string;
  verifiedAt?: string;
  createdAt: string;
  terminationReason?: string;
}

export type DisputeStatus =
  | "open"
  | "under_review"
  | "mediation"
  | "resolved"
  | "closed"
  | "escalated";

export type PriorityLevel = "low" | "medium" | "high" | "critical";

export interface Dispute {
  id: string;
  agreementId: string;
  propertyId?: string;
  propertyTitle?: string;
  reporterName: string;
  respondentName: string;
  violationType: string;
  title: string;
  description: string;
  status: DisputeStatus;
  priority: PriorityLevel;
  createdAt: string;
  resolvedAt?: string;
  resolution?: string;
  assignedTo?: string;
  assignedToId?: string;
}

export type RentAdjustmentStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "under_review";

export interface RentAdjustment {
  id: string;
  agreementId: string;
  propertyTitle: string;
  landlordName: string;
  currentRent: number;
  proposedRent: number;
  increasePercentage: number;
  maxAllowedPercentage: number;
  reason: string;
  status: RentAdjustmentStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export type Paginated<T> = {
  items: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
};

export type PlatformRole =
  | "tenant"
  | "landlord"
  | "admin"
  | "dara_agent"
  | "system_admin";

export interface PlatformUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: PlatformRole;
  isVerified: boolean;
  faydaVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
  lockedUntil?: string;
  _count?: {
    ownedProperties: number;
    agreementsAsLandlord: number;
    agreementsAsTenant: number;
    reportedDisputes?: number;
  };
}

export type SystemParameterCategory =
  | "rental"
  | "compliance"
  | "system"
  | "notification";

export interface SystemParameter {
  id: string;
  key: string;
  label: string;
  value: string;
  category: SystemParameterCategory;
  description: string;
  updatedAt: string;
  updatedBy?: { id: string; firstName: string; lastName: string };
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  ipAddress: string;
  userAgent?: string;
  timestamp: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: PlatformRole;
  };
}
