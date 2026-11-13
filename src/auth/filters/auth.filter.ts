import { applyDecorators } from "@nestjs/common";

import { UseSignInFilter } from "./sign-in.filter.js";
import { UseSignUpFilter } from "./sign-up.filter.js";

export function UseAuthFilter() {
  return applyDecorators(UseSignUpFilter(), UseSignInFilter());
}
