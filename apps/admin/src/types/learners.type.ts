import type { User } from "@learnbase/types";

export type { Role } from "@learnbase/types";

/** A learner is a User whose role is "Learner". */
export type Learner = User;

export interface LearnersResponse {
  success: boolean;
  count: number;
  learners: Learner[];
}

export interface LearnerResponse {
  success: boolean;
  learner: Learner;
}
