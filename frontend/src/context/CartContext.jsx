import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

const CART_STORAGE_KEY = 'shopsphere_cart_items_v1';

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn('Failed to parse cart items from storage:', e);
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.warn('Failed to save cart items to storage:', e);
    }
  }, [cartItems]);

  const showToast = (msg, type = 'info') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  /**
   * Add product to cart with strict stock validation
   */
  const addToCart = (product, quantity = 1) => {
    const existingIndex = cartItems.findIndex(item => item.id === product.id);
    const currentQty = existingIndex > -1 ? cartItems[existingIndex].quantity : 0;
    const requestedQty = currentQty + quantity;

    if (product.stock <= 0) {
      showToast(`Sorry, "${product.name}" is currently out of stock.`, 'error');
      return false;
    }

    if (requestedQty > product.stock) {
      showToast(
        `Cannot add more. Only ${product.stock} units available in stock for "${product.name}".`,
        'warning'
      );
      return false;
    }

    if (existingIndex > -1) {
      const updated = [...cartItems];
      updated[existingIndex].quantity = requestedQty;
      setCartItems(updated);
    } else {
      setCartItems([
        ...cartItems,
        {
          id: product.id,
          name: product.name,
          price: parseFloat(product.price),
          image_url: product.image_url,
          stock: product.stock,
          category_name: product.category_name,
          quantity
        }
      ]);
    }

    showToast(`Added "${product.name}" to your cart!`, 'success');
    return true;
  };

  /**
   * Update quantity directly with stock bound checks
   */
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const item = cartItems.find(i => i.id === productId);
    if (!item) return;

    if (newQuantity > item.stock) {
      showToast(`Maximum available stock reached (${item.stock} available).`, 'warning');
      return;
    }

    setCartItems(prev =>
      prev.map(i => (i.id === productId ? { ...i, quantity: newQuantity } : i))
    );
  };

  /**
   * Remove item from cart
   */
  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(i => i.id !== productId));
    showToast('Item removed from cart', 'info');
  };

  /**
   * Clear all items in cart (after successful order)
   */
  const clearCart = () => {
    setCartItems([]);
  };

  // Calculations
  const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.05 * 100) / 100; // 5% GST
  const shipping = subtotal > 999 || subtotal === 0 ? 0 : 99; // Free shipping over ₹999
  const total = Math.round((subtotal + tax + shipping) * 100) / 100;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        itemCount,
        subtotal,
        tax,
        shipping,
        total,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        toastMessage
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
