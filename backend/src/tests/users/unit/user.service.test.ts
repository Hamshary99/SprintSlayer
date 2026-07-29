/**
 * ─────────────────────────────────────────────────────────────────────────
 *  UserService Unit Tests (ESM Mode)
 *
 *  • Every test logs its INPUT body and OUTPUT body to the console
 *    so reviewers / assigners can inspect payloads in the terminal.
 *  • All external dependencies (repository, bcrypt utils, JWT utils)
 *    are mocked using jest.unstable_mockModule for ESM support.
 *  • Core assertion: successful responses must NEVER contain
 *    `passwordHash` or `refreshToken` inside `userData`.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { jest } from '@jest/globals';

/* ── Module-level mocks for ESM ───────────────────────────────────────── */

const mockRepo = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  update: jest.fn(),
  deleteUser: jest.fn(),
};

// In ESM, we use unstable_mockModule and exact paths ending with .js
jest.unstable_mockModule("../../../modules/users/repositories/user.repository.js", () => ({
  UserRepository: jest.fn().mockImplementation(() => mockRepo),
}));

jest.unstable_mockModule("../../../modules/users/utils/password.hash.util.js", () => ({
  hashPassword: jest.fn(async (pw: string) => `hashed_${pw}`),
  comparePassword: jest.fn(async (_pw: string, _hash: string) => true),
}));

jest.unstable_mockModule("../../../common/utils/jwt.util.js", () => ({
  generateAccessToken: jest.fn(() => "access-token-xyz"),
  generateRefreshToken: jest.fn(() => "refresh-token-xyz"),
}));

/* ── Dynamic Imports (MUST be after unstable_mockModule) ──────────────── */

const { UserService } = await import("../../../modules/users/services/user.service.js");
const { AppError } = await import("../../../common/error/AppError.js");
const { comparePassword } = await import("../../../modules/users/utils/password.hash.util.js");

/* ── Helpers ──────────────────────────────────────────────────────────── */

/**
 * Pretty-prints the input and output for every test so reviewers can
 * see exactly what went in and came out.
 */
function logIO(label: string, input: unknown, output: unknown) {
  console.log(`\n╔══════════════════════════════════════════════════════════`);
  console.log(`║ TEST: ${label}`);
  console.log(`╠══ INPUT BODY ════════════════════════════════════════════`);
  console.log(JSON.stringify(input, null, 2));
  console.log(`╠══ OUTPUT BODY ═══════════════════════════════════════════`);
  console.log(JSON.stringify(output, null, 2));
  console.log(`╚══════════════════════════════════════════════════════════\n`);
}

/** Asserts that an object does NOT contain passwordHash or refreshToken. */
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
  refreshToken: "old-refresh-token",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

/* ── Test suites ──────────────────────────────────────────────────────── */

let service: InstanceType<typeof UserService>;

beforeEach(() => {
  jest.clearAllMocks();
  service = new UserService();
});

// =====================================================================
//  CREATE
// =====================================================================

describe("UserService.create()", () => {
  const createInput = {
    email: "jane@example.com",
    passwordHash: "Str0ngPass1",
    name: "Jane Doe",
    role: "member" as const,
  };

  it("1 — should create a new user and hide passwordHash & refreshToken", async () => {
    mockRepo.findByEmail.mockResolvedValue([]); // no duplicate
    mockRepo.create.mockResolvedValue([{ ...FAKE_DB_USER, ...createInput, id: 2 }]);
    mockRepo.update.mockResolvedValue([{ ...FAKE_DB_USER, ...createInput, id: 2, refreshToken: "refresh-token-xyz" }]);

    const result = await service.create(createInput);

    logIO("create — happy path", createInput, result);

    // Must have tokens at the top level
    expect(result).toHaveProperty("accessToken", "access-token-xyz");
    expect(result).toHaveProperty("refreshToken", "refresh-token-xyz");

    // userData must NOT leak sensitive fields
    expectNoSensitiveFields(result.userData as Record<string, unknown>);

    // Verify repo was called
    expect(mockRepo.findByEmail).toHaveBeenCalledWith("jane@example.com");
    expect(mockRepo.create).toHaveBeenCalled();
  });

  it("2 — should throw 409 when email already exists", async () => {
    mockRepo.findByEmail.mockResolvedValue([FAKE_DB_USER]); // duplicate!

    let error: unknown;
    try {
      await service.create(createInput);
    } catch (e) {
      error = e;
    }

    logIO("create — duplicate email", createInput, {
      error: (error as Error)?.message,
      statusCode: (error as any)?.statusCode,
    });

    expect(error).toBeInstanceOf(AppError);
    expect((error as any).statusCode).toBe(409);
    expect((error as Error).message).toBe("User already exists");
  });

  it("3 — should still hash the password even with minimal valid fields", async () => {
    const minimalInput = {
      email: "min@example.com",
      passwordHash: "Ab1cdefg",
      name: "Min",
      role: "member" as const,
    };
    mockRepo.findByEmail.mockResolvedValue([]);
    mockRepo.create.mockResolvedValue([{ ...FAKE_DB_USER, ...minimalInput, id: 3 }]);
    mockRepo.update.mockResolvedValue([{ ...FAKE_DB_USER, ...minimalInput, id: 3 }]);

    const result = await service.create(minimalInput);

    logIO("create — minimal fields", minimalInput, result);

    const { hashPassword } = await import("../../../modules/users/utils/password.hash.util.js");
    expect(hashPassword).toHaveBeenCalledWith("Ab1cdefg");
    expectNoSensitiveFields(result.userData as Record<string, unknown>);
  });
});

