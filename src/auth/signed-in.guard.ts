import { Injectable, type CanActivate, type ExecutionContext } from "@nestjs/common";
import type { Request } from "express";

import { getSessionUserId } from "../session.js";

@Injectable()
export class SignedInGuard implements CanActivate {
  public canActivate(context: ExecutionContext) {
    ensureSignedIn(context);
    return true;
  }
}

function ensureSignedIn(context: ExecutionContext) {
  const request = context.switchToHttp().getRequest<Request>();
  getSessionUserId(request.session);
}
