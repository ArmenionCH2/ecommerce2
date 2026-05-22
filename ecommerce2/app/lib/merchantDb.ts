import getSupabaseClient from "./supabaseClient";

export type DbMerchant = {
  id: string;
  authUserId: string;
  email: string;
  storeName: string;
  createdAt: string;
};

export type DbMerchantInsert = Omit<DbMerchant, "id" | "createdAt">;

export type DbProduct = {
  id: string;
  merchantId: string;
  name: string;
  quantity: number;
  price: number;
  photo: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  merchantStoreName?: string | null;
};

export type DbProductInsert = Omit<DbProduct, "id" | "merchantId" | "createdAt" | "updatedAt">;

function mapMerchantRow(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    authUserId: row.auth_user_id ?? row.authUserId,
    email: row.email,
    storeName: row.store_name ?? row.storeName,
    createdAt: row.created_at ?? row.createdAt,
  } as DbMerchant;
}

function mapProductRow(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    merchantId: row.merchant_id ?? row.merchantId,
    name: row.name,
    quantity: row.quantity,
    price: Number(row.price),
    photo: row.photo ?? null,
    description: row.description ?? null,
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,
    merchantStoreName: row.merchants?.store_name ?? row.merchant_store_name ?? null,
  } as DbProduct;
}

export async function createMerchant(authUserId: string, email: string, storeName: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("merchants").insert({
    auth_user_id: authUserId,
    email,
    store_name: storeName,
  }).select().single();
  if (error) throw error;
  return mapMerchantRow(data);
}

export async function getMerchantByAuthUserId(authUserId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("merchants").select("id,store_name,email,auth_user_id,created_at").eq("auth_user_id", authUserId).single();
  if (error) return null;
  return mapMerchantRow(data);
}

export async function getMerchantByEmail(email: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("merchants").select("id,store_name,email,auth_user_id,created_at").eq("email", email).single();
  if (error) return null;
  return mapMerchantRow(data);
}

export async function getProductsForMerchant(merchantId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("products").select("*, merchants(store_name)").eq("merchant_id", merchantId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapProductRow);
}

export async function getAllProducts() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("products").select("*, merchants(store_name)").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapProductRow);
}

export async function addProductForMerchant(merchantId: string, product: Omit<DbProduct, "id" | "merchantId" | "createdAt" | "updatedAt">) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("products").insert({
    merchant_id: merchantId,
    name: product.name,
    quantity: product.quantity,
    price: product.price,
    photo: product.photo,
    description: product.description,
  }).select("*, merchants(store_name)").single();
  if (error) throw error;
  return mapProductRow(data);
}
