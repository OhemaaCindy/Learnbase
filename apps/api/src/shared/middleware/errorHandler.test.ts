import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { ZodError, z } from "zod";
import mongoose from "mongoose";
import { AppError } from "../errors/AppError.js";
import { errorHandler } from "./errorHandler.js";
import { createApp } from "../../app.js";

function appThatThrows(error: unknown) {
  const app = express();
  app.get("/boom", () => {
    throw error;
  });
  app.use(errorHandler);
  return app;
}

describe("errorHandler", () => {
  it("renders an AppError with its own status code", async () => {
    const res = await request(appThatThrows(new AppError("Track not found", 404)))
      .get("/boom");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      errors: [{ message: "Track not found" }],
    });
  });

  it("renders every zod issue as its own error entry", async () => {
    const schema = z.object({ email: z.string(), age: z.number() });
    let zodError: ZodError;
    try {
      schema.parse({});
      throw new Error("schema should have rejected");
    } catch (err) {
      zodError = err as ZodError;
    }

    const res = await request(appThatThrows(zodError)).get("/boom");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toHaveLength(2);
    expect(res.body.errors[0]).toHaveProperty("message");
  });

  it("turns a malformed object id into a 400", async () => {
    const castError = new mongoose.Error.CastError("ObjectId", "nope", "_id");

    const res = await request(appThatThrows(castError)).get("/boom");

    expect(res.status).toBe(400);
    expect(res.body.errors[0].message).toContain("Invalid");
  });

  it("turns a mongoose validation error into a 400 with one entry per field", async () => {
    const schema = new mongoose.Schema({
      email: { type: String, required: true },
      age: { type: Number, required: true },
    });
    const Model =
      mongoose.models.ErrorHandlerTestModel ??
      mongoose.model("ErrorHandlerTestModel", schema);
    const doc = new Model({});
    const validationError = doc.validateSync();
    if (!validationError) {
      throw new Error("expected validateSync to produce a ValidationError");
    }

    const res = await request(appThatThrows(validationError)).get("/boom");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toHaveLength(2);
  });

  it("turns a duplicate key violation into a 409", async () => {
    const duplicate = Object.assign(new Error("E11000 duplicate key"), {
      code: 11000,
      keyValue: { email: "taken@example.com" },
    });

    const res = await request(appThatThrows(duplicate)).get("/boom");

    expect(res.status).toBe(409);
    expect(res.body.errors[0].message).toContain("email");
  });

  it("hides the details of an unexpected failure", async () => {
    const res = await request(appThatThrows(new Error("connection string leaked")))
      .get("/boom");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      success: false,
      errors: [{ message: "Something went wrong" }],
    });
  });
});

describe("notFound", () => {
  it("returns the error envelope for an unknown route", async () => {
    const res = await request(createApp()).get("/api/does-not-exist");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.errors[0].message).toContain("not found");
  });
});
