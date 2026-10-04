import {
  User,
  Staff,
  Party,
  Company,
  Product,
  Order,
  Payment,
  ChequeDetails,
  Expense,
  PartyVisit,
  GpsLog,
  AttendanceRecord,
  TourPlan,
  FollowUp,
  AppNotification,
  AuditLog,
  OfflineSyncItem,
} from '../types';
import { firestore, testConnection, saveDocument, listenCollection } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

const STORAGE_KEY = 'kapila_erp_db_v1';
const OFFLINE_QUEUE_KEY = 'kapila_offline_queue_v1';

// Seed initial data
const initialUsers: User[] = [
  {
    id: 'u-1',
    name: 'Suresh Bhat (Owner)',
    mobile: '9448123456',
    email: 'kapilamedsirsi1@gmail.com',
    role: 'super_admin',
    status: 'active',
    pin: '1234',
    createdAt: '2026-01-01T09:00:00Z',
  },
  {
    id: 'u-2',
    name: 'Ananth Hegde (Accounts)',
    mobile: '9448123457',
    email: 'accounts@kapilamed.com',
    role: 'accounts',
    status: 'active',
    pin: '1234',
    createdAt: '2026-01-01T09:00:00Z',
  },
  {
    id: 'u-3',
    name: 'Rahul Hegde (Tour Boy)',
    mobile: '9886012345',
    email: 'rahul.hegde@kapilamed.com',
    role: 'staff',
    status: 'active',
    pin: '1234',
    relatedStaffId: 'st-1',
    createdAt: '2026-01-05T09:00:00Z',
  },
  {
    id: 'u-4',
    name: 'Santosh Naik (Tour Boy)',
    mobile: '9886012346',
    email: 'santosh.naik@kapilamed.com',
    role: 'staff',
    status: 'active',
    pin: '1234',
    relatedStaffId: 'st-2',
    createdAt: '2026-01-05T09:00:00Z',
  },
  {
    id: 'u-5',
    name: 'Shri Ganesh Medicals (Partner)',
    mobile: '9448098765',
    email: 'ganeshmedicals@gmail.com',
    role: 'party',
    status: 'active',
    relatedPartyId: 'p-1',
    createdAt: '2026-01-10T09:00:00Z',
  },
  {
    id: 'u-6',
    name: 'Girish K (Sun Pharma Rep)',
    mobile: '9845011223',
    email: 'girish.k@sunpharma.com',
    role: 'company_rep',
    status: 'active',
    relatedCompanyId: 'comp-1',
    createdAt: '2026-01-10T09:00:00Z',
  },
];

const initialStaff: Staff[] = [
  {
    id: 'st-1',
    userId: 'u-3',
    employeeCode: 'KMA-TB-01',
    fullName: 'Rahul Hegde',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop&crop=face',
    dob: '1998-05-14',
    age: 28,
    mobile: '9886012345',
    altMobile: '9448998877',
    email: 'rahul.hegde@kapilamed.com',
    address: 'Kalyan Nagar, Near Marikamba Temple, Sirsi – 581401',
    joiningDate: '2024-02-01',
    designation: 'Senior Field Representative / Tour Boy',
    salary: 22000,
    bankAccount: '91882010045678',
    ifsc: 'KARB0000720',
    upiId: 'rahul.kma@oksbi',
    emergencyContact: '9448998877 (Father - Ganapati Hegde)',
    bloodGroup: 'B+',
    vehicleNumber: 'KA-31-EA-4521 (Hero Splendor+)',
    drivingLicence: 'DL-KA3120180004921',
    assignedArea: 'Sirsi Town, Court Road, Banavasi Route',
    assignedPartyIds: ['p-1', 'p-2', 'p-3', 'p-5'],
    status: 'approved',
    monthlySalesTarget: 500000,
    monthlyCollectionTarget: 450000,
    createdAt: '2024-02-01T10:00:00Z',
  },
  {
    id: 'st-2',
    userId: 'u-4',
    employeeCode: 'KMA-TB-02',
    fullName: 'Santosh Naik',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&fit=crop&crop=face',
    dob: '1999-11-20',
    age: 26,
    mobile: '9886012346',
    altMobile: '9448554433',
    email: 'santosh.naik@kapilamed.com',
    address: 'Bakkal Cross, Siddapur Road, Sirsi – 581402',
    joiningDate: '2024-06-15',
    designation: 'Tour Representative',
    salary: 19500,
    bankAccount: '64082109876543',
    ifsc: 'SBIN0040082',
    upiId: 'santoshnaik@okhdfcbank',
    emergencyContact: '9448554433 (Brother - Ramesh)',
    bloodGroup: 'O+',
    vehicleNumber: 'KA-31-H-8822 (Honda Shine)',
    drivingLicence: 'DL-KA3120190008812',
    assignedArea: 'Siddapur, Yellapur, Mundgod Route',
    assignedPartyIds: ['p-4', 'p-6'],
    status: 'approved',
    monthlySalesTarget: 400000,
    monthlyCollectionTarget: 380000,
    createdAt: '2024-06-15T10:00:00Z',
  },
];

const initialParties: Party[] = [
  {
    id: 'p-1',
    name: 'Shri Ganesh Medical & General Stores',
    customerCode: 'CUST-SR-101',
    contactPerson: 'Venkatesh Prabhu',
    mobile: '9448098765',
    altMobile: '08384226101',
    address: 'Opp. Head Post Office, Court Road, Sirsi',
    area: 'Court Road',
    city: 'Sirsi',
    pincode: '581401',
    gpsLatitude: 14.6192,
    gpsLongitude: 74.8354,
    gstin: '29ABCDE1234F1Z5',
    drugLicence: 'KA-UK-20B-112233, KA-UK-21B-112234',
    pan: 'ABCDE1234F',
    creditLimit: 200000,
    creditDays: 30,
    openingOutstanding: 45000,
    currentOutstanding: 68450,
    assignedStaffId: 'st-1',
    customerType: 'Medical Shop',
    status: 'active',
    photoUrl: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=400&fit=crop',
    documents: [
      {
        id: 'doc-p1-1',
        title: 'Drug Licence 20B/21B Renewal Certificate',
        docType: 'drug_licence',
        fileUrl: '#',
        uploadedAt: '2026-01-05T10:00:00Z',
      },
      {
        id: 'doc-p1-2',
        title: 'GST Registration Certificate Form REG-06',
        docType: 'gst_cert',
        fileUrl: '#',
        uploadedAt: '2026-01-05T10:00:00Z',
      },
    ],
    createdAt: '2024-01-01T10:00:00Z',
  },
  {
    id: 'p-2',
    name: 'City Hospital & 24x7 Pharmacy',
    customerCode: 'CUST-SR-102',
    contactPerson: 'Dr. Ashok Hegde (Medical Supdt)',
    mobile: '9448233445',
    address: 'Near Old Bus Stand, Hubli Road, Sirsi',
    area: 'Hubli Road',
    city: 'Sirsi',
    pincode: '581401',
    gpsLatitude: 14.6225,
    gpsLongitude: 74.841,
    gstin: '29AABCC5544D1Z2',
    drugLicence: 'KA-UK-20B-998877, KA-UK-21B-998878',
    creditLimit: 500000,
    creditDays: 45,
    openingOutstanding: 120000,
    currentOutstanding: 148200,
    assignedStaffId: 'st-1',
    customerType: 'Hospital',
    status: 'active',
    createdAt: '2024-01-01T10:00:00Z',
  },
  {
    id: 'p-3',
    name: 'Marikamba Medicals',
    customerCode: 'CUST-SR-103',
    contactPerson: 'Sanjay Pai',
    mobile: '9448344556',
    address: 'Near Marikamba Temple Car Street, Sirsi',
    area: 'Temple Road',
    city: 'Sirsi',
    pincode: '581401',
    gpsLatitude: 14.6178,
    gpsLongitude: 74.8382,
    gstin: '29AADDP8877E1Z9',
    drugLicence: 'KA-UK-20B-554433, KA-UK-21B-554434',
    creditLimit: 150000,
    creditDays: 21,
    openingOutstanding: 28000,
    currentOutstanding: 34120,
    assignedStaffId: 'st-1',
    customerType: 'Pharmacy',
    status: 'active',
    createdAt: '2024-01-01T10:00:00Z',
  },
  {
    id: 'p-4',
    name: 'Sharada Medical Stores',
    customerCode: 'CUST-SD-201',
    contactPerson: 'Raghavendra Bhat',
    mobile: '9448455667',
    address: 'Main Bazaar Road, Siddapur',
    area: 'Main Bazaar',
    city: 'Siddapur',
    pincode: '581355',
    gpsLatitude: 14.3411,
    gpsLongitude: 74.8879,
    gstin: '29AAHFS9911K1Z1',
    drugLicence: 'KA-UK-20B-332211, KA-UK-21B-332212',
    creditLimit: 250000,
    creditDays: 30,
    openingOutstanding: 62000,
    currentOutstanding: 89600,
    assignedStaffId: 'st-2',
    customerType: 'Pharmacy',
    status: 'active',
    createdAt: '2024-01-05T10:00:00Z',
  },
  {
    id: 'p-5',
    name: 'Sanjeevini Nursing Home & Clinic',
    customerCode: 'CUST-SR-104',
    contactPerson: 'Dr. Veena Murthy',
    mobile: '9448566778',
    address: 'APMC Road, Sirsi',
    area: 'APMC Yard',
    city: 'Sirsi',
    pincode: '581402',
    gpsLatitude: 14.628,
    gpsLongitude: 74.845,
    gstin: '29AABSN6622M1Z0',
    drugLicence: 'KA-UK-20B-771122, KA-UK-21B-771123',
    creditLimit: 300000,
    creditDays: 45,
    openingOutstanding: 40000,
    currentOutstanding: 52100,
    assignedStaffId: 'st-1',
    customerType: 'Nursing Home',
    status: 'active',
    createdAt: '2024-01-10T10:00:00Z',
  },
  {
    id: 'p-6',
    name: 'Venkateshwara Pharma Distributors',
    customerCode: 'CUST-YP-301',
    contactPerson: 'Naveen Shetty',
    mobile: '9448677889',
    address: 'Near KSRTC Depot, Yellapur Road',
    area: 'Yellapur',
    city: 'Yellapur',
    pincode: '581359',
    gpsLatitude: 14.9645,
    gpsLongitude: 74.7121,
    gstin: '29AABCV7744N1Z4',
    drugLicence: 'KA-UK-20B-665544, KA-UK-21B-665545',
    creditLimit: 400000,
    creditDays: 30,
    openingOutstanding: 95000,
    currentOutstanding: 112000,
    assignedStaffId: 'st-2',
    customerType: 'Distributor',
    status: 'active',
    createdAt: '2024-02-01T10:00:00Z',
  },
];

