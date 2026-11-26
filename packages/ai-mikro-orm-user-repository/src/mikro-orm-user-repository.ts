import { EntityManager, UniqueConstraintViolationException } from "@mikro-orm/postgresql";
import { Injectable } from "@nestjs/common";
import type User from "open-bi-back/users/repository/user.js";
import {
  EmailTakenError,
  UserInsertFailedError,
  UserLoadByEmailFailedError,
  UserLoadByIdFailedError,
  UserNotFoundError,
  UserRepository,
} from "open-bi-back/users/repository/user.repository.js";
import { USERS_EMAIL_UNIQUE } from "open-bi-back/users/repository/user.schema.js";

@Injectable()
export class AiMikroOrmUserRepository extends UserRepository {
  public constructor(private readonly entityManager: EntityManager) {
    super();
  }

  public async findUserByEmail(email: User["email"]): Promise<User | undefined> {
    try {
      const userEntity = getUserEntity(this.deps());
      const user = await this.entityManager.findOne(userEntity, { email });
      return user ?? undefined;
    } catch (error) {
      throw new UserLoadByEmailFailedError({ email, cause: error });
    }
  }

  public async findUserById(id: User["id"]): Promise<User | undefined> {
    try {
      const userEntity = getUserEntity(this.deps());
      const user = await this.entityManager.findOne(userEntity, { id });
      return user ?? undefined;
    } catch (error) {
      throw new UserLoadByIdFailedError({ id, cause: error });
    }
  }

  public async insertUser(user: User) {
    try {
      const userEntity = getUserEntity(this.deps());
      await this.entityManager.insert(userEntity, user);
    } catch (error) {
      throw interpretInsertUserError(error, user);
    }
  }

  public async getUserById(id: User["id"]): Promise<User> {
    const user = await this.findUserById(id);
    if (!user) throw new UserNotFoundError({ id });
    return user;
  }

  private deps(): GetUserEntityDeps {
    return { entityManager: this.entityManager };
  }
}

function getUserEntity(deps: GetUserEntityDeps) {
  const metadata = deps.entityManager.getMetadata().getByClassName<User>("User");
  return metadata.class;
}

interface GetUserEntityDeps {
  entityManager: EntityManager;
}

function interpretInsertUserError(
  error: unknown,
  user: User,
): EmailTakenError | UserInsertFailedError {
  if (isEmailUniqueViolation(error))
    return new EmailTakenError({ email: user.email, cause: error });

  return new UserInsertFailedError({ id: user.id, cause: error });
}

function isEmailUniqueViolation(error: unknown) {
  return (
    error instanceof UniqueConstraintViolationException &&
    getViolatedConstraint(error) === USERS_EMAIL_UNIQUE
  );
}

function getViolatedConstraint(error: UniqueConstraintViolationException): unknown {
  return "constraint" in error ? error.constraint : undefined;
}
