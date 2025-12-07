import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import SmartEatsLogo from '../components/ui/SmartEatsLogo';
import { Alert, AlertDescription } from '../components/ui/alert';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { User, Store, Truck, ArrowRight, Loader2 } from 'lucide-react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const ROLES = [
    {
        id: 'customer',
        title: 'Customer',
        description: 'Order food from restaurants',
        icon: User,
        color: 'from-blue-500 to-blue-600',
    },
    {
        id: 'restaurant',
        title: 'Restaurant Owner',
        description: 'Manage your restaurant & menu',
        icon: Store,
        color: 'from-purple-500 to-purple-600',
    },
    {
        id: 'driver',
        title: 'Delivery Partner',
        description: 'Deliver orders and earn money',
        icon: Truck,
        color: 'from-green-500 to-green-600',
    },
];

export default function Register() {
    const [step, setStep] = useState('role'); // 'role' or 'details'
    const [selectedRole, setSelectedRole] = useState('');
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleRoleSelect = (role) => {
        setSelectedRole(role);

        // Restaurant and driver roles need additional registration steps
        if (role === 'restaurant') {
            navigate('/register/restaurant');
        } else if (role === 'driver') {
            navigate('/register/driver');
        } else {
            // Customer proceeds to basic registration
            setStep('details');
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await register({
                email: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
                role: selectedRole,
            });

            // Navigate based on role
            if (response.user.role === 'customer') {
                navigate('/home');
            } else if (response.user.role === 'restaurant') {
                navigate('/restaurant/dashboard');
            } else if (response.user.role === 'driver') {
                navigate('/driver');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        if (!selectedRole) {
            setError('Please select your role first');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const response = await loginWithGoogle(credentialResponse.credential, selectedRole);
            const user = response.user;

            // Redirect based on role
            if (user.role === 'customer') {
                navigate('/home');
            } else if (user.role === 'restaurant') {
                navigate('/restaurant/dashboard');
            } else if (user.role === 'driver') {
                navigate('/driver');
            }
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
                <div className="w-full max-w-4xl">
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <div className="flex flex-col items-center mb-8">
                            <SmartEatsLogo size="lg" />
                            <h1 className="text-2xl font-bold text-[#1D1D1F] mt-4">Create Your Account</h1>
                            <p className="text-gray-600 mt-2">Join SmartEats and start your journey</p>
                        </div>

                        {error && (
                            <Alert variant="destructive" className="mb-6">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {step === 'role' ? (
                            <div>
                                <h2 className="text-lg font-semibold text-center mb-6">Choose Your Role</h2>
                                <div className="grid md:grid-cols-3 gap-4">
                                    {ROLES.map((role) => (
                                        <button
                                            key={role.id}
                                            onClick={() => handleRoleSelect(role.id)}
                                            className="group relative overflow-hidden rounded-xl border-2 border-gray-200 hover:border-[#F25C23] transition-all p-6 text-center hover:shadow-lg"
                                        >
                                            <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br ${role.color} flex items-center justify-center`}>
                                                <role.icon className="w-8 h-8 text-white" />
                                            </div>
                                            <h3 className="font-bold text-lg mb-2">{role.title}</h3>
                                            <p className="text-sm text-gray-600 mb-4">{role.description}</p>
                                            <div className="flex items-center justify-center text-[#F25C23] group-hover:translate-x-1 transition-transform">
                                                <span className="text-sm font-semibold">Continue</span>
                                                <ArrowRight className="w-4 h-4 ml-1" />
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div className="mt-6 text-center text-sm text-gray-600">
                                    Already have an account?{' '}
                                    <Link to="/login" className="font-semibold text-[#F25C23] hover:text-[#D94A18]">
                                        Sign in
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="max-w-md mx-auto">
                                <button
                                    onClick={() => setStep('role')}
                                    className="text-gray-600 hover:text-[#F25C23] mb-4 flex items-center gap-2"
                                >
                                    ← Change role ({ROLES.find(r => r.id === selectedRole)?.title})
                                </button>

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
                            </div>
                        )}
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
