import {
  LayoutDashboard,
  Package,
  ShoppingCart,
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
        title: "Categories",
        url: "/products/categories",
      },
      {
        title: "Inventory",
        url: "/products/inventory",
      },
      {
        title: "Create New",
        url: "/products/new",
      },
      {
        title: "Trash",
        url: "/products/trash",
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
