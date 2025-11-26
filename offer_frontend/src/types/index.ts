export enum UserRole {
  ADMIN = 'ADMIN',
  ZONE_MANAGER = 'ZONE_MANAGER',
  ZONE_USER = 'ZONE_USER',
}

export type UserRoleType = 'ADMIN' | 'ZONE_MANAGER' | 'ZONE_USER';

export type OfferStatus = 
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'QUOTED'
  | 'NEGOTIATION'
  | 'WON'
  | 'LOST'
  | 'ON_HOLD'
  | 'CANCELLED';

export type OfferStage =
  | 'INITIAL_CONTACT'
  | 'REQUIREMENT_GATHERING'
  | 'PROPOSAL_SENT'
  | 'DEMO_SCHEDULED'
  | 'DEMO_COMPLETED'
  | 'NEGOTIATION'
  | 'FINAL_APPROVAL'
  | 'CONTRACT_SENT'
  | 'WON'
  | 'LOST';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ServiceZoneAssignment {
  serviceZoneId: number;
  serviceZone: {
    id: number;
    name: string;
  };
}

export interface User {
  id: string | number;
  email: string;
  name: string | null;
  role: UserRole;
  isActive?: boolean;
  tokenVersion?: string | number;
  customerId?: string | number | null;
  zoneId?: string | number | null;
  phone?: string | null;
  companyName?: string | null;
  lastPasswordChange?: string;
  serviceZones?: ServiceZoneAssignment[];
  zones?: {
    id: number;
    name: string;
  }[];
  [key: string]: any;
}

// Type guard to check if a value is a User
export function isUser(value: any): value is User {
  return (
    value &&
    (typeof value.id === 'string' || typeof value.id === 'number') &&
    typeof value.email === 'string' &&
    Object.values(UserRole).includes(value.role)
  );
}

export interface ServiceZone {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface Customer {
  id: number;
  companyName: string;
  address?: string;
  industry?: string;
  timezone: string;
  serviceZoneId: number;
  isActive: boolean;
  serviceZone?: ServiceZone;
}

export interface Asset {
  id: number;
  machineId: string;
  model?: string;
  serialNo?: string;
  location?: string;
  status: string;
  customerId: number;
  customer?: Customer;
}

export interface Contact {
  id: number;
  name: string;
  email?: string;
  phone: string;
  role: 'ACCOUNT_OWNER' | 'CONTACT';
  passwordHash?: string;
  customerId: number;
}

export interface OfferProduct {
  id: number;
  productName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  totalPrice: number;
}

export interface OfferNote {
  id: number;
  content: string;
  createdAt: string;
  author: {
    id: number;
    name?: string;
  };
}

export interface OfferStatusHistory {
  id: number;
  fromStatus?: OfferStatus;
  toStatus: OfferStatus;
  fromStage?: OfferStage;
  toStage?: OfferStage;
  notes?: string;
  changedAt: string;
  changedBy: {
    id: number;
    name?: string;
  };
}

export interface Offer {
  id: number;
  offerNumber: string;
  title: string;
  description?: string;
  status: OfferStatus;
  stage: OfferStage;
  priority: Priority;
  customerId: number;
  customer: Customer;
  contactId: number;
  contact: Contact;
  zoneId: number;
  zone: ServiceZone;
  estimatedValue?: number;
  actualValue?: number;
  currency: string;
  validUntil?: string;
  expectedCloseDate?: string;
  actualCloseDate?: string;
  assignedToId?: number;
  assignedTo?: {
    id: number;
    name?: string;
    email: string;
  };
  createdById: number;
  createdBy?: {
    id: number;
    name?: string;
  };
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  products?: OfferProduct[];
  notes?: OfferNote[];
  statusHistory?: OfferStatusHistory[];
}

export interface DashboardStats {
  totalOffers: number;
  openOffers: number;
  wonOffers: number;
  lostOffers: number;
  myOffers?: number;
  totalValue: number;
  wonValue: number;
  winRate: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}
