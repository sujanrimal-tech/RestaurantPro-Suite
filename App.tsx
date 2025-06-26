
import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import { 
  Table, MenuItem, Order, OrderItem, InventoryItem, TableStatus, AppView, MenuCategory, Bill,
  GroundingMetadata, GroundingChunk, UserRole, InventoryCategory, OrderItemStatus, ReportPeriod, SalesReportData,
  DetailedSoldItem, CategorySalesReport, ActivityLogEntry, ActivityType, ThemeSettings
} from './types';
import { 
  INITIAL_TABLES, INITIAL_MENU_ITEMS, INITIAL_INVENTORY, INITIAL_ORDERS, INITIAL_CATEGORIES,
  INITIAL_INVENTORY_CATEGORIES, INITIAL_THEME_SETTINGS,
  APP_NAME, TAX_RATE, generateId, POS_ICON_SVG, KDS_ICON_SVG, MANAGEMENT_ICON_SVG,
  TABLE_ICON_SVG, MENU_ICON_SVG, INVENTORY_ICON_SVG, REPORTS_ICON_SVG,
  LOGIN_ICON_SVG, LOGOUT_ICON_SVG, CLEANING_ICON_SVG, TABLE_SETTINGS_ICON_SVG, 
  KITCHEN_LOGIN_ICON_SVG, KITCHEN_DASHBOARD_ICON_SVG, ACTIVITY_LOG_ICON_SVG, SEATING_CONFIG_ICON_SVG,
  THEME_SETTINGS_ICON_SVG
} from './constants';
import * as geminiService from './services/geminiService';
import Modal from './components/common/Modal';

// Custom hook for localStorage
const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (caughtErrorInit) {
      console.error(caughtErrorInit);
      return initialValue;
    }
  });

  const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (caughtErrorSetValue) {
      console.error(caughtErrorSetValue);
    }
  };
  return [storedValue, setValue];
};

// Helper function to get Tailwind class for icon size
const getIconSizeClass = (size: ThemeSettings['iconSize']): string => {
  switch (size) {
    case 'icon-sm': return 'text-sm'; // Smaller
    case 'icon-md': return 'text-base'; // Default
    case 'icon-lg': return 'text-xl'; // Larger
    default: return 'text-base';
  }
};

// Helper function to get Tailwind padding classes based on UI density
const getDensityPaddingClasses = (
    density: ThemeSettings['uiDensity'], 
    elementType: 'button' | 'card' | 'modalContent' | 'navButton'
): string => {
    switch (elementType) {
        case 'button':
            if (density === 'compact') return 'px-2 py-1 text-xs';
            if (density === 'spacious') return 'px-6 py-3.5 text-lg'; // Increased py
            return 'px-4 py-2 text-sm'; // normal
        case 'navButton': // For main navigation buttons
            if (density === 'compact') return 'px-3 py-2 text-xs';
            if (density === 'spacious') return 'px-6 py-4 text-base'; // Increased px
            return 'px-4 py-3 text-sm'; // normal
        case 'card':
        case 'modalContent': // Using same logic for card and modal content padding
            if (density === 'compact') return 'p-2';
            if (density === 'spacious') return 'p-6';
            return 'p-4'; // normal
        default:
            return 'p-4'; // fallback
    }
};


