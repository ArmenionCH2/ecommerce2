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

const ACCOUNT_KEY = "merchant_accounts";

function safeParse<T>(value: string | null, fallback: T): T {
  try {
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function getMerchantAccounts(): MerchantAccount[] {
  if (typeof window === "undefined") return [];
  return safeParse<MerchantAccount[]>(localStorage.getItem(ACCOUNT_KEY), []);
}

export function saveMerchantAccounts(accounts: MerchantAccount[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(accounts));
}

export function findMerchant(email: string) {
  return getMerchantAccounts().find((account) => account.email === email.toLowerCase());
}

export function registerMerchant(account: MerchantAccount) {
  const normalized = { ...account, email: account.email.toLowerCase() };
  const existing = findMerchant(normalized.email);
  if (existing) return false;
  const accounts = getMerchantAccounts();
  accounts.push(normalized);
  saveMerchantAccounts(accounts);
  return true;
}

export function verifyMerchant(email: string, password: string) {
  const account = findMerchant(email.toLowerCase());
  return account && account.password === password ? account : null;
}

const PRODUCTS_KEY_PREFIX = "merchant_products_";

export function getMerchantProducts(email: string): MerchantProduct[] {
  if (typeof window === "undefined") return [];
  const key = PRODUCTS_KEY_PREFIX + email.toLowerCase();
  return safeParse<MerchantProduct[]>(localStorage.getItem(key), []);
}

export function addMerchantProduct(email: string, product: Omit<MerchantProduct, "id" | "createdAt">) {
  const current = getMerchantProducts(email);
  const nextProduct: MerchantProduct = {
    ...product,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const key = PRODUCTS_KEY_PREFIX + email.toLowerCase();
  const updated = [...current, nextProduct];
  localStorage.setItem(key, JSON.stringify(updated));
  return updated;
}
