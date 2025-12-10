import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
    MessageCircle, Plus, Clock, CheckCircle, AlertTriangle,
    Send, ChevronRight, Sparkles, HelpCircle, Package,
    CreditCard, Truck, Store, X, Bot, User
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const issueCategories = [
    { id: "order", label: "Order Issues", icon: Package, color: "bg-blue-100 text-blue-600" },
    { id: "payment", label: "Payment & Refund", icon: CreditCard, color: "bg-green-100 text-green-600" },
    { id: "delivery", label: "Delivery Problem", icon: Truck, color: "bg-orange-100 text-orange-600" },
    { id: "restaurant", label: "Restaurant Issue", icon: Store, color: "bg-purple-100 text-purple-600" },
    { id: "other", label: "Other", icon: HelpCircle, color: "bg-gray-100 text-gray-600" }
];

const statusConfig = {
    open: { label: "Open", color: "bg-yellow-100 text-yellow-700", icon: Clock },
    in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700", icon: MessageCircle },
    resolved: { label: "Resolved", color: "bg-green-100 text-green-700", icon: CheckCircle },
    escalated: { label: "Escalated", color: "bg-red-100 text-red-700", icon: AlertTriangle }
};

export default function Support() {
    const [user, setUser] = useState(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [showNewTicket, setShowNewTicket] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [newMessage, setNewMessage] = useState("");
    const [formData, setFormData] = useState({
        category: "",
        subject: "",
        description: "",
        order_id: ""
    });
    const [aiSuggestion, setAiSuggestion] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
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
            setUser(userData);
        } catch (e) {
            navigate('/login');
        } finally {
            setIsAuthLoading(false);
        }
    };

    const { data: tickets = [], isLoading } = useQuery({
        queryKey: ['support-tickets', user?.email],
        queryFn: () => base44.entities.SupportTicket.filter({ customer_email: user.email }),
        enabled: !!user?.email,
        staleTime: 30000,
        refetchOnWindowFocus: false
    });

    const { data: orders = [] } = useQuery({
        queryKey: ['user-orders-support', user?.email],
        queryFn: () => base44.entities.Order.filter({ customer_email: user.email }),
        enabled: !!user?.email,
        staleTime: 60000
    });

    // AI Analysis function
    const analyzeIssue = async () => {
        if (!formData.description) return;

        setIsAnalyzing(true);

        // Simulate AI analysis (in production, call your AI endpoint)
        await new Promise(r => setTimeout(r, 1500));

        const desc = formData.description.toLowerCase();
        let suggestion = {
            canResolve: true,
            priority: "medium",
            suggestedActions: [],
            estimatedResolution: "24-48 hours"
        };

        // AI Logic for categorization
        if (desc.includes("refund") || desc.includes("money back") || desc.includes("charged")) {
            suggestion.suggestedActions = [
                "Check payment status in your bank app",
                "Refunds typically take 5-7 business days",
                "If amount was deducted but order failed, auto-refund will be processed"
            ];
            suggestion.priority = "high";
            suggestion.estimatedResolution = "5-7 business days for refund";
        } else if (desc.includes("wrong") || desc.includes("missing") || desc.includes("incomplete")) {
            suggestion.suggestedActions = [
                "Take photos of the received order",
                "Note the missing/wrong items",
                "Partial refund or reorder will be processed"
            ];
            suggestion.priority = "high";
        } else if (desc.includes("late") || desc.includes("delay") || desc.includes("waiting")) {
            suggestion.suggestedActions = [
                "Check order tracking for live status",
                "Contact driver through the app",
                "If order is significantly delayed, compensation may apply"
            ];
            suggestion.priority = "medium";
        } else if (desc.includes("cold") || desc.includes("quality") || desc.includes("taste")) {
            suggestion.suggestedActions = [
                "Take photos as evidence",
                "Restaurant will be notified",
                "Partial refund or voucher may be issued"
            ];
            suggestion.canResolve = true;
        } else {
            suggestion.suggestedActions = [
                "Our support team will review your issue",
                "You'll receive a response within 24 hours"
            ];
        }

        setAiSuggestion(suggestion);
        setIsAnalyzing(false);
    };

    const createTicketMutation = useMutation({
        mutationFn: async (ticketData) => {
            return base44.entities.SupportTicket.create({
                ...ticketData,
                customer_email: user.email,
                customer_name: user.full_name || user.profile?.firstName || 'Customer',
                status: aiSuggestion?.priority === 'high' ? 'escalated' : 'open',
                priority: aiSuggestion?.priority || 'medium',
                ai_suggestion: aiSuggestion,
                messages: [{
                    sender: 'customer',
                    message: ticketData.description,
                    timestamp: new Date().toISOString()
                }],
                created_date: new Date().toISOString()
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['support-tickets']);
            setShowNewTicket(false);
            setFormData({ category: "", subject: "", description: "", order_id: "" });
            setAiSuggestion(null);
            toast.success("Ticket created successfully! We'll get back to you soon.");
        },
        onError: () => toast.error("Failed to create ticket")
    });

    const sendMessageMutation = useMutation({
        mutationFn: async ({ ticketId, message }) => {
            const ticket = tickets.find(t => t.id === ticketId);
            const updatedMessages = [
                ...(ticket.messages || []),
                {
                    sender: 'customer',
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
            queryClient.invalidateQueries(['support-tickets']);
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
                    <h1 className="text-2xl font-bold">Help & Support</h1>
                    <p className="text-gray-500">Get help with your orders and account</p>
                </div>
                <Button
                    onClick={() => setShowNewTicket(true)}
                    className="bg-[#F25C23] hover:bg-[#D94A18] rounded-xl"
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
                        className="bg-white p-4 rounded-xl border-2 border-transparent hover:border-[#F25C23] transition-all text-left"
                    >
                        <div className={`w-10 h-10 ${cat.color} rounded-lg flex items-center justify-center mb-3`}>
                            <cat.icon className="w-5 h-5" />
                        </div>
                        <p className="font-medium text-sm">{cat.label}</p>
                    </button>
                ))}
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
                        <p className="text-gray-500 mb-6">Create a ticket if you need help with anything</p>
                        <Button
                            onClick={() => setShowNewTicket(true)}
                            className="bg-[#F25C23] hover:bg-[#D94A18] rounded-xl"
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
                            <Sparkles className="w-5 h-5 text-[#F25C23]" />
                            Create Support Ticket
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Category Selection */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">Issue Category *</label>
                            <div className="grid grid-cols-2 gap-2">
                                {issueCategories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setFormData(f => ({ ...f, category: cat.id }))}
                                        className={cn(
                                            "p-3 rounded-xl border-2 flex items-center gap-2 text-left transition-all",
                                            formData.category === cat.id
                                                ? "border-[#F25C23] bg-orange-50"
                                                : "border-gray-200 hover:border-gray-300"
                                        )}
                                    >
                                        <cat.icon className="w-4 h-4 text-gray-600" />
                                        <span className="text-sm">{cat.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Related Order */}
                        {orders.length > 0 && (
                            <div>
                                <label className="text-sm font-medium mb-2 block">Related Order (Optional)</label>
                                <Select
                                    value={formData.order_id}
                                    onValueChange={(v) => setFormData(f => ({ ...f, order_id: v }))}
                                >
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue placeholder="Select an order" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {orders.slice(0, 10).map(order => (
                                            <SelectItem key={order.id} value={order.id}>
                                                #{order.order_number || order.id.slice(-6)} - ₹{order.total_amount}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

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
                                onBlur={analyzeIssue}
                                placeholder="Please describe your issue in detail..."
                                className="rounded-xl min-h-[100px]"
                            />
                        </div>

                        {/* AI Suggestion */}
                        {isAnalyzing && (
                            <div className="p-4 bg-purple-50 rounded-xl flex items-center gap-3">
                                <div className="animate-spin">
                                    <Bot className="w-5 h-5 text-purple-600" />
                                </div>
                                <p className="text-sm text-purple-700">AI is analyzing your issue...</p>
                            </div>
                        )}

                        {aiSuggestion && !isAnalyzing && (
                            <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100">
                                <div className="flex items-center gap-2 mb-3">
                                    <Sparkles className="w-4 h-4 text-purple-600" />
                                    <span className="text-sm font-medium text-purple-700">AI Assistant Suggestion</span>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-sm text-gray-700">
                                        <strong>Priority:</strong>{" "}
                                        <Badge className={aiSuggestion.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}>
                                            {aiSuggestion.priority}
                                        </Badge>
                                    </p>

                                    <p className="text-sm text-gray-700">
                                        <strong>Estimated Resolution:</strong> {aiSuggestion.estimatedResolution}
                                    </p>

                                    <div className="mt-3">
                                        <p className="text-xs font-medium text-gray-600 mb-2">Suggested Steps:</p>
                                        <ul className="space-y-1">
                                            {aiSuggestion.suggestedActions.map((action, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                                                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                    {action}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        <Button
                            onClick={handleSubmitTicket}
                            disabled={createTicketMutation.isPending}
                            className="w-full bg-[#F25C23] hover:bg-[#D94A18] rounded-xl h-12"
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
                                            msg.sender === 'customer' ? "flex-row-reverse" : ""
                                        )}
                                    >
                                        <div className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                                            msg.sender === 'customer' ? "bg-[#F25C23]" : "bg-purple-600"
                                        )}>
                                            {msg.sender === 'customer' ? (
                                                <User className="w-4 h-4 text-white" />
                                            ) : (
                                                <Bot className="w-4 h-4 text-white" />
                                            )}
                                        </div>
                                        <div className={cn(
                                            "max-w-[80%] p-3 rounded-xl",
                                            msg.sender === 'customer' ? "bg-[#F25C23] text-white" : "bg-white"
                                        )}>
                                            <p className="text-sm">{msg.message}</p>
                                            <p className={cn(
                                                "text-xs mt-1",
                                                msg.sender === 'customer' ? "text-orange-200" : "text-gray-400"
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
                                        className="bg-[#F25C23] hover:bg-[#D94A18] rounded-xl"
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
