"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "../utils/supabase";

export type Product = {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  createdAt: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type Order = {
  id: string;
  date: string;
  deliveryLocation: string;
  paymentMethod: string;
  status: "Pending" | "Shipped" | "Delivered" | "Cancelled";
  items: {
    productId: string;
    title: string;
    price: number;
    quantity: number;
  }[];
  totalPrice: number;
};

type User = {
  id: string;
  email: string;
  role: "customer" | "seller";
};

type AuthContextType = {
  user: User | null;
  mockRole: "guest" | "customer" | "seller";
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  login: (email: string, role: "customer" | "seller") => void; // Unused in real flow but kept for type compatibility
  logout: () => Promise<void>;
  register: (email: string, role: "customer" | "seller") => void; // Unused in real flow
  addProduct: (product: Omit<Product, "id" | "sellerId" | "createdAt">) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  updateCartQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  placeOrder: (deliveryLocation: string) => Promise<{ success: boolean; error?: string }>;
  cancelOrder: (orderId: string) => Promise<void>;
  sellerShipOrder: (orderId: string) => Promise<void>;
  sellerDeliverOrder: (orderId: string) => Promise<void>;
  refreshAllData: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [mockRole, setMockRoleState] = useState<"guest" | "customer" | "seller">("guest");
  
  // Real-time Database arrays
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // 1. Fetch products (available to everyone)
  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        const mapped: Product[] = data.map((p: any) => ({
          id: p.id,
          sellerId: p.seller_id,
          title: p.title,
          description: p.description,
          price: Number(p.price),
          stock: p.stock,
          imageUrl: p.image_url,
          createdAt: p.created_at,
        }));
        setProducts(mapped);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  // 2. Fetch customer cart (no local storage!)
  const fetchCart = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("cart_items")
        .select(`
          id,
          quantity,
          product_id,
          products:product_id (
            id,
            seller_id,
            title,
            description,
            price,
            stock,
            image_url,
            created_at
          )
        `)
        .eq("user_id", userId);

      if (error) throw error;

      if (data) {
        const mapped: CartItem[] = data
          .filter((item: any) => item.products !== null)
          .map((item: any) => {
            const p = item.products;
            return {
              product: {
                id: p.id,
                sellerId: p.seller_id,
                title: p.title,
                description: p.description,
                price: Number(p.price),
                stock: p.stock,
                imageUrl: p.image_url,
                createdAt: p.created_at,
              },
              quantity: item.quantity,
            };
          });
        setCart(mapped);
      }
    } catch (err) {
      console.error("Error fetching cart items:", err);
    }
  };

  // 3. Fetch customer or seller orders
  const fetchOrders = async (activeUser: User) => {
    try {
      let query = supabase.from("orders").select(`
        id,
        customer_id,
        delivery_location,
        payment_method,
        status,
        total_price,
        created_at,
        order_items (
          id,
          product_id,
          title,
          price,
          quantity
        )
      `);

      // RLS naturally filters for sellers, but for safety and clear scoping:
      if (activeUser.role === "customer") {
        query = query.eq("customer_id", activeUser.id);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        const mapped: Order[] = data.map((o: any) => ({
          id: o.id,
          date: new Date(o.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          deliveryLocation: o.delivery_location,
          paymentMethod: o.payment_method,
          status: o.status,
          totalPrice: Number(o.total_price),
          items: o.order_items.map((item: any) => ({
            productId: item.product_id || "",
            title: item.title,
            price: Number(item.price),
            quantity: item.quantity,
          })),
        }));
        setOrders(mapped);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  // Refresh helper
  const refreshAllData = () => {
    fetchProducts();
    if (user) {
      if (user.role === "customer") {
        fetchCart(user.id);
        fetchOrders(user);
      } else if (user.role === "seller") {
        fetchOrders(user);
      }
    }
  };

  // Mount listeners: Auth state change
  useEffect(() => {
    // Initial fetch of products
    fetchProducts();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        try {
          // Query the user's role from public.profiles
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();

          const role = profile?.role || "customer";
          const activeUser: User = {
            id: session.user.id,
            email: session.user.email || "",
            role: role,
          };

          setUser(activeUser);
          setMockRoleState(role);

          // Fetch user specific data
          if (role === "customer") {
            fetchCart(session.user.id);
            fetchOrders(activeUser);
          } else if (role === "seller") {
            fetchOrders(activeUser);
          }
        } catch (err) {
          console.error("Error synchronizing profile session:", err);
        }
      } else {
        setUser(null);
        setMockRoleState("guest");
        setCart([]);
        setOrders([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sync user changes (fetching relevant lists)
  useEffect(() => {
    if (user) {
      if (user.role === "customer") {
        fetchCart(user.id);
        fetchOrders(user);
      } else if (user.role === "seller") {
        setCart([]);
        fetchOrders(user);
      }
    } else {
      setCart([]);
      setOrders([]);
    }
  }, [user]);

  // Auth Functions
  const login = () => {}; // Replaced by login/page.tsx
  const register = () => {}; // Replaced by register/page.tsx

  const logout = async () => {
    await supabase.auth.signOut();
  };

  // Seller Listings Management (CRUD)
  const addProduct = async (p: Omit<Product, "id" | "sellerId" | "createdAt">) => {
    if (!user || user.role !== "seller") return;
    try {
      const { error } = await supabase.from("products").insert({
        seller_id: user.id,
        title: p.title,
        description: p.description,
        price: p.price,
        stock: p.stock,
        image_url: p.imageUrl,
      });

      if (error) throw error;
      await fetchProducts();
    } catch (err) {
      console.error("Error adding product:", err);
    }
  };

  const updateProduct = async (id: string, updatedFields: Partial<Product>) => {
    if (!user || user.role !== "seller") return;
    try {
      const { error } = await supabase
        .from("products")
        .update({
          title: updatedFields.title,
          description: updatedFields.description,
          price: updatedFields.price,
          stock: updatedFields.stock,
          image_url: updatedFields.imageUrl,
        })
        .eq("id", id)
        .eq("seller_id", user.id);

      if (error) throw error;
      await fetchProducts();
    } catch (err) {
      console.error("Error updating product:", err);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!user || user.role !== "seller") return;
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id)
        .eq("seller_id", user.id);

      if (error) throw error;
      await fetchProducts();
    } catch (err) {
      console.error("Error deleting product:", err);
    }
  };

  // Customer Cart management (Supabase cart_items table)
  const addToCart = async (product: Product, quantity: number = 1) => {
    if (!user || user.role !== "customer") return;

    try {
      // Check if product is already in database cart
      const { data: existing } = await supabase
        .from("cart_items")
        .select("quantity")
        .eq("user_id", user.id)
        .eq("product_id", product.id);

      if (existing && existing.length > 0) {
        const currentQty = existing[0].quantity;
        const newQty = Math.min(product.stock, currentQty + quantity);
        await supabase
          .from("cart_items")
          .update({ quantity: newQty })
          .eq("user_id", user.id)
          .eq("product_id", product.id);
      } else {
        const finalQty = Math.min(product.stock, quantity);
        if (finalQty > 0) {
          await supabase.from("cart_items").insert({
            user_id: user.id,
            product_id: product.id,
            quantity: finalQty,
          });
        }
      }
      await fetchCart(user.id);
    } catch (err) {
      console.error("Error adding to database cart:", err);
    }
  };

  const updateCartQuantity = async (productId: string, quantity: number) => {
    if (!user || user.role !== "customer") return;

    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct) return;

    try {
      const finalQty = Math.min(targetProduct.stock, quantity);
      await supabase
        .from("cart_items")
        .update({ quantity: finalQty })
        .eq("user_id", user.id)
        .eq("product_id", productId);

      await fetchCart(user.id);
    } catch (err) {
      console.error("Error updating cart quantity:", err);
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!user || user.role !== "customer") return;

    try {
      await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId);

      await fetchCart(user.id);
    } catch (err) {
      console.error("Error removing from cart:", err);
    }
  };

  // Transaction Checkout (COD)
  const placeOrder = async (deliveryLocation: string) => {
    if (!user || user.role !== "customer" || cart.length === 0) {
      return { success: false, error: "Cart is empty." };
    }

    try {
      // 1. Verify stocks are still sufficient in Postgres
      for (const item of cart) {
        const { data: dbProd, error: fetchErr } = await supabase
          .from("products")
          .select("stock")
          .eq("id", item.product.id)
          .single();

        if (fetchErr || !dbProd) {
          return { success: false, error: `Product "${item.product.title}" no longer exists.` };
        }

        if (dbProd.stock < item.quantity) {
          return {
            success: false,
            error: `Insufficient stock for "${item.product.title}". Only ${dbProd.stock} available.`,
          };
        }
      }

      // Calculate totals
      const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      const tax = subtotal * 0.05;
      const finalTotal = Number((subtotal + tax).toFixed(2));

      // 2. Insert into orders table
      const { data: orderData, error: orderErr } = await supabase
        .from("orders")
        .insert({
          customer_id: user.id,
          delivery_location: deliveryLocation,
          payment_method: "Cash on Delivery (COD)",
          status: "Pending",
          total_price: finalTotal,
        })
        .select()
        .single();

      if (orderErr || !orderData) {
        throw new Error(orderErr?.message || "Failed to create order record.");
      }

      const orderId = orderData.id;

      // 3. Insert items and deduct stock sequentially
      for (const item of cart) {
        // Insert item
        const { error: itemErr } = await supabase.from("order_items").insert({
          order_id: orderId,
          product_id: item.product.id,
          title: item.product.title,
          price: item.product.price,
          quantity: item.quantity,
        });

        if (itemErr) throw itemErr;

        // Deduct stock in DB
        const currentProd = products.find((p) => p.id === item.product.id);
        if (currentProd) {
          await supabase
            .from("products")
            .update({ stock: currentProd.stock - item.quantity })
            .eq("id", item.product.id);
        }
      }

      // 4. Clear database cart items
      await supabase.from("cart_items").delete().eq("user_id", user.id);

      // Refresh states
      await fetchProducts();
      await fetchCart(user.id);
      await fetchOrders(user);

      return { success: true };
    } catch (err: any) {
      console.error("Checkout failure:", err);
      return { success: false, error: err.message || "Checkout failed. Please try again." };
    }
  };

  // Order Cancelation (customer)
  const cancelOrder = async (orderId: string) => {
    if (!user || user.role !== "customer") return;

    try {
      // 1. Fetch order items to restock
      const { data: orderItems, error: itemsErr } = await supabase
        .from("order_items")
        .select("product_id, quantity")
        .eq("order_id", orderId);

      if (itemsErr) throw itemsErr;

      if (orderItems) {
        for (const item of orderItems) {
          if (item.product_id) {
            // Get current stock
            const { data: prod } = await supabase
              .from("products")
              .select("stock")
              .eq("id", item.product_id)
              .single();

            if (prod) {
              await supabase
                .from("products")
                .update({ stock: prod.stock + item.quantity })
                .eq("id", item.product_id);
            }
          }
        }
      }

      // 2. Set order status to Cancelled
      const { error: updateErr } = await supabase
        .from("orders")
        .update({ status: "Cancelled" })
        .eq("id", orderId)
        .eq("customer_id", user.id);

      if (updateErr) throw updateErr;

      await fetchProducts();
      await fetchOrders(user);
    } catch (err) {
      console.error("Cancellation error:", err);
    }
  };

  // Seller Order Fulfillment Status Toggles
  const sellerShipOrder = async (orderId: string) => {
    if (!user || user.role !== "seller") return;
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: "Shipped" })
        .eq("id", orderId);

      if (error) throw error;
      await fetchOrders(user);
    } catch (err) {
      console.error("Fulfillment error (Ship):", err);
    }
  };

  const sellerDeliverOrder = async (orderId: string) => {
    if (!user || user.role !== "seller") return;
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: "Delivered" })
        .eq("id", orderId);

      if (error) throw error;
      await fetchOrders(user);
    } catch (err) {
      console.error("Fulfillment error (Deliver):", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        mockRole,
        products,
        cart,
        orders,
        login,
        logout,
        register,
        addProduct,
        updateProduct,
        deleteProduct,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        placeOrder,
        cancelOrder,
        sellerShipOrder,
        sellerDeliverOrder,
        refreshAllData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export default AuthProvider;
