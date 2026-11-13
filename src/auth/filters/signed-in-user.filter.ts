import {
  Catch,
  UnauthorizedException,
  UseFilters,
  type ArgumentsHost,
} from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";

import { UserNotFoundError } from "../auth.service.js";

export function UseSignedInUserFilter() {
  return UseFilters(UserNotFoundFilter);
}

@Catch(UserNotFoundError)
export class UserNotFoundFilter extends BaseExceptionFilter {
  public catch(error: UserNotFoundError, host: ArgumentsHost) {
    super.catch(new UnauthorizedException("Not signed in"), host);
  }
}
