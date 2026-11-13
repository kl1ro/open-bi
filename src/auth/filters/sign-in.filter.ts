import {
  Catch,
  UnauthorizedException,
  UseFilters,
  type ArgumentsHost,
} from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";

import { InvalidCredentialsError } from "../auth.service.js";

export function UseSignInFilter() {
  return UseFilters(InvalidCredentialsFilter);
}

@Catch(InvalidCredentialsError)
export class InvalidCredentialsFilter extends BaseExceptionFilter {
  public catch(error: InvalidCredentialsError, host: ArgumentsHost) {
    super.catch(new UnauthorizedException("Wrong email or password"), host);
  }
}
