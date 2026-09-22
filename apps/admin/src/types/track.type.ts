/* eslint-disable @typescript-eslint/no-explicit-any */
export interface TrackResponse {
  success: boolean;
  count: number;
  tracks: Track[];
}

export interface Track {
  _id: string;
  admin: Admin;
  name: string;
  price: number;
  instructor: string;
  duration: string;
  image: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
  courses: Course[];
  ratings: any[];
  id: string;
}

interface Admin {
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

interface Course {
  _id: string;
  admin: string;
  track: string;
  title: string;
  image: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

export interface SingleTrackResponse {
  success: boolean;
  track: Track;
}

export interface Track {
  _id: string;
  admin: Admin;
  name: string;
  price: number;
  instructor: string;
  duration: string;
  image: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
  courses: Course[];
  ratings: any[];
  id: string;
}

interface Admin {
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

interface Course {
  _id: string;
  admin: string;
  track: string;
  title: string;
  image: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

// export interface AddTrackType {
//   name: string;
//   price: string;
//   instructor: string;
//   duration: string;
//   description: string;
//   image: string;
// }
export interface AddTrackResponse {
  success: boolean;
  message: string;
  track: Track;
}

export interface Track {
  admin: Admin;
  name: string;
  price: number;
  instructor: string;
  duration: string;
  image: string;
  description: string;
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
  id: string;
}

export interface UpdateTrackResponse {
  success: boolean;
  message: string;
  track: Track;
}

export interface Track {
  _id: string;
  admin: Admin;
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

export interface DeleteTrackResponse {
  success: boolean;
  message: string;
}
