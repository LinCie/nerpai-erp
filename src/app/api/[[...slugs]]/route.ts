import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { authPlugin } from "@/shared/infrastructure/auth/auth-plugin";
import { productModuleRoutes } from "@/modules/products/presentation/routes";
import { warehouseModuleRoutes } from "@/modules/warehouses/presentation/routes";

export const app = new Elysia({ prefix: "/api" })
  .use(
    swagger({
      path: "/swagger",
    }),
  )
  .use(
    cors({
      origin: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  )
  .use(authPlugin)
  .use(productModuleRoutes)
  .use(warehouseModuleRoutes)
  .get("/health", () => ({ status: "ok" }));

export const GET = app.fetch;
export const POST = app.fetch;
export const PUT = app.fetch;
export const PATCH = app.fetch;
export const DELETE = app.fetch;
export const OPTIONS = app.fetch;
