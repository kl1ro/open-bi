import { AbstractLayout } from "../layout";

import Widget from "@/lib/widget";

export default interface Absolute extends AbstractLayout {
  layout: "absolute";
  children?: Widget[];
}
