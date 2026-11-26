import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { MikroORM } from "@mikro-orm/core";
import { Test } from "@nestjs/testing";
import { MikroOrmModule } from "@mikro-orm/nestjs";

import { devConfig } from "../../mikro-orm.config.js";
import { UsersModule } from "../users.module.js";
import { EmailTakenError, UserRepository } from "./user.repository.js";

let orm: MikroORM;
let repository: UserRepository;

describe("MikroOrmUserRepository", () => {
  setupOrm();
  cleanupBeforeEachTest();

  testRepositoryExist();
  testUserCreation();
  testUserFindByEmail();
  testUserEmailUniqueConstraint();

  cleanupAfterAllTests();
});

function setupOrm() {
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [MikroOrmModule.forRoot(devConfig), UsersModule],
    }).compile();

    orm = moduleRef.get(MikroORM);
    repository = moduleRef.get(UserRepository);
  });
}

function cleanupBeforeEachTest() {
  beforeEach(async () => {
    await orm.em.getConnection().execute("truncate table users cascade");
    orm.em.clear();
  });
}

function testRepositoryExist() {
  it("Repository exists", () => {
    expect(repository).toBeDefined();
  });
}

function testUserCreation() {
  it("User can be created", async () => {
    const { draft } = getUserCreationTestSetup();
    const result = await repository.insertUser(draft);
    expect(result).toBeUndefined();
  });
}

function testUserFindByEmail() {
  it("User can be found by email", async () => {
    const { draft } = getUserCreationTestSetup();
    await repository.insertUser(draft);
    const result = await repository.findUserByEmail(draft.email);
    expect(result).toMatchObject(draft);
  });
}

function testUserEmailUniqueConstraint() {
  it("Users can't have same email", async () => {
    const { draft } = getUserCreationTestSetup();
    await repository.insertUser(draft);
    const promise = repository.insertUser(draft);
    await expect(promise).rejects.toThrow(EmailTakenError);
  });
}

function cleanupAfterAllTests() {
  afterAll(async () => {
    await orm.close();
  });
}

function getUserCreationTestSetup() {
  const draft = {
    email: "test@test.com",
    passwordHash: "testhash",
  };

  return { draft };
}
