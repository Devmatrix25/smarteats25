import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
    MessageCircle, Plus, Clock, CheckCircle, AlertTriangle,
    Send, ChevronRight, Sparkles, HelpCircle, Wallet,
    Truck, Navigation, Phone, Shield, Bot, User, DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

// Driver-specific issue categories
const issueCategories = [
    { id: "payout", label: "Payout & Earnings", icon: Wallet, color: "bg-green-100 text-green-600" },
    { id: "app", label: "App Issues", icon: Phone, color: "bg-blue-100 text-blue-600" },
    { id: "route", label: "Route & Navigation", icon: Navigation, color: "bg-orange-100 text-orange-600" },
    { id: "customer", label: "Customer Issue", icon: User, color: "bg-purple-100 text-purple-600" },
    { id: "vehicle", label: "Vehicle Problem", icon: Truck, color: "bg-red-100 text-red-600" },
    { id: "safety", label: "Safety Concern", icon: Shield, color: "bg-yellow-100 text-yellow-600" },
    { id: "other", label: "Other", icon: HelpCircle, color: "bg-gray-100 text-gray-600" }
];

const statusConfig = {
    open: { label: "Open", color: "bg-yellow-100 text-yellow-700", icon: Clock },
    in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700", icon: MessageCircle },
    resolved: { label: "Resolved", color: "bg-green-100 text-green-700", icon: CheckCircle },
    escalated: { label: "Escalated", color: "bg-red-100 text-red-700", icon: AlertTriangle }
};

