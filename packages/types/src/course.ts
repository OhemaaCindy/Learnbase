import type { User } from "./user.js";

/** The track as embedded in a course response — admin is an id here. */
export interface CourseTrackRef {
  _id: string;
  id: string;
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
}

export interface Course {
  _id: string;
  admin: User;
  track: CourseTrackRef;
  title: string;
  image: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

export interface CoursesResponse {
  success: boolean;
  count: number;
  courses: Course[];
}

export interface CourseResponse {
  success: boolean;
  course: Course;
}

export interface CourseMutationResponse {
  success: boolean;
  message: string;
  course: Course;
}
