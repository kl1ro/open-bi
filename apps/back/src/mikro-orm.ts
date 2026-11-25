import { Migrator } from "@mikro-orm/migrations";
import { defineConfig, type Options } from "@mikro-orm/postgresql";

import { USER_SCHEMA } from "./users/user.schema.js";

export function createMikroOrmConfig(deps: CreateMikroOrmConfigDeps): Options {
  return defineConfig({
    clientUrl: deps.databaseUrl,
    entities: [USER_SCHEMA],
    extensions: [Migrator],

    migrations: {
      path: "dist/migrations",
      pathTs: "src/migrations",
    },
  });
}

export interface CreateMikroOrmConfigDeps {
  databaseUrl: string;
}
