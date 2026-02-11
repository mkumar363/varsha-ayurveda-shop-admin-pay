export type User = {
  id: string;
  name: string;
  email: string;
  role?: "customer" | "admin";
  createdAt?: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type MeResponse = {
  user: User;
};

export type Product = {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  pack?: string;
  price?: number | null;
  currency?: string | null;
  image?: string;
  shortDescription?: string;
  tags?: string[];
};

export type CartItem = {
  product: Product;
  qty: number;
};

export type OrderCustomer = {
  name: string;
  phone: string;
  email?: string;
  address: string;
};

export type OrderItemInput = {
  productId: string;
  qty: number;
};

export type Order = {
  id: string;
  createdAt: string;
  updatedAt?: string;
  status: string;
  userId?: string | null;
  payment?: {
    method?: "COD" | "RAZORPAY" | string;
    status?: "UNPAID" | "PENDING" | "PAID" | "FAILED" | string;
    provider?: string | null;
    providerOrderId?: string | null;
    providerPaymentId?: string | null;
    verifiedAt?: string | null;
  };
  customer: OrderCustomer;
  items: Array<{
    productId: string;
    qty: number;
    name: string;
    pack?: string;
    price?: number | null;
    currency?: string | null;
  }>;
  total: number | null;
  currency: string | null;
};

export type SalesSummary = {
  counts: {
    ordersTotal: number;
    ordersPaid: number;
    usersTotal: number;
  };
  revenue: { currency: string; total: number };
  topProducts: Array<{ productId: string; name: string; qty: number; revenue: number }>;
  recentOrders: Order[];
};
