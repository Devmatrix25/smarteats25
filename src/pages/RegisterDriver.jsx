import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/base44Client';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select';
import SmartEatsLogo from '../components/ui/SmartEatsLogo';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2, Truck } from 'lucide-react';

export default function RegisterDriver() {
    const [formData, setFormData] = useState({
        // Driver info
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        // Vehicle info
        vehicleType: '',
        vehicleNumber: '',
        city: '',
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

    const handleVehicleTypeChange = (value) => {
        setFormData({
            ...formData,
            vehicleType: value,
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
                role: 'driver',
            });

            // Then create driver profile (pending approval)
            try {
                await api.entities.Driver.create({
                    name: `${formData.firstName} ${formData.lastName}`,
                    email: formData.email,
                    phone: formData.phone,
                    vehicle_type: formData.vehicleType,
                    vehicle_number: formData.vehicleNumber,
                    city: formData.city,
                    status: 'pending',
                });
            } catch (driverError) {
                console.error('Driver profile creation error:', driverError);
            }

            // Redirect to login with success message
            navigate('/login?registered=driver');
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
                        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mb-4">
                            <Truck className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-[#1D1D1F]">Become a Delivery Partner</h1>
                        <p className="text-gray-600 mt-2 text-center">Deliver orders, earn money, be your own boss</p>
                    </div>

                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
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
                                        placeholder="driver@example.com"
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
                            <h3 className="text-lg font-semibold mb-4">Vehicle Details</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="vehicleType">Vehicle Type</Label>
                                    <Select
                                        onValueChange={handleVehicleTypeChange}
                                        value={formData.vehicleType}
                                        required
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Select vehicle type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="bike">Bike</SelectItem>
                                            <SelectItem value="scooter">Scooter</SelectItem>
                                            <SelectItem value="car">Car</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="vehicleNumber">Vehicle Number</Label>
                                    <Input
                                        id="vehicleNumber"
                                        name="vehicleNumber"
                                        type="text"
                                        placeholder="ABC-1234"
                                        value={formData.vehicleNumber}
                                        onChange={handleInputChange}
                                        required
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div className="mt-4">
                                <Label htmlFor="city">City</Label>
                                <Input
                                    id="city"
                                    name="city"
                                    type="text"
                                    placeholder="Your city"
                                    value={formData.city}
                                    onChange={handleInputChange}
                                    required
                                    className="mt-1"
                                />
                            </div>
                        </div>

                        <Alert>
                            <AlertDescription>
                                Your application will be reviewed by our team. You'll be notified once approved and can start delivering.
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
                                    Submitting application...
                                </>
                            ) : (
                                'Submit Application'
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
