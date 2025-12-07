import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import SmartEatsLogo from '../components/ui/SmartEatsLogo';
import { Alert, AlertDescription } from '../components/ui/alert';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { Loader2, Truck, Store, CheckCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function Register() {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validate password confirmation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const response = await register({
                email: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
                role: 'customer',
                full_name: `${formData.firstName} ${formData.lastName}`.trim()
            });

            // Show success toast
            toast.success('🎉 Registration Successful!', {
                description: `Welcome to SmartEats, ${formData.firstName}! Your account has been created.`,
                duration: 5000,
                icon: <CheckCircle className="w-5 h-5 text-green-500" />
            });

            // Navigate to customer home
            navigate('/home');
        } catch (err) {
            const errorMessage = err.message || err.response?.data?.error || 'Registration failed. Please try again.';
            setError(errorMessage);
            toast.error('Registration Failed', {
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
            const response = await loginWithGoogle(credentialResponse.credential, 'customer');
            navigate('/home');
        } catch (err) {
            setError(err.response?.data?.error || 'Google sign-up failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = () => {
        setError('Google sign-up failed. Please try again.');
    };

    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <div className="min-h-screen bg-gradient-to-br from-[#FFF7F2] via-white to-white flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <div className="flex flex-col items-center mb-8">
                            <SmartEatsLogo size="lg" />
                            <h1 className="text-2xl font-bold text-[#1D1D1F] mt-4">Create Your Account</h1>
                            <p className="text-gray-600 mt-2">Join SmartEats and order delicious food</p>
                        </div>

                        {error && (
                            <Alert variant="destructive" className="mb-6">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input
                                        id="firstName"
                                        name="firstName"
                                        type="text"
                                        placeholder="John"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        required
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input
                                        id="lastName"
                                        name="lastName"
                                        type="text"
                                        placeholder="Doe"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        required
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    placeholder="+1 (555) 000-0000"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    required
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    required
                                    minLength={8}
                                    className="mt-1"
                                />
                                <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
                            </div>

                            <div>
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    required
                                    minLength={8}
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
                                        Creating account...
                                    </>
                                ) : (
                                    'Create Account'
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
                            Already have an account?{' '}
                            <Link to="/login" className="font-semibold text-[#F25C23] hover:text-[#D94A18]">
                                Sign in
                            </Link>
                        </div>

                        {/* Links to Driver/Restaurant Registration */}
                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <p className="text-center text-sm text-gray-500 mb-4">Want to join as a partner?</p>
                            <div className="grid grid-cols-2 gap-3">
                                <Link to="/register/restaurant">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full text-purple-600 border-purple-200 hover:bg-purple-50"
                                    >
                                        <Store className="w-4 h-4 mr-2" />
                                        Restaurant
                                    </Button>
                                </Link>
                                <Link to="/register/driver">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full text-green-600 border-green-200 hover:bg-green-50"
                                    >
                                        <Truck className="w-4 h-4 mr-2" />
                                        Driver
                                    </Button>
                                </Link>
                            </div>
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
