import {
  EntityManager,
  UniqueConstraintViolationException,
  raw,
} from "@mikro-orm/postgresql";
import { Injectable } from "@nestjs/common";
import type User from "open-bi-back/users/repository/user.js";
import type { UserForm } from "open-bi-back/users/repository/user.js";
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

  public async insertUser(form: UserForm): Promise<User> {
    try {
      const id = await insertUserForm(form, this.deps());
      return await getInsertedUser(id, this.deps());
    } catch (error) {
      throw interpretInsertUserError(error, form);
    }
  }

  public async deleteUserById(id: User["id"]): Promise<void> {
    await deleteUserById(id, this.deps());
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

  public async getUserById(id: User["id"]): Promise<User> {
    const user = await this.findUserById(id);
    if (!user) throw new UserNotFoundError({ id });
    return user;
  }

  private deps(): GetUserEntityDeps {
    return { entityManager: this.entityManager };
  }
}

async function insertUserForm(form: UserForm, deps: InsertUserFormDeps) {
  const userEntity = getUserEntity(deps);

  return deps.entityManager.insert(userEntity, {
    email: form.email,
    passwordHash: form.passwordHash,
    createdAt: raw("now()"),
  });
}

interface InsertUserFormDeps {
  entityManager: EntityManager;
}

async function getInsertedUser(id: User["id"], deps: GetInsertedUserDeps): Promise<User> {
  const userEntity = getUserEntity(deps);
  const user = await deps.entityManager.findOne(userEntity, { id });
  if (!user) throw new UserInsertFailedError({ id });
  return user;
}

interface GetInsertedUserDeps {
  entityManager: EntityManager;
}

async function deleteUserById(id: User["id"], deps: DeleteUserByIdDeps) {
  const userEntity = getUserEntity(deps);
  await deps.entityManager.nativeDelete(userEntity, { id });
}

interface DeleteUserByIdDeps {
  entityManager: EntityManager;
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
  form: UserForm,
): EmailTakenError | UserInsertFailedError {
  if (error instanceof UserInsertFailedError) return error;

  if (isEmailUniqueViolation(error))
    return new EmailTakenError({ email: form.email, cause: error });

  throw error;
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
