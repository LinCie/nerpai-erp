import { Elysia } from "elysia";
import { attributeRoutes } from "./attribute.routes";
import { productRoutes } from "./product.routes";
import { variantRoutes } from "./variant.routes";

export const productModuleRoutes = new Elysia({ prefix: "/products" })
  .use(attributeRoutes)
  .use(productRoutes)
  .use(variantRoutes);
