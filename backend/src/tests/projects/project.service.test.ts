/**
 * ─────────────────────────────────────────────────────────────────────────
 *  ProjectService Unit Tests (ESM Mode)
 *
 *  • Every test logs its INPUT body and OUTPUT body to the console
 *    so reviewers / assigners can inspect payloads in the terminal.
 *  • All external dependencies (ProjectRepository, UserRepository)
 *    are mocked using jest.unstable_mockModule for ESM support.
 *  • 45 test cases covering happy paths, edge cases, wrong inputs,
 *    non-existent entities, and authorization checks.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { jest } from "@jest/globals";

/* ── Module-level mocks for ESM ───────────────────────────────────────── */

const mockProjectRepo = {
  createProject: jest.fn(),
  addMemberToProject: jest.fn(),
  updateProject: jest.fn(),
  deleteProject: jest.fn(),
  deleteMemberFromProject: jest.fn(),
  getProjectById: jest.fn(),
  getProjectsByOwnerId: jest.fn(),
  getProjectsByMemberId: jest.fn(),
  getProjectMemberByProjectId: jest.fn(),
  getProjectMemberByProjectIdAndUserId: jest.fn(),
};

const mockUserRepo = {
  findById: jest.fn(),
};

jest.unstable_mockModule(
  "../../modules/projects/repositories/project.repository.js",
  () => ({
    ProjectRepository: jest.fn().mockImplementation(() => mockProjectRepo),
  })
);

jest.unstable_mockModule(
  "../../modules/users/repositories/user.repository.js",
  () => ({
    UserRepository: jest.fn().mockImplementation(() => mockUserRepo),
  })
);

/* ── Dynamic Imports (MUST be after unstable_mockModule) ──────────────── */

const { ProjectService } = await import(
  "../../modules/projects/services/project.service.js"
);
const { AppError } = await import("../../common/error/AppError.js");

/* ── Helpers ──────────────────────────────────────────────────────────── */

function logIO(label: string, input: unknown, output: unknown) {
  console.log(
    `\n╔══════════════════════════════════════════════════════════`
  );
  console.log(`║ TEST: ${label}`);
  console.log(
    `╠══ INPUT BODY ════════════════════════════════════════════`
  );
  console.log(JSON.stringify(input, null, 2));
  console.log(
    `╠══ OUTPUT BODY ═══════════════════════════════════════════`
  );
  console.log(JSON.stringify(output, null, 2));
  console.log(
    `╚══════════════════════════════════════════════════════════\n`
  );
}

/* ── Fake data ────────────────────────────────────────────────────────── */

const ADMIN_USER = {
  id: 1,
  email: "admin@example.com",
  name: "Admin User",
  role: "admin",
  active: true,
};

const MEMBER_USER = {
  id: 2,
  email: "member@example.com",
  name: "Member User",
  role: "member",
  active: true,
};

const OTHER_ADMIN = {
  id: 3,
  email: "other-admin@example.com",
  name: "Other Admin",
  role: "admin",
  active: true,
};

