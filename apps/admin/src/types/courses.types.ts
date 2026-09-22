export interface CoursesResponse {
  success: boolean;
  count: number;
  courses: Course[];
}

export interface Course {
  _id: string;
  admin: Admin;
  track: Track;
  title: string;
  image: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

export interface Admin {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  contact: string;
  isVerified: boolean;
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

export interface Track {
  _id: string;
  admin: string;
  name: string;
  price: number;
  instructor: string;
  duration: string;
  image: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
  id: string;
}

export interface AddCoursesResponse {
  success: boolean;
  message: string;
  course: Course;
}

export interface Course {
  _id: string;
  admin: Admin;
  track: Track;
  title: string;
  image: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

export interface Admin {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  contact: string;
  isVerified: boolean;
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

export interface Track {
  _id: string;
  admin: string;
  name: string;
  price: number;
  instructor: string;
  duration: string;
  image: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
  id: string;
}

export interface DeleteCourseResponse {
  success: boolean;
  message: string;
}

export interface UpdateCourseResponse {
  success: boolean;
  message: string;
  course: Course;
}

export interface Course {
  _id: string;
  admin: Admin;
  track: Track;
  title: string;
  image: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

export interface SingleCourseResponse {
  success: boolean;
  course: Course;
}

export interface Course {
  _id: string;
  admin: Admin;
  track: Track;
  title: string;
  image: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

export interface Admin {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  contact: string;
  isVerified: boolean;
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

export interface Track {
  _id: string;
  admin: string;
  name: string;
  price: number;
  instructor: string;
  duration: string;
  image: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
  id: string;
}
