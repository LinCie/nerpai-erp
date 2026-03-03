import { Icons, type Icon } from "@/shared/presentation/components/icons";

export type NavItem = {
  title: string;
  url: string;
  icon?: Icon;
  isActive?: boolean;
  items?: {
    title: string;
    url: string;
    icon?: Icon;
  }[];
};

export const navItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/",
    icon: Icons.dashboard,
    isActive: false,
    items: [],
  },
  {
    title: "Products",
    url: "/products",
    icon: Icons.products,
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
    icon: Icons.packageOpen,
    isActive: false,
    items: [],
  },
  {
    title: "Warehouses",
    url: "/warehouses",
    icon: Icons.warehouse,
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
    icon: Icons.orders,
    isActive: false,
    items: [
      {
        title: "All Orders",
        url: "/orders",
      },
    ],
  },
];