const initialCompanies: Company[] = [
  {
    id: 'comp-1',
    name: 'Sun Pharmaceutical Industries Ltd',
    code: 'SUN',
    divisions: ['Sun Azadin', 'Sun Cardio', 'Sun Derma'],
    salesRepresentative: 'Girish K (Area Manager - Hubli-Sirsi)',
    contact: 'Girish K',
    phone: '9845011223',
    email: 'girish.k@sunpharma.com',
    address: 'Regional Depot, Gokul Road, Hubballi – 580030',
    creditTerms: '30 Days Net, Scheme Support 10+1',
    status: 'active',
  },
  {
    id: 'comp-2',
    name: 'Cipla Limited',
    code: 'CIPLA',
    divisions: ['Cipla Respiratory', 'Cipla Generics', 'Cipla Critical Care'],
    salesRepresentative: 'Pradeep Joshi',
    phone: '9845022334',
    contact: 'Pradeep Joshi',
    email: 'pradeep.j@cipla.com',
    address: 'C&F Agent Depot, Rayapur Industrial Area, Dharwad',
    creditTerms: '21 Days Net',
    status: 'active',
  },
  {
    id: 'comp-3',
    name: 'Abbott Healthcare Pvt Ltd',
    code: 'ABBOTT',
    divisions: ['Abbott Nutrition', 'Abbott Gastro', 'Abbott Primary Care'],
    salesRepresentative: 'Manjunath Rao',
    contact: 'Manjunath Rao',
    phone: '9845033445',
    email: 'manjunath.rao@abbott.com',
    address: 'C&F Logistics, Belagavi Road, Hubballi',
    creditTerms: '30 Days Net',
    status: 'active',
  },
  {
    id: 'comp-4',
    name: 'Mankind Pharma Ltd',
    code: 'MANKIND',
    divisions: ['Mankind Specialities', 'Magnet', 'Future'],
    salesRepresentative: 'Vinay Kumar',
    contact: 'Vinay Kumar',
    phone: '9845044556',
    email: 'vinay.kumar@mankindpharma.com',
    address: 'C&F Warehouse, Tarihal, Hubballi',
    creditTerms: '30 Days Net',
    status: 'active',
  },
  {
    id: 'comp-5',
    name: 'Torrent Pharmaceuticals Ltd',
    code: 'TORRENT',
    divisions: ['Torrent Cardio', 'Torrent CNS'],
    salesRepresentative: 'Shankar Murthy',
    contact: 'Shankar Murthy',
    phone: '9845055667',
    email: 'shankar.m@torrentpharma.com',
    address: 'Deshpande Nagar, Hubballi',
    creditTerms: '30 Days Net',
    status: 'active',
  },
];

const initialProducts: Product[] = [
  {
    id: 'prod-1',
    companyId: 'comp-3',
    companyName: 'Abbott Healthcare Pvt Ltd',
    division: 'Abbott Nutrition',
    name: 'Prohance Renal HP Powder 400g',
    genericName: 'High Protein Nutritional Supplement for Dialysis Patients',
    salt: 'High Protein Vanilla Powder with Fibers & Low Electrolytes',
    strength: '400g Tin',
    dosage: 'Oral / Enteral Nutrition',
    packSize: '400g Tin',
    mrp: 1250.0,
    ptr: 990.0,
    pts: 920.0,
    gstRate: 18,
    scheme: '10+1',
    stock: 48,
    reorderLevel: 20,
    productCode: 'AB-PRH-400',
    barcode: '8901234567011',
    status: 'active',
  },
  {
    id: 'prod-2',
    companyId: 'comp-1',
    companyName: 'Sun Pharmaceutical Industries Ltd',
    division: 'Sun Gastro',
    name: 'Pantocid 40mg Tablet',
    genericName: 'Pantoprazole Sodium Gastro-resistant Tablets IP',
    salt: 'Pantoprazole 40mg',
    strength: '40mg',
    dosage: '1 Tab Daily Before Food',
    packSize: '15 Tablets (Strip)',
    mrp: 165.0,
    ptr: 130.95,
    pts: 121.78,
    gstRate: 12,
    scheme: '10+1',
    stock: 420,
    reorderLevel: 100,
    productCode: 'SUN-PNT-40',
    barcode: '8901234567028',
    status: 'active',
  },
  {
    id: 'prod-3',
    companyId: 'comp-2',
    companyName: 'Cipla Limited',
    division: 'Cipla Respiratory',
    name: 'Asthalin Inhaler 200 MDI',
    genericName: 'Salbutamol Inhalation Aerosol IP',
    salt: 'Salbutamol 100mcg per actuation',
    strength: '100mcg',
    dosage: 'Inhalation as directed by Physician',
    packSize: '200 Metered Doses (Canister)',
    mrp: 172.5,
    ptr: 137.0,
    pts: 127.4,
    gstRate: 12,
    scheme: '10+1',
    stock: 180,
    reorderLevel: 50,
    productCode: 'CIP-AST-200',
    barcode: '8901234567035',
    status: 'active',
  },
  {
    id: 'prod-4',
    companyId: 'comp-2',
    companyName: 'Cipla Limited',
    division: 'Cipla Respiratory',
    name: 'Montair LC Tablet',
    genericName: 'Montelukast Sodium and Levocetirizine HCl Tablets IP',
    salt: 'Montelukast 10mg + Levocetirizine 5mg',
    strength: '10mg+5mg',
    dosage: '1 Tab at Bedtime',
    packSize: '10 Tablets (Alu-Alu)',
    mrp: 198.0,
    ptr: 157.2,
    pts: 146.19,
    gstRate: 12,
    scheme: '20+2',
    stock: 540,
    reorderLevel: 150,
    productCode: 'CIP-MLC-10',
    barcode: '8901234567042',
    status: 'active',
  },
  {
    id: 'prod-5',
    companyId: 'comp-1',
    companyName: 'Sun Pharmaceutical Industries Ltd',
    division: 'Sun Cardio',
    name: 'Rosuvas 10mg Tablet',
    genericName: 'Rosuvastatin Calcium Tablets IP',
    salt: 'Rosuvastatin 10mg',
    strength: '10mg',
    dosage: '1 Tab Daily',
    packSize: '15 Tablets (Strip)',
    mrp: 235.0,
    ptr: 186.5,
    pts: 173.44,
    gstRate: 12,
    scheme: '10+1',
    stock: 310,
    reorderLevel: 80,
    productCode: 'SUN-ROS-10',
    barcode: '8901234567059',
    status: 'active',
  },
  {
    id: 'prod-6',
    companyId: 'comp-4',
    companyName: 'Mankind Pharma Ltd',
    division: 'Mankind Specialities',
    name: 'Moxikind-CV 625 Tablet',
    genericName: 'Amoxicillin and Potassium Clavulanate Tablets IP',
    salt: 'Amoxicillin 500mg + Clavulanic Acid 125mg',
    strength: '625mg',
    dosage: '1 Tab Twice Daily after Food',
    packSize: '10 Tablets (Alu-Alu)',
    mrp: 204.5,
    ptr: 162.3,
    pts: 150.93,
    gstRate: 12,
    scheme: '10+1',
    stock: 620,
    reorderLevel: 200,
    productCode: 'MKD-MCV-625',
    barcode: '8901234567066',
    status: 'active',
  },
  {
    id: 'prod-7',
    companyId: 'comp-5',
    companyName: 'Torrent Pharmaceuticals Ltd',
    division: 'Torrent Cardio',
    name: 'Shelcal 500 Tablet',
    genericName: 'Calcium Carbonate and Vitamin D3 Tablets IP',
    salt: 'Elemental Calcium 500mg + Vitamin D3 250 IU',
    strength: '500mg',
    dosage: '1 Tab Daily',
    packSize: '15 Tablets (Strip)',
    mrp: 138.0,
    ptr: 109.5,
    pts: 101.83,
    gstRate: 12,
    scheme: '10+1',
    stock: 750,
    reorderLevel: 250,
    productCode: 'TOR-SHL-500',
    barcode: '8901234567073',
    status: 'active',
  },
  {
    id: 'prod-8',
    companyId: 'comp-1',
    companyName: 'Sun Pharmaceutical Industries Ltd',
    division: 'Sun Azadin',
    name: 'Azithral 500mg Tablet',
    genericName: 'Azithromycin Tablets IP',
    salt: 'Azithromycin 500mg',
    strength: '500mg',
    dosage: '1 Tab Daily for 3/5 Days',
    packSize: '5 Tablets (Strip)',
    mrp: 132.0,
    ptr: 104.75,
    pts: 97.41,
    gstRate: 12,
    scheme: '10+1',
    stock: 14, // LOW STOCK TRIGGER FOR ALERT & AI
    reorderLevel: 100,
    productCode: 'SUN-AZT-500',
    barcode: '8901234567080',
    status: 'active',
  },
];

const initialOrders: Order[] = [
  {
    id: 'ord-101',
    orderNumber: 'KMA-ORD-2026-0042',
    date: '2026-10-02',
    time: '11:30 AM',
    staffId: 'st-1',
    staffName: 'Rahul Hegde',
    partyId: 'p-1',
    partyName: 'Shri Ganesh Medical & General Stores',
    partyAddress: 'Court Road, Sirsi',
    items: [
      {
        productId: 'prod-1',
        productName: 'Prohance Renal HP Powder 400g',
        companyName: 'Abbott Healthcare Pvt Ltd',
        packSize: '400g Tin',
        mrp: 1250,
        ptr: 990,
        quantity: 10,
        freeQuantity: 1,
        basicAmount: 9900,
        discountPercent: 0,
        gstRate: 18,
        gstAmount: 1782,
        netAmount: 11682,
      },
      {
        productId: 'prod-2',
        productName: 'Pantocid 40mg Tablet',
        companyName: 'Sun Pharmaceutical Industries Ltd',
        packSize: '15 Tablets (Strip)',
        mrp: 165,
        ptr: 130.95,
        quantity: 20,
        freeQuantity: 2,
        basicAmount: 2619,
        discountPercent: 0,
        gstRate: 12,
        gstAmount: 314.28,
        netAmount: 2933.28,
      },
    ],
    basicTotal: 12519,
    discountTotal: 0,
    gstTotal: 2096.28,
    grandTotal: 14615.28,
    gpsLatitude: 14.6192,
    gpsLongitude: 74.8354,
    status: 'Approved',
    remarks: 'Deliver by evening tempo batch. Urgent renal tins.',
    createdAt: '2026-10-02T11:30:00Z',
  },
  {
    id: 'ord-102',
    orderNumber: 'KMA-ORD-2026-0043',
    date: '2026-10-03',
    time: '02:15 PM',
    staffId: 'st-2',
    staffName: 'Santosh Naik',
    partyId: 'p-4',
    partyName: 'Sharada Medical Stores',
    partyAddress: 'Main Bazaar Road, Siddapur',
    items: [
      {
        productId: 'prod-6',
        productName: 'Moxikind-CV 625 Tablet',
        companyName: 'Mankind Pharma Ltd',
        packSize: '10 Tablets (Alu-Alu)',
        mrp: 204.5,
        ptr: 162.3,
        quantity: 30,
        freeQuantity: 3,
        basicAmount: 4869,
        discountPercent: 0,
        gstRate: 12,
        gstAmount: 584.28,
        netAmount: 5453.28,
      },
      {
        productId: 'prod-7',
        productName: 'Shelcal 500 Tablet',
        companyName: 'Torrent Pharmaceuticals Ltd',
        packSize: '15 Tablets (Strip)',
        mrp: 138,
        ptr: 109.5,
        quantity: 40,
        freeQuantity: 4,
        basicAmount: 4380,
        discountPercent: 0,
        gstRate: 12,
        gstAmount: 525.6,
        netAmount: 4905.6,
      },
    ],
    basicTotal: 9249,
    discountTotal: 0,
    gstTotal: 1109.88,
    grandTotal: 10358.88,
    gpsLatitude: 14.3411,
    gpsLongitude: 74.8879,
    status: 'Submitted',
    remarks: 'Dispatched with tomorrow morning Siddapur delivery vehicle.',
    createdAt: '2026-10-03T14:15:00Z',
  },
];

const initialPayments: Payment[] = [
  {
    id: 'pay-1',
    receiptNumber: 'KMA-RCP-8841',
    date: '2026-10-02',
    time: '03:45 PM',
    partyId: 'p-1',
    partyName: 'Shri Ganesh Medical & General Stores',
    staffId: 'st-1',
    staffName: 'Rahul Hegde',
    amount: 25000,
    mode: 'CHEQUE',
    outstandingBefore: 93450,
    outstandingAfter: 68450,
    chequeDetails: {
      chequeNumber: '004921',
      bankName: 'Karnataka Bank Ltd, Sirsi Branch',
      chequeDate: '2026-10-02',
      status: 'Received',
      remarks: 'Cheque handed over by Venkatesh Prabhu',
    },
    remarks: 'On-account payment against invoice INV-904',
    status: 'verified',
    createdAt: '2026-10-02T15:45:00Z',
  },
  {
    id: 'pay-2',
    receiptNumber: 'KMA-RCP-8842',
    date: '2026-10-03',
    time: '11:10 AM',
    partyId: 'p-3',
    partyName: 'Marikamba Medicals',
    staffId: 'st-1',
    staffName: 'Rahul Hegde',
    amount: 12000,
    mode: 'CASH',
    outstandingBefore: 46120,
    outstandingAfter: 34120,
    remarks: 'Cash collected by Rahul, verified at evening cash desk.',
    status: 'verified',
    createdAt: '2026-10-03T11:10:00Z',
  },
  {
    id: 'pay-3',
    receiptNumber: 'KMA-RCP-8843',
    date: '2026-10-03',
    time: '01:25 PM',
    partyId: 'p-2',
    partyName: 'City Hospital & 24x7 Pharmacy',
    staffId: 'st-1',
    staffName: 'Rahul Hegde',
    amount: 35000,
    mode: 'UPI',
    outstandingBefore: 183200,
    outstandingAfter: 148200,
    upiDetails: {
      transactionId: 'UPI/20261003/981273910291',
    },
    remarks: 'Hospital accountant scanned Kapila Medical Agencies QR.',
    status: 'verified',
    createdAt: '2026-10-03T13:25:00Z',
  },
];

