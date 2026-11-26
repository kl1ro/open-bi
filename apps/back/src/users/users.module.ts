import { Module } from "@nestjs/common";
import { AiMikroOrmUserRepository } from "@ai/mikro-orm-user-repository";

import { UserRepository } from "./repository/user.repository.js";
import { UsersController } from "./users.controller.js";
import { UsersService } from "./users.service.js";

@Module({
  providers: [
    { provide: UserRepository, useClass: AiMikroOrmUserRepository },
    UsersService,
  ],
  exports: [UserRepository],
  controllers: [UsersController],
})
export class UsersModule {}
