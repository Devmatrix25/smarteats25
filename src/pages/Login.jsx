import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import SmartEatsLogo from '../components/ui/SmartEatsLogo';
import { Alert, AlertDescription } from '../components/ui/alert';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { Loader2, CheckCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, loginWithGoogle, loginAsDemo } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const from = location.state?.from?.pathname || '/home';

    // Check for registration success
    useEffect(() => {
        const registered = searchParams.get('registered');
        if (registered === 'driver') {
            setSuccessMessage('Driver registration successful! Your application is pending admin approval. You will be notified once approved.');
        } else if (registered === 'restaurant') {
            setSuccessMessage('Restaurant registration successful! Your application is pending admin approval. You will be notified once approved.');
        }
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await login(email, password);
            const user = response.user;

            // Show success toast
            toast.success(`Welcome back${user.profile?.firstName ? ', ' + user.profile.firstName : ''}! 🎉`, {
                description: 'Login successful! Redirecting...',
                duration: 3000
            });

            // Redirect based on role
            if (user.role === 'admin') {
                navigate('/admin');
            } else if (user.role === 'restaurant') {
                navigate('/restaurant/dashboard');
            } else if (user.role === 'driver') {
                navigate('/driver');
            } else {
                navigate(from);
            }
        } catch (err) {
            const errorMessage = err.message || err.response?.data?.error || 'Login failed. Please check your credentials.';
            setError(errorMessage);
            toast.error('Login Failed', {
                description: errorMessage
            });
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setError('');
        setLoading(true);

        try {
            const response = await loginWithGoogle(credentialResponse.credential);
            const user = response.user;

            // Redirect based on role
            if (user.role === 'admin') {
                navigate('/admin');
            } else if (user.role === 'restaurant') {
                navigate('/restaurant/dashboard');
            } else if (user.role === 'driver') {
                navigate('/driver');
            } else {
                navigate(from);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Google sign-in failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = () => {
        setError('Google sign-in failed. Please try again.');
    };

    const handleDemoLogin = async (role) => {
        try {
            setLoading(true);
            const response = await loginAsDemo(role);
            const user = response.user;

            if (user.role === 'admin') {
                navigate('/admin');
            } else if (user.role === 'restaurant') {
                navigate('/restaurant/dashboard');
            } else if (user.role === 'driver') {
                navigate('/driver');
            } else {
                navigate(from);
            }
        } catch (err) {
            setError('Demo login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <div className="min-h-screen bg-gradient-to-br from-[#FFF7F2] via-white to-white flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <div className="flex flex-col items-center mb-8">
                            <SmartEatsLogo size="lg" />
                            <h1 className="text-2xl font-bold text-[#1D1D1F] mt-4">Welcome Back</h1>
                            <p className="text-gray-600 mt-2">Sign in to continue to SmartEats</p>
                        </div>

                        {error && (
                            <Alert variant="destructive" className="mb-6">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {successMessage && (
                            <Alert className="mb-6 border-green-200 bg-green-50">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
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
                                className="w-full bg-[#F25C23] hover:bg-[#D94A18] text-white rounded-xl h-12"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </Button>
                        </form>

                        {GOOGLE_CLIENT_ID && (
                            <>
                                <div className="relative my-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-300"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-4 bg-white text-gray-500">Or continue with</span>
                                    </div>
                                </div>

                                <div className="flex justify-center">
                                    <GoogleLogin
                                        onSuccess={handleGoogleSuccess}
                                        onError={handleGoogleError}
                                        size="large"
                                        width="350"
                                    />
                                </div>
                            </>
                        )}


                        <div className="mt-6 text-center text-sm text-gray-600">
                            Don't have an account?{' '}
                            <Link to="/register" className="font-semibold text-[#F25C23] hover:text-[#D94A18]">
                                Sign up
                            </Link>
                        </div>
                    </div>

                    <div className="mt-4 text-center text-sm text-gray-500">
                        <Link to="/" className="hover:text-[#F25C23]">
                            ← Back to home
                        </Link>
                    </div>
                </div>
            </div>
        </GoogleOAuthProvider>
    );
}
