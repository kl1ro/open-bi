import "reflect-metadata";

import { validateEnvironment } from "./env.js";
import { createMikroOrmConfig } from "./mikro-orm.js";

const environment = validateEnvironment(process.env);
const deps = { databaseUrl: environment.databaseUrl };

const config = createMikroOrmConfig(deps);
export const devConfig: typeof config = { ...config, allowGlobalContext: true };
export default config;
