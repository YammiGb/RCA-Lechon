import React from 'react';
import { MenuItem, CartItem } from '../types';
import { useCategories } from '../hooks/useCategories';
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
}

const Menu: React.FC<MenuProps> = ({ menuItems, addToCart, cartItems, updateQuantity, selectedCategory }) => {
  const { categories } = useCategories();
  const [activeCategory, setActiveCategory] = React.useState('hot-coffee');

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

      {categories.map((category) => {
        const categoryItems = menuItems.filter(item => item.category === category.id);
        
        if (categoryItems.length === 0) return null;
        
        return (
          <section key={category.id} id={category.id} className="mb-16">
            <div className="flex items-center mb-8 border-b-2 border-rca-red pb-4">
              <h3 className="text-3xl font-playfair font-medium text-rca-green">{category.name}</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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