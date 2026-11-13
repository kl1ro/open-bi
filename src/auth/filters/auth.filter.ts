import { applyDecorators } from "@nestjs/common";

import { UseSignInFilter } from "./sign-in.filter.js";
import { UseSignUpFilter } from "./sign-up.filter.js";
import { UseSignedInUserFilter } from "./signed-in-user.filter.js";

export function UseAuthFilter() {
  return applyDecorators(UseSignUpFilter(), UseSignInFilter(), UseSignedInUserFilter());
}
