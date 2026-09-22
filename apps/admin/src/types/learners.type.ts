export interface LearnersResponse {
  success: boolean;
  count: number;
  learners: Learner[];
}

export interface Learner {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  isVerified: boolean;
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
  contact?: string;
  description?: string;
  disabled?: boolean;
  location?: string;
  profileImage?: string;
  verificationToken?: string;
  verificationTokenExpiresAt?: Date;
}

export enum Role {
  Learner = "Learner",
}

export interface LearnerResponse {
  success: boolean;
  learner: Learner;
}

export interface Learner {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  isVerified: boolean;
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
  contact?: string;
  description?: string;
  disabled?: boolean;
  location?: string;
  profileImage?: string;
  // ====================================
  amount?: number;
  gender?: string;
  course?: string;
}
