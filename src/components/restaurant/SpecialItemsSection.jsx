import React from "react";
import { Plus, Minus, Flame, Award, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function SpecialItemsSection({ menuItems, onAddToCart, getItemQuantity }) {
    // Filter for special items (bestsellers or items with discounts)
    const specialItems = menuItems.filter(item => item.is_bestseller || (item.discount && item.discount > 0));

    if (specialItems.length === 0) return null;

    return (
        <div className="mb-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-yellow-500" />
                Recommended & Offers
            </h3>

            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                {specialItems.map(item => (
                    <div
                        key={item.id}
                        className="min-w-[280px] bg-white rounded-2xl p-4 shadow-sm border border-orange-100 hover:shadow-md transition-all"
                    >
                        <div className="relative h-40 mb-3 rounded-xl overflow-hidden">
                            <img
                                src={item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"}
                                alt={item.name}
                                className="w-full h-full object-cover"
                            />
                            {item.is_bestseller && (
                                <Badge className="absolute top-2 left-2 bg-[#FFC043] text-[#1D1D1F] border-0">
                                    <Award className="w-3 h-3 mr-1" />
                                    Bestseller
                                </Badge>
                            )}
                            {item.discount > 0 && (
                                <Badge className="absolute top-2 right-2 bg-red-500 text-white border-0">
                                    <Percent className="w-3 h-3 mr-1" />
                                    {item.discount}% OFF
                                </Badge>
                            )}
                        </div>

                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h4 className="font-semibold text-[#1D1D1F] line-clamp-1">{item.name}</h4>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    {item.is_vegetarian ? (
                                        <span className="text-green-600 text-xs border border-green-600 px-1 rounded">VEG</span>
                                    ) : (
                                        <span className="text-red-600 text-xs border border-red-600 px-1 rounded">NON-VEG</span>
                                    )}
                                    {item.calories && <span>{item.calories} cal</span>}
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-[#F25C23]">₹{item.price}</p>
                                {item.original_price && (
                                    <p className="text-xs text-gray-400 line-through">₹{item.original_price}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                            {getItemQuantity(item.id) > 0 ? (
                                <div className="flex items-center gap-2 bg-[#F25C23] rounded-lg h-9">
                                    <button
                                        onClick={() => onAddToCart(item)} // This might need to handle decrement logic if passed differently, but based on usage in Restaurant.jsx, onAddToCart opens customization or adds. 
                                        // Wait, Restaurant.jsx passes `openCustomization` as `onAddToCart`. 
                                        // And `updateQuantity` is not passed to SpecialItemsSection?
                                        // Let's check Restaurant.jsx again.
                                        // <SpecialItemsSection menuItems={menuItems} onAddToCart={openCustomization} getItemQuantity={getItemQuantity} />
                                        // It seems SpecialItemsSection needs to handle the add/remove logic if it wants to show the counter.
                                        // But `openCustomization` only adds/opens dialog.
                                        // Let's stick to a simple "Add" button for now or just use onAddToCart.
                                        // Actually, let's look at how Restaurant.jsx handles the main list.
                                        // It uses `updateQuantity` for decrement. `SpecialItemsSection` doesn't receive `updateQuantity`.
                                        // I should probably just show an "Add" button or "Customize" button.
                                        className="px-3 text-white hover:bg-[#D94A18] transition-colors"
                                    >
                                        Add +
                                    </button>
                                </div>
                            ) : (
                                <Button
                                    onClick={() => onAddToCart(item)}
                                    className="w-full bg-orange-50 text-[#F25C23] hover:bg-[#F25C23] hover:text-white border-0"
                                    size="sm"
                                >
                                    Add to Cart
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function SparklesIcon(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <path d="M5 3v4" />
            <path d="M9 5H5" />
            <path d="M19 19v4" />
            <path d="M19 19h-4" />
        </svg>
    )
}