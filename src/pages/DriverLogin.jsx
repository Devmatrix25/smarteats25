import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import SmartEatsLogo from '../components/ui/SmartEatsLogo';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2, Truck } from 'lucide-react';
import { toast } from 'sonner';

export default function DriverLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await login(email, password);
            const user = response.user;

            // Verify user is a driver
            if (user.role !== 'driver') {
                setError('This login is for delivery partners only. Please use the correct login page.');
                setLoading(false);
                return;
            }

            toast.success('Welcome back! 🚀', {
                description: 'Redirecting to your dashboard...',
                duration: 3000
            });

            navigate('/driver');
        } catch (err) {
            const errorMessage = err.message || err.response?.data?.error || 'Login failed. Please check your credentials.';
            setError(errorMessage);
            toast.error('Login Failed', { description: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-emerald-100">
                    {/* Header */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                            <Truck className="w-8 h-8 text-white" />
                        </div>
                        <SmartEatsLogo size="md" />
                        <h1 className="text-2xl font-bold text-[#1D1D1F] mt-4">Delivery Partner Login</h1>
                        <p className="text-gray-600 mt-2">Access your driver dashboard</p>
                    </div>

                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="driver@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="mt-1"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white rounded-xl h-12 font-semibold"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                'Sign In to Dashboard'
                            )}
                        </Button>
                    </form>

                    {/* Flashman hint for testing */}
                    <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                        <p className="text-xs text-emerald-700 text-center">
                            <strong>Test Account:</strong> flashman@smarteats.com / flashman123
                        </p>
                    </div>

                    <div className="mt-6 text-center text-sm text-gray-600">
                        Want to become a delivery partner?{' '}
                        <Link to="/register?role=driver" className="font-semibold text-emerald-500 hover:text-emerald-600">
                            Apply now
                        </Link>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                        <Link to="/login" className="text-sm text-gray-500 hover:text-[#F25C23]">
                            ← Customer Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
