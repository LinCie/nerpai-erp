import { treaty } from "@elysiajs/eden";
import { app } from "@/app/api/[[...slugs]]/route";

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const api =
  typeof process !== "undefined"
    ? treaty(app, {
        fetch: { credentials: "include" },
      }).api
    : treaty<typeof app>(baseUrl, {
        fetch: { credentials: "include" },
      }).api;
