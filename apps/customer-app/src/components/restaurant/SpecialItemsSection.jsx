import React from 'react';

export default function SpecialItemsSection({ items = [] }) {
    if (!items || items.length === 0) return null;

    return (
        <div className="special-items-section">
            <h3 className="text-xl font-semibold mb-4">Special Items</h3>
            <div className="grid gap-4">
                {items.map((item, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-600">{item.description}</p>
                        <p className="font-semibold mt-2">₹{item.price}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}