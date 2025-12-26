import React from 'react';
import { MenuItem, CartItem } from '../types';
import { useCategories } from '../hooks/useCategories';
import { DateAvailability } from '../hooks/useDateAvailability';
import MenuItemCard from './MenuItemCard';

// Preload images for better performance
const preloadImages = (items: MenuItem[]) => {
  items.forEach(item => {
    if (item.image) {
      const img = new Image();
      img.src = item.image;
    }
  });
};

interface MenuProps {
  menuItems: MenuItem[];
  addToCart: (item: MenuItem, quantity?: number, variation?: any, addOns?: any[]) => void;
  cartItems: CartItem[];
  updateQuantity: (id: string, quantity: number) => void;
  selectedCategory: string;
  onNavigateToCart?: () => void;
  dateAvailabilities?: DateAvailability[];
}

const Menu: React.FC<MenuProps> = ({ menuItems, addToCart, cartItems, updateQuantity, selectedCategory, onNavigateToCart, dateAvailabilities = [] }) => {
  const { categories } = useCategories();
  const [activeCategory, setActiveCategory] = React.useState('hot-coffee');

  // Get available items for today or next available date
  const getAvailableTodayItems = (): { items: MenuItem[], date: string | null } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find the first available date (today or future)
    const upcomingAvailabilities = dateAvailabilities.filter(avail => {
      const availDate = new Date(avail.date);
      availDate.setHours(0, 0, 0, 0);
      return availDate >= today && avail.available_item_ids && avail.available_item_ids.length > 0;
    }).sort((a, b) => a.date.localeCompare(b.date));

    if (upcomingAvailabilities.length === 0) {
      return { items: [], date: null };
    }

    const firstAvailability = upcomingAvailabilities[0];
    const availableItemIds = firstAvailability.available_item_ids || [];
    
    // Filter menu items to only show available ones
    const availableItems = menuItems.filter(item => {
      const itemId = String(item.id).toLowerCase().trim();
      return availableItemIds.some(id => String(id).toLowerCase().trim() === itemId);
    });

    return { items: availableItems, date: firstAvailability.date };
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Preload images when menu items change
  React.useEffect(() => {
    if (menuItems.length > 0) {
      // Preload images for visible category first
      const visibleItems = menuItems.filter(item => item.category === activeCategory);
      preloadImages(visibleItems);
      
      // Then preload other images after a short delay
      setTimeout(() => {
        const otherItems = menuItems.filter(item => item.category !== activeCategory);
        preloadImages(otherItems);
      }, 1000);
    }
  }, [menuItems, activeCategory]);

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
    const element = document.getElementById(categoryId);
    if (element) {
      const headerHeight = 64; // Header height
      const subNavHeight = 60; // SubNav height
      const offset = headerHeight + subNavHeight + 20; // Extra padding
      const elementPosition = element.offsetTop - offset;
      
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  };

  React.useEffect(() => {
    if (categories.length > 0) {
      // Set default to dim-sum if it exists, otherwise first category
      const defaultCategory = categories.find(cat => cat.id === 'dim-sum') || categories[0];
      if (!categories.find(cat => cat.id === activeCategory)) {
        setActiveCategory(defaultCategory.id);
      }
    }
  }, [categories, activeCategory]);

  React.useEffect(() => {
    const handleScroll = () => {
      const sections = categories.map(cat => document.getElementById(cat.id)).filter(Boolean);
      const scrollPosition = window.scrollY + 200;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveCategory(categories[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  const availableTodayData = getAvailableTodayItems();

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-rca-off-white">
      {selectedCategory === 'all' && (
        <div className="text-center mb-12">
          <h2 className="text-4xl font-playfair font-semibold text-rca-green mb-4">Free Delivery</h2>
          <p className="text-rca-text-light max-w-2xl mx-auto text-lg font-medium">
            Lapu-Lapu City, Cebu City, Mandaue City, Talisay, Minglanilla, Consolacion, Liloan
          </p>
        </div>
      )}

      {/* Available Today Category - Show when "all" or "available-today" is selected */}
      {(selectedCategory === 'all' || selectedCategory === 'available-today') && 
       availableTodayData.items.length > 0 && 
       availableTodayData.date && (
        <section id="available-today" className="mb-16">
          <div className="flex items-center mb-8 border-b-2 border-green-500 pb-4">
            <div>
              <h3 className="text-3xl font-playfair font-medium text-green-600">Available Items</h3>
              <p className="text-sm text-gray-600 mt-1">Available on: {formatDate(availableTodayData.date)}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-2 gap-2 sm:gap-4 md:gap-6">
            {availableTodayData.items.map((item) => {
              // Find cart items that match this menu item
              const matchingCartItems = cartItems.filter(cartItem => {
                const parts = cartItem.id.split(':::CART:::');
                const originalMenuItemId = parts.length > 1 ? parts[0] : cartItem.id.split('-')[0];
                return originalMenuItemId === item.id && 
                       !cartItem.selectedVariation && 
                       (!cartItem.selectedAddOns || cartItem.selectedAddOns.length === 0);
              });
              
              const quantity = matchingCartItems.reduce((sum, cartItem) => sum + cartItem.quantity, 0);
              const primaryCartItem = matchingCartItems[0];
              
              return (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onAddToCart={addToCart}
                  quantity={quantity}
                  onUpdateQuantity={(id, qty) => {
                    if (primaryCartItem) {
                      updateQuantity(primaryCartItem.id, qty);
                    } else {
                      if (qty > 0) {
                        addToCart(item, qty);
                      }
                    }
                  }}
                  onNavigateToCart={onNavigateToCart}
                />
              );
            })}
          </div>
        </section>
      )}

      {selectedCategory === 'available-today' && availableTodayData.items.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No items available for today.</p>
        </div>
      )}

      {/* Only show regular categories if "available-today" is not selected */}
      {selectedCategory !== 'available-today' && categories.map((category) => {
        const categoryItems = menuItems.filter(item => item.category === category.id);
        
        if (categoryItems.length === 0) return null;
        
        return (
          <section key={category.id} id={category.id} className="mb-16">
            <div className="flex items-center mb-8 border-b-2 border-rca-red pb-4">
              <h3 className="text-3xl font-playfair font-medium text-rca-green">{category.name}</h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-2 gap-2 sm:gap-4 md:gap-6">
              {categoryItems.map((item) => {
                // Find cart items that match this menu item (by extracting menu item id from cart item id)
                // For simple items without variations/add-ons, sum all matching cart items
                const matchingCartItems = cartItems.filter(cartItem => {
                  // Extract original menu item id (format: "menuItemId:::CART:::timestamp-random" or old format)
                  const parts = cartItem.id.split(':::CART:::');
                  const originalMenuItemId = parts.length > 1 ? parts[0] : cartItem.id.split('-')[0];
                  return originalMenuItemId === item.id && 
                         !cartItem.selectedVariation && 
                         (!cartItem.selectedAddOns || cartItem.selectedAddOns.length === 0);
                });
                
                // Sum quantities of all matching simple items (for items without variations/add-ons)
                const quantity = matchingCartItems.reduce((sum, cartItem) => sum + cartItem.quantity, 0);
                
                // Get the first matching cart item for updateQuantity (if any)
                const primaryCartItem = matchingCartItems[0];
                
                return (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onAddToCart={addToCart}
                    quantity={quantity}
                    onUpdateQuantity={(id, qty) => {
                      // If we have a cart item, update it by its cart id
                      if (primaryCartItem) {
                        updateQuantity(primaryCartItem.id, qty);
                      } else {
                        // Otherwise, treat as adding a new item
                        if (qty > 0) {
                          addToCart(item, qty);
                        }
                      }
                    }}
                    onNavigateToCart={onNavigateToCart}
                  />
                );
              })}
            </div>
          </section>
        );
      })}
      </main>
    </>
  );
};

export default Menu;