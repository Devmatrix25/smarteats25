import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/base44Client';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import SmartEatsLogo from '../components/ui/SmartEatsLogo';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2, Store } from 'lucide-react';

export default function RegisterRestaurant() {
    const [formData, setFormData] = useState({
        // Owner info
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        // Restaurant info
        restaurantName: '',
        cuisine: '',
        address: '',
        city: '',
        zipCode: '',
        description: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
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
            // Register the user with pending approval status
            const response = await register({
                email: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
                role: 'restaurant',
            });

            // Then create restaurant profile (pending approval)
            try {
                await api.entities.Restaurant.create({
                    name: formData.restaurantName,
                    owner_email: formData.email,
                    cuisine: formData.cuisine,
                    address: formData.address,
                    city: formData.city,
                    zip_code: formData.zipCode,
                    description: formData.description,
                    status: 'pending',
                });
            } catch (restaurantError) {
                console.error('Restaurant creation error:', restaurantError);
            }

            // Redirect to login with success message
            navigate('/login?registered=restaurant');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#FFF7F2] via-white to-white py-8 px-4 overflow-auto">
            <div className="w-full max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                            <Store className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-[#1D1D1F]">Register Your Restaurant</h1>
                        <p className="text-gray-600 mt-2 text-center">Join SmartEats and reach thousands of customers</p>
                    </div>

                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Owner Information</h3>
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

                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="owner@restaurant.com"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="phone">Phone</Label>
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
                            </div>

                            <div className="mt-4">
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

                            <div className="mt-4">
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
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-4">Restaurant Details</h3>
                            <div>
                                <Label htmlFor="restaurantName">Restaurant Name</Label>
                                <Input
                                    id="restaurantName"
                                    name="restaurantName"
                                    type="text"
                                    placeholder="Amazing Eats"
                                    value={formData.restaurantName}
                                    onChange={handleInputChange}
                                    required
                                    className="mt-1"
                                />
                            </div>

                            <div className="mt-4">
                                <Label htmlFor="cuisine">Cuisine Type</Label>
                                <Input
                                    id="cuisine"
                                    name="cuisine"
                                    type="text"
                                    placeholder="Italian, Mexican, Chinese, etc."
                                    value={formData.cuisine}
                                    onChange={handleInputChange}
                                    required
                                    className="mt-1"
                                />
                            </div>

                            <div className="mt-4">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    placeholder="Tell us about your restaurant..."
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="mt-1"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4 mt-4">
                                <div className="col-span-2">
                                    <Label htmlFor="address">Address</Label>
                                    <Input
                                        id="address"
                                        name="address"
                                        type="text"
                                        placeholder="123 Main St"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        required
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        id="city"
                                        name="city"
                                        type="text"
                                        placeholder="City"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        required
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div className="mt-4">
                                <Label htmlFor="zipCode">ZIP Code</Label>
                                <Input
                                    id="zipCode"
                                    name="zipCode"
                                    type="text"
                                    placeholder="12345"
                                    value={formData.zipCode}
                                    onChange={handleInputChange}
                                    required
                                    className="mt-1"
                                />
                            </div>
                        </div>

                        <Alert>
                            <AlertDescription>
                                Your restaurant will be reviewed by our team before going live. You'll be notified once approved.
                            </AlertDescription>
                        </Alert>

                        <Button
                            type="submit"
                            className="w-full bg-[#F25C23] hover:bg-[#D94A18] text-white rounded-xl h-12"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Registering...
                                </>
                            ) : (
                                'Register Restaurant'
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link to="/login" className="font-semibold text-[#F25C23] hover:text-[#D94A18]">
                            Sign in
                        </Link>
                    </div>
                </div>

                <div className="mt-4 text-center text-sm text-gray-500">
                    <Link to="/register" className="hover:text-[#F25C23]">
                        ← Choose a different role
                    </Link>
                </div>
            </div>
        </div>
    );
}
