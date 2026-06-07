import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "PicknDrop",
  version: packageJson.version,
  copyright: `© ${currentYear}, PicknDrop.`,
  meta: {
    title: "PicknDrop Admin — Food Delivery Operations",
    description:
      "PicknDrop Admin Panel for managing food delivery orders, drivers, restaurants, customers, pricing, and hardware.",
  },
};