const initialExpenses: Expense[] = [
  {
    id: 'exp-1',
    staffId: 'st-1',
    staffName: 'Rahul Hegde',
    date: '2026-10-03',
    category: 'Fuel',
    amount: 350,
    gstAmount: 0,
    location: 'Sirsi Town & Court Road Area',
    description: 'Bike petrol at Indian Oil, Hubli Road Sirsi (KA-31-EA-4521)',
    paymentMode: 'Cash',
    billNumber: 'IOC-88219',
    billPhotoUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=300&fit=crop',
    isAiExtracted: true,
    status: 'Pending Approval',
    createdAt: '2026-10-03T09:30:00Z',
  },
  {
    id: 'exp-2',
    staffId: 'st-2',
    staffName: 'Santosh Naik',
    date: '2026-10-02',
    category: 'Bus',
    amount: 140,
    location: 'Siddapur to Sirsi KSRTC Express',
    description: 'KSRTC bus ticket during sample delivery & collection',
    paymentMode: 'Cash',
    billNumber: 'TKT-99120',
    isAiExtracted: false,
    status: 'Approved',
    adminRemarks: 'Verified against tour log',
    createdAt: '2026-10-02T18:00:00Z',
  },
  {
    id: 'exp-3',
    staffId: 'st-1',
    staffName: 'Rahul Hegde',
    date: '2026-10-02',
    category: 'Food',
    amount: 120,
    location: 'Hotel Madhuvana, Sirsi',
    description: 'Lunch during Banavasi route customer visits',
    paymentMode: 'UPI',
    billNumber: 'HM-4102',
    isAiExtracted: true,
    status: 'Approved',
    createdAt: '2026-10-02T14:00:00Z',
  },
];

const initialVisits: PartyVisit[] = [
  {
    id: 'vis-1',
    staffId: 'st-1',
    staffName: 'Rahul Hegde',
    partyId: 'p-1',
    partyName: 'Shri Ganesh Medical & General Stores',
    date: '2026-10-03',
    time: '10:45 AM',
    gpsLatitude: 14.6192,
    gpsLongitude: 74.8354,
    gpsAccuracy: 8,
    partyLatitude: 14.6192,
    partyLongitude: 74.8354,
    distanceMeters: 12,
    isFarWarning: false,
    purpose: 'Stock audit & Prohance renal order follow-up',
    personMet: 'Venkatesh Prabhu (Proprietor)',
    discussion: 'Cheque cleared, placed order for 10 Abbott Prohance and 20 Pantocid strips.',
    orderBooked: true,
    paymentCollected: false,
    orderId: 'ord-101',
    followUpDate: '2026-10-10',
    remarks: 'Party requested extra promotional display poster for Abbott Nutrition.',
    createdAt: '2026-10-03T10:45:00Z',
  },
  {
    id: 'vis-2',
    staffId: 'st-1',
    staffName: 'Rahul Hegde',
    partyId: 'p-3',
    partyName: 'Marikamba Medicals',
    date: '2026-10-03',
    time: '11:10 AM',
    gpsLatitude: 14.6178,
    gpsLongitude: 74.8382,
    gpsAccuracy: 10,
    partyLatitude: 14.6178,
    partyLongitude: 74.8382,
    distanceMeters: 18,
    isFarWarning: false,
    purpose: 'Payment Collection & Montair LC enquiry',
    personMet: 'Sanjay Pai',
    discussion: 'Collected ₹12,000 cash. Stock for Asthalin Inhaler is sufficient.',
    orderBooked: false,
    paymentCollected: true,
    paymentId: 'pay-2',
    followUpDate: '2026-10-15',
    remarks: 'Friendly customer, good payment turnaround.',
    createdAt: '2026-10-03T11:10:00Z',
  },
  {
    id: 'vis-3',
    staffId: 'st-1',
    staffName: 'Rahul Hegde',
    partyId: 'p-2',
    partyName: 'City Hospital & 24x7 Pharmacy',
    date: '2026-10-03',
    time: '11:55 AM',
    gpsLatitude: 14.6227,
    gpsLongitude: 74.8412,
    gpsAccuracy: 12,
    partyLatitude: 14.6225,
    partyLongitude: 74.8410,
    distanceMeters: 28,
    isFarWarning: false,
    purpose: 'Hospital bulk tender enquiry & Azithral delivery',
    personMet: 'Dr. Ashok Hegde (Medical Supdt)',
    discussion: 'Reviewed ICU emergency supply contract. Booked order for 50 Shelcal and 30 Azithral.',
    orderBooked: true,
    paymentCollected: true,
    paymentId: 'pay-3',
    followUpDate: '2026-10-12',
    remarks: 'High value hospital client. Priority morning delivery requested.',
    createdAt: '2026-10-03T11:55:00Z',
  },
  {
    id: 'vis-4',
    staffId: 'st-1',
    staffName: 'Rahul Hegde',
    partyId: 'p-1',
    partyName: 'Kalyan Clinic & Pharmacy',
    date: '2026-10-03',
    time: '02:30 PM',
    gpsLatitude: 14.6148,
    gpsLongitude: 74.8288,
    gpsAccuracy: 15,
    partyLatitude: 14.6150,
    partyLongitude: 74.8290,
    distanceMeters: 35,
    isFarWarning: false,
    purpose: 'New Doctor introductory visit & sample kit handover',
    personMet: 'Dr. K. R. Nayak',
    discussion: 'Introduced Sun Pharma Azadin & Torrent cardio lines. Doctor agreed to prescribe Pantocid.',
    orderBooked: false,
    paymentCollected: false,
    followUpDate: '2026-10-18',
    remarks: 'Sample kit handed over. Doctor reception was positive.',
    createdAt: '2026-10-03T14:30:00Z',
  },
  {
    id: 'vis-5',
    staffId: 'st-2',
    staffName: 'Santosh Naik',
    partyId: 'p-4',
    partyName: 'Sharada Medical Stores',
    date: '2026-10-03',
    time: '10:15 AM',
    gpsLatitude: 14.3417,
    gpsLongitude: 74.8922,
    gpsAccuracy: 9,
    partyLatitude: 14.3415,
    partyLongitude: 74.8920,
    distanceMeters: 26,
    isFarWarning: false,
    purpose: 'Siddapur weekly route visit & payment cheque collection',
    personMet: 'Raghavendra Bhat',
    discussion: 'Collected pending cheque for ₹25,000. Booked replenishment order for Dolo 650.',
    orderBooked: true,
    paymentCollected: true,
    paymentId: 'pay-1',
    followUpDate: '2026-10-17',
    remarks: 'Consistent party in Siddapur bazaar.',
    createdAt: '2026-10-03T10:15:00Z',
  },
  {
    id: 'vis-6',
    staffId: 'st-2',
    staffName: 'Santosh Naik',
    partyId: 'p-4',
    partyName: 'Siddapur Taluka Hospital Pharmacy',
    date: '2026-10-03',
    time: '11:40 AM',
    gpsLatitude: 14.3462,
    gpsLongitude: 74.8953,
    gpsAccuracy: 14,
    partyLatitude: 14.3460,
    partyLongitude: 74.8950,
    distanceMeters: 38,
    isFarWarning: false,
    purpose: 'Government supply verification & institutional requirement',
    personMet: 'Chief Pharmacist Shridhar',
    discussion: 'Stocked surgical and antibiotic items. Requested quotation for Torrent line.',
    orderBooked: false,
    paymentCollected: false,
    followUpDate: '2026-10-14',
    remarks: 'Quotation to be emailed by accounts desk.',
    createdAt: '2026-10-03T11:40:00Z',
  },
  {
    id: 'vis-7',
    staffId: 'st-1',
    staffName: 'Rahul Hegde',
    partyId: 'p-1',
    partyName: 'Shri Ganesh Medical & General Stores',
    date: '2026-10-02',
    time: '10:30 AM',
    gpsLatitude: 14.6193,
    gpsLongitude: 74.8355,
    gpsAccuracy: 10,
    partyLatitude: 14.6192,
    partyLongitude: 74.8354,
    distanceMeters: 15,
    isFarWarning: false,
    purpose: 'Monthly statement review & payment reconciliation',
    personMet: 'Venkatesh Prabhu',
    discussion: 'Reconciled opening balance of ₹45,000.',
    orderBooked: false,
    paymentCollected: true,
    createdAt: '2026-10-02T10:30:00Z',
  },
  {
    id: 'vis-8',
    staffId: 'st-1',
    staffName: 'Rahul Hegde',
    partyId: 'p-3',
    partyName: 'Marikamba Medicals',
    date: '2026-10-02',
    time: '11:20 AM',
    gpsLatitude: 14.6179,
    gpsLongitude: 74.8384,
    gpsAccuracy: 8,
    partyLatitude: 14.6178,
    partyLongitude: 74.8382,
    distanceMeters: 24,
    isFarWarning: false,
    purpose: 'New scheme briefing (10+1 on Dolo & Pantocid)',
    personMet: 'Sanjay Pai',
    discussion: 'Briefed on Dussehra special scheme offerings.',
    orderBooked: true,
    paymentCollected: false,
    createdAt: '2026-10-02T11:20:00Z',
  },
];

