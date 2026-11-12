import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { validateEnvironment } from "./environment.js";
import { HealthModule } from "./health/health.module.js";

@Module({
  imports: [ConfigModule.forRoot({ validate: validateEnvironment }), HealthModule],
})
export class AppModule {}
