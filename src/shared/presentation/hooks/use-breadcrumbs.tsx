"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

type BreadcrumbItem = {
  title: string;
  link: string;
};

const routeMapping: Record<string, BreadcrumbItem[]> = {
  "/": [{ title: "Dashboard", link: "/" }],
  "/products": [
    { title: "Dashboard", link: "/" },
    { title: "Products", link: "/products" },
  ],
  "/products/categories": [
    { title: "Dashboard", link: "/" },
    { title: "Products", link: "/products" },
    { title: "Categories", link: "/products/categories" },
  ],
  "/products/inventory": [
    { title: "Dashboard", link: "/" },
    { title: "Products", link: "/products" },
    { title: "Inventory", link: "/products/inventory" },
  ],
  "/products/new": [
    { title: "Dashboard", link: "/" },
    { title: "Products", link: "/products" },
    { title: "Create New", link: "/products/new" },
  ],
  "/orders": [
    { title: "Dashboard", link: "/" },
    { title: "Orders", link: "/orders" },
  ],
};

export function useBreadcrumbs() {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    if (routeMapping[pathname]) {
      return routeMapping[pathname];
    }

    const segments = pathname.split("/").filter(Boolean);
    return segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join("/")}`;
      return {
        title: segment.charAt(0).toUpperCase() + segment.slice(1),
        link: path,
      };
    });
  }, [pathname]);

  return breadcrumbs;
}