const FAKE_PROJECT = {
  id: 10,
  title: "SprintSlayer",
  description: "A task management app",
  ownerId: 1,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

const FAKE_MEMBERSHIP = {
  id: 100,
  projectId: 10,
  userId: 2,
};

const FAKE_MEMBER_DETAIL = {
  userId: 2,
  email: "member@example.com",
  role: "member",
  membershipId: 100,
};

/* ── Test suites ──────────────────────────────────────────────────────── */

let service: InstanceType<typeof ProjectService>;

beforeEach(() => {
  jest.clearAllMocks();
  service = new ProjectService();
});

// =====================================================================
//  1. createProject()
// =====================================================================

describe("ProjectService.createProject()", () => {
  const createInput = {
    title: "New Project",
    description: "A brand new project",
    ownerId: 1,
  };

  it("1 — should create a project and auto-add owner as member (happy path)", async () => {
    mockUserRepo.findById.mockResolvedValue([ADMIN_USER]);
    mockProjectRepo.createProject.mockResolvedValue([
      { ...FAKE_PROJECT, ...createInput, id: 11 },
    ]);
    mockProjectRepo.addMemberToProject.mockResolvedValue([
      { id: 101, projectId: 11, userId: 1 },
    ]);

    const result = await service.createProject(createInput);

    logIO("createProject — happy path", createInput, result);

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("id", 11);
    expect(result[0]).toHaveProperty("title", "New Project");
    expect(mockProjectRepo.createProject).toHaveBeenCalledWith(createInput);
    expect(mockProjectRepo.addMemberToProject).toHaveBeenCalledWith({
      projectId: 11,
      userId: 1,
    });
  });

  it("2 — should throw 403 when non-admin tries to create", async () => {
    mockUserRepo.findById.mockResolvedValue([MEMBER_USER]);
    const input = { ...createInput, ownerId: 2 };

    let error: unknown;
    try {
      await service.createProject(input);
    } catch (e) {
      error = e;
    }

    logIO("createProject — non-admin", input, {
      error: (error as Error)?.message,
      statusCode: (error as any)?.statusCode,
    });

    expect(error).toBeInstanceOf(AppError);
    expect((error as any).statusCode).toBe(403);
    expect((error as Error).message).toBe(
      "Only admins can perform this action"
    );
    expect(mockProjectRepo.createProject).not.toHaveBeenCalled();
  });

  it("3 — should throw when ownerId points to non-existent user", async () => {
    mockUserRepo.findById.mockResolvedValue([]);
    const input = { ...createInput, ownerId: 9999 };

    let error: unknown;
    try {
      await service.createProject(input);
    } catch (e) {
      error = e;
    }

    logIO("createProject — non-existent owner", input, {
      error: (error as Error)?.message,
    });

    expect(error).toBeTruthy();
    expect(mockProjectRepo.createProject).not.toHaveBeenCalled();
  });

  it("4 — should pass empty title through to repo (DTO validation is middleware-level)", async () => {
    mockUserRepo.findById.mockResolvedValue([ADMIN_USER]);
    const emptyTitleProject = { ...FAKE_PROJECT, title: "" };
    mockProjectRepo.createProject.mockResolvedValue([emptyTitleProject]);
    mockProjectRepo.addMemberToProject.mockResolvedValue([
      { id: 102, projectId: 10, userId: 1 },
    ]);

    const input = { title: "", description: "desc", ownerId: 1 };
    const result = await service.createProject(input);

    logIO("createProject — empty title", input, result);

    expect(mockProjectRepo.createProject).toHaveBeenCalledWith(input);
    expect(result[0].title).toBe("");
  });

  it("5 — should succeed when description is omitted (optional field)", async () => {
    mockUserRepo.findById.mockResolvedValue([ADMIN_USER]);
    const noDescProject = { ...FAKE_PROJECT, title: "No Desc", description: undefined };
    mockProjectRepo.createProject.mockResolvedValue([noDescProject]);
    mockProjectRepo.addMemberToProject.mockResolvedValue([
      { id: 103, projectId: 10, userId: 1 },
    ]);

    const input = { title: "No Desc", ownerId: 1 };
    const result = await service.createProject(input);

    logIO("createProject — no description", input, result);

    expect(result[0]).toHaveProperty("title", "No Desc");
    expect(mockProjectRepo.createProject).toHaveBeenCalled();
  });

  it("6 — should fail when ownerId is negative (treated as non-existent)", async () => {
    mockUserRepo.findById.mockResolvedValue([]);
    const input = { title: "Bad Owner", ownerId: -1 };

    let error: unknown;
    try {
      await service.createProject(input);
    } catch (e) {
      error = e;
    }

    logIO("createProject — negative ownerId", input, {
      error: (error as Error)?.message,
    });

    expect(error).toBeTruthy();
    expect(mockProjectRepo.createProject).not.toHaveBeenCalled();
  });
});

// =====================================================================
//  2. addMemberToProject()
// =====================================================================

describe("ProjectService.addMemberToProject()", () => {
  const addInput = { projectId: 10, userId: 2 };

  it("7 — should add a member to the project (happy path)", async () => {
    // checkAdminAndOwnership: admin + owns project
    mockUserRepo.findById
      .mockResolvedValueOnce([ADMIN_USER]) // requester is admin
      .mockResolvedValueOnce([MEMBER_USER]); // user to add exists
    mockProjectRepo.getProjectById.mockResolvedValue([FAKE_PROJECT]);
    mockProjectRepo.getProjectMemberByProjectIdAndUserId.mockResolvedValue([]);
    mockProjectRepo.addMemberToProject.mockResolvedValue([FAKE_MEMBERSHIP]);

    const result = await service.addMemberToProject(addInput, 1);

    logIO("addMemberToProject — happy path", { ...addInput, requesterId: 1 }, result);

    expect(result).toEqual([FAKE_MEMBERSHIP]);
    expect(mockProjectRepo.addMemberToProject).toHaveBeenCalledWith(addInput);
  });

  it("8 — should throw 403 when requester is not admin", async () => {
    mockUserRepo.findById.mockResolvedValue([MEMBER_USER]);

    let error: unknown;
    try {
      await service.addMemberToProject(addInput, 2);
    } catch (e) {
      error = e;
    }

    logIO("addMemberToProject — non-admin requester", { ...addInput, requesterId: 2 }, {
      error: (error as Error)?.message,
      statusCode: (error as any)?.statusCode,
    });

    expect(error).toBeInstanceOf(AppError);
    expect((error as any).statusCode).toBe(403);
    expect((error as Error).message).toBe("Only admins can perform this action");
  });

  it("9 — should throw 403 when requester is admin but NOT owner of the project", async () => {
    mockUserRepo.findById.mockResolvedValueOnce([OTHER_ADMIN]);
    mockProjectRepo.getProjectById.mockResolvedValue([FAKE_PROJECT]); // ownerId = 1, not 3

    let error: unknown;
    try {
      await service.addMemberToProject(addInput, 3);
    } catch (e) {
      error = e;
    }

    logIO("addMemberToProject — admin but not owner", { ...addInput, requesterId: 3 }, {
      error: (error as Error)?.message,
      statusCode: (error as any)?.statusCode,
    });

    expect(error).toBeInstanceOf(AppError);
    expect((error as any).statusCode).toBe(403);
    expect((error as Error).message).toBe("You are not the owner of this project");
  });

  it("10 — should throw 404 when user to add does not exist in system", async () => {
    mockUserRepo.findById
      .mockResolvedValueOnce([ADMIN_USER]) // requester is admin
      .mockResolvedValueOnce([]); // user to add does NOT exist
    mockProjectRepo.getProjectById.mockResolvedValue([FAKE_PROJECT]);

    let error: unknown;
    try {
      await service.addMemberToProject({ projectId: 10, userId: 9999 }, 1);
    } catch (e) {
      error = e;
    }

    logIO("addMemberToProject — user not in system", { projectId: 10, userId: 9999 }, {
      error: (error as Error)?.message,
      statusCode: (error as any)?.statusCode,
    });

    expect(error).toBeInstanceOf(AppError);
    expect((error as any).statusCode).toBe(404);
    expect((error as Error).message).toBe("User does not exist in the system");
  });

  it("11 — should throw 404 when project does not exist", async () => {
    mockUserRepo.findById.mockResolvedValueOnce([ADMIN_USER]);
    mockProjectRepo.getProjectById.mockResolvedValue([]); // project not found in checkAdminAndOwnership

    let error: unknown;
    try {
      await service.addMemberToProject({ projectId: 9999, userId: 2 }, 1);
    } catch (e) {
      error = e;
    }

    logIO("addMemberToProject — project not found", { projectId: 9999, userId: 2 }, {
      error: (error as Error)?.message,
      statusCode: (error as any)?.statusCode,
    });

    expect(error).toBeInstanceOf(AppError);
    expect((error as any).statusCode).toBe(404);
    expect((error as Error).message).toBe("Project not found");
  });

  it("12 — should throw 400 when member already exists in project (duplicate add)", async () => {
    mockUserRepo.findById
      .mockResolvedValueOnce([ADMIN_USER])
      .mockResolvedValueOnce([MEMBER_USER]);
    mockProjectRepo.getProjectById.mockResolvedValue([FAKE_PROJECT]);
    mockProjectRepo.getProjectMemberByProjectIdAndUserId.mockResolvedValue([
      FAKE_MEMBER_DETAIL,
    ]);

    let error: unknown;
    try {
      await service.addMemberToProject(addInput, 1);
    } catch (e) {
      error = e;
    }

    logIO("addMemberToProject — duplicate member", addInput, {
      error: (error as Error)?.message,
      statusCode: (error as any)?.statusCode,
    });

    expect(error).toBeInstanceOf(AppError);
    expect((error as any).statusCode).toBe(400);
    expect((error as Error).message).toBe("Member already exists in the project");
  });

  it("13 — should throw when userId is 0 (boundary non-existent)", async () => {
    mockUserRepo.findById
      .mockResolvedValueOnce([ADMIN_USER])
      .mockResolvedValueOnce([]); // user 0 not found
    mockProjectRepo.getProjectById.mockResolvedValue([FAKE_PROJECT]);

    let error: unknown;
    try {
      await service.addMemberToProject({ projectId: 10, userId: 0 }, 1);
    } catch (e) {
      error = e;
    }

    logIO("addMemberToProject — userId=0", { projectId: 10, userId: 0 }, {
      error: (error as Error)?.message,
      statusCode: (error as any)?.statusCode,
    });

    expect(error).toBeInstanceOf(AppError);
    expect((error as any).statusCode).toBe(404);
    expect((error as Error).message).toBe("User does not exist in the system");
  });

  it("14 — should throw when projectId is -1 (negative / invalid)", async () => {
    mockUserRepo.findById.mockResolvedValueOnce([ADMIN_USER]);
    mockProjectRepo.getProjectById.mockResolvedValue([]); // project -1 not found

    let error: unknown;
    try {
      await service.addMemberToProject({ projectId: -1, userId: 2 }, 1);
    } catch (e) {
      error = e;
    }

    logIO("addMemberToProject — projectId=-1", { projectId: -1, userId: 2 }, {
      error: (error as Error)?.message,
      statusCode: (error as any)?.statusCode,
    });

    expect(error).toBeInstanceOf(AppError);
    expect((error as any).statusCode).toBe(404);
    expect((error as Error).message).toBe("Project not found");
  });
});

// =====================================================================
//  3. updateProject()
// =====================================================================

describe("ProjectService.updateProject()", () => {
  const updateInput = { title: "Updated Title" };

  it("15 — should update project title (happy path)", async () => {
    mockUserRepo.findById.mockResolvedValue([ADMIN_USER]);
    mockProjectRepo.getProjectById.mockResolvedValue([FAKE_PROJECT]);
    mockProjectRepo.updateProject.mockResolvedValue([
      { ...FAKE_PROJECT, title: "Updated Title" },
    ]);

    const result = await service.updateProject(10, updateInput, 1);

    logIO("updateProject — happy path", { projectId: 10, ...updateInput, requesterId: 1 }, result);

    expect(result[0]).toHaveProperty("title", "Updated Title");
    expect(mockProjectRepo.updateProject).toHaveBeenCalledWith(10, updateInput);
  });

  it("16 — should throw 403 when non-admin tries to update", async () => {
    mockUserRepo.findById.mockResolvedValue([MEMBER_USER]);

    let error: unknown;
    try {
      await service.updateProject(10, updateInput, 2);
    } catch (e) {
      error = e;
    }

    logIO("updateProject — non-admin", { projectId: 10, requesterId: 2 }, {
      error: (error as Error)?.message,
      statusCode: (error as any)?.statusCode,
    });

    expect(error).toBeInstanceOf(AppError);
    expect((error as any).statusCode).toBe(403);
  });

  it("17 — should throw 403 when admin is not owner", async () => {
    mockUserRepo.findById.mockResolvedValue([OTHER_ADMIN]);
    mockProjectRepo.getProjectById.mockResolvedValue([FAKE_PROJECT]); // ownerId=1

    let error: unknown;
    try {
      await service.updateProject(10, updateInput, 3);
    } catch (e) {
      error = e;
    }

    logIO("updateProject — admin but not owner", { projectId: 10, requesterId: 3 }, {
      error: (error as Error)?.message,
      statusCode: (error as any)?.statusCode,
    });

    expect(error).toBeInstanceOf(AppError);
    expect((error as any).statusCode).toBe(403);
    expect((error as Error).message).toBe("You are not the owner of this project");
  });

  it("18 — should throw 404 when project does not exist", async () => {
    mockUserRepo.findById.mockResolvedValue([ADMIN_USER]);
    mockProjectRepo.getProjectById.mockResolvedValue([]);

    let error: unknown;
    try {
      await service.updateProject(9999, updateInput, 1);
    } catch (e) {
      error = e;
    }

    logIO("updateProject — project not found", { projectId: 9999 }, {
      error: (error as Error)?.message,
      statusCode: (error as any)?.statusCode,
    });

    expect(error).toBeInstanceOf(AppError);
    expect((error as any).statusCode).toBe(404);
    expect((error as Error).message).toBe("Project not found");
  });

  it("19 — should handle empty update body gracefully", async () => {
    mockUserRepo.findById.mockResolvedValue([ADMIN_USER]);
    mockProjectRepo.getProjectById.mockResolvedValue([FAKE_PROJECT]);
    mockProjectRepo.updateProject.mockResolvedValue([FAKE_PROJECT]);

    const emptyBody = {};
    const result = await service.updateProject(10, emptyBody, 1);

    logIO("updateProject — empty body", { projectId: 10, body: emptyBody }, result);

    expect(mockProjectRepo.updateProject).toHaveBeenCalledWith(10, {});
    expect(result[0]).toHaveProperty("id", 10);
  });
});

// =====================================================================
//  4. deleteProject()
// =====================================================================

describe("ProjectService.deleteProject()", () => {
  it("20 — should delete project (happy path)", async () => {
    mockProjectRepo.getProjectById.mockResolvedValue([FAKE_PROJECT]);
    mockUserRepo.findById.mockResolvedValue([ADMIN_USER]);
    mockProjectRepo.deleteProject.mockResolvedValue([FAKE_PROJECT]);

    const input = { id: 10, ownerId: 1 };
    const result = await service.deleteProject(input, 1);

    logIO("deleteProject — happy path", input, result);

    expect(result).toEqual([FAKE_PROJECT]);
    expect(mockProjectRepo.deleteProject).toHaveBeenCalledWith(10);
  });

  it("21 — should return empty array when project does not exist (early return)", async () => {
    mockProjectRepo.getProjectById.mockResolvedValue([]);

    const input = { id: 9999, ownerId: 1 };
    const result = await service.deleteProject(input, 1);

    logIO("deleteProject — project not found (early return)", input, result);

    expect(result).toEqual([]);
    expect(mockProjectRepo.deleteProject).not.toHaveBeenCalled();
  });

  it("22 — should throw 403 when non-admin tries to delete", async () => {
    mockProjectRepo.getProjectById.mockResolvedValue([FAKE_PROJECT]);
    mockUserRepo.findById.mockResolvedValue([MEMBER_USER]);

    const input = { id: 10, ownerId: 2 };
    let error: unknown;
    try {
      await service.deleteProject(input, 2);
    } catch (e) {
      error = e;
    }

    logIO("deleteProject — non-admin", input, {
      error: (error as Error)?.message,
      statusCode: (error as any)?.statusCode,
    });

    expect(error).toBeInstanceOf(AppError);
    expect((error as any).statusCode).toBe(403);
  });

  it("23 — should throw 403 when admin is not owner", async () => {
    mockProjectRepo.getProjectById.mockResolvedValue([FAKE_PROJECT]); // ownerId=1
    mockUserRepo.findById.mockResolvedValue([OTHER_ADMIN]); // id=3

    const input = { id: 10, ownerId: 3 };
    let error: unknown;
    try {
      await service.deleteProject(input, 3);
    } catch (e) {
      error = e;
    }

    logIO("deleteProject — admin but not owner", input, {
      error: (error as Error)?.message,
      statusCode: (error as any)?.statusCode,
    });

    expect(error).toBeInstanceOf(AppError);
    expect((error as any).statusCode).toBe(403);
    expect((error as Error).message).toBe("You are not the owner of this project");
  });

  it("24 — should return empty array when deleting with id=999999", async () => {
    mockProjectRepo.getProjectById.mockResolvedValue([]);

    const input = { id: 999999, ownerId: 1 };
    const result = await service.deleteProject(input, 1);

    logIO("deleteProject — very large non-existent id", input, result);

    expect(result).toEqual([]);
    expect(mockProjectRepo.deleteProject).not.toHaveBeenCalled();
  });
});

// =====================================================================
//  5. deleteMemberFromProject()
// =====================================================================

describe("ProjectService.deleteMemberFromProject()", () => {
  const removeInput = { projectId: 10, userId: 2 };

  it("25 — should remove member from project (happy path)", async () => {
    mockUserRepo.findById
      .mockResolvedValueOnce([MEMBER_USER]) // user to remove exists
      .mockResolvedValueOnce([ADMIN_USER]); // remover is admin
    mockProjectRepo.getProjectById.mockResolvedValue([FAKE_PROJECT]);
    mockProjectRepo.getProjectMemberByProjectIdAndUserId.mockResolvedValue([
      FAKE_MEMBER_DETAIL,
    ]);
    mockProjectRepo.deleteMemberFromProject.mockResolvedValue([FAKE_MEMBERSHIP]);

    const result = await service.deleteMemberFromProject(removeInput, 1);

    logIO("deleteMemberFromProject — happy path", { ...removeInput, removerId: 1 }, result);

    expect(result).toEqual([FAKE_MEMBERSHIP]);
    expect(mockProjectRepo.deleteMemberFromProject).toHaveBeenCalledWith(removeInput);
  });

  it("26 — should return empty array when user to remove does not exist (silent early return)", async () => {
    mockUserRepo.findById.mockResolvedValue([]); // user not found

    const input = { projectId: 10, userId: 9999 };
    const result = await service.deleteMemberFromProject(input, 1);

    logIO("deleteMemberFromProject — user not in system", input, result);

    expect(result).toEqual([]);
    expect(mockProjectRepo.deleteMemberFromProject).not.toHaveBeenCalled();
  });

  it("27 — should return empty array when project does not exist (silent early return)", async () => {
    mockUserRepo.findById.mockResolvedValue([MEMBER_USER]); // user exists
    mockProjectRepo.getProjectById.mockResolvedValue([]); // project not found

    const input = { projectId: 9999, userId: 2 };
    const result = await service.deleteMemberFromProject(input, 1);

    logIO("deleteMemberFromProject — project not found", input, result);

    expect(result).toEqual([]);
    expect(mockProjectRepo.deleteMemberFromProject).not.toHaveBeenCalled();
  });

  it("28 — should return empty array when member is not in the project (silent early return)", async () => {
    mockUserRepo.findById
      .mockResolvedValueOnce([MEMBER_USER])
      .mockResolvedValueOnce([ADMIN_USER]);
    mockProjectRepo.getProjectById.mockResolvedValue([FAKE_PROJECT]);
    mockProjectRepo.getProjectMemberByProjectIdAndUserId.mockResolvedValue([]); // not a member

    const result = await service.deleteMemberFromProject(removeInput, 1);

    logIO("deleteMemberFromProject — not a member", removeInput, result);

    expect(result).toEqual([]);
    expect(mockProjectRepo.deleteMemberFromProject).not.toHaveBeenCalled();
  });

  it("29 — should throw 403 when remover is not admin", async () => {
    mockUserRepo.findById
      .mockResolvedValueOnce([MEMBER_USER]) // user to remove exists
      .mockResolvedValueOnce([MEMBER_USER]); // remover is NOT admin
    mockProjectRepo.getProjectById.mockResolvedValue([FAKE_PROJECT]);

    let error: unknown;
    try {
      await service.deleteMemberFromProject(removeInput, 2);
    } catch (e) {
      error = e;
    }

    logIO("deleteMemberFromProject — non-admin remover", { ...removeInput, removerId: 2 }, {
      error: (error as Error)?.message,
      statusCode: (error as any)?.statusCode,
    });

    expect(error).toBeInstanceOf(AppError);
    expect((error as any).statusCode).toBe(403);
  });

  it("30 — should throw 403 when remover is admin but not owner", async () => {
    mockUserRepo.findById
      .mockResolvedValueOnce([MEMBER_USER]) // user to remove exists
      .mockResolvedValueOnce([OTHER_ADMIN]); // remover is admin but NOT owner
    mockProjectRepo.getProjectById.mockResolvedValue([FAKE_PROJECT]); // ownerId=1

    let error: unknown;
    try {
      await service.deleteMemberFromProject(removeInput, 3);
    } catch (e) {
      error = e;
    }

    logIO("deleteMemberFromProject — admin but not owner", { ...removeInput, removerId: 3 }, {
      error: (error as Error)?.message,
      statusCode: (error as any)?.statusCode,
    });

    expect(error).toBeInstanceOf(AppError);
    expect((error as any).statusCode).toBe(403);
    expect((error as Error).message).toBe("You are not the owner of this project");
  });

  it("31 — should return empty array when both userId and projectId are non-existent", async () => {
    mockUserRepo.findById.mockResolvedValue([]); // user not found → early return before project check

    const input = { projectId: 9999, userId: 8888 };
    const result = await service.deleteMemberFromProject(input, 1);

    logIO("deleteMemberFromProject — both IDs non-existent", input, result);

    expect(result).toEqual([]);
    expect(mockProjectRepo.getProjectById).not.toHaveBeenCalled();
    expect(mockProjectRepo.deleteMemberFromProject).not.toHaveBeenCalled();
  });
});

// =====================================================================
//  6. getProjectById()
// =====================================================================

describe("ProjectService.getProjectById()", () => {
  it("32 — should return project when requester is a member (happy path)", async () => {
    mockProjectRepo.getProjectById.mockResolvedValue([FAKE_PROJECT]);
    mockProjectRepo.getProjectMemberByProjectIdAndUserId.mockResolvedValue([FAKE_MEMBER_DETAIL]);

    const result = await service.getProjectById(10, 2);

    logIO("getProjectById — happy path", { id: 10, requesterId: 2 }, result);

    expect(result).toEqual([FAKE_PROJECT]);
    expect(mockProjectRepo.getProjectById).toHaveBeenCalledWith(10);
    expect(mockProjectRepo.getProjectMemberByProjectIdAndUserId).toHaveBeenCalledWith(10, 2);
  });

  it("33 — should throw 404 when project does not exist", async () => {
    mockProjectRepo.getProjectById.mockResolvedValue([]);

    let error: unknown;
    try {
      await service.getProjectById(9999, 1);
    } catch (e) {
      error = e;
    }

    logIO("getProjectById — not found", { id: 9999, requesterId: 1 }, {
      error: (error as Error)?.message,
      statusCode: (error as any)?.statusCode,
    });

    expect(error).toBeInstanceOf(AppError);
    expect((error as any).statusCode).toBe(404);
    expect((error as Error).message).toBe("Project not found");
  });

  it("34 — should throw 403 when requester is not a member of the project", async () => {
    mockProjectRepo.getProjectById.mockResolvedValue([FAKE_PROJECT]);
    mockProjectRepo.getProjectMemberByProjectIdAndUserId.mockResolvedValue([]);

    let error: unknown;
    try {
      await service.getProjectById(10, 999);
    } catch (e) {
      error = e;
    }

    logIO("getProjectById — not a member", { id: 10, requesterId: 999 }, {
      error: (error as Error)?.message,
      statusCode: (error as any)?.statusCode,
    });

    expect(error).toBeInstanceOf(AppError);
    expect((error as any).statusCode).toBe(403);
    expect((error as Error).message).toBe("You are not a member of this project");
  });
});

// =====================================================================
//  7. getProjectsByMemberId() — returns projects the user is a member of
// =====================================================================

describe("ProjectService.getProjectsByMemberId()", () => {
  it("35 — should return paginated projects for member (happy path)", async () => {
    const projects = [FAKE_PROJECT, { ...FAKE_PROJECT, id: 11, title: "Second" }];
    mockProjectRepo.getProjectsByMemberId.mockResolvedValue(projects);

    const result = await service.getProjectsByMemberId(1, 1, 10);

    logIO("getProjectsByMemberId — happy path", { memberId: 1, page: 1, limit: 10 }, result);

    expect(result).toHaveLength(2);
    expect(mockProjectRepo.getProjectsByMemberId).toHaveBeenCalledWith(1, 1, 10);
  });

  it("36 — should return empty array when user has no projects", async () => {
    mockProjectRepo.getProjectsByMemberId.mockResolvedValue([]);

    const result = await service.getProjectsByMemberId(9999, 1, 10);

    logIO("getProjectsByMemberId — no projects", { memberId: 9999 }, result);

    expect(result).toEqual([]);
  });

  it("37 — should use default pagination (page=1, limit=10) when no args provided", async () => {
    mockProjectRepo.getProjectsByMemberId.mockResolvedValue([]);

    await service.getProjectsByMemberId(1);

    logIO("getProjectsByMemberId — default pagination", { memberId: 1 }, "void");

    expect(mockProjectRepo.getProjectsByMemberId).toHaveBeenCalledWith(1, 1, 10);
  });
});



// =====================================================================
//  9. getMembersOfProject()
// =====================================================================

describe("ProjectService.getMembersOfProject()", () => {
  it("38 — should return members list when requester is a member (happy path)", async () => {
    const members = [FAKE_MEMBER_DETAIL, { ...FAKE_MEMBER_DETAIL, userId: 3, email: "three@example.com" }];
    mockProjectRepo.getProjectById.mockResolvedValue([FAKE_PROJECT]);
    mockProjectRepo.getProjectMemberByProjectIdAndUserId.mockResolvedValue([FAKE_MEMBER_DETAIL]);
    mockProjectRepo.getProjectMemberByProjectId.mockResolvedValue(members);

    const result = await service.getMembersOfProject(10, 2, 1, 10);

    logIO("getMembersOfProject — happy path", { projectId: 10, requesterId: 2, page: 1, limit: 10 }, result);

    expect(result).toHaveLength(2);
    expect(mockProjectRepo.getProjectMemberByProjectId).toHaveBeenCalledWith(10, 1, 10);
  });

  it("39 — should throw 404 when project does not exist", async () => {
    mockProjectRepo.getProjectById.mockResolvedValue([]);

    let error: unknown;
    try {
      await service.getMembersOfProject(9999, 1, 1, 10);
    } catch (e) {
      error = e;
    }

    logIO("getMembersOfProject — project not found", { projectId: 9999, requesterId: 1 }, {
      error: (error as Error)?.message,
      statusCode: (error as any)?.statusCode,
    });

    expect(error).toBeInstanceOf(AppError);
    expect((error as any).statusCode).toBe(404);
    expect((error as Error).message).toBe("Project not found");
  });

  it("40 — should throw 403 when requester is not a member of the project", async () => {
    mockProjectRepo.getProjectById.mockResolvedValue([FAKE_PROJECT]);
    mockProjectRepo.getProjectMemberByProjectIdAndUserId.mockResolvedValue([]);

    let error: unknown;
    try {
      await service.getMembersOfProject(10, 999, 1, 10);
    } catch (e) {
      error = e;
    }

    logIO("getMembersOfProject — not a member", { projectId: 10, requesterId: 999 }, {
      error: (error as Error)?.message,
      statusCode: (error as any)?.statusCode,
    });

    expect(error).toBeInstanceOf(AppError);
    expect((error as any).statusCode).toBe(403);
    expect((error as Error).message).toBe("You are not a member of this project");
  });

  it("41 — should use default pagination when no page/limit provided", async () => {
    mockProjectRepo.getProjectById.mockResolvedValue([FAKE_PROJECT]);
    mockProjectRepo.getProjectMemberByProjectIdAndUserId.mockResolvedValue([FAKE_MEMBER_DETAIL]);
    mockProjectRepo.getProjectMemberByProjectId.mockResolvedValue([]);

    await service.getMembersOfProject(10, 2);

    logIO("getMembersOfProject — default pagination", { projectId: 10, requesterId: 2 }, "void");

    expect(mockProjectRepo.getProjectMemberByProjectId).toHaveBeenCalledWith(10, 1, 10);
  });
});

// =====================================================================
//  10. checkAdminAndOwnership() — tested indirectly
// =====================================================================

describe("checkAdminAndOwnership (indirect tests via createProject)", () => {
  it("44 — should throw 403 when user role is 'member' (not admin)", async () => {
    mockUserRepo.findById.mockResolvedValue([MEMBER_USER]);

    let error: unknown;
    try {
      await service.createProject({ title: "Test", ownerId: 2 });
    } catch (e) {
      error = e;
    }

    logIO("checkAdminAndOwnership — member role", { ownerId: 2 }, {
      error: (error as Error)?.message,
      statusCode: (error as any)?.statusCode,
    });

    expect(error).toBeInstanceOf(AppError);
    expect((error as any).statusCode).toBe(403);
    expect((error as Error).message).toBe("Only admins can perform this action");
  });

  it("45 — should throw 403 when valid admin tries to act on project owned by a different admin", async () => {
    mockUserRepo.findById.mockResolvedValue([OTHER_ADMIN]); // admin id=3
    mockProjectRepo.getProjectById.mockResolvedValue([FAKE_PROJECT]); // ownerId=1

    let error: unknown;
    try {
      await service.updateProject(10, { title: "Hijack" }, 3);
    } catch (e) {
      error = e;
    }

    logIO("checkAdminAndOwnership — different admin's project", { projectId: 10, requesterId: 3 }, {
      error: (error as Error)?.message,
      statusCode: (error as any)?.statusCode,
    });

    expect(error).toBeInstanceOf(AppError);
    expect((error as any).statusCode).toBe(403);
    expect((error as Error).message).toBe("You are not the owner of this project");
  });
});
