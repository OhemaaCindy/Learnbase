import type { User } from "@learnbase/types";

export type { Role } from "@learnbase/types";

/**
 * A learner is a User whose role is "Learner".
 *
 * `amount`, `gender` and `course` are not part of the shared API contract
 * and the new API will not return them. They stay here as optional because
 * the admin app still reads them from the existing Azure API until the
 * Phase 5 cutover. Remove them once that cutover lands.
 */
export type Learner = User & {
  amount?: number;
  gender?: string;
  course?: string;
};

export interface LearnersResponse {
  success: boolean;
  count: number;
  learners: Learner[];
}

export interface LearnerResponse {
  success: boolean;
  learner: Learner;
}
