import { treaty } from "@elysiajs/eden";
import type { app } from "@/app/api/[[...slugs]]/route";

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const api = treaty<typeof app>(baseUrl, {
  fetch: { credentials: "include" },
}).api;
