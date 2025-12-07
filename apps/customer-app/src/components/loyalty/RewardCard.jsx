import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift } from 'lucide-react';

export default function RewardCard({ reward }) {
    if (!reward) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-orange-600" />
                    {reward.name}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-gray-600 mb-4">{reward.description}</p>
                <div className="flex items-center justify-between">
                    <span className="font-semibold">{reward.points} pts</span>
                    <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                        Redeem
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}