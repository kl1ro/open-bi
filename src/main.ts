import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";

import { AppModule } from "./app.module.js";
import type Environment from "./env.js";
import { createSessionMiddleware } from "./session.js";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get<ConfigService<Environment, true>>(ConfigService);

  const deps = {
    redisUrl: config.get("redisUrl", { infer: true }),
    sessionSecret: config.get("sessionSecret", { infer: true }),
    cookieSecure: config.get("cookieSecure", { infer: true }),
  };

  app.set("trust proxy", config.get("trustProxy", { infer: true }));
  app.use(await createSessionMiddleware(deps));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(config.get("port", { infer: true }));
}

await bootstrap();
