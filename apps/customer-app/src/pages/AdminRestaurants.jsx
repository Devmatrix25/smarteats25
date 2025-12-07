import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Store, CheckCircle, XCircle, Search, Filter,
  MapPin, Phone, Clock, Star, MoreVertical, Ban, Eye
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminRestaurants() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        navigate(createPageUrl("Index"));
        return;
      }
      const userData = await base44.auth.me();
      if (userData.role !== 'admin') {
        navigate(createPageUrl("Home"));
        return;
      }
      setUser(userData);
    } catch (e) {
      navigate(createPageUrl("Index"));
    } finally {
      setIsAuthLoading(false);
    }
  };

  const { data: restaurants = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-restaurants'],
    queryFn: () => base44.entities.Restaurant.list('-created_date'),
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

  const handleApprove = (restaurant) => {
    updateMutation.mutate({
      id: restaurant.id,
      data: {
        status: 'approved',
        approved_by: user.email,
        approved_at: new Date().toISOString()
      }
    });
  };

  const handleReject = (restaurant) => {
    updateMutation.mutate({
      id: restaurant.id,
      data: { status: 'rejected' }
    });
  };

  const handleSuspend = (restaurant) => {
    updateMutation.mutate({
      id: restaurant.id,
      data: { status: 'suspended' }
    });
  };

  const handleReactivate = (restaurant) => {
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
      r.owner_email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const RestaurantCard = ({ restaurant, showActions = true }) => (
    <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
      <div className="flex gap-4">
        {/* Image */}
        <div className="w-24 h-24 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
          {restaurant.image_url ? (
            <img src={restaurant.image_url} alt={restaurant.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Store className="w-8 h-8 text-gray-300" />
            </div>
          )}
        </div>

        {/* Details */}
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

          <div className="flex flex-wrap gap-2 mt-2">
            {restaurant.cuisine_type?.slice(0, 3).map((cuisine, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">{cuisine}</Badge>
            ))}
          </div>

          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {restaurant.city || "Bangalore"}
            </span>
            {restaurant.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {restaurant.phone}
              </span>
            )}
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
            <span className="text-xs text-gray-400">
              Registered {format(new Date(restaurant.created_date), "MMM d, yyyy")}
            </span>
          </div>
        </div>
      </div>

      {/* Actions for Pending */}
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

  if (isAuthLoading || !user) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-10 w-48 mb-6" />
          <Skeleton className="h-12 w-full mb-6 rounded-xl" />
          <div className="space-y-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
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

        {/* Search */}
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
              Rejected/Suspended ({rejectedRestaurants.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {isLoading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
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

      {/* Detail Dialog */}
      <Dialog open={!!selectedRestaurant} onOpenChange={() => setSelectedRestaurant(null)}>
        <DialogContent className="max-w-lg">
          {selectedRestaurant && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedRestaurant.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {selectedRestaurant.image_url && (
                  <img 
                    src={selectedRestaurant.image_url} 
                    alt={selectedRestaurant.name}
                    className="w-full h-48 object-cover rounded-xl"
                  />
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Owner Email</p>
                    <p className="font-medium">{selectedRestaurant.owner_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{selectedRestaurant.phone || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">City</p>
                    <p className="font-medium">{selectedRestaurant.city || "Bangalore"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <Badge className={cn(
                      selectedRestaurant.status === 'pending' && "bg-yellow-100 text-yellow-700",
                      selectedRestaurant.status === 'approved' && "bg-green-100 text-green-700",
                      selectedRestaurant.status === 'rejected' && "bg-red-100 text-red-700"
                    )}>
                      {selectedRestaurant.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p>{selectedRestaurant.address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Cuisines</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedRestaurant.cuisine_type?.map((c, i) => (
                      <Badge key={i} variant="outline">{c}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}