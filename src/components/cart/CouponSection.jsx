import React, { useState } from 'react';
import { Gift, ChevronDown, CheckCircle, Percent, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const COUPONS = [
    { code: "FIRST50", desc: "50% off up to ₹100 on first order", minOrder: 0, maxDiscount: 100, percent: 50 },
    { code: "FLAT100", desc: "₹100 off on orders above ₹299", minOrder: 299, maxDiscount: 100, flat: 100 },
    { code: "FREESHIP", desc: "Free delivery on orders above ₹199", minOrder: 199, maxDiscount: 40, flat: 40 },
    { code: "TASTY25", desc: "25% off up to ₹75", minOrder: 150, maxDiscount: 75, percent: 25 },
    { code: "BIGORDER", desc: "₹150 off on orders above ₹500", minOrder: 500, maxDiscount: 150, flat: 150 },
];

export default function CouponSection({ subtotal, appliedCode, onApply }) {
    const [isOpen, setIsOpen] = useState(false);

    const handleApply = (coupon) => {
        const discountAmount = coupon.percent
            ? Math.min(coupon.maxDiscount, Math.floor(subtotal * coupon.percent / 100))
            : coupon.flat;

        onApply(coupon.code, discountAmount);

        toast.custom((t) => (
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🎉</span>
                </div>
                <div>
                    <p className="font-bold text-lg">Woohoo! Coupon Applied</p>
                    <p className="text-white/90">You saved ₹{discountAmount} using {coupon.code}</p>
                </div>
            </div>
        ), { duration: 4000 });
    };

    return (
        <div className="mb-6">
            {/* Header - Click to expand */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-dashed border-orange-300 rounded-xl hover:shadow-lg transition-all"
            >
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                        <Tag className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                        <span className="font-bold text-gray-800 text-lg">Coupons & Offers</span>
                        <p className="text-sm text-gray-500">{COUPONS.filter(c => subtotal >= c.minOrder).length} offers available</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {appliedCode && (
                        <Badge className="bg-green-500 text-white px-3 py-1">
                            ₹{COUPONS.find(c => c.code === appliedCode)?.maxDiscount || 0} saved
                        </Badge>
                    )}
                    <ChevronDown className={`w-6 h-6 text-orange-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {/* Coupons List */}
            {isOpen && (
                <div className="mt-3 space-y-3 animate-in slide-in-from-top-2">
                    {COUPONS.map((coupon) => {
                        const isEligible = subtotal >= coupon.minOrder;
                        const isApplied = appliedCode === coupon.code;
                        const amountNeeded = coupon.minOrder - subtotal;
                        const discountAmount = coupon.percent
                            ? Math.min(coupon.maxDiscount, Math.floor(subtotal * coupon.percent / 100))
                            : coupon.flat;

                        return (
                            <div
                                key={coupon.code}
                                className={`relative overflow-hidden rounded-xl transition-all duration-300 ${isApplied
                                        ? 'bg-green-50 border-2 border-green-500 shadow-lg scale-[1.02]'
                                        : isEligible
                                            ? 'bg-white border-2 border-orange-200 hover:border-orange-400 hover:shadow-md'
                                            : 'bg-gray-50 border border-gray-200'
                                    }`}
                            >
                                {/* Left accent bar */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isApplied ? 'bg-green-500' : isEligible ? 'bg-gradient-to-b from-orange-500 to-red-500' : 'bg-gray-300'
                                    }`} />

                                <div className="p-4 pl-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`font-bold text-lg tracking-wide ${isApplied ? 'text-green-700' : isEligible ? 'text-orange-600' : 'text-gray-400'
                                                    }`}>
                                                    {coupon.code}
                                                </span>
                                                {isApplied && (
                                                    <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                                                        <CheckCircle className="w-4 h-4" /> Applied
                                                    </span>
                                                )}
                                            </div>

                                            <p className={`text-sm ${isEligible ? 'text-gray-600' : 'text-gray-400'}`}>
                                                {coupon.desc}
                                            </p>

                                            {/* Eligibility message */}
                                            {!isEligible && (
                                                <p className="text-xs text-red-500 mt-2 font-medium bg-red-50 px-2 py-1 rounded inline-block">
                                                    🛒 Add ₹{amountNeeded.toFixed(0)} more to unlock
                                                </p>
                                            )}

                                            {isEligible && !isApplied && (
                                                <p className="text-xs text-green-600 mt-2 font-semibold">
                                                    ✨ You'll save ₹{discountAmount} on this order
                                                </p>
                                            )}
                                        </div>

                                        {/* Apply Button */}
                                        <button
                                            onClick={() => isEligible && !isApplied && handleApply(coupon)}
                                            disabled={!isEligible || isApplied}
                                            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${isApplied
                                                    ? 'bg-green-500 text-white cursor-default'
                                                    : isEligible
                                                        ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-md hover:shadow-lg hover:scale-105'
                                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                }`}
                                        >
                                            {isApplied ? '✓ APPLIED' : 'APPLY'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
