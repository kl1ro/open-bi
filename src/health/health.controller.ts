import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  public getHealth(): Health {
    return { status: "ok" };
  }
}

export interface Health {
  status: "ok";
}
