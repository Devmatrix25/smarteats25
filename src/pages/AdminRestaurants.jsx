import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Store, CheckCircle, XCircle, Search,
  Phone, Star, MoreVertical, Ban, Eye, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminRestaurants() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const queryClient = useQueryClient();

  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ['admin-restaurants'],
    queryFn: async () => {
      const restaurantsList = await base44.entities.Restaurant.list('-created_date');
      try {
        const usersData = await base44.auth.admin.getAllUsers('restaurant');
        return restaurantsList.map(restaurant => ({
          ...restaurant,
          userAccountId: usersData.users?.find(u => u.email === restaurant.owner_email)?._id
        }));
      } catch (err) {
        console.error('Failed to fetch user accounts:', err);
        return restaurantsList;
      }
    },
    enabled: !!user
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Restaurant.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-restaurants']);
      setSelectedRestaurant(null);
      toast.success("Restaurant updated!");
    },
    onError: () => toast.error("Update failed")
  });

  const handleApprove = async (restaurant) => {
    try {
      if (restaurant.userAccountId) {
        await base44.auth.admin.approveUser(restaurant.userAccountId);
      }

      // Send approval notification email
      try {
        await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4006'}/notify/approved`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: restaurant.owner_email,
            name: restaurant.name,
            type: 'restaurant'
          })
        });
        console.log('✅ Approval email sent to', restaurant.owner_email);
      } catch (emailErr) {
        console.warn('Email notification failed:', emailErr);
      }

      updateMutation.mutate({
        id: restaurant.id,
        data: {
          status: 'approved',
          approved_by: user.email,
          approved_at: new Date().toISOString()
        }
      });
      toast.success(`✅ ${restaurant.name} approved! Email notification sent.`);
    } catch (error) {
      console.error('Approval error:', error);
      toast.error('Failed to approve: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleReject = async (restaurant) => {
    const reason = prompt('Enter rejection reason (optional):') || 'Application did not meet requirements';

    try {
      if (restaurant.userAccountId) {
        await base44.auth.admin.rejectUser(restaurant.userAccountId, reason);
      }

      // Send rejection notification email
      try {
        await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4006'}/notify/rejected`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: restaurant.owner_email,
            name: restaurant.name,
            type: 'restaurant',
            reason: reason
          })
        });
        console.log('❌ Rejection email sent to', restaurant.owner_email);
      } catch (emailErr) {
        console.warn('Email notification failed:', emailErr);
      }

      updateMutation.mutate({
        id: restaurant.id,
        data: { status: 'rejected', rejection_reason: reason }
      });
      toast.success(`Restaurant rejected. Email notification sent.`);
    } catch (error) {
      console.error('Rejection error:', error);
      toast.error('Failed to reject: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleSuspend = (restaurant) => {
    updateMutation.mutate({
      id: restaurant.id,
      data: { status: 'suspended' }
    });
  };

  const handleReactivate = async (restaurant) => {
    await base44.auth.admin.updateUserApprovalByEmail(restaurant.owner_email, 'approved');
    updateMutation.mutate({
      id: restaurant.id,
      data: { status: 'approved' }
    });
  };

  const pendingRestaurants = restaurants.filter(r => r.status === 'pending');
  const approvedRestaurants = restaurants.filter(r => r.status === 'approved');
  const rejectedRestaurants = restaurants.filter(r => r.status === 'rejected' || r.status === 'suspended');

  const filterBySearch = (list) => {
    if (!searchQuery) return list;
    return list.filter(r =>
      r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.owner_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.phone?.includes(searchQuery)
    );
  };

  const RestaurantCard = ({ restaurant, showActions = true }) => (
    <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
      <div className="flex gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
          {restaurant.name?.charAt(0) || "R"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg">{restaurant.name}</h3>
              <p className="text-sm text-gray-500">{restaurant.owner_email}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSelectedRestaurant(restaurant)}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                {restaurant.status === 'pending' && (
                  <>
                    <DropdownMenuItem onClick={() => handleApprove(restaurant)} className="text-green-600">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleReject(restaurant)} className="text-red-600">
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </DropdownMenuItem>
                  </>
                )}
                {restaurant.status === 'approved' && (
                  <DropdownMenuItem onClick={() => handleSuspend(restaurant)} className="text-red-600">
                    <Ban className="w-4 h-4 mr-2" />
                    Suspend
                  </DropdownMenuItem>
                )}
                {(restaurant.status === 'rejected' || restaurant.status === 'suspended') && (
                  <DropdownMenuItem onClick={() => handleReactivate(restaurant)} className="text-green-600">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Reactivate
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {restaurant.phone}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {restaurant.address?.city || "Bangalore"}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={cn(
              restaurant.status === 'pending' && "bg-yellow-100 text-yellow-700",
              restaurant.status === 'approved' && "bg-green-100 text-green-700",
              restaurant.status === 'rejected' && "bg-red-100 text-red-700",
              restaurant.status === 'suspended' && "bg-gray-100 text-gray-700"
            )}>
              {restaurant.status}
            </Badge>
            {restaurant.status === 'approved' && (
              <>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  {restaurant.rating?.toFixed(1) || "5.0"}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      {showActions && restaurant.status === 'pending' && (
        <div className="flex gap-2 mt-4 pt-4 border-t">
          <Button
            className="flex-1 bg-green-500 hover:bg-green-600 rounded-xl"
            onClick={() => handleApprove(restaurant)}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Approve
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-red-300 text-red-600 hover:bg-red-50 rounded-xl"
            onClick={() => handleReject(restaurant)}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Reject
          </Button>
        </div>
      )}
    </div>
  );

  if (!user || isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-10 w-48 mb-6" />
          <Skeleton className="h-12 w-full mb-6 rounded-xl" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Manage Restaurants</h1>
          <Badge variant="outline">{restaurants.length} total</Badge>
        </div>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search restaurants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-100 rounded-xl p-1">
            <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-white relative">
              Pending
              {pendingRestaurants.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 text-white text-xs rounded-full flex items-center justify-center">
                  {pendingRestaurants.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="rounded-lg data-[state=active]:bg-white">
              Approved ({approvedRestaurants.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="rounded-lg data-[state=active]:bg-white">
              Rejected ({rejectedRestaurants.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="pending">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
              </div>
            ) : filterBySearch(pendingRestaurants).length > 0 ? (
              <div className="space-y-4">
                {filterBySearch(pendingRestaurants).map(r => (
                  <RestaurantCard key={r.id} restaurant={r} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-xl">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">All caught up!</h3>
                <p className="text-gray-500">No pending restaurant approvals</p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="approved">
            {filterBySearch(approvedRestaurants).length > 0 ? (
              <div className="space-y-4">
                {filterBySearch(approvedRestaurants).map(r => (
                  <RestaurantCard key={r.id} restaurant={r} showActions={false} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-xl">
                <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No approved restaurants</h3>
              </div>
            )}
          </TabsContent>
          <TabsContent value="rejected">
            {filterBySearch(rejectedRestaurants).length > 0 ? (
              <div className="space-y-4">
                {filterBySearch(rejectedRestaurants).map(r => (
                  <RestaurantCard key={r.id} restaurant={r} showActions={false} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-xl">
                <XCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No rejected restaurants</h3>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <Dialog open={!!selectedRestaurant} onOpenChange={() => setSelectedRestaurant(null)}>
        <DialogContent className="max-w-lg">
          {selectedRestaurant && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedRestaurant.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-3xl font-bold">
                    {selectedRestaurant.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{selectedRestaurant.name}</p>
                    <p className="text-gray-500">{selectedRestaurant.owner_email}</p>
                    <Badge className={cn(
                      selectedRestaurant.status === 'pending' && "bg-yellow-100 text-yellow-700",
                      selectedRestaurant.status === 'approved' && "bg-green-100 text-green-700",
                      selectedRestaurant.status === 'rejected' && "bg-red-100 text-red-700"
                    )}>
                      {selectedRestaurant.status}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{selectedRestaurant.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium">{selectedRestaurant.address?.city || "Bangalore"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Cuisine Types</p>
                    <p className="font-medium">{selectedRestaurant.cuisine_types?.join(", ") || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Rating</p>
                    <p className="font-medium flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      {selectedRestaurant.rating?.toFixed(1) || "5.0"}
                    </p>
                  </div>
                </div>
                {selectedRestaurant.description && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Description</p>
                    <p className="text-sm">{selectedRestaurant.description}</p>
                  </div>
                )}
                <p className="text-xs text-gray-400">
                  Registered on {format(new Date(selectedRestaurant.created_date), "MMMM d, yyyy")}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}