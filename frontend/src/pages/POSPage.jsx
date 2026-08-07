import React, { useEffect, useState } from 'react';
import { Plus, Minus, Trash2, ShoppingBag, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useApi } from '../hooks/useApi';
import api from '../services/api';
import { formatCurrency, formatDateTime } from '../utils/formatCurrency';
import { PAYMENT_METHODS } from '../utils/constants';

export default function POSPage() {
  const [cart, setCart] = useState([]); // [{menuItem, quantity}]
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [lastSale, setLastSale] = useState(null);

  const { data: menuItems, execute: fetchMenu, loading } = useApi(api.getMenuItems);
  const { execute: processSale, loading: processing } = useApi(api.processSale);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  // Only show active items
  const activeItems = menuItems?.filter(m => m.isActive) || [];
  
  // Group by category for tabs (optional feature, currently showing all)
  
  const addToCart = (menu) => {
    const existing = cart.find(item => item.menuItem.id === menu.id);
    if (existing) {
      setCart(cart.map(item => 
        item.menuItem.id === menu.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      setCart([...cart, { menuItem: menu, quantity: 1 }]);
    }
  };

  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => {
      if (item.menuItem.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.menuItem.id !== id));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.menuItem.sellingPrice * item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    try {
      const payload = {
        paymentMethod,
        items: cart.map(c => ({
          menuItemId: c.menuItem.id,
          quantity: c.quantity
        }))
      };
      
      const result = await processSale(payload);
      setLastSale(result);
      setCart([]);
      setIsReceiptModalOpen(true);
      // Re-fetch menu to potentially update visually (if we had stock counts on menu)
    } catch (err) {
      alert(err.message || 'Gagal memproses transaksi. Cek stok bahan baku.');
    }
  };

  const handleNewSale = () => {
    setIsReceiptModalOpen(false);
    setLastSale(null);
  };

  if (loading && !menuItems) {
    return <div className="loading-container"><div className="spinner"></div></div>;
  }

  return (
    <div className="pos-layout fade-in">
      {/* Left Area: Menu Grid */}
      <div>
        <div className="page-header" style={{ marginBottom: '16px' }}>
          <h1 style={{ fontSize: '1.5rem' }}>Menu Kasir</h1>
        </div>

        <div className="pos-menu-grid">
          {activeItems.map(menu => {
            const inCart = cart.some(c => c.menuItem.id === menu.id);
            return (
              <div 
                key={menu.id} 
                className={`pos-menu-card ${inCart ? 'in-cart' : ''}`}
                onClick={() => addToCart(menu)}
              >
                <div className="pos-menu-icon">
                  {menu.name.charAt(0)}
                </div>
                <div className="pos-menu-name">{menu.name}</div>
                <div className="pos-menu-price">{formatCurrency(menu.sellingPrice)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Area: Cart Sidebar */}
      <div className="pos-cart">
        <div className="pos-cart-header">
          <h3>Pesanan Saat Ini</h3>
        </div>

        <div className="pos-cart-items">
          {cart.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <ShoppingBag size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
              <p>Belum ada menu yang dipilih.</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.menuItem.id} className="pos-cart-item">
                <div className="pos-cart-item-info">
                  <div className="pos-cart-item-name">{item.menuItem.name}</div>
                  <div className="pos-cart-item-price">{formatCurrency(item.menuItem.sellingPrice * item.quantity)}</div>
                </div>
                <div className="pos-cart-item-qty">
                  <button onClick={() => updateQuantity(item.menuItem.id, -1)}><Minus size={14} /></button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.menuItem.id, 1)}><Plus size={14} /></button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pos-cart-footer">
          <div className="pos-cart-total">
            <span className="pos-cart-total-label">Total Tagihan</span>
            <span className="pos-cart-total-value">{formatCurrency(cartTotal)}</span>
          </div>

          <div className="pos-payment-methods">
            {PAYMENT_METHODS.map(pm => (
              <button 
                key={pm.value}
                className={`pos-payment-btn ${paymentMethod === pm.value ? 'active' : ''}`}
                onClick={() => setPaymentMethod(pm.value)}
              >
                {pm.label}
              </button>
            ))}
          </div>

          <Button 
            className="pos-checkout-btn" 
            disabled={cart.length === 0}
            loading={processing}
            onClick={handleCheckout}
          >
            Bayar Pesanan ({totalItems} item)
          </Button>
        </div>
      </div>

      {/* Receipt Modal */}
      <Modal 
        isOpen={isReceiptModalOpen} 
        onClose={handleNewSale}
        title="Transaksi Berhasil"
      >
        {lastSale && (
          <div className="receipt">
            <div className="receipt-success mb-4">
              <CheckCircle size={32} />
              <span className="text-xl">Pembayaran Diterima</span>
            </div>
            
            <div className="bg-surface-alt p-6 rounded-lg mx-auto max-w-sm">
              <div className="receipt-logo">MunchFlow</div>
              <div>Invoice: {lastSale.invoiceNumber}</div>
              <div className="text-xs text-gray-500 mb-2">{formatDateTime(lastSale.createdAt)}</div>
              <div>Metode: <span className="uppercase font-semibold">{lastSale.paymentMethod}</span></div>
              
              <hr className="receipt-divider" />
              
              <div className="receipt-items">
                {lastSale.items.map((item, idx) => (
                  <div key={idx} className="receipt-item">
                    <div>
                      <div>{item.menuName}</div>
                      <div className="text-xs text-gray-500">{item.quantity} x {formatCurrency(item.unitPrice)}</div>
                    </div>
                    <div className="font-semibold">{formatCurrency(item.subtotal)}</div>
                  </div>
                ))}
              </div>

              <hr className="receipt-divider" />
              
              <div className="receipt-total">
                <span>TOTAL</span>
                <span className="text-primary text-xl">{formatCurrency(lastSale.totalAmount)}</span>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <Button onClick={handleNewSale} className="w-full max-w-sm">
                Transaksi Baru
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
