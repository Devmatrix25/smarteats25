import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award } from 'lucide-react';

export default function LoyaltyCard({ points = 0, tier = 'Bronze' }) {
    return (
        <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Loyalty Points
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold mb-2">{points} pts</div>
                <Badge className="bg-white text-orange-600">{tier} Tier</Badge>
            </CardContent>
        </Card>
    );
}