
export enum TableStatus {
  Available = 'Available',
  Occupied = 'Occupied',
  Reserved = 'Reserved',
  Dirty = 'Dirty',
  Cleaning = 'Cleaning', // Added
}

export interface Table {
  id: string;
  name: string;
  capacity: number;
  status: TableStatus;
}

export interface MenuCategory {
  id: string;
  name: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string; 
  imageUrl?: string;
  ingredients: string[]; 
  inStock: boolean;
}

export type OrderItemStatus = 'Pending' | 'Preparing' | 'Ready' | 'Served' | 'CancelledItem' | 'Modified' | 'AcknowledgedModification';

export interface OrderItem {
  menuItemId: string;
  categoryId: string; 
  quantity: number;
  priceAtOrder: number; 
  name: string; 
  status: OrderItemStatus;
  originalQuantity?: number; 
}

export interface Order {
  id: string;
  tableId: string;
  items: OrderItem[];
  totalAmount: number;
  taxAmount: number;
  grandTotal: number;
  status: 'Open' | 'Paid' | 'Cancelled' | 'Modified'; 
  createdAt: number; 
  notes?: string;
  cancelledReason?: string; 
  modifiedAt?: number; 
}

export interface InventoryCategory { 
  id: string;
  name: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  lowStockThreshold: number;
  supplier?: string;
  categoryId: string; 
}

export interface Bill {
  id: string;
  orderId: string;
  tableId: string;
  items: OrderItem[];
  subtotal: number;
  taxRate: number; 
  taxAmount: number;
  discounts: { description: string; amount: number }[];
  totalAmount: number;
  paymentMethod?: string;
  paidAt?: number; 
}

export type AppView = 'Login' | 'POS' | 'KDS' | 'Management' | 'KitchenDashboard'; 

export type UserRole = 'staff' | 'owner' | 'kitchen' | null; 

// For Gemini Service
export interface AISuggestion {
  title: string;
  suggestion: string;
}

export interface GroundingChunkWeb {
  uri?: string; 
  title?: string;
}

export interface GroundingChunkRetrievedContext {
  uri?: string;
  title?: string;
}

export interface GroundingChunk {
  web?: GroundingChunkWeb;
  retrievedContext?: GroundingChunkRetrievedContext;
}

export interface GroundingMetadata {
  searchQuery?: string;
  groundingChunks?: GroundingChunk[];
}

// For reports
export type ReportPeriod = 'daily' | 'monthly' | 'yearly';

export interface DetailedSoldItem {
    orderId: string;
    orderCreatedAt: number;
    menuItemId: string;
    name: string;
    quantity: number;
    priceAtOrder: number;
    lineTotal: number;
    categoryId: string;
}

export interface CategorySalesReport {
    categoryId: string;
    categoryName: string;
    totalItemsSold: number;
    totalRevenue: number;
}
export interface SalesReportData {
    period: ReportPeriod;
    totalOrders: number;
    totalRevenue: number;
    topSellingItems: { name: string; quantity: number }[];
    detailedSoldItems: DetailedSoldItem[]; 
    categorySales: CategorySalesReport[]; 
    orders: Order[]; 
}

// For Activity Log
export type ActivityType = 
  | 'USER_LOGIN' | 'USER_LOGOUT'
  | 'ORDER_CREATED' | 'ORDER_MODIFIED' | 'ORDER_CANCELLED' | 'ORDER_PAID'
  | 'ITEM_STATUS_CHANGED' | 'OWNER_ITEM_SERVED'
  | 'TABLE_STATUS_CHANGED'
  | 'MENU_ITEM_ADDED' | 'MENU_ITEM_UPDATED' | 'MENU_ITEM_DELETED' 
  | 'MENU_CATEGORY_ADDED'
  | 'INVENTORY_ITEM_ADDED' | 'INVENTORY_ITEM_UPDATED' | 'INVENTORY_ITEM_DELETED'
  | 'INVENTORY_CATEGORY_ADDED'
  | 'REPORT_GENERATED' | 'AI_QUERY'
  | 'TABLE_CONFIG_ADDED' | 'TABLE_CONFIG_UPDATED' | 'TABLE_CONFIG_DELETED'
  | 'THEME_UPDATED' | 'ICON_SIZE_UPDATED' | 'KITCHEN_SCALE_UPDATED' | 'UI_DENSITY_UPDATED' | 'CONTENT_SCALE_UPDATED' | 'GLOBAL_PAGE_SCALE_UPDATED';

export interface ActivityLogEntry {
  id: string;
  timestamp: number;
  user: { role: UserRole; name: string } | null;
  actionType: ActivityType;
  description: string; 
  details?: any; 
}

// For Theme Settings
export interface ThemeSettings {
  primaryColor: string;
  secondaryColor: string; 
  backgroundColor: string;
  textColor: string;
  headerBackgroundColor: string;
  headerTextColor: string;
  buttonTextColor: string;
  cardBackgroundColor: string;
  cardTextColor: string;
  borderColor: string;
  fontSizeBase: 'text-xs' | 'text-sm' | 'text-base' | 'text-lg'; 
  fontFamily: string; 
  iconSize: 'icon-sm' | 'icon-md' | 'icon-lg'; 
  kitchenDisplayScale: 'scale-75' | 'scale-90' | 'scale-100' | 'scale-110' | 'scale-125';
  uiDensity: 'compact' | 'normal' | 'spacious'; 
  contentScale: 'scale-75' | 'scale-90' | 'scale-100' | 'scale-110' | 'scale-125'; 
  globalPageScale: 'scale-75' | 'scale-90' | 'scale-100' | 'scale-110' | 'scale-125';
}
