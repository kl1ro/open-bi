import {
  Catch,
  UnauthorizedException,
  UseFilters,
  type ArgumentsHost,
} from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";

import { NotSignedInError } from "../../session.js";
import { UserNotFoundError } from "../auth.service.js";

export function UseMeFilter() {
  return UseFilters(UserNotFoundFilter, NotSignedInFilter);
}

@Catch(UserNotFoundError)
export class UserNotFoundFilter extends BaseExceptionFilter {
  public catch(error: UserNotFoundError, host: ArgumentsHost) {
    super.catch(new UnauthorizedException("Not signed in"), host);
  }
}

@Catch(NotSignedInError)
export class NotSignedInFilter extends BaseExceptionFilter {
  public catch(error: NotSignedInError, host: ArgumentsHost) {
    super.catch(new UnauthorizedException("Not signed in"), host);
  }
}
