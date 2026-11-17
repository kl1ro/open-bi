import { Injectable, type CanActivate, type ExecutionContext } from "@nestjs/common";
import type { Request } from "express";

import { getRequestFromContext } from "../lib/http.js";
import { getSessionUserId } from "../session.js";

@Injectable()
export class SignedInGuard implements CanActivate {
  public canActivate(context: ExecutionContext) {
    ensureSignedIn(context);
    return true;
  }
}

function ensureSignedIn(context: ExecutionContext) {
  const session = getSessionFromContext(context);
  getSessionUserId(session);
}

function getSessionFromContext(context: ExecutionContext): Request["session"] {
  const request = getRequestFromContext(context);
  return request.session;
}
