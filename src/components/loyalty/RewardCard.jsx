import React from "react";
import { Gift, Lock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function RewardCard({ reward, userPoints, userTier, onRedeem }) {
    const isLocked = reward.min_tier &&
        ['bronze', 'silver', 'gold', 'platinum'].indexOf(userTier) <
        ['bronze', 'silver', 'gold', 'platinum'].indexOf(reward.min_tier);

    const canRedeem = !isLocked && userPoints >= reward.points_required;

    return (
        <div className={cn(
            "flex items-center gap-4 p-4 bg-white rounded-xl border-2 transition-all",
            isLocked ? "border-gray-100 bg-gray-50 opacity-75" : "border-gray-100 hover:border-orange-200"
        )}>
            <div className={cn(
                "w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0",
                isLocked ? "bg-gray-200" : "bg-orange-100"
            )}>
                {isLocked ? (
                    <Lock className="w-8 h-8 text-gray-400" />
                ) : (
                    <Gift className="w-8 h-8 text-[#F25C23]" />
                )}
            </div>

            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-gray-900">{reward.name}</h4>
                    {reward.min_tier && (
                        <Badge variant="outline" className={cn(
                            "text-xs capitalize",
                            isLocked ? "bg-gray-100" : "bg-orange-50 text-orange-600 border-orange-200"
                        )}>
                            {reward.min_tier} Only
                        </Badge>
                    )}
                </div>
                <p className="text-sm text-gray-500 line-clamp-1">{reward.description}</p>
            </div>

            <div className="text-right">
                <p className="font-bold text-[#F25C23] mb-2">{reward.points_required} pts</p>
                <Button
                    size="sm"
                    disabled={!canRedeem}
                    onClick={() => onRedeem(reward)}
                    className={cn(
                        "rounded-lg",
                        canRedeem
                            ? "bg-[#F25C23] hover:bg-[#D94A18]"
                            : "bg-gray-200 text-gray-500 hover:bg-gray-200"
                    )}
                >
                    {isLocked ? "Locked" : "Redeem"}
                </Button>
            </div>
        </div>
    );
}