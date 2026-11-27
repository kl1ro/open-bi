import { randomUUIDv7 } from "crypto";

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { MikroORM } from "@mikro-orm/core";
import { Test } from "@nestjs/testing";
import { MikroOrmModule } from "@mikro-orm/nestjs";

import { devConfig } from "../../mikro-orm.config.js";
import { UsersModule } from "../users.module.js";
import { EmailTakenError, UserNotFoundError, UserRepository } from "./user.repository.js";
import type User from "./user.js";

let orm: MikroORM;
let repository: UserRepository;

const NUMBER_TO_SEED = 1000;

describe("User repository", () => {
  setupOrm();
  cleanupBeforeEachTest();

  testRepositoryExist();

  testUserCanBeCreated();
  testUsersCantHaveSameEmail();

  testUserCanBeDeletedById();

  testUserCanBeFoundById();
  testUserCanBeFoundByEmail();

  testUserCanBeGottenById();
  testGetUserByIdThrowsIfNotFound();

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

function testUserCanBeCreated() {
  it("User can be created", async () => {
    const draft = getUserDraft();
    const result = await repository.insertUser(draft);
    expect(result).toMatchObject(draft);
  });
}

function testUsersCantHaveSameEmail() {
  it("Users can't have same email", async () => {
    const draft = getUserDraft();
    await repository.insertUser(draft);
    const promise = repository.insertUser(draft);
    await expect(promise).rejects.toThrow(EmailTakenError);
  });
}

function testUserCanBeFoundById() {
  it("User can be found by ID", async () => {
    const seeded = await seedUsers();
    const expected = getRandomUser(seeded);
    const result = await repository.findUserById(expected.id);
    expect(result).toStrictEqual(expected);
  });
}

function testUserCanBeFoundByEmail() {
  it("User can be found by email", async () => {
    const seeded = await seedUsers();
    const expected = getRandomUser(seeded);
    const result = await repository.findUserByEmail(expected.email);
    expect(result).toStrictEqual(expected);
  });
}

function testUserCanBeGottenById() {
  it("User can be gotten by ID", async () => {
    const seeded = await seedUsers();
    const expected = getRandomUser(seeded);
    const result = await repository.getUserById(expected.id);
    expect(result).toStrictEqual(expected);
  });
}

function testGetUserByIdThrowsIfNotFound() {
  it("getUserById throws if user not found", async () => {
    const promise = repository.getUserById(randomUUIDv7());
    await expect(promise).rejects.toThrow(UserNotFoundError);
  });
}

function testUserCanBeDeletedById() {
  it("User can be deleted by ID", async () => {
    const seeded = await seedUsers();
    const toDelete = getRandomUser(seeded);
    const result = await repository.deleteUserById(toDelete.id);
    expect(result).toBeUndefined();
  });
}

function cleanupAfterAllTests() {
  afterAll(async () => {
    await orm.close();
  });
}

function getUserDraft() {
  const draft = {
    email: "test@test.com",
    passwordHash: "testhash",
  };

  return draft;
}

function getRandomUser(users: User[]) {
  if (!users.length) throw new Error("getRandomUser has empty input array");
  const randomIndex = Math.round(Math.random() * NUMBER_TO_SEED);
  const user = users.at(randomIndex)!;
  return user;
}

async function seedUsers() {
  const drafts = getSeedDrafts();
  const promises = drafts.map((draft) => repository.insertUser(draft));
  const seeded = await Promise.all(promises);
  return seeded;
}

function getSeedDrafts() {
  const draft = getUserDraft();

  const drafts = Array.from({ length: NUMBER_TO_SEED }).map(
    (empty, i) =>
      ({
        ...draft,
        email: `${i}.${draft.email}`,
      }) as const,
  );

  return drafts;
}
