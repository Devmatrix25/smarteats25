import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
    MessageCircle, Clock, CheckCircle, AlertTriangle,
    Send, Search, Filter, User, Bot, RefreshCw,
    ChevronDown, Mail, Phone, Package, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const statusConfig = {
    open: { label: "Open", color: "bg-yellow-100 text-yellow-700", icon: Clock },
    in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700", icon: MessageCircle },
    resolved: { label: "Resolved", color: "bg-green-100 text-green-700", icon: CheckCircle },
    escalated: { label: "Escalated", color: "bg-red-100 text-red-700", icon: AlertTriangle }
};

const priorityConfig = {
    low: { label: "Low", color: "bg-gray-100 text-gray-700" },
    medium: { label: "Medium", color: "bg-yellow-100 text-yellow-700" },
    high: { label: "High", color: "bg-red-100 text-red-700" }
};

export default function AdminSupport() {
    const [user, setUser] = useState(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [filterStatus, setFilterStatus] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [replyMessage, setReplyMessage] = useState("");
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
            if (userData.role !== 'admin') {
                navigate('/home');
                return;
            }
            setUser(userData);
        } catch (e) {
            navigate('/login');
        } finally {
            setIsAuthLoading(false);
        }
    };

    const { data: tickets = [], isLoading, refetch } = useQuery({
        queryKey: ['admin-support-tickets'],
        queryFn: () => base44.entities.SupportTicket.list('-created_date', 100),
        enabled: !!user,
        staleTime: Infinity,
        refetchOnWindowFocus: false
    });

    const updateTicketMutation = useMutation({
        mutationFn: async ({ ticketId, updates }) => {
            return base44.entities.SupportTicket.update(ticketId, updates);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-support-tickets']);
            toast.success("Ticket updated");
        }
    });

    const sendReplyMutation = useMutation({
        mutationFn: async ({ ticketId, message }) => {
            const ticket = tickets.find(t => t.id === ticketId);
            const updatedMessages = [
                ...(ticket.messages || []),
                {
                    sender: 'admin',
                    sender_name: user.full_name || 'Support Team',
                    message: message,
                    timestamp: new Date().toISOString()
                }
            ];
            return base44.entities.SupportTicket.update(ticketId, {
                messages: updatedMessages,
                status: 'in_progress'
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-support-tickets']);
            setReplyMessage("");
            toast.success("Reply sent!");
        }
    });

    // Filter tickets
    let filteredTickets = [...tickets];
    if (filterStatus !== "all") {
        filteredTickets = filteredTickets.filter(t => t.status === filterStatus);
    }
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredTickets = filteredTickets.filter(t =>
            t.subject?.toLowerCase().includes(query) ||
            t.customer_email?.toLowerCase().includes(query) ||
            t.description?.toLowerCase().includes(query)
        );
    }

    // Stats
    const stats = {
        total: tickets.length,
        open: tickets.filter(t => t.status === 'open').length,
        inProgress: tickets.filter(t => t.status === 'in_progress').length,
        escalated: tickets.filter(t => t.status === 'escalated').length,
        resolved: tickets.filter(t => t.status === 'resolved').length
    };

    if (isAuthLoading) {
        return (
            <div className="p-6">
                <Skeleton className="h-10 w-48 mb-6" />
                <div className="grid grid-cols-4 gap-4 mb-6">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">Support Tickets</h1>
                        <p className="text-gray-500">Manage customer support requests</p>
                    </div>
                    <Button variant="outline" onClick={() => refetch()} className="rounded-xl">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    {[
                        { label: "Total", value: stats.total, color: "bg-gray-100 text-gray-700" },
                        { label: "Open", value: stats.open, color: "bg-yellow-100 text-yellow-700" },
                        { label: "In Progress", value: stats.inProgress, color: "bg-blue-100 text-blue-700" },
                        { label: "Escalated", value: stats.escalated, color: "bg-red-100 text-red-700" },
                        { label: "Resolved", value: stats.resolved, color: "bg-green-100 text-green-700" }
                    ].map((stat, idx) => (
                        <div key={idx} className="bg-white rounded-xl p-4 shadow-sm">
                            <p className="text-2xl font-bold">{stat.value}</p>
                            <Badge className={stat.color}>{stat.label}</Badge>
                        </div>
                    ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Tickets List */}
                    <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm overflow-hidden">
                        {/* Filters */}
                        <div className="p-4 border-b space-y-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Search tickets..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 rounded-xl"
                                />
                            </div>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Tickets</SelectItem>
                                    <SelectItem value="open">Open</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="escalated">Escalated</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Ticket List */}
                        <div className="divide-y max-h-[600px] overflow-y-auto">
                            {isLoading ? (
                                <div className="p-4 space-y-3">
                                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
                                </div>
                            ) : filteredTickets.length > 0 ? (
                                filteredTickets.map(ticket => {
                                    const status = statusConfig[ticket.status] || statusConfig.open;
                                    const priority = priorityConfig[ticket.priority] || priorityConfig.medium;

                                    return (
                                        <div
                                            key={ticket.id}
                                            onClick={() => setSelectedTicket(ticket)}
                                            className={cn(
                                                "p-4 cursor-pointer transition-colors",
                                                selectedTicket?.id === ticket.id
                                                    ? "bg-orange-50 border-l-4 border-[#F25C23]"
                                                    : "hover:bg-gray-50"
                                            )}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <p className="font-medium text-sm line-clamp-1">{ticket.subject}</p>
                                                <Badge className={cn(status.color, "text-xs")}>{status.label}</Badge>
                                            </div>
                                            <p className="text-xs text-gray-500 mb-2">{ticket.customer_email}</p>
                                            <div className="flex items-center justify-between">
                                                <Badge className={cn(priority.color, "text-xs")}>{priority.label}</Badge>
                                                <span className="text-xs text-gray-400">
                                                    {new Date(ticket.created_date).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="p-8 text-center text-gray-500">
                                    <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p>No tickets found</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Ticket Detail */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm overflow-hidden">
                        {selectedTicket ? (
                            <>
                                {/* Ticket Header */}
                                <div className="p-4 border-b">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="font-semibold text-lg">{selectedTicket.subject}</h3>
                                            <p className="text-sm text-gray-500">{selectedTicket.category}</p>
                                        </div>
                                        <Select
                                            value={selectedTicket.status}
                                            onValueChange={(v) => {
                                                updateTicketMutation.mutate({
                                                    ticketId: selectedTicket.id,
                                                    updates: { status: v }
                                                });
                                                setSelectedTicket({ ...selectedTicket, status: v });
                                            }}
                                        >
                                            <SelectTrigger className="w-40 rounded-xl">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="open">Open</SelectItem>
                                                <SelectItem value="in_progress">In Progress</SelectItem>
                                                <SelectItem value="escalated">Escalated</SelectItem>
                                                <SelectItem value="resolved">Resolved</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Customer Info */}
                                    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                                        <div className="w-10 h-10 bg-gradient-to-br from-[#F25C23] to-[#FFC043] rounded-full flex items-center justify-center text-white font-medium">
                                            {selectedTicket.customer_name?.[0] || 'C'}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium">{selectedTicket.customer_name || 'Customer'}</p>
                                            <p className="text-sm text-gray-500">{selectedTicket.customer_email}</p>
                                        </div>
                                        {selectedTicket.order_id && (
                                            <Button variant="outline" size="sm" className="rounded-lg">
                                                <Package className="w-4 h-4 mr-1" />
                                                View Order
                                            </Button>
                                        )}
                                    </div>

                                    {/* AI Suggestion */}
                                    {selectedTicket.ai_suggestion && (
                                        <div className="mt-3 p-3 bg-purple-50 rounded-xl">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Bot className="w-4 h-4 text-purple-600" />
                                                <span className="text-sm font-medium text-purple-700">AI Analysis</span>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                <strong>Priority:</strong> {selectedTicket.ai_suggestion.priority} |
                                                <strong> Est. Resolution:</strong> {selectedTicket.ai_suggestion.estimatedResolution}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Messages */}
                                <div className="p-4 h-[350px] overflow-y-auto bg-gray-50 space-y-4">
                                    {selectedTicket.messages?.map((msg, idx) => (
                                        <div
                                            key={idx}
                                            className={cn(
                                                "flex gap-3",
                                                msg.sender === 'admin' ? "" : "flex-row-reverse"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                                                msg.sender === 'admin' ? "bg-purple-600" : "bg-[#F25C23]"
                                            )}>
                                                {msg.sender === 'admin' ? (
                                                    <Bot className="w-4 h-4 text-white" />
                                                ) : (
                                                    <User className="w-4 h-4 text-white" />
                                                )}
                                            </div>
                                            <div className={cn(
                                                "max-w-[70%] p-3 rounded-xl",
                                                msg.sender === 'admin' ? "bg-white border" : "bg-[#F25C23] text-white"
                                            )}>
                                                <p className="text-sm">{msg.message}</p>
                                                <p className={cn(
                                                    "text-xs mt-1",
                                                    msg.sender === 'admin' ? "text-gray-400" : "text-orange-200"
                                                )}>
                                                    {msg.sender_name || 'Customer'} • {new Date(msg.timestamp).toLocaleTimeString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Reply Box */}
                                <div className="p-4 border-t">
                                    <div className="flex gap-2">
                                        <Textarea
                                            value={replyMessage}
                                            onChange={(e) => setReplyMessage(e.target.value)}
                                            placeholder="Type your reply..."
                                            className="rounded-xl min-h-[60px]"
                                        />
                                        <Button
                                            onClick={() => {
                                                if (replyMessage.trim()) {
                                                    sendReplyMutation.mutate({
                                                        ticketId: selectedTicket.id,
                                                        message: replyMessage
                                                    });
                                                }
                                            }}
                                            disabled={!replyMessage.trim() || sendReplyMutation.isPending}
                                            className="bg-[#F25C23] hover:bg-[#D94A18] rounded-xl px-6"
                                        >
                                            <Send className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="flex gap-2 mt-3">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                updateTicketMutation.mutate({
                                                    ticketId: selectedTicket.id,
                                                    updates: { status: 'resolved' }
                                                });
                                                setSelectedTicket({ ...selectedTicket, status: 'resolved' });
                                            }}
                                            className="rounded-lg text-green-600 border-green-200 hover:bg-green-50"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-1" />
                                            Mark Resolved
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                updateTicketMutation.mutate({
                                                    ticketId: selectedTicket.id,
                                                    updates: { status: 'escalated' }
                                                });
                                                setSelectedTicket({ ...selectedTicket, status: 'escalated' });
                                            }}
                                            className="rounded-lg text-red-600 border-red-200 hover:bg-red-50"
                                        >
                                            <AlertTriangle className="w-4 h-4 mr-1" />
                                            Escalate
                                        </Button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-500">
                                <div className="text-center">
                                    <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                    <p>Select a ticket to view details</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