export default function DriverSupport() {
    const [user, setUser] = useState(null);
    const [driver, setDriver] = useState(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [showNewTicket, setShowNewTicket] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [newMessage, setNewMessage] = useState("");
    const [formData, setFormData] = useState({
        category: "",
        subject: "",
        description: ""
    });
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const isAuth = await base44.auth.isAuthenticated();
            if (!isAuth) {
                navigate('/login');
                return;
            }
            const userData = await base44.auth.me();

            // Only drivers can access this page
            if (userData.role !== 'driver') {
                navigate('/home');
                return;
            }

            setUser(userData);

            // Load driver profile
            const drivers = await base44.entities.Driver.filter({ email: userData.email });
            if (drivers.length > 0) {
                setDriver(drivers[0]);
            }
        } catch (e) {
            navigate('/login');
        } finally {
            setIsAuthLoading(false);
        }
    };

    const { data: tickets = [], isLoading } = useQuery({
        queryKey: ['driver-support-tickets', user?.email],
        queryFn: () => base44.entities.SupportTicket.filter({ customer_email: user.email }),
        enabled: !!user?.email,
        staleTime: 30000,
        refetchOnWindowFocus: false
    });

    const createTicketMutation = useMutation({
        mutationFn: async (ticketData) => {
            return base44.entities.SupportTicket.create({
                ...ticketData,
                customer_email: user.email,
                customer_name: driver?.name || user.full_name || 'Driver',
                user_type: 'driver',
                status: 'open',
                priority: ticketData.category === 'safety' ? 'high' : 'medium',
                messages: [{
                    sender: 'driver',
                    message: ticketData.description,
                    timestamp: new Date().toISOString()
                }],
                created_date: new Date().toISOString()
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['driver-support-tickets']);
            setShowNewTicket(false);
            setFormData({ category: "", subject: "", description: "" });
            toast.success("Ticket created! Our team will respond soon.");
        },
        onError: () => toast.error("Failed to create ticket")
    });

    const sendMessageMutation = useMutation({
        mutationFn: async ({ ticketId, message }) => {
            const ticket = tickets.find(t => t.id === ticketId);
            const updatedMessages = [
                ...(ticket.messages || []),
                {
                    sender: 'driver',
                    message: message,
                    timestamp: new Date().toISOString()
                }
            ];
            return base44.entities.SupportTicket.update(ticketId, {
                messages: updatedMessages,
                status: 'open'
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['driver-support-tickets']);
            setNewMessage("");
            toast.success("Message sent!");
        }
    });

    const handleSubmitTicket = () => {
        if (!formData.category || !formData.subject || !formData.description) {
            toast.error("Please fill all required fields");
            return;
        }
        createTicketMutation.mutate(formData);
    };

    if (isAuthLoading) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <Skeleton className="h-10 w-48 mb-6" />
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Driver Support</h1>
                    <p className="text-gray-500">Get help with deliveries, payouts, and more</p>
                </div>
                <Button
                    onClick={() => setShowNewTicket(true)}
                    className="bg-green-600 hover:bg-green-700 rounded-xl"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Ticket
                </Button>
            </div>

            {/* Quick Help Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {issueCategories.slice(0, 4).map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => {
                            setFormData(f => ({ ...f, category: cat.id }));
                            setShowNewTicket(true);
                        }}
                        className="bg-white p-4 rounded-xl border-2 border-transparent hover:border-green-500 transition-all text-left"
                    >
                        <div className={`w-10 h-10 ${cat.color} rounded-lg flex items-center justify-center mb-3`}>
                            <cat.icon className="w-5 h-5" />
                        </div>
                        <p className="font-medium text-sm">{cat.label}</p>
                    </button>
                ))}
            </div>

            {/* Emergency Contact */}
            <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-4 mb-6 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <Phone className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-semibold">Emergency Support</p>
                            <p className="text-sm text-white/80">For urgent safety issues</p>
                        </div>
                    </div>
                    <Button variant="secondary" className="bg-white text-red-600 hover:bg-red-50 rounded-xl">
                        Call Now
                    </Button>
                </div>
            </div>

            {/* Tickets List */}
            <div className="bg-white rounded-2xl shadow-sm">
                <div className="p-4 border-b">
                    <h2 className="font-semibold">Your Tickets</h2>
                </div>

                {isLoading ? (
                    <div className="p-4 space-y-3">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
                    </div>
                ) : tickets.length > 0 ? (
                    <div className="divide-y">
                        {tickets.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).map(ticket => {
                            const status = statusConfig[ticket.status] || statusConfig.open;
                            const category = issueCategories.find(c => c.id === ticket.category);

                            return (
                                <div
                                    key={ticket.id}
                                    onClick={() => setSelectedTicket(ticket)}
                                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            <div className={`w-10 h-10 ${category?.color || 'bg-gray-100'} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                                {category?.icon && <category.icon className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <p className="font-medium">{ticket.subject}</p>
                                                <p className="text-sm text-gray-500 line-clamp-1">{ticket.description}</p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {new Date(ticket.created_date).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge className={status.color}>{status.label}</Badge>
                                            <ChevronRight className="w-4 h-4 text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="font-semibold text-lg mb-2">No tickets yet</h3>
                        <p className="text-gray-500 mb-6">Create a ticket if you need any help</p>
                        <Button
                            onClick={() => setShowNewTicket(true)}
                            className="bg-green-600 hover:bg-green-700 rounded-xl"
                        >
                            Create First Ticket
                        </Button>
                    </div>
                )}
            </div>

            {/* New Ticket Dialog */}
            <Dialog open={showNewTicket} onOpenChange={setShowNewTicket}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Truck className="w-5 h-5 text-green-600" />
                            Driver Support Ticket
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Category Selection */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">Issue Type *</label>
                            <div className="grid grid-cols-2 gap-2">
                                {issueCategories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setFormData(f => ({ ...f, category: cat.id }))}
                                        className={cn(
                                            "p-3 rounded-xl border-2 flex items-center gap-2 text-left transition-all",
                                            formData.category === cat.id
                                                ? "border-green-500 bg-green-50"
                                                : "border-gray-200 hover:border-gray-300"
                                        )}
                                    >
                                        <cat.icon className="w-4 h-4 text-gray-600" />
                                        <span className="text-sm">{cat.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Subject */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">Subject *</label>
                            <Input
                                value={formData.subject}
                                onChange={(e) => setFormData(f => ({ ...f, subject: e.target.value }))}
                                placeholder="Brief title for your issue"
                                className="rounded-xl"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">Describe your issue *</label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                                placeholder="Please provide details about your issue..."
                                className="rounded-xl min-h-[100px]"
                            />
                        </div>

                        <Button
                            onClick={handleSubmitTicket}
                            disabled={createTicketMutation.isPending}
                            className="w-full bg-green-600 hover:bg-green-700 rounded-xl h-12"
                        >
                            {createTicketMutation.isPending ? "Creating..." : "Submit Ticket"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Ticket Detail Dialog */}
            <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    {selectedTicket && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center justify-between">
                                    <DialogTitle>{selectedTicket.subject}</DialogTitle>
                                    <Badge className={statusConfig[selectedTicket.status]?.color}>
                                        {statusConfig[selectedTicket.status]?.label}
                                    </Badge>
                                </div>
                            </DialogHeader>

                            {/* Messages */}
                            <div className="space-y-4 max-h-[300px] overflow-y-auto p-4 bg-gray-50 rounded-xl">
                                {selectedTicket.messages?.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={cn(
                                            "flex gap-3",
                                            msg.sender === 'driver' ? "flex-row-reverse" : ""
                                        )}
                                    >
                                        <div className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                                            msg.sender === 'driver' ? "bg-green-600" : "bg-purple-600"
                                        )}>
                                            {msg.sender === 'driver' ? (
                                                <Truck className="w-4 h-4 text-white" />
                                            ) : (
                                                <Bot className="w-4 h-4 text-white" />
                                            )}
                                        </div>
                                        <div className={cn(
                                            "max-w-[80%] p-3 rounded-xl",
                                            msg.sender === 'driver' ? "bg-green-600 text-white" : "bg-white"
                                        )}>
                                            <p className="text-sm">{msg.message}</p>
                                            <p className={cn(
                                                "text-xs mt-1",
                                                msg.sender === 'driver' ? "text-green-200" : "text-gray-400"
                                            )}>
                                                {new Date(msg.timestamp).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Reply Box */}
                            {selectedTicket.status !== 'resolved' && (
                                <div className="flex gap-2 mt-4">
                                    <Input
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type your reply..."
                                        className="rounded-xl"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && newMessage.trim()) {
                                                sendMessageMutation.mutate({ ticketId: selectedTicket.id, message: newMessage });
                                            }
                                        }}
                                    />
                                    <Button
                                        onClick={() => {
                                            if (newMessage.trim()) {
                                                sendMessageMutation.mutate({ ticketId: selectedTicket.id, message: newMessage });
                                            }
                                        }}
                                        disabled={!newMessage.trim() || sendMessageMutation.isPending}
                                        className="bg-green-600 hover:bg-green-700 rounded-xl"
                                    >
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}

                            {selectedTicket.status === 'resolved' && (
                                <div className="p-4 bg-green-50 rounded-xl text-center">
                                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                    <p className="text-sm text-green-700">This ticket has been resolved</p>
                                </div>
                            )}
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
