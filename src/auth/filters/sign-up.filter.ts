import { Catch, ConflictException, UseFilters, type ArgumentsHost } from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";

import { EmailTakenError } from "../../users/user.repository.js";

export function UseSignUpFilter() {
  return UseFilters(EmailTakenFilter);
}

@Catch(EmailTakenError)
export class EmailTakenFilter extends BaseExceptionFilter {
  public catch(error: EmailTakenError, host: ArgumentsHost) {
    super.catch(new ConflictException("This email is already taken"), host);
  }
}
