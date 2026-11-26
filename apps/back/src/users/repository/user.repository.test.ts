import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { MikroORM } from "@mikro-orm/core";
import type { AiMikroOrmUserRepository } from "@ai/mikro-orm-user-repository";
import { Test } from "@nestjs/testing";
import { MikroOrmModule } from "@mikro-orm/nestjs";

import { devConfig } from "../../mikro-orm.config.js";
import { UsersModule } from "../users.module.js";
import { UserRepository } from "./user.repository.js";

let orm: MikroORM;
let repository: AiMikroOrmUserRepository;

describe("MikroOrmUserRepository", () => {
  setupOrm();
  cleanupBeforeEachTest();

  testRepositoryExist();

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

function cleanupAfterAllTests() {
  afterAll(async () => {
    await orm.close();
  });
}
