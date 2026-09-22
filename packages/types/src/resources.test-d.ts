import { describe, it, expectTypeOf } from "vitest";
import type {
  Track,
  Course,
  Invoice,
  InvoiceStatus,
  TracksResponse,
  EnrollmentResponse,
} from "./index.js";

describe("Track contract", () => {
  it("carries both _id and the Mongoose id virtual", () => {
    expectTypeOf<Track>().toHaveProperty("_id").toEqualTypeOf<string>();
    expectTypeOf<Track>().toHaveProperty("id").toEqualTypeOf<string>();
  });

  it("prices tracks as a number", () => {
    expectTypeOf<Track>().toHaveProperty("price").toEqualTypeOf<number>();
  });

  it("returns a count alongside the list", () => {
    expectTypeOf<TracksResponse>().toHaveProperty("count").toEqualTypeOf<number>();
  });
});

describe("Course contract", () => {
  it("has only _id, unlike Track", () => {
    expectTypeOf<Course>().toHaveProperty("_id").toEqualTypeOf<string>();
    expectTypeOf<Course>().not.toHaveProperty("id");
  });
});

describe("Invoice contract", () => {
  it("allows a null learner for admin-raised invoices", () => {
    expectTypeOf<Invoice["learner"]>().toBeNullable();
  });

  it("constrains status to the three known states", () => {
    expectTypeOf<InvoiceStatus>().toEqualTypeOf<"pending" | "paid" | "unpaid">();
  });

  it("returns the payment URL as transactionUrl on enrollment", () => {
    expectTypeOf<EnrollmentResponse>()
      .toHaveProperty("transactionUrl")
      .toEqualTypeOf<string>();
  });
});
