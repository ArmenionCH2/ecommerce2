export type UserRole = "customer" | "merchant";

export type Profile = {
  id: string;
  email: string | null;
  store_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  merchant_id: string;
  name: string;
  description: string;
  quantity: number;
  price: number;
  image_url: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
  merchant?: Pick<Profile, "store_name" | "email"> | null;
};

export type CartItem = {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  products: Product | null;
};
