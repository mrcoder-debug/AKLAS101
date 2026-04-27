import { FlatCompat } from "@eslint/eslintrc";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // Hard rule from the plan: only /src/services and /prisma may import Prisma.
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/services/**", "src/lib/prisma.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@prisma/client",
              message:
                "Direct Prisma access is only allowed in src/services/* and src/lib/prisma.ts. Go through a service.",
            },
            {
              name: "@/lib/prisma",
              message:
                "Import the service that wraps this query rather than the Prisma client directly.",
            },
          ],
        },
      ],
    },
  },
];
