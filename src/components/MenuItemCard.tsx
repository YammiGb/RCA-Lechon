import React, { useState } from 'react';
import { Plus, Minus, X, ShoppingCart } from 'lucide-react';
import { MenuItem, Variation, AddOn } from '../types';

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem, quantity?: number, variation?: Variation, addOns?: AddOn[]) => void;
  quantity: number;
  onUpdateQuantity: (id: string, quantity: number) => void;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ 
  item, 
  onAddToCart, 
  quantity, 
  onUpdateQuantity 
}) => {
  const [showCustomization, setShowCustomization] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<Variation | undefined>(
    item.variations?.[0]
  );
  const [selectedAddOns, setSelectedAddOns] = useState<(AddOn & { quantity: number })[]>([]);

  const calculatePrice = () => {
    // Use effective price (discounted or regular) as base
    let price = item.effectivePrice || item.basePrice;
    if (selectedVariation) {
      price = (item.effectivePrice || item.basePrice) + selectedVariation.price;
    }
    selectedAddOns.forEach(addOn => {
      price += addOn.price * addOn.quantity;
    });
    return price;
  };

  const handleAddToCart = () => {
    if (item.variations?.length || item.addOns?.length) {
      setShowCustomization(true);
    } else {
      onAddToCart(item, 1);
    }
  };

  const handleCustomizedAddToCart = () => {
    // Convert selectedAddOns back to regular AddOn array for cart
    const addOnsForCart: AddOn[] = selectedAddOns.flatMap(addOn => 
      Array(addOn.quantity).fill({ ...addOn, quantity: undefined })
    );
    onAddToCart(item, 1, selectedVariation, addOnsForCart);
    setShowCustomization(false);
    setSelectedAddOns([]);
  };

  const handleIncrement = () => {
    onUpdateQuantity(item.id, quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity > 0) {
      onUpdateQuantity(item.id, quantity - 1);
    }
  };

  const updateAddOnQuantity = (addOn: AddOn, quantity: number) => {
    setSelectedAddOns(prev => {
      const existingIndex = prev.findIndex(a => a.id === addOn.id);
      
      if (quantity === 0) {
        // Remove add-on if quantity is 0
        return prev.filter(a => a.id !== addOn.id);
      }
      
      if (existingIndex >= 0) {
        // Update existing add-on quantity
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], quantity };
        return updated;
      } else {
        // Add new add-on with quantity
        return [...prev, { ...addOn, quantity }];
      }
    });
  };

  const groupedAddOns = item.addOns?.reduce((groups, addOn) => {
    const category = addOn.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(addOn);
    return groups;
  }, {} as Record<string, AddOn[]>);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open details if clicking on buttons or interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) {
      return;
    }
    setShowDetails(true);
  };

  return (
    <>
      <div 
        onClick={handleCardClick}
        className={`bg-rca-off-white rounded-xl sm:rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group animate-scale-in border border-rca-green/20 cursor-pointer ${!item.available ? 'opacity-60' : ''}`}
      >
        {/* Image Container with Badges */}
        <div className="relative h-32 sm:h-40 md:h-48 bg-gradient-to-br from-rca-green/10 to-rca-off-white">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`absolute inset-0 flex items-center justify-center ${item.image ? 'hidden' : ''}`}>
            <div className="text-6xl opacity-20 text-gray-400">☕</div>
          </div>
          
          {/* Badges */}
          <div className="absolute top-1 left-1 sm:top-3 sm:left-3 flex flex-col gap-1 sm:gap-2">
            {item.isOnDiscount && item.discountPrice && (
              <div className="bg-gradient-to-r from-rca-red to-rca-red-dark text-white text-[10px] sm:text-xs font-bold px-1.5 py-0.5 sm:px-3 sm:py-1.5 rounded-full shadow-lg animate-pulse">
                SALE
              </div>
            )}
            {item.popular && (
              <div className="bg-gradient-to-r from-rca-red/90 to-rca-red text-white text-[10px] sm:text-xs font-bold px-1.5 py-0.5 sm:px-3 sm:py-1.5 rounded-full shadow-lg">
                ⭐ POPULAR
              </div>
            )}
          </div>
          
          {!item.available && (
            <div className="absolute top-1 right-1 sm:top-3 sm:right-3 bg-gray-600 text-white text-[10px] sm:text-xs font-bold px-1.5 py-0.5 sm:px-3 sm:py-1.5 rounded-full shadow-lg">
              UNAVAILABLE
            </div>
          )}
          
          {/* Discount Percentage Badge */}
          {item.isOnDiscount && item.discountPrice && (
            <div className="absolute bottom-1 right-1 sm:bottom-3 sm:right-3 bg-rca-off-white/90 backdrop-blur-sm text-rca-red text-[10px] sm:text-xs font-bold px-1 py-0.5 sm:px-2 sm:py-1 rounded-full shadow-lg">
              {Math.round(((item.basePrice - item.discountPrice) / item.basePrice) * 100)}% OFF
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="p-2 sm:p-3 md:p-5">
          <div className="flex items-start justify-between mb-1 sm:mb-2 md:mb-3">
            <h4 className="text-xs sm:text-sm md:text-lg font-semibold text-gray-900 leading-tight flex-1 pr-1 sm:pr-2 line-clamp-2">{item.name}</h4>
            {item.variations && item.variations.length > 0 && (
              <div className="text-[10px] sm:text-xs text-gray-500 bg-gray-100 px-1 py-0.5 sm:px-2 sm:py-1 rounded-full whitespace-nowrap flex-shrink-0 ml-1">
                {item.variations.length} sizes
              </div>
            )}
          </div>
          
          <p className={`text-[10px] sm:text-xs md:text-sm mb-2 sm:mb-3 md:mb-4 leading-tight sm:leading-relaxed line-clamp-2 sm:line-clamp-none ${!item.available ? 'text-gray-400' : 'text-gray-600'}`}>
            {!item.available ? 'Currently Unavailable' : item.description}
          </p>
          
          {/* Pricing Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 mb-2 sm:mb-3 md:mb-4">
            <div className="flex-1">
              {item.isOnDiscount && item.discountPrice ? (
                <div className="space-y-0.5 sm:space-y-1">
                  <div className="flex items-center space-x-1 sm:space-x-2 flex-wrap">
                    <span className="text-sm sm:text-lg md:text-2xl font-bold text-rca-red">
                      ₱{item.discountPrice.toFixed(2)}
                    </span>
                    <span className="text-[10px] sm:text-xs md:text-sm text-gray-500 line-through">
                      ₱{item.basePrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">
                    Save ₱{(item.basePrice - item.discountPrice).toFixed(2)}
                  </div>
                </div>
              ) : (
                <div className="text-sm sm:text-lg md:text-2xl font-bold text-rca-green">
                  ₱{item.basePrice.toFixed(2)}
                </div>
              )}
              
              {item.variations && item.variations.length > 0 && (
                <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">
                  Starting price
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex-shrink-0 w-full sm:w-auto" onClick={(e) => e.stopPropagation()}>
              {!item.available ? (
                <button
                  disabled
                  className="w-full sm:w-auto bg-gray-200 text-gray-500 px-2 py-1.5 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl cursor-not-allowed font-medium text-[10px] sm:text-xs md:text-sm"
                >
                  Unavailable
                </button>
              ) : quantity === 0 ? (
                <button
                  onClick={handleAddToCart}
                  className="w-full sm:w-auto bg-rca-red text-white px-2 py-1.5 sm:px-4 md:px-6 sm:py-2 md:py-2.5 rounded-lg sm:rounded-xl hover:bg-rca-red-dark transition-all duration-200 transform hover:scale-105 font-medium text-[10px] sm:text-xs md:text-sm shadow-lg hover:shadow-xl"
                >
                  {item.variations?.length || item.addOns?.length ? 'Customize' : 'Add'}
                </button>
              ) : (
                <div className="flex items-center justify-center sm:justify-start space-x-1 sm:space-x-2 bg-rca-off-white rounded-lg sm:rounded-xl p-0.5 sm:p-1 border border-rca-green/20">
                  <button
                    onClick={handleDecrement}
                    title="Decrease quantity"
                    aria-label="Decrease quantity"
                    className="p-1 sm:p-2 hover:bg-rca-green/10 rounded-lg transition-colors duration-200 hover:scale-110"
                  >
                    <Minus className="h-3 w-3 sm:h-4 sm:w-4 text-rca-green" />
                  </button>
                  <span className="font-bold text-rca-green min-w-[20px] sm:min-w-[28px] text-center text-xs sm:text-sm">{quantity}</span>
                  <button
                    onClick={handleIncrement}
                    title="Increase quantity"
                    aria-label="Increase quantity"
                    className="p-1 sm:p-2 hover:bg-rca-green/10 rounded-lg transition-colors duration-200 hover:scale-110"
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 text-rca-green" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Add-ons indicator */}
          {item.addOns && item.addOns.length > 0 && (
            <div className="hidden sm:flex items-center space-x-1 text-[10px] sm:text-xs text-gray-500 bg-rca-off-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg border border-rca-green/20">
              <span>+</span>
              <span>{item.addOns.length} add-on{item.addOns.length > 1 ? 's' : ''} available</span>
            </div>
          )}
        </div>
      </div>

      {/* Customization Modal */}
      {showCustomization && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-cafe-light rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-cafe-light border-b border-cafe-latte p-6 flex items-center justify-between rounded-t-2xl">
              <div>
                <h3 className="text-xl font-semibold text-cafe-dark">Customize {item.name}</h3>
                <p className="text-sm text-gray-500 mt-1">Choose your preferences</p>
              </div>
              <button
                onClick={() => setShowCustomization(false)}
                title="Close customization"
                aria-label="Close customization"
                className="p-2 hover:bg-cafe-beige rounded-full transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {/* Size Variations */}
              {item.variations && item.variations.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Choose Size</h4>
                  <div className="space-y-3">
                    {item.variations.map((variation) => (
                      <label
                        key={variation.id}
                        className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                          selectedVariation?.id === variation.id
                            ? 'border-cafe-accent bg-cafe-beige'
                            : 'border-cafe-latte hover:border-cafe-accent hover:bg-cafe-cream'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="variation"
                            checked={selectedVariation?.id === variation.id}
                            onChange={() => setSelectedVariation(variation)}
                            className="text-cafe-accent focus:ring-cafe-accent"
                          />
                          <span className="font-medium text-cafe-dark">{variation.name}</span>
                        </div>
                        <span className="text-cafe-dark font-semibold">
                          ₱{((item.effectivePrice || item.basePrice) + variation.price).toFixed(2)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Add-ons */}
              {groupedAddOns && Object.keys(groupedAddOns).length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Add-ons</h4>
                  {Object.entries(groupedAddOns).map(([category, addOns]) => (
                    <div key={category} className="mb-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-3 capitalize">
                        {category.replace('-', ' ')}
                      </h5>
                      <div className="space-y-3">
                        {addOns.map((addOn) => (
                          <div
                            key={addOn.id}
                            className="flex items-center justify-between p-4 border border-cafe-latte rounded-xl hover:border-cafe-accent hover:bg-cafe-cream transition-all duration-200"
                          >
                            <div className="flex-1">
                              <span className="font-medium text-cafe-dark">{addOn.name}</span>
                              <div className="text-sm text-gray-600">
                                {addOn.price > 0 ? `₱${addOn.price.toFixed(2)} each` : 'Free'}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {selectedAddOns.find(a => a.id === addOn.id) ? (
                                <div className="flex items-center space-x-2 bg-cafe-beige rounded-xl p-1 border border-cafe-latte">
                                  <button
                                    type="button"
                                    title="Decrease add-on quantity"
                                    aria-label="Decrease add-on quantity"
                                    onClick={() => {
                                      const current = selectedAddOns.find(a => a.id === addOn.id);
                                      updateAddOnQuantity(addOn, (current?.quantity || 1) - 1);
                                    }}
                                    className="p-1.5 hover:bg-cafe-latte rounded-lg transition-colors duration-200"
                                  >
                                    <Minus className="h-3 w-3 text-cafe-accent" />
                                  </button>
                                  <span className="font-semibold text-cafe-dark min-w-[24px] text-center text-sm">
                                    {selectedAddOns.find(a => a.id === addOn.id)?.quantity || 0}
                                  </span>
                                  <button
                                    type="button"
                                    title="Increase add-on quantity"
                                    aria-label="Increase add-on quantity"
                                    onClick={() => {
                                      const current = selectedAddOns.find(a => a.id === addOn.id);
                                      updateAddOnQuantity(addOn, (current?.quantity || 0) + 1);
                                    }}
                                    className="p-1.5 hover:bg-cafe-latte rounded-lg transition-colors duration-200"
                                  >
                                    <Plus className="h-3 w-3 text-cafe-accent" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => updateAddOnQuantity(addOn, 1)}
                                  className="flex items-center space-x-1 px-4 py-2 bg-cafe-accent text-white rounded-xl hover:bg-cafe-espresso transition-all duration-200 text-sm font-medium shadow-lg"
                                >
                                  <Plus className="h-3 w-3" />
                                  <span>Add</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Price Summary */}
              <div className="border-t border-cafe-latte pt-4 mb-6">
                <div className="flex items-center justify-between text-2xl font-bold text-cafe-dark">
                  <span>Total:</span>
                  <span className="text-cafe-accent">₱{calculatePrice().toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleCustomizedAddToCart}
                className="w-full bg-cafe-accent text-white py-4 rounded-xl hover:bg-cafe-espresso transition-all duration-200 font-semibold flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <ShoppingCart className="h-5 w-5" />
                <span>Add to Cart - ₱{calculatePrice().toFixed(2)}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item Details Modal */}
      {showDetails && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowDetails(false)}
        >
          <div 
            className="bg-rca-off-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-rca-off-white border-b border-rca-green/20 p-4 sm:p-6 flex items-center justify-between rounded-t-2xl z-10">
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-playfair font-semibold text-rca-green">{item.name}</h3>
                <div className="flex items-center gap-2 mt-2">
                  {item.popular && (
                    <span className="bg-gradient-to-r from-rca-red/90 to-rca-red text-white text-xs font-bold px-2 py-1 rounded-full">
                      ⭐ POPULAR
                    </span>
                  )}
                  {item.isOnDiscount && item.discountPrice && (
                    <span className="bg-gradient-to-r from-rca-red to-rca-red-dark text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                      SALE
                    </span>
                  )}
                  {!item.available && (
                    <span className="bg-gray-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                      UNAVAILABLE
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="p-2 hover:bg-rca-green/10 rounded-full transition-colors duration-200 ml-4"
                aria-label="Close details"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 sm:p-6">
              {/* Image */}
              <div className="relative h-48 sm:h-64 mb-6 rounded-xl overflow-hidden bg-gradient-to-br from-rca-green/10 to-rca-off-white">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-8xl opacity-20 text-gray-400">☕</div>
                  </div>
                )}
                {item.isOnDiscount && item.discountPrice && (
                  <div className="absolute bottom-3 right-3 bg-rca-off-white/90 backdrop-blur-sm text-rca-red text-sm font-bold px-3 py-1.5 rounded-full shadow-lg">
                    {Math.round(((item.basePrice - item.discountPrice) / item.basePrice) * 100)}% OFF
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="mb-6">
                <p className={`text-base sm:text-lg leading-relaxed ${!item.available ? 'text-gray-400' : 'text-gray-700'}`}>
                  {!item.available ? 'Currently Unavailable' : item.description}
                </p>
              </div>

              {/* Pricing */}
              <div className="mb-6 p-4 bg-rca-green/5 rounded-xl border border-rca-green/20">
                {item.isOnDiscount && item.discountPrice ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl sm:text-4xl font-bold text-rca-red">
                        ₱{item.discountPrice.toFixed(2)}
                      </span>
                      <span className="text-lg sm:text-xl text-gray-500 line-through">
                        ₱{item.basePrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      You save ₱{(item.basePrice - item.discountPrice).toFixed(2)}
                    </div>
                  </div>
                ) : (
                  <div className="text-3xl sm:text-4xl font-bold text-rca-green">
                    ₱{item.basePrice.toFixed(2)}
                  </div>
                )}
                {item.variations && item.variations.length > 0 && (
                  <div className="text-sm text-gray-600 mt-2">
                    Starting price - see size options below
                  </div>
                )}
              </div>

              {/* Variations */}
              {item.variations && item.variations.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-rca-green mb-3">Available Sizes</h4>
                  <div className="space-y-2">
                    {item.variations.map((variation) => (
                      <div
                        key={variation.id}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-rca-green/20"
                      >
                        <span className="font-medium text-gray-900">{variation.name}</span>
                        <span className="text-lg font-bold text-rca-green">
                          ₱{((item.effectivePrice || item.basePrice) + variation.price).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add-ons */}
              {groupedAddOns && Object.keys(groupedAddOns).length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-rca-green mb-3">Available Add-ons</h4>
                  {Object.entries(groupedAddOns).map(([category, addOns]) => (
                    <div key={category} className="mb-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-2 capitalize">
                        {category.replace('-', ' ')}
                      </h5>
                      <div className="space-y-2">
                        {addOns.map((addOn) => (
                          <div
                            key={addOn.id}
                            className="flex items-center justify-between p-3 bg-white rounded-lg border border-rca-green/20"
                          >
                            <span className="font-medium text-gray-900">{addOn.name}</span>
                            <span className="text-sm font-semibold text-rca-green">
                              {addOn.price > 0 ? `₱${addOn.price.toFixed(2)}` : 'Free'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Button */}
              <div className="pt-4 border-t border-rca-green/20">
                {!item.available ? (
                  <button
                    disabled
                    className="w-full bg-gray-200 text-gray-500 py-3 rounded-xl cursor-not-allowed font-medium"
                  >
                    Currently Unavailable
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowDetails(false);
                      handleAddToCart();
                    }}
                    className="w-full bg-rca-red text-white py-3 rounded-xl hover:bg-rca-red-dark transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl"
                  >
                    {item.variations?.length || item.addOns?.length ? 'Customize & Add to Cart' : 'Add to Cart'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MenuItemCard;