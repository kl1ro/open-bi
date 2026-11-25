import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  public getHealth(): HealthView {
    return { status: "ok" };
  }
}

export interface HealthView {
  status: "ok";
}
