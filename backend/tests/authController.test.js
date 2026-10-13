
jest.mock("../models/User", () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
}));

jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
}));

const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  register,
  login,
  getProfile,
} = require("../controllers/authController");

const makeResponse = () => {
  const res = {};

  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);

  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
  process.env.JWT_SECRET = "test-only-secret-for-jest";
});

describe("TaskFlow authentication controller", () => {
  test("registers a new user", async () => {
    User.findOne.mockResolvedValue(null);

    User.create.mockResolvedValue({
      _id: "user-123",
      name: "Test User",
      email: "test@example.com",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const req = {
      body: {
        name: "Test User",
        email: "test@example.com",
        password: "TestPass123!",
      },
    };
    const res = makeResponse();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json.mock.calls[0][0].success).toBe(true);
    expect(User.create).toHaveBeenCalled();
  });

  test("rejects registration with an invalid email", async () => {
    const req = {
      body: {
        name: "Test User",
        email: "not-an-email",
        password: "TestPass123!",
      },
    };
    const res = makeResponse();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(User.create).not.toHaveBeenCalled();
  });

  test("logs in and returns a valid JWT", async () => {
    const user = {
      _id: "user-123",
      name: "Test User",
      email: "test@example.com",
      password: "mocked-password-hash",
    };

    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(user),
    });
    bcrypt.compare.mockResolvedValue(true);

    const req = {
      body: {
        email: "test@example.com",
        password: "TestPass123!",
      },
    };
    const res = makeResponse();

    await login(req, res);

    const response = res.json.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);
    expect(response.success).toBe(true);
    expect(typeof response.token).toBe("string");

    const decoded = jwt.verify(
      response.token,
      process.env.JWT_SECRET
    );

    expect(decoded.userId).toBe("user-123");
    expect(response.user.password).toBeUndefined();
  });

  test("rejects an incorrect password", async () => {
    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: "user-123",
        password: "mocked-password-hash",
      }),
    });
    bcrypt.compare.mockResolvedValue(false);

    const req = {
      body: {
        email: "test@example.com",
        password: "WrongPassword123!",
      },
    };
    const res = makeResponse();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json.mock.calls[0][0].message).toBe(
      "Invalid email or password"
    );
  });

  test("returns the authenticated user's profile", async () => {
    User.findById.mockResolvedValue({
      _id: "user-123",
      name: "Test User",
      email: "test@example.com",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const req = {
      user: { userId: "user-123" },
    };
    const res = makeResponse();

    await getProfile(req, res);

    expect(User.findById).toHaveBeenCalledWith("user-123");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].user.email).toBe(
      "test@example.com"
    );
  });
});