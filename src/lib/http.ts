import type { ExecutionContext } from "@nestjs/common";
import type { Request } from "express";

export function getRequestFromContext(context: ExecutionContext) {
  return context.switchToHttp().getRequest<Request>();
}
