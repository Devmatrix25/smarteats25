import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,

            setAuth: (user, accessToken, refreshToken) => {
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);
                set({
                    user,
                    accessToken,
                    refreshToken,
                    isAuthenticated: true,
                });
            },

            updateUser: (userData) => {
                set((state) => ({
                    user: { ...state.user, ...userData },
                }));
            },

            logout: () => {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                set({
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                    isAuthenticated: false,
                });
            },

            checkAuth: () => {
                const token = localStorage.getItem('accessToken');
                const refreshToken = localStorage.getItem('refreshToken');
                if (token && refreshToken) {
                    set({
                        accessToken: token,
                        refreshToken,
                        isAuthenticated: true,
                    });
                    return true;
                }
                return false;
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);

export const useCartStore = create((set, get) => ({
    items: [],
    restaurant: null,
    total: 0,

    addItem: (item, restaurant) => {
        const currentRestaurant = get().restaurant;

        // If adding from different restaurant, clear cart
        if (currentRestaurant && currentRestaurant.id !== restaurant.id) {
            if (!confirm('Adding items from a different restaurant will clear your cart. Continue?')) {
                return;
            }
            set({ items: [], restaurant: null, total: 0 });
        }

        set((state) => {
            const existingItemIndex = state.items.findIndex(
                (i) => i.id === item.id && JSON.stringify(i.customizations) === JSON.stringify(item.customizations)
            );

            let newItems;
            if (existingItemIndex >= 0) {
                newItems = [...state.items];
                newItems[existingItemIndex].quantity += item.quantity;
            } else {
                newItems = [...state.items, item];
            }

            const newTotal = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

            return {
                items: newItems,
                restaurant: restaurant,
                total: newTotal,
            };
        });
    },

    removeItem: (itemId) => {
        set((state) => {
            const newItems = state.items.filter((i) => i.id !== itemId);
            const newTotal = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

            return {
                items: newItems,
                total: newTotal,
                restaurant: newItems.length === 0 ? null : state.restaurant,
            };
        });
    },

    updateQuantity: (itemId, quantity) => {
        set((state) => {
            const newItems = state.items.map((i) =>
                i.id === itemId ? { ...i, quantity } : i
            );
            const newTotal = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

            return {
                items: newItems,
                total: newTotal,
            };
        });
    },

    clearCart: () => {
        set({ items: [], restaurant: null, total: 0 });
    },
}));

export const useNotificationStore = create((set) => ({
    notifications: [],
    unreadCount: 0,

    addNotification: (notification) => {
        set((state) => ({
            notifications: [notification, ...state.notifications],
            unreadCount: state.unreadCount + 1,
        }));
    },

    markAsRead: (notificationId) => {
        set((state) => ({
            notifications: state.notifications.map((n) =>
                n.id === notificationId ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
        }));
    },

    markAllAsRead: () => {
        set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, read: true })),
            unreadCount: 0,
        }));
    },

    setNotifications: (notifications) => {
        const unread = notifications.filter((n) => !n.read).length;
        set({
            notifications,
            unreadCount: unread,
        });
    },
}));
