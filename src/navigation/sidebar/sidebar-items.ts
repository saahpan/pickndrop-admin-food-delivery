import {
  Camera,
  Car,
  ChartBar,
  Globe,
  LayoutDashboard,
  MapPin,
  MessageSquare,
  type LucideIcon,
  Scale,
  ShoppingBag,
  UtensilsCrossed,
  Users,
  Wallet,
} from "lucide-react";

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard/default",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    id: 2,
    label: "Food Operations",
    items: [
      {
        title: "Orders",
        url: "/dashboard/orders",
        icon: ShoppingBag,
        subItems: [
          { title: "All Orders", url: "/dashboard/orders" },
          { title: "Live Tracking", url: "/dashboard/orders/tracking", icon: MapPin },
        ],
      },
      {
        title: "Restaurants",
        url: "/dashboard/restaurants",
        icon: UtensilsCrossed,
      },
      {
        title: "Customers",
        url: "/dashboard/customers",
        icon: Users,
      },
      {
        title: "Drivers",
        url: "/dashboard/drivers",
        icon: Car,
      },
    ],
  },
  {
    id: 3,
    label: "Hardware & Finance",
    items: [
      {
        title: "Cameras",
        url: "/dashboard/cameras",
        icon: Camera,
      },
      {
        title: "Payouts",
        url: "/dashboard/payouts",
        icon: Wallet,
      },
    ],
  },
  {
    id: 4,
    label: "Pricing Engine",
    items: [
      {
        title: "Regions",
        url: "/dashboard/pricing/regions",
        icon: Globe,
      },
      {
        title: "Floor Compliance",
        url: "/dashboard/pricing/compliance",
        icon: Scale,
      },
      {
        title: "Estimation Logs",
        url: "/dashboard/pricing/logs",
        icon: ChartBar,
      },
    ],
  },
  {
    id: 5,
    label: "Support",
    items: [
      {
        title: "Support Chat",
        url: "/dashboard/support",
        icon: MessageSquare,
      },
    ],
  },
];