const initialAttendance: AttendanceRecord[] = [
  {
    id: 'att-1',
    staffId: 'st-1',
    staffName: 'Rahul Hegde',
    date: '2026-10-03',
    startDayTime: '09:15 AM',
    startDayGps: { lat: 14.619, lng: 74.835 },
    status: 'Present',
    workingHours: 5.5,
  },
  {
    id: 'att-2',
    staffId: 'st-2',
    staffName: 'Santosh Naik',
    date: '2026-10-03',
    startDayTime: '09:30 AM',
    startDayGps: { lat: 14.341, lng: 74.887 },
    status: 'Present',
    workingHours: 5.2,
  },
];

const initialTours: TourPlan[] = [
  {
    id: 'tour-1',
    staffId: 'st-1',
    staffName: 'Rahul Hegde',
    date: '2026-10-03',
    area: 'Sirsi Town & Court Road Area',
    routeName: 'Route 1: Court Road -> Hubli Road -> Car Street',
    partyIds: ['p-1', 'p-2', 'p-3', 'p-5'],
    targetAmount: 50000,
    achievedAmount: 47000,
    visitedPartyIds: ['p-1', 'p-3'],
    status: 'In Progress',
  },
  {
    id: 'tour-2',
    staffId: 'st-2',
    staffName: 'Santosh Naik',
    date: '2026-10-03',
    area: 'Siddapur Market & Yellapur Cross',
    routeName: 'Route 2: Siddapur Bazaar -> Yellapur Junction',
    partyIds: ['p-4', 'p-6'],
    targetAmount: 35000,
    achievedAmount: 10358,
    visitedPartyIds: ['p-4'],
    status: 'In Progress',
  },
];

const initialFollowups: FollowUp[] = [
  {
    id: 'fu-1',
    partyId: 'p-2',
    partyName: 'City Hospital & 24x7 Pharmacy',
    staffId: 'st-1',
    staffName: 'Rahul Hegde',
    reason: 'Monthly hospital supply tender & balance payment verification',
    date: '2026-10-05',
    reminderTime: '11:00 AM',
    notes: 'Meet Medical Superintendent Dr. Ashok Hegde regarding IV fluids & surgical sutures requirement.',
    status: 'Pending',
  },
  {
    id: 'fu-2',
    partyId: 'p-4',
    partyName: 'Sharada Medical Stores',
    staffId: 'st-2',
    staffName: 'Santosh Naik',
    reason: 'Antibiotic scheme order booking',
    date: '2026-10-04',
    reminderTime: '02:00 PM',
    notes: 'Check Moxikind-CV 625 20+2 scheme requirement.',
    status: 'Pending',
  },
];

const initialNotifications: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'New Order Submitted',
    message: 'Rahul Hegde submitted order KMA-ORD-2026-0042 for Shri Ganesh Medicals (₹14,615.28)',
    type: 'order',
    timestamp: '2026-10-02T11:32:00Z',
    read: false,
  },
  {
    id: 'notif-2',
    title: 'Payment Received',
    message: '₹25,000 Cheque collected from Shri Ganesh Medicals by Rahul Hegde',
    type: 'payment',
    timestamp: '2026-10-02T15:46:00Z',
    read: false,
  },
  {
    id: 'notif-3',
    title: 'Low Stock Alert',
    message: 'Azithral 500mg Tablet stock is down to 14 units (Reorder level: 100 units)',
    type: 'stock',
    timestamp: '2026-10-03T08:00:00Z',
    read: false,
  },
];

const initialAuditLogs: AuditLog[] = [
  {
    id: 'aud-1',
    userId: 'u-1',
    userName: 'Suresh Bhat (Super Admin)',
    role: 'super_admin',
    timestamp: '2026-10-02T12:00:00Z',
    action: 'Approved Order KMA-ORD-2026-0042',
    entityType: 'Order',
    entityId: 'ord-101',
    previousValue: { status: 'Submitted' },
    newValue: { status: 'Approved' },
  },
  {
    id: 'aud-2',
    userId: 'u-2',
    userName: 'Ananth Hegde (Accounts)',
    role: 'accounts',
    timestamp: '2026-10-02T16:00:00Z',
    action: 'Logged Cheque Payment KMA-RCP-8841',
    entityType: 'Payment',
    entityId: 'pay-1',
    previousValue: null,
    newValue: { amount: 25000, mode: 'CHEQUE', chequeNo: '004921' },
  },
];

