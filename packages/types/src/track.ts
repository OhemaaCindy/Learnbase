import type { User } from "./user.js";

export interface TrackRating {
  _id: string;
  learner: string;
  value: number;
  comment?: string;
  createdAt: Date;
}

/**
 * Track carries both `_id` and `id`. The `id` is Mongoose's virtual,
 * enabled via `toJSON: { virtuals: true }` on the track schema only —
 * Course and User do not have it. See spec §4.
 */
export interface Track {
  _id: string;
  id: string;
  admin: User;
  name: string;
  price: number;
  instructor: string;
  duration: string;
  image: string;
  description: string;
  courses: TrackCourseRef[];
  ratings: TrackRating[];
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

/** A course as embedded in a track response: refs are ids, not objects. */
export interface TrackCourseRef {
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

export interface TracksResponse {
  success: boolean;
  count: number;
  tracks: Track[];
}

export interface TrackResponse {
  success: boolean;
  track: Track;
}

export interface TrackMutationResponse {
  success: boolean;
  message: string;
  track: Track;
}
