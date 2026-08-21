
export type UserRole = 'job_seeker' | 'employer' | 'admin' | 'superadmin';
export type JobCategory = 'Staff' | 'Worker';
export type WorkType = 'Shift' | 'Piece Rate' | 'Full-time' | 'Part-time';

export interface User {
  userId: string;
  role: UserRole;
  name: string;
  phone: string;
  age?: number;
  gender?: string;
  location?: string;
  bio?: string;
  createdAt: string;
  memberSince: string;
}

export interface Reference {
  name: string;
  designation: string;
  company: string;
  contact: string;
}

export interface AcademicRecord {
  education: string;
  degree: string;
  institute: string;
  year: string;
  percentage: string;
}

export interface TenureRecord {
  name: string;
  position: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
}

export interface DigitalResume {
  personal: {
    fullName: string;
    gender: string;
    dob: string;
    age: string; 
    languages: string[];
    location: string;
    otherLocation?: string;
    mobile: string;
    hasTwoWheeler: boolean;
    profileImage?: string; // Base64 encoded image
    certificationAccepted: boolean;
  };
  academic: AcademicRecord[];
  professional: {
    totalExperience: string;
    noticePeriod: string;
    noticeDate?: string;
    coreSkills: string[];
    complianceKnowledge: string[]; 
    previousBrands: string;
    lastSalary: string;
    expectedSalary: string;
    bio?: string;
  };
  recentCompany: TenureRecord[];
  references: Reference[];
}

export interface JobSeekerProfile {
  userId: string;
  category: JobCategory;
  department: string;
  designation: string;
  experience: number;
  expectedSalary: number;
  workType: WorkType;
  accommodationNeeded: boolean;
  foodRequired: boolean;
  bio?: string;
  // Staff specific
  digitalResume?: DigitalResume;
  resumeUrl?: string;
}

export interface EmployerProfile {
  userId: string;
  companyName: string;
  companyLocation: string;
  contactPerson: string;
  isVerified: boolean;
  planType: 'basic' | 'growth' | 'pro' | 'enterprise';
  gstNumber: string;
  factoryPhotoUrl: string;
  companyLogo?: string;
  establishedYear: string;
  memberSince: string;
}

export interface JobListing {
  jobId: string;
  employerId: string;
  companyName: string;
  jobTitle: string;
  category: JobCategory;
  department: string;
  designation: string;
  salaryMin: number;
  salaryMax: number;
  location: string;
  latitude?: number;
  longitude?: number;
  openings: number;
  experienceRequired: number;
  genderPreference: 'any' | 'male' | 'female';
  accommodationProvided: boolean;
  foodProvided: boolean;
  shiftTiming: string;
  workType: WorkType;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'closed';
  createdAt: string;
  gstNumber?: string;
  factoryPhotoUrl?: string;
  companyLogo?: string;
  isEmployerVerified?: boolean;
  views: number;
  // New seeker experience fields
  distance?: number; 
  payoutSchedule: string; 
  benefits: {
    esi: boolean;
    epf: boolean;
    transport: boolean;
    bonus: string;
    teaCash: boolean;
  };
}

export interface Application {
  applicationId: string;
  jobId: string;
  jobSeekerId: string;
  employerId: string;
  status: 'applied' | 'shortlisted' | 'rejected' | 'hired';
  appliedAt: string;
  jobTitle?: string;
  seekerName?: string;
  experience?: string;
  phone?: string;
}

export interface Payment {
  paymentId: string;
  employerId: string;
  planType: string;
  amount: number;
  paymentStatus: 'pending' | 'success' | 'failed';
  razorpayPaymentId?: string;
  createdAt: string;
}