// Main App Component
const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useLocalStorage<{ name: string; role: UserRole } | null>('currentUser', null);
  const [currentView, setCurrentView] = useState<AppView>(currentUser ? (currentUser.role === 'kitchen' ? 'KitchenDashboard' : 'POS') : 'Login');
  
  const [tables, setTables] = useLocalStorage<Table[]>('restaurant_tables', INITIAL_TABLES);
  const [menuItems, setMenuItems] = useLocalStorage<MenuItem[]>('restaurant_menuItems', INITIAL_MENU_ITEMS);
  const [menuCategories, setMenuCategories] = useLocalStorage<MenuCategory[]>('restaurant_menuCategories', INITIAL_CATEGORIES);
  const [inventoryCategories, setInventoryCategories] = useLocalStorage<InventoryCategory[]>('restaurant_inventoryCategories', INITIAL_INVENTORY_CATEGORIES);
  const [orders, setOrders] = useLocalStorage<Order[]>('restaurant_orders', INITIAL_ORDERS);
  const [inventory, setInventory] = useLocalStorage<InventoryItem[]>('restaurant_inventory', INITIAL_INVENTORY);
  const [activityLog, setActivityLog] = useLocalStorage<ActivityLogEntry[]>('restaurant_activityLog', []);
  const [themeSettings, setThemeSettings] = useLocalStorage<ThemeSettings>('restaurant_themeSettings', INITIAL_THEME_SETTINGS);
  
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [isTableStatusModalOpen, setIsTableStatusModalOpen] = useState(false); 
  const [editingTableForStatus, setEditingTableForStatus] = useState<Table | null>(null); 
  const [isTableEditModalOpen, setIsTableEditModalOpen] = useState(false);
  const [editingTableConfig, setEditingTableConfig] = useState<Partial<Table> | null>(null);

  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [currentBill, setCurrentBill] = useState<Bill | null>(null);

  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [aiGroundingMetadata, setAiGroundingMetadata] = useState<GroundingMetadata | undefined>(undefined);
  const [currentReport, setCurrentReport] = useState<SalesReportData | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', themeSettings.primaryColor);
    root.style.setProperty('--secondary-color', themeSettings.secondaryColor);
    root.style.setProperty('--background-color', themeSettings.backgroundColor);
    root.style.setProperty('--text-color', themeSettings.textColor);
    root.style.setProperty('--header-background-color', themeSettings.headerBackgroundColor);
    root.style.setProperty('--header-text-color', themeSettings.headerTextColor);
    root.style.setProperty('--button-text-color', themeSettings.buttonTextColor);
    root.style.setProperty('--card-background-color', themeSettings.cardBackgroundColor);
    root.style.setProperty('--card-text-color', themeSettings.cardTextColor);
    root.style.setProperty('--border-color', themeSettings.borderColor);
    
    document.body.style.fontFamily = themeSettings.fontFamily;
    const fontSizeClasses = ['text-xs', 'text-sm', 'text-base', 'text-lg'];
    fontSizeClasses.forEach(cls => document.body.classList.remove(cls));
    document.body.classList.add(themeSettings.fontSizeBase);
    
    document.body.style.backgroundColor = 'var(--background-color)';
    document.body.style.color = 'var(--text-color)';

  }, [themeSettings]);


  const logActivity = (actionType: ActivityType, description: string, details?: any) => {
    const newEntry: ActivityLogEntry = {
      id: generateId(),
      timestamp: Date.now(),
      user: currentUser,
      actionType,
      description,
      details,
    };
    setActivityLog(prevLog => [newEntry, ...prevLog].slice(0, 200)); 
  };

  useEffect(() => { 
    if (!currentUser) {
      setCurrentView('Login');
    } else if (currentView === 'Login') {
      setCurrentView(currentUser.role === 'kitchen' ? 'KitchenDashboard' : 'POS'); 
    }
  }, [currentUser, currentView]);


  const handleLogin = (role: UserRole, username: string = "User") => {
    if (role) {
      const user = { name: username, role };
      setCurrentUser(user);
      logActivity('USER_LOGIN', `${user.name} (${user.role}) logged in.`);
      if (role === 'kitchen') {
        setCurrentView('KitchenDashboard');
      } else {
        setCurrentView('POS');
      }
    }
  };

  const handleLogout = () => {
    if(currentUser) {
      logActivity('USER_LOGOUT', `${currentUser.name} (${currentUser.role}) logged out.`);
    }
    setCurrentUser(null);
    setCurrentView('Login');
  };

  const handleTableSelect = (table: Table) => {
    setSelectedTable(table);
    const existingOrder = orders.find(o => o.tableId === table.id && (o.status === 'Open' || o.status === 'Modified'));
    if (existingOrder) {
      setCurrentOrder({...existingOrder}); 
    } else {
      const newOrder: Order = {
        id: generateId(),
        tableId: table.id,
        items: [],
        totalAmount: 0,
        taxAmount: 0,
        grandTotal: 0,
        status: 'Open',
        createdAt: Date.now(),
      };
      setCurrentOrder(newOrder);
    }
    setIsOrderModalOpen(true);
  };
  
  const updateOrderItemStatus = (
    orderId: string, 
    menuItemId: string, 
    itemOriginalName: string, 
    newStatus: OrderItemStatus, 
    isKitchenAction: boolean = false, 
    isOwnerOverride: boolean = false
  ) => {
    let oldStatus: OrderItemStatus | undefined;
    setOrders(prevOrders => prevOrders.map(order => {
      if (order.id === orderId) {
        if(order.status === 'Paid' && !isOwnerOverride) return order; 

        let needsOrderUpdate = false;
        const updatedItems = order.items.map(item => {
          // Match by name as well, in case menuItemId is duplicated by error / manual entry
          if (item.menuItemId === menuItemId && item.name === itemOriginalName) { 
            oldStatus = item.status;
            // Kitchen cannot change served items unless owner overrides
            if(item.status === 'Served' && isKitchenAction && newStatus !== 'Served' && !isOwnerOverride) return item; 

            if(item.status !== newStatus) needsOrderUpdate = true;
            return {...item, status: newStatus};
          }
          return item;
        });

        if(needsOrderUpdate){
            const newOrderStatus: Order['status'] = (order.status === 'Open' && !isKitchenAction && !isOwnerOverride) ? 'Modified' : order.status;
            logActivity(
                isOwnerOverride ? 'OWNER_ITEM_SERVED' : 'ITEM_STATUS_CHANGED', 
                `Item "${itemOriginalName}" in Order #${order.id.substring(0,5)} status changed from ${oldStatus} to ${newStatus}.`,
                { orderId, menuItemId, itemName: itemOriginalName, oldStatus, newStatus, by: isOwnerOverride ? 'Owner Override' : (isKitchenAction ? 'Kitchen' : 'Staff/System') }
            );
            return { ...order, items: updatedItems, status: newOrderStatus, modifiedAt: Date.now() };
        }
      }
      return order;
    }));
  };

  const calculateOrderTotals = (items: OrderItem[]): Pick<Order, 'totalAmount' | 'taxAmount' | 'grandTotal'> => {
    const totalAmount = items.filter(item => item.status !== 'CancelledItem').reduce((sum, item) => sum + (item.priceAtOrder * item.quantity), 0);
    const taxAmount = totalAmount * TAX_RATE;
    const grandTotal = totalAmount + taxAmount;
    return { totalAmount, taxAmount, grandTotal };
  };

  const handleAddToOrder = (menuItem: MenuItem) => {
    if (!currentOrder || !selectedTable || currentOrder.status === 'Paid') return;

    setCurrentOrder(prevOrder => {
      if (!prevOrder) return null; 
      
      const modifiableExistingItemIndex = prevOrder.items.findIndex(
          item => item.menuItemId === menuItem.id &&
                  item.name === menuItem.name && // Ensure same item if names can vary for same ID
                  item.status !== 'CancelledItem' &&
                  item.status !== 'Served'
      );
      
      let newItems: OrderItem[];
      let itemAddedOrIncremented = false;

      if (modifiableExistingItemIndex > -1) {
        newItems = prevOrder.items.map((item, index) => 
          index === modifiableExistingItemIndex 
            ? { ...item, quantity: item.quantity + 1, status: 'Pending' } // Reset to pending if re-added
            : item
        );
        itemAddedOrIncremented = true;
      } else {
        newItems = [...prevOrder.items, { 
          menuItemId: menuItem.id, 
          categoryId: menuItem.category, 
          name: menuItem.name, 
          quantity: 1, 
          priceAtOrder: menuItem.price,
          status: 'Pending' 
        }];
        itemAddedOrIncremented = true;
      }
      const totals = calculateOrderTotals(newItems);
      // If order was 'Open' and had no items or no previous modification, keep it 'Open' only if new. Otherwise 'Modified'.
      const newOrderStatus: Order['status'] = (prevOrder.status === 'Open' && (prevOrder.items.length > 0 || itemAddedOrIncremented || prevOrder.modifiedAt)) ? 'Modified' : prevOrder.status;

      return { 
        ...prevOrder, 
        items: newItems, 
        ...totals, 
        status: newOrderStatus, 
        modifiedAt: (newOrderStatus === 'Modified' || prevOrder.modifiedAt || itemAddedOrIncremented) ? Date.now() : prevOrder.modifiedAt
      };
    });
  };

  const handleUpdateOrderItemQuantity = (menuItemId: string, itemName: string, newQuantity: number) => {
    if (!currentOrder || currentOrder.status === 'Paid') return;

    setCurrentOrder(prevOrder => {
      if (!prevOrder) return null;
      
      const itemToUpdate = prevOrder.items.find(item => item.menuItemId === menuItemId && item.name === itemName);
      if (itemToUpdate?.status === 'Served') { 
          alert("Cannot change quantity of an item that has already been served.");
          return prevOrder;
      }

      let updatedItems: OrderItem[];
      let action = "";
      if (newQuantity <= 0) { 
        action = "cancelled";
        updatedItems = prevOrder.items.map(item => 
          item.menuItemId === menuItemId && item.name === itemName ? { ...item, quantity: 0, status: 'CancelledItem', originalQuantity: item.quantity } : item
        );
      } else {
        action = "quantity updated";
        updatedItems = prevOrder.items.map(item => 
          item.menuItemId === menuItemId && item.name === itemName ? { ...item, quantity: newQuantity, status: 'Modified', originalQuantity: item.originalQuantity || item.quantity } : item
        );
      }
      const totals = calculateOrderTotals(updatedItems);
      // Filter out items that were set to 0 quantity but keep 'CancelledItem' for record if they had original quantity.
      const finalItems = updatedItems.filter(item => item.quantity > 0 || (item.status === 'CancelledItem' && item.originalQuantity && item.originalQuantity > 0));
      
      const newOrderStatus: Order['status'] = prevOrder.status === 'Open' && !prevOrder.modifiedAt ? 'Open' : 'Modified';
      
      logActivity('ITEM_STATUS_CHANGED', `Item "${itemName}" ${action} to ${newQuantity} in Order #${prevOrder.id.substring(0,5)}.`, {orderId: prevOrder.id, menuItemId, itemName, newQuantity, oldQuantity: itemToUpdate?.quantity});

      return { ...prevOrder, items: finalItems, ...totals, status: newOrderStatus, modifiedAt: Date.now() };
    });
  };

  const handleConfirmOrder = () => {
    if (!currentOrder || !selectedTable || currentOrder.status === 'Paid') return;
    
    const isNewOrderCreation = !orders.some(o => o.id === currentOrder.id);

    const finalOrderItems = currentOrder.items.map(item => ({
        ...item,
        status: (item.status === 'Modified' || item.status === 'AcknowledgedModification') // If item was modified, send to kitchen as 'Pending'
                ? 'Pending' 
                : item.status
    })).filter(item => // Keep cancelled items if they had an original quantity for record, otherwise filter them out
        item.status !== 'CancelledItem' || (item.originalQuantity && item.originalQuantity > 0)
    );

    const activeItemsExistAfterUpdate = finalOrderItems.some(item => item.status !== 'CancelledItem' && item.quantity > 0);
    const hasServedItemsHistorically = currentOrder.items.some(i => i.status === 'Served');

    let newStatus: Order['status'];
    if (activeItemsExistAfterUpdate) {
        newStatus = (currentOrder.status === 'Open' && !currentOrder.modifiedAt && !isNewOrderCreation) ? 'Open' : 'Modified';
        if (isNewOrderCreation) newStatus = 'Open'; // New orders are 'Open'
    } else { // No active items left
        if (hasServedItemsHistorically) {
            newStatus = 'Modified'; // Still needs billing for served items
        } else {
            newStatus = 'Cancelled';
        }
    }
    
    const orderToSave: Order = {
        ...currentOrder,
        items: finalOrderItems, 
        status: newStatus,
        modifiedAt: (newStatus === 'Modified' || newStatus === 'Cancelled' || (activeItemsExistAfterUpdate && currentOrder.modifiedAt)) ? Date.now() : currentOrder.modifiedAt,
        createdAt: currentOrder.createdAt || Date.now(), // Ensure createdAt is set
        totalAmount: newStatus === 'Cancelled' ? 0 : calculateOrderTotals(finalOrderItems).totalAmount,
        taxAmount: newStatus === 'Cancelled' ? 0 : calculateOrderTotals(finalOrderItems).taxAmount,
        grandTotal: newStatus === 'Cancelled' ? 0 : calculateOrderTotals(finalOrderItems).grandTotal,
    };
    
    if (isNewOrderCreation && newStatus !== 'Cancelled' && activeItemsExistAfterUpdate) {
        logActivity('ORDER_CREATED', `Order #${orderToSave.id.substring(0,5)} created for Table ${selectedTable.name}. Total: ${orderToSave.grandTotal.toFixed(2)}`, {order: orderToSave});
    } else if (!isNewOrderCreation && newStatus === 'Modified') {
        logActivity('ORDER_MODIFIED', `Order #${orderToSave.id.substring(0,5)} for Table ${selectedTable.name} updated. Total: ${orderToSave.grandTotal.toFixed(2)}`, {order: orderToSave});
    } else if (newStatus === 'Cancelled') {
        logActivity('ORDER_CANCELLED', `Order #${orderToSave.id.substring(0,5)} for Table ${selectedTable.name} was cancelled.`, {orderId: orderToSave.id, reason: orderToSave.cancelledReason || 'Confirmed empty/invalid'});
    }

    setOrders(prevOrders => {
      const existingOrderIndex = prevOrders.findIndex(o => o.id === orderToSave.id);
      if (existingOrderIndex > -1) {
        return prevOrders.map((o, i) => i === existingOrderIndex ? orderToSave : o);
      }
      return [...prevOrders, orderToSave];
    });
 
    if (newStatus !== 'Cancelled' && activeItemsExistAfterUpdate && selectedTable.status === TableStatus.Available) {
        handleTableStatusChange(selectedTable.id, TableStatus.Occupied, `Order #${orderToSave.id.substring(0,5)} placed.`);
    } else if (newStatus === 'Cancelled') { 
       // Check if there are other open orders for this table after this one is cancelled
       const currentOrdersList = orders.map(o => o.id === orderToSave.id ? orderToSave : o); // Reflect current cancellation
       const otherOpenOrdersForTable = currentOrdersList.some(o => 
            o.tableId === selectedTable.id && 
            o.id !== orderToSave.id && 
            (o.status === 'Open' || o.status === 'Modified')
       );
       if (!otherOpenOrdersForTable) {
           handleTableStatusChange(selectedTable.id, TableStatus.Available, `Order #${orderToSave.id.substring(0,5)} cancelled.`, true);
       }
    }
    
    setIsOrderModalOpen(false);
    setSelectedTable(null);
    setCurrentOrder(null);
  };
  
  const handleCancelEntireOrder = (orderToCancel: Order, reason: string = "Customer request") => {
    if (orderToCancel.status === 'Paid') {
        alert("Cannot cancel a paid order.");
        return;
    }
    if (orderToCancel.items.some(item => item.status === 'Served')) {
        alert("Cannot cancel the entire order as some items have already been served. Please cancel individual unserved items if needed, or proceed to bill for served items.");
        return;
    }
    const cancelledOrderData = { 
        ...orderToCancel, 
        status: 'Cancelled' as 'Cancelled', 
        cancelledReason: reason, 
        items: orderToCancel.items.map(item => ({...item, status: 'CancelledItem' as 'CancelledItem', originalQuantity: item.quantity > 0 ? item.quantity : item.originalQuantity})),
        modifiedAt: Date.now(),
        grandTotal:0, totalAmount:0, taxAmount:0 // No value for cancelled order
    };

    setOrders(prevOrders => prevOrders.map(o => o.id === orderToCancel.id ? cancelledOrderData : o));
    logActivity('ORDER_CANCELLED', `Order #${orderToCancel.id.substring(0,5)} for Table ${tables.find(t=>t.id === orderToCancel.tableId)?.name || 'N/A'} cancelled. Reason: ${reason}`, {orderId: orderToCancel.id, reason});

    const currentOrdersList = orders.map(o => o.id === orderToCancel.id ? cancelledOrderData : o);
    const otherOpenOrdersForTable = currentOrdersList.some(o => 
        o.tableId === orderToCancel.tableId && 
        o.id !== orderToCancel.id && 
        (o.status === 'Open' || o.status === 'Modified')
    );
    if (!otherOpenOrdersForTable) {
        handleTableStatusChange(orderToCancel.tableId, TableStatus.Available, `Order #${orderToCancel.id.substring(0,5)} cancelled, making table available.`, true); 
    }

    setIsOrderModalOpen(false); 
    setCurrentOrder(null);
    setSelectedTable(null);
  };

  const handleOpenBill = (order: Order) => {
    const billableItems = order.items.filter(item => {
        if (order.status === 'Paid') return item.status !== 'CancelledItem'; // If paid, show all non-cancelled for receipt
        return item.status === 'Served'; // If not paid, only bill served items
    });
    
    // Check if there's anything to bill IF order is not already paid
    if (order.status !== 'Paid' && billableItems.length === 0 && order.items.some(i => i.status !== 'CancelledItem' && i.quantity > 0)) {
        alert("No items have been marked as served for this order yet. Bill can only be generated for served items.");
        return;
    }
    
    const billTotals = calculateOrderTotals(billableItems);

    const bill: Bill = {
      id: generateId(), // Bill ID can be new each time it's viewed if not persisting bills separately
      orderId: order.id,
      tableId: order.tableId,
      items: billableItems, // Only served or already paid-for items
      subtotal: billTotals.totalAmount,
      taxRate: TAX_RATE,
      taxAmount: billTotals.taxAmount,
      discounts: [], // Placeholder for future discount feature
      totalAmount: billTotals.grandTotal,
      paidAt: order.status === 'Paid' ? order.modifiedAt : undefined, // If order is paid, use its modifiedAt as paidAt
    };
    setCurrentBill(bill);
    setIsBillModalOpen(true);
  };

  const handleProcessPayment = (bill: Bill, paymentMethod: string) => {
    if(currentUser?.role !== 'owner') {
        alert("Only owners can process payments.");
        return;
    }
    
    const orderBeingPaid = orders.find(o => o.id === bill.orderId);
    if (orderBeingPaid && orderBeingPaid.status === 'Paid') {
        alert("This order has already been paid.");
        setIsBillModalOpen(false);
        setCurrentBill(null);
        return;
    }
    
    const paymentTimestamp = Date.now();
    const updatedOrders = orders.map(o => 
      o.id === bill.orderId ? { ...o, status: 'Paid' as 'Paid', modifiedAt: paymentTimestamp } : o
    );
    setOrders(updatedOrders);
    logActivity('ORDER_PAID', `Order #${bill.orderId.substring(0,5)} marked as Paid. Amount: ${bill.totalAmount.toFixed(2)}, Method: ${paymentMethod}.`, {orderId: bill.orderId, amount: bill.totalAmount, paymentMethod});
    
    // Check if this was the last open order for the table
    const otherOpenOrdersForTable = updatedOrders.some(o => 
        o.tableId === bill.tableId && 
        o.id !== bill.orderId && // Exclude the one just paid
        (o.status === 'Open' || o.status === 'Modified')
    );

    if (!otherOpenOrdersForTable) {
        handleTableStatusChange(
            bill.tableId, 
            TableStatus.Available, // Change to Available directly
            `Order #${bill.orderId.substring(0,5)} paid, table automatically set to available.`,
            true // Bypass active order check, as we've just handled it
        );
    }
    
    setIsBillModalOpen(false);
    setCurrentBill(null);
  };

  const handleTableStatusChange = (
    tableId: string, 
    newStatus: TableStatus, 
    reasonForChange?: string,
    bypassActiveOrderCheckForConfirmation: boolean = false
  ) => {
    const tableToUpdate = tables.find(t => t.id === tableId);
    if (!tableToUpdate) return;

    const activeOrdersForTable = orders.filter(o => 
        o.tableId === tableId && 
        (o.status === 'Open' || o.status === 'Modified')
    );

    let proceedWithStatusChange = true;

    // Confirmation logic only if not bypassed AND new status is Available/Cleaning AND active orders exist
    if (!bypassActiveOrderCheckForConfirmation && 
        (newStatus === TableStatus.Available || newStatus === TableStatus.Cleaning) && 
        activeOrdersForTable.length > 0
    ) {
      const confirmChange = window.confirm(
        `Table "${tableToUpdate.name}" has active order(s). Changing status to "${newStatus}" will NOT cancel these orders. They must be managed separately. Do you want to proceed with changing only the table status?`
      );
      if (!confirmChange) {
        proceedWithStatusChange = false;
      }
    }
    
    if (!proceedWithStatusChange) {
        // If change was aborted from modal, close modal
        if (isTableStatusModalOpen && editingTableForStatus?.id === tableId) {
            setIsTableStatusModalOpen(false);
            setEditingTableForStatus(null);
        }
        return; // Abort status change
    }
    
    // Log if status actually changes
    if (tableToUpdate.status !== newStatus) {
        logActivity('TABLE_STATUS_CHANGED', `Table "${tableToUpdate.name}" status changed from ${tableToUpdate.status} to ${newStatus}. ${reasonForChange || ''}`, {tableId, oldStatus: tableToUpdate.status, newStatus, reason: reasonForChange});
    }

    setTables(prevTables => prevTables.map(t => t.id === tableId ? {...t, status: newStatus} : t));
    
    // If change was initiated from modal, close modal
    if (isTableStatusModalOpen && editingTableForStatus?.id === tableId) {
        setIsTableStatusModalOpen(false);
        setEditingTableForStatus(null);
    }
  };

  const handleSaveTableConfig = () => {
    if (!editingTableConfig || !editingTableConfig.name || !editingTableConfig.capacity || editingTableConfig.capacity <= 0) {
        alert("Seating area name and a valid capacity (greater than 0) are required.");
        return;
    }
    const isNew = !editingTableConfig.id;
    const newTableData: Table = {
        id: editingTableConfig.id || generateId(),
        name: editingTableConfig.name,
        capacity: Number(editingTableConfig.capacity),
        status: editingTableConfig.status || TableStatus.Available, // Default to Available if new
    };

    setTables(prev => 
        isNew ? [...prev, newTableData] : prev.map(t => t.id === newTableData.id ? newTableData : t)
    );
    logActivity(
        isNew ? 'TABLE_CONFIG_ADDED' : 'TABLE_CONFIG_UPDATED',
        `Seating area "${newTableData.name}" (Cap: ${newTableData.capacity}) was ${isNew ? 'added' : 'updated'}.`,
        { table: newTableData }
    );
    setIsTableEditModalOpen(false);
    setEditingTableConfig(null);
  };


  // Section Components
  const LoginView: React.FC = () => (
    <div className="flex items-center justify-center min-h-screen p-4" style={{ background: 'linear-gradient(to bottom right, var(--header-background-color), var(--primary-color))' }}>
        <div className={`p-8 rounded-xl shadow-2xl w-full max-w-md text-center ${getDensityPaddingClasses(themeSettings.uiDensity, 'card')}`} style={{backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)'}}>
            <span className={`${getIconSizeClass(themeSettings.iconSize)}`} dangerouslySetInnerHTML={{__html: LOGIN_ICON_SVG}} style={{color: 'var(--primary-color)', display: 'block', margin: '0 auto 1.5rem auto'}}></span>
            <h2 className="text-3xl font-bold mb-8" style={{color: 'var(--text-color)'}}>{APP_NAME} Login</h2>
            <div className="space-y-4">
                 <input type="text" placeholder="Username (e.g., owner, staff, kitchen)" defaultValue="owner" id="username_mock" className={`w-full p-3 border rounded-lg focus:ring-2 outline-none ${getDensityPaddingClasses(themeSettings.uiDensity, 'button').replace(/px-\d+|py-\d+/, 'p-3')}`} style={{borderColor: 'var(--border-color)', color: 'var(--text-color)', backgroundColor: 'var(--card-background-color)', '--tw-ring-color': 'var(--primary-color)'} as React.CSSProperties} />
                 <input type="password" placeholder="Password (mock)" defaultValue="password" id="password_mock" className={`w-full p-3 border rounded-lg focus:ring-2 outline-none ${getDensityPaddingClasses(themeSettings.uiDensity, 'button').replace(/px-\d+|py-\d+/, 'p-3')}`} style={{borderColor: 'var(--border-color)', color: 'var(--text-color)', backgroundColor: 'var(--card-background-color)', '--tw-ring-color': 'var(--primary-color)'} as React.CSSProperties}/>
                <button 
                    onClick={() => handleLogin('owner', (document.getElementById('username_mock') as HTMLInputElement)?.value || 'Owner')} 
                    className={`w-full font-semibold rounded-lg transition-colors duration-300 ease-in-out transform hover:scale-105 ${getDensityPaddingClasses(themeSettings.uiDensity, 'button')}`}
                    style={{backgroundColor: 'var(--primary-color)', color: 'var(--button-text-color)'}}
                >
                    Login as Owner
                </button>
                <button 
                    onClick={() => handleLogin('staff', (document.getElementById('username_mock') as HTMLInputElement)?.value.replace("owner", "staff") || 'Staff')} 
                    className={`w-full font-semibold rounded-lg transition-colors duration-300 ease-in-out transform hover:scale-105 ${getDensityPaddingClasses(themeSettings.uiDensity, 'button')}`}
                    style={{backgroundColor: 'var(--secondary-color)', color: 'var(--button-text-color)'}}
                >
                    Login as Staff (Waiter)
                </button>
                <button 
                    onClick={() => handleLogin('kitchen', (document.getElementById('username_mock') as HTMLInputElement)?.value.replace("owner", "kitchen") || 'Kitchen Staff')} 
                    className={`w-full font-semibold rounded-lg transition-colors duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center ${getDensityPaddingClasses(themeSettings.uiDensity, 'button')}`}
                     style={{backgroundColor: '#F97316', color: 'var(--button-text-color)'}} // Example: Orange for kitchen
                >
                    <span className={`${getIconSizeClass(themeSettings.iconSize)} mr-2`} dangerouslySetInnerHTML={{__html: KITCHEN_LOGIN_ICON_SVG}}></span>
                    Login as Kitchen Staff
                </button>
            </div>
            <p className="text-xs mt-8" style={{color: 'var(--text-color)', opacity: 0.7}}>This is a mocked login for demonstration purposes.</p>
        </div>
    </div>
  );

  const TableView: React.FC = () => (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 ${getDensityPaddingClasses(themeSettings.uiDensity, 'card')}`}>
      {tables.map(table => {
        const activeOrderForTable = orders.find(o => o.tableId === table.id && (o.status === 'Open' || o.status === 'Modified'));
        
        let displayStatus = table.status;
        let baseBgColor = '';
        
        switch (displayStatus) {
            case TableStatus.Available: baseBgColor = themeSettings.secondaryColor; break; 
            case TableStatus.Occupied: baseBgColor = themeSettings.primaryColor; break; 
            case TableStatus.Reserved: baseBgColor = '#F59E0B'; break; 
            case TableStatus.Dirty: baseBgColor = '#F97316'; break; 
            case TableStatus.Cleaning: baseBgColor = '#60A5FA'; break; 
            default: baseBgColor = '#9CA3AF'; 
        }

        const canSelect = () => {
            if (currentUser?.role === 'kitchen') return false;
            if (activeOrderForTable) return true; 
            if (displayStatus === TableStatus.Reserved && currentUser?.role !== 'owner') return false;
            return true;
        };
        
        const isSelectable = canSelect();

        return (
        <div
          key={table.id}
          onClick={() => {
            if (isSelectable) {
                handleTableSelect(table);
            } else {
                if (currentUser?.role !== 'kitchen') {
                  if (displayStatus === TableStatus.Reserved) alert("This table is reserved.");
                  else if (displayStatus === TableStatus.Dirty || displayStatus === TableStatus.Cleaning) alert(`Table is ${displayStatus}. Please wait or contact owner for access.`);
                } else {
                   alert("Kitchen staff view orders on the Kitchen Dashboard."); 
                }
            }
          }}
          className={`p-3 rounded-lg shadow-lg ${isSelectable ? 'cursor-pointer' : 'cursor-default'} transition-all hover:shadow-xl relative
            text-white font-semibold text-center h-36 flex flex-col justify-between items-center 
            ${getDensityPaddingClasses(themeSettings.uiDensity, 'card')} ${themeSettings.contentScale} origin-center`}
          style={{ 
            backgroundColor: baseBgColor, 
            color: themeSettings.buttonTextColor, 
            opacity: (!isSelectable && displayStatus === TableStatus.Reserved) ? 0.7 : 1,
          }}
        >
          <div className="absolute top-1 right-1">
            {(currentUser?.role === 'owner' || currentUser?.role === 'staff') && (
                <button 
                    onClick={(e) => { e.stopPropagation(); setEditingTableForStatus(table); setIsTableStatusModalOpen(true);}} 
                    className={`p-1 bg-black bg-opacity-20 rounded-full hover:bg-opacity-40 transition-opacity ${getDensityPaddingClasses(themeSettings.uiDensity, 'button').replace('px-','p-').replace('py-','')}`}
                    title="Change Table Status"
                >
                    <span className={`${getIconSizeClass(themeSettings.iconSize)} w-5 h-5`} dangerouslySetInnerHTML={{__html: TABLE_SETTINGS_ICON_SVG}}></span>
                </button>
            )}
          </div>
           {activeOrderForTable && displayStatus !== TableStatus.Occupied && (
            <div title="This table has an active order" className="absolute top-1 left-1 bg-red-700 p-1 rounded-full animate-pulse shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="white" className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
            </div>
           )}
          <span className={`${getIconSizeClass(themeSettings.iconSize)} w-10 h-10 mt-2`} dangerouslySetInnerHTML={{ __html: displayStatus === TableStatus.Cleaning ? CLEANING_ICON_SVG : TABLE_ICON_SVG }}></span>
          <div>
            <p className="text-md sm:text-lg">{table.name}</p>
            <p className="text-xs">Cap: {table.capacity} | {displayStatus}</p>
          </div>
          { orders.some(o => o.tableId === table.id && o.status === 'Paid') && 
            !activeOrderForTable && 
            (displayStatus === TableStatus.Available || displayStatus === TableStatus.Cleaning) && 
             <div className="absolute bottom-1 left-1 bg-green-700 bg-opacity-80 px-2 py-0.5 rounded text-xs">Recently Paid</div>
          }
        </div>
      );})}
    </div>
  );

  const TableStatusModalContent: React.FC = () => {
    if(!editingTableForStatus) return null;
    return (
        <div className={`${getDensityPaddingClasses(themeSettings.uiDensity, 'modalContent')}`}>
            <h4 className="text-lg font-semibold mb-3">Change Status for {editingTableForStatus.name}</h4>
            <div className="grid grid-cols-2 gap-2">
                {Object.values(TableStatus).map(status => {
                     let bgColor = '';
                     switch (status) {
                        case TableStatus.Available: bgColor = themeSettings.secondaryColor; break;
                        case TableStatus.Occupied: bgColor = themeSettings.primaryColor; break;
                        case TableStatus.Reserved: bgColor = '#F59E0B'; break;
                        case TableStatus.Dirty: bgColor = '#F97316'; break;
                        case TableStatus.Cleaning: bgColor = '#60A5FA'; break;
                        default: bgColor = '#9CA3AF';
                     }
                    return (
                    <button 
                        key={status}
                        onClick={() => handleTableStatusChange(
                            editingTableForStatus.id, 
                            status,
                            `Manual change by ${currentUser?.name}`
                        )}
                        className={`p-3 rounded-md text-white font-medium hover:opacity-80 transition-opacity ${getDensityPaddingClasses(themeSettings.uiDensity, 'button')}
                            ${editingTableForStatus.status === status ? 'ring-2 ring-offset-2 ring-black' : ''}
                        `}
                        style={{ backgroundColor: bgColor, color: themeSettings.buttonTextColor }}
                        title={ (status === TableStatus.Available || status === TableStatus.Cleaning) && orders.some(o => o.tableId === editingTableForStatus.id && o.items.some(i => i.status === 'Served') && o.status !== 'Paid') ? "Cannot make table Available/Cleaning with served, unpaid items. Bill must be paid first." : ""}
                        disabled={ (status === TableStatus.Available || status === TableStatus.Cleaning) && orders.some(o => o.tableId === editingTableForStatus.id && o.items.some(i => i.status === 'Served') && o.status !== 'Paid')}
                    >
                        {status}
                    </button>
                )})}
            </div>
            { orders.some(o => o.tableId === editingTableForStatus.id && (o.status === 'Open' || o.status === 'Modified')) &&
                 (editingTableForStatus.status === TableStatus.Available || editingTableForStatus.status === TableStatus.Cleaning) &&
                 <p className="text-xs text-orange-600 mt-2">Note: This table has active order(s). Changing status to 'Available' or 'Cleaning' will require confirmation and will NOT cancel the order(s).</p>
            }
             { orders.some(o => o.tableId === editingTableForStatus.id && o.items.some(i => i.status === 'Served') && o.status !== 'Paid') &&
                 <p className="text-xs text-red-600 mt-2">Cannot set to 'Available' or 'Cleaning' while served, unpaid items exist. Please process payment first.</p>
            }
        </div>
    );
  };

  const OrderModalContent: React.FC = () => {
    if (!selectedTable || !currentOrder) return null;
    
    const [selectedMenuCategoryFilter, setSelectedMenuCategoryFilter] = useState<string | null>(menuCategories[0]?.id || null);
    const [cancelReason, setCancelReason] = useState("");
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    const isOrderPaid = currentOrder.status === 'Paid';
    const hasServedItems = currentOrder.items.some(item => item.status === 'Served');
    const displayableOrderItems = currentOrder.items.filter(item => item.status !== 'CancelledItem' || (item.originalQuantity && item.originalQuantity > 0));
    
    const canViewBill = (hasServedItems || isOrderPaid || (currentOrder.status !== 'Cancelled' && currentOrder.items.some(i=>i.status === 'Served')));
    const isNewEmptyOrder = currentOrder.items.length === 0 && currentOrder.status === 'Open' && !currentOrder.modifiedAt;
    const densityButtonClass = getDensityPaddingClasses(themeSettings.uiDensity, 'button');
    const densityCardClass = getDensityPaddingClasses(themeSettings.uiDensity, 'card');

    const handleOwnerMarkAsServed = (menuItemId: string, itemName: string) => {
        if (currentUser?.role !== 'owner' || !currentOrder) return;
        updateOrderItemStatus(currentOrder.id, menuItemId, itemName, 'Served', false, true);
        const updatedOrder = orders.find(o => o.id === currentOrder.id);
        if (updatedOrder) setCurrentOrder({...updatedOrder});
    };

    return (
      <div className={`flex flex-col md:flex-row gap-4 max-h-[75vh] ${densityCardClass}`} style={{color: 'var(--card-text-color)'}}>
        <div className="md:w-1/2 overflow-y-auto pr-2 border-r" style={{borderColor: 'var(--border-color)'}}>
          <h4 className="text-lg font-semibold mb-2">Menu</h4>
           {isOrderPaid && (
            <div className={`p-2 mb-2 bg-yellow-100 border border-yellow-300 rounded-md text-yellow-700 text-sm ${densityCardClass.replace('p-','p-2')}`}>
                This order has been paid. No further modifications allowed.
            </div>
          )}
          <div className="mb-3">
            <select 
              value={selectedMenuCategoryFilter || ''}
              onChange={(e) => setSelectedMenuCategoryFilter(e.target.value || null)}
              className={`p-2 border rounded-md text-sm w-full ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2')}`}
              style={{backgroundColor: 'var(--card-background-color)', borderColor: 'var(--border-color)', color: 'var(--card-text-color)'}}
              disabled={isOrderPaid}
            >
              <option value="">All Categories</option>
              {menuCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
          <div className="max-h-[50vh] overflow-y-auto">
            {menuItems.filter(item => item.inStock && (!selectedMenuCategoryFilter || item.category === selectedMenuCategoryFilter)).map(item => (
                <div key={item.id} className={`mb-2 p-3 border rounded-lg hover:bg-gray-100 transition-colors flex justify-between items-center ${densityCardClass.replace('p-','p-3')}`} style={{borderColor: 'var(--border-color)'}}>
                <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm">{item.price.toFixed(2)}</p>
                </div>
                <button
                    onClick={() => handleAddToOrder(item)}
                    className={`rounded-md transition-colors ${densityButtonClass} ${isOrderPaid ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
                    style={{backgroundColor: isOrderPaid ? '#D1D5DB' : 'var(--primary-color)', color: 'var(--button-text-color)'}}
                    disabled={isOrderPaid}
                > Add </button>
                </div>
            ))}
          </div>
        </div>

        <div className={`md:w-1/2 rounded-lg flex flex-col ${densityCardClass}`} style={{backgroundColor: 'var(--background-color)'}}>
          <h4 className="text-lg font-semibold mb-3">Order for {selectedTable.name} (ID: {currentOrder.id.substring(0,5)})
            {isOrderPaid && <span className="ml-2 text-sm font-normal text-green-600">(Paid)</span>}
            {hasServedItems && !isOrderPaid && <span className="ml-2 text-sm font-normal text-orange-600">(Some items served)</span>}
          </h4>
          <div className="overflow-y-auto flex-grow max-h-[40vh]">
            {displayableOrderItems.length === 0 && !isOrderPaid ? (
                <p className="text-gray-500 text-center py-5">No items in order.</p>
            ) : (
                displayableOrderItems.map(item => {
                  const isItemServed = item.status === 'Served';
                  const isItemCancelled = item.status === 'CancelledItem';
                  return (
                    <div key={item.menuItemId + item.name + item.quantity + item.status} 
                        className={`flex justify-between items-center mb-2 py-2 border-b 
                            ${item.status === 'Modified' ? 'bg-yellow-50 rounded-md p-1' : ''}
                            ${item.status === 'AcknowledgedModification' ? 'bg-blue-50 rounded-md p-1' : ''}
                            ${isItemCancelled ? 'opacity-60' : ''}
                        `} style={{borderColor: 'var(--border-color)'}}>
                        <div className="flex-grow">
                          <p className={`font-medium ${isItemCancelled ? 'line-through' : ''}`}>{item.name} <span className="text-xs">({item.priceAtOrder.toFixed(2)})</span></p>
                          <p className="text-xs">Item Status: {item.status} {item.originalQuantity && (item.status === 'Modified' || isItemCancelled) ? `(was ${item.originalQuantity})` : ''}</p>
                           {currentUser?.role === 'owner' && !isItemServed && !isItemCancelled && !isOrderPaid && (
                                <button 
                                    onClick={() => handleOwnerMarkAsServed(item.menuItemId, item.name)} 
                                    className={`mt-1 text-xs px-2 py-0.5 rounded hover:opacity-80 ${densityButtonClass.replace('px-4','px-2').replace('py-2','py-0.5').replace('text-sm','text-xs')}`}
                                    style={{backgroundColor: '#A855F7', color: 'var(--button-text-color)'}} // Purple
                                    title="Owner: Directly mark this item as served (bypasses kitchen flow)"
                                >
                                    Owner: Mark Served
                                </button>
                            )}
                        </div>
                        <div className="flex items-center ml-2">
                        <button 
                            onClick={() => handleUpdateOrderItemQuantity(item.menuItemId, item.name, item.quantity - 1)} 
                            className={`px-2 py-1 rounded-l ${(isOrderPaid || isItemServed || isItemCancelled) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300'} ${densityButtonClass.replace('px-4','px-2').replace('py-2','py-1')}`} 
                            style={{color: (isOrderPaid || isItemServed || isItemCancelled) ? '#6B7280' : 'var(--text-color)', backgroundColor: (isOrderPaid || isItemServed || isItemCancelled) ? '#D1D5DB' : '#E5E7EB'}}
                            disabled={isOrderPaid || isItemServed || isItemCancelled}
                            title={(isItemServed) ? "Cannot change quantity of served items" : ""}
                        >-</button>
                        <span className={`px-3 py-1 border-t border-b ${densityButtonClass.replace('px-4','px-3').replace('py-2','py-1')}`} style={{backgroundColor: 'var(--card-background-color)', borderColor: 'var(--border-color)'}}>{item.quantity}</span>
                        <button 
                            onClick={() => handleUpdateOrderItemQuantity(item.menuItemId, item.name, item.quantity + 1)} 
                            className={`px-2 py-1 rounded-r ${(isOrderPaid || isItemServed || isItemCancelled) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300'} ${densityButtonClass.replace('px-4','px-2').replace('py-2','py-1')}`} 
                            style={{color: (isOrderPaid || isItemServed || isItemCancelled) ? '#6B7280' : 'var(--text-color)', backgroundColor: (isOrderPaid || isItemServed || isItemCancelled) ? '#D1D5DB' : '#E5E7EB'}}
                            disabled={isOrderPaid || isItemServed || isItemCancelled}
                            title={(isItemServed) ? "Cannot change quantity of served items" : ""}
                        >+</button>
                        </div>
                        <p className={`font-semibold w-16 text-right ${isItemCancelled ? 'line-through' : ''}`}>
                            {isItemCancelled ? '0.00' : (item.priceAtOrder * item.quantity).toFixed(2)}
                        </p>
                    </div>
                  );
                })
            )}
          </div>
          
          {currentOrder.items.some(i=>i.status !== 'CancelledItem' && i.quantity > 0) && (
            <div className="mt-4 pt-4 border-t" style={{borderColor: 'var(--border-color)'}}>
              <div className="flex justify-between text-sm"><span>Subtotal:</span><span>{calculateOrderTotals(currentOrder.items.filter(i=>i.status !== 'CancelledItem')).totalAmount.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span>Tax ({TAX_RATE*100}%):</span><span>{calculateOrderTotals(currentOrder.items.filter(i=>i.status !== 'CancelledItem')).taxAmount.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-lg"><span>Total:</span><span>{calculateOrderTotals(currentOrder.items.filter(i=>i.status !== 'CancelledItem')).grandTotal.toFixed(2)}</span></div>
            </div>
          )}

          {showCancelConfirm && !isOrderPaid && !hasServedItems && (
             <div className={`mt-4 p-3 bg-red-50 border border-red-200 rounded-md ${densityCardClass.replace('p-','p-3')}`}>
                <p className="text-sm text-red-700 font-semibold">Are you sure you want to cancel this entire order?</p>
                <input type="text" value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Reason for cancellation (optional)" className={`w-full p-2 border rounded mt-2 text-sm ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2')}`} style={{borderColor: 'var(--border-color)', color: 'var(--text-color)', backgroundColor: 'var(--card-background-color)'}} />
                <div className="mt-2 flex justify-end gap-2">
                    <button onClick={() => setShowCancelConfirm(false)} className={`bg-gray-300 text-xs rounded ${densityButtonClass.replace('text-sm','text-xs')}`} style={{color: 'var(--text-color)', backgroundColor: '#D1D5DB'}}>No, keep order</button>
                    <button onClick={() => { if(currentOrder) { handleCancelEntireOrder(currentOrder, cancelReason); setShowCancelConfirm(false); }}} className={`bg-red-500 text-white text-xs rounded ${densityButtonClass.replace('text-sm','text-xs')}`}>Yes, Cancel Order</button>
                </div>
             </div>
          )}

          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button onClick={() => { setIsOrderModalOpen(false); setSelectedTable(null); setCurrentOrder(null);}} className={`rounded-md hover:opacity-80 ${densityButtonClass}`} style={{backgroundColor: '#D1D5DB', color: 'var(--text-color)'}}>Close</button>
            
            {!isOrderPaid && !showCancelConfirm && currentOrder.status !== 'Cancelled' && (
                <button 
                    onClick={() => {
                        if (isNewEmptyOrder) {
                            setIsOrderModalOpen(false); setSelectedTable(null); setCurrentOrder(null);
                        } else {
                            setShowCancelConfirm(true);
                        }
                    }} 
                    className={`rounded-md ${densityButtonClass} 
                        ${hasServedItems ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}
                    `}
                    style={{color: 'var(--button-text-color)', backgroundColor: hasServedItems ? '#9CA3AF' : '#EF4444' }}
                    disabled={hasServedItems}
                    title={hasServedItems ? "Cannot cancel entire order with served items. Cancel individual unserved items." : (isNewEmptyOrder ? "Discard this new order" : "Cancel Entire Order")}
                >
                    {isNewEmptyOrder ? "Discard New Order" : "Cancel Order"}
                </button>
            )}

            {!isOrderPaid && <button onClick={handleConfirmOrder} className={`rounded-md hover:opacity-80 ${densityButtonClass}`} style={{backgroundColor: 'var(--secondary-color)', color: 'var(--button-text-color)'}} > {currentOrder.status === 'Open' && !currentOrder.modifiedAt ? 'Confirm & Send to Kitchen' : 'Update Order'} </button>}
            
            {canViewBill && currentOrder.status !== 'Cancelled' && (
                <button 
                    onClick={() => handleOpenBill(currentOrder)} 
                    className={`rounded-md hover:opacity-80 ${densityButtonClass}`}
                    style={{backgroundColor: '#A855F7', color: 'var(--button-text-color)'}} // Purple
                >
                    {isOrderPaid ? 'View Receipt' : 'View Bill'}
                </button>
            )}
            {!canViewBill && currentOrder.items.some(i => i.status !== 'CancelledItem' && i.quantity > 0) && currentOrder.status !== 'Cancelled' && !isOrderPaid &&(
                 <p className={`text-xs text-orange-600 p-2 bg-orange-100 rounded-md ${densityButtonClass.replace('px-4','px-2').replace('py-2','p-2')}`}>Bill available once items are served.</p>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  const BillModalContent: React.FC = () => {
    if (!currentBill) return null;
    
    const associatedOrder = orders.find(o => o.id === currentBill.orderId);
    const isAlreadyPaid = associatedOrder?.status === 'Paid';
    const paidTimestamp = associatedOrder?.modifiedAt;

    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [splitWays, setSplitWays] = useState(1);
    const amountPerPerson = splitWays > 0 ? (currentBill.totalAmount / splitWays).toFixed(2) : currentBill.totalAmount.toFixed(2);
    const canProcessPayment = currentUser?.role === 'owner' && !isAlreadyPaid;
    const densityButtonClass = getDensityPaddingClasses(themeSettings.uiDensity, 'button');
    const densityCardClass = getDensityPaddingClasses(themeSettings.uiDensity, 'modalContent');


    return (
      <div className={`${densityCardClass}`} style={{color: 'var(--card-text-color)'}}>
        <h3 className="text-2xl font-bold text-center mb-4">{isAlreadyPaid ? 'Receipt' : 'Invoice'}</h3>
        <p className="text-sm text-center mb-2">Order ID: {currentBill.orderId.substring(0,8)}</p>
        <p className="text-sm text-center mb-4">Table: {tables.find(t=>t.id === currentBill.tableId)?.name}</p>
        
        {isAlreadyPaid && paidTimestamp && (
            <div className={`p-2 mb-3 bg-green-100 border border-green-300 rounded-md text-green-700 text-sm text-center ${densityCardClass.replace('p-','p-2')}`}>
                Payment Processed on: {new Date(paidTimestamp).toLocaleString()}
            </div>
        )}

        <div className="mb-4 max-h-60 overflow-y-auto">
          {currentBill.items.length === 0 && <p className="text-center text-gray-500">No billable items.</p>}
          {currentBill.items.map(item => ( 
            <div key={item.menuItemId + item.name} className="flex justify-between py-1 border-b" style={{borderColor: 'var(--border-color)'}}>
              <span>{item.name} x {item.quantity}</span>
              <span>{(item.priceAtOrder * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>

        {currentBill.items.length > 0 && (
          <div className="py-2 border-t" style={{borderColor: 'var(--border-color)'}}>
            <div className="flex justify-between"><span>Subtotal:</span><span>{currentBill.subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Tax ({currentBill.taxRate*100}%):</span><span>{currentBill.taxAmount.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-xl mt-2"><span>Total:</span><span>{currentBill.totalAmount.toFixed(2)}</span></div>
          </div>
        )}

        {!isAlreadyPaid && currentBill.items.length > 0 && (
            <>
                <div className="mt-4 pt-4 border-t" style={{borderColor: 'var(--border-color)'}}>
                    <h4 className="font-semibold mb-2">Split Bill</h4>
                    <div className="flex items-center gap-2 mb-2">
                        <label htmlFor="splitWays" className="text-sm">Split By:</label>
                        <input type="number" id="splitWays" value={splitWays} onChange={(e) => setSplitWays(Math.max(1, parseInt(e.target.value) || 1))} className={`w-16 p-1 border rounded ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-1')}`} min="1" style={{borderColor: 'var(--border-color)', color: 'var(--text-color)', backgroundColor: 'var(--card-background-color)'}}/>
                        <span>ways</span>
                    </div>
                    {splitWays > 1 && <p className="text-md font-semibold">Amount per person: {amountPerPerson}</p>}
                </div>

                <div className="mt-6">
                <label htmlFor="paymentMethod" className="block text-sm font-medium mb-1">Payment Method:</label>
                <select id="paymentMethod" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className={`w-full p-2 border rounded-md ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2')}`} style={{borderColor: 'var(--border-color)', color: 'var(--text-color)', backgroundColor: 'var(--card-background-color)'}} >
                    <option value="Cash">Cash</option> <option value="Card">Card (Mock)</option> <option value="Online">Online (Mock)</option>
                </select>
                </div>
            </>
        )}

        <div className="mt-6 flex justify-end gap-2">
           <button onClick={() => setIsBillModalOpen(false)} className={`rounded-md hover:opacity-80 ${densityButtonClass}`} style={{backgroundColor: '#D1D5DB', color: 'var(--text-color)'}}>Close</button>
           {!isAlreadyPaid && currentBill.items.length > 0 && (
            <button 
                onClick={() => handleProcessPayment(currentBill, paymentMethod)} 
                className={`rounded-md ${densityButtonClass} ${canProcessPayment ? 'hover:opacity-80' : 'opacity-50 cursor-not-allowed'}`}
                style={{backgroundColor: canProcessPayment ? 'var(--secondary-color)' : '#9CA3AF', color: 'var(--button-text-color)'}}
                disabled={!canProcessPayment}
                title={canProcessPayment ? `Mark as Paid (${paymentMethod})` : "Only owners can mark as paid"}
            >
                Mark as Paid ({paymentMethod})
            </button>
            )}
        </div>
        {!isAlreadyPaid && !canProcessPayment && currentBill.items.length > 0 && currentUser?.role !== 'owner' && <p className="text-xs text-red-600 text-right mt-2">Note: Payment processing is restricted to Owner role.</p>}
      </div>
    );
  };

  const KDSView: React.FC = () => ( 
    <div className={`p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 min-h-screen ${getDensityPaddingClasses(themeSettings.uiDensity, 'card')}`} style={{backgroundColor: themeSettings.cardBackgroundColor === '#FFFFFF' ? '#E5E7EB' : themeSettings.cardBackgroundColor }}> {/* Slightly different bg for KDS cards to pop */}
      {orders.filter(o => o.status !== 'Paid' && o.status !== 'Cancelled').sort((a,b) => (b.modifiedAt || b.createdAt) - (a.modifiedAt || a.createdAt)).length === 0 && 
        <p className="col-span-full text-center py-10 text-xl" style={{color: 'var(--text-color)'}}>No active kitchen orders.</p>
      }
      {orders.filter(o => o.status !== 'Paid' && o.status !== 'Cancelled').sort((a,b) => (b.modifiedAt || b.createdAt) - (a.modifiedAt || a.createdAt)).map(order => (
        <div key={order.id} className={`p-4 rounded-lg shadow-xl flex flex-col h-fit
            ${order.status === 'Cancelled' ? 'border-2 border-red-500' : ''}
            ${order.status === 'Modified' ? 'border-2 border-blue-500' : ''}
            ${themeSettings.kitchenDisplayScale} ${getDensityPaddingClasses(themeSettings.uiDensity, 'card')} origin-top-left
        `} style={{
            backgroundColor: 'var(--card-background-color)', 
            color: 'var(--card-text-color)',
            borderColor: order.status === 'Cancelled' ? '#EF4444' : (order.status === 'Modified' ? themeSettings.primaryColor : 'var(--border-color)'),
        }}>
          <div className="flex justify-between items-center mb-2 pb-2 border-b" style={{borderColor: 'var(--border-color)'}}>
            <h4 className={`text-lg font-bold ${order.status === 'Cancelled' ? 'text-red-700' : ''}`} style={{color: order.status === 'Cancelled' ? '#B91C1C' : themeSettings.primaryColor}}>
                Order #{order.id.substring(0,5)} ({tables.find(t=>t.id === order.tableId)?.name})
            </h4>
            {order.status === 'Cancelled' && <span className="text-sm font-bold text-red-700 px-2 py-1 bg-red-300 rounded">CANCELLED ORDER</span>}
          </div>
          <p className="text-xs mb-1" style={{color: 'var(--text-color)', opacity: 0.8}}>Received: {new Date(order.createdAt).toLocaleTimeString()}</p>
          {order.modifiedAt && order.modifiedAt !== order.createdAt && <p className="text-xs mb-2" style={{color: themeSettings.primaryColor}}>Updated: {new Date(order.modifiedAt).toLocaleTimeString()}</p>}
          
          <div className="space-y-2 flex-grow">
            {order.items.map(item => (
              <div key={item.menuItemId + item.name + item.status + item.quantity} 
                className={`p-2 my-1 rounded flex justify-between items-start text-sm border-l-4 ${getDensityPaddingClasses(themeSettings.uiDensity, 'card').replace('p-4','p-2')}
                ${item.status === 'Pending' ? 'border-yellow-400 bg-yellow-50' : ''}
                ${item.status === 'Preparing' ? 'border-orange-400 bg-orange-50' : ''}
                ${item.status === 'Ready' ? 'border-green-400 bg-green-50' : ''}
                ${item.status === 'Served' ? 'border-gray-400 bg-gray-100' : ''}
                ${item.status === 'CancelledItem' ? 'border-red-400 bg-red-50 line-through opacity-70' : ''}
                ${item.status === 'Modified' ? 'border-blue-400 bg-blue-50 font-semibold' : ''}
                ${item.status === 'AcknowledgedModification' ? 'border-indigo-400 bg-indigo-50' : ''}
              `}>
                <div className="flex-grow">
                  <p className={`font-semibold ${item.status === 'CancelledItem' ? 'text-red-600' : ''}`} style={{color: item.status === 'CancelledItem' ? '#B91C1C' : 'var(--card-text-color)'}}>
                    {item.name} <span className="font-bold text-md">x {item.quantity > 0 ? item.quantity : (item.originalQuantity || 0)}</span>
                  </p>
                  <p className="text-xs" style={{color: 'var(--card-text-color)', opacity: 0.8}}>Status: {item.status} {item.status === 'CancelledItem' && item.originalQuantity ? `(was ${item.originalQuantity})`:''}</p>
                </div>
                {order.status !== 'Cancelled' && item.status !== 'CancelledItem' && item.status !== 'Served' && (currentUser?.role === 'staff' || currentUser?.role === 'owner') && (
                  <div className="flex flex-col gap-1 items-end ml-2">
                    {item.status === 'Pending' && currentUser?.role === 'owner' && <button onClick={() => updateOrderItemStatus(order.id, item.menuItemId, item.name, 'Preparing', true)} className={`text-white rounded hover:opacity-80 w-full text-center ${getDensityPaddingClasses(themeSettings.uiDensity, 'button')}`} style={{backgroundColor: '#F97316'}}>Start Prep</button>}
                    {item.status === 'Preparing' && currentUser?.role === 'owner' && <button onClick={() => updateOrderItemStatus(order.id, item.menuItemId,item.name, 'Ready', true)} className={`text-white rounded hover:opacity-80 w-full text-center ${getDensityPaddingClasses(themeSettings.uiDensity, 'button')}`} style={{backgroundColor: themeSettings.secondaryColor}}>Mark Ready</button>}
                    {item.status === 'Ready' && (currentUser?.role === 'staff' || currentUser?.role === 'owner') && <button onClick={() => updateOrderItemStatus(order.id, item.menuItemId,item.name, 'Served')} className={`text-white rounded hover:opacity-80 w-full text-center ${getDensityPaddingClasses(themeSettings.uiDensity, 'button')}`} style={{backgroundColor: themeSettings.primaryColor}}>Mark Served</button>}
                    {item.status === 'Modified' && currentUser?.role === 'owner' && <button onClick={() => updateOrderItemStatus(order.id, item.menuItemId, item.name,'AcknowledgedModification', true)} className={`text-white rounded hover:opacity-80 w-full text-center ${getDensityPaddingClasses(themeSettings.uiDensity, 'button')}`} style={{backgroundColor: '#6366F1'}}>Ack Mod</button>}
                    {item.status === 'AcknowledgedModification' && currentUser?.role === 'owner' && <button onClick={() => updateOrderItemStatus(order.id, item.menuItemId, item.name,'Preparing', true)} className={`text-white rounded hover:opacity-80 w-full text-center ${getDensityPaddingClasses(themeSettings.uiDensity, 'button')}`} style={{backgroundColor: '#F97316'}}>Start Prep</button>}
                  </div>
                )}
              </div>
            ))}
          </div>
          {order.notes && <p className={`mt-2 text-xs p-1 rounded ${getDensityPaddingClasses(themeSettings.uiDensity, 'card').replace('p-4','p-1')}`} style={{backgroundColor: themeSettings.backgroundColor, color: themeSettings.textColor}}>Notes: {order.notes}</p>}
          {order.status === 'Cancelled' && order.cancelledReason && <p className="mt-2 text-xs text-red-700 bg-red-100 p-1 rounded">Reason: {order.cancelledReason}</p>}
        </div>
      ))}
    </div>
  );

  const KitchenDashboardView: React.FC<{isOwnerView?: boolean}> = ({ isOwnerView = false }) => {
    const kitchenOrders = orders
        .filter(o => o.status !== 'Paid' && o.status !== 'Cancelled') 
        .sort((a,b) => a.createdAt - b.createdAt); 

    const getElapsedTime = (timestamp: number): string => {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return "< 1 min ago";
        if (minutes < 60) return `${minutes} min ago`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ${minutes % 60}m ago`;
    };
    
    const dashboardBg = isOwnerView ? 'var(--background-color)' : '#1E293B'; 
    const cardBg = isOwnerView ? 'var(--card-background-color)' : '#334155';
    const cardText = isOwnerView ? 'var(--card-text-color)' : '#E2E8F0';
    const headingColor = isOwnerView ? 'var(--primary-color)' : '#FDE047'; 
    const densityButtonClass = getDensityPaddingClasses(themeSettings.uiDensity, 'button');
    const densityCardClass = getDensityPaddingClasses(themeSettings.uiDensity, 'card');

    return (
        <div className={`p-2 sm:p-4 min-h-screen ${densityCardClass.replace('p-4','p-2 sm:p-4')}`} style={{backgroundColor: dashboardBg}}>
            {!isOwnerView && <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center" style={{color: headingColor}}>Kitchen Order Dashboard</h2>}
            {kitchenOrders.length === 0 && <p className={`col-span-full text-center py-10 text-xl`} style={{color: cardText, opacity: 0.7}}>No active orders for the kitchen.</p>}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4`}>
                {kitchenOrders.map(order => (
                    <div key={order.id} className={`p-3 sm:p-4 rounded-lg shadow-2xl flex flex-col h-fit transition-all duration-300 border-2 ${themeSettings.kitchenDisplayScale} ${densityCardClass.replace('p-4','p-3 sm:p-4')} origin-top-left`}
                         style={{
                             backgroundColor: cardBg, 
                             borderColor: order.items.some(i => i.status === 'Pending') && !isOwnerView ? '#DC2626' : (isOwnerView ? 'var(--border-color)' : '#475569')
                         }}>
                        <div className="flex justify-between items-center mb-2 pb-2 border-b" style={{borderColor: isOwnerView ? 'var(--border-color)' : '#475569'}}>
                            <h4 className={`text-lg sm:text-xl font-bold`} style={{color: headingColor}}>
                                {tables.find(t => t.id === order.tableId)?.name || 'Unknown Table'}
                                <span className={`text-xs ml-2`} style={{color: cardText, opacity: 0.7}}>(#{order.id.substring(0, 4)})</span>
                            </h4>
                            <span className={`text-xs sm:text-sm`} style={{color: cardText, opacity: 0.8}}>{getElapsedTime(order.createdAt)}</span>
                        </div>
                         {order.modifiedAt && order.modifiedAt !== order.createdAt && 
                            <p className={`text-xs mb-2 animate-pulse`} style={{color: isOwnerView ? '#F59E0B' : '#FACC15'}}>Order Updated: {getElapsedTime(order.modifiedAt)}</p>}
                        
                        <div className="space-y-2 flex-grow">
                            {order.items.filter(i => i.status !== 'CancelledItem' || (i.originalQuantity && i.originalQuantity > 0)).map(item => ( 
                                <div key={item.menuItemId + item.name + item.status + item.quantity + '-kds-item'}
                                    className={`p-2 my-1 rounded flex justify-between items-start text-sm transition-colors border-l-4 ${densityCardClass.replace('p-4','p-2')}
                                    ${item.status === 'Pending' ? 'border-red-500 bg-red-100' : ''}
                                    ${item.status === 'Preparing' ? 'border-orange-500 bg-orange-100' : ''}
                                    ${item.status === 'Ready' ? 'border-green-500 bg-green-100' : ''}
                                    ${item.status === 'Served' ? 'border-gray-500 bg-gray-200 opacity-80' : ''}
                                    ${item.status === 'CancelledItem' ? 'border-red-400 bg-red-50 line-through opacity-70' : ''}
                                    ${item.status === 'Modified' ? 'border-blue-500 bg-blue-100 animate-pulse' : ''}
                                    ${item.status === 'AcknowledgedModification' ? 'border-indigo-500 bg-indigo-100' : ''}
                                `} style={{
                                    color: (item.status === 'CancelledItem') ? '#7F1D1D' : (isOwnerView ? 'var(--card-text-color)' : '#0F172A') 
                                }}>
                                    <div className="flex-grow">
                                        <p className={`font-semibold`}>
                                            {item.name} <span className="font-bold text-md">x {item.quantity > 0 ? item.quantity : (item.originalQuantity || 0)}</span>
                                        </p>
                                        {item.status === 'Modified' && item.originalQuantity && <p className={`text-xs text-blue-600`}>Was: {item.originalQuantity}</p>}
                                        <p className={`text-xs`}>Status: {item.status}</p>
                                    </div>
                                    {!isOwnerView && item.status !== 'Served' && item.status !== 'CancelledItem' && (
                                        <div className="flex flex-col gap-1 items-end ml-2">
                                            {item.status === 'Pending' && <button onClick={() => updateOrderItemStatus(order.id, item.menuItemId, item.name, 'Preparing', true)} className={`bg-orange-500 hover:bg-orange-600 text-white rounded w-full text-center ${densityButtonClass}`}>Start Prep</button>}
                                            {item.status === 'Preparing' && <button onClick={() => updateOrderItemStatus(order.id, item.menuItemId, item.name,'Ready', true)} className={`bg-green-500 hover:bg-green-600 text-white rounded w-full text-center ${densityButtonClass}`}>Mark Ready</button>}
                                            {item.status === 'Modified' && <button onClick={() => updateOrderItemStatus(order.id, item.menuItemId, item.name,'AcknowledgedModification', true)} className={`bg-indigo-500 hover:bg-indigo-600 text-white rounded w-full text-center ${densityButtonClass}`}>Ack Mod</button>}
                                            {item.status === 'AcknowledgedModification' && <button onClick={() => updateOrderItemStatus(order.id, item.menuItemId, item.name, 'Preparing', true)} className={`bg-orange-500 hover:bg-orange-600 text-white rounded w-full text-center ${densityButtonClass}`}>Start Prep</button>}
                                        </div>
                                    )}
                                     {isOwnerView && (currentUser?.role === 'owner') && <button onClick={() => { setSelectedTable(tables.find(t => t.id === order.tableId) || null); setCurrentOrder({...order}); setIsOrderModalOpen(true); }} className={`text-white rounded hover:opacity-80 ${densityButtonClass}`} style={{backgroundColor: 'var(--primary-color)', opacity: 0.8}}>View/Edit</button>}
                                </div>
                            ))}
                        </div>
                        {order.notes && <p className={`mt-2 text-xs p-1 rounded ${densityCardClass.replace('p-4','p-1')}`} style={{backgroundColor: isOwnerView ? themeSettings.backgroundColor : '#475569', color: isOwnerView ? themeSettings.textColor : '#CBD5E1'}}>Notes: {order.notes}</p>}
                    </div>
                ))}
            </div>
        </div>
    );
};


  const [managementSubView, setManagementSubView] = useState<'Menu' | 'Inventory' | 'SeatingSetup' | 'Reports' | 'KitchenOverview' | 'ActivityLog' | 'ThemeSettings'>('Menu'); 
  const [editingMenuItem, setEditingMenuItem] = useState<Partial<MenuItem> | null>(null);
  const [isMenuItemModalOpen, setIsMenuItemModalOpen] = useState(false);
  const [newMenuCategoryName, setNewMenuCategoryName] = useState('');
  
  const [editingInventoryItem, setEditingInventoryItem] = useState<Partial<InventoryItem> | null>(null);
  const [isInventoryItemModalOpen, setIsInventoryItemModalOpen] = useState(false);
  const [newInventoryCategoryName, setNewInventoryCategoryName] = useState('');
    
  const [reportQuery, setReportQuery] = useState('');

  const handleSaveMenuItem = () => {
    if (!editingMenuItem || !editingMenuItem.name || !editingMenuItem.price) {
        alert("Name and price are required."); return;
    }
    let categoryId = editingMenuItem.category;
    if (editingMenuItem.category === 'add_new_category' && newMenuCategoryName.trim()) {
        const existingCategory = menuCategories.find(cat => cat.name.toLowerCase() === newMenuCategoryName.trim().toLowerCase());
        if (existingCategory) {
            categoryId = existingCategory.id;
        } else {
            const newCat: MenuCategory = { id: generateId(), name: newMenuCategoryName.trim() };
            setMenuCategories(prev => [...prev, newCat]);
            categoryId = newCat.id;
            logActivity('MENU_CATEGORY_ADDED', `New menu category "${newCat.name}" added.`, {category: newCat});
        }
        setNewMenuCategoryName('');
    } else if (!editingMenuItem.category || editingMenuItem.category === 'add_new_category') {
        alert("Please select or add a valid category."); return;
    }

    const isNew = !editingMenuItem.id;
    const fullItem: MenuItem = {
        id: editingMenuItem.id || generateId(), name: editingMenuItem.name, description: editingMenuItem.description || '',
        price: Number(editingMenuItem.price), category: categoryId as string,
        imageUrl: editingMenuItem.imageUrl || `https://picsum.photos/seed/${editingMenuItem.name.replace(/\s+/g, '').toLowerCase()}/300/200`,
        ingredients: editingMenuItem.ingredients || [],
        inStock: editingMenuItem.inStock === undefined ? true : editingMenuItem.inStock,
    };
    setMenuItems(prev => editingMenuItem.id ? prev.map(item => item.id === editingMenuItem.id ? fullItem : item) : [...prev, fullItem]);
    logActivity(isNew ? 'MENU_ITEM_ADDED' : 'MENU_ITEM_UPDATED', `Menu item "${fullItem.name}" was ${isNew ? 'added' : 'updated'}.`, {item: fullItem});
    setIsMenuItemModalOpen(false); setEditingMenuItem(null);
  };

  const handleGenerateDescription = async () => {
    if (!editingMenuItem || !editingMenuItem.name || !editingMenuItem.category || !geminiService.isAIAvailable()) return;
    setIsLoadingAi(true);
    const desc = await geminiService.generateMenuItemDescription(editingMenuItem.name, menuCategories.find(c => c.id === editingMenuItem?.category)?.name || editingMenuItem.category);
    setEditingMenuItem(prev => prev ? {...prev, description: desc} : null);
    logActivity('AI_QUERY', `AI generated description for menu item "${editingMenuItem.name}".`, {itemName: editingMenuItem.name, result: desc.substring(0,100)});
    setIsLoadingAi(false);
  };

  const handleSaveInventoryItem = () => {
    if (!editingInventoryItem || !editingInventoryItem.name || !editingInventoryItem.unit ) { 
        alert("Name and unit are required for inventory item."); return;
    }

    let categoryId = editingInventoryItem.categoryId;
    if (editingInventoryItem.categoryId === 'add_new_category_inv' && newInventoryCategoryName.trim()) {
        const existingCategory = inventoryCategories.find(cat => cat.name.toLowerCase() === newInventoryCategoryName.trim().toLowerCase());
        if (existingCategory) {
            categoryId = existingCategory.id;
        } else {
            const newCat: InventoryCategory = { id: generateId(), name: newInventoryCategoryName.trim() };
            setInventoryCategories(prev => [...prev, newCat]);
            categoryId = newCat.id;
            logActivity('INVENTORY_CATEGORY_ADDED', `New inventory category "${newCat.name}" added.`, {category: newCat});
        }
        setNewInventoryCategoryName('');
    } else if (!editingInventoryItem.categoryId || editingInventoryItem.categoryId === 'add_new_category_inv') {
         alert("Please select or add a valid inventory category."); return;
    }

    const isNew = !editingInventoryItem.id;
    const fullItem: InventoryItem = {
        id: editingInventoryItem.id || generateId(),
        name: editingInventoryItem.name,
        quantity: Number(editingInventoryItem.quantity) || 0,
        unit: editingInventoryItem.unit,
        lowStockThreshold: Number(editingInventoryItem.lowStockThreshold) || 0,
        supplier: editingInventoryItem.supplier || '',
        categoryId: categoryId as string,
    };
    setInventory(prev => editingInventoryItem.id ? prev.map(item => item.id === editingInventoryItem.id ? fullItem : item) : [...prev, fullItem]);
    logActivity(isNew ? 'INVENTORY_ITEM_ADDED' : 'INVENTORY_ITEM_UPDATED', `Inventory item "${fullItem.name}" was ${isNew ? 'added' : 'updated'}. Quantity: ${fullItem.quantity}`, {item: fullItem});
    setIsInventoryItemModalOpen(false); setEditingInventoryItem(null);
  };
  
  const MenuItemManagement: React.FC = () => {
    const densityButtonClass = getDensityPaddingClasses(themeSettings.uiDensity, 'button');
    const densityCardClass = getDensityPaddingClasses(themeSettings.uiDensity, 'card');
    return (
    <div style={{color: 'var(--text-color)'}}>
      <button onClick={() => { setEditingMenuItem({}); setIsMenuItemModalOpen(true); }} className={`mb-4 rounded hover:opacity-80 flex items-center gap-2 ${densityButtonClass}`} style={{backgroundColor: 'var(--primary-color)', color: 'var(--button-text-color)'}}>
        <span className={`${getIconSizeClass(themeSettings.iconSize)}`} dangerouslySetInnerHTML={{__html: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" class="hero-icon"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>`}}></span>
        Add Menu Item
      </button>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {menuItems.map(item => (
          <div key={item.id} className={`rounded shadow ${densityCardClass}`} style={{backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)', borderColor: 'var(--border-color)'}}>
            <img src={item.imageUrl} alt={item.name} className="w-full h-32 object-cover rounded mb-2" />
            <h5 className="font-semibold">{item.name} ({item.price.toFixed(2)})</h5>
            <p className="text-sm truncate" style={{opacity: 0.8}}>{item.description}</p>
            <p className="text-xs" style={{opacity: 0.7}}>Category: {menuCategories.find(c=>c.id === item.category)?.name}</p>
            <p className="text-xs" style={{opacity: 0.7}}>In Stock: {item.inStock ? 'Yes' : 'No'}</p>
            <button onClick={() => { setEditingMenuItem(item); setIsMenuItemModalOpen(true); }} className={`mt-2 text-sm hover:underline ${densityButtonClass.replace(/px-\d+|py-\d+/, 'px-0 py-0').replace('text-sm','text-xs')}`} style={{color: 'var(--primary-color)'}}>Edit</button>
          </div>
        ))}
      </div>
      {isMenuItemModalOpen && editingMenuItem && (
        <Modal isOpen={isMenuItemModalOpen} onClose={() => {setIsMenuItemModalOpen(false); setNewMenuCategoryName('');}} title={editingMenuItem.id ? "Edit Menu Item" : "Add Menu Item"} size="lg">
          <div className={`space-y-4 ${getDensityPaddingClasses(themeSettings.uiDensity, 'modalContent')}`} style={{color: 'var(--card-text-color)'}}>
            <input type="text" placeholder="Name" value={editingMenuItem.name || ''} onChange={e => setEditingMenuItem({...editingMenuItem, name: e.target.value})} className={`w-full p-2 border rounded ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2')}`} style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)'}}/>
            <div className="flex items-center gap-2">
              <textarea placeholder="Description" value={editingMenuItem.description || ''} onChange={e => setEditingMenuItem({...editingMenuItem, description: e.target.value})} className={`w-full p-2 border rounded ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2')}`} rows={3} style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)'}}/>
              {geminiService.isAIAvailable() && <button onClick={handleGenerateDescription} disabled={isLoadingAi || !editingMenuItem.name || !editingMenuItem.category} className={`text-white rounded whitespace-nowrap hover:opacity-80 disabled:opacity-50 ${densityButtonClass}`} style={{backgroundColor: isLoadingAi? '#9CA3AF' : '#A855F7'}}>
                {isLoadingAi ? 'Generating...' : 'AI Desc'}
              </button>}
            </div>
            <input type="number" placeholder="Price" value={editingMenuItem.price || ''} onChange={e => setEditingMenuItem({...editingMenuItem, price: parseFloat(e.target.value)})} className={`w-full p-2 border rounded ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2')}`} style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)'}}/>
            <select value={editingMenuItem.category || ''} onChange={e => setEditingMenuItem({...editingMenuItem, category: e.target.value})} className={`w-full p-2 border rounded ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2')}`} style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)'}}>
              <option value="">Select Menu Category</option>
              {menuCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              <option value="add_new_category">Add New Category...</option>
            </select>
            {editingMenuItem.category === 'add_new_category' && (
                <input type="text" placeholder="New Category Name" value={newMenuCategoryName} onChange={e => setNewMenuCategoryName(e.target.value)} className={`w-full p-2 border rounded mt-2 ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2')}`} style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)'}}/>
            )}
            <input type="text" placeholder="Image URL (Optional)" value={editingMenuItem.imageUrl || ''} onChange={e => setEditingMenuItem({...editingMenuItem, imageUrl: e.target.value})} className={`w-full p-2 border rounded ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2')}`} style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)'}}/>
            <label className="flex items-center gap-2"><input type="checkbox" checked={editingMenuItem.inStock === undefined ? true : editingMenuItem.inStock} onChange={e => setEditingMenuItem({...editingMenuItem, inStock: e.target.checked})} /> In Stock</label>
            <textarea placeholder="Ingredients (comma-separated)" value={editingMenuItem.ingredients?.join(', ') || ''} onChange={e => setEditingMenuItem({...editingMenuItem, ingredients: e.target.value.split(',').map(s => s.trim())})} className={`w-full p-2 border rounded ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2')}`} rows={2} style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)'}}/>
            <div className="flex justify-end gap-2">
                <button onClick={() => {setIsMenuItemModalOpen(false); setNewMenuCategoryName('');}} className={`rounded hover:opacity-80 ${densityButtonClass}`} style={{backgroundColor: '#D1D5DB', color: 'var(--text-color)'}}>Cancel</button>
                <button onClick={handleSaveMenuItem} className={`rounded hover:opacity-80 ${densityButtonClass}`} style={{backgroundColor: 'var(--primary-color)', color: 'var(--button-text-color)'}}>Save</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );};

  const InventoryManagement: React.FC = () => {
    const densityButtonClass = getDensityPaddingClasses(themeSettings.uiDensity, 'button');
    const densityCardClass = getDensityPaddingClasses(themeSettings.uiDensity, 'card');
    return (
    <div style={{color: 'var(--text-color)'}}>
        <button onClick={() => { setEditingInventoryItem({quantity:0, lowStockThreshold:0}); setIsInventoryItemModalOpen(true); }} className={`mb-4 rounded hover:opacity-80 flex items-center gap-2 ${densityButtonClass}`} style={{backgroundColor: 'var(--primary-color)', color: 'var(--button-text-color)'}}>
          <span className={`${getIconSizeClass(themeSettings.iconSize)}`} dangerouslySetInnerHTML={{__html: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" class="hero-icon"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>`}}></span>
          Add Inventory Item
        </button>
        {inventoryCategories.map(category => (
            <div key={category.id} className="mb-6">
                <h4 className="text-xl font-semibold mb-2 border-b pb-1" style={{borderColor: 'var(--border-color)'}}>{category.name}</h4>
                {inventory.filter(item => item.categoryId === category.id).length === 0 ? <p className="text-sm" style={{opacity:0.7}}>No items in this category.</p> :
                <div className="overflow-x-auto">
                    <table className={`min-w-full shadow-sm rounded-md ${densityCardClass}`} style={{backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)'}}>
                        <thead style={{backgroundColor: themeSettings.backgroundColor === '#FFFFFF' ? '#F9FAFB' : themeSettings.backgroundColor, opacity: 0.9}}>
                            <tr>
                                <th className={`py-2 px-3 text-left text-xs font-medium uppercase ${densityButtonClass.replace(/px-\d+|py-\d+/, 'py-2 px-3').replace('text-sm','text-xs')}`} style={{color: 'var(--text-color)'}}>Name</th>
                                <th className={`py-2 px-3 text-left text-xs font-medium uppercase ${densityButtonClass.replace(/px-\d+|py-\d+/, 'py-2 px-3').replace('text-sm','text-xs')}`} style={{color: 'var(--text-color)'}}>Quantity</th>
                                <th className={`py-2 px-3 text-left text-xs font-medium uppercase ${densityButtonClass.replace(/px-\d+|py-\d+/, 'py-2 px-3').replace('text-sm','text-xs')}`} style={{color: 'var(--text-color)'}}>Unit</th>
                                <th className={`py-2 px-3 text-left text-xs font-medium uppercase ${densityButtonClass.replace(/px-\d+|py-\d+/, 'py-2 px-3').replace('text-sm','text-xs')}`} style={{color: 'var(--text-color)'}}>Low At</th>
                                <th className={`py-2 px-3 text-left text-xs font-medium uppercase ${densityButtonClass.replace(/px-\d+|py-\d+/, 'py-2 px-3').replace('text-sm','text-xs')}`} style={{color: 'var(--text-color)'}}>Supplier</th>
                                <th className={`py-2 px-3 text-left text-xs font-medium uppercase ${densityButtonClass.replace(/px-\d+|py-\d+/, 'py-2 px-3').replace('text-sm','text-xs')}`} style={{color: 'var(--text-color)'}}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inventory.filter(item => item.categoryId === category.id).map(item => (
                                <tr key={item.id} className={`border-b hover:opacity-80 ${item.quantity <= item.lowStockThreshold ? 'bg-red-50' : ''}`} style={{borderColor: 'var(--border-color)'}}>
                                    <td className={`py-2 px-3 text-sm ${densityButtonClass.replace(/px-\d+|py-\d+/, 'py-2 px-3')}`}>{item.name}</td>
                                    <td className={`py-2 px-3 text-sm ${densityButtonClass.replace(/px-\d+|py-\d+/, 'py-2 px-3')}`}>{item.quantity}</td>
                                    <td className={`py-2 px-3 text-sm ${densityButtonClass.replace(/px-\d+|py-\d+/, 'py-2 px-3')}`}>{item.unit}</td>
                                    <td className={`py-2 px-3 text-sm ${densityButtonClass.replace(/px-\d+|py-\d+/, 'py-2 px-3')}`}>{item.lowStockThreshold}</td>
                                    <td className={`py-2 px-3 text-sm ${densityButtonClass.replace(/px-\d+|py-\d+/, 'py-2 px-3')}`}>{item.supplier}</td>
                                    <td className={`py-2 px-3 text-sm ${densityButtonClass.replace(/px-\d+|py-\d+/, 'py-2 px-3')}`}><button onClick={() => { setEditingInventoryItem(item); setIsInventoryItemModalOpen(true);}} className="hover:underline" style={{color: 'var(--primary-color)'}}>Edit</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                }
            </div>
        ))}
         {isInventoryItemModalOpen && editingInventoryItem && (
            <Modal isOpen={isInventoryItemModalOpen} onClose={() => {setIsInventoryItemModalOpen(false); setNewInventoryCategoryName('');}} title={editingInventoryItem.id ? "Edit Inventory Item" : "Add Inventory Item"} size="md">
            <div className={`space-y-4 ${getDensityPaddingClasses(themeSettings.uiDensity, 'modalContent')}`} style={{color: 'var(--card-text-color)'}}>
                <input type="text" placeholder="Item Name" value={editingInventoryItem.name || ''} onChange={e => setEditingInventoryItem({...editingInventoryItem, name: e.target.value})} className={`w-full p-2 border rounded ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2')}`} style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)'}}/>
                <select value={editingInventoryItem.categoryId || ''} onChange={e => setEditingInventoryItem({...editingInventoryItem, categoryId: e.target.value})} className={`w-full p-2 border rounded ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2')}`} style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)'}}>
                    <option value="">Select Inventory Category</option>
                    {inventoryCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    <option value="add_new_category_inv">Add New Category...</option>
                </select>
                {editingInventoryItem.categoryId === 'add_new_category_inv' && (
                     <input type="text" placeholder="New Inventory Category Name" value={newInventoryCategoryName} onChange={e => setNewInventoryCategoryName(e.target.value)} className={`w-full p-2 border rounded mt-2 ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2')}`} style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)'}}/>
                )}
                <div className="grid grid-cols-2 gap-4">
                    <input type="number" placeholder="Quantity" value={editingInventoryItem.quantity || ''} onChange={e => setEditingInventoryItem({...editingInventoryItem, quantity: parseInt(e.target.value)})} className={`w-full p-2 border rounded ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2')}`} style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)'}}/>
                    <input type="text" placeholder="Unit (e.g., kg, pcs)" value={editingInventoryItem.unit || ''} onChange={e => setEditingInventoryItem({...editingInventoryItem, unit: e.target.value})} className={`w-full p-2 border rounded ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2')}`} style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)'}}/>
                </div>
                <input type="number" placeholder="Low Stock Threshold" value={editingInventoryItem.lowStockThreshold || ''} onChange={e => setEditingInventoryItem({...editingInventoryItem, lowStockThreshold: parseInt(e.target.value)})} className={`w-full p-2 border rounded ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2')}`} style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)'}}/>
                <input type="text" placeholder="Supplier (Optional)" value={editingInventoryItem.supplier || ''} onChange={e => setEditingInventoryItem({...editingInventoryItem, supplier: e.target.value})} className={`w-full p-2 border rounded ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2')}`} style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)'}}/>
                <div className="flex justify-end gap-2">
                    <button onClick={() => {setIsInventoryItemModalOpen(false); setNewInventoryCategoryName('');}} className={`rounded hover:opacity-80 ${densityButtonClass}`} style={{backgroundColor: '#D1D5DB', color: 'var(--text-color)'}}>Cancel</button>
                    <button onClick={handleSaveInventoryItem} className={`rounded hover:opacity-80 ${densityButtonClass}`} style={{backgroundColor: 'var(--primary-color)', color: 'var(--button-text-color)'}}>Save</button>
                </div>
            </div>
            </Modal>
        )}
    </div>
  );};
  
  const generateSalesReport = (period: ReportPeriod): SalesReportData => {
    const now = new Date();
    let startDate: Date;

    if (period === 'daily') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    } else if (period === 'monthly') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    } else { // yearly
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    }

    const relevantOrders = orders.filter(order => order.status === 'Paid' && order.modifiedAt && order.modifiedAt >= startDate.getTime());
    const totalRevenue = relevantOrders.reduce((sum, order) => sum + order.grandTotal, 0);
    
    const soldItemsMap = new Map<string, { name: string; quantity: number; categoryId: string }>();
    const detailedSoldItems: DetailedSoldItem[] = [];
    const categorySalesMap = new Map<string, { categoryName: string; totalItemsSold: number; totalRevenue: number; }>();

    relevantOrders.forEach(order => {
        order.items.forEach(item => {
            if(item.status === 'Served' || (order.status === 'Paid' && item.status !== 'CancelledItem')) { 
                const existing = soldItemsMap.get(item.menuItemId);
                soldItemsMap.set(item.menuItemId, { 
                    name: item.name, 
                    quantity: (existing?.quantity || 0) + item.quantity,
                    categoryId: item.categoryId
                });

                detailedSoldItems.push({
                    orderId: order.id,
                    orderCreatedAt: order.createdAt,
                    menuItemId: item.menuItemId,
                    name: item.name,
                    quantity: item.quantity,
                    priceAtOrder: item.priceAtOrder,
                    lineTotal: item.priceAtOrder * item.quantity,
                    categoryId: item.categoryId,
                });

                const categoryName = menuCategories.find(mc => mc.id === item.categoryId)?.name || 'Unknown Category';
                
                const currentCategorySale = categorySalesMap.get(item.categoryId) || { categoryName, totalItemsSold: 0, totalRevenue: 0 };
                currentCategorySale.totalItemsSold += item.quantity;
                currentCategorySale.totalRevenue += item.priceAtOrder * item.quantity;
                categorySalesMap.set(item.categoryId, currentCategorySale);
            }
        });
    });

    const topSellingItems = Array.from(soldItemsMap.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5); 

    const categorySales: CategorySalesReport[] = Array.from(categorySalesMap.entries()).map(([categoryId, data]) => ({
        categoryId,
        ...data
    }));

    logActivity('REPORT_GENERATED', `Generated ${period} sales report.`, {period, totalOrders: relevantOrders.length, totalRevenue});
    return {
        period,
        totalOrders: relevantOrders.length,
        totalRevenue,
        topSellingItems,
        detailedSoldItems,
        categorySales,
        orders: relevantOrders 
    };
  };

  const ReportAndAnalytics: React.FC = () => {
    const densityButtonClass = getDensityPaddingClasses(themeSettings.uiDensity, 'button');
    const densityCardClass = getDensityPaddingClasses(themeSettings.uiDensity, 'card');
    
    const handleGenerateReport = (period: ReportPeriod) => {
        setCurrentReport(generateSalesReport(period));
        setAiSuggestion(null); setAiGroundingMetadata(undefined);
    };

    const handleAskAIAboutReport = async () => {
        if (!currentReport || !geminiService.isAIAvailable()) {
            setAiSuggestion("Please generate a report first or check AI configuration.");
            return;
        }
        setIsLoadingAi(true);
        let summaryForAI = `Report for: ${currentReport.period}. Total Orders: ${currentReport.totalOrders}. Total Revenue: ${currentReport.totalRevenue.toFixed(2)}. `;
        summaryForAI += `Top selling items: ${currentReport.topSellingItems.map(i => `${i.name} (Qty: ${i.quantity})`).join(', ') || 'None'}. `;
        
        if (reportQuery) {
            summaryForAI += `Specific query: "${reportQuery}" `;
        }
        const result = await geminiService.analyzeSalesData(summaryForAI);
        setAiSuggestion(result.text);
        setAiGroundingMetadata(result.groundingMetadata);
        logActivity('AI_QUERY', `AI analyzed sales report (${currentReport.period}). Query: "${reportQuery || 'General'}"`, {period: currentReport.period, query: reportQuery, result: result.text.substring(0,100)});
        setIsLoadingAi(false);
    };

    const OperationalOverview: React.FC = () => {
        const activeUnpaidOrders = orders.filter(o => o.status === 'Open' || o.status === 'Modified').sort((a,b) => a.createdAt - b.createdAt);
        const recentlyPaidOrders = orders.filter(o => o.status === 'Paid').sort((a,b) => (b.modifiedAt || 0) - (a.modifiedAt || 0)).slice(0,10);

        return (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h5 className="text-lg font-semibold mb-2" style={{color: 'var(--text-color)'}}>Active Unpaid Orders ({activeUnpaidOrders.length})</h5>
                    {activeUnpaidOrders.length === 0 ? <p className="text-sm" style={{color: 'var(--text-color)', opacity: 0.7}}>No active unpaid orders.</p> : (
                        <div className={`rounded shadow-sm max-h-60 overflow-y-auto ${densityCardClass}`} style={{backgroundColor: 'var(--card-background-color)', borderColor: 'var(--border-color)'}}>
                            {activeUnpaidOrders.map(order => (
                                <div key={order.id} className="text-xs border-b py-1 mb-1" style={{borderColor: 'var(--border-color)', color: 'var(--card-text-color)'}}>
                                    Table: {tables.find(t => t.id === order.tableId)?.name || 'N/A'} - Total: {order.grandTotal.toFixed(2)} 
                                    <span style={{opacity: 0.7}}> ({new Date(order.createdAt).toLocaleTimeString()})</span>
                                    <button onClick={() => { setSelectedTable(tables.find(t => t.id === order.tableId) || null); setCurrentOrder({...order}); setIsOrderModalOpen(true); }} className="ml-2 hover:underline text-xs" style={{color: 'var(--primary-color)'}}>View</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div>
                    <h5 className="text-lg font-semibold mb-2" style={{color: 'var(--text-color)'}}>Recently Paid Orders ({recentlyPaidOrders.length})</h5>
                     {recentlyPaidOrders.length === 0 ? <p className="text-sm" style={{color: 'var(--text-color)', opacity: 0.7}}>No recently paid orders.</p> : (
                        <div className={`rounded shadow-sm max-h-60 overflow-y-auto ${densityCardClass}`} style={{backgroundColor: 'var(--card-background-color)', borderColor: 'var(--border-color)'}}>
                            {recentlyPaidOrders.map(order => (
                                <div key={order.id} className="text-xs border-b py-1 mb-1" style={{borderColor: 'var(--border-color)', color: 'var(--card-text-color)'}}>
                                    Table: {tables.find(t => t.id === order.tableId)?.name || 'N/A'} - Total: {order.grandTotal.toFixed(2)} 
                                    <span style={{opacity: 0.7}}> (Paid: {order.modifiedAt ? new Date(order.modifiedAt).toLocaleTimeString() : 'N/A'})</span>
                                     <button onClick={() => { handleOpenBill(order); }} className="ml-2 hover:underline text-xs" style={{color: '#A855F7'}}>Receipt</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div style={{color: 'var(--text-color)'}}>
            <div className="flex flex-wrap gap-2 mb-4">
                <button onClick={() => handleGenerateReport('daily')} className={`rounded hover:opacity-80 ${densityButtonClass}`} style={{backgroundColor: 'var(--primary-color)', color: 'var(--button-text-color)'}}>Daily Report</button>
                <button onClick={() => handleGenerateReport('monthly')} className={`rounded hover:opacity-80 ${densityButtonClass}`} style={{backgroundColor: 'var(--primary-color)', color: 'var(--button-text-color)'}}>Monthly Report</button>
                <button onClick={() => handleGenerateReport('yearly')} className={`rounded hover:opacity-80 ${densityButtonClass}`} style={{backgroundColor: 'var(--primary-color)', color: 'var(--button-text-color)'}}>Yearly Report</button>
            </div>

            {currentReport && (
                <div className={`rounded shadow mb-4 ${densityCardClass}`} style={{backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)'}}>
                    <h4 className="text-lg font-semibold capitalize">{currentReport.period} Sales Report</h4>
                    <p className="text-sm" style={{opacity: 0.8}}>Total Orders: {currentReport.totalOrders}</p>
                    <p className="text-sm" style={{opacity: 0.8}}>Total Revenue: {currentReport.totalRevenue.toFixed(2)}</p>
                    
                    <h5 className="font-semibold mt-3 mb-1">Top Selling Items:</h5>
                    {currentReport.topSellingItems.length > 0 ? (
                        <ul className="list-disc list-inside text-sm" style={{opacity: 0.8}}>
                            {currentReport.topSellingItems.map(item => <li key={item.name}>{item.name} (Qty: {item.quantity})</li>)}
                        </ul>
                    ) : <p className="text-sm" style={{opacity: 0.7}}>No sales data for top items in this period.</p>}

                    <h5 className="font-semibold mt-3 mb-1">Sales by Category:</h5>
                     {currentReport.categorySales.length > 0 ? (
                        <div className="overflow-x-auto text-sm mt-1">
                            <table className="min-w-full">
                                <thead style={{backgroundColor: themeSettings.backgroundColor, opacity: 0.9}}><tr><th className="px-2 py-1 text-left">Category</th><th className="px-2 py-1 text-right">Items Sold</th><th className="px-2 py-1 text-right">Revenue</th></tr></thead>
                                <tbody>
                                {currentReport.categorySales.map(cs => (
                                    <tr key={cs.categoryId} className="border-b" style={{borderColor: 'var(--border-color)'}}><td className="px-2 py-1">{cs.categoryName}</td><td className="px-2 py-1 text-right">{cs.totalItemsSold}</td><td className="px-2 py-1 text-right">{cs.totalRevenue.toFixed(2)}</td></tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    ) : <p className="text-sm" style={{opacity: 0.7}}>No category sales data for this period.</p>}

                    <h5 className="font-semibold mt-3 mb-1">Detailed Item Sales Log ({currentReport.detailedSoldItems.length} items):</h5>
                    {currentReport.detailedSoldItems.length > 0 ? (
                        <div className={`max-h-60 overflow-y-auto text-xs border rounded p-2 mt-1 ${densityCardClass.replace('p-','p-2')}`} style={{borderColor: 'var(--border-color)'}}>
                            <table className="min-w-full">
                                <thead style={{backgroundColor: themeSettings.backgroundColor, opacity: 0.9}}><tr>
                                    <th className="px-1 py-1 text-left">Order ID</th><th className="px-1 py-1 text-left">Time</th><th className="px-1 py-1 text-left">Item</th>
                                    <th className="px-1 py-1 text-right">Qty</th><th className="px-1 py-1 text-right">Price</th><th className="px-1 py-1 text-right">Total</th>
                                    <th className="px-1 py-1 text-left">Category</th>
                                </tr></thead>
                                <tbody>
                                {currentReport.detailedSoldItems.map((item,idx) => (
                                    <tr key={item.orderId + item.menuItemId + idx} className="border-b" style={{borderColor: 'var(--border-color)'}}>
                                        <td className="px-1 py-1">{item.orderId.substring(0,5)}</td>
                                        <td className="px-1 py-1">{new Date(item.orderCreatedAt).toLocaleTimeString()}</td>
                                        <td className="px-1 py-1">{item.name}</td>
                                        <td className="px-1 py-1 text-right">{item.quantity}</td>
                                        <td className="px-1 py-1 text-right">{item.priceAtOrder.toFixed(2)}</td>
                                        <td className="px-1 py-1 text-right">{item.lineTotal.toFixed(2)}</td>
                                        <td className="px-1 py-1">{menuCategories.find(mc=>mc.id === item.categoryId)?.name || 'N/A'}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    ) : <p className="text-sm" style={{opacity: 0.7}}>No detailed item sales logged for this period.</p>}
                    
                    <div className="mt-4">
                        <input type="text" value={reportQuery} onChange={e => setReportQuery(e.target.value)} placeholder="Ask AI about this report (e.g., 'suggest promotions')" className={`w-full p-2 border rounded mb-2 text-sm ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2')}`} style={{borderColor: 'var(--border-color)', color: 'var(--text-color)', backgroundColor: 'var(--card-background-color)'}}/>
                        <button onClick={handleAskAIAboutReport} className={`rounded text-sm hover:opacity-80 disabled:opacity-50 ${densityButtonClass}`} style={{backgroundColor: isLoadingAi ? '#9CA3AF' : '#A855F7', color: 'var(--button-text-color)'}} disabled={isLoadingAi || !geminiService.isAIAvailable() || !currentReport}>
                            {isLoadingAi ? 'AI Analyzing...' : 'Ask AI for Insights'}
                        </button>
                    </div>
                </div>
            )}
             {aiSuggestion && currentReport && (
                <div className={`my-4 border rounded-md ${densityCardClass}`} style={{backgroundColor: '#E0E7FF', borderColor: '#C7D2FE', color: '#4338CA'}}> {/* Indigo-light theme for AI box */}
                    <h5 className="font-semibold">AI Sales Analysis:</h5>
                    <p className="text-sm whitespace-pre-wrap">{aiSuggestion}</p>
                    {aiGroundingMetadata?.groundingChunks && aiGroundingMetadata.groundingChunks.length > 0 && (
                      <div className="mt-2 text-xs">
                        <p className="font-semibold">Sources:</p>
                        {aiGroundingMetadata.groundingChunks.map((chunk: GroundingChunk, index: number) => (
                          chunk.web?.uri && <a key={index} href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="hover:underline block" style={{color: '#6D28D9'}}>{chunk.web.title || chunk.web.uri}</a>
                        ))}
                      </div>
                    )}
                </div>
            )}
            <OperationalOverview />
        </div>
    );
  };
  
  const ActivityLogView: React.FC = () => {
    const densityCardClass = getDensityPaddingClasses(themeSettings.uiDensity, 'card');
    return (
        <div className={`rounded shadow ${densityCardClass}`} style={{backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)'}}>
            <h4 className="text-xl font-semibold mb-4">System Activity Log</h4>
            {activityLog.length === 0 ? <p style={{opacity:0.7}}>No activity logged yet.</p> : (
                <div className="max-h-[70vh] overflow-y-auto">
                    {activityLog.map(entry => (
                        <div key={entry.id} className="mb-3 pb-3 border-b text-sm" style={{borderColor: 'var(--border-color)'}}>
                            <p className="font-semibold">{entry.actionType.replace(/_/g, ' ')}
                                <span className="text-xs ml-2" style={{opacity:0.7}}>({new Date(entry.timestamp).toLocaleString()})</span>
                            </p>
                            <p style={{opacity:0.9}}>{entry.description}</p>
                            {entry.user && <p className="text-xs" style={{opacity:0.7}}>User: {entry.user.name} ({entry.user.role})</p>}
                            {entry.details && typeof entry.details === 'object' && (
                                <details className="mt-1 text-xs">
                                    <summary className="cursor-pointer hover:opacity-80" style={{opacity:0.7}}>Details</summary>
                                    <pre className={`p-2 rounded mt-1 overflow-x-auto text-xs ${densityCardClass.replace('p-','p-2')}`} style={{backgroundColor: themeSettings.backgroundColor, opacity: 0.9}}>{JSON.stringify(entry.details, null, 2)}</pre>
                                </details>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
  };

  const SeatingSetupManagement: React.FC = () => {
    const densityButtonClass = getDensityPaddingClasses(themeSettings.uiDensity, 'button');
    const densityCardClass = getDensityPaddingClasses(themeSettings.uiDensity, 'card');
    return (
        <div className={`rounded shadow ${densityCardClass}`} style={{backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)'}}>
            <h4 className="text-xl font-semibold mb-4">Manage Seating Areas</h4>
            <button 
                onClick={() => { setEditingTableConfig({ status: TableStatus.Available, capacity: 2 }); setIsTableEditModalOpen(true); }}
                className={`mb-6 rounded hover:opacity-80 flex items-center gap-2 ${densityButtonClass}`}
                style={{backgroundColor: 'var(--primary-color)', color: 'var(--button-text-color)'}}
            >
                <span className={`${getIconSizeClass(themeSettings.iconSize)}`} dangerouslySetInnerHTML={{__html: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" class="hero-icon"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>`}}></span>
                Add New Seating Area
            </button>

            {tables.length === 0 ? <p style={{opacity:0.7}}>No seating areas defined yet.</p> : (
                <div className="overflow-x-auto">
                    <table className="min-w-full" style={{backgroundColor: 'var(--card-background-color)'}}>
                        <thead style={{backgroundColor: themeSettings.backgroundColor, opacity: 0.9}}>
                            <tr>
                                <th className={`py-2 px-4 text-left text-xs font-medium uppercase ${densityButtonClass.replace(/px-\d+|py-\d+/, 'py-2 px-4').replace('text-sm','text-xs')}`} style={{color: 'var(--text-color)'}}>Name</th>
                                <th className={`py-2 px-4 text-left text-xs font-medium uppercase ${densityButtonClass.replace(/px-\d+|py-\d+/, 'py-2 px-4').replace('text-sm','text-xs')}`} style={{color: 'var(--text-color)'}}>Capacity</th>
                                <th className={`py-2 px-4 text-left text-xs font-medium uppercase ${densityButtonClass.replace(/px-\d+|py-\d+/, 'py-2 px-4').replace('text-sm','text-xs')}`} style={{color: 'var(--text-color)'}}>Current Status</th>
                                <th className={`py-2 px-4 text-left text-xs font-medium uppercase ${densityButtonClass.replace(/px-\d+|py-\d+/, 'py-2 px-4').replace('text-sm','text-xs')}`} style={{color: 'var(--text-color)'}}>Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{borderColor: 'var(--border-color)'}}>
                            {tables.map(table => (
                                <tr key={table.id}>
                                    <td className={`py-3 px-4 text-sm ${densityButtonClass.replace(/px-\d+|py-\d+/, 'py-3 px-4')}`}>{table.name}</td>
                                    <td className={`py-3 px-4 text-sm ${densityButtonClass.replace(/px-\d+|py-\d+/, 'py-3 px-4')}`}>{table.capacity}</td>
                                    <td className={`py-3 px-4 text-sm ${densityButtonClass.replace(/px-\d+|py-\d+/, 'py-3 px-4')}`}>
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full
                                            ${table.status === TableStatus.Available ? 'bg-green-100 text-green-700' : ''}
                                            ${table.status === TableStatus.Occupied ? 'bg-red-100 text-red-700' : ''}
                                            ${table.status === TableStatus.Reserved ? 'bg-yellow-100 text-yellow-700' : ''}
                                            ${table.status === TableStatus.Dirty ? 'bg-orange-100 text-orange-700' : ''}
                                            ${table.status === TableStatus.Cleaning ? 'bg-blue-100 text-blue-700' : ''}
                                        `}>
                                            {table.status}
                                        </span>
                                    </td>
                                    <td className={`py-3 px-4 text-sm ${densityButtonClass.replace(/px-\d+|py-\d+/, 'py-3 px-4')}`}>
                                        <button 
                                            onClick={() => { setEditingTableConfig({...table}); setIsTableEditModalOpen(true); }}
                                            className="font-medium hover:underline"
                                            style={{color: 'var(--primary-color)'}}
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
  };

  const TableEditModalContent: React.FC = () => {
    if (!editingTableConfig) return null;
    const densityButtonClass = getDensityPaddingClasses(themeSettings.uiDensity, 'button');
    const densityModalContentClass = getDensityPaddingClasses(themeSettings.uiDensity, 'modalContent');

    return (
        <div className={`space-y-4 ${densityModalContentClass}`} style={{color: 'var(--card-text-color)'}}>
            <div>
                <label htmlFor="tableName" className="block text-sm font-medium">Seating Area Name</label>
                <input 
                    type="text" 
                    id="tableName"
                    placeholder="e.g., Table 5, Bar Seat 3" 
                    value={editingTableConfig.name || ''} 
                    onChange={e => setEditingTableConfig({...editingTableConfig, name: e.target.value})} 
                    className={`mt-1 w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2')}`} 
                    style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)'}}
                />
            </div>
            <div>
                <label htmlFor="tableCapacity" className="block text-sm font-medium">Capacity</label>
                <input 
                    type="number" 
                    id="tableCapacity"
                    placeholder="Number of guests" 
                    value={editingTableConfig.capacity || ''} 
                    min="1"
                    onChange={e => setEditingTableConfig({...editingTableConfig, capacity: parseInt(e.target.value) || 1})} 
                    className={`mt-1 w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2')}`} 
                    style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)'}}
                />
            </div>
             {editingTableConfig.id && (
                <div>
                    <label htmlFor="tableStatusEdit" className="block text-sm font-medium">Status</label>
                    <select 
                        id="tableStatusEdit"
                        value={editingTableConfig.status || TableStatus.Available}
                        onChange={e => setEditingTableConfig({...editingTableConfig, status: e.target.value as TableStatus})}
                        className={`mt-1 w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2')}`}
                        style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)'}}
                    >
                        {Object.values(TableStatus).map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                     <p className="text-xs mt-1" style={{opacity:0.7}}>Note: Status changes here are for configuration. For operational status changes (Occupied, Cleaning etc.), use the main POS view.</p>
                </div>
            )}
            <div className="flex justify-end gap-3 pt-3">
                <button 
                    onClick={() => { setIsTableEditModalOpen(false); setEditingTableConfig(null);}} 
                    className={`rounded-md hover:opacity-80 ${densityButtonClass}`}
                    style={{backgroundColor: '#D1D5DB', color: 'var(--text-color)'}}
                >
                    Cancel
                </button>
                <button 
                    onClick={handleSaveTableConfig} 
                    className={`rounded-md hover:opacity-80 ${densityButtonClass}`}
                    style={{backgroundColor: 'var(--primary-color)', color: 'var(--button-text-color)'}}
                >
                    Save Seating Area
                </button>
            </div>
        </div>
    );
  };

  const ThemeCustomizationView: React.FC = () => {
    const [currentTheme, setCurrentTheme] = useState<ThemeSettings>(themeSettings);
    const densityButtonClass = getDensityPaddingClasses(themeSettings.uiDensity, 'button');
    const densityCardClass = getDensityPaddingClasses(themeSettings.uiDensity, 'card');

    const handleThemeChange = (field: keyof ThemeSettings, value: string) => {
        setCurrentTheme(prev => ({...prev, [field]: value}));
    };

    const handleSaveTheme = () => {
        const oldTheme = {...themeSettings}; 
        setThemeSettings(currentTheme);
        logActivity('THEME_UPDATED', 'App theme settings were updated.', {newSettings: currentTheme, oldSettings: oldTheme});
        
        if (currentTheme.iconSize !== oldTheme.iconSize) logActivity('ICON_SIZE_UPDATED', `Icon size changed to ${currentTheme.iconSize}`, {newValue: currentTheme.iconSize, oldValue: oldTheme.iconSize});
        if (currentTheme.kitchenDisplayScale !== oldTheme.kitchenDisplayScale) logActivity('KITCHEN_SCALE_UPDATED', `Kitchen display scale changed to ${currentTheme.kitchenDisplayScale}`, {newValue: currentTheme.kitchenDisplayScale, oldValue: oldTheme.kitchenDisplayScale});
        if (currentTheme.uiDensity !== oldTheme.uiDensity) logActivity('UI_DENSITY_UPDATED', `UI density changed to ${currentTheme.uiDensity}`, {newValue: currentTheme.uiDensity, oldValue: oldTheme.uiDensity});
        if (currentTheme.contentScale !== oldTheme.contentScale) logActivity('CONTENT_SCALE_UPDATED', `Content view scale changed to ${currentTheme.contentScale}`, {newValue: currentTheme.contentScale, oldValue: oldTheme.contentScale});
        if (currentTheme.globalPageScale !== oldTheme.globalPageScale) logActivity('GLOBAL_PAGE_SCALE_UPDATED', `Global page scale changed to ${currentTheme.globalPageScale}`, {newValue: currentTheme.globalPageScale, oldValue: oldTheme.globalPageScale});
        
        alert('Theme settings saved! Changes will be applied globally.');
    };
    
    const inputStyle = {borderColor: 'var(--border-color)', backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)'};
    const labelStyle = {color: 'var(--text-color)', opacity: 0.9};

    return (
        <div className={`rounded shadow ${densityCardClass}`} style={{backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)'}}>
            <h4 className="text-xl font-semibold mb-6">Customize App Theme</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Color Pickers */}
                {(Object.keys(currentTheme) as Array<keyof ThemeSettings>)
                    .filter(key => key.toLowerCase().includes('color'))
                    .map(key => (
                    <div key={key}>
                        <label htmlFor={key} className="block text-sm font-medium capitalize" style={labelStyle}>{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                        <input type="color" id={key} value={currentTheme[key]} onChange={e => handleThemeChange(key, e.target.value)} 
                               className={`mt-1 w-full h-10 p-1 border rounded-md ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-1 h-10')}`} style={{...inputStyle, appearance: 'none'} as React.CSSProperties}/>
                    </div>
                ))}
                {/* Font Size Select */}
                <div>
                    <label htmlFor="fontSizeBase" className="block text-sm font-medium" style={labelStyle}>Base Font Size</label>
                    <select id="fontSizeBase" value={currentTheme.fontSizeBase} onChange={e => handleThemeChange('fontSizeBase', e.target.value)}
                            className={`mt-1 w-full p-2.5 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2.5')}`} style={inputStyle}>
                        <option value="text-xs">Extra Small</option>
                        <option value="text-sm">Small</option>
                        <option value="text-base">Medium (Default)</option>
                        <option value="text-lg">Large</option>
                    </select>
                </div>
                {/* Font Family Select */}
                <div>
                    <label htmlFor="fontFamily" className="block text-sm font-medium" style={labelStyle}>Font Family</label>
                    <select id="fontFamily" value={currentTheme.fontFamily} onChange={e => handleThemeChange('fontFamily', e.target.value)}
                            className={`mt-1 w-full p-2.5 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2.5')}`} style={inputStyle}>
                        <option value="sans-serif">Sans-serif (Default)</option>
                        <option value="serif">Serif</option>
                        <option value="monospace">Monospace</option>
                        <option value="Arial, sans-serif">Arial</option>
                        <option value="'Times New Roman', Times, serif">Times New Roman</option>
                        <option value="'Courier New', Courier, monospace">Courier New</option>
                    </select>
                </div>
                 {/* Icon Size Select */}
                <div>
                    <label htmlFor="iconSize" className="block text-sm font-medium" style={labelStyle}>Icon Size</label>
                    <select id="iconSize" value={currentTheme.iconSize} onChange={e => handleThemeChange('iconSize', e.target.value)}
                            className={`mt-1 w-full p-2.5 border rounded-md shadow-sm ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2.5')}`} style={inputStyle}>
                        <option value="icon-sm">Small Icons</option>
                        <option value="icon-md">Medium Icons (Default)</option>
                        <option value="icon-lg">Large Icons</option>
                    </select>
                </div>
                {/* Kitchen Display Scale Select */}
                <div>
                    <label htmlFor="kitchenDisplayScale" className="block text-sm font-medium" style={labelStyle}>Kitchen Display Scale</label>
                    <select id="kitchenDisplayScale" value={currentTheme.kitchenDisplayScale} onChange={e => handleThemeChange('kitchenDisplayScale', e.target.value)}
                            className={`mt-1 w-full p-2.5 border rounded-md shadow-sm ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2.5')}`} style={inputStyle}>
                        <option value="scale-75">75%</option>
                        <option value="scale-90">90%</option>
                        <option value="scale-100">100% (Default)</option>
                        <option value="scale-110">110%</option>
                        <option value="scale-125">125%</option>
                    </select>
                </div>
                {/* UI Density Select */}
                <div>
                    <label htmlFor="uiDensity" className="block text-sm font-medium" style={labelStyle}>UI Density (Padding)</label>
                    <select id="uiDensity" value={currentTheme.uiDensity} onChange={e => handleThemeChange('uiDensity', e.target.value)}
                            className={`mt-1 w-full p-2.5 border rounded-md shadow-sm ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2.5')}`} style={inputStyle}>
                        <option value="compact">Compact</option>
                        <option value="normal">Normal (Default)</option>
                        <option value="spacious">Spacious</option>
                    </select>
                </div>
                {/* Content View Scale Select */}
                 <div>
                    <label htmlFor="contentScale" className="block text-sm font-medium" style={labelStyle}>Content View Scale</label>
                    <select id="contentScale" value={currentTheme.contentScale} onChange={e => handleThemeChange('contentScale', e.target.value)}
                            className={`mt-1 w-full p-2.5 border rounded-md shadow-sm ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2.5')}`} style={inputStyle}>
                        <option value="scale-75">75% (Smallest)</option>
                        <option value="scale-90">90% (Smaller)</option>
                        <option value="scale-100">100% (Default)</option>
                        <option value="scale-110">110% (Larger)</option>
                        <option value="scale-125">125% (Largest)</option>
                    </select>
                </div>
                 {/* Global Page Scale Select */}
                <div>
                    <label htmlFor="globalPageScale" className="block text-sm font-medium" style={labelStyle}>Global Page Scale</label>
                    <select id="globalPageScale" value={currentTheme.globalPageScale} onChange={e => handleThemeChange('globalPageScale', e.target.value as ThemeSettings['globalPageScale'])}
                            className={`mt-1 w-full p-2.5 border rounded-md shadow-sm ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2.5')}`} style={inputStyle}>
                        <option value="scale-75">75%</option>
                        <option value="scale-90">90%</option>
                        <option value="scale-100">100% (Default)</option>
                        <option value="scale-110">110%</option>
                        <option value="scale-125">125%</option>
                    </select>
                </div>
            </div>
            <div className="mt-8 flex justify-end">
                <button onClick={handleSaveTheme} className={`rounded-md hover:opacity-80 ${densityButtonClass}`} style={{backgroundColor: 'var(--primary-color)', color: 'var(--button-text-color)'}}>
                    Save Theme
                </button>
            </div>
        </div>
    );
  };


  const ManagementView: React.FC = () => {
    const navDensityClass = getDensityPaddingClasses(themeSettings.uiDensity, 'navButton');
    const navItems = [
        { name: 'Menu', icon: MENU_ICON_SVG, view: 'Menu' as typeof managementSubView },
        { name: 'Inventory', icon: INVENTORY_ICON_SVG, view: 'Inventory' as typeof managementSubView },
        { name: 'Seating Setup', icon: SEATING_CONFIG_ICON_SVG, view: 'SeatingSetup' as typeof managementSubView },
        { name: 'Theme Settings', icon: THEME_SETTINGS_ICON_SVG, view: 'ThemeSettings' as typeof managementSubView },
        { name: 'Reports & Analytics', icon: REPORTS_ICON_SVG, view: 'Reports' as typeof managementSubView },
        { name: 'Kitchen Overview', icon: KITCHEN_DASHBOARD_ICON_SVG, view: 'KitchenOverview' as typeof managementSubView },
        { name: 'Activity Log', icon: ACTIVITY_LOG_ICON_SVG, view: 'ActivityLog' as typeof managementSubView },
    ];
    return (
        <div className={`${getDensityPaddingClasses(themeSettings.uiDensity, 'card')}`} style={{color: 'var(--text-color)'}}>
            <h3 className="text-2xl font-bold mb-6">Management Dashboard</h3>
            <div className="flex flex-wrap border-b mb-6" style={{borderColor: 'var(--border-color)'}}>
                {navItems.map(item => (
                    <button key={item.view} onClick={() => setManagementSubView(item.view)}
                        className={`flex items-center gap-2 font-medium transition-colors ${navDensityClass}
                        ${managementSubView === item.view ? 'border-b-2' : 'hover:opacity-80'}`}
                        style={{
                            borderColor: managementSubView === item.view ? 'var(--primary-color)' : 'transparent',
                            color: managementSubView === item.view ? 'var(--primary-color)' : 'var(--text-color)',
                            opacity: managementSubView === item.view ? 1 : 0.7,
                        }}>
                        <span className={`${getIconSizeClass(themeSettings.iconSize)}`} dangerouslySetInnerHTML={{__html: item.icon}}></span> {item.name}
                    </button>
                ))}
            </div>
            {managementSubView === 'Menu' && <MenuItemManagement />}
            {managementSubView === 'Inventory' && <InventoryManagement />}
            {managementSubView === 'SeatingSetup' && <SeatingSetupManagement />}
            {managementSubView === 'ThemeSettings' && <ThemeCustomizationView />}
            {managementSubView === 'Reports' && <ReportAndAnalytics />}
            {managementSubView === 'KitchenOverview' && <KitchenDashboardView isOwnerView={true} />}
            {managementSubView === 'ActivityLog' && <ActivityLogView />}
        </div>
    );
  };
  

  const MainLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
    const densityNavButtonClass = getDensityPaddingClasses(themeSettings.uiDensity, 'navButton');
    return (
    <div className="flex flex-col min-h-screen">
      <header className={`p-4 shadow-md flex justify-between items-center ${getDensityPaddingClasses(themeSettings.uiDensity, 'card')}`} style={{backgroundColor: 'var(--header-background-color)', color: 'var(--header-text-color)'}}>
        <h1 className="text-2xl font-bold">{APP_NAME}</h1>
        {currentUser && (
            <div className="flex items-center gap-4">
                 <span className="text-sm">Welcome, {currentUser.name} ({currentUser.role})</span>
                 <button onClick={handleLogout} className={`rounded text-sm flex items-center gap-1 hover:opacity-80 ${getDensityPaddingClasses(themeSettings.uiDensity, 'button')}`} style={{backgroundColor: '#DC2626', color: 'var(--button-text-color)'}}> 
                    <span className={`${getIconSizeClass(themeSettings.iconSize)}`} dangerouslySetInnerHTML={{__html: LOGOUT_ICON_SVG}}></span> Logout
                </button>
            </div>
        )}
      </header>
      
      {currentUser && currentUser.role !== 'kitchen' && (
         <nav className="shadow-sm flex justify-center sticky top-0 z-40" style={{backgroundColor: 'var(--card-background-color)', borderBottom: `1px solid var(--border-color)`}}>
            {[
                { view: 'POS' as AppView, label: 'Point of Sale', icon: POS_ICON_SVG },
                { view: 'KDS' as AppView, label: 'Kitchen Display', icon: KDS_ICON_SVG },
                ...(currentUser.role === 'owner' ? [{ view: 'Management' as AppView, label: 'Management', icon: MANAGEMENT_ICON_SVG }] : [])
            ].map(navItem => (
                <button 
                    key={navItem.view} 
                    onClick={() => setCurrentView(navItem.view)}
                    className={`font-medium flex items-center gap-2 transition-colors ${densityNavButtonClass}
                        ${currentView === navItem.view ? 'border-b-2' : 'hover:opacity-80'}`}
                    style={{
                        borderColor: currentView === navItem.view ? 'var(--primary-color)' : 'transparent',
                        color: currentView === navItem.view ? 'var(--primary-color)' : 'var(--text-color)',
                        opacity: currentView !== navItem.view ? 0.7 : 1,
                    }}
                >
                    <span className={`${getIconSizeClass(themeSettings.iconSize)}`} dangerouslySetInnerHTML={{__html: navItem.icon}}></span> {navItem.label}
                </button>
            ))}
        </nav>
      )}

      <main className="flex-grow"> 
        <div className={`${themeSettings.globalPageScale} transform-origin-top`} style={{ transformOrigin: 'top' }}>
          {children}
        </div>
      </main>

      <footer className={`text-center p-3 text-xs ${getDensityPaddingClasses(themeSettings.uiDensity, 'card').replace('p-4','p-3')}`} style={{backgroundColor: 'var(--header-background-color)', color: 'var(--header-text-color)', opacity: 0.8}}>
        &copy; {new Date().getFullYear()} {APP_NAME}. For demonstration purposes only.
      </footer>
    </div>
  )};

  const renderView = () => {
    if (!currentUser) return <LoginView />;

    switch(currentView) {
      case 'POS': return <TableView />;
      case 'KDS': return <KDSView />;
      case 'Management': return currentUser.role === 'owner' ? <ManagementView /> : <p className="p-4 text-red-500">Access Denied.</p>;
      case 'KitchenDashboard': return currentUser.role === 'kitchen' ? <KitchenDashboardView /> : <p className="p-4 text-red-500">Access Denied. This view is for Kitchen Staff.</p>;
      default: return <LoginView />;
    }
  };

  return (
    <>
      <MainLayout>
        {renderView()}
      </MainLayout>

      {isOrderModalOpen && (
        <Modal isOpen={isOrderModalOpen} onClose={() => {setIsOrderModalOpen(false); setSelectedTable(null); setCurrentOrder(null);}} title={`Order for ${selectedTable?.name || 'Table'}`} size="xl">
          <OrderModalContent />
        </Modal>
      )}
      {isBillModalOpen && currentBill && (
        <Modal isOpen={isBillModalOpen} onClose={() => {setIsBillModalOpen(false); setCurrentBill(null);}} title={currentBill.paidAt ? "Receipt" : "Bill"} size="md">
          <BillModalContent />
        </Modal>
      )}
      {isTableStatusModalOpen && editingTableForStatus && (
        <Modal isOpen={isTableStatusModalOpen} onClose={() => {setIsTableStatusModalOpen(false); setEditingTableForStatus(null);}} title={`Manage Table: ${editingTableForStatus.name}`} size="sm">
            <TableStatusModalContent/>
        </Modal>
      )}
      {isTableEditModalOpen && editingTableConfig && (
        <Modal 
            isOpen={isTableEditModalOpen} 
            onClose={() => { setIsTableEditModalOpen(false); setEditingTableConfig(null);}} 
            title={editingTableConfig.id ? "Edit Seating Area" : "Add New Seating Area"} 
            size="md"
        >
            <TableEditModalContent />
        </Modal>
      )}
    </>
  );
};

export default App;
