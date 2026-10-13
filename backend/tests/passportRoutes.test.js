
const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "test-only-secret-for-jest";

jest.mock("../models/User", () => ({
  findById: jest.fn(),
}));

const User = require("../models/User");
const passport = require("../config/passport");
const authRoutes = require("../routes/authRoutes");

const app = express();
app.use(express.json());
app.use(passport.initialize());
app.use("/api/auth", authRoutes);

describe("Passport JWT protected routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("allows access with a valid JWT", async () => {
    User.findById.mockResolvedValue({
      _id: "user-123",
      name: "Test User",
      email: "test@example.com",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const token = jwt.sign(
      { userId: "user-123" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.user.email).toBe("test@example.com");
  });

  test("rejects a request without a token", async () => {
    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);
    expect(User.findById).not.toHaveBeenCalled();
  });

  test("rejects an invalid JWT", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalid.token.value");

    expect(response.status).toBe(401);
    expect(User.findById).not.toHaveBeenCalled();
  });

  test("rejects an expired JWT", async () => {
    const token = jwt.sign(
      { userId: "user-123" },
      process.env.JWT_SECRET,
      { expiresIn: -1 }
    );

    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(401);
    expect(User.findById).not.toHaveBeenCalled();
  });
});