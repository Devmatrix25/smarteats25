import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Truck, CheckCircle, XCircle, Search,
  Phone, Star, MoreVertical, Ban, Eye, MapPin, Bike
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

export default function AdminDrivers() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedDriver, setSelectedDriver] = useState(null);
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

  const { data: drivers = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-drivers'],
    queryFn: async () => {
      const driversList = await base44.entities.Driver.list('-created_date');
      try {
        const usersData = await base44.auth.admin.getAllUsers('driver');
        return driversList.map(driver => ({
          ...driver,
          userAccountId: usersData.users?.find(u => u.email === driver.email)?._id
        }));
      } catch (err) {
        console.error('Failed to fetch user accounts:', err);
        return driversList;
      }
    },
    enabled: !!user,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Driver.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-drivers']);
      setSelectedDriver(null);
      toast.success("Driver updated!");
    },
    onError: () => toast.error("Update failed")
  });

  const handleApprove = async (driver) => {
    try {
      if (driver.userAccountId) {
        await base44.auth.admin.approveUser(driver.userAccountId);
      }
      updateMutation.mutate({
        id: driver.id,
        data: {
          status: 'approved',
          approved_by: user.email,
          approved_at: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Approval error:', error);
      toast.error('Failed to approve: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleReject = async (driver) => {
    try {
      if (driver.userAccountId) {
        await base44.auth.admin.rejectUser(driver.userAccountId, 'Application did not meet requirements');
      }
      updateMutation.mutate({
        id: driver.id,
        data: { status: 'rejected' }
      });
    } catch (error) {
      console.error('Rejection error:', error);
      toast.error('Failed to reject: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleSuspend = (driver) => {
    updateMutation.mutate({
      id: driver.id,
      data: { status: 'suspended' }
    });
  };

  const handleReactivate = (driver) => {
    updateMutation.mutate({
      id: driver.id,
      data: { status: 'approved' }
    });
  };

  // Filter out Flashman (system driver) from pending/approval lists - he's auto-approved
  const filterOutFlashman = (list) => list.filter(d => d.email !== 'flashman@smarteats.com');

  const pendingDrivers = filterOutFlashman(drivers.filter(d => d.status === 'pending'));
  const approvedDrivers = drivers.filter(d => d.status === 'approved'); // Keep Flashman in approved list for visibility
  const rejectedDrivers = filterOutFlashman(drivers.filter(d => d.status === 'rejected' || d.status === 'suspended'));

  const filterBySearch = (list) => {
    if (!searchQuery) return list;
    return list.filter(d =>
      d.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.phone?.includes(searchQuery)
    );
  };

  const vehicleIcons = {
    bicycle: "🚲",
    scooter: "🛵",
    motorcycle: "🏍️",
    car: "🚗"
  };

  const DriverCard = ({ driver, showActions = true }) => (
    <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
      <div className="flex gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
          {driver.name?.charAt(0) || "D"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg">{driver.name}</h3>
              <p className="text-sm text-gray-500">{driver.email}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSelectedDriver(driver)}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                {driver.status === 'pending' && (
                  <>
                    <DropdownMenuItem onClick={() => handleApprove(driver)} className="text-green-600">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleReject(driver)} className="text-red-600">
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </DropdownMenuItem>
                  </>
                )}
                {driver.status === 'approved' && (
                  <DropdownMenuItem onClick={() => handleSuspend(driver)} className="text-red-600">
                    <Ban className="w-4 h-4 mr-2" />
                    Suspend
                  </DropdownMenuItem>
                )}
                {(driver.status === 'rejected' || driver.status === 'suspended') && (
                  <DropdownMenuItem onClick={() => handleReactivate(driver)} className="text-green-600">
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
              {driver.phone}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {driver.city || "Bangalore"}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <Badge variant="outline" className="text-xs">
              <span className="mr-1">{vehicleIcons[driver.vehicle_type] || "🛵"}</span>
              {driver.vehicle_type}
            </Badge>
            <span className="text-xs text-gray-500">{driver.vehicle_number}</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={cn(
              driver.status === 'pending' && "bg-yellow-100 text-yellow-700",
              driver.status === 'approved' && "bg-green-100 text-green-700",
              driver.status === 'rejected' && "bg-red-100 text-red-700",
              driver.status === 'suspended' && "bg-gray-100 text-gray-700"
            )}>
              {driver.status}
            </Badge>
            {driver.status === 'approved' && (
              <>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500">{driver.total_deliveries || 0} deliveries</span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  {driver.average_rating?.toFixed(1) || "5.0"}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      {showActions && driver.status === 'pending' && (
        <div className="flex gap-2 mt-4 pt-4 border-t">
          <Button
            className="flex-1 bg-green-500 hover:bg-green-600 rounded-xl"
            onClick={() => handleApprove(driver)}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Approve
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-red-300 text-red-600 hover:bg-red-50 rounded-xl"
            onClick={() => handleReject(driver)}
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
          <h1 className="text-2xl font-bold">Manage Drivers</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-xl">
              🔄 Refresh
            </Button>
            <Badge variant="outline">{drivers.length} total</Badge>
          </div>
        </div>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search drivers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-100 rounded-xl p-1">
            <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-white relative">
              Pending
              {pendingDrivers.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 text-white text-xs rounded-full flex items-center justify-center">
                  {pendingDrivers.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="rounded-lg data-[state=active]:bg-white">
              Approved ({approvedDrivers.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="rounded-lg data-[state=active]:bg-white">
              Rejected ({rejectedDrivers.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="pending">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
              </div>
            ) : filterBySearch(pendingDrivers).length > 0 ? (
              <div className="space-y-4">
                {filterBySearch(pendingDrivers).map(d => (
                  <DriverCard key={d.id} driver={d} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-xl">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">All caught up!</h3>
                <p className="text-gray-500">No pending driver approvals</p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="approved">
            {filterBySearch(approvedDrivers).length > 0 ? (
              <div className="space-y-4">
                {filterBySearch(approvedDrivers).map(d => (
                  <DriverCard key={d.id} driver={d} showActions={false} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-xl">
                <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No approved drivers</h3>
              </div>
            )}
          </TabsContent>
          <TabsContent value="rejected">
            {filterBySearch(rejectedDrivers).length > 0 ? (
              <div className="space-y-4">
                {filterBySearch(rejectedDrivers).map(d => (
                  <DriverCard key={d.id} driver={d} showActions={false} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-xl">
                <XCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No rejected drivers</h3>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <Dialog open={!!selectedDriver} onOpenChange={() => setSelectedDriver(null)}>
        <DialogContent className="max-w-lg">
          {selectedDriver && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedDriver.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-3xl font-bold">
                    {selectedDriver.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{selectedDriver.name}</p>
                    <p className="text-gray-500">{selectedDriver.email}</p>
                    <Badge className={cn(
                      selectedDriver.status === 'pending' && "bg-yellow-100 text-yellow-700",
                      selectedDriver.status === 'approved' && "bg-green-100 text-green-700",
                      selectedDriver.status === 'rejected' && "bg-red-100 text-red-700"
                    )}>
                      {selectedDriver.status}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{selectedDriver.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">City</p>
                    <p className="font-medium">{selectedDriver.city || "Bangalore"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Vehicle Type</p>
                    <p className="font-medium capitalize">{selectedDriver.vehicle_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Vehicle Number</p>
                    <p className="font-medium">{selectedDriver.vehicle_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Deliveries</p>
                    <p className="font-medium">{selectedDriver.total_deliveries || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Rating</p>
                    <p className="font-medium flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      {selectedDriver.average_rating?.toFixed(1) || "5.0"}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  Registered on {format(new Date(selectedDriver.created_date), "MMMM d, yyyy")}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}