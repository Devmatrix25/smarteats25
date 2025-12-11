import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import SmartEatsLogo from '../components/ui/SmartEatsLogo';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLogin() {
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

            // Verify user is an admin
            if (user.role !== 'admin') {
                setError('Access denied. This login is for administrators only.');
                setLoading(false);
                return;
            }

            toast.success('Welcome back, Admin! 🔐', {
                description: 'Redirecting to admin panel...',
                duration: 3000
            });

            navigate('/admin');
        } catch (err) {
            const errorMessage = err.message || err.response?.data?.error || 'Login failed. Please check your credentials.';
            setError(errorMessage);
            toast.error('Login Failed', { description: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-slate-700">
                    {/* Header */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-violet-500/30">
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                        <SmartEatsLogo size="md" />
                        <h1 className="text-2xl font-bold text-white mt-4">Admin Portal</h1>
                        <p className="text-slate-400 mt-2">Secure administrative access</p>
                    </div>

                    {error && (
                        <Alert variant="destructive" className="mb-6 bg-red-500/10 border-red-500/30 text-red-400">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="email" className="text-slate-300">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@smarteats.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="mt-1 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-violet-500"
                            />
                        </div>

                        <div>
                            <Label htmlFor="password" className="text-slate-300">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="mt-1 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-violet-500"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-xl h-12 font-semibold shadow-lg shadow-violet-500/25"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Authenticating...
                                </>
                            ) : (
                                'Access Admin Panel'
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-slate-700 text-center">
                        <Link to="/login" className="text-sm text-slate-400 hover:text-violet-400">
                            ← Back to main login
                        </Link>
                    </div>
                </div>

                <p className="text-center text-slate-500 text-xs mt-6">
                    🔒 Protected by SmartEats Security
                </p>
            </div>
        </div>
    );
}
