/**
 * ─────────────────────────────────────────────────────────────────────────
 *  AuthService Unit Tests (ESM Mode)
 *
 *  • Every test logs its INPUT body and OUTPUT body to the console
 *  • External dependencies (repository, JWT utils) are mocked using
 *    jest.unstable_mockModule.
 *  • Core assertion: successful responses must NEVER contain
 *    `passwordHash` or `refreshToken` inside `userData`.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { jest } from '@jest/globals';

/* ── Module-level mocks for ESM ───────────────────────────────────────── */

const mockRepo = {
  findUserByToken: jest.fn(),
  update: jest.fn(),
};

jest.unstable_mockModule("../../../modules/users/repositories/user.repository.js", () => ({
  UserRepository: jest.fn().mockImplementation(() => mockRepo),
}));

jest.unstable_mockModule("../../../common/utils/jwt.util.js", () => ({
  generateAccessToken: jest.fn(() => "new-access-token"),
  generateRefreshToken: jest.fn(() => "new-refresh-token"),
  verifyRefreshToken: jest.fn((token) => {
    if (token === "invalid-token") {
      const err = new Error("invalid token");
      err.name = "JsonWebTokenError";
      throw err;
    }
    return { id: 1, email: "john@example.com", role: "member", iat: 123456, exp: 789012 };
  }),
}));

/* ── Dynamic Imports (MUST be after unstable_mockModule) ──────────────── */

const { AuthService } = await import("../../../modules/auth/services/auth.service.js");
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

function expectNoSensitiveFields(obj: Record<string, unknown>) {
  expect(obj).not.toHaveProperty("passwordHash");
  expect(obj).not.toHaveProperty("refreshToken");
}

/* ── Fake data ────────────────────────────────────────────────────────── */

const FAKE_DB_USER = {
  id: 1,
  email: "john@example.com",
  passwordHash: "$2b$10$hashedpassword",
  name: "John Doe",
  role: "member",
  active: true,
  refreshToken: "valid-old-token",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

/* ── Test suites ──────────────────────────────────────────────────────── */

let service: InstanceType<typeof AuthService>;

beforeEach(() => {
  jest.clearAllMocks();
  service = new AuthService();
});

describe("AuthService.refreshAccessToken()", () => {
  it("1 — should refresh token successfully and hide sensitive fields", async () => {
    mockRepo.findUserByToken.mockResolvedValue([FAKE_DB_USER]);
    mockRepo.update.mockResolvedValue([{ ...FAKE_DB_USER, refreshToken: "new-refresh-token" }]);

    const input = "valid-old-token";
    const result = await service.refreshAccessToken(input);

    logIO("refreshAccessToken — happy path", { refreshToken: input }, result);

    expect(result).toHaveProperty("accessToken", "new-access-token");
    expect(result).toHaveProperty("refreshToken", "new-refresh-token");
    expectNoSensitiveFields(result.userData as Record<string, unknown>);

    expect(mockRepo.findUserByToken).toHaveBeenCalledWith("valid-old-token");
    expect(mockRepo.update).toHaveBeenCalledWith(1, { refreshToken: "new-refresh-token" });
  });

  it("2 — should throw 401 if token is valid but not found in DB (revoked)", async () => {
    mockRepo.findUserByToken.mockResolvedValue([]);

    const input = "valid-old-token";
    let error: unknown;
    try {
      await service.refreshAccessToken(input);
    } catch (e) {
      error = e;
    }

    logIO("refreshAccessToken — token revoked", { refreshToken: input }, {
      error: (error as Error)?.message,
      statusCode: (error as any)?.statusCode,
    });

    expect(error).toBeInstanceOf(AppError);
    expect((error as any).statusCode).toBe(401);
    expect((error as Error).message).toBe("Refresh token is invalid or has been revoked");
  });

  it("3 — should propagate JWT errors directly if token is invalid", async () => {
    const input = "invalid-token";
    let error: unknown;
    try {
      await service.refreshAccessToken(input);
    } catch (e) {
      error = e;
    }

    logIO("refreshAccessToken — invalid token (JWT Error)", { refreshToken: input }, {
      errorName: (error as Error)?.name,
      errorMessage: (error as Error)?.message,
    });

    expect((error as Error).name).toBe("JsonWebTokenError");
    // Verify it never hit the database
    expect(mockRepo.findUserByToken).not.toHaveBeenCalled();
  });

  it("4 — should clean up `exp` and `iat` from payload before generating new tokens", async () => {
    mockRepo.findUserByToken.mockResolvedValue([FAKE_DB_USER]);
    mockRepo.update.mockResolvedValue([{ ...FAKE_DB_USER, refreshToken: "new-refresh-token" }]);

    const input = "valid-old-token";
    await service.refreshAccessToken(input);

    // Get the JWT module mocked functions
    const jwtUtil = await import("../../../common/utils/jwt.util.js");

    // Check what was passed to generateAccessToken
    const payloadPassed = (jwtUtil.generateAccessToken as jest.Mock).mock.calls[0][0];

    logIO("refreshAccessToken — payload cleanup", { refreshToken: input }, { payloadPassed });

    expect(payloadPassed).not.toHaveProperty("exp");
    expect(payloadPassed).not.toHaveProperty("iat");
    expect(payloadPassed).toHaveProperty("id", 1);
  });
});
