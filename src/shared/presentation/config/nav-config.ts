import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Warehouse,
  PackageOpen,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  items?: {
    title: string;
    url: string;
    icon?: LucideIcon;
  }[];
};

export const navItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    isActive: false,
    items: [],
  },
  {
    title: "Products",
    url: "/products",
    icon: Package,
    isActive: false,
    items: [
      {
        title: "All Products",
        url: "/products",
      },
      {
        title: "Attributes",
        url: "/products/attributes",
      },
      {
        title: "Trash",
        url: "/products/trash",
      },
    ],
  },
  {
    title: "Inventory",
    url: "/inventory",
    icon: PackageOpen,
    isActive: false,
    items: [],
  },
  {
    title: "Warehouses",
    url: "/warehouses",
    icon: Warehouse,
    isActive: false,
    items: [
      {
        title: "All Warehouses",
        url: "/warehouses",
      },
      {
        title: "Trash",
        url: "/warehouses/trash",
      },
    ],
  },
  {
    title: "Orders",
    url: "/orders",
    icon: ShoppingCart,
    isActive: false,
    items: [
      {
        title: "All Orders",
        url: "/orders",
      },
      {
        title: "Pending",
        url: "/orders/pending",
      },
      {
        title: "Completed",
        url: "/orders/completed",
      },
      {
        title: "Create New",
        url: "/orders/new",
      },
    ],
  },
];
