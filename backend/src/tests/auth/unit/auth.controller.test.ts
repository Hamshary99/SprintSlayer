/**
 * ─────────────────────────────────────────────────────────────────────────
 *  AuthController Unit Tests (ESM Mode)
 *
 *  • Focuses on HTTP layer validation: bad inputs, cookie assignments,
 *    and error propagation.
 *  • We DO NOT mock the validator, we want to prove it throws on bad inputs.
 *  • External dependencies (UserService, AuthService, JWT utils) are mocked.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';

/* ── Module-level mocks for ESM ───────────────────────────────────────── */

const mockUserService = {
  create: jest.fn(),
  findByEmail: jest.fn(),
  revokeTokenFromUser: jest.fn(),
};

const mockAuthService = {
  refreshAccessToken: jest.fn(),
};

const mockJwtUtils = {
  setAccessTokenCookie: jest.fn(),
  setRefreshTokenCookie: jest.fn(),
  clearTokensCookies: jest.fn(),
};

jest.unstable_mockModule("../../../modules/users/services/user.service.js", () => ({
  userService: mockUserService,
  UserService: jest.fn(),
}));

jest.unstable_mockModule("../../../modules/auth/services/auth.service.js", () => ({
  authService: mockAuthService,
  AuthService: jest.fn(),
}));

jest.unstable_mockModule("../../../common/utils/jwt.util.js", () => mockJwtUtils);

/* ── Dynamic Imports (MUST be after unstable_mockModule) ──────────────── */

const { AuthController } = await import("../../../modules/auth/controllers/auth.controller.js");
const { AppError } = await import("../../../common/error/AppError.js");

/* ── Helpers ──────────────────────────────────────────────────────────── */

function logIO(label: string, input: unknown, output: unknown) {
  console.log(`\n╔══════════════════════════════════════════════════════════`);
  console.log(`║ TEST: ${label}`);
  console.log(`╠══ INPUT BODY ════════════════════════════════════════════`);
  console.log(JSON.stringify(input, null, 2));
  console.log(`╠══ OUTPUT BODY ═══════════════════════════════════════════`);
  console.log(JSON.stringify(output, null, 2));
  console.log(`╚══════════════════════════════════════════════════════════\n`);
}

function mockResponse() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res) as any;
  res.json = jest.fn().mockReturnValue(res) as any;
  return res as Response;
}

/* ── Test suites ──────────────────────────────────────────────────────── */

let controller: InstanceType<typeof AuthController>;
let req: Partial<Request>;
let res: Response;
let next: jest.MockedFunction<NextFunction>;

beforeEach(() => {
  jest.clearAllMocks();
  // Using the mocked instances
  controller = new AuthController(mockAuthService as any, mockUserService as any);
  req = { body: {}, cookies: {} };
  res = mockResponse();
  next = jest.fn();
});

describe("AuthController.register()", () => {
  it("1 — should register successfully, set cookies, and return 201", async () => {
    req.body = {
      email: "valid@example.com",
      passwordHash: "Str0ngPass1",
      name: "Valid User",
    };

    const mockResult = {
      userData: { id: 1, email: "valid@example.com" },
      accessToken: "access-token-123",
      refreshToken: "refresh-token-123",
    };
    mockUserService.create.mockResolvedValue(mockResult);

    await controller.register(req as Request, res, next);

    logIO("register — happy path", req.body, (res.json as jest.Mock).mock.calls[0]?.[0]);

    expect(mockJwtUtils.setAccessTokenCookie).toHaveBeenCalledWith(res, "access-token-123");
    expect(mockJwtUtils.setRefreshTokenCookie).toHaveBeenCalledWith(res, "refresh-token-123");
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ user: mockResult.userData });
  });

  it("2 — Validation Error: should throw 400 when password is weak", async () => {
    req.body = {
      email: "valid@example.com",
      passwordHash: "weak", // <--- BAD INPUT
      name: "Valid User",
    };

    await controller.register(req as Request, res, next);

    const errorArg = next.mock.calls[0][0] as any;
    logIO("register — weak password validation", req.body, { error: errorArg?.message, statusCode: errorArg?.statusCode });

    expect(next).toHaveBeenCalled();
    expect(errorArg).toBeInstanceOf(AppError);
    expect(errorArg.statusCode).toBe(400);
    expect(errorArg.message).toContain("Password must be at least 8 characters long");
  });

  it("3 — Validation Error: should throw 400 when email is invalid", async () => {
    req.body = {
      email: "not-an-email", // <--- BAD INPUT
      passwordHash: "Str0ngPass1",
      name: "Valid User",
    };

    await controller.register(req as Request, res, next);

    const errorArg = next.mock.calls[0][0] as any;
    logIO("register — invalid email validation", req.body, { error: errorArg?.message, statusCode: errorArg?.statusCode });

    expect(next).toHaveBeenCalled();
    expect(errorArg).toBeInstanceOf(AppError);
    expect(errorArg.statusCode).toBe(400);
    expect(errorArg.message).toContain("email must be an email");
  });
});

