import {
  applyDecorators,
  Catch,
  ConflictException,
  UnauthorizedException,
  UseFilters,
  type ArgumentsHost,
} from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";

import { EmailTakenError } from "../users/user.repository.js";
import { InvalidCredentialsError } from "./auth.service.js";

export function UseAuthFilter() {
  return applyDecorators(UseSignUpFilter(), UseSignInFilter());
}

export function UseSignUpFilter() {
  return UseFilters(EmailTakenFilter);
}

export function UseSignInFilter() {
  return UseFilters(InvalidCredentialsFilter);
}

@Catch(EmailTakenError)
export class EmailTakenFilter extends BaseExceptionFilter {
  public catch(error: EmailTakenError, host: ArgumentsHost) {
    super.catch(new ConflictException("This email is already taken"), host);
  }
}

@Catch(InvalidCredentialsError)
export class InvalidCredentialsFilter extends BaseExceptionFilter {
  public catch(error: InvalidCredentialsError, host: ArgumentsHost) {
    super.catch(new UnauthorizedException("Wrong email or password"), host);
  }
}
