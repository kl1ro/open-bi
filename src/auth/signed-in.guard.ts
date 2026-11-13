import { Injectable, type CanActivate, type ExecutionContext } from "@nestjs/common";
import type { Request } from "express";

import { getSessionUserId } from "../session.js";
import type User from "../users/user.js";

@Injectable()
export class SignedInGuard implements CanActivate {
  public canActivate(context: ExecutionContext) {
    getSignedInUserId(context);
    return true;
  }
}

function getSignedInUserId(context: ExecutionContext): User["id"] {
  const request = context.switchToHttp().getRequest<Request>();
  return getSessionUserId(request.session);
}
