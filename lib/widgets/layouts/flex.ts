import { AbstractLayout } from "../layout";

export default interface Flex extends AbstractLayout {
  layout: "flex";
  direction: FlexDirection;
  gap?: number;
}

export type FlexDirection = "row" | "column";
