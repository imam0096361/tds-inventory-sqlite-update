export type Page = 'Dashboard' | 'PC Info' | 'Laptop Info' | 'Server Info' | 'Mouse Log' | 'Keyboard Log' | 'SSD Log' | 'Headphone Log' | 'Portable HDD Log' | 'Department Summary' | 'Product Inventory' | 'Settings' | 'User Management' | 'AI Assistant' | 'Cost Management';

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
  conversationId?: string;
  previousMessages?: AIMessage[];
  context?: Record<string, any>;
}

export interface AIQueryResponse {
  success: boolean;
  data?: any[] | Record<string, any[]>; // Single module (array) or multi-module (object)
  module?: string;
  filters?: Record<string, any>;
  error?: string;
  interpretation?: string;
  resultCount?: number;
  moduleBreakdown?: Record<string, number>; // For multi-module queries
  insights?: AIInsight[]; // AI-generated insights
  recommendations?: AIRecommendation[]; // Context-aware next actions
  fuzzyCorrections?: FuzzyCorrection[]; // Typo corrections applied
  operation?: 'query' | 'update' | 'delete' | 'create'; // Operation type for batch operations
  affected?: number; // Number of items affected (for batch operations)
}

export interface AIQueryHistory {
  id: string;
  query: string;
  timestamp: string;
  resultCount: number;
  module?: string;
}

// Conversational AI
export interface AIConversation {
  id: string;
  messages: AIMessage[];
  context: Record<string, any>;
  startedAt: string;
  lastUpdated?: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  data?: any;
  insights?: AIInsight[];
  recommendations?: AIRecommendation[];
}

// AI Insights
export interface AIInsight {
  type: 'info' | 'warning' | 'alert' | 'success' | 'summary';
  icon: string;
  text: string;
  action?: string;
  details?: string;
  recommendation?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

// Context-Aware Recommendations
export interface AIRecommendation {
  id: string;
  icon: string;
  text: string;
  action?: 'export_pdf' | 'export_csv' | 'run_query' | 'email_report' | 'create_ticket';
  query?: string; // For run_query action
  data?: any;
  priority?: number;
}

// Fuzzy Search
export interface FuzzyCorrection {
  field: string;
  original: string;
  corrected: string;
  confidence: number;
}

// Autocomplete Suggestions
export interface AutocompleteSuggestion {
  id: string;
  text: string;
  type: 'user' | 'department' | 'hardware' | 'status' | 'query';
  icon?: string;
  priority?: number;
  metadata?: Record<string, any>;
}

// ==================== COST MANAGEMENT TYPES ====================

// Maintenance Cost
export interface MaintenanceCost {
  id: string;
  asset_type: string;
  asset_id: string;
  asset_name?: string;
  cost: number;
  date: string;
  description?: string;
  service_provider?: string;
  category?: string;
  department?: string;
  created_by?: string;
  created_at?: string;
}

// Budget
export interface Budget {
  id: string;
  department: string;
  year: number;
  quarter?: number;
  category: string;
  allocated_amount: number;
  spent_amount: number;
  notes?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

// Cost Center
export interface CostCenter {
  id: string;
  department: string;
  cost_center_code: string;
  manager_name?: string;
  annual_budget?: number;
  notes?: string;
  created_at?: string;
}

// Financial Summary
export interface FinancialSummary {
  totalAssetValue: number;
  totalMaintenanceCosts: number;
  thisMonthSpending: number;
  annualBudget: number;
  annualSpent: number;
}

// Cost by Department
export interface DepartmentCost {
  department: string;
  asset_count: number;
  total_cost: number;
}

// Depreciation Data
export interface DepreciationData {
  id: string;
  name: string;
  type: string;
  department?: string;
  purchaseCost: number;
  annualDepreciation: number;
  totalDepreciation: number;
  currentValue: number;
  ageInYears: string;
}

// TCO Data
export interface TCOData {
  asset: {
    id: string;
    name: string;
    type: string;
  };
  costs: {
    purchase: number;
    maintenance: number;
    operating: number;
    salvage: number;
    total: number;
    annualTCO: number;
  };
  ageInYears: string;
}

// Monthly Trend
export interface MonthlyTrend {
  month: string;
  total_cost: number;
  transaction_count: number;
}