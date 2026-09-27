/** Naira formatter */
export const formatNaira = (amount: number | string): string => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
};

/** Short naira (e.g. ₦1.2M) */
export const formatNairaShort = (amount: number): string => {
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000)     return `₦${(amount / 1_000).toFixed(1)}K`;
  return `₦${amount.toFixed(0)}`;
};

/** Percent change label */
export const percentChange = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 100);
};

/** Format date string */
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

/** Budget categories with their baseline monthly budget in Naira */
export const BUDGET_CATEGORIES = [
  { name: "Tithe",                    budget: 500_000,  color: "#10b981" },
  { name: "Savings",                   budget: 1_000_000, color: "#0ea5e9" },
  { name: "Meat & Pepper",             budget: 200_000,  color: "#f59e0b" },
  { name: "Frozen Protein",            budget: 150_000,  color: "#8b5cf6" },
  { name: "Toiletries",                budget: 100_000,  color: "#ec4899" },
  { name: "Groceries",                 budget: 300_000,  color: "#f97316" },
  { name: "Personal Inside Garments",  budget: 100_000,  color: "#14b8a6" },
  { name: "Medication",                budget: 80_000,   color: "#ef4444" },
  { name: "Self Care",                 budget: 120_000,  color: "#a855f7" },
  { name: "Office Feeding",            budget: 200_000,  color: "#3b82f6" },
  { name: "Miscellaneous",             budget: 250_000,  color: "#6b7280" },
  { name: "Weekly Veggies & Water",    budget: 100_000,  color: "#22c55e" },
  { name: "Fuel",                      budget: 400_000,  color: "#64748b" },
] as const;

export const TOTAL_MONTHLY_BUDGET = BUDGET_CATEGORIES.reduce(
  (sum, c) => sum + c.budget,
  0,
); // 3_500_000