// =====================================================================
//  FIND ALL
// =====================================================================

describe("UserService.findAll()", () => {
  it("4 — should return users list without passwordHash or refreshToken", async () => {
    const dbUsers = [FAKE_DB_USER, { ...FAKE_DB_USER, id: 2, email: "two@example.com" }];
    mockRepo.findAll.mockResolvedValue(dbUsers);

    const input = { page: 1, limit: 10, role: undefined };
    const result = await service.findAll(input.page, input.limit, input.role);

    logIO("findAll — happy path", input, result);

    expect(result).toHaveLength(2);
    result.forEach((user: Record<string, unknown>) => expectNoSensitiveFields(user));
  });

  it("5 — should return empty array when no users exist", async () => {
    mockRepo.findAll.mockResolvedValue([]);

    const input = { page: 1, limit: 10 };
    const result = await service.findAll(input.page, input.limit);

    logIO("findAll — empty", input, result);

    expect(result).toEqual([]);
  });

  it("6 — should forward pagination and role params to repository", async () => {
    mockRepo.findAll.mockResolvedValue([]);

    const input = { page: 3, limit: 5, role: "admin" };
    await service.findAll(input.page, input.limit, input.role);

    logIO("findAll — pagination params", input, "void (checking repo call args)");

    expect(mockRepo.findAll).toHaveBeenCalledWith(3, 5, "admin", undefined, undefined, undefined);
  });
});

// =====================================================================
//  FIND BY ID
// =====================================================================

describe("UserService.findById()", () => {
  it("7 — should return a single user without passwordHash or refreshToken", async () => {
    mockRepo.findById.mockResolvedValue([FAKE_DB_USER]);

    const input = { id: 1 };
    const result = await service.findById(input.id);

    logIO("findById — happy path", input, result);

    expectNoSensitiveFields(result as Record<string, unknown>);
    expect(result).toHaveProperty("id", 1);
    expect(result).toHaveProperty("email", "john@example.com");
  });

  it("8 — should throw 404 when user is not found", async () => {
    mockRepo.findById.mockResolvedValue([]);

    const input = { id: 999 };
    let error: unknown;
    try {
      await service.findById(input.id);
    } catch (e) {
      error = e;
    }

    logIO("findById — not found", input, {
      error: (error as Error)?.message,
      statusCode: (error as any)?.statusCode,
    });

    expect(error).toBeInstanceOf(AppError);
    expect((error as any).statusCode).toBe(404);
  });
});

// =====================================================================
//  FIND BY EMAIL (LOGIN)
// =====================================================================

describe("UserService.findByEmail() (login)", () => {
  const loginInput = { email: "john@example.com", passwordHash: "Str0ngPass1" };

  it("9 — should return user without sensitive fields + tokens on correct credentials", async () => {
    mockRepo.findByEmail.mockResolvedValue([FAKE_DB_USER]);
    (comparePassword as jest.Mock).mockResolvedValue(true);
    mockRepo.update.mockResolvedValue([{ ...FAKE_DB_USER, refreshToken: "refresh-token-xyz" }]);

    const result = await service.findByEmail(loginInput);

    logIO("findByEmail — happy path", loginInput, result);

    expect(result).toHaveProperty("accessToken", "access-token-xyz");
    expect(result).toHaveProperty("refreshToken", "refresh-token-xyz");
    expectNoSensitiveFields(result.userData as Record<string, unknown>);
  });

  it("10 — should throw 401 when user does not exist", async () => {
    mockRepo.findByEmail.mockResolvedValue([]);

    let error: unknown;
    try {
      await service.findByEmail(loginInput);
    } catch (e) {
      error = e;
    }

    logIO("findByEmail — user not found", loginInput, {
      error: (error as Error)?.message,
      statusCode: (error as any)?.statusCode,
    });

    expect(error).toBeInstanceOf(AppError);
    expect((error as any).statusCode).toBe(401);
    expect((error as Error).message).toBe("Invalid credentials");
  });

  it("11 — should throw 401 when password is wrong", async () => {
    mockRepo.findByEmail.mockResolvedValue([FAKE_DB_USER]);
    (comparePassword as jest.Mock).mockResolvedValue(false);

    let error: unknown;
    try {
      await service.findByEmail(loginInput);
    } catch (e) {
      error = e;
    }

    logIO("findByEmail — wrong password", loginInput, {
      error: (error as Error)?.message,
      statusCode: (error as any)?.statusCode,
    });

    expect(error).toBeInstanceOf(AppError);
    expect((error as any).statusCode).toBe(401);
    expect((error as Error).message).toBe("Invalid credentials");
  });
});

