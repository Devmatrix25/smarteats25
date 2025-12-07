import React from "react";
import { Trophy, Star, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export default function LoyaltyCard({ loyalty }) {
    if (!loyalty) return null;

    const tierColors = {
        bronze: "from-orange-400 to-orange-600",
        silver: "from-gray-300 to-gray-500",
        gold: "from-yellow-400 to-yellow-600",
        platinum: "from-slate-700 to-slate-900"
    };

    const nextTier = {
        bronze: { name: "silver", threshold: 500 },
        silver: { name: "gold", threshold: 2000 },
        gold: { name: "platinum", threshold: 5000 },
        platinum: { name: "platinum", threshold: 10000 }
    };

    const currentTier = loyalty.tier || "bronze";
    const next = nextTier[currentTier];
    const progress = Math.min((loyalty.lifetime_points / next.threshold) * 100, 100);

    return (
        <div className={cn(
            "relative overflow-hidden rounded-2xl p-6 text-white shadow-xl",
            "bg-gradient-to-br",
            tierColors[currentTier]
        )}>
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-black/10 rounded-full blur-3xl" />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <p className="text-white/80 text-sm font-medium mb-1">Available Points</p>
                        <h2 className="text-4xl font-bold flex items-center gap-2">
                            {loyalty.available_points}
                            <Star className="w-6 h-6 fill-white" />
                        </h2>
                    </div>
                    <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg border border-white/30">
                        <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4" />
                            <span className="font-bold capitalize">{currentTier} Member</span>
                        </div>
                    </div>
                </div>

                {currentTier !== 'platinum' && (
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-white/90">
                                {next.threshold - loyalty.lifetime_points} points to {next.name}
                            </span>
                            <span className="font-bold">{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2 bg-black/20" indicatorClassName="bg-white" />
                    </div>
                )}
            </div>
        </div>
    );
}