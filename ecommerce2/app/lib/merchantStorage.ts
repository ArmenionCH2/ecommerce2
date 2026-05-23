/**
 * @deprecated Replaced by Supabase Auth + public.products table.
 * Kept only for reference. Do not use in new code.
 */
export type MerchantAccount = {
  email: string;
  password: string;
  storeName: string;
};

export type MerchantProduct = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  photo: string;
  description: string;
  createdAt: string;
};