// =====================================================================
//  UPDATE
// =====================================================================

describe("UserService.update()", () => {
  it("12 — should update user and hide passwordHash & refreshToken", async () => {
    mockRepo.findById.mockResolvedValue([FAKE_DB_USER]);
    const updatedUser = { ...FAKE_DB_USER, name: "John Updated" };
    mockRepo.update.mockResolvedValue([updatedUser]);

    const input = { id: 1, data: { name: "John Updated" } };
    const result = await service.update(input.id, input.data);

    logIO("update — happy path", input, result);

    expectNoSensitiveFields(result as Record<string, unknown>);
    expect(result).toHaveProperty("name", "John Updated");
  });

  it("13 — should throw 404 when user does not exist", async () => {
    mockRepo.findById.mockResolvedValue([]);

    const input = { id: 999, data: { name: "Ghost" } };
    let error: unknown;
    try {
      await service.update(input.id, input.data);
    } catch (e) {
      error = e;
    }

    logIO("update — not found", input, {
      error: (error as Error)?.message,
      statusCode: (error as any)?.statusCode,
    });

    expect(error).toBeInstanceOf(AppError);
    expect((error as any).statusCode).toBe(404);
  });

  it("14 — should strip passwordHash & refreshToken from the data before calling repo", async () => {
    mockRepo.findById.mockResolvedValue([FAKE_DB_USER]);
    mockRepo.update.mockResolvedValue([FAKE_DB_USER]);

    const input = {
      id: 1,
      data: { name: "Sneaky", passwordHash: "hack3d", refreshToken: "stolen-token" },
    };
    const result = await service.update(input.id, input.data as any);

    logIO("update — strips sensitive fields from payload", input, result);

    const repoCallArgs = mockRepo.update.mock.calls[0][1];
    expect(repoCallArgs).not.toHaveProperty("passwordHash");
    expect(repoCallArgs).not.toHaveProperty("refreshToken");
    expect(repoCallArgs).toHaveProperty("name", "Sneaky");

    expectNoSensitiveFields(result as Record<string, unknown>);
  });

  it("15 — should handle empty update body gracefully", async () => {
    mockRepo.findById.mockResolvedValue([FAKE_DB_USER]);
    mockRepo.update.mockResolvedValue([FAKE_DB_USER]);

    const input = { id: 1, data: {} };
    const result = await service.update(input.id, input.data);

    logIO("update — empty body", input, result);

    expect(mockRepo.update).toHaveBeenCalledWith(1, {});
    expectNoSensitiveFields(result as Record<string, unknown>);
  });

  it("16 — should throw 500 when repo returns empty array after update", async () => {
    mockRepo.findById.mockResolvedValue([FAKE_DB_USER]);
    mockRepo.update.mockResolvedValue([]); 

    const input = { id: 1, data: { name: "Phantom" } };
    let error: unknown;
    try {
      await service.update(input.id, input.data);
    } catch (e) {
      error = e;
    }

    logIO("update — repo returns empty (500)", input, {
      error: (error as Error)?.message,
      statusCode: (error as any)?.statusCode,
    });

    expect(error).toBeInstanceOf(AppError);
    expect((error as any).statusCode).toBe(500);
    expect((error as Error).message).toBe("Failed to update user");
  });
});

// =====================================================================
//  UPDATE PASSWORD
// =====================================================================

