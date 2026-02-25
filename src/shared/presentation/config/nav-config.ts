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
