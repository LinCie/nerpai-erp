import { Elysia } from "elysia";
import { warehouseRoutes } from "./warehouse.routes";

export const warehouseModuleRoutes = new Elysia({ prefix: "/warehouses" }).use(
  warehouseRoutes,
);
