export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'accounts'
  | 'manager'
  | 'staff'
  | 'party'
  | 'company_rep';

export interface User {
  id: string;
  mobile: string;
  name: string;
  email?: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'pending';
  pin?: string;
  password?: string;
  relatedStaffId?: string;
  relatedPartyId?: string;
  relatedCompanyId?: string;
  createdAt: string;
}

export interface Staff {
  id: string;
  userId: string;
  employeeCode: string;
  fullName: string;
  photoUrl: string;
  dob: string;
  age: number;
  mobile: string;
  altMobile?: string;
  email?: string;
  address: string;
  joiningDate: string;
  designation: string;
  salary: number;
  bankAccount: string;
  ifsc: string;
  upiId: string;
  emergencyContact: string;
  bloodGroup: string;
  vehicleNumber?: string;
  drivingLicence?: string;
  assignedArea: string;
  assignedPartyIds: string[];
  status: 'pending_approval' | 'approved' | 'rejected';
  monthlySalesTarget: number;
  monthlyCollectionTarget: number;
  createdAt: string;
}

export type PartyType =
  | 'Medical Shop'
  | 'Pharmacy'
  | 'Hospital'
  | 'Nursing Home'
  | 'Clinic'
  | 'Institution'
  | 'Distributor'
  | 'Other';

export interface PartyDocument {
  id: string;
  title: string;
  docType: 'gst_cert' | 'drug_licence' | 'pan' | 'address_proof' | 'other';
  fileUrl: string;
  uploadedAt: string;
}

export interface Party {
  id: string;
  name: string;
  customerCode: string;
  contactPerson: string;
  mobile: string;
  altMobile?: string;
  address: string;
  area: string;
  city: string;
  pincode: string;
  gpsLatitude: number;
  gpsLongitude: number;
  gstin: string;
  drugLicence: string;
  pan?: string;
  creditLimit: number;
  creditDays: number;
  openingOutstanding: number;
  currentOutstanding: number;
  assignedStaffId: string;
  customerType: PartyType;
  status: 'active' | 'inactive' | 'pending_approval';
  photoUrl?: string;
  documents?: PartyDocument[];
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  code: string;
  divisions: string[];
  salesRepresentative: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  creditTerms: string;
  status: 'active' | 'inactive';
}

export interface Product {
  id: string;
  companyId: string;
  companyName: string;
  division: string;
  name: string;
  genericName: string;
  salt: string;
  strength: string;
  dosage: string;
  packSize: string;
  mrp: number;
  ptr: number; // Price to Retailer
  pts: number; // Price to Stockist
  gstRate: number; // 5, 12, 18, 28
  scheme: string; // e.g., "10+1", "20+2", "None"
  stock: number;
  reorderLevel: number;
  productCode: string;
  barcode: string;
  status: 'active' | 'discontinued';
}

export interface OrderItem {
  productId: string;
  productName: string;
  companyName: string;
  packSize: string;
  mrp: number;
  ptr: number;
  quantity: number;
  freeQuantity: number;
  basicAmount: number;
  discountPercent: number;
  gstRate: number;
  gstAmount: number;
  netAmount: number;
}

export type OrderStatus =
  | 'Draft'
  | 'Submitted'
  | 'Admin Review'
  | 'Approved'
  | 'Processing'
  | 'Packed'
  | 'Dispatched'
  | 'Delivered'
  | 'Cancelled'
  | 'Partially Supplied';

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  time: string;
  staffId: string;
  staffName: string;
  partyId: string;
  partyName: string;
  partyAddress: string;
  items: OrderItem[];
  basicTotal: number;
  discountTotal: number;
  gstTotal: number;
  grandTotal: number;
  gpsLatitude?: number;
  gpsLongitude?: number;
  status: OrderStatus;
  remarks?: string;
  adminNote?: string;
  createdAt: string;
}

export type PaymentMode = 'CASH' | 'CHEQUE' | 'UPI' | 'BANK_TRANSFER';

