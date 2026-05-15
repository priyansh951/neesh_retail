export interface SalesData {
  Store: string;
  "Bill Date": string;
  Icode: string;
  "Product Name": string;
  Department: string;
  Node: string;
  MRP: string;
  RSP: string;
  Qty: string;
  "Basic Amt": string;
  "Promo Amt": string;
  "Coupon Amt": string;
  "Net Sale Amt": string;
  "Payment Mode": string;
}

export type DashboardPage = "overview" | "stores" | "products" | "trends";

export interface DashboardFilters {
  dateRange: { from: Date; to: Date } | undefined;
  stores: string[];
  departments: string[];
  products: string[];
}

export interface KPIStats {
  value: number;
  previousValue: number;
  percentageChange: number;
  trend: "up" | "down" | "neutral";
}