// Unified Centralized Database Engine
export class DatabaseService {
  private static instance: DatabaseService;
  private users: User[] = [];
  private staff: Staff[] = [];
  private parties: Party[] = [];
  private companies: Company[] = [];
  private products: Product[] = [];
  private orders: Order[] = [];
  private payments: Payment[] = [];
  private expenses: Expense[] = [];
  private visits: PartyVisit[] = [];
  private gpsLogs: GpsLog[] = [];
  private attendance: AttendanceRecord[] = [];
  private tours: TourPlan[] = [];
  private followups: FollowUp[] = [];
  private notifications: AppNotification[] = [];
  private auditLogs: AuditLog[] = [];
  private offlineQueue: OfflineSyncItem[] = [];
  private listeners: (() => void)[] = [];

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private loadFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        this.users = data.users || initialUsers;
        this.staff = data.staff || initialStaff;
        this.parties = data.parties || initialParties;
        this.companies = data.companies || initialCompanies;
        this.products = data.products || initialProducts;
        this.orders = data.orders || initialOrders;
        this.payments = data.payments || initialPayments;
        this.expenses = data.expenses || initialExpenses;
        this.visits = data.visits || initialVisits;
        this.gpsLogs = data.gpsLogs || [];
        this.attendance = data.attendance || initialAttendance;
        this.tours = data.tours || initialTours;
        this.followups = data.followups || initialFollowups;
        this.notifications = data.notifications || initialNotifications;
        this.auditLogs = data.auditLogs || initialAuditLogs;
      } else {
        this.resetToDefaults();
      }

      const queue = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (queue) {
        this.offlineQueue = JSON.parse(queue);
      }
    } catch (e) {
      console.error('Error loading db from storage:', e);
      this.resetToDefaults();
    }
  }

  public saveToStorage() {
    try {
      const data = {
        users: this.users,
        staff: this.staff,
        parties: this.parties,
        companies: this.companies,
        products: this.products,
        orders: this.orders,
        payments: this.payments,
        expenses: this.expenses,
        visits: this.visits,
        gpsLogs: this.gpsLogs,
        attendance: this.attendance,
        tours: this.tours,
        followups: this.followups,
        notifications: this.notifications,
        auditLogs: this.auditLogs,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(this.offlineQueue));
      this.notifyListeners();
    } catch (e) {
      console.error('Error saving db to storage:', e);
    }
  }

  public resetToDefaults() {
    this.users = [...initialUsers];
    this.staff = [...initialStaff];
    this.parties = [...initialParties];
    this.companies = [...initialCompanies];
    this.products = [...initialProducts];
    this.orders = [...initialOrders];
    this.payments = [...initialPayments];
    this.expenses = [...initialExpenses];
    this.visits = [...initialVisits];
    this.gpsLogs = [];
    this.attendance = [...initialAttendance];
    this.tours = [...initialTours];
    this.followups = [...initialFollowups];
    this.notifications = [...initialNotifications];
    this.auditLogs = [...initialAuditLogs];
    this.offlineQueue = [];
    this.saveToStorage();
  }

  public subscribe(callback: () => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((cb) => cb());
  }

  public logAudit(
    userId: string,
    userName: string,
    role: string,
    action: string,
    entityType: string,
    entityId: string,
    previousValue?: any,
    newValue?: any
  ) {
    const entry: AuditLog = {
      id: 'aud-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      userId,
      userName,
      role,
      timestamp: new Date().toISOString(),
      action,
      entityType,
      entityId,
      previousValue,
      newValue,
    };
    this.auditLogs.unshift(entry);
    this.saveToStorage();
    saveDocument('audit_logs', entry.id, entry).catch((e) => console.warn(e));
  }

  // --- Duplicate Detection Helpers ---
  public checkPartyDuplicate(
    name: string,
    mobile: string,
    gstin?: string,
    excludeId?: string
  ): { isDuplicate: boolean; matches: Party[] } {
    const normalizedName = name.trim().toLowerCase();
    const normalizedPhone = mobile.replace(/\D/g, '');
    const normalizedGst = gstin?.trim().toUpperCase();

    const matches = this.parties.filter((p) => {
      if (excludeId && p.id === excludeId) return false;
      const pPhone = p.mobile.replace(/\D/g, '');
      const pName = p.name.trim().toLowerCase();
      if (normalizedPhone && pPhone === normalizedPhone) return true;
      if (normalizedGst && p.gstin && p.gstin.trim().toUpperCase() === normalizedGst) return true;
      if (normalizedName && pName === normalizedName) return true;
      return false;
    });

    return {
      isDuplicate: matches.length > 0,
      matches,
    };
  }

  public checkProductDuplicate(name: string, companyId: string, excludeId?: string): { isDuplicate: boolean; matches: Product[] } {
    const norm = name.trim().toLowerCase();
    const matches = this.products.filter((p) => {
      if (excludeId && p.id === excludeId) return false;
      return p.companyId === companyId && p.name.trim().toLowerCase() === norm;
    });
    return {
      isDuplicate: matches.length > 0,
      matches,
    };
  }

  // --- Users & Staff ---
  public getUsers(): User[] {
    return this.users;
  }
  public getStaff(): Staff[] {
    return this.staff;
  }
  public getStaffById(id: string): Staff | undefined {
    return this.staff.find((s) => s.id === id);
  }
  public addStaff(staff: Staff, user: User) {
    this.staff.push(staff);
    this.users.push(user);
    this.logAudit(user.id, user.name, user.role, 'Self-registered Staff Profile', 'Staff', staff.id, null, staff);
    this.addNotification({
      id: 'notif-' + Date.now(),
      title: 'New Staff Profile Submitted',
      message: `${staff.fullName} submitted profile for admin verification`,
      type: 'system',
      timestamp: new Date().toISOString(),
      read: false,
    });
    this.saveToStorage();
    saveDocument('staff', staff.id, staff).catch((e) => console.warn(e));
    saveDocument('users', user.id, user).catch((e) => console.warn(e));
  }
  public updateStaffStatus(staffId: string, status: 'approved' | 'rejected', adminUser: User) {
    const s = this.staff.find((item) => item.id === staffId);
    if (s) {
      const prev = { status: s.status };
      s.status = status;
      this.logAudit(adminUser.id, adminUser.name, adminUser.role, `${status.toUpperCase()} Staff Profile: ${s.fullName}`, 'Staff', s.id, prev, { status });
      this.saveToStorage();
      saveDocument('staff', s.id, s).catch((e) => console.warn(e));
    }
  }

  // --- Parties ---
  public getParties(): Party[] {
    return this.parties;
  }
  public getPartyById(id: string): Party | undefined {
    return this.parties.find((p) => p.id === id);
  }
  public addParty(party: Party, currentUser: User): { success: boolean; error?: string } {
    const dupCheck = this.checkPartyDuplicate(party.name, party.mobile, party.gstin);
    this.parties.push(party);
    this.logAudit(currentUser.id, currentUser.name, currentUser.role, 'Created New Party: ' + party.name, 'Party', party.id, null, party);
    this.saveToStorage();
    saveDocument('parties', party.id, party).catch((e) => console.warn(e));
    return { success: true };
  }
  public updateParty(party: Party, currentUser: User) {
    const idx = this.parties.findIndex((p) => p.id === party.id);
    if (idx !== -1) {
      const prev = this.parties[idx];
      this.parties[idx] = party;
      this.logAudit(currentUser.id, currentUser.name, currentUser.role, 'Updated Party: ' + party.name, 'Party', party.id, prev, party);
      this.saveToStorage();
      saveDocument('parties', party.id, party).catch((e) => console.warn(e));
    }
  }

  // --- Products & Companies ---
  public getProducts(): Product[] {
    return this.products;
  }
  public getCompanies(): Company[] {
    return this.companies;
  }
  public addProduct(product: Product, currentUser: User) {
    this.products.push(product);
    this.logAudit(currentUser.id, currentUser.name, currentUser.role, 'Added Product: ' + product.name, 'Product', product.id, null, product);
    this.saveToStorage();
    saveDocument('products', product.id, product).catch((e) => console.warn(e));
  }
  public updateProduct(product: Product, currentUser: User) {
    const idx = this.products.findIndex((p) => p.id === product.id);
    if (idx !== -1) {
      const prev = this.products[idx];
      this.products[idx] = product;
      this.logAudit(currentUser.id, currentUser.name, currentUser.role, 'Updated Product: ' + product.name, 'Product', product.id, prev, product);
      this.saveToStorage();
      saveDocument('products', product.id, product).catch((e) => console.warn(e));
    }
  }
  public bulkImportProducts(newProducts: Product[], currentUser: User) {
    let addedCount = 0;
    let updatedCount = 0;
    newProducts.forEach((np) => {
      const existingIdx = this.products.findIndex(
        (p) => p.productCode.toLowerCase() === np.productCode.toLowerCase() || (p.name.toLowerCase() === np.name.toLowerCase() && p.companyId === np.companyId)
      );
      if (existingIdx !== -1) {
        this.products[existingIdx] = { ...this.products[existingIdx], ...np };
        updatedCount++;
      } else {
        this.products.push(np);
        addedCount++;
      }
      saveDocument('products', np.id, np).catch((e) => console.warn(e));
    });
    this.logAudit(
      currentUser.id,
      currentUser.name,
      currentUser.role,
      `Bulk Imported Products: ${addedCount} added, ${updatedCount} updated`,
      'Product',
      'bulk',
      null,
      { addedCount, updatedCount }
    );
    this.saveToStorage();
  }

  // --- Orders ---
  public getOrders(): Order[] {
    return this.orders;
  }
  public addOrder(order: Order, currentUser: User) {
    this.orders.unshift(order);
    // Deduct stock tentatively
    order.items.forEach((item) => {
      const p = this.products.find((prod) => prod.id === item.productId);
      if (p) {
        p.stock = Math.max(0, p.stock - (item.quantity + item.freeQuantity));
      }
    });
    this.logAudit(currentUser.id, currentUser.name, currentUser.role, 'Booked Order #' + order.orderNumber, 'Order', order.id, null, order);
    this.addNotification({
      id: 'notif-' + Date.now(),
      title: 'New Order Booked',
      message: `Order #${order.orderNumber} for ${order.partyName} (₹${order.grandTotal.toLocaleString('en-IN')})`,
      type: 'order',
      timestamp: new Date().toISOString(),
      read: false,
    });
    this.saveToStorage();
    // Real-time synchronization to Firebase Firestore
    saveDocument('orders', order.id, order).catch((err) => {
      console.warn('Firestore sync background note:', err);
    });
  }
  public updateOrderStatus(orderId: string, status: Order['status'], currentUser: User, note?: string) {
    const o = this.orders.find((ord) => ord.id === orderId);
    if (o) {
      const prev = { status: o.status };
      o.status = status;
      if (note) o.adminNote = note;
      this.logAudit(currentUser.id, currentUser.name, currentUser.role, `Updated Order #${o.orderNumber} status to ${status}`, 'Order', o.id, prev, { status, note });
      this.saveToStorage();
      // Real-time synchronization to Firebase Firestore
      saveDocument('orders', o.id, o).catch((err) => {
        console.warn('Firestore sync background note:', err);
      });
    }
  }

  // --- Payments & Collections ---
  public getPayments(): Payment[] {
    return this.payments;
  }
  public addPayment(payment: Payment, currentUser: User) {
    this.payments.unshift(payment);
    // Adjust party outstanding
    const party = this.parties.find((p) => p.id === payment.partyId);
    if (party) {
      party.currentOutstanding = Math.max(0, party.currentOutstanding - payment.amount);
    }
    this.logAudit(
      currentUser.id,
      currentUser.name,
      currentUser.role,
      `Collected Payment #${payment.receiptNumber} (${payment.mode} ₹${payment.amount.toLocaleString('en-IN')})`,
      'Payment',
      payment.id,
      null,
      payment
    );
    this.addNotification({
      id: 'notif-' + Date.now(),
      title: 'Payment Received',
      message: `₹${payment.amount.toLocaleString('en-IN')} via ${payment.mode} from ${payment.partyName}`,
      type: 'payment',
      timestamp: new Date().toISOString(),
      read: false,
    });
    this.saveToStorage();
    // Real-time synchronization to Firebase Firestore
    saveDocument('payments', payment.id, payment).catch((err) => {
      console.warn('Firestore sync background note:', err);
    });
  }
  public updateChequeStatus(paymentId: string, newStatus: ChequeDetails['status'], currentUser: User, remarks?: string) {
    const pay = this.payments.find((p) => p.id === paymentId);
    if (pay && pay.chequeDetails) {
      const prev = pay.chequeDetails.status;
      pay.chequeDetails.status = newStatus;
      if (remarks) pay.chequeDetails.remarks = remarks;
      if (newStatus === 'Cleared') {
        pay.chequeDetails.clearanceDate = new Date().toISOString().split('T')[0];
      }
      this.logAudit(currentUser.id, currentUser.name, currentUser.role, `Updated Cheque #${pay.chequeDetails.chequeNumber} status from ${prev} to ${newStatus}`, 'Payment', pay.id, { status: prev }, { status: newStatus });
      this.saveToStorage();
      saveDocument('payments', pay.id, pay).catch((e) => console.warn(e));
    }
  }

  // --- Expenses ---
  public getExpenses(): Expense[] {
    return this.expenses;
  }
  public addExpense(expense: Expense, currentUser: User) {
    this.expenses.unshift(expense);
    this.logAudit(currentUser.id, currentUser.name, currentUser.role, `Submitted Expense (${expense.category} ₹${expense.amount})`, 'Expense', expense.id, null, expense);
    this.addNotification({
      id: 'notif-' + Date.now(),
      title: 'New Expense Claim',
      message: `${expense.staffName} submitted ₹${expense.amount} for ${expense.category}`,
      type: 'expense',
      timestamp: new Date().toISOString(),
      read: false,
    });
    this.saveToStorage();
    saveDocument('expenses', expense.id, expense).catch((e) => console.warn(e));
  }
  public updateExpenseStatus(expenseId: string, status: Expense['status'], currentUser: User, remarks?: string) {
    const exp = this.expenses.find((e) => e.id === expenseId);
    if (exp) {
      const prev = exp.status;
      exp.status = status;
      if (remarks) exp.adminRemarks = remarks;
      this.logAudit(currentUser.id, currentUser.name, currentUser.role, `${status} Expense for ${exp.staffName} (₹${exp.amount})`, 'Expense', exp.id, { status: prev }, { status, remarks });
      this.saveToStorage();
      saveDocument('expenses', exp.id, exp).catch((e) => console.warn(e));
    }
  }

  // --- Visits ---
  public getVisits(): PartyVisit[] {
    return this.visits;
  }
  public addVisit(visit: PartyVisit, currentUser: User) {
    this.visits.unshift(visit);
    this.logAudit(currentUser.id, currentUser.name, currentUser.role, `Checked in at ${visit.partyName}`, 'Visit', visit.id, null, visit);
    this.saveToStorage();
    saveDocument('visits', visit.id, visit).catch((e) => console.warn(e));
  }

  // --- GPS Tracking & Attendance ---
  public getGpsLogs(): GpsLog[] {
    return this.gpsLogs;
  }
  public addGpsLog(log: GpsLog) {
    this.gpsLogs.unshift(log);
    // keep max 500 logs in storage
    if (this.gpsLogs.length > 500) {
      this.gpsLogs = this.gpsLogs.slice(0, 500);
    }
    this.saveToStorage();
    saveDocument('gps', log.id, log).catch((e) => console.warn(e));
  }
  public getAttendance(): AttendanceRecord[] {
    return this.attendance;
  }
  public markAttendance(record: AttendanceRecord) {
    const existing = this.attendance.find((a) => a.staffId === record.staffId && a.date === record.date);
    if (existing) {
      Object.assign(existing, record);
    } else {
      this.attendance.unshift(record);
    }
    this.saveToStorage();
    const docId = record.id || `${record.staffId}_${record.date}`;
    saveDocument('attendance', docId, record).catch((e) => console.warn(e));
  }

  // --- Tours & Followups ---
  public getTours(): TourPlan[] {
    return this.tours;
  }
  public addTour(tour: TourPlan, currentUser: User) {
    this.tours.unshift(tour);
    this.logAudit(currentUser.id, currentUser.name, currentUser.role, `Created Tour for ${tour.staffName} (${tour.area})`, 'Tour', tour.id, null, tour);
    this.saveToStorage();
    saveDocument('tours', tour.id, tour).catch((e) => console.warn(e));
  }
  public getFollowups(): FollowUp[] {
    return this.followups;
  }
  public addFollowup(fu: FollowUp, currentUser: User) {
    this.followups.unshift(fu);
    this.logAudit(currentUser.id, currentUser.name, currentUser.role, `Created Follow-up for ${fu.partyName}`, 'Followup', fu.id, null, fu);
    this.saveToStorage();
  }
  public updateFollowupStatus(id: string, status: FollowUp['status']) {
    const f = this.followups.find((fu) => fu.id === id);
    if (f) {
      f.status = status;
      this.saveToStorage();
    }
  }

  // --- Notifications & Audit ---
  public getNotifications(): AppNotification[] {
    return this.notifications;
  }
  public addNotification(n: AppNotification) {
    this.notifications.unshift(n);
    if (this.notifications.length > 100) this.notifications = this.notifications.slice(0, 100);
    this.saveToStorage();
  }
  public markNotificationRead(id: string) {
    const n = this.notifications.find((notif) => notif.id === id);
    if (n) {
      n.read = true;
      this.saveToStorage();
    }
  }
  public getAuditLogs(): AuditLog[] {
    return this.auditLogs;
  }

  // --- Offline Sync Queue ---
  public getOfflineQueue(): OfflineSyncItem[] {
    return this.offlineQueue;
  }
  public queueOfflineAction(type: OfflineSyncItem['type'], data: any) {
    const item: OfflineSyncItem = {
      id: 'off-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      type,
      data,
      queuedAt: new Date().toISOString(),
    };
    this.offlineQueue.push(item);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(this.offlineQueue));
    this.notifyListeners();
  }
  public syncOfflineQueue(currentUser: User): number {
    const count = this.offlineQueue.length;
    if (count === 0) return 0;

    this.offlineQueue.forEach((item) => {
      if (item.type === 'visit') {
        this.addVisit(item.data, currentUser);
      } else if (item.type === 'order') {
        this.addOrder(item.data, currentUser);
      } else if (item.type === 'payment') {
        this.addPayment(item.data, currentUser);
      } else if (item.type === 'expense') {
        this.addExpense(item.data, currentUser);
      } else if (item.type === 'gps') {
        this.addGpsLog(item.data);
      }
    });

    this.offlineQueue = [];
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify([]));
    this.saveToStorage();
    return count;
  }

  // --- Export Full Database for Backup ---
  public exportBackupJson(): string {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        business: {
          name: 'M/s. Kapila Medical Agencies, Sirsi',
          gstin: '29AABFK9897N1Z7',
        },
        data: {
          users: this.users,
          staff: this.staff,
          parties: this.parties,
          companies: this.companies,
          products: this.products,
          orders: this.orders,
          payments: this.payments,
          expenses: this.expenses,
          visits: this.visits,
          gpsLogs: this.gpsLogs,
          attendance: this.attendance,
          tours: this.tours,
          followups: this.followups,
          notifications: this.notifications,
          auditLogs: this.auditLogs,
        },
      },
      null,
      2
    );
  }

  // --- Restore Database from JSON ---
  public restoreBackupJson(jsonString: string, currentUser: User): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.data) {
        return { success: false, message: 'Invalid backup file structure: missing data key' };
      }
      const d = parsed.data;
      if (d.users) this.users = d.users;
      if (d.staff) this.staff = d.staff;
      if (d.parties) this.parties = d.parties;
      if (d.companies) this.companies = d.companies;
      if (d.products) this.products = d.products;
      if (d.orders) this.orders = d.orders;
      if (d.payments) this.payments = d.payments;
      if (d.expenses) this.expenses = d.expenses;
      if (d.visits) this.visits = d.visits;
      if (d.gpsLogs) this.gpsLogs = d.gpsLogs || [];
      if (d.attendance) this.attendance = d.attendance || [];
      if (d.tours) this.tours = d.tours || [];
      if (d.followups) this.followups = d.followups || [];
      if (d.notifications) this.notifications = d.notifications || [];
      if (d.auditLogs) this.auditLogs = d.auditLogs || [];

      this.logAudit(currentUser.id, currentUser.name, currentUser.role, 'Restored Database Backup', 'Database', 'all');
      this.saveToStorage();
      return { success: true, message: 'Database successfully restored from backup snapshot!' };
    } catch (e: any) {
      return { success: false, message: 'Failed to parse JSON backup: ' + e.message };
    }
  }

  // --- Sync Entire Seed/Master Dataset to Firebase Firestore ---
  public async syncAllToFirebase(): Promise<{ success: boolean; count: number; error?: string }> {
    let count = 0;
    try {
      console.log('Initiating full sync of Kapila Medical Agencies records to Firebase Firestore...');
      // 1. Sync Companies
      for (const comp of this.companies) {
        await saveDocument('companies', comp.id, comp);
        count++;
      }
      // 2. Sync Products
      for (const prod of this.products) {
        await saveDocument('products', prod.id, prod);
        count++;
      }
      // 3. Sync Parties
      for (const party of this.parties) {
        await saveDocument('parties', party.id, party);
        count++;
      }
      // 4. Sync Staff
      for (const st of this.staff) {
        await saveDocument('staff', st.id, st);
        count++;
      }
      // 5. Sync Users
      for (const u of this.users) {
        await saveDocument('users', u.id, u);
        count++;
      }
      // 6. Sync Initial Orders
      for (const ord of this.orders) {
        await saveDocument('orders', ord.id, ord);
        count++;
      }
      // 7. Sync Payments
      for (const pay of this.payments) {
        await saveDocument('payments', pay.id, pay);
        count++;
      }
      console.log(`Successfully synced ${count} documents to Firebase Firestore!`);
      localStorage.setItem('kma_firebase_seeded_v1', 'true');
      return { success: true, count };
    } catch (err: any) {
      console.error('Error during Firebase Firestore full sync:', err);
      return { success: false, count, error: err?.message || 'Sync error' };
    }
  }

  private unsubs: (() => void)[] = [];

  // --- Realtime Firestore Snapshot Listeners for Multi-User Live Sync ---
  public initRealtimeListeners() {
    if (this.unsubs.length > 0) return;

    try {
      // 1. Live Orders
      const unsubOrders = listenCollection<Order>('orders', (remoteOrders) => {
        if (remoteOrders && remoteOrders.length > 0) {
          const map = new Map<string, Order>();
          this.orders.forEach((o) => map.set(o.id, o));
          remoteOrders.forEach((ro) => map.set(ro.id, ro));
          this.orders = Array.from(map.values()).sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          this.saveToStorage();
        }
      });
      this.unsubs.push(unsubOrders);

      // 2. Live Payments & Collections
      const unsubPayments = listenCollection<Payment>('payments', (remotePayments) => {
        if (remotePayments && remotePayments.length > 0) {
          const map = new Map<string, Payment>();
          this.payments.forEach((p) => map.set(p.id, p));
          remotePayments.forEach((rp) => map.set(rp.id, rp));
          this.payments = Array.from(map.values()).sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          this.saveToStorage();
        }
      });
      this.unsubs.push(unsubPayments);

      // 3. Live Products Catalog
      const unsubProducts = listenCollection<Product>('products', (remoteProducts) => {
        if (remoteProducts && remoteProducts.length > 0) {
          const map = new Map<string, Product>();
          this.products.forEach((p) => map.set(p.id, p));
          remoteProducts.forEach((rp) => map.set(rp.id, rp));
          this.products = Array.from(map.values());
          this.saveToStorage();
        }
      });
      this.unsubs.push(unsubProducts);

      // 4. Live Parties / Chemists
      const unsubParties = listenCollection<Party>('parties', (remoteParties) => {
        if (remoteParties && remoteParties.length > 0) {
          const map = new Map<string, Party>();
          this.parties.forEach((p) => map.set(p.id, p));
          remoteParties.forEach((rp) => map.set(rp.id, rp));
          this.parties = Array.from(map.values());
          this.saveToStorage();
        }
      });
      this.unsubs.push(unsubParties);

      // 5. Live Field Visits
      const unsubVisits = listenCollection<PartyVisit>('visits', (remoteVisits) => {
        if (remoteVisits && remoteVisits.length > 0) {
          const map = new Map<string, PartyVisit>();
          this.visits.forEach((v) => map.set(v.id, v));
          remoteVisits.forEach((rv) => map.set(rv.id, rv));
          this.visits = Array.from(map.values()).sort(
            (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
          );
          this.saveToStorage();
        }
      });
      this.unsubs.push(unsubVisits);

      // 6. Live Expenses
      const unsubExpenses = listenCollection<Expense>('expenses', (remoteExpenses) => {
        if (remoteExpenses && remoteExpenses.length > 0) {
          const map = new Map<string, Expense>();
          this.expenses.forEach((e) => map.set(e.id, e));
          remoteExpenses.forEach((re) => map.set(re.id, re));
          this.expenses = Array.from(map.values()).sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          this.saveToStorage();
        }
      });
      this.unsubs.push(unsubExpenses);
    } catch (e) {
      console.warn('Realtime sync listener setup error:', e);
    }
  }

  // Automatically check if initial cloud seed is needed on app start
  public autoSeedFirebaseIfNeeded() {
    if (!localStorage.getItem('kma_firebase_seeded_v1')) {
      setTimeout(() => {
        this.syncAllToFirebase().catch((err) => {
          console.warn('Auto Firebase seed note:', err);
        });
      }, 1500);
    }
  }
}

export const db = DatabaseService.getInstance();
db.autoSeedFirebaseIfNeeded();
db.initRealtimeListeners();
