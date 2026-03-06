import { Elysia } from "elysia";
import { productRoutes } from "./product.routes";

export const productModuleRoutes = new Elysia({ prefix: "/products" }).use(
  productRoutes,
);
