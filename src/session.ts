import { RedisStore } from "connect-redis";
import type { Request, Response } from "express";
import session, { type Session, type SessionOptions } from "express-session";
import { createClient } from "redis";

import type User from "./users/user.js";

declare module "express-session" {
  interface SessionData {
    userId: User["id"];
  }
}

const SESSION_COOKIE_NAME = "sid";
const SESSION_LIFETIME = 30 * 24 * 60 * 60 * 1000;

export async function createSessionMiddleware(deps: CreateSessionMiddlewareDeps) {
  const store = await createRedisSessionStore(deps);
  const options = createSessionOptions(store, deps);
  return session(options);
}

export interface CreateSessionMiddlewareDeps {
  redisUrl: string;
  sessionSecret: string;
  cookieSecure: boolean;
}

async function createRedisSessionStore(
  deps: CreateRedisSessionStoreDeps,
): Promise<RedisStore> {
  const client = await connectRedisClient(deps);
  return new RedisStore({ client });
}

interface CreateRedisSessionStoreDeps {
  redisUrl: string;
}

function createSessionOptions(
  store: RedisStore,
  deps: CreateSessionOptionsDeps,
): SessionOptions {
  return {
    store,
    name: SESSION_COOKIE_NAME,
    secret: deps.sessionSecret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: deps.cookieSecure,
      sameSite: "lax",
      maxAge: SESSION_LIFETIME,
    },
  };
}

interface CreateSessionOptionsDeps {
  sessionSecret: string;
  cookieSecure: boolean;
}

async function connectRedisClient(deps: ConnectRedisClientDeps) {
  return createClient({ url: deps.redisUrl }).connect();
}

interface ConnectRedisClientDeps {
  redisUrl: string;
}

export async function startUserSession(user: User, deps: StartUserSessionDeps) {
  await startSession(deps.request.session);
  attachUserToSession(user, deps.request.session);
}

export interface StartUserSessionDeps {
  request: Request;
}

export function startSession(session: Session): Promise<void> {
  return new Promise((resolve, reject) => {
    session.regenerate((error: unknown) =>
      error ? reject(new StartSessionError({ cause: error })) : resolve(),
    );
  });
}

export class StartSessionError extends Error {
  public name = StartSessionError.name;

  public constructor(options: ErrorOptions) {
    super("Failed to start the session", options);
  }
}

export function attachUserToSession(user: User, session: Request["session"]) {
  session.userId = user.id;
}

export function getSessionUserId(session: Request["session"]): User["id"] {
  const userId = findSessionUserId(session);
  if (!userId) throw new NotSignedInError();
  return userId;
}

export class NotSignedInError extends Error {
  public name = NotSignedInError.name;

  public constructor(options?: ErrorOptions) {
    super("No user is attached to the session", options);
  }
}

export function findSessionUserId(session: Request["session"]): User["id"] | undefined {
  return session.userId;
}

export function destroySession(session: Session): Promise<void> {
  return new Promise((resolve, reject) => {
    session.destroy((error: unknown) =>
      error ? reject(new DestroySessionError({ cause: error })) : resolve(),
    );
  });
}

export class DestroySessionError extends Error {
  public name = DestroySessionError.name;

  public constructor(options: ErrorOptions) {
    super("Failed to destroy the session", options);
  }
}

export function clearSessionCookie(response: Response) {
  response.clearCookie(SESSION_COOKIE_NAME);
}