describe("UserService.updatePassword()", () => {
  it("17 — should hash and update password when current password matches", async () => {
    mockRepo.findById.mockResolvedValue([FAKE_DB_USER]);
    (comparePassword as jest.Mock).mockResolvedValue(true);
    mockRepo.update.mockResolvedValue([{ ...FAKE_DB_USER, passwordHash: "hashed_Str0ngPass1" }]);

    const input = { id: 1, data: { currentPassword: "OldPass123!", newPassword: "Str0ngPass1" } };
    const result = await service.updatePassword(input.id, input.data);

    logIO("updatePassword — happy path", input, result);

    expect(mockRepo.update).toHaveBeenCalledWith(1, { passwordHash: "hashed_Str0ngPass1" });
  });

  it("18 — should throw 404 when user does not exist", async () => {
    mockRepo.findById.mockResolvedValue([]);

    const input = { id: 999, data: { currentPassword: "OldPass123!", newPassword: "Str0ngPass1" } };
    let error: unknown;
    try {
      await service.updatePassword(input.id, input.data);
    } catch (e) {
      error = e;
    }

    logIO("updatePassword — not found", input, {
      error: (error as Error)?.message,
      statusCode: (error as any)?.statusCode,
    });

    expect(error).toBeInstanceOf(AppError);
    expect((error as any).statusCode).toBe(404);
  });


  it("20 — should throw 401 when current password is incorrect", async () => {
    mockRepo.findById.mockResolvedValue([FAKE_DB_USER]);
    (comparePassword as jest.Mock).mockResolvedValue(false);

    const input = { id: 1, data: { currentPassword: "WrongPass1!", newPassword: "NewPass123!" } as any };
    let error: unknown;
    try {
      await service.updatePassword(input.id, input.data);
    } catch (e) {
      error = e;
    }

    logIO("updatePassword — wrong current password", input, {
      error: (error as Error)?.message,
      statusCode: (error as any)?.statusCode,
    });

    expect(error).toBeInstanceOf(AppError);
    expect((error as any).statusCode).toBe(401);
  });
});

// =====================================================================
//  UPDATE ROLE
// =====================================================================

describe("UserService.updateRole()", () => {
  it("21 — should update role successfully", async () => {
    mockRepo.findById.mockResolvedValue([FAKE_DB_USER]);
    mockRepo.update.mockResolvedValue([{ ...FAKE_DB_USER, role: "admin" }]);

    const input = { id: 1, role: "admin" as const };
    const result = await service.updateRole(input.id, input.role);

    logIO("updateRole — happy path", input, result);

    expect(mockRepo.update).toHaveBeenCalledWith(1, { role: "admin" });
  });

  it("22 — should throw 404 when user does not exist", async () => {
    mockRepo.findById.mockResolvedValue([]);

    const input = { id: 999, role: "admin" as const };
    let error: unknown;
    try {
      await service.updateRole(input.id, input.role);
    } catch (e) {
      error = e;
    }

    logIO("updateRole — not found", input, {
      error: (error as Error)?.message,
      statusCode: (error as any)?.statusCode,
    });

    expect(error).toBeInstanceOf(AppError);
    expect((error as any).statusCode).toBe(404);
  });
});

// =====================================================================
//  REVOKE TOKEN
// =====================================================================

describe("UserService.revokeTokenFromUser()", () => {
  it("23 — should set refreshToken to null", async () => {
    mockRepo.findById.mockResolvedValue([FAKE_DB_USER]);
    mockRepo.update.mockResolvedValue([{ ...FAKE_DB_USER, refreshToken: null }]);

    const input = { id: 1, refreshToken: "old-refresh-token" };
    const result = await service.revokeTokenFromUser(input.id, input.refreshToken);

    logIO("revokeTokenFromUser — happy path", input, result);

    expect(mockRepo.update).toHaveBeenCalledWith(1, { refreshToken: null });
  });

  it("24 — should throw 404 when user does not exist", async () => {
    mockRepo.findById.mockResolvedValue([]);

    const input = { id: 999, refreshToken: "doesnt-matter" };
    let error: unknown;
    try {
      await service.revokeTokenFromUser(input.id, input.refreshToken);
    } catch (e) {
      error = e;
    }

    logIO("revokeTokenFromUser — not found", input, {
      error: (error as Error)?.message,
      statusCode: (error as any)?.statusCode,
    });

    expect(error).toBeInstanceOf(AppError);
    expect((error as any).statusCode).toBe(404);
  });
});

// =====================================================================
//  DELETE USER
// =====================================================================

describe("UserService.deleteUser()", () => {
  it("25 — should soft-delete user successfully", async () => {
    mockRepo.findById.mockResolvedValue([FAKE_DB_USER]);
    mockRepo.deleteUser.mockResolvedValue([{ ...FAKE_DB_USER, active: false }]);

    const input = { id: 1 };
    const result = await service.deleteUser(input.id);

    logIO("deleteUser — happy path", input, result);

    expect(mockRepo.deleteUser).toHaveBeenCalledWith(1);
  });

  it("26 — should throw 404 when user does not exist", async () => {
    mockRepo.findById.mockResolvedValue([]);

    const input = { id: 999 };
    let error: unknown;
    try {
      await service.deleteUser(input.id);
    } catch (e) {
      error = e;
    }

    logIO("deleteUser — not found", input, {
      error: (error as Error)?.message,
      statusCode: (error as any)?.statusCode,
    });

    expect(error).toBeInstanceOf(AppError);
    expect((error as any).statusCode).toBe(404);
  });
});
