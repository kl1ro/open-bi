import "reflect-metadata";

import { validateEnvironment } from "./env.js";
import { createMikroOrmConfig } from "./mikro-orm.js";

const environment = validateEnvironment(process.env);
const deps = { databaseUrl: environment.databaseUrl };
export default createMikroOrmConfig(deps);
