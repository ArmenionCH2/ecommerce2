export type UserRole = "buyer" | "merchant";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  created_at: string;
};

export type Product = {
  id: string;
  merchant_id: string;
  title: string;
  description: string;
  price: number;
  image_url: string | null;
  published: boolean;
  created_at: string;
  profiles?: Pick<Profile, "full_name" | "email"> | null;
};

export type CartItem = {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  products: Product | null;
};
