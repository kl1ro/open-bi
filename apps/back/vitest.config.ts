import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const BACK_SOURCE = fileURLToPath(new URL("./src/", import.meta.url));

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: [
      {
        find: "@ai/mikro-orm-user-repository",
        replacement: fileURLToPath(
          new URL(
            "../../packages/ai-mikro-orm-user-repository/src/mikro-orm-user-repository.ts",
            import.meta.url,
          ),
        ),
      },
      {
        find: /^open-bi-back\/(.*)\.js$/,
        replacement: `${BACK_SOURCE}$1.ts`,
      },
    ],
  },
  test: {
    globals: true,
    root: "./",
    include: ["**/*.test.ts"],
    reporters: ["verbose"],
  },
});
