export type Page = 'Dashboard' | 'PC Info' | 'Laptop Info' | 'Server Info' | 'Mouse Log' | 'Keyboard Log' | 'SSD Log' | 'Headphone Log' | 'Portable HDD Log' | 'Department Summary' | 'Product Inventory' | 'Settings' | 'User Management' | 'AI Assistant';

export interface PeripheralLogEntry {
  id: string;
  productName: string;
  serialNumber: string;
  pcName: string;
  pcUsername:string;
  department: string;
  date: string;
  time: string;
  servicedBy: string;
  comment: string;
}

export interface DepartmentAssetSummary {
  id: string;
  department: string;
  quantity: number;
}

export interface ServerInfoEntry {
  id: string;
  serverID: string;
  brand: string;
  model: string;
  cpu: string;
  totalCores: number;
  ram: string;
  storage: string;
  raid: string;
  status: 'Online' | 'Offline' | 'Maintenance';
  department?: string;
  customFields?: Record<string, string>;
}

export interface LaptopInfoEntry {
  id: string;
  pcName: string;
  username: string;
  brand: string;
  model: string;
  cpu: string;
  serialNumber: string;
  ram: string;
  storage: string;
  userStatus: string;
  department: string;
  date: string;
  hardwareStatus: 'Good' | 'Battery Problem' | 'Platform Problem';
  customFields?: Record<string, string>;
}

export interface PCInfoEntry {
  id: string;
  department: string;
  ip: string;
  pcName: string;
  username: string;
  motherboard: string;
  cpu: string;
  ram: string;
  storage: string;
  monitor: string;
  os: string;
  status: 'OK' | 'NO' | 'Repair';
  floor: 5 | 6 | 7;
  customFields?: Record<string, string>;
}

export interface PieChartData {
  name: string;
  value: number;
  // FIX: Added index signature to satisfy recharts' type requirements for Pie chart data.
  [key: string]: any;
}

export interface BarChartData {
  name: string;
  count: number;
}

export interface CustomFieldDef {
  id: string;
  name: string;
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: 'admin' | 'user';
  department?: string;
  createdAt?: string;
  lastLogin?: string;
}

// AI Assistant Types
export interface AIQueryRequest {
  query: string;
  module?: string;
}

export interface AIQueryResponse {
  success: boolean;
  data?: any[];
  module?: string;
  filters?: Record<string, any>;
  error?: string;
  interpretation?: string;
  resultCount?: number;
}

export interface AIQueryHistory {
  id: string;
  query: string;
  timestamp: string;
  resultCount: number;
  module?: string;
}