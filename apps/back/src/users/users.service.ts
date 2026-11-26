import { Injectable } from "@nestjs/common";
import type { Request } from "express";

import { getSessionUserId } from "../session.js";
import type User from "./repository/user.js";
import { UserRepository } from "./repository/user.repository.js";

@Injectable()
export class UsersService {
  public constructor(private readonly userRepository: UserRepository) {}

  public async getMe(session: Request["session"]): Promise<User> {
    const myId = getSessionUserId(session);
    return this.userRepository.getUserById(myId);
  }
}
