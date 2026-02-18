import type { AuthResponse, MeResponse, Order, OrderCustomer, OrderItemInput, Product, SalesSummary } from "./types";


<<<<<<< HEAD
  const API_BASE_URL = "https://varsha-ayurveda-shop-admin-pay-3.onrender.com"  ;
=======
  const API_BASE_URL = 'https://varsha-ayurveda-shop-admin-pay-3.onrender.com';
    //import.meta.env.VITE_API_BASE_URL || "http://localhost:4000" ;
>>>>>>> 9d6fe6e30ebe8d9989a98cd84d1d8dc66408c55f


const AUTH_TOKEN_KEY = "varshaAyurveda.authToken.v1";

export function getToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (!token) localStorage.removeItem(AUTH_TOKEN_KEY);
    else localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

type ProductsResponse = {
  total: number;
  limit: number;
  offset: number;
  items: Product[];
};

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    const ct = res.headers.get("content-type") || "";
    let message = `Request failed: ${res.status}`;

    try {
      if (ct.includes("application/json")) {
        const data: any = await res.json();
        message = data?.error || data?.message || message;
      } else {
        const raw = await res.text();
        const trimmed = (raw || "").trim();
        if (trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html")) {
          message = "Server error (backend returned HTML). Check the backend terminal logs.";
        } else if (trimmed) {
          message = trimmed.length > 300 ? trimmed.slice(0, 300) + "…" : trimmed;
        }
      }
    } catch {
      // ignore
    }

    throw new Error(message);
  }

  if (res.status === 204) return undefined as unknown as T;

  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    return (await res.text()) as unknown as T;
  }

  return (await res.json()) as T;
}


export async function fetchProducts(params?: {
  q?: string;
  category?: string;
  limit?: number;
  offset?: number;
}): Promise<ProductsResponse> {
  const usp = new URLSearchParams();
  if (params?.q) usp.set("q", params.q);
  if (params?.category) usp.set("category", params.category);
  if (params?.limit) usp.set("limit", String(params.limit));
  if (params?.offset) usp.set("offset", String(params.offset));

  const qs = usp.toString();
  return http<ProductsResponse>(`/api/products${qs ? `?${qs}` : ""}`);
}

export async function fetchProduct(id: string): Promise<Product> {
  return http<Product>(`/api/products/${id}`);
}

export async function createOrder(input: {
  customer: OrderCustomer;
  items: OrderItemInput[];
  paymentMethod?: "COD" | string;
}): Promise<Order> {
  return http<Order>("/api/orders", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchOrder(id: string): Promise<Order> {
  return http<Order>(`/api/orders/${id}`);
}

export async function fetchMyOrders(): Promise<{ items: Order[] }> {
  return http<{ items: Order[] }>("/api/my/orders");
}


// ----- AUTH -----
export async function signup(input: { name: string; email: string; password: string }): Promise<AuthResponse> {
  return http<AuthResponse>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function login(input: { email: string; password: string }): Promise<AuthResponse> {
  return http<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function me(): Promise<MeResponse> {
  return http<MeResponse>("/api/auth/me");
}

export async function logout(): Promise<{ ok: true }> {
  return http<{ ok: true }>("/api/auth/logout", {
    method: "POST",
  });
}

// ----- ADMIN -----
export async function adminFetchOrders(params?: { q?: string; status?: string }): Promise<{ items: Order[] }> {
  const usp = new URLSearchParams();
  if (params?.q) usp.set("q", params.q);
  if (params?.status) usp.set("status", params.status);
  const qs = usp.toString();
  return http<{ items: Order[] }>(`/api/admin/orders${qs ? `?${qs}` : ""}`);
}

export async function adminFetchOrder(id: string): Promise<Order> {
  return http<Order>(`/api/admin/orders/${id}`);
}

export async function adminUpdateOrderStatus(id: string, status: string): Promise<Order> {
  return http<Order>(`/api/admin/orders/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

export async function adminMarkOrderPaid(id: string): Promise<Order> {
  return http<Order>(`/api/admin/orders/${id}/mark-paid`, {
    method: "PUT",
  });
}

export async function adminSalesSummary(): Promise<SalesSummary> {
  return http<SalesSummary>("/api/admin/sales/summary");
}

export async function adminCreateProduct(input: Partial<Product>): Promise<Product> {
  return http<Product>("/api/admin/products", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function adminUpdateProduct(id: string, input: Partial<Product>): Promise<Product> {
  return http<Product>(`/api/admin/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function adminDeleteProduct(id: string): Promise<{ ok: true }> {
  return http<{ ok: true }>(`/api/admin/products/${id}`, {
    method: "DELETE",
  });
}

// ----- PAYMENTS: Razorpay -----
export async function razorpayCreateOrder(input: {
  customer: OrderCustomer;
  items: OrderItemInput[];
}): Promise<{ orderId: string; razorpay: { keyId: string; orderId: string; amount: number; currency: string } }> {
  return http(`/api/payments/razorpay/create-order`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function razorpayVerifyPayment(input: {
  orderId: string;
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}): Promise<{ ok: true; order: Order }> {
  return http(`/api/payments/razorpay/verify`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
