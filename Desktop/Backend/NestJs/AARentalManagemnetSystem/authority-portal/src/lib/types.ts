export type AuthorityRole = "admin";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  role: AuthorityRole;
  adminSubCities: string[];
  adminAllLocations: boolean;
  isVerified: boolean;
  createdAt: string;
}

export type PropertyStatus =
  | "pending_verification"
  | "available"
  | "rejected"
  | "rented";

export interface PropertyDocument {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storageKey: string;
  description?: string;
  uploadedAt: string;
}

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
  images: string[];
  documents: PropertyDocument[];
  verifiedAt?: string;
  createdAt: string;
}

export type AgreementStatus =
  | "draft"
  | "pending_tenant_signature"
  | "pending_verification"
  | "pending_dara_verification"
  | "pending_payment"
  | "active"
  | "extension_requested"
  | "termination_requested"
  | "extended"
  | "terminated"
  | "expired"
  | "rejected";

export interface AgreementPartyContact {
  fullName: string;
  phone: string;
  address: string;
}

export interface AgreementContacts {
  landlord: AgreementPartyContact;
  tenant: AgreementPartyContact;
}

export interface TenancyAgreement {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  landlordId: string;
  landlordName: string;
  tenantId: string;
  tenantName: string;
  contactsAvailable?: boolean;
  contacts?: AgreementContacts;
  monthlyRent: number;
  advancePayment: number;
  startDate: string;
  endDate: string;
  status: AgreementStatus;
  utilities: string[];
  tenantSignedAt?: string;
  verifiedAt?: string;
  proposedEndDate?: string;
  proposedMonthlyRent?: number;
  createdAt: string;
  terminationReason?: string;
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
  | "admin";

export interface PlatformUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: PlatformRole;
  adminSubCities?: string[];
  adminAllLocations?: boolean;
  isVerified: boolean;
  faydaVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
  lockedUntil?: string;
  _count?: {
    ownedProperties: number;
    agreementsAsLandlord: number;
    agreementsAsTenant: number;
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
