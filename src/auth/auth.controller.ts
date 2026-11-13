import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Request, Response } from "express";

import { clearSessionCookie, destroySession, startUserSession } from "../session.js";
import type User from "../users/user.js";
import { convertUserToView, type UserView } from "../users/user.js";
import { AuthService } from "./auth.service.js";
import { CredentialsDto } from "./credentials.dto.js";
import { UseSignInFilter } from "./filters/sign-in.filter.js";
import { UseSignUpFilter } from "./filters/sign-up.filter.js";
import { UseSignedInUserFilter } from "./filters/signed-in-user.filter.js";
import { SignedInGuard, SignedInUserId } from "./signed-in.guard.js";

@Controller("auth")
export class AuthController {
  public constructor(private readonly authService: AuthService) {}

  @Post("sign-up")
  @UseSignUpFilter()
  public async signUp(
    @Body() credentials: CredentialsDto,
    @Req() request: Request,
  ): Promise<UserView> {
    const user = await this.authService.signUp(credentials);
    const deps = { request };
    await startUserSession(user, deps);
    return convertUserToView(user);
  }

  @Post("sign-in")
  @UseSignInFilter()
  @HttpCode(HttpStatus.OK)
  public async signIn(
    @Body() credentials: CredentialsDto,
    @Req() request: Request,
  ): Promise<UserView> {
    const user = await this.authService.signIn(credentials);
    const deps = { request };
    await startUserSession(user, deps);
    return convertUserToView(user);
  }

  @Post("sign-out")
  @HttpCode(HttpStatus.NO_CONTENT)
  public async signOut(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await destroySession(request.session);
    clearSessionCookie(response);
  }

  @Get("me")
  @UseGuards(SignedInGuard)
  @UseSignedInUserFilter()
  public async getSignedInUser(@SignedInUserId() id: User["id"]): Promise<UserView> {
    const user = await this.authService.loadSignedInUser(id);
    return convertUserToView(user);
  }
}
