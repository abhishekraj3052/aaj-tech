export interface NavItem {
  title: string;
  href: string;
  items?: NavItem[];
}

export interface HeroSlide {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  ctaText: string;
  ctaHref: string;
  backgroundColor?: string;
  isFullImage?: boolean;
}

export interface Category {
  id: string;
  title: string;
  description: string;
  image: string;
  icon: string;
}

export interface Product {
  id: string;
  name: string;
  categoryId?: string;
  category_id?: string;
  sku?: string;
  price?: number;
  description: string;
  image: string;
  stock?: number;
  status?: string;
  features: string[];
  specifications: Record<string, string>;
}

export interface Industry {
  id: string;
  title: string;
  image: string;
  description: string;
}

export interface Counter {
  id: number;
  label: string;
  value: number;
  suffix: string;
}

