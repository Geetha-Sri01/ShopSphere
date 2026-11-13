import React, { useState } from 'react';
import Navbar from './components/Navbar';
import CartDrawer from './components/CartDrawer';
import SearchBar from './components/SearchBar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import AdminDashboard from './pages/AdminDashboard';
import { CartProvider, useCart } from './context/CartContext';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('home'); // 'home' | 'checkout' | 'order_success' | 'admin'
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [lastPlacedOrder, setLastPlacedOrder] = useState(null);
  const { toastMessage } = useCart();

  const handleOrderSuccess = (order) => {
    setLastPlacedOrder(order);
    setCurrentPage('order_success');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className={`px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-2 text-xs font-bold border ${
            toastMessage.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : toastMessage.type === 'warning'
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-indigo-600 text-white border-indigo-700'
          }`}>
            {toastMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : toastMessage.type === 'warning' ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Navigation Header */}
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        activeTab={currentPage}
        setActiveTab={setCurrentPage}
        onNavigate={(page) => setCurrentPage(page)}
      />

      {/* Main Page Body */}
      <main className="flex-1">
        {currentPage === 'home' && (
          <HomePage onOpenSearch={() => setIsSearchOpen(true)} />
        )}

        {currentPage === 'checkout' && (
          <CheckoutPage
            onBackToStore={() => setCurrentPage('home')}
            onOrderSuccess={handleOrderSuccess}
          />
        )}

        {currentPage === 'order_success' && (
          <OrderSuccessPage
            order={lastPlacedOrder}
            onContinueShopping={() => setCurrentPage('home')}
            onViewAdmin={() => setCurrentPage('admin')}
          />
        )}

        {currentPage === 'admin' && (
          <AdminDashboard
            onReturnToStore={() => setCurrentPage('home')}
          />
        )}
      </main>

      {/* Global Typo-Tolerant OpenSearch Modal */}
      <SearchBar
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectProduct={(product) => {
          // If needed, view in details
        }}
      />

      {/* Global Slide-Over Shopping Cart */}
      <CartDrawer
        onProceedToCheckout={() => setCurrentPage('checkout')}
      />

      {/* Store Footer */}
      <Footer
        onSelectCategory={() => setCurrentPage('home')}
        onNavigateToAdmin={() => setCurrentPage('admin')}
      />

    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <AppContent />
    </CartProvider>
  );
}
