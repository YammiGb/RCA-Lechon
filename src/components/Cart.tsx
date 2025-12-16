import React from 'react';
import { Trash2, Plus, Minus, ArrowLeft } from 'lucide-react';
import { CartItem } from '../types';

interface CartProps {
  cartItems: CartItem[];
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  onContinueShopping: () => void;
  onCheckout: () => void;
}

const Cart: React.FC<CartProps> = ({
  cartItems,
  updateQuantity,
  removeFromCart,
  clearCart,
  getTotalPrice,
  onContinueShopping,
  onCheckout
}) => {
  if (cartItems.length === 0) {
  return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🍗</div>
          <h2 className="text-2xl font-playfair font-medium text-rca-green mb-2">Your cart is empty</h2>
          <p className="text-rca-text-light mb-6">Add some delicious RCA Lechon items to get started!</p>
          <button
            onClick={onContinueShopping}
            className="bg-rca-red text-white px-6 py-3 rounded-full hover:bg-rca-red-dark transition-all duration-200"
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 bg-rca-off-white">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onContinueShopping}
          aria-label="Back"
          className="flex items-center text-rca-text-light hover:text-rca-red transition-colors duration-200"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-3xl font-playfair font-semibold text-rca-green whitespace-nowrap">Your Cart</h1>
        <button
          onClick={clearCart}
          className="text-rca-red hover:text-rca-red-dark transition-colors duration-200 whitespace-nowrap"
        >
          Clear All
        </button>
      </div>

      <div className="bg-rca-off-white rounded-xl shadow-sm overflow-hidden mb-8 border border-rca-green/20">
        {cartItems.map((item, index) => (
          <div key={item.id} className={`p-6 ${index !== cartItems.length - 1 ? 'border-b border-rca-green/20' : ''}`}>
            <div className="flex">
              <div className="flex-1">
                <h3 className="text-lg font-playfair font-medium text-rca-green mb-1">{item.name}</h3>
                {item.selectedVariation && (
                  <p className="text-sm text-gray-500 mb-1">Size: {item.selectedVariation.name}</p>
                )}
                {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                  <p className="text-sm text-gray-500 mb-1">
                    Add-ons: {item.selectedAddOns.map(addOn => 
                      addOn.quantity && addOn.quantity > 1 
                        ? `${addOn.name} x${addOn.quantity}`
                        : addOn.name
                    ).join(', ')}
                  </p>
                )}
                <p className="text-lg font-semibold text-rca-green">₱{item.totalPrice} each</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-3 bg-rca-off-white rounded-full p-1 border border-rca-green/20">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  title="Decrease quantity"
                  aria-label="Decrease quantity"
                  className="p-2 hover:bg-rca-green/10 rounded-full transition-colors duration-200"
                >
                  <Minus className="h-4 w-4 text-rca-red" />
                </button>
                <span className="font-semibold text-rca-green min-w-[32px] text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  title="Increase quantity"
                  aria-label="Increase quantity"
                  className="p-2 hover:bg-rca-green/10 rounded-full transition-colors duration-200"
                >
                  <Plus className="h-4 w-4 text-rca-red" />
                </button>
              </div>

              <div className="flex items-center space-x-4 ml-auto">
                <p className="text-lg font-semibold text-rca-green">₱{item.totalPrice * item.quantity}</p>
                <button
                  onClick={() => removeFromCart(item.id)}
                  title="Remove item"
                  aria-label="Remove item from cart"
                  className="p-2 text-rca-red hover:text-rca-red-dark hover:bg-rca-off-white rounded-full transition-all duration-200"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-cafe-light rounded-xl shadow-sm p-6 border border-cafe-latte">
        <div className="flex items-center justify-between text-2xl font-playfair font-semibold text-cafe-dark mb-6">
          <span>Total:</span>
          <span className="text-cafe-accent">₱{getTotalPrice().toFixed(2)}</span>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onContinueShopping}
            className="flex-1 bg-rca-green text-white py-4 rounded-xl hover:bg-rca-green-dark transition-all duration-200 transform hover:scale-[1.02] font-medium text-lg"
          >
            Add More
          </button>
          <button
            onClick={onCheckout}
            className="flex-1 bg-cafe-accent text-white py-4 rounded-xl hover:bg-cafe-espresso transition-all duration-200 transform hover:scale-[1.02] font-medium text-lg"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;