describe("AuthController.login()", () => {
  it("4 — should login successfully, set cookies, and return 200", async () => {
    req.body = {
      email: "valid@example.com",
      passwordHash: "Str0ngPass1",
    };

    const mockResult = {
      userData: { id: 1, email: "valid@example.com" },
      accessToken: "access-token-123",
      refreshToken: "refresh-token-123",
    };
    mockUserService.findByEmail.mockResolvedValue(mockResult);

    await controller.login(req as Request, res, next);

    logIO("login — happy path", req.body, (res.json as jest.Mock).mock.calls[0]?.[0]);

    expect(mockJwtUtils.setAccessTokenCookie).toHaveBeenCalledWith(res, "access-token-123");
    expect(mockJwtUtils.setRefreshTokenCookie).toHaveBeenCalledWith(res, "refresh-token-123");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ user: mockResult.userData });
  });

  it("5 — Validation Error: should throw 400 when fields are missing", async () => {
    req.body = {
      email: "valid@example.com",
      // missing password
    };

    await controller.login(req as Request, res, next);

    const errorArg = next.mock.calls[0][0] as any;
    logIO("login — missing fields validation", req.body, { error: errorArg?.message, statusCode: errorArg?.statusCode });

    expect(next).toHaveBeenCalled();
    expect(errorArg).toBeInstanceOf(AppError);
    expect(errorArg.statusCode).toBe(400);
    expect(errorArg.message).toContain("Password is required");
  });

  it("6 — should propagate service errors (like 401 Wrong credentials)", async () => {
    req.body = {
      email: "valid@example.com",
      passwordHash: "Str0ngPass1",
    };

    const serviceError = new AppError("Invalid credentials", 401);
    mockUserService.findByEmail.mockRejectedValue(serviceError);

    await controller.login(req as Request, res, next);

    const errorArg = next.mock.calls[0][0] as any;
    logIO("login — wrong credentials (401 from service)", req.body, { error: errorArg?.message, statusCode: errorArg?.statusCode });

    expect(next).toHaveBeenCalledWith(serviceError);
  });
});

describe("AuthController.refresh()", () => {
  it("7 — should refresh successfully, set new cookies, and return 200", async () => {
    req.cookies = { refresh_token: "old-refresh-token" };

    const mockResult = {
      userData: { id: 1 },
      accessToken: "new-access",
      refreshToken: "new-refresh",
    };
    mockAuthService.refreshAccessToken.mockResolvedValue(mockResult);

    await controller.refresh(req as Request, res, next);

    logIO("refresh — happy path", req.cookies, (res.json as jest.Mock).mock.calls[0]?.[0]);

    expect(mockAuthService.refreshAccessToken).toHaveBeenCalledWith("old-refresh-token");
    expect(mockJwtUtils.setAccessTokenCookie).toHaveBeenCalledWith(res, "new-access");
    expect(mockJwtUtils.setRefreshTokenCookie).toHaveBeenCalledWith(res, "new-refresh");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ user: mockResult.userData });
  });

  it("8 — should throw 401 if refresh cookie is missing", async () => {
    req.cookies = {}; // missing refresh_token

    await controller.refresh(req as Request, res, next);

    const errorArg = next.mock.calls[0][0] as any;
    logIO("refresh — missing cookie", req.cookies, { error: errorArg?.message, statusCode: errorArg?.statusCode });

    expect(next).toHaveBeenCalled();
    expect(errorArg).toBeInstanceOf(AppError);
    expect(errorArg.statusCode).toBe(401);
    expect(errorArg.message).toBe("Refresh token is required");
  });
});

describe("AuthController.logout()", () => {
  it("9 — should clear cookies and revoke token in DB if user is attached", async () => {
    req.cookies = { refresh_token: "active-token" };
    req.user = { id: 1, role: "member", email: "test@example.com" }; // User attached by auth middleware usually

    await controller.logout(req as Request, res, next);

    logIO("logout — happy path", req.cookies, (res.json as jest.Mock).mock.calls[0]?.[0]);

    expect(mockUserService.revokeTokenFromUser).toHaveBeenCalledWith(1, "active-token");
    expect(mockJwtUtils.clearTokensCookies).toHaveBeenCalledWith(res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("10 — should throw 401 if refresh cookie is missing on logout", async () => {
    req.cookies = {};

    await controller.logout(req as Request, res, next);

    const errorArg = next.mock.calls[0][0] as any;
    logIO("logout — missing cookie", req.cookies, { error: errorArg?.message, statusCode: errorArg?.statusCode });

    expect(next).toHaveBeenCalled();
    expect(errorArg).toBeInstanceOf(AppError);
    expect(errorArg.statusCode).toBe(401);
    expect(errorArg.message).toBe("No active session");
  });
});
