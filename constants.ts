import { TableStatus } from './types.js';
export const APP_NAME = "RestaurantPro Suite";
export const TAX_RATE = 0.08; // 8%
export const INITIAL_CATEGORIES = [
    { id: 'cat1', name: 'Appetizers' },
    { id: 'cat2', name: 'Main Courses' },
    { id: 'cat3', name: 'Desserts' },
    { id: 'cat4', name: 'Beverages' },
];
export const INITIAL_TABLES = [
    { id: 't1', name: 'Table 1', capacity: 4, status: TableStatus.Available },
    { id: 't2', name: 'Table 2', capacity: 2, status: TableStatus.Cleaning },
    { id: 't3', name: 'Table 3', capacity: 6, status: TableStatus.Occupied },
    { id: 't4', name: 'Table 4', capacity: 4, status: TableStatus.Reserved },
    { id: 't5', name: 'VIP Booth', capacity: 8, status: TableStatus.Available },
    { id: 't6', name: 'Bar Seat 1', capacity: 1, status: TableStatus.Available },
    { id: 't7', name: 'Bar Seat 2', capacity: 1, status: TableStatus.Occupied },
    { id: 't8', name: 'Patio 1', capacity: 4, status: TableStatus.Dirty },
];
export const INITIAL_MENU_ITEMS = [
    { id: 'm1', name: 'Spring Rolls', description: 'Crispy vegetable spring rolls.', price: 8.99, category: 'cat1', imageUrl: 'https://picsum.photos/seed/springrolls/300/200', ingredients: ['Wrapper', 'Cabbage', 'Carrot'], inStock: true },
    { id: 'm2', name: 'Grilled Salmon', description: 'Freshly grilled salmon with lemon butter sauce.', price: 22.50, category: 'cat2', imageUrl: 'https://picsum.photos/seed/salmon/300/200', ingredients: ['Salmon Fillet', 'Lemon', 'Butter', 'Herbs'], inStock: true },
    { id: 'm3', name: 'Chocolate Lava Cake', description: 'Warm chocolate cake with a molten center.', price: 10.00, category: 'cat3', imageUrl: 'https://picsum.photos/seed/lavacake/300/200', ingredients: ['Chocolate', 'Flour', 'Sugar', 'Egg'], inStock: false },
    { id: 'm4', name: 'Iced Tea', description: 'Refreshing homemade iced tea.', price: 3.50, category: 'cat4', imageUrl: 'https://picsum.photos/seed/icedtea/300/200', ingredients: ['Tea Leaves', 'Water', 'Sugar', 'Lemon'], inStock: true },
    { id: 'm5', name: 'Caesar Salad', description: 'Classic Caesar salad with romaine lettuce, croutons, and Parmesan cheese.', price: 12.00, category: 'cat1', imageUrl: 'https://picsum.photos/seed/caesarsalad/300/200', ingredients: ['Romaine Lettuce', 'Croutons', 'Parmesan', 'Caesar Dressing'], inStock: true },
    { id: 'm6', name: 'Steak Frites', description: 'Grilled steak served with crispy French fries.', price: 28.00, category: 'cat2', imageUrl: 'https://picsum.photos/seed/steakfrites/300/200', ingredients: ['Steak', 'Potatoes', 'Oil', 'Seasoning'], inStock: true },
];
export const INITIAL_INVENTORY_CATEGORIES = [
    { id: 'invcat1', name: 'Groceries' },
    { id: 'invcat2', name: 'Beverages (Non-Alc)' },
    { id: 'invcat3', name: 'Bar Supplies (Alc)' },
    { id: 'invcat4', name: 'Cleaning Supplies' },
    { id: 'invcat5', name: 'Cigarettes' },
    { id: 'invcat6', name: 'Hookah Flavors' },
    { id: 'invcat7', name: 'Other' },
];
export const INITIAL_INVENTORY = [
    { id: 'inv1', name: 'Salmon Fillet', quantity: 20, unit: 'pcs', lowStockThreshold: 5, supplier: 'Ocean Foods', categoryId: 'invcat1' },
    { id: 'inv2', name: 'Potatoes', quantity: 50, unit: 'kg', lowStockThreshold: 10, supplier: 'Farm Fresh', categoryId: 'invcat1' },
    { id: 'inv3', name: 'Tea Leaves (Bulk)', quantity: 5, unit: 'kg', lowStockThreshold: 1, supplier: 'Global Teas', categoryId: 'invcat2' },
    { id: 'inv4', name: 'Flour', quantity: 15, unit: 'kg', lowStockThreshold: 5, supplier: 'Mill Co.', categoryId: 'invcat1' },
    { id: 'inv5', name: 'Soda Syrup', quantity: 10, unit: 'liter', lowStockThreshold: 2, supplier: 'BevCo', categoryId: 'invcat2' },
    { id: 'inv6', name: 'Shisha Coal', quantity: 100, unit: 'pcs', lowStockThreshold: 20, categoryId: 'invcat6' },
];
export const INITIAL_ORDERS = [
    {
        id: 'o1',
        tableId: 't3',
        items: [
            { menuItemId: 'm1', categoryId: 'cat1', name: 'Spring Rolls', quantity: 1, priceAtOrder: 8.99, status: 'Served' },
            { menuItemId: 'm2', categoryId: 'cat2', name: 'Grilled Salmon', quantity: 1, priceAtOrder: 22.50, status: 'Preparing' }
        ],
        totalAmount: 31.49,
        taxAmount: 31.49 * TAX_RATE,
        grandTotal: 31.49 * (1 + TAX_RATE),
        status: 'Open',
        createdAt: Date.now() - 3600000 // 1 hour ago
    },
    {
        id: 'o2',
        tableId: 't7',
        items: [
            { menuItemId: 'm4', categoryId: 'cat4', name: 'Iced Tea', quantity: 2, priceAtOrder: 3.50, status: 'Pending' }
        ],
        totalAmount: 7.00,
        taxAmount: 7.00 * TAX_RATE,
        grandTotal: 7.00 * (1 + TAX_RATE),
        status: 'Open',
        createdAt: Date.now() - 600000 // 10 minutes ago
    }
];
// Helper to generate unique IDs
export const generateId = () => Math.random().toString(36).substr(2, 9);
// Gemini Model Names
export const GEMINI_TEXT_MODEL = 'gemini-2.5-flash-preview-04-17';
export const POS_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="hero-icon"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" /></svg>`;
export const KDS_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="hero-icon"><path stroke-linecap="round" stroke-linejoin="round" d="M11.35 3.836c-.065.227-.1.468-.1.714v16.886c0 .414.07.814.202 1.182A2.004 2.004 0 0 0 13.25 24h1.5c.346 0 .68-.055.99-.161.217-.074.43-.162.636-.262a2.008 2.008 0 0 0 .914-.882c.065-.132.118-.27.158-.412a15.93 15.93 0 0 0 .288-1.07Co19 12.057 19 8.01 19 5.378c0-.414-.07-.814-.202-1.182A2.004 2.004 0 0 0 17.002 2.5h-1.5c-.346 0-.68.055-.99.161-.217-.074-.43.162-.636-.262a2.008 2.008 0 0 0-.914.882c-.065.132-.118.27-.158.412a16.04 16.04 0 0 0-.288 1.07C11.5 5.94 11.5 8.01 11.5 10.622c0 .246-.035.49-.1.714ZM6.5 3.836C6.435 4.064 6.4 4.305 6.4 4.55v16.886c0 .414.07.814.202 1.182A2.004 2.004 0 0 0 8.502 24h1.5c.346 0 .68-.055.99-.161.217-.074.43-.162.636-.262a2.008 2.008 0 0 0 .914-.882c.065-.132.118-.27.158-.412a15.93 15.93 0 0 0 .288-1.07C13.25 12.057 13.25 8.01 13.25 5.378c0-.414-.07-.814-.202-1.182A2.004 2.004 0 0 0 11.252 2.5h-1.5c-.346 0-.68.055-.99.161-.217-.074-.43.162-.636-.262a2.008 2.008 0 0 0-.914.882c-.065.132-.118.27-.158.412a16.04 16.04 0 0 0-.288 1.07C6.75 5.94 6.75 8.01 6.75 10.622c0 .246-.035.49-.1.714Z" /></svg>`;
export const MANAGEMENT_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="hero-icon"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" /></svg>`;
export const TABLE_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="hero-icon"><path stroke-linecap="round" stroke-linejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" /></svg>`;
export const MENU_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="hero-icon"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>`;
export const INVENTORY_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="hero-icon"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125V6.375c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v.001c0 .621.504 1.125 1.125 1.125Z" /></svg>`;
export const REPORTS_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="hero-icon"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75c0 .621-.504 1.125-1.125 1.125h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>`;
export const LOGIN_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="hero-icon"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>`;
export const LOGOUT_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="hero-icon"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>`;
export const CLEANING_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="hero-icon"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>`;
export const TABLE_SETTINGS_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="hero-icon"><path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-1.007 1.11-.952l2.648.162c.54.032.992.482 1.026 1.022l.187 2.246a11.953 11.953 0 01-1.07 1.07l-1.876.786a11.953 11.953 0 01-1.07-1.07l.187-2.246zM12.75 15.66l-2.058-.295a11.976 11.976 0 01-1.76 1.564l.295 2.058A2.25 2.25 0 0010.5 21h3a2.25 2.25 0 002.205-1.972l.295-2.058a11.976 11.976 0 01-1.76-1.564l-2.058.295zM12.75 9a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" /></svg>`;
export const KITCHEN_LOGIN_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="hero-icon"><path stroke-linecap="round" stroke-linejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.056 3 12s4.03 8.25 9 8.25z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 12H12m0 0H8.25m3.75 0V9.75M12 12v2.25" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" /></svg>`;
export const KITCHEN_DASHBOARD_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="hero-icon"><path stroke-linecap="round" stroke-linejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V9.75a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 9.75v8.25A2.25 2.25 0 006 20.25zm0 0H6" /></svg>`;
export const ACTIVITY_LOG_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="hero-icon"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>`;
export const SEATING_CONFIG_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="hero-icon"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6A2.25 2.25 0 0112.75 3.75h.5a2.25 2.25 0 012.25 2.25v.5a2.25 2.25 0 01-2.25 2.25h-.5A2.25 2.25 0 0110.5 6v0zM10.5 18A2.25 2.25 0 0112.75 15.75h.5a2.25 2.25 0 012.25 2.25v.5A2.25 2.25 0 0113.25 21h-.5A2.25 2.25 0 0110.5 18v0zM6 10.5A2.25 2.25 0 013.75 12.75v.5A2.25 2.25 0 016 15.5h.5A2.25 2.25 0 018.75 13.25v-.5A2.25 2.25 0 016.5 10.5h-.5A2.25 2.25 0 016 10.5v0zM18 10.5A2.25 2.25 0 0115.75 12.75v.5A2.25 2.25 0 0118 15.5h.5A2.25 2.25 0 0120.75 13.25v-.5A2.25 2.25 0 0118.5 10.5h-.5A2.25 2.25 0 0118 10.5v0z" /></svg>`;
export const THEME_SETTINGS_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="hero-icon"><path stroke-linecap="round" stroke-linejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" /></svg>`;
export const INITIAL_THEME_SETTINGS = {
    primaryColor: '#3B82F6', // Tailwind blue-500
    secondaryColor: '#10B981', // Tailwind green-500 (for KDS highlights or accents)
    backgroundColor: '#F3F4F6', // Tailwind gray-100 (main app background)
    textColor: '#1F2937', // Tailwind gray-800 (general text)
    headerBackgroundColor: '#1F2937', // Tailwind slate-800
    headerTextColor: '#FFFFFF',
    buttonTextColor: '#FFFFFF',
    cardBackgroundColor: '#FFFFFF', // For modals, cards
    cardTextColor: '#1F2937',
    borderColor: '#E5E7EB', // Tailwind gray-200
    fontSizeBase: 'text-base',
    fontFamily: 'sans-serif',
    iconSize: 'icon-md',
    kitchenDisplayScale: 'scale-100',
    uiDensity: 'normal',
    contentScale: 'scale-100',
    globalPageScale: 'scale-100',
};
