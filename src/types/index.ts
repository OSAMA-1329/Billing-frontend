export type Role = 'ADMIN' | 'MANAGER' | 'STAFF';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Product {
  _id: string;
  itemCode: string;
  barcode?: string;
  productName: string;
  tamilProductName?: string;
  unit: 'Kg' | 'g' | 'L' | 'ml' | 'Pcs' | 'Pkt';
  hsnCode?: string;
  manufacturer?: string;
  mrp: number;
  purchaseCost: number;
  marginPercent: number;
  gstPercent: number;
  retailPrice: number;
  wholesalePrice: number;
  pointPercent: number;
  availableStock: number;
  stockBaseQuantity?: number;
  godownLocation?: string;
  lowStockThreshold?: number;
}

export interface Supplier {
  _id: string;
  name: string;
  phone?: string;
  address?: string;
  gstNumber?: string;
  email?: string;
  openingBalance?: number;
  currentBalance: number;
  place?: string;
}

export interface Customer {
  _id: string;
  name: string;
  phone?: string;
  address?: string;
  gstNumber?: string;
  currentBalance: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}