export type ChequeStatus =
  | 'Received'
  | 'Deposited'
  | 'Cleared'
  | 'Returned'
  | 'Replaced'
  | 'Cancelled';

export interface ChequeDetails {
  chequeNumber: string;
  bankName: string;
  chequeDate: string;
  chequePhotoUrl?: string;
  status: ChequeStatus;
  depositedDate?: string;
  clearanceDate?: string;
  remarks?: string;
}

export interface UpiDetails {
  transactionId: string;
  screenshotUrl?: string;
}

export interface Payment {
  id: string;
  receiptNumber: string;
  date: string;
  time: string;
  partyId: string;
  partyName: string;
  staffId: string;
  staffName: string;
  amount: number;
  mode: PaymentMode;
  outstandingBefore: number;
  outstandingAfter: number;
  chequeDetails?: ChequeDetails;
  upiDetails?: UpiDetails;
  remarks?: string;
  status: 'verified' | 'pending_admin_approval' | 'rejected';
  receiptUrl?: string;
  createdAt: string;
}

export type ExpenseCategory =
  | 'Bus'
  | 'Train'
  | 'Auto'
  | 'Taxi'
  | 'Fuel'
  | 'Food'
  | 'Hotel'
  | 'Parking'
  | 'Toll'
  | 'Courier'
  | 'Printing'
  | 'Other';

export interface Expense {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  category: ExpenseCategory;
  amount: number;
  gstAmount?: number;
  location: string;
  description: string;
  paymentMode: 'Cash' | 'UPI' | 'Card';
  billNumber?: string;
  billPhotoUrl?: string;
  isAiExtracted: boolean;
  status: 'Pending Approval' | 'Approved' | 'Rejected' | 'Correction Requested';
  adminRemarks?: string;
  createdAt: string;
}

export interface PartyVisit {
  id: string;
  staffId: string;
  staffName: string;
  partyId: string;
  partyName: string;
  date: string;
  time: string;
  gpsLatitude: number;
  gpsLongitude: number;
  gpsAccuracy: number;
  partyLatitude: number;
  partyLongitude: number;
  distanceMeters: number;
  isFarWarning: boolean;
  purpose: string;
  personMet: string;
  discussion: string;
  orderBooked: boolean;
  paymentCollected: boolean;
  orderId?: string;
  paymentId?: string;
  complaint?: string;
  newRequirement?: string;
  competitorInfo?: string;
  followUpDate?: string;
  remarks?: string;
  photoUrl?: string;
  createdAt: string;
}

export interface GpsLog {
  id: string;
  staffId: string;
  staffName: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  activity:
    | 'start_day'
    | 'travel_ping'
    | 'visit_start'
    | 'order_placed'
    | 'payment_received'
    | 'end_day';
  address?: string;
}

export interface AttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  startDayTime: string;
  startDayGps: { lat: number; lng: number };
  endDayTime?: string;
  endDayGps?: { lat: number; lng: number };
  workingHours?: number;
  status: 'Present' | 'Late' | 'Half Day' | 'Leave' | 'Absent';
  adminCorrection?: string;
}

export interface TourPlan {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  area: string;
  routeName: string;
  partyIds: string[];
  targetAmount: number;
  achievedAmount: number;
  visitedPartyIds: string[];
  status: 'Planned' | 'In Progress' | 'Completed';
}

export interface FollowUp {
  id: string;
  partyId: string;
  partyName: string;
  staffId: string;
  staffName: string;
  reason: string;
  date: string;
  reminderTime?: string;
  notes: string;
  status: 'Pending' | 'Completed' | 'Overdue';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'payment' | 'expense' | 'tour' | 'followup' | 'stock' | 'system';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  role: string;
  timestamp: string;
  action: string;
  entityType: string;
  entityId: string;
  previousValue?: any;
  newValue?: any;
}

export interface OfflineSyncItem {
  id: string;
  type: 'visit' | 'order' | 'payment' | 'expense' | 'gps';
  data: any;
  queuedAt: string;
}
