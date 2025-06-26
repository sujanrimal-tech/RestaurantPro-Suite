import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { TableStatus } from './types.js';
import { INITIAL_TABLES, INITIAL_MENU_ITEMS, INITIAL_INVENTORY, INITIAL_ORDERS, INITIAL_CATEGORIES, INITIAL_INVENTORY_CATEGORIES, INITIAL_THEME_SETTINGS, APP_NAME, TAX_RATE, generateId, POS_ICON_SVG, KDS_ICON_SVG, MANAGEMENT_ICON_SVG, TABLE_ICON_SVG, MENU_ICON_SVG, INVENTORY_ICON_SVG, REPORTS_ICON_SVG, LOGIN_ICON_SVG, LOGOUT_ICON_SVG, CLEANING_ICON_SVG, TABLE_SETTINGS_ICON_SVG, KITCHEN_LOGIN_ICON_SVG, KITCHEN_DASHBOARD_ICON_SVG, ACTIVITY_LOG_ICON_SVG, SEATING_CONFIG_ICON_SVG, THEME_SETTINGS_ICON_SVG } from './constants.js';
import * as geminiService from './services/geminiService.js';
import Modal from './components/common/Modal.js';
// Custom hook for localStorage
const useLocalStorage = (key, initialValue) => {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        }
        catch (caughtErrorInit) {
            console.error(caughtErrorInit);
            return initialValue;
        }
    });
    const setValue = (value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
        catch (caughtErrorSetValue) {
            console.error(caughtErrorSetValue);
        }
    };
    return [storedValue, setValue];
};
// Helper function to get Tailwind class for icon size
const getIconSizeClass = (size) => {
    switch (size) {
        case 'icon-sm': return 'text-sm'; // Smaller
        case 'icon-md': return 'text-base'; // Default
        case 'icon-lg': return 'text-xl'; // Larger
        default: return 'text-base';
    }
};
// Helper function to get Tailwind padding classes based on UI density
const getDensityPaddingClasses = (density, elementType) => {
    switch (elementType) {
        case 'button':
            if (density === 'compact')
                return 'px-2 py-1 text-xs';
            if (density === 'spacious')
                return 'px-6 py-3.5 text-lg'; // Increased py
            return 'px-4 py-2 text-sm'; // normal
        case 'navButton': // For main navigation buttons
            if (density === 'compact')
                return 'px-3 py-2 text-xs';
            if (density === 'spacious')
                return 'px-6 py-4 text-base'; // Increased px
            return 'px-4 py-3 text-sm'; // normal
        case 'card':
        case 'modalContent': // Using same logic for card and modal content padding
            if (density === 'compact')
                return 'p-2';
            if (density === 'spacious')
                return 'p-6';
            return 'p-4'; // normal
        default:
            return 'p-4'; // fallback
    }
};
// Main App Component
const App = () => {
    const [currentUser, setCurrentUser] = useLocalStorage('currentUser', null);
    const [currentView, setCurrentView] = useState(currentUser ? (currentUser.role === 'kitchen' ? 'KitchenDashboard' : 'POS') : 'Login');
    const [tables, setTables] = useLocalStorage('restaurant_tables', INITIAL_TABLES);
    const [menuItems, setMenuItems] = useLocalStorage('restaurant_menuItems', INITIAL_MENU_ITEMS);
    const [menuCategories, setMenuCategories] = useLocalStorage('restaurant_menuCategories', INITIAL_CATEGORIES);
    const [inventoryCategories, setInventoryCategories] = useLocalStorage('restaurant_inventoryCategories', INITIAL_INVENTORY_CATEGORIES);
    const [orders, setOrders] = useLocalStorage('restaurant_orders', INITIAL_ORDERS);
    const [inventory, setInventory] = useLocalStorage('restaurant_inventory', INITIAL_INVENTORY);
    const [activityLog, setActivityLog] = useLocalStorage('restaurant_activityLog', []);
    const [themeSettings, setThemeSettings] = useLocalStorage('restaurant_themeSettings', INITIAL_THEME_SETTINGS);
    const [selectedTable, setSelectedTable] = useState(null);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isBillModalOpen, setIsBillModalOpen] = useState(false);
    const [isTableStatusModalOpen, setIsTableStatusModalOpen] = useState(false);
    const [editingTableForStatus, setEditingTableForStatus] = useState(null);
    const [isTableEditModalOpen, setIsTableEditModalOpen] = useState(false);
    const [editingTableConfig, setEditingTableConfig] = useState(null);
    const [currentOrder, setCurrentOrder] = useState(null);
    const [currentBill, setCurrentBill] = useState(null);
    const [isLoadingAi, setIsLoadingAi] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState(null);
    const [aiGroundingMetadata, setAiGroundingMetadata] = useState(undefined);
    const [currentReport, setCurrentReport] = useState(null);
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
    const logActivity = (actionType, description, details) => {
        const newEntry = {
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
        }
        else if (currentView === 'Login') {
            setCurrentView(currentUser.role === 'kitchen' ? 'KitchenDashboard' : 'POS');
        }
    }, [currentUser, currentView]);
    const handleLogin = (role, username = "User") => {
        if (role) {
            const user = { name: username, role };
            setCurrentUser(user);
            logActivity('USER_LOGIN', `${user.name} (${user.role}) logged in.`);
            if (role === 'kitchen') {
                setCurrentView('KitchenDashboard');
            }
            else {
                setCurrentView('POS');
            }
        }
    };
    const handleLogout = () => {
        if (currentUser) {
            logActivity('USER_LOGOUT', `${currentUser.name} (${currentUser.role}) logged out.`);
        }
        setCurrentUser(null);
        setCurrentView('Login');
    };
    const handleTableSelect = (table) => {
        setSelectedTable(table);
        const existingOrder = orders.find(o => o.tableId === table.id && (o.status === 'Open' || o.status === 'Modified'));
        if (existingOrder) {
            setCurrentOrder({ ...existingOrder });
        }
        else {
            const newOrder = {
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
    const updateOrderItemStatus = (orderId, menuItemId, itemOriginalName, newStatus, isKitchenAction = false, isOwnerOverride = false) => {
        let oldStatus;
        setOrders(prevOrders => prevOrders.map(order => {
            if (order.id === orderId) {
                if (order.status === 'Paid' && !isOwnerOverride)
                    return order;
                let needsOrderUpdate = false;
                const updatedItems = order.items.map(item => {
                    // Match by name as well, in case menuItemId is duplicated by error / manual entry
                    if (item.menuItemId === menuItemId && item.name === itemOriginalName) {
                        oldStatus = item.status;
                        // Kitchen cannot change served items unless owner overrides
                        if (item.status === 'Served' && isKitchenAction && newStatus !== 'Served' && !isOwnerOverride)
                            return item;
                        if (item.status !== newStatus)
                            needsOrderUpdate = true;
                        return { ...item, status: newStatus };
                    }
                    return item;
                });
                if (needsOrderUpdate) {
                    const newOrderStatus = (order.status === 'Open' && !isKitchenAction && !isOwnerOverride) ? 'Modified' : order.status;
                    logActivity(isOwnerOverride ? 'OWNER_ITEM_SERVED' : 'ITEM_STATUS_CHANGED', `Item "${itemOriginalName}" in Order #${order.id.substring(0, 5)} status changed from ${oldStatus} to ${newStatus}.`, { orderId, menuItemId, itemName: itemOriginalName, oldStatus, newStatus, by: isOwnerOverride ? 'Owner Override' : (isKitchenAction ? 'Kitchen' : 'Staff/System') });
                    return { ...order, items: updatedItems, status: newOrderStatus, modifiedAt: Date.now() };
                }
            }
            return order;
        }));
    };
    const calculateOrderTotals = (items) => {
        const totalAmount = items.filter(item => item.status !== 'CancelledItem').reduce((sum, item) => sum + (item.priceAtOrder * item.quantity), 0);
        const taxAmount = totalAmount * TAX_RATE;
        const grandTotal = totalAmount + taxAmount;
        return { totalAmount, taxAmount, grandTotal };
    };
    const handleAddToOrder = (menuItem) => {
        if (!currentOrder || !selectedTable || currentOrder.status === 'Paid')
            return;
        setCurrentOrder(prevOrder => {
            if (!prevOrder)
                return null;
            const modifiableExistingItemIndex = prevOrder.items.findIndex(item => item.menuItemId === menuItem.id &&
                item.name === menuItem.name && // Ensure same item if names can vary for same ID
                item.status !== 'CancelledItem' &&
                item.status !== 'Served');
            let newItems;
            let itemAddedOrIncremented = false;
            if (modifiableExistingItemIndex > -1) {
                newItems = prevOrder.items.map((item, index) => index === modifiableExistingItemIndex
                    ? { ...item, quantity: item.quantity + 1, status: 'Pending' } // Reset to pending if re-added
                    : item);
                itemAddedOrIncremented = true;
            }
            else {
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
            const newOrderStatus = (prevOrder.status === 'Open' && (prevOrder.items.length > 0 || itemAddedOrIncremented || prevOrder.modifiedAt)) ? 'Modified' : prevOrder.status;
            return {
                ...prevOrder,
                items: newItems,
                ...totals,
                status: newOrderStatus,
                modifiedAt: (newOrderStatus === 'Modified' || prevOrder.modifiedAt || itemAddedOrIncremented) ? Date.now() : prevOrder.modifiedAt
            };
        });
    };
    const handleUpdateOrderItemQuantity = (menuItemId, itemName, newQuantity) => {
        if (!currentOrder || currentOrder.status === 'Paid')
            return;
        setCurrentOrder(prevOrder => {
            if (!prevOrder)
                return null;
            const itemToUpdate = prevOrder.items.find(item => item.menuItemId === menuItemId && item.name === itemName);
            if (itemToUpdate?.status === 'Served') {
                alert("Cannot change quantity of an item that has already been served.");
                return prevOrder;
            }
            let updatedItems;
            let action = "";
            if (newQuantity <= 0) {
                action = "cancelled";
                updatedItems = prevOrder.items.map(item => item.menuItemId === menuItemId && item.name === itemName ? { ...item, quantity: 0, status: 'CancelledItem', originalQuantity: item.quantity } : item);
            }
            else {
                action = "quantity updated";
                updatedItems = prevOrder.items.map(item => item.menuItemId === menuItemId && item.name === itemName ? { ...item, quantity: newQuantity, status: 'Modified', originalQuantity: item.originalQuantity || item.quantity } : item);
            }
            const totals = calculateOrderTotals(updatedItems);
            // Filter out items that were set to 0 quantity but keep 'CancelledItem' for record if they had original quantity.
            const finalItems = updatedItems.filter(item => item.quantity > 0 || (item.status === 'CancelledItem' && item.originalQuantity && item.originalQuantity > 0));
            const newOrderStatus = prevOrder.status === 'Open' && !prevOrder.modifiedAt ? 'Open' : 'Modified';
            logActivity('ITEM_STATUS_CHANGED', `Item "${itemName}" ${action} to ${newQuantity} in Order #${prevOrder.id.substring(0, 5)}.`, { orderId: prevOrder.id, menuItemId, itemName, newQuantity, oldQuantity: itemToUpdate?.quantity });
            return { ...prevOrder, items: finalItems, ...totals, status: newOrderStatus, modifiedAt: Date.now() };
        });
    };
    const handleConfirmOrder = () => {
        if (!currentOrder || !selectedTable || currentOrder.status === 'Paid')
            return;
        const isNewOrderCreation = !orders.some(o => o.id === currentOrder.id);
        const finalOrderItems = currentOrder.items.map(item => ({
            ...item,
            status: (item.status === 'Modified' || item.status === 'AcknowledgedModification') // If item was modified, send to kitchen as 'Pending'
                ? 'Pending'
                : item.status
        })).filter(item => // Keep cancelled items if they had an original quantity for record, otherwise filter them out
         item.status !== 'CancelledItem' || (item.originalQuantity && item.originalQuantity > 0));
        const activeItemsExistAfterUpdate = finalOrderItems.some(item => item.status !== 'CancelledItem' && item.quantity > 0);
        const hasServedItemsHistorically = currentOrder.items.some(i => i.status === 'Served');
        let newStatus;
        if (activeItemsExistAfterUpdate) {
            newStatus = (currentOrder.status === 'Open' && !currentOrder.modifiedAt && !isNewOrderCreation) ? 'Open' : 'Modified';
            if (isNewOrderCreation)
                newStatus = 'Open'; // New orders are 'Open'
        }
        else { // No active items left
            if (hasServedItemsHistorically) {
                newStatus = 'Modified'; // Still needs billing for served items
            }
            else {
                newStatus = 'Cancelled';
            }
        }
        const orderToSave = {
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
            logActivity('ORDER_CREATED', `Order #${orderToSave.id.substring(0, 5)} created for Table ${selectedTable.name}. Total: ${orderToSave.grandTotal.toFixed(2)}`, { order: orderToSave });
        }
        else if (!isNewOrderCreation && newStatus === 'Modified') {
            logActivity('ORDER_MODIFIED', `Order #${orderToSave.id.substring(0, 5)} for Table ${selectedTable.name} updated. Total: ${orderToSave.grandTotal.toFixed(2)}`, { order: orderToSave });
        }
        else if (newStatus === 'Cancelled') {
            logActivity('ORDER_CANCELLED', `Order #${orderToSave.id.substring(0, 5)} for Table ${selectedTable.name} was cancelled.`, { orderId: orderToSave.id, reason: orderToSave.cancelledReason || 'Confirmed empty/invalid' });
        }
        setOrders(prevOrders => {
            const existingOrderIndex = prevOrders.findIndex(o => o.id === orderToSave.id);
            if (existingOrderIndex > -1) {
                return prevOrders.map((o, i) => i === existingOrderIndex ? orderToSave : o);
            }
            return [...prevOrders, orderToSave];
        });
        if (newStatus !== 'Cancelled' && activeItemsExistAfterUpdate && selectedTable.status === TableStatus.Available) {
            handleTableStatusChange(selectedTable.id, TableStatus.Occupied, `Order #${orderToSave.id.substring(0, 5)} placed.`);
        }
        else if (newStatus === 'Cancelled') {
            // Check if there are other open orders for this table after this one is cancelled
            const currentOrdersList = orders.map(o => o.id === orderToSave.id ? orderToSave : o); // Reflect current cancellation
            const otherOpenOrdersForTable = currentOrdersList.some(o => o.tableId === selectedTable.id &&
                o.id !== orderToSave.id &&
                (o.status === 'Open' || o.status === 'Modified'));
            if (!otherOpenOrdersForTable) {
                handleTableStatusChange(selectedTable.id, TableStatus.Available, `Order #${orderToSave.id.substring(0, 5)} cancelled.`, true);
            }
        }
        setIsOrderModalOpen(false);
        setSelectedTable(null);
        setCurrentOrder(null);
    };
    const handleCancelEntireOrder = (orderToCancel, reason = "Customer request") => {
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
            status: 'Cancelled',
            cancelledReason: reason,
            items: orderToCancel.items.map(item => ({ ...item, status: 'CancelledItem', originalQuantity: item.quantity > 0 ? item.quantity : item.originalQuantity })),
            modifiedAt: Date.now(),
            grandTotal: 0, totalAmount: 0, taxAmount: 0 // No value for cancelled order
        };
        setOrders(prevOrders => prevOrders.map(o => o.id === orderToCancel.id ? cancelledOrderData : o));
        logActivity('ORDER_CANCELLED', `Order #${orderToCancel.id.substring(0, 5)} for Table ${tables.find(t => t.id === orderToCancel.tableId)?.name || 'N/A'} cancelled. Reason: ${reason}`, { orderId: orderToCancel.id, reason });
        const currentOrdersList = orders.map(o => o.id === orderToCancel.id ? cancelledOrderData : o);
        const otherOpenOrdersForTable = currentOrdersList.some(o => o.tableId === orderToCancel.tableId &&
            o.id !== orderToCancel.id &&
            (o.status === 'Open' || o.status === 'Modified'));
        if (!otherOpenOrdersForTable) {
            handleTableStatusChange(orderToCancel.tableId, TableStatus.Available, `Order #${orderToCancel.id.substring(0, 5)} cancelled, making table available.`, true);
        }
        setIsOrderModalOpen(false);
        setCurrentOrder(null);
        setSelectedTable(null);
    };
    const handleOpenBill = (order) => {
        const billableItems = order.items.filter(item => {
            if (order.status === 'Paid')
                return item.status !== 'CancelledItem'; // If paid, show all non-cancelled for receipt
            return item.status === 'Served'; // If not paid, only bill served items
        });
        // Check if there's anything to bill IF order is not already paid
        if (order.status !== 'Paid' && billableItems.length === 0 && order.items.some(i => i.status !== 'CancelledItem' && i.quantity > 0)) {
            alert("No items have been marked as served for this order yet. Bill can only be generated for served items.");
            return;
        }
        const billTotals = calculateOrderTotals(billableItems);
        const bill = {
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
    const handleProcessPayment = (bill, paymentMethod) => {
        if (currentUser?.role !== 'owner') {
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
        const updatedOrders = orders.map(o => o.id === bill.orderId ? { ...o, status: 'Paid', modifiedAt: paymentTimestamp } : o);
        setOrders(updatedOrders);
        logActivity('ORDER_PAID', `Order #${bill.orderId.substring(0, 5)} marked as Paid. Amount: ${bill.totalAmount.toFixed(2)}, Method: ${paymentMethod}.`, { orderId: bill.orderId, amount: bill.totalAmount, paymentMethod });
        // Check if this was the last open order for the table
        const otherOpenOrdersForTable = updatedOrders.some(o => o.tableId === bill.tableId &&
            o.id !== bill.orderId && // Exclude the one just paid
            (o.status === 'Open' || o.status === 'Modified'));
        if (!otherOpenOrdersForTable) {
            handleTableStatusChange(bill.tableId, TableStatus.Available, // Change to Available directly
            `Order #${bill.orderId.substring(0, 5)} paid, table automatically set to available.`, true // Bypass active order check, as we've just handled it
            );
        }
        setIsBillModalOpen(false);
        setCurrentBill(null);
    };
    const handleTableStatusChange = (tableId, newStatus, reasonForChange, bypassActiveOrderCheckForConfirmation = false) => {
        const tableToUpdate = tables.find(t => t.id === tableId);
        if (!tableToUpdate)
            return;
        const activeOrdersForTable = orders.filter(o => o.tableId === tableId &&
            (o.status === 'Open' || o.status === 'Modified'));
        let proceedWithStatusChange = true;
        // Confirmation logic only if not bypassed AND new status is Available/Cleaning AND active orders exist
        if (!bypassActiveOrderCheckForConfirmation &&
            (newStatus === TableStatus.Available || newStatus === TableStatus.Cleaning) &&
            activeOrdersForTable.length > 0) {
            const confirmChange = window.confirm(`Table "${tableToUpdate.name}" has active order(s). Changing status to "${newStatus}" will NOT cancel these orders. They must be managed separately. Do you want to proceed with changing only the table status?`);
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
            logActivity('TABLE_STATUS_CHANGED', `Table "${tableToUpdate.name}" status changed from ${tableToUpdate.status} to ${newStatus}. ${reasonForChange || ''}`, { tableId, oldStatus: tableToUpdate.status, newStatus, reason: reasonForChange });
        }
        setTables(prevTables => prevTables.map(t => t.id === tableId ? { ...t, status: newStatus } : t));
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
        const newTableData = {
            id: editingTableConfig.id || generateId(),
            name: editingTableConfig.name,
            capacity: Number(editingTableConfig.capacity),
            status: editingTableConfig.status || TableStatus.Available, // Default to Available if new
        };
        setTables(prev => isNew ? [...prev, newTableData] : prev.map(t => t.id === newTableData.id ? newTableData : t));
        logActivity(isNew ? 'TABLE_CONFIG_ADDED' : 'TABLE_CONFIG_UPDATED', `Seating area "${newTableData.name}" (Cap: ${newTableData.capacity}) was ${isNew ? 'added' : 'updated'}.`, { table: newTableData });
        setIsTableEditModalOpen(false);
        setEditingTableConfig(null);
    };
    // Section Components
    const LoginView = () => (_jsx("div", { className: "flex items-center justify-center min-h-screen p-4", style: { background: 'linear-gradient(to bottom right, var(--header-background-color), var(--primary-color))' }, children: _jsxs("div", { className: `p-8 rounded-xl shadow-2xl w-full max-w-md text-center ${getDensityPaddingClasses(themeSettings.uiDensity, 'card')}`, style: { backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)' }, children: [_jsx("span", { className: `${getIconSizeClass(themeSettings.iconSize)}`, dangerouslySetInnerHTML: { __html: LOGIN_ICON_SVG }, style: { color: 'var(--primary-color)', display: 'block', margin: '0 auto 1.5rem auto' } }), _jsxs("h2", { className: "text-3xl font-bold mb-8", style: { color: 'var(--text-color)' }, children: [APP_NAME, " Login"] }), _jsxs("div", { className: "space-y-4", children: [_jsx("input", { type: "text", placeholder: "Username (e.g., owner, staff, kitchen)", defaultValue: "owner", id: "username_mock", className: `w-full p-3 border rounded-lg focus:ring-2 outline-none ${getDensityPaddingClasses(themeSettings.uiDensity, 'button').replace(/px-\d+|py-\d+/, 'p-3')}`, style: { borderColor: 'var(--border-color)', color: 'var(--text-color)', backgroundColor: 'var(--card-background-color)', '--tw-ring-color': 'var(--primary-color)' } }), _jsx("input", { type: "password", placeholder: "Password (mock)", defaultValue: "password", id: "password_mock", className: `w-full p-3 border rounded-lg focus:ring-2 outline-none ${getDensityPaddingClasses(themeSettings.uiDensity, 'button').replace(/px-\d+|py-\d+/, 'p-3')}`, style: { borderColor: 'var(--border-color)', color: 'var(--text-color)', backgroundColor: 'var(--card-background-color)', '--tw-ring-color': 'var(--primary-color)' } }), _jsx("button", { onClick: () => handleLogin('owner', document.getElementById('username_mock')?.value || 'Owner'), className: `w-full font-semibold rounded-lg transition-colors duration-300 ease-in-out transform hover:scale-105 ${getDensityPaddingClasses(themeSettings.uiDensity, 'button')}`, style: { backgroundColor: 'var(--primary-color)', color: 'var(--button-text-color)' }, children: "Login as Owner" }), _jsx("button", { onClick: () => handleLogin('staff', document.getElementById('username_mock')?.value.replace("owner", "staff") || 'Staff'), className: `w-full font-semibold rounded-lg transition-colors duration-300 ease-in-out transform hover:scale-105 ${getDensityPaddingClasses(themeSettings.uiDensity, 'button')}`, style: { backgroundColor: 'var(--secondary-color)', color: 'var(--button-text-color)' }, children: "Login as Staff (Waiter)" }), _jsxs("button", { onClick: () => handleLogin('kitchen', document.getElementById('username_mock')?.value.replace("owner", "kitchen") || 'Kitchen Staff'), className: `w-full font-semibold rounded-lg transition-colors duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center ${getDensityPaddingClasses(themeSettings.uiDensity, 'button')}`, style: { backgroundColor: '#F97316', color: 'var(--button-text-color)' }, children: [_jsx("span", { className: `${getIconSizeClass(themeSettings.iconSize)} mr-2`, dangerouslySetInnerHTML: { __html: KITCHEN_LOGIN_ICON_SVG } }), "Login as Kitchen Staff"] })] }), _jsx("p", { className: "text-xs mt-8", style: { color: 'var(--text-color)', opacity: 0.7 }, children: "This is a mocked login for demonstration purposes." })] }) }));
    const TableView = () => (_jsx("div", { className: `grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 ${getDensityPaddingClasses(themeSettings.uiDensity, 'card')}`, children: tables.map(table => {
            const activeOrderForTable = orders.find(o => o.tableId === table.id && (o.status === 'Open' || o.status === 'Modified'));
            let displayStatus = table.status;
            let baseBgColor = '';
            switch (displayStatus) {
                case TableStatus.Available:
                    baseBgColor = themeSettings.secondaryColor;
                    break;
                case TableStatus.Occupied:
                    baseBgColor = themeSettings.primaryColor;
                    break;
                case TableStatus.Reserved:
                    baseBgColor = '#F59E0B';
                    break;
                case TableStatus.Dirty:
                    baseBgColor = '#F97316';
                    break;
                case TableStatus.Cleaning:
                    baseBgColor = '#60A5FA';
                    break;
                default: baseBgColor = '#9CA3AF';
            }
            const canSelect = () => {
                if (currentUser?.role === 'kitchen')
                    return false;
                if (activeOrderForTable)
                    return true;
                if (displayStatus === TableStatus.Reserved && currentUser?.role !== 'owner')
                    return false;
                return true;
            };
            const isSelectable = canSelect();
            return (_jsxs("div", { onClick: () => {
                    if (isSelectable) {
                        handleTableSelect(table);
                    }
                    else {
                        if (currentUser?.role !== 'kitchen') {
                            if (displayStatus === TableStatus.Reserved)
                                alert("This table is reserved.");
                            else if (displayStatus === TableStatus.Dirty || displayStatus === TableStatus.Cleaning)
                                alert(`Table is ${displayStatus}. Please wait or contact owner for access.`);
                        }
                        else {
                            alert("Kitchen staff view orders on the Kitchen Dashboard.");
                        }
                    }
                }, className: `p-3 rounded-lg shadow-lg ${isSelectable ? 'cursor-pointer' : 'cursor-default'} transition-all hover:shadow-xl relative
            text-white font-semibold text-center h-36 flex flex-col justify-between items-center 
            ${getDensityPaddingClasses(themeSettings.uiDensity, 'card')} ${themeSettings.contentScale} origin-center`, style: {
                    backgroundColor: baseBgColor,
                    color: themeSettings.buttonTextColor,
                    opacity: (!isSelectable && displayStatus === TableStatus.Reserved) ? 0.7 : 1,
                }, children: [_jsx("div", { className: "absolute top-1 right-1", children: (currentUser?.role === 'owner' || currentUser?.role === 'staff') && (_jsx("button", { onClick: (e) => { e.stopPropagation(); setEditingTableForStatus(table); setIsTableStatusModalOpen(true); }, className: `p-1 bg-black bg-opacity-20 rounded-full hover:bg-opacity-40 transition-opacity ${getDensityPaddingClasses(themeSettings.uiDensity, 'button').replace('px-', 'p-').replace('py-', '')}`, title: "Change Table Status", children: _jsx("span", { className: `${getIconSizeClass(themeSettings.iconSize)} w-5 h-5`, dangerouslySetInnerHTML: { __html: TABLE_SETTINGS_ICON_SVG } }) })) }), activeOrderForTable && displayStatus !== TableStatus.Occupied && (_jsx("div", { title: "This table has an active order", className: "absolute top-1 left-1 bg-red-700 p-1 rounded-full animate-pulse shadow-lg", children: _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 2.5, stroke: "white", className: "w-3 h-3", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" }) }) })), _jsx("span", { className: `${getIconSizeClass(themeSettings.iconSize)} w-10 h-10 mt-2`, dangerouslySetInnerHTML: { __html: displayStatus === TableStatus.Cleaning ? CLEANING_ICON_SVG : TABLE_ICON_SVG } }), _jsxs("div", { children: [_jsx("p", { className: "text-md sm:text-lg", children: table.name }), _jsxs("p", { className: "text-xs", children: ["Cap: ", table.capacity, " | ", displayStatus] })] }), orders.some(o => o.tableId === table.id && o.status === 'Paid') &&
                        !activeOrderForTable &&
                        (displayStatus === TableStatus.Available || displayStatus === TableStatus.Cleaning) &&
                        _jsx("div", { className: "absolute bottom-1 left-1 bg-green-700 bg-opacity-80 px-2 py-0.5 rounded text-xs", children: "Recently Paid" })] }, table.id));
        }) }));
    const TableStatusModalContent = () => {
        if (!editingTableForStatus)
            return null;
        return (_jsxs("div", { className: `${getDensityPaddingClasses(themeSettings.uiDensity, 'modalContent')}`, children: [_jsxs("h4", { className: "text-lg font-semibold mb-3", children: ["Change Status for ", editingTableForStatus.name] }), _jsx("div", { className: "grid grid-cols-2 gap-2", children: Object.values(TableStatus).map(status => {
                        let bgColor = '';
                        switch (status) {
                            case TableStatus.Available:
                                bgColor = themeSettings.secondaryColor;
                                break;
                            case TableStatus.Occupied:
                                bgColor = themeSettings.primaryColor;
                                break;
                            case TableStatus.Reserved:
                                bgColor = '#F59E0B';
                                break;
                            case TableStatus.Dirty:
                                bgColor = '#F97316';
                                break;
                            case TableStatus.Cleaning:
                                bgColor = '#60A5FA';
                                break;
                            default: bgColor = '#9CA3AF';
                        }
                        return (_jsx("button", { onClick: () => handleTableStatusChange(editingTableForStatus.id, status, `Manual change by ${currentUser?.name}`), className: `p-3 rounded-md text-white font-medium hover:opacity-80 transition-opacity ${getDensityPaddingClasses(themeSettings.uiDensity, 'button')}
                            ${editingTableForStatus.status === status ? 'ring-2 ring-offset-2 ring-black' : ''}
                        `, style: { backgroundColor: bgColor, color: themeSettings.buttonTextColor }, title: (status === TableStatus.Available || status === TableStatus.Cleaning) && orders.some(o => o.tableId === editingTableForStatus.id && o.items.some(i => i.status === 'Served') && o.status !== 'Paid') ? "Cannot make table Available/Cleaning with served, unpaid items. Bill must be paid first." : "", disabled: (status === TableStatus.Available || status === TableStatus.Cleaning) && orders.some(o => o.tableId === editingTableForStatus.id && o.items.some(i => i.status === 'Served') && o.status !== 'Paid'), children: status }, status));
                    }) }), orders.some(o => o.tableId === editingTableForStatus.id && (o.status === 'Open' || o.status === 'Modified')) &&
                    (editingTableForStatus.status === TableStatus.Available || editingTableForStatus.status === TableStatus.Cleaning) &&
                    _jsx("p", { className: "text-xs text-orange-600 mt-2", children: "Note: This table has active order(s). Changing status to 'Available' or 'Cleaning' will require confirmation and will NOT cancel the order(s)." }), orders.some(o => o.tableId === editingTableForStatus.id && o.items.some(i => i.status === 'Served') && o.status !== 'Paid') &&
                    _jsx("p", { className: "text-xs text-red-600 mt-2", children: "Cannot set to 'Available' or 'Cleaning' while served, unpaid items exist. Please process payment first." })] }));
    };
    const OrderModalContent = () => {
        if (!selectedTable || !currentOrder)
            return null;
        const [selectedMenuCategoryFilter, setSelectedMenuCategoryFilter] = useState(menuCategories[0]?.id || null);
        const [cancelReason, setCancelReason] = useState("");
        const [showCancelConfirm, setShowCancelConfirm] = useState(false);
        const isOrderPaid = currentOrder.status === 'Paid';
        const hasServedItems = currentOrder.items.some(item => item.status === 'Served');
        const displayableOrderItems = currentOrder.items.filter(item => item.status !== 'CancelledItem' || (item.originalQuantity && item.originalQuantity > 0));
        const canViewBill = (hasServedItems || isOrderPaid || (currentOrder.status !== 'Cancelled' && currentOrder.items.some(i => i.status === 'Served')));
        const isNewEmptyOrder = currentOrder.items.length === 0 && currentOrder.status === 'Open' && !currentOrder.modifiedAt;
        const densityButtonClass = getDensityPaddingClasses(themeSettings.uiDensity, 'button');
        const densityCardClass = getDensityPaddingClasses(themeSettings.uiDensity, 'card');
        const handleOwnerMarkAsServed = (menuItemId, itemName) => {
            if (currentUser?.role !== 'owner' || !currentOrder)
                return;
            updateOrderItemStatus(currentOrder.id, menuItemId, itemName, 'Served', false, true);
            const updatedOrder = orders.find(o => o.id === currentOrder.id);
            if (updatedOrder)
                setCurrentOrder({ ...updatedOrder });
        };
        return (_jsxs("div", { className: `flex flex-col md:flex-row gap-4 max-h-[75vh] ${densityCardClass}`, style: { color: 'var(--card-text-color)' }, children: [_jsxs("div", { className: "md:w-1/2 overflow-y-auto pr-2 border-r", style: { borderColor: 'var(--border-color)' }, children: [_jsx("h4", { className: "text-lg font-semibold mb-2", children: "Menu" }), isOrderPaid && (_jsx("div", { className: `p-2 mb-2 bg-yellow-100 border border-yellow-300 rounded-md text-yellow-700 text-sm ${densityCardClass.replace('p-', 'p-2')}`, children: "This order has been paid. No further modifications allowed." })), _jsx("div", { className: "mb-3", children: _jsxs("select", { value: selectedMenuCategoryFilter || '', onChange: (e) => setSelectedMenuCategoryFilter(e.target.value || null), className: `p-2 border rounded-md text-sm w-full ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2')}`, style: { backgroundColor: 'var(--card-background-color)', borderColor: 'var(--border-color)', color: 'var(--card-text-color)' }, disabled: isOrderPaid, children: [_jsx("option", { value: "", children: "All Categories" }), menuCategories.map(cat => _jsx("option", { value: cat.id, children: cat.name }, cat.id))] }) }), _jsx("div", { className: "max-h-[50vh] overflow-y-auto", children: menuItems.filter(item => item.inStock && (!selectedMenuCategoryFilter || item.category === selectedMenuCategoryFilter)).map(item => (_jsxs("div", { className: `mb-2 p-3 border rounded-lg hover:bg-gray-100 transition-colors flex justify-between items-center ${densityCardClass.replace('p-', 'p-3')}`, style: { borderColor: 'var(--border-color)' }, children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium", children: item.name }), _jsx("p", { className: "text-sm", children: item.price.toFixed(2) })] }), _jsx("button", { onClick: () => handleAddToOrder(item), className: `rounded-md transition-colors ${densityButtonClass} ${isOrderPaid ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`, style: { backgroundColor: isOrderPaid ? '#D1D5DB' : 'var(--primary-color)', color: 'var(--button-text-color)' }, disabled: isOrderPaid, children: " Add " })] }, item.id))) })] }), _jsxs("div", { className: `md:w-1/2 rounded-lg flex flex-col ${densityCardClass}`, style: { backgroundColor: 'var(--background-color)' }, children: [_jsxs("h4", { className: "text-lg font-semibold mb-3", children: ["Order for ", selectedTable.name, " (ID: ", currentOrder.id.substring(0, 5), ")", isOrderPaid && _jsx("span", { className: "ml-2 text-sm font-normal text-green-600", children: "(Paid)" }), hasServedItems && !isOrderPaid && _jsx("span", { className: "ml-2 text-sm font-normal text-orange-600", children: "(Some items served)" })] }), _jsx("div", { className: "overflow-y-auto flex-grow max-h-[40vh]", children: displayableOrderItems.length === 0 && !isOrderPaid ? (_jsx("p", { className: "text-gray-500 text-center py-5", children: "No items in order." })) : (displayableOrderItems.map(item => {
                                const isItemServed = item.status === 'Served';
                                const isItemCancelled = item.status === 'CancelledItem';
                                return (_jsxs("div", { className: `flex justify-between items-center mb-2 py-2 border-b 
                            ${item.status === 'Modified' ? 'bg-yellow-50 rounded-md p-1' : ''}
                            ${item.status === 'AcknowledgedModification' ? 'bg-blue-50 rounded-md p-1' : ''}
                            ${isItemCancelled ? 'opacity-60' : ''}
                        `, style: { borderColor: 'var(--border-color)' }, children: [_jsxs("div", { className: "flex-grow", children: [_jsxs("p", { className: `font-medium ${isItemCancelled ? 'line-through' : ''}`, children: [item.name, " ", _jsxs("span", { className: "text-xs", children: ["(", item.priceAtOrder.toFixed(2), ")"] })] }), _jsxs("p", { className: "text-xs", children: ["Item Status: ", item.status, " ", item.originalQuantity && (item.status === 'Modified' || isItemCancelled) ? `(was ${item.originalQuantity})` : ''] }), currentUser?.role === 'owner' && !isItemServed && !isItemCancelled && !isOrderPaid && (_jsx("button", { onClick: () => handleOwnerMarkAsServed(item.menuItemId, item.name), className: `mt-1 text-xs px-2 py-0.5 rounded hover:opacity-80 ${densityButtonClass.replace('px-4', 'px-2').replace('py-2', 'py-0.5').replace('text-sm', 'text-xs')}`, style: { backgroundColor: '#A855F7', color: 'var(--button-text-color)' }, title: "Owner: Directly mark this item as served (bypasses kitchen flow)", children: "Owner: Mark Served" }))] }), _jsxs("div", { className: "flex items-center ml-2", children: [_jsx("button", { onClick: () => handleUpdateOrderItemQuantity(item.menuItemId, item.name, item.quantity - 1), className: `px-2 py-1 rounded-l ${(isOrderPaid || isItemServed || isItemCancelled) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300'} ${densityButtonClass.replace('px-4', 'px-2').replace('py-2', 'py-1')}`, style: { color: (isOrderPaid || isItemServed || isItemCancelled) ? '#6B7280' : 'var(--text-color)', backgroundColor: (isOrderPaid || isItemServed || isItemCancelled) ? '#D1D5DB' : '#E5E7EB' }, disabled: isOrderPaid || isItemServed || isItemCancelled, title: (isItemServed) ? "Cannot change quantity of served items" : "", children: "-" }), _jsx("span", { className: `px-3 py-1 border-t border-b ${densityButtonClass.replace('px-4', 'px-3').replace('py-2', 'py-1')}`, style: { backgroundColor: 'var(--card-background-color)', borderColor: 'var(--border-color)' }, children: item.quantity }), _jsx("button", { onClick: () => handleUpdateOrderItemQuantity(item.menuItemId, item.name, item.quantity + 1), className: `px-2 py-1 rounded-r ${(isOrderPaid || isItemServed || isItemCancelled) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300'} ${densityButtonClass.replace('px-4', 'px-2').replace('py-2', 'py-1')}`, style: { color: (isOrderPaid || isItemServed || isItemCancelled) ? '#6B7280' : 'var(--text-color)', backgroundColor: (isOrderPaid || isItemServed || isItemCancelled) ? '#D1D5DB' : '#E5E7EB' }, disabled: isOrderPaid || isItemServed || isItemCancelled, title: (isItemServed) ? "Cannot change quantity of served items" : "", children: "+" })] }), _jsx("p", { className: `font-semibold w-16 text-right ${isItemCancelled ? 'line-through' : ''}`, children: isItemCancelled ? '0.00' : (item.priceAtOrder * item.quantity).toFixed(2) })] }, item.menuItemId + item.name + item.quantity + item.status));
                            })) }), currentOrder.items.some(i => i.status !== 'CancelledItem' && i.quantity > 0) && (_jsxs("div", { className: "mt-4 pt-4 border-t", style: { borderColor: 'var(--border-color)' }, children: [_jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { children: "Subtotal:" }), _jsx("span", { children: calculateOrderTotals(currentOrder.items.filter(i => i.status !== 'CancelledItem')).totalAmount.toFixed(2) })] }), _jsxs("div", { className: "flex justify-between text-sm", children: [_jsxs("span", { children: ["Tax (", TAX_RATE * 100, "%):"] }), _jsx("span", { children: calculateOrderTotals(currentOrder.items.filter(i => i.status !== 'CancelledItem')).taxAmount.toFixed(2) })] }), _jsxs("div", { className: "flex justify-between font-bold text-lg", children: [_jsx("span", { children: "Total:" }), _jsx("span", { children: calculateOrderTotals(currentOrder.items.filter(i => i.status !== 'CancelledItem')).grandTotal.toFixed(2) })] })] })), showCancelConfirm && !isOrderPaid && !hasServedItems && (_jsxs("div", { className: `mt-4 p-3 bg-red-50 border border-red-200 rounded-md ${densityCardClass.replace('p-', 'p-3')}`, children: [_jsx("p", { className: "text-sm text-red-700 font-semibold", children: "Are you sure you want to cancel this entire order?" }), _jsx("input", { type: "text", value: cancelReason, onChange: e => setCancelReason(e.target.value), placeholder: "Reason for cancellation (optional)", className: `w-full p-2 border rounded mt-2 text-sm ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2')}`, style: { borderColor: 'var(--border-color)', color: 'var(--text-color)', backgroundColor: 'var(--card-background-color)' } }), _jsxs("div", { className: "mt-2 flex justify-end gap-2", children: [_jsx("button", { onClick: () => setShowCancelConfirm(false), className: `bg-gray-300 text-xs rounded ${densityButtonClass.replace('text-sm', 'text-xs')}`, style: { color: 'var(--text-color)', backgroundColor: '#D1D5DB' }, children: "No, keep order" }), _jsx("button", { onClick: () => { if (currentOrder) {
                                                handleCancelEntireOrder(currentOrder, cancelReason);
                                                setShowCancelConfirm(false);
                                            } }, className: `bg-red-500 text-white text-xs rounded ${densityButtonClass.replace('text-sm', 'text-xs')}`, children: "Yes, Cancel Order" })] })] })), _jsxs("div", { className: "mt-6 flex flex-wrap justify-end gap-2", children: [_jsx("button", { onClick: () => { setIsOrderModalOpen(false); setSelectedTable(null); setCurrentOrder(null); }, className: `rounded-md hover:opacity-80 ${densityButtonClass}`, style: { backgroundColor: '#D1D5DB', color: 'var(--text-color)' }, children: "Close" }), !isOrderPaid && !showCancelConfirm && currentOrder.status !== 'Cancelled' && (_jsx("button", { onClick: () => {
                                        if (isNewEmptyOrder) {
                                            setIsOrderModalOpen(false);
                                            setSelectedTable(null);
                                            setCurrentOrder(null);
                                        }
                                        else {
                                            setShowCancelConfirm(true);
                                        }
                                    }, className: `rounded-md ${densityButtonClass} 
                        ${hasServedItems ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}
                    `, style: { color: 'var(--button-text-color)', backgroundColor: hasServedItems ? '#9CA3AF' : '#EF4444' }, disabled: hasServedItems, title: hasServedItems ? "Cannot cancel entire order with served items. Cancel individual unserved items." : (isNewEmptyOrder ? "Discard this new order" : "Cancel Entire Order"), children: isNewEmptyOrder ? "Discard New Order" : "Cancel Order" })), !isOrderPaid && _jsxs("button", { onClick: handleConfirmOrder, className: `rounded-md hover:opacity-80 ${densityButtonClass}`, style: { backgroundColor: 'var(--secondary-color)', color: 'var(--button-text-color)' }, children: [" ", currentOrder.status === 'Open' && !currentOrder.modifiedAt ? 'Confirm & Send to Kitchen' : 'Update Order', " "] }), canViewBill && currentOrder.status !== 'Cancelled' && (_jsx("button", { onClick: () => handleOpenBill(currentOrder), className: `rounded-md hover:opacity-80 ${densityButtonClass}`, style: { backgroundColor: '#A855F7', color: 'var(--button-text-color)' }, children: isOrderPaid ? 'View Receipt' : 'View Bill' })), !canViewBill && currentOrder.items.some(i => i.status !== 'CancelledItem' && i.quantity > 0) && currentOrder.status !== 'Cancelled' && !isOrderPaid && (_jsx("p", { className: `text-xs text-orange-600 p-2 bg-orange-100 rounded-md ${densityButtonClass.replace('px-4', 'px-2').replace('py-2', 'p-2')}`, children: "Bill available once items are served." }))] })] })] }));
    };
    const BillModalContent = () => {
        if (!currentBill)
            return null;
        const associatedOrder = orders.find(o => o.id === currentBill.orderId);
        const isAlreadyPaid = associatedOrder?.status === 'Paid';
        const paidTimestamp = associatedOrder?.modifiedAt;
        const [paymentMethod, setPaymentMethod] = useState('Cash');
        const [splitWays, setSplitWays] = useState(1);
        const amountPerPerson = splitWays > 0 ? (currentBill.totalAmount / splitWays).toFixed(2) : currentBill.totalAmount.toFixed(2);
        const canProcessPayment = currentUser?.role === 'owner' && !isAlreadyPaid;
        const densityButtonClass = getDensityPaddingClasses(themeSettings.uiDensity, 'button');
        const densityCardClass = getDensityPaddingClasses(themeSettings.uiDensity, 'modalContent');
        return (_jsxs("div", { className: `${densityCardClass}`, style: { color: 'var(--card-text-color)' }, children: [_jsx("h3", { className: "text-2xl font-bold text-center mb-4", children: isAlreadyPaid ? 'Receipt' : 'Invoice' }), _jsxs("p", { className: "text-sm text-center mb-2", children: ["Order ID: ", currentBill.orderId.substring(0, 8)] }), _jsxs("p", { className: "text-sm text-center mb-4", children: ["Table: ", tables.find(t => t.id === currentBill.tableId)?.name] }), isAlreadyPaid && paidTimestamp && (_jsxs("div", { className: `p-2 mb-3 bg-green-100 border border-green-300 rounded-md text-green-700 text-sm text-center ${densityCardClass.replace('p-', 'p-2')}`, children: ["Payment Processed on: ", new Date(paidTimestamp).toLocaleString()] })), _jsxs("div", { className: "mb-4 max-h-60 overflow-y-auto", children: [currentBill.items.length === 0 && _jsx("p", { className: "text-center text-gray-500", children: "No billable items." }), currentBill.items.map(item => (_jsxs("div", { className: "flex justify-between py-1 border-b", style: { borderColor: 'var(--border-color)' }, children: [_jsxs("span", { children: [item.name, " x ", item.quantity] }), _jsx("span", { children: (item.priceAtOrder * item.quantity).toFixed(2) })] }, item.menuItemId + item.name)))] }), currentBill.items.length > 0 && (_jsxs("div", { className: "py-2 border-t", style: { borderColor: 'var(--border-color)' }, children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Subtotal:" }), _jsx("span", { children: currentBill.subtotal.toFixed(2) })] }), _jsxs("div", { className: "flex justify-between", children: [_jsxs("span", { children: ["Tax (", currentBill.taxRate * 100, "%):"] }), _jsx("span", { children: currentBill.taxAmount.toFixed(2) })] }), _jsxs("div", { className: "flex justify-between font-bold text-xl mt-2", children: [_jsx("span", { children: "Total:" }), _jsx("span", { children: currentBill.totalAmount.toFixed(2) })] })] })), !isAlreadyPaid && currentBill.items.length > 0 && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "mt-4 pt-4 border-t", style: { borderColor: 'var(--border-color)' }, children: [_jsx("h4", { className: "font-semibold mb-2", children: "Split Bill" }), _jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx("label", { htmlFor: "splitWays", className: "text-sm", children: "Split By:" }), _jsx("input", { type: "number", id: "splitWays", value: splitWays, onChange: (e) => setSplitWays(Math.max(1, parseInt(e.target.value) || 1)), className: `w-16 p-1 border rounded ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-1')}`, min: "1", style: { borderColor: 'var(--border-color)', color: 'var(--text-color)', backgroundColor: 'var(--card-background-color)' } }), _jsx("span", { children: "ways" })] }), splitWays > 1 && _jsxs("p", { className: "text-md font-semibold", children: ["Amount per person: ", amountPerPerson] })] }), _jsxs("div", { className: "mt-6", children: [_jsx("label", { htmlFor: "paymentMethod", className: "block text-sm font-medium mb-1", children: "Payment Method:" }), _jsxs("select", { id: "paymentMethod", value: paymentMethod, onChange: e => setPaymentMethod(e.target.value), className: `w-full p-2 border rounded-md ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2')}`, style: { borderColor: 'var(--border-color)', color: 'var(--text-color)', backgroundColor: 'var(--card-background-color)' }, children: [_jsx("option", { value: "Cash", children: "Cash" }), " ", _jsx("option", { value: "Card", children: "Card (Mock)" }), " ", _jsx("option", { value: "Online", children: "Online (Mock)" })] })] })] })), _jsxs("div", { className: "mt-6 flex justify-end gap-2", children: [_jsx("button", { onClick: () => setIsBillModalOpen(false), className: `rounded-md hover:opacity-80 ${densityButtonClass}`, style: { backgroundColor: '#D1D5DB', color: 'var(--text-color)' }, children: "Close" }), !isAlreadyPaid && currentBill.items.length > 0 && (_jsxs("button", { onClick: () => handleProcessPayment(currentBill, paymentMethod), className: `rounded-md ${densityButtonClass} ${canProcessPayment ? 'hover:opacity-80' : 'opacity-50 cursor-not-allowed'}`, style: { backgroundColor: canProcessPayment ? 'var(--secondary-color)' : '#9CA3AF', color: 'var(--button-text-color)' }, disabled: !canProcessPayment, title: canProcessPayment ? `Mark as Paid (${paymentMethod})` : "Only owners can mark as paid", children: ["Mark as Paid (", paymentMethod, ")"] }))] }), !isAlreadyPaid && !canProcessPayment && currentBill.items.length > 0 && currentUser?.role !== 'owner' && _jsx("p", { className: "text-xs text-red-600 text-right mt-2", children: "Note: Payment processing is restricted to Owner role." })] }));
    };
    const KDSView = () => (_jsxs("div", { className: `p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 min-h-screen ${getDensityPaddingClasses(themeSettings.uiDensity, 'card')}`, style: { backgroundColor: themeSettings.cardBackgroundColor === '#FFFFFF' ? '#E5E7EB' : themeSettings.cardBackgroundColor }, children: [" ", orders.filter(o => o.status !== 'Paid' && o.status !== 'Cancelled').sort((a, b) => (b.modifiedAt || b.createdAt) - (a.modifiedAt || a.createdAt)).length === 0 &&
                _jsx("p", { className: "col-span-full text-center py-10 text-xl", style: { color: 'var(--text-color)' }, children: "No active kitchen orders." }), orders.filter(o => o.status !== 'Paid' && o.status !== 'Cancelled').sort((a, b) => (b.modifiedAt || b.createdAt) - (a.modifiedAt || a.createdAt)).map(order => (_jsxs("div", { className: `p-4 rounded-lg shadow-xl flex flex-col h-fit
            ${order.status === 'Cancelled' ? 'border-2 border-red-500' : ''}
            ${order.status === 'Modified' ? 'border-2 border-blue-500' : ''}
            ${themeSettings.kitchenDisplayScale} ${getDensityPaddingClasses(themeSettings.uiDensity, 'card')} origin-top-left
        `, style: {
                    backgroundColor: 'var(--card-background-color)',
                    color: 'var(--card-text-color)',
                    borderColor: order.status === 'Cancelled' ? '#EF4444' : (order.status === 'Modified' ? themeSettings.primaryColor : 'var(--border-color)'),
                }, children: [_jsxs("div", { className: "flex justify-between items-center mb-2 pb-2 border-b", style: { borderColor: 'var(--border-color)' }, children: [_jsxs("h4", { className: `text-lg font-bold ${order.status === 'Cancelled' ? 'text-red-700' : ''}`, style: { color: order.status === 'Cancelled' ? '#B91C1C' : themeSettings.primaryColor }, children: ["Order #", order.id.substring(0, 5), " (", tables.find(t => t.id === order.tableId)?.name, ")"] }), order.status === 'Cancelled' && _jsx("span", { className: "text-sm font-bold text-red-700 px-2 py-1 bg-red-300 rounded", children: "CANCELLED ORDER" })] }), _jsxs("p", { className: "text-xs mb-1", style: { color: 'var(--text-color)', opacity: 0.8 }, children: ["Received: ", new Date(order.createdAt).toLocaleTimeString()] }), order.modifiedAt && order.modifiedAt !== order.createdAt && _jsxs("p", { className: "text-xs mb-2", style: { color: themeSettings.primaryColor }, children: ["Updated: ", new Date(order.modifiedAt).toLocaleTimeString()] }), _jsx("div", { className: "space-y-2 flex-grow", children: order.items.map(item => (_jsxs("div", { className: `p-2 my-1 rounded flex justify-between items-start text-sm border-l-4 ${getDensityPaddingClasses(themeSettings.uiDensity, 'card').replace('p-4', 'p-2')}
                ${item.status === 'Pending' ? 'border-yellow-400 bg-yellow-50' : ''}
                ${item.status === 'Preparing' ? 'border-orange-400 bg-orange-50' : ''}
                ${item.status === 'Ready' ? 'border-green-400 bg-green-50' : ''}
                ${item.status === 'Served' ? 'border-gray-400 bg-gray-100' : ''}
                ${item.status === 'CancelledItem' ? 'border-red-400 bg-red-50 line-through opacity-70' : ''}
                ${item.status === 'Modified' ? 'border-blue-400 bg-blue-50 font-semibold' : ''}
                ${item.status === 'AcknowledgedModification' ? 'border-indigo-400 bg-indigo-50' : ''}
              `, children: [_jsxs("div", { className: "flex-grow", children: [_jsxs("p", { className: `font-semibold ${item.status === 'CancelledItem' ? 'text-red-600' : ''}`, style: { color: item.status === 'CancelledItem' ? '#B91C1C' : 'var(--card-text-color)' }, children: [item.name, " ", _jsxs("span", { className: "font-bold text-md", children: ["x ", item.quantity > 0 ? item.quantity : (item.originalQuantity || 0)] })] }), _jsxs("p", { className: "text-xs", style: { color: 'var(--card-text-color)', opacity: 0.8 }, children: ["Status: ", item.status, " ", item.status === 'CancelledItem' && item.originalQuantity ? `(was ${item.originalQuantity})` : ''] })] }), order.status !== 'Cancelled' && item.status !== 'CancelledItem' && item.status !== 'Served' && (currentUser?.role === 'staff' || currentUser?.role === 'owner') && (_jsxs("div", { className: "flex flex-col gap-1 items-end ml-2", children: [item.status === 'Pending' && currentUser?.role === 'owner' && _jsx("button", { onClick: () => updateOrderItemStatus(order.id, item.menuItemId, item.name, 'Preparing', true), className: `text-white rounded hover:opacity-80 w-full text-center ${getDensityPaddingClasses(themeSettings.uiDensity, 'button')}`, style: { backgroundColor: '#F97316' }, children: "Start Prep" }), item.status === 'Preparing' && currentUser?.role === 'owner' && _jsx("button", { onClick: () => updateOrderItemStatus(order.id, item.menuItemId, item.name, 'Ready', true), className: `text-white rounded hover:opacity-80 w-full text-center ${getDensityPaddingClasses(themeSettings.uiDensity, 'button')}`, style: { backgroundColor: themeSettings.secondaryColor }, children: "Mark Ready" }), item.status === 'Ready' && (currentUser?.role === 'staff' || currentUser?.role === 'owner') && _jsx("button", { onClick: () => updateOrderItemStatus(order.id, item.menuItemId, item.name, 'Served'), className: `text-white rounded hover:opacity-80 w-full text-center ${getDensityPaddingClasses(themeSettings.uiDensity, 'button')}`, style: { backgroundColor: themeSettings.primaryColor }, children: "Mark Served" }), item.status === 'Modified' && currentUser?.role === 'owner' && _jsx("button", { onClick: () => updateOrderItemStatus(order.id, item.menuItemId, item.name, 'AcknowledgedModification', true), className: `text-white rounded hover:opacity-80 w-full text-center ${getDensityPaddingClasses(themeSettings.uiDensity, 'button')}`, style: { backgroundColor: '#6366F1' }, children: "Ack Mod" }), item.status === 'AcknowledgedModification' && currentUser?.role === 'owner' && _jsx("button", { onClick: () => updateOrderItemStatus(order.id, item.menuItemId, item.name, 'Preparing', true), className: `text-white rounded hover:opacity-80 w-full text-center ${getDensityPaddingClasses(themeSettings.uiDensity, 'button')}`, style: { backgroundColor: '#F97316' }, children: "Start Prep" })] }))] }, item.menuItemId + item.name + item.status + item.quantity))) }), order.notes && _jsxs("p", { className: `mt-2 text-xs p-1 rounded ${getDensityPaddingClasses(themeSettings.uiDensity, 'card').replace('p-4', 'p-1')}`, style: { backgroundColor: themeSettings.backgroundColor, color: themeSettings.textColor }, children: ["Notes: ", order.notes] }), order.status === 'Cancelled' && order.cancelledReason && _jsxs("p", { className: "mt-2 text-xs text-red-700 bg-red-100 p-1 rounded", children: ["Reason: ", order.cancelledReason] })] }, order.id)))] }));
    const KitchenDashboardView = ({ isOwnerView = false }) => {
        const kitchenOrders = orders
            .filter(o => o.status !== 'Paid' && o.status !== 'Cancelled')
            .sort((a, b) => a.createdAt - b.createdAt);
        const getElapsedTime = (timestamp) => {
            const now = Date.now();
            const diff = now - timestamp;
            const minutes = Math.floor(diff / 60000);
            if (minutes < 1)
                return "< 1 min ago";
            if (minutes < 60)
                return `${minutes} min ago`;
            const hours = Math.floor(minutes / 60);
            return `${hours}h ${minutes % 60}m ago`;
        };
        const dashboardBg = isOwnerView ? 'var(--background-color)' : '#1E293B';
        const cardBg = isOwnerView ? 'var(--card-background-color)' : '#334155';
        const cardText = isOwnerView ? 'var(--card-text-color)' : '#E2E8F0';
        const headingColor = isOwnerView ? 'var(--primary-color)' : '#FDE047';
        const densityButtonClass = getDensityPaddingClasses(themeSettings.uiDensity, 'button');
        const densityCardClass = getDensityPaddingClasses(themeSettings.uiDensity, 'card');
        return (_jsxs("div", { className: `p-2 sm:p-4 min-h-screen ${densityCardClass.replace('p-4', 'p-2 sm:p-4')}`, style: { backgroundColor: dashboardBg }, children: [!isOwnerView && _jsx("h2", { className: "text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center", style: { color: headingColor }, children: "Kitchen Order Dashboard" }), kitchenOrders.length === 0 && _jsx("p", { className: `col-span-full text-center py-10 text-xl`, style: { color: cardText, opacity: 0.7 }, children: "No active orders for the kitchen." }), _jsx("div", { className: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4`, children: kitchenOrders.map(order => (_jsxs("div", { className: `p-3 sm:p-4 rounded-lg shadow-2xl flex flex-col h-fit transition-all duration-300 border-2 ${themeSettings.kitchenDisplayScale} ${densityCardClass.replace('p-4', 'p-3 sm:p-4')} origin-top-left`, style: {
                            backgroundColor: cardBg,
                            borderColor: order.items.some(i => i.status === 'Pending') && !isOwnerView ? '#DC2626' : (isOwnerView ? 'var(--border-color)' : '#475569')
                        }, children: [_jsxs("div", { className: "flex justify-between items-center mb-2 pb-2 border-b", style: { borderColor: isOwnerView ? 'var(--border-color)' : '#475569' }, children: [_jsxs("h4", { className: `text-lg sm:text-xl font-bold`, style: { color: headingColor }, children: [tables.find(t => t.id === order.tableId)?.name || 'Unknown Table', _jsxs("span", { className: `text-xs ml-2`, style: { color: cardText, opacity: 0.7 }, children: ["(#", order.id.substring(0, 4), ")"] })] }), _jsx("span", { className: `text-xs sm:text-sm`, style: { color: cardText, opacity: 0.8 }, children: getElapsedTime(order.createdAt) })] }), order.modifiedAt && order.modifiedAt !== order.createdAt &&
                                _jsxs("p", { className: `text-xs mb-2 animate-pulse`, style: { color: isOwnerView ? '#F59E0B' : '#FACC15' }, children: ["Order Updated: ", getElapsedTime(order.modifiedAt)] }), _jsx("div", { className: "space-y-2 flex-grow", children: order.items.filter(i => i.status !== 'CancelledItem' || (i.originalQuantity && i.originalQuantity > 0)).map(item => (_jsxs("div", { className: `p-2 my-1 rounded flex justify-between items-start text-sm transition-colors border-l-4 ${densityCardClass.replace('p-4', 'p-2')}
                                    ${item.status === 'Pending' ? 'border-red-500 bg-red-100' : ''}
                                    ${item.status === 'Preparing' ? 'border-orange-500 bg-orange-100' : ''}
                                    ${item.status === 'Ready' ? 'border-green-500 bg-green-100' : ''}
                                    ${item.status === 'Served' ? 'border-gray-500 bg-gray-200 opacity-80' : ''}
                                    ${item.status === 'CancelledItem' ? 'border-red-400 bg-red-50 line-through opacity-70' : ''}
                                    ${item.status === 'Modified' ? 'border-blue-500 bg-blue-100 animate-pulse' : ''}
                                    ${item.status === 'AcknowledgedModification' ? 'border-indigo-500 bg-indigo-100' : ''}
                                `, style: {
                                        color: (item.status === 'CancelledItem') ? '#7F1D1D' : (isOwnerView ? 'var(--card-text-color)' : '#0F172A')
                                    }, children: [_jsxs("div", { className: "flex-grow", children: [_jsxs("p", { className: `font-semibold`, children: [item.name, " ", _jsxs("span", { className: "font-bold text-md", children: ["x ", item.quantity > 0 ? item.quantity : (item.originalQuantity || 0)] })] }), item.status === 'Modified' && item.originalQuantity && _jsxs("p", { className: `text-xs text-blue-600`, children: ["Was: ", item.originalQuantity] }), _jsxs("p", { className: `text-xs`, children: ["Status: ", item.status] })] }), !isOwnerView && item.status !== 'Served' && item.status !== 'CancelledItem' && (_jsxs("div", { className: "flex flex-col gap-1 items-end ml-2", children: [item.status === 'Pending' && _jsx("button", { onClick: () => updateOrderItemStatus(order.id, item.menuItemId, item.name, 'Preparing', true), className: `bg-orange-500 hover:bg-orange-600 text-white rounded w-full text-center ${densityButtonClass}`, children: "Start Prep" }), item.status === 'Preparing' && _jsx("button", { onClick: () => updateOrderItemStatus(order.id, item.menuItemId, item.name, 'Ready', true), className: `bg-green-500 hover:bg-green-600 text-white rounded w-full text-center ${densityButtonClass}`, children: "Mark Ready" }), item.status === 'Modified' && _jsx("button", { onClick: () => updateOrderItemStatus(order.id, item.menuItemId, item.name, 'AcknowledgedModification', true), className: `bg-indigo-500 hover:bg-indigo-600 text-white rounded w-full text-center ${densityButtonClass}`, children: "Ack Mod" }), item.status === 'AcknowledgedModification' && _jsx("button", { onClick: () => updateOrderItemStatus(order.id, item.menuItemId, item.name, 'Preparing', true), className: `bg-orange-500 hover:bg-orange-600 text-white rounded w-full text-center ${densityButtonClass}`, children: "Start Prep" })] })), isOwnerView && (currentUser?.role === 'owner') && _jsx("button", { onClick: () => { setSelectedTable(tables.find(t => t.id === order.tableId) || null); setCurrentOrder({ ...order }); setIsOrderModalOpen(true); }, className: `text-white rounded hover:opacity-80 ${densityButtonClass}`, style: { backgroundColor: 'var(--primary-color)', opacity: 0.8 }, children: "View/Edit" })] }, item.menuItemId + item.name + item.status + item.quantity + '-kds-item'))) }), order.notes && _jsxs("p", { className: `mt-2 text-xs p-1 rounded ${densityCardClass.replace('p-4', 'p-1')}`, style: { backgroundColor: isOwnerView ? themeSettings.backgroundColor : '#475569', color: isOwnerView ? themeSettings.textColor : '#CBD5E1' }, children: ["Notes: ", order.notes] })] }, order.id))) })] }));
    };
    const [managementSubView, setManagementSubView] = useState('Menu');
    const [editingMenuItem, setEditingMenuItem] = useState(null);
    const [isMenuItemModalOpen, setIsMenuItemModalOpen] = useState(false);
    const [newMenuCategoryName, setNewMenuCategoryName] = useState('');
    const [editingInventoryItem, setEditingInventoryItem] = useState(null);
    const [isInventoryItemModalOpen, setIsInventoryItemModalOpen] = useState(false);
    const [newInventoryCategoryName, setNewInventoryCategoryName] = useState('');
    const [reportQuery, setReportQuery] = useState('');
    const handleSaveMenuItem = () => {
        if (!editingMenuItem || !editingMenuItem.name || !editingMenuItem.price) {
            alert("Name and price are required.");
            return;
        }
        let categoryId = editingMenuItem.category;
        if (editingMenuItem.category === 'add_new_category' && newMenuCategoryName.trim()) {
            const existingCategory = menuCategories.find(cat => cat.name.toLowerCase() === newMenuCategoryName.trim().toLowerCase());
            if (existingCategory) {
                categoryId = existingCategory.id;
            }
            else {
                const newCat = { id: generateId(), name: newMenuCategoryName.trim() };
                setMenuCategories(prev => [...prev, newCat]);
                categoryId = newCat.id;
                logActivity('MENU_CATEGORY_ADDED', `New menu category "${newCat.name}" added.`, { category: newCat });
            }
            setNewMenuCategoryName('');
        }
        else if (!editingMenuItem.category || editingMenuItem.category === 'add_new_category') {
            alert("Please select or add a valid category.");
            return;
        }
        const isNew = !editingMenuItem.id;
        const fullItem = {
            id: editingMenuItem.id || generateId(), name: editingMenuItem.name, description: editingMenuItem.description || '',
            price: Number(editingMenuItem.price), category: categoryId,
            imageUrl: editingMenuItem.imageUrl || `https://picsum.photos/seed/${editingMenuItem.name.replace(/\s+/g, '').toLowerCase()}/300/200`,
            ingredients: editingMenuItem.ingredients || [],
            inStock: editingMenuItem.inStock === undefined ? true : editingMenuItem.inStock,
        };
        setMenuItems(prev => editingMenuItem.id ? prev.map(item => item.id === editingMenuItem.id ? fullItem : item) : [...prev, fullItem]);
        logActivity(isNew ? 'MENU_ITEM_ADDED' : 'MENU_ITEM_UPDATED', `Menu item "${fullItem.name}" was ${isNew ? 'added' : 'updated'}.`, { item: fullItem });
        setIsMenuItemModalOpen(false);
        setEditingMenuItem(null);
    };
    const handleGenerateDescription = async () => {
        if (!editingMenuItem || !editingMenuItem.name || !editingMenuItem.category || !geminiService.isAIAvailable())
            return;
        setIsLoadingAi(true);
        const desc = await geminiService.generateMenuItemDescription(editingMenuItem.name, menuCategories.find(c => c.id === editingMenuItem?.category)?.name || editingMenuItem.category);
        setEditingMenuItem(prev => prev ? { ...prev, description: desc } : null);
        logActivity('AI_QUERY', `AI generated description for menu item "${editingMenuItem.name}".`, { itemName: editingMenuItem.name, result: desc.substring(0, 100) });
        setIsLoadingAi(false);
    };
    const handleSaveInventoryItem = () => {
        if (!editingInventoryItem || !editingInventoryItem.name || !editingInventoryItem.unit) {
            alert("Name and unit are required for inventory item.");
            return;
        }
        let categoryId = editingInventoryItem.categoryId;
        if (editingInventoryItem.categoryId === 'add_new_category_inv' && newInventoryCategoryName.trim()) {
            const existingCategory = inventoryCategories.find(cat => cat.name.toLowerCase() === newInventoryCategoryName.trim().toLowerCase());
            if (existingCategory) {
                categoryId = existingCategory.id;
            }
            else {
                const newCat = { id: generateId(), name: newInventoryCategoryName.trim() };
                setInventoryCategories(prev => [...prev, newCat]);
                categoryId = newCat.id;
                logActivity('INVENTORY_CATEGORY_ADDED', `New inventory category "${newCat.name}" added.`, { category: newCat });
            }
            setNewInventoryCategoryName('');
        }
        else if (!editingInventoryItem.categoryId || editingInventoryItem.categoryId === 'add_new_category_inv') {
            alert("Please select or add a valid inventory category.");
            return;
        }
        const isNew = !editingInventoryItem.id;
        const fullItem = {
            id: editingInventoryItem.id || generateId(),
            name: editingInventoryItem.name,
            quantity: Number(editingInventoryItem.quantity) || 0,
            unit: editingInventoryItem.unit,
            lowStockThreshold: Number(editingInventoryItem.lowStockThreshold) || 0,
            supplier: editingInventoryItem.supplier || '',
            categoryId: categoryId,
        };
        setInventory(prev => editingInventoryItem.id ? prev.map(item => item.id === editingInventoryItem.id ? fullItem : item) : [...prev, fullItem]);
        logActivity(isNew ? 'INVENTORY_ITEM_ADDED' : 'INVENTORY_ITEM_UPDATED', `Inventory item "${fullItem.name}" was ${isNew ? 'added' : 'updated'}. Quantity: ${fullItem.quantity}`, { item: fullItem });
        setIsInventoryItemModalOpen(false);
        setEditingInventoryItem(null);
    };
    const MenuItemManagement = () => {
        const densityButtonClass = getDensityPaddingClasses(themeSettings.uiDensity, 'button');
        const densityCardClass = getDensityPaddingClasses(themeSettings.uiDensity, 'card');
        return (_jsxs("div", { style: { color: 'var(--text-color)' }, children: [_jsxs("button", { onClick: () => { setEditingMenuItem({}); setIsMenuItemModalOpen(true); }, className: `mb-4 rounded hover:opacity-80 flex items-center gap-2 ${densityButtonClass}`, style: { backgroundColor: 'var(--primary-color)', color: 'var(--button-text-color)' }, children: [_jsx("span", { className: `${getIconSizeClass(themeSettings.iconSize)}`, dangerouslySetInnerHTML: { __html: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" class="hero-icon"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>` } }), "Add Menu Item"] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: menuItems.map(item => (_jsxs("div", { className: `rounded shadow ${densityCardClass}`, style: { backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)', borderColor: 'var(--border-color)' }, children: [_jsx("img", { src: item.imageUrl, alt: item.name, className: "w-full h-32 object-cover rounded mb-2" }), _jsxs("h5", { className: "font-semibold", children: [item.name, " (", item.price.toFixed(2), ")"] }), _jsx("p", { className: "text-sm truncate", style: { opacity: 0.8 }, children: item.description }), _jsxs("p", { className: "text-xs", style: { opacity: 0.7 }, children: ["Category: ", menuCategories.find(c => c.id === item.category)?.name] }), _jsxs("p", { className: "text-xs", style: { opacity: 0.7 }, children: ["In Stock: ", item.inStock ? 'Yes' : 'No'] }), _jsx("button", { onClick: () => { setEditingMenuItem(item); setIsMenuItemModalOpen(true); }, className: `mt-2 text-sm hover:underline ${densityButtonClass.replace(/px-\d+|py-\d+/, 'px-0 py-0').replace('text-sm', 'text-xs')}`, style: { color: 'var(--primary-color)' }, children: "Edit" })] }, item.id))) }), isMenuItemModalOpen && editingMenuItem && (_jsx(Modal, { isOpen: isMenuItemModalOpen, onClose: () => { setIsMenuItemModalOpen(false); setNewMenuCategoryName(''); }, title: editingMenuItem.id ? "Edit Menu Item" : "Add Menu Item", size: "lg", children: _jsxs("div", { className: `space-y-4 ${getDensityPaddingClasses(themeSettings.uiDensity, 'modalContent')}`, style: { color: 'var(--card-text-color)' }, children: [_jsx("input", { type: "text", placeholder: "Name", value: editingMenuItem.name || '', onChange: e => setEditingMenuItem({ ...editingMenuItem, name: e.target.value }), className: `w-full p-2 border rounded ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2')}`, style: { borderColor: 'var(--border-color)', backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)' } }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("textarea", { placeholder: "Description", value: editingMenuItem.description || '', onChange: e => setEditingMenuItem({ ...editingMenuItem, description: e.target.value }), className: `w-full p-2 border rounded ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2')}`, rows: 3, style: { borderColor: 'var(--border-color)', backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)' } }), geminiService.isAIAvailable() && _jsx("button", { onClick: handleGenerateDescription, disabled: isLoadingAi || !editingMenuItem.name || !editingMenuItem.category, className: `text-white rounded whitespace-nowrap hover:opacity-80 disabled:opacity-50 ${densityButtonClass}`, style: { backgroundColor: isLoadingAi ? '#9CA3AF' : '#A855F7' }, children: isLoadingAi ? 'Generating...' : 'AI Desc' })] }), _jsx("input", { type: "number", placeholder: "Price", value: editingMenuItem.price || '', onChange: e => setEditingMenuItem({ ...editingMenuItem, price: parseFloat(e.target.value) }), className: `w-full p-2 border rounded ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2')}`, style: { borderColor: 'var(--border-color)', backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)' } }), _jsxs("select", { value: editingMenuItem.category || '', onChange: e => setEditingMenuItem({ ...editingMenuItem, category: e.target.value }), className: `w-full p-2 border rounded ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2')}`, style: { borderColor: 'var(--border-color)', backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)' }, children: [_jsx("option", { value: "", children: "Select Menu Category" }), menuCategories.map(cat => _jsx("option", { value: cat.id, children: cat.name }, cat.id)), _jsx("option", { value: "add_new_category", children: "Add New Category..." })] }), editingMenuItem.category === 'add_new_category' && (_jsx("input", { type: "text", placeholder: "New Category Name", value: newMenuCategoryName, onChange: e => setNewMenuCategoryName(e.target.value), className: `w-full p-2 border rounded mt-2 ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2')}`, style: { borderColor: 'var(--border-color)', backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)' } })), _jsx("input", { type: "text", placeholder: "Image URL (Optional)", value: editingMenuItem.imageUrl || '', onChange: e => setEditingMenuItem({ ...editingMenuItem, imageUrl: e.target.value }), className: `w-full p-2 border rounded ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2')}`, style: { borderColor: 'var(--border-color)', backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)' } }), _jsxs("label", { className: "flex items-center gap-2", children: [_jsx("input", { type: "checkbox", checked: editingMenuItem.inStock === undefined ? true : editingMenuItem.inStock, onChange: e => setEditingMenuItem({ ...editingMenuItem, inStock: e.target.checked }) }), " In Stock"] }), _jsx("textarea", { placeholder: "Ingredients (comma-separated)", value: editingMenuItem.ingredients?.join(', ') || '', onChange: e => setEditingMenuItem({ ...editingMenuItem, ingredients: e.target.value.split(',').map(s => s.trim()) }), className: `w-full p-2 border rounded ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2')}`, rows: 2, style: { borderColor: 'var(--border-color)', backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)' } }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx("button", { onClick: () => { setIsMenuItemModalOpen(false); setNewMenuCategoryName(''); }, className: `rounded hover:opacity-80 ${densityButtonClass}`, style: { backgroundColor: '#D1D5DB', color: 'var(--text-color)' }, children: "Cancel" }), _jsx("button", { onClick: handleSaveMenuItem, className: `rounded hover:opacity-80 ${densityButtonClass}`, style: { backgroundColor: 'var(--primary-color)', color: 'var(--button-text-color)' }, children: "Save" })] })] }) }))] }));
    };
    const InventoryManagement = () => {
        const densityButtonClass = getDensityPaddingClasses(themeSettings.uiDensity, 'button');
        const densityCardClass = getDensityPaddingClasses(themeSettings.uiDensity, 'card');
        return (_jsxs("div", { style: { color: 'var(--text-color)' }, children: [_jsxs("button", { onClick: () => { setEditingInventoryItem({ quantity: 0, lowStockThreshold: 0 }); setIsInventoryItemModalOpen(true); }, className: `mb-4 rounded hover:opacity-80 flex items-center gap-2 ${densityButtonClass}`, style: { backgroundColor: 'var(--primary-color)', color: 'var(--button-text-color)' }, children: [_jsx("span", { className: `${getIconSizeClass(themeSettings.iconSize)}`, dangerouslySetInnerHTML: { __html: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" class="hero-icon"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>` } }), "Add Inventory Item"] }), inventoryCategories.map(category => (_jsxs("div", { className: "mb-6", children: [_jsx("h4", { className: "text-xl font-semibold mb-2 border-b pb-1", style: { borderColor: 'var(--border-color)' }, children: category.name }), inventory.filter(item => item.categoryId === category.id).length === 0 ? _jsx("p", { className: "text-sm", style: { opacity: 0.7 }, children: "No items in this category." }) :
                            _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: `min-w-full shadow-sm rounded-md ${densityCardClass}`, style: { backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)' }, children: [_jsx("thead", { style: { backgroundColor: themeSettings.backgroundColor === '#FFFFFF' ? '#F9FAFB' : themeSettings.backgroundColor, opacity: 0.9 }, children: _jsxs("tr", { children: [_jsx("th", { className: `py-2 px-3 text-left text-xs font-medium uppercase ${densityButtonClass.replace(/px-\d+|py-\d+/, 'py-2 px-3').replace('text-sm', 'text-xs')}`, style: { color: 'var(--text-color)' }, children: "Name" }), _jsx("th", { className: `py-2 px-3 text-left text-xs font-medium uppercase ${densityButtonClass.replace(/px-\d+|py-\d+/, 'py-2 px-3').replace('text-sm', 'text-xs')}`, style: { color: 'var(--text-color)' }, children: "Quantity" }), _jsx("th", { className: `py-2 px-3 text-left text-xs font-medium uppercase ${densityButtonClass.replace(/px-\d+|py-\d+/, 'py-2 px-3').replace('text-sm', 'text-xs')}`, style: { color: 'var(--text-color)' }, children: "Unit" }), _jsx("th", { className: `py-2 px-3 text-left text-xs font-medium uppercase ${densityButtonClass.replace(/px-\d+|py-\d+/, 'py-2 px-3').replace('text-sm', 'text-xs')}`, style: { color: 'var(--text-color)' }, children: "Low At" }), _jsx("th", { className: `py-2 px-3 text-left text-xs font-medium uppercase ${densityButtonClass.replace(/px-\d+|py-\d+/, 'py-2 px-3').replace('text-sm', 'text-xs')}`, style: { color: 'var(--text-color)' }, children: "Supplier" }), _jsx("th", { className: `py-2 px-3 text-left text-xs font-medium uppercase ${densityButtonClass.replace(/px-\d+|py-\d+/, 'py-2 px-3').replace('text-sm', 'text-xs')}`, style: { color: 'var(--text-color)' }, children: "Actions" })] }) }), _jsx("tbody", { children: inventory.filter(item => item.categoryId === category.id).map(item => (_jsxs("tr", { className: `border-b hover:opacity-80 ${item.quantity <= item.lowStockThreshold ? 'bg-red-50' : ''}`, style: { borderColor: 'var(--border-color)' }, children: [_jsx("td", { className: `py-2 px-3 text-sm ${densityButtonClass.replace(/px-\d+|py-\d+/, 'py-2 px-3')}`, children: item.name }), _jsx("td", { className: `py-2 px-3 text-sm ${densityButtonClass.replace(/px-\d+|py-\d+/, 'py-2 px-3')}`, children: item.quantity }), _jsx("td", { className: `py-2 px-3 text-sm ${densityButtonClass.replace(/px-\d+|py-\d+/, 'py-2 px-3')}`, children: item.unit }), _jsx("td", { className: `py-2 px-3 text-sm ${densityButtonClass.replace(/px-\d+|py-\d+/, 'py-2 px-3')}`, children: item.lowStockThreshold }), _jsx("td", { className: `py-2 px-3 text-sm ${densityButtonClass.replace(/px-\d+|py-\d+/, 'py-2 px-3')}`, children: item.supplier }), _jsx("td", { className: `py-2 px-3 text-sm ${densityButtonClass.replace(/px-\d+|py-\d+/, 'py-2 px-3')}`, children: _jsx("button", { onClick: () => { setEditingInventoryItem(item); setIsInventoryItemModalOpen(true); }, className: "hover:underline", style: { color: 'var(--primary-color)' }, children: "Edit" }) })] }, item.id))) })] }) })] }, category.id))), isInventoryItemModalOpen && editingInventoryItem && (_jsx(Modal, { isOpen: isInventoryItemModalOpen, onClose: () => { setIsInventoryItemModalOpen(false); setNewInventoryCategoryName(''); }, title: editingInventoryItem.id ? "Edit Inventory Item" : "Add Inventory Item", size: "md", children: _jsxs("div", { className: `space-y-4 ${getDensityPaddingClasses(themeSettings.uiDensity, 'modalContent')}`, style: { color: 'var(--card-text-color)' }, children: [_jsx("input", { type: "text", placeholder: "Item Name", value: editingInventoryItem.name || '', onChange: e => setEditingInventoryItem({ ...editingInventoryItem, name: e.target.value }), className: `w-full p-2 border rounded ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2')}`, style: { borderColor: 'var(--border-color)', backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)' } }), _jsxs("select", { value: editingInventoryItem.categoryId || '', onChange: e => setEditingInventoryItem({ ...editingInventoryItem, categoryId: e.target.value }), className: `w-full p-2 border rounded ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2')}`, style: { borderColor: 'var(--border-color)', backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)' }, children: [_jsx("option", { value: "", children: "Select Inventory Category" }), inventoryCategories.map(cat => _jsx("option", { value: cat.id, children: cat.name }, cat.id)), _jsx("option", { value: "add_new_category_inv", children: "Add New Category..." })] }), editingInventoryItem.categoryId === 'add_new_category_inv' && (_jsx("input", { type: "text", placeholder: "New Inventory Category Name", value: newInventoryCategoryName, onChange: e => setNewInventoryCategoryName(e.target.value), className: `w-full p-2 border rounded mt-2 ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2')}`, style: { borderColor: 'var(--border-color)', backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)' } })), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx("input", { type: "number", placeholder: "Quantity", value: editingInventoryItem.quantity || '', onChange: e => setEditingInventoryItem({ ...editingInventoryItem, quantity: parseInt(e.target.value) }), className: `w-full p-2 border rounded ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2')}`, style: { borderColor: 'var(--border-color)', backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)' } }), _jsx("input", { type: "text", placeholder: "Unit (e.g., kg, pcs)", value: editingInventoryItem.unit || '', onChange: e => setEditingInventoryItem({ ...editingInventoryItem, unit: e.target.value }), className: `w-full p-2 border rounded ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2')}`, style: { borderColor: 'var(--border-color)', backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)' } })] }), _jsx("input", { type: "number", placeholder: "Low Stock Threshold", value: editingInventoryItem.lowStockThreshold || '', onChange: e => setEditingInventoryItem({ ...editingInventoryItem, lowStockThreshold: parseInt(e.target.value) }), className: `w-full p-2 border rounded ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2')}`, style: { borderColor: 'var(--border-color)', backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)' } }), _jsx("input", { type: "text", placeholder: "Supplier (Optional)", value: editingInventoryItem.supplier || '', onChange: e => setEditingInventoryItem({ ...editingInventoryItem, supplier: e.target.value }), className: `w-full p-2 border rounded ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2')}`, style: { borderColor: 'var(--border-color)', backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)' } }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx("button", { onClick: () => { setIsInventoryItemModalOpen(false); setNewInventoryCategoryName(''); }, className: `rounded hover:opacity-80 ${densityButtonClass}`, style: { backgroundColor: '#D1D5DB', color: 'var(--text-color)' }, children: "Cancel" }), _jsx("button", { onClick: handleSaveInventoryItem, className: `rounded hover:opacity-80 ${densityButtonClass}`, style: { backgroundColor: 'var(--primary-color)', color: 'var(--button-text-color)' }, children: "Save" })] })] }) }))] }));
    };
    const generateSalesReport = (period) => {
        const now = new Date();
        let startDate;
        if (period === 'daily') {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        }
        else if (period === 'monthly') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        }
        else { // yearly
            startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        }
        const relevantOrders = orders.filter(order => order.status === 'Paid' && order.modifiedAt && order.modifiedAt >= startDate.getTime());
        const totalRevenue = relevantOrders.reduce((sum, order) => sum + order.grandTotal, 0);
        const soldItemsMap = new Map();
        const detailedSoldItems = [];
        const categorySalesMap = new Map();
        relevantOrders.forEach(order => {
            order.items.forEach(item => {
                if (item.status === 'Served' || (order.status === 'Paid' && item.status !== 'CancelledItem')) {
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
        const categorySales = Array.from(categorySalesMap.entries()).map(([categoryId, data]) => ({
            categoryId,
            ...data
        }));
        logActivity('REPORT_GENERATED', `Generated ${period} sales report.`, { period, totalOrders: relevantOrders.length, totalRevenue });
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
    const ReportAndAnalytics = () => {
        const densityButtonClass = getDensityPaddingClasses(themeSettings.uiDensity, 'button');
        const densityCardClass = getDensityPaddingClasses(themeSettings.uiDensity, 'card');
        const handleGenerateReport = (period) => {
            setCurrentReport(generateSalesReport(period));
            setAiSuggestion(null);
            setAiGroundingMetadata(undefined);
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
            logActivity('AI_QUERY', `AI analyzed sales report (${currentReport.period}). Query: "${reportQuery || 'General'}"`, { period: currentReport.period, query: reportQuery, result: result.text.substring(0, 100) });
            setIsLoadingAi(false);
        };
        const OperationalOverview = () => {
            const activeUnpaidOrders = orders.filter(o => o.status === 'Open' || o.status === 'Modified').sort((a, b) => a.createdAt - b.createdAt);
            const recentlyPaidOrders = orders.filter(o => o.status === 'Paid').sort((a, b) => (b.modifiedAt || 0) - (a.modifiedAt || 0)).slice(0, 10);
            return (_jsxs("div", { className: "mt-6 grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsxs("h5", { className: "text-lg font-semibold mb-2", style: { color: 'var(--text-color)' }, children: ["Active Unpaid Orders (", activeUnpaidOrders.length, ")"] }), activeUnpaidOrders.length === 0 ? _jsx("p", { className: "text-sm", style: { color: 'var(--text-color)', opacity: 0.7 }, children: "No active unpaid orders." }) : (_jsx("div", { className: `rounded shadow-sm max-h-60 overflow-y-auto ${densityCardClass}`, style: { backgroundColor: 'var(--card-background-color)', borderColor: 'var(--border-color)' }, children: activeUnpaidOrders.map(order => (_jsxs("div", { className: "text-xs border-b py-1 mb-1", style: { borderColor: 'var(--border-color)', color: 'var(--card-text-color)' }, children: ["Table: ", tables.find(t => t.id === order.tableId)?.name || 'N/A', " - Total: ", order.grandTotal.toFixed(2), _jsxs("span", { style: { opacity: 0.7 }, children: [" (", new Date(order.createdAt).toLocaleTimeString(), ")"] }), _jsx("button", { onClick: () => { setSelectedTable(tables.find(t => t.id === order.tableId) || null); setCurrentOrder({ ...order }); setIsOrderModalOpen(true); }, className: "ml-2 hover:underline text-xs", style: { color: 'var(--primary-color)' }, children: "View" })] }, order.id))) }))] }), _jsxs("div", { children: [_jsxs("h5", { className: "text-lg font-semibold mb-2", style: { color: 'var(--text-color)' }, children: ["Recently Paid Orders (", recentlyPaidOrders.length, ")"] }), recentlyPaidOrders.length === 0 ? _jsx("p", { className: "text-sm", style: { color: 'var(--text-color)', opacity: 0.7 }, children: "No recently paid orders." }) : (_jsx("div", { className: `rounded shadow-sm max-h-60 overflow-y-auto ${densityCardClass}`, style: { backgroundColor: 'var(--card-background-color)', borderColor: 'var(--border-color)' }, children: recentlyPaidOrders.map(order => (_jsxs("div", { className: "text-xs border-b py-1 mb-1", style: { borderColor: 'var(--border-color)', color: 'var(--card-text-color)' }, children: ["Table: ", tables.find(t => t.id === order.tableId)?.name || 'N/A', " - Total: ", order.grandTotal.toFixed(2), _jsxs("span", { style: { opacity: 0.7 }, children: [" (Paid: ", order.modifiedAt ? new Date(order.modifiedAt).toLocaleTimeString() : 'N/A', ")"] }), _jsx("button", { onClick: () => { handleOpenBill(order); }, className: "ml-2 hover:underline text-xs", style: { color: '#A855F7' }, children: "Receipt" })] }, order.id))) }))] })] }));
        };
        return (_jsxs("div", { style: { color: 'var(--text-color)' }, children: [_jsxs("div", { className: "flex flex-wrap gap-2 mb-4", children: [_jsx("button", { onClick: () => handleGenerateReport('daily'), className: `rounded hover:opacity-80 ${densityButtonClass}`, style: { backgroundColor: 'var(--primary-color)', color: 'var(--button-text-color)' }, children: "Daily Report" }), _jsx("button", { onClick: () => handleGenerateReport('monthly'), className: `rounded hover:opacity-80 ${densityButtonClass}`, style: { backgroundColor: 'var(--primary-color)', color: 'var(--button-text-color)' }, children: "Monthly Report" }), _jsx("button", { onClick: () => handleGenerateReport('yearly'), className: `rounded hover:opacity-80 ${densityButtonClass}`, style: { backgroundColor: 'var(--primary-color)', color: 'var(--button-text-color)' }, children: "Yearly Report" })] }), currentReport && (_jsxs("div", { className: `rounded shadow mb-4 ${densityCardClass}`, style: { backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)' }, children: [_jsxs("h4", { className: "text-lg font-semibold capitalize", children: [currentReport.period, " Sales Report"] }), _jsxs("p", { className: "text-sm", style: { opacity: 0.8 }, children: ["Total Orders: ", currentReport.totalOrders] }), _jsxs("p", { className: "text-sm", style: { opacity: 0.8 }, children: ["Total Revenue: ", currentReport.totalRevenue.toFixed(2)] }), _jsx("h5", { className: "font-semibold mt-3 mb-1", children: "Top Selling Items:" }), currentReport.topSellingItems.length > 0 ? (_jsx("ul", { className: "list-disc list-inside text-sm", style: { opacity: 0.8 }, children: currentReport.topSellingItems.map(item => _jsxs("li", { children: [item.name, " (Qty: ", item.quantity, ")"] }, item.name)) })) : _jsx("p", { className: "text-sm", style: { opacity: 0.7 }, children: "No sales data for top items in this period." }), _jsx("h5", { className: "font-semibold mt-3 mb-1", children: "Sales by Category:" }), currentReport.categorySales.length > 0 ? (_jsx("div", { className: "overflow-x-auto text-sm mt-1", children: _jsxs("table", { className: "min-w-full", children: [_jsx("thead", { style: { backgroundColor: themeSettings.backgroundColor, opacity: 0.9 }, children: _jsxs("tr", { children: [_jsx("th", { className: "px-2 py-1 text-left", children: "Category" }), _jsx("th", { className: "px-2 py-1 text-right", children: "Items Sold" }), _jsx("th", { className: "px-2 py-1 text-right", children: "Revenue" })] }) }), _jsx("tbody", { children: currentReport.categorySales.map(cs => (_jsxs("tr", { className: "border-b", style: { borderColor: 'var(--border-color)' }, children: [_jsx("td", { className: "px-2 py-1", children: cs.categoryName }), _jsx("td", { className: "px-2 py-1 text-right", children: cs.totalItemsSold }), _jsx("td", { className: "px-2 py-1 text-right", children: cs.totalRevenue.toFixed(2) })] }, cs.categoryId))) })] }) })) : _jsx("p", { className: "text-sm", style: { opacity: 0.7 }, children: "No category sales data for this period." }), _jsxs("h5", { className: "font-semibold mt-3 mb-1", children: ["Detailed Item Sales Log (", currentReport.detailedSoldItems.length, " items):"] }), currentReport.detailedSoldItems.length > 0 ? (_jsx("div", { className: `max-h-60 overflow-y-auto text-xs border rounded p-2 mt-1 ${densityCardClass.replace('p-', 'p-2')}`, style: { borderColor: 'var(--border-color)' }, children: _jsxs("table", { className: "min-w-full", children: [_jsx("thead", { style: { backgroundColor: themeSettings.backgroundColor, opacity: 0.9 }, children: _jsxs("tr", { children: [_jsx("th", { className: "px-1 py-1 text-left", children: "Order ID" }), _jsx("th", { className: "px-1 py-1 text-left", children: "Time" }), _jsx("th", { className: "px-1 py-1 text-left", children: "Item" }), _jsx("th", { className: "px-1 py-1 text-right", children: "Qty" }), _jsx("th", { className: "px-1 py-1 text-right", children: "Price" }), _jsx("th", { className: "px-1 py-1 text-right", children: "Total" }), _jsx("th", { className: "px-1 py-1 text-left", children: "Category" })] }) }), _jsx("tbody", { children: currentReport.detailedSoldItems.map((item, idx) => (_jsxs("tr", { className: "border-b", style: { borderColor: 'var(--border-color)' }, children: [_jsx("td", { className: "px-1 py-1", children: item.orderId.substring(0, 5) }), _jsx("td", { className: "px-1 py-1", children: new Date(item.orderCreatedAt).toLocaleTimeString() }), _jsx("td", { className: "px-1 py-1", children: item.name }), _jsx("td", { className: "px-1 py-1 text-right", children: item.quantity }), _jsx("td", { className: "px-1 py-1 text-right", children: item.priceAtOrder.toFixed(2) }), _jsx("td", { className: "px-1 py-1 text-right", children: item.lineTotal.toFixed(2) }), _jsx("td", { className: "px-1 py-1", children: menuCategories.find(mc => mc.id === item.categoryId)?.name || 'N/A' })] }, item.orderId + item.menuItemId + idx))) })] }) })) : _jsx("p", { className: "text-sm", style: { opacity: 0.7 }, children: "No detailed item sales logged for this period." }), _jsxs("div", { className: "mt-4", children: [_jsx("input", { type: "text", value: reportQuery, onChange: e => setReportQuery(e.target.value), placeholder: "Ask AI about this report (e.g., 'suggest promotions')", className: `w-full p-2 border rounded mb-2 text-sm ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2')}`, style: { borderColor: 'var(--border-color)', color: 'var(--text-color)', backgroundColor: 'var(--card-background-color)' } }), _jsx("button", { onClick: handleAskAIAboutReport, className: `rounded text-sm hover:opacity-80 disabled:opacity-50 ${densityButtonClass}`, style: { backgroundColor: isLoadingAi ? '#9CA3AF' : '#A855F7', color: 'var(--button-text-color)' }, disabled: isLoadingAi || !geminiService.isAIAvailable() || !currentReport, children: isLoadingAi ? 'AI Analyzing...' : 'Ask AI for Insights' })] })] })), aiSuggestion && currentReport && (_jsxs("div", { className: `my-4 border rounded-md ${densityCardClass}`, style: { backgroundColor: '#E0E7FF', borderColor: '#C7D2FE', color: '#4338CA' }, children: [" ", _jsx("h5", { className: "font-semibold", children: "AI Sales Analysis:" }), _jsx("p", { className: "text-sm whitespace-pre-wrap", children: aiSuggestion }), aiGroundingMetadata?.groundingChunks && aiGroundingMetadata.groundingChunks.length > 0 && (_jsxs("div", { className: "mt-2 text-xs", children: [_jsx("p", { className: "font-semibold", children: "Sources:" }), aiGroundingMetadata.groundingChunks.map((chunk, index) => (chunk.web?.uri && _jsx("a", { href: chunk.web.uri, target: "_blank", rel: "noopener noreferrer", className: "hover:underline block", style: { color: '#6D28D9' }, children: chunk.web.title || chunk.web.uri }, index)))] }))] })), _jsx(OperationalOverview, {})] }));
    };
    const ActivityLogView = () => {
        const densityCardClass = getDensityPaddingClasses(themeSettings.uiDensity, 'card');
        return (_jsxs("div", { className: `rounded shadow ${densityCardClass}`, style: { backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)' }, children: [_jsx("h4", { className: "text-xl font-semibold mb-4", children: "System Activity Log" }), activityLog.length === 0 ? _jsx("p", { style: { opacity: 0.7 }, children: "No activity logged yet." }) : (_jsx("div", { className: "max-h-[70vh] overflow-y-auto", children: activityLog.map(entry => (_jsxs("div", { className: "mb-3 pb-3 border-b text-sm", style: { borderColor: 'var(--border-color)' }, children: [_jsxs("p", { className: "font-semibold", children: [entry.actionType.replace(/_/g, ' '), _jsxs("span", { className: "text-xs ml-2", style: { opacity: 0.7 }, children: ["(", new Date(entry.timestamp).toLocaleString(), ")"] })] }), _jsx("p", { style: { opacity: 0.9 }, children: entry.description }), entry.user && _jsxs("p", { className: "text-xs", style: { opacity: 0.7 }, children: ["User: ", entry.user.name, " (", entry.user.role, ")"] }), entry.details && typeof entry.details === 'object' && (_jsxs("details", { className: "mt-1 text-xs", children: [_jsx("summary", { className: "cursor-pointer hover:opacity-80", style: { opacity: 0.7 }, children: "Details" }), _jsx("pre", { className: `p-2 rounded mt-1 overflow-x-auto text-xs ${densityCardClass.replace('p-', 'p-2')}`, style: { backgroundColor: themeSettings.backgroundColor, opacity: 0.9 }, children: JSON.stringify(entry.details, null, 2) })] }))] }, entry.id))) }))] }));
    };
    const SeatingSetupManagement = () => {
        const densityButtonClass = getDensityPaddingClasses(themeSettings.uiDensity, 'button');
        const densityCardClass = getDensityPaddingClasses(themeSettings.uiDensity, 'card');
        return (_jsxs("div", { className: `rounded shadow ${densityCardClass}`, style: { backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)' }, children: [_jsx("h4", { className: "text-xl font-semibold mb-4", children: "Manage Seating Areas" }), _jsxs("button", { onClick: () => { setEditingTableConfig({ status: TableStatus.Available, capacity: 2 }); setIsTableEditModalOpen(true); }, className: `mb-6 rounded hover:opacity-80 flex items-center gap-2 ${densityButtonClass}`, style: { backgroundColor: 'var(--primary-color)', color: 'var(--button-text-color)' }, children: [_jsx("span", { className: `${getIconSizeClass(themeSettings.iconSize)}`, dangerouslySetInnerHTML: { __html: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" class="hero-icon"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>` } }), "Add New Seating Area"] }), tables.length === 0 ? _jsx("p", { style: { opacity: 0.7 }, children: "No seating areas defined yet." }) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full", style: { backgroundColor: 'var(--card-background-color)' }, children: [_jsx("thead", { style: { backgroundColor: themeSettings.backgroundColor, opacity: 0.9 }, children: _jsxs("tr", { children: [_jsx("th", { className: `py-2 px-4 text-left text-xs font-medium uppercase ${densityButtonClass.replace(/px-\d+|py-\d+/, 'py-2 px-4').replace('text-sm', 'text-xs')}`, style: { color: 'var(--text-color)' }, children: "Name" }), _jsx("th", { className: `py-2 px-4 text-left text-xs font-medium uppercase ${densityButtonClass.replace(/px-\d+|py-\d+/, 'py-2 px-4').replace('text-sm', 'text-xs')}`, style: { color: 'var(--text-color)' }, children: "Capacity" }), _jsx("th", { className: `py-2 px-4 text-left text-xs font-medium uppercase ${densityButtonClass.replace(/px-\d+|py-\d+/, 'py-2 px-4').replace('text-sm', 'text-xs')}`, style: { color: 'var(--text-color)' }, children: "Current Status" }), _jsx("th", { className: `py-2 px-4 text-left text-xs font-medium uppercase ${densityButtonClass.replace(/px-\d+|py-\d+/, 'py-2 px-4').replace('text-sm', 'text-xs')}`, style: { color: 'var(--text-color)' }, children: "Actions" })] }) }), _jsx("tbody", { className: "divide-y", style: { borderColor: 'var(--border-color)' }, children: tables.map(table => (_jsxs("tr", { children: [_jsx("td", { className: `py-3 px-4 text-sm ${densityButtonClass.replace(/px-\d+|py-\d+/, 'py-3 px-4')}`, children: table.name }), _jsx("td", { className: `py-3 px-4 text-sm ${densityButtonClass.replace(/px-\d+|py-\d+/, 'py-3 px-4')}`, children: table.capacity }), _jsx("td", { className: `py-3 px-4 text-sm ${densityButtonClass.replace(/px-\d+|py-\d+/, 'py-3 px-4')}`, children: _jsx("span", { className: `px-2 py-1 text-xs font-semibold rounded-full
                                            ${table.status === TableStatus.Available ? 'bg-green-100 text-green-700' : ''}
                                            ${table.status === TableStatus.Occupied ? 'bg-red-100 text-red-700' : ''}
                                            ${table.status === TableStatus.Reserved ? 'bg-yellow-100 text-yellow-700' : ''}
                                            ${table.status === TableStatus.Dirty ? 'bg-orange-100 text-orange-700' : ''}
                                            ${table.status === TableStatus.Cleaning ? 'bg-blue-100 text-blue-700' : ''}
                                        `, children: table.status }) }), _jsx("td", { className: `py-3 px-4 text-sm ${densityButtonClass.replace(/px-\d+|py-\d+/, 'py-3 px-4')}`, children: _jsx("button", { onClick: () => { setEditingTableConfig({ ...table }); setIsTableEditModalOpen(true); }, className: "font-medium hover:underline", style: { color: 'var(--primary-color)' }, children: "Edit" }) })] }, table.id))) })] }) }))] }));
    };
    const TableEditModalContent = () => {
        if (!editingTableConfig)
            return null;
        const densityButtonClass = getDensityPaddingClasses(themeSettings.uiDensity, 'button');
        const densityModalContentClass = getDensityPaddingClasses(themeSettings.uiDensity, 'modalContent');
        return (_jsxs("div", { className: `space-y-4 ${densityModalContentClass}`, style: { color: 'var(--card-text-color)' }, children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "tableName", className: "block text-sm font-medium", children: "Seating Area Name" }), _jsx("input", { type: "text", id: "tableName", placeholder: "e.g., Table 5, Bar Seat 3", value: editingTableConfig.name || '', onChange: e => setEditingTableConfig({ ...editingTableConfig, name: e.target.value }), className: `mt-1 w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2')}`, style: { borderColor: 'var(--border-color)', backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)' } })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "tableCapacity", className: "block text-sm font-medium", children: "Capacity" }), _jsx("input", { type: "number", id: "tableCapacity", placeholder: "Number of guests", value: editingTableConfig.capacity || '', min: "1", onChange: e => setEditingTableConfig({ ...editingTableConfig, capacity: parseInt(e.target.value) || 1 }), className: `mt-1 w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2')}`, style: { borderColor: 'var(--border-color)', backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)' } })] }), editingTableConfig.id && (_jsxs("div", { children: [_jsx("label", { htmlFor: "tableStatusEdit", className: "block text-sm font-medium", children: "Status" }), _jsx("select", { id: "tableStatusEdit", value: editingTableConfig.status || TableStatus.Available, onChange: e => setEditingTableConfig({ ...editingTableConfig, status: e.target.value }), className: `mt-1 w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2')}`, style: { borderColor: 'var(--border-color)', backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)' }, children: Object.values(TableStatus).map(status => (_jsx("option", { value: status, children: status }, status))) }), _jsx("p", { className: "text-xs mt-1", style: { opacity: 0.7 }, children: "Note: Status changes here are for configuration. For operational status changes (Occupied, Cleaning etc.), use the main POS view." })] })), _jsxs("div", { className: "flex justify-end gap-3 pt-3", children: [_jsx("button", { onClick: () => { setIsTableEditModalOpen(false); setEditingTableConfig(null); }, className: `rounded-md hover:opacity-80 ${densityButtonClass}`, style: { backgroundColor: '#D1D5DB', color: 'var(--text-color)' }, children: "Cancel" }), _jsx("button", { onClick: handleSaveTableConfig, className: `rounded-md hover:opacity-80 ${densityButtonClass}`, style: { backgroundColor: 'var(--primary-color)', color: 'var(--button-text-color)' }, children: "Save Seating Area" })] })] }));
    };
    const ThemeCustomizationView = () => {
        const [currentTheme, setCurrentTheme] = useState(themeSettings);
        const densityButtonClass = getDensityPaddingClasses(themeSettings.uiDensity, 'button');
        const densityCardClass = getDensityPaddingClasses(themeSettings.uiDensity, 'card');
        const handleThemeChange = (field, value) => {
            setCurrentTheme(prev => ({ ...prev, [field]: value }));
        };
        const handleSaveTheme = () => {
            const oldTheme = { ...themeSettings };
            setThemeSettings(currentTheme);
            logActivity('THEME_UPDATED', 'App theme settings were updated.', { newSettings: currentTheme, oldSettings: oldTheme });
            if (currentTheme.iconSize !== oldTheme.iconSize)
                logActivity('ICON_SIZE_UPDATED', `Icon size changed to ${currentTheme.iconSize}`, { newValue: currentTheme.iconSize, oldValue: oldTheme.iconSize });
            if (currentTheme.kitchenDisplayScale !== oldTheme.kitchenDisplayScale)
                logActivity('KITCHEN_SCALE_UPDATED', `Kitchen display scale changed to ${currentTheme.kitchenDisplayScale}`, { newValue: currentTheme.kitchenDisplayScale, oldValue: oldTheme.kitchenDisplayScale });
            if (currentTheme.uiDensity !== oldTheme.uiDensity)
                logActivity('UI_DENSITY_UPDATED', `UI density changed to ${currentTheme.uiDensity}`, { newValue: currentTheme.uiDensity, oldValue: oldTheme.uiDensity });
            if (currentTheme.contentScale !== oldTheme.contentScale)
                logActivity('CONTENT_SCALE_UPDATED', `Content view scale changed to ${currentTheme.contentScale}`, { newValue: currentTheme.contentScale, oldValue: oldTheme.contentScale });
            if (currentTheme.globalPageScale !== oldTheme.globalPageScale)
                logActivity('GLOBAL_PAGE_SCALE_UPDATED', `Global page scale changed to ${currentTheme.globalPageScale}`, { newValue: currentTheme.globalPageScale, oldValue: oldTheme.globalPageScale });
            alert('Theme settings saved! Changes will be applied globally.');
        };
        const inputStyle = { borderColor: 'var(--border-color)', backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)' };
        const labelStyle = { color: 'var(--text-color)', opacity: 0.9 };
        return (_jsxs("div", { className: `rounded shadow ${densityCardClass}`, style: { backgroundColor: 'var(--card-background-color)', color: 'var(--card-text-color)' }, children: [_jsx("h4", { className: "text-xl font-semibold mb-6", children: "Customize App Theme" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: [Object.keys(currentTheme)
                            .filter(key => key.toLowerCase().includes('color'))
                            .map(key => (_jsxs("div", { children: [_jsx("label", { htmlFor: key, className: "block text-sm font-medium capitalize", style: labelStyle, children: key.replace(/([A-Z])/g, ' $1').trim() }), _jsx("input", { type: "color", id: key, value: currentTheme[key], onChange: e => handleThemeChange(key, e.target.value), className: `mt-1 w-full h-10 p-1 border rounded-md ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-1 h-10')}`, style: { ...inputStyle, appearance: 'none' } })] }, key))), _jsxs("div", { children: [_jsx("label", { htmlFor: "fontSizeBase", className: "block text-sm font-medium", style: labelStyle, children: "Base Font Size" }), _jsxs("select", { id: "fontSizeBase", value: currentTheme.fontSizeBase, onChange: e => handleThemeChange('fontSizeBase', e.target.value), className: `mt-1 w-full p-2.5 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2.5')}`, style: inputStyle, children: [_jsx("option", { value: "text-xs", children: "Extra Small" }), _jsx("option", { value: "text-sm", children: "Small" }), _jsx("option", { value: "text-base", children: "Medium (Default)" }), _jsx("option", { value: "text-lg", children: "Large" })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "fontFamily", className: "block text-sm font-medium", style: labelStyle, children: "Font Family" }), _jsxs("select", { id: "fontFamily", value: currentTheme.fontFamily, onChange: e => handleThemeChange('fontFamily', e.target.value), className: `mt-1 w-full p-2.5 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2.5')}`, style: inputStyle, children: [_jsx("option", { value: "sans-serif", children: "Sans-serif (Default)" }), _jsx("option", { value: "serif", children: "Serif" }), _jsx("option", { value: "monospace", children: "Monospace" }), _jsx("option", { value: "Arial, sans-serif", children: "Arial" }), _jsx("option", { value: "'Times New Roman', Times, serif", children: "Times New Roman" }), _jsx("option", { value: "'Courier New', Courier, monospace", children: "Courier New" })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "iconSize", className: "block text-sm font-medium", style: labelStyle, children: "Icon Size" }), _jsxs("select", { id: "iconSize", value: currentTheme.iconSize, onChange: e => handleThemeChange('iconSize', e.target.value), className: `mt-1 w-full p-2.5 border rounded-md shadow-sm ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2.5')}`, style: inputStyle, children: [_jsx("option", { value: "icon-sm", children: "Small Icons" }), _jsx("option", { value: "icon-md", children: "Medium Icons (Default)" }), _jsx("option", { value: "icon-lg", children: "Large Icons" })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "kitchenDisplayScale", className: "block text-sm font-medium", style: labelStyle, children: "Kitchen Display Scale" }), _jsxs("select", { id: "kitchenDisplayScale", value: currentTheme.kitchenDisplayScale, onChange: e => handleThemeChange('kitchenDisplayScale', e.target.value), className: `mt-1 w-full p-2.5 border rounded-md shadow-sm ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2.5')}`, style: inputStyle, children: [_jsx("option", { value: "scale-75", children: "75%" }), _jsx("option", { value: "scale-90", children: "90%" }), _jsx("option", { value: "scale-100", children: "100% (Default)" }), _jsx("option", { value: "scale-110", children: "110%" }), _jsx("option", { value: "scale-125", children: "125%" })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "uiDensity", className: "block text-sm font-medium", style: labelStyle, children: "UI Density (Padding)" }), _jsxs("select", { id: "uiDensity", value: currentTheme.uiDensity, onChange: e => handleThemeChange('uiDensity', e.target.value), className: `mt-1 w-full p-2.5 border rounded-md shadow-sm ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2.5')}`, style: inputStyle, children: [_jsx("option", { value: "compact", children: "Compact" }), _jsx("option", { value: "normal", children: "Normal (Default)" }), _jsx("option", { value: "spacious", children: "Spacious" })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "contentScale", className: "block text-sm font-medium", style: labelStyle, children: "Content View Scale" }), _jsxs("select", { id: "contentScale", value: currentTheme.contentScale, onChange: e => handleThemeChange('contentScale', e.target.value), className: `mt-1 w-full p-2.5 border rounded-md shadow-sm ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2.5')}`, style: inputStyle, children: [_jsx("option", { value: "scale-75", children: "75% (Smallest)" }), _jsx("option", { value: "scale-90", children: "90% (Smaller)" }), _jsx("option", { value: "scale-100", children: "100% (Default)" }), _jsx("option", { value: "scale-110", children: "110% (Larger)" }), _jsx("option", { value: "scale-125", children: "125% (Largest)" })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "globalPageScale", className: "block text-sm font-medium", style: labelStyle, children: "Global Page Scale" }), _jsxs("select", { id: "globalPageScale", value: currentTheme.globalPageScale, onChange: e => handleThemeChange('globalPageScale', e.target.value), className: `mt-1 w-full p-2.5 border rounded-md shadow-sm ${densityButtonClass.replace(/px-\d+|py-\d+/, 'p-2.5')}`, style: inputStyle, children: [_jsx("option", { value: "scale-75", children: "75%" }), _jsx("option", { value: "scale-90", children: "90%" }), _jsx("option", { value: "scale-100", children: "100% (Default)" }), _jsx("option", { value: "scale-110", children: "110%" }), _jsx("option", { value: "scale-125", children: "125%" })] })] })] }), _jsx("div", { className: "mt-8 flex justify-end", children: _jsx("button", { onClick: handleSaveTheme, className: `rounded-md hover:opacity-80 ${densityButtonClass}`, style: { backgroundColor: 'var(--primary-color)', color: 'var(--button-text-color)' }, children: "Save Theme" }) })] }));
    };
    const ManagementView = () => {
        const navDensityClass = getDensityPaddingClasses(themeSettings.uiDensity, 'navButton');
        const navItems = [
            { name: 'Menu', icon: MENU_ICON_SVG, view: 'Menu' },
            { name: 'Inventory', icon: INVENTORY_ICON_SVG, view: 'Inventory' },
            { name: 'Seating Setup', icon: SEATING_CONFIG_ICON_SVG, view: 'SeatingSetup' },
            { name: 'Theme Settings', icon: THEME_SETTINGS_ICON_SVG, view: 'ThemeSettings' },
            { name: 'Reports & Analytics', icon: REPORTS_ICON_SVG, view: 'Reports' },
            { name: 'Kitchen Overview', icon: KITCHEN_DASHBOARD_ICON_SVG, view: 'KitchenOverview' },
            { name: 'Activity Log', icon: ACTIVITY_LOG_ICON_SVG, view: 'ActivityLog' },
        ];
        return (_jsxs("div", { className: `${getDensityPaddingClasses(themeSettings.uiDensity, 'card')}`, style: { color: 'var(--text-color)' }, children: [_jsx("h3", { className: "text-2xl font-bold mb-6", children: "Management Dashboard" }), _jsx("div", { className: "flex flex-wrap border-b mb-6", style: { borderColor: 'var(--border-color)' }, children: navItems.map(item => (_jsxs("button", { onClick: () => setManagementSubView(item.view), className: `flex items-center gap-2 font-medium transition-colors ${navDensityClass}
                        ${managementSubView === item.view ? 'border-b-2' : 'hover:opacity-80'}`, style: {
                            borderColor: managementSubView === item.view ? 'var(--primary-color)' : 'transparent',
                            color: managementSubView === item.view ? 'var(--primary-color)' : 'var(--text-color)',
                            opacity: managementSubView === item.view ? 1 : 0.7,
                        }, children: [_jsx("span", { className: `${getIconSizeClass(themeSettings.iconSize)}`, dangerouslySetInnerHTML: { __html: item.icon } }), " ", item.name] }, item.view))) }), managementSubView === 'Menu' && _jsx(MenuItemManagement, {}), managementSubView === 'Inventory' && _jsx(InventoryManagement, {}), managementSubView === 'SeatingSetup' && _jsx(SeatingSetupManagement, {}), managementSubView === 'ThemeSettings' && _jsx(ThemeCustomizationView, {}), managementSubView === 'Reports' && _jsx(ReportAndAnalytics, {}), managementSubView === 'KitchenOverview' && _jsx(KitchenDashboardView, { isOwnerView: true }), managementSubView === 'ActivityLog' && _jsx(ActivityLogView, {})] }));
    };
    const MainLayout = ({ children }) => {
        const densityNavButtonClass = getDensityPaddingClasses(themeSettings.uiDensity, 'navButton');
        return (_jsxs("div", { className: "flex flex-col min-h-screen", children: [_jsxs("header", { className: `p-4 shadow-md flex justify-between items-center ${getDensityPaddingClasses(themeSettings.uiDensity, 'card')}`, style: { backgroundColor: 'var(--header-background-color)', color: 'var(--header-text-color)' }, children: [_jsx("h1", { className: "text-2xl font-bold", children: APP_NAME }), currentUser && (_jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("span", { className: "text-sm", children: ["Welcome, ", currentUser.name, " (", currentUser.role, ")"] }), _jsxs("button", { onClick: handleLogout, className: `rounded text-sm flex items-center gap-1 hover:opacity-80 ${getDensityPaddingClasses(themeSettings.uiDensity, 'button')}`, style: { backgroundColor: '#DC2626', color: 'var(--button-text-color)' }, children: [_jsx("span", { className: `${getIconSizeClass(themeSettings.iconSize)}`, dangerouslySetInnerHTML: { __html: LOGOUT_ICON_SVG } }), " Logout"] })] }))] }), currentUser && currentUser.role !== 'kitchen' && (_jsx("nav", { className: "shadow-sm flex justify-center sticky top-0 z-40", style: { backgroundColor: 'var(--card-background-color)', borderBottom: `1px solid var(--border-color)` }, children: [
                        { view: 'POS', label: 'Point of Sale', icon: POS_ICON_SVG },
                        { view: 'KDS', label: 'Kitchen Display', icon: KDS_ICON_SVG },
                        ...(currentUser.role === 'owner' ? [{ view: 'Management', label: 'Management', icon: MANAGEMENT_ICON_SVG }] : [])
                    ].map(navItem => (_jsxs("button", { onClick: () => setCurrentView(navItem.view), className: `font-medium flex items-center gap-2 transition-colors ${densityNavButtonClass}
                        ${currentView === navItem.view ? 'border-b-2' : 'hover:opacity-80'}`, style: {
                            borderColor: currentView === navItem.view ? 'var(--primary-color)' : 'transparent',
                            color: currentView === navItem.view ? 'var(--primary-color)' : 'var(--text-color)',
                            opacity: currentView !== navItem.view ? 0.7 : 1,
                        }, children: [_jsx("span", { className: `${getIconSizeClass(themeSettings.iconSize)}`, dangerouslySetInnerHTML: { __html: navItem.icon } }), " ", navItem.label] }, navItem.view))) })), _jsx("main", { className: "flex-grow", children: _jsx("div", { className: `${themeSettings.globalPageScale} transform-origin-top`, style: { transformOrigin: 'top' }, children: children }) }), _jsxs("footer", { className: `text-center p-3 text-xs ${getDensityPaddingClasses(themeSettings.uiDensity, 'card').replace('p-4', 'p-3')}`, style: { backgroundColor: 'var(--header-background-color)', color: 'var(--header-text-color)', opacity: 0.8 }, children: ["\u00A9 ", new Date().getFullYear(), " ", APP_NAME, ". For demonstration purposes only."] })] }));
    };
    const renderView = () => {
        if (!currentUser)
            return _jsx(LoginView, {});
        switch (currentView) {
            case 'POS': return _jsx(TableView, {});
            case 'KDS': return _jsx(KDSView, {});
            case 'Management': return currentUser.role === 'owner' ? _jsx(ManagementView, {}) : _jsx("p", { className: "p-4 text-red-500", children: "Access Denied." });
            case 'KitchenDashboard': return currentUser.role === 'kitchen' ? _jsx(KitchenDashboardView, {}) : _jsx("p", { className: "p-4 text-red-500", children: "Access Denied. This view is for Kitchen Staff." });
            default: return _jsx(LoginView, {});
        }
    };
    return (_jsxs(_Fragment, { children: [_jsx(MainLayout, { children: renderView() }), isOrderModalOpen && (_jsx(Modal, { isOpen: isOrderModalOpen, onClose: () => { setIsOrderModalOpen(false); setSelectedTable(null); setCurrentOrder(null); }, title: `Order for ${selectedTable?.name || 'Table'}`, size: "xl", children: _jsx(OrderModalContent, {}) })), isBillModalOpen && currentBill && (_jsx(Modal, { isOpen: isBillModalOpen, onClose: () => { setIsBillModalOpen(false); setCurrentBill(null); }, title: currentBill.paidAt ? "Receipt" : "Bill", size: "md", children: _jsx(BillModalContent, {}) })), isTableStatusModalOpen && editingTableForStatus && (_jsx(Modal, { isOpen: isTableStatusModalOpen, onClose: () => { setIsTableStatusModalOpen(false); setEditingTableForStatus(null); }, title: `Manage Table: ${editingTableForStatus.name}`, size: "sm", children: _jsx(TableStatusModalContent, {}) })), isTableEditModalOpen && editingTableConfig && (_jsx(Modal, { isOpen: isTableEditModalOpen, onClose: () => { setIsTableEditModalOpen(false); setEditingTableConfig(null); }, title: editingTableConfig.id ? "Edit Seating Area" : "Add New Seating Area", size: "md", children: _jsx(TableEditModalContent, {}) }))] }));
};
export default App;
