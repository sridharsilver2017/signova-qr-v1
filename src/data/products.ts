import { Atom, Shield, Sparkles, Droplets, Leaf, FlaskConical } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Product = {
  id: string;
  slug: string;
  name: string;
  category_slug: string;
  description: string;
  tag?: string;
  image_url?: string;
  uses?: string;
  dosage?: string;
  sizes?: string[];
  tech_title?: string;
  tech_composition?: string;
  tech_crops?: string;
  tech_dose?: string;
  qr_data?: string;
  is_active?: boolean;
  sku?: string;
};

export type ProductCategory = {
  id: string;
  slug: string;
  name: string;
  icon: string;
  description?: string;
};

const iconMap: Record<string, LucideIcon> = {
  Sparkles,
  Atom,
  Droplets,
  Shield,
  Leaf,
  FlaskConical,
};

export const getIcon = (iconName: string): LucideIcon => {
  return iconMap[iconName] || Sparkles;
};

const isNative = typeof window !== "undefined" && !!(window as any)?.Capacitor;
const API_BASE = isNative ? "https://signova-qr.pages.dev" : "";

export const fetchProducts = async (): Promise<Product[]> => {
  try {
    const res = await fetch(`${API_BASE}/api/products`);
    if (!res.ok) throw new Error("Failed to fetch products");
    return await res.json();
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

export const fetchProductCategories = async (): Promise<ProductCategory[]> => {
  try {
    const res = await fetch(`${API_BASE}/api/categories`);
    if (!res.ok) throw new Error("Failed to fetch categories");
    return await res.json();
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};

export const getProductImageUrl = (filename?: string) => {
  if (!filename) return undefined;
  if (filename.startsWith("http") || filename.startsWith("data:")) return filename;
  return `${API_BASE}/api/images/${filename}`;
};
