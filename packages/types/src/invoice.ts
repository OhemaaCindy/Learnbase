import type { User } from "./user.js";
import type { CourseTrackRef } from "./course.js";

export type InvoiceStatus = "pending" | "paid" | "unpaid";

/**
 * `learner` is nullable: an admin can raise an invoice directly rather
 * than a learner self-enrolling. See spec §4.
 */
export interface Invoice {
  _id: string;
  learner: User | null;
  track: CourseTrackRef;
  amount: number;
  status: InvoiceStatus;
  dueDate: Date;
  paystackReference: string;
  paystackTransactionId?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

export interface InvoicesResponse {
  success: boolean;
  count: number;
  invoices: Invoice[];
}

/**
 * Admin invoice creation returns the payment URL nested under `data` as
 * `paystackPaymentUrl`, while enrollment returns it flat as
 * `transactionUrl`. Inconsistent, but it is what both apps read today.
 * See spec §6.
 */
export interface CreateInvoiceResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    amount: number;
    dueDate: string;
    status?: InvoiceStatus;
    paymentDetails?: string;
    paystackPaymentUrl: string;
  };
}

export interface EnrollmentPayload {
  track: string;
  amount: number;
  paystackCallbackUrl: string;
}

export interface EnrollmentResponse {
  success: boolean;
  message: string;
  transactionUrl: string;
  invoice: Invoice;
}
