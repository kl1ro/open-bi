import { Injectable } from "@nestjs/common";
import * as argon2 from "argon2";
import { v7 as uuidv7 } from "uuid";

import type User from "../users/repository/user.js";
import { UserRepository } from "../users/repository/user.repository.js";
import type { CredentialsDto } from "./credentials.dto.js";
import { UserForm } from "../users/repository/user.js";

@Injectable()
export class AuthService {
  public constructor(private readonly userRepository: UserRepository) {}

  public async signUp(credentials: CredentialsDto): Promise<User> {
    const form = await createUserForm(credentials);
    const user = await this.userRepository.insertUser(form);
    return user;
  }

  public async signIn(credentials: CredentialsDto): Promise<User> {
    const user = await this.userRepository.findUserByEmail(credentials.email);
    const isPasswordCorrect = await verifyUserPassword(user, credentials.password);
    if (!user || !isPasswordCorrect) throw new InvalidCredentialsError();
    return user;
  }
}

export class InvalidCredentialsError extends Error {
  public name = InvalidCredentialsError.name;

  public constructor(options?: ErrorOptions) {
    super("The email or the password is wrong", options);
  }
}

async function createUserForm(credentials: CredentialsDto): Promise<UserForm> {
  const passwordHash = await argon2.hash(credentials.password);
  return { email: credentials.email, passwordHash };
}

async function verifyUserPassword(user: User | undefined, password: string) {
  const passwordHash = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
  return argon2.verify(passwordHash, password);
}

const DUMMY_PASSWORD_HASH = await argon2.hash(uuidv7());
