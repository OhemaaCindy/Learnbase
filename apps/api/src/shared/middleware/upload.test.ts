import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { uploadSingle } from "./upload.js";
import { errorHandler } from "./errorHandler.js";

function app() {
  const instance = express();
  instance.post("/upload", uploadSingle("profileImage"), (req, res) => {
    res.json({ success: true, size: req.file?.size ?? 0 });
  });
  instance.use(errorHandler);
  return instance;
}

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

describe("uploadSingle", () => {
  it("accepts a png within the size limit", async () => {
    const res = await request(app())
      .post("/upload")
      .attach("profileImage", PNG, { filename: "a.png", contentType: "image/png" });
    expect(res.status).toBe(200);
    expect(res.body.size).toBeGreaterThan(0);
  });

  it("rejects a non-image mime type with the error envelope", async () => {
    const res = await request(app())
      .post("/upload")
      .attach("profileImage", Buffer.from("not an image"), {
        filename: "a.txt",
        contentType: "text/plain",
      });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors[0].message).toMatch(/JPEG|PNG|image/i);
  });

  it("rejects a file over 1MB with the error envelope", async () => {
    const big = Buffer.alloc(1_100_000, 1);
    const res = await request(app())
      .post("/upload")
      .attach("profileImage", big, { filename: "big.png", contentType: "image/png" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors[0].message).toMatch(/1MB|large/i);
  });

  it("allows a request with no file at all", async () => {
    const res = await request(app()).post("/upload");
    expect(res.status).toBe(200);
    expect(res.body.size).toBe(0);
  });
});
