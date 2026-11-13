import {
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from "@nestjs/common";
import type { Request } from "express";

import { findSessionUserId } from "../session.js";
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
  const userId = findSessionUserId(request.session);
  if (!userId) throw new UnauthorizedException();
  return userId;
}
