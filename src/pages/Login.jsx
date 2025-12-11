import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import SmartEatsLogo from '../components/ui/SmartEatsLogo';
import { Alert, AlertDescription } from '../components/ui/alert';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { Loader2, CheckCircle, Sparkles, Mail, Lock, ArrowLeft, RefreshCw, Clock, Shield } from 'lucide-react';
import { toast } from 'sonner';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // OTP States
    const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'otp'
    const [otpEmail, setOtpEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [otpSent, setOtpSent] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [remainingAttempts, setRemainingAttempts] = useState(3);
    const [rateLimitCountdown, setRateLimitCountdown] = useState(0);

    const { login, loginWithGoogle, loginAsDemo, setUser } = useAuth();
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

    // OTP countdown timer
    useEffect(() => {
        if (countdown > 0) {
            const timer = setInterval(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [countdown]);

    // Rate limit countdown timer
    useEffect(() => {
        if (rateLimitCountdown > 0) {
            const timer = setInterval(() => {
                setRateLimitCountdown(prev => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [rateLimitCountdown]);

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

    // Send OTP to email
    const handleSendOTP = async () => {
        if (!otpEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(otpEmail)) {
            setError('Please enter a valid email address');
            return;
        }

        setOtpLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: otpEmail }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 429) {
                    // Rate limited
                    setRateLimitCountdown(data.retryAfter || 1800);
                    setError(data.error);
                } else {
                    setError(data.error || 'Failed to send OTP');
                }
                return;
            }

            setOtpSent(true);
            setCountdown(300); // 5 minutes
            setRemainingAttempts(data.remainingAttempts);
            toast.success('OTP Sent! 📧', {
                description: 'Please check your email for the verification code.',
            });
        } catch (err) {
            setError('Failed to send OTP. Please try again.');
        } finally {
            setOtpLoading(false);
        }
    };

    // Resend OTP
    const handleResendOTP = async () => {
        if (remainingAttempts <= 0) {
            setError('Maximum OTP requests reached. Please wait 30 minutes.');
            return;
        }
        await handleSendOTP();
    };

    // Handle OTP input change
    const handleOtpChange = (index, value) => {
        if (value.length > 1) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    // Handle OTP paste
    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6);
        if (/^\d+$/.test(pastedData)) {
            const newOtp = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
            setOtp(newOtp);
        }
    };

    // Handle OTP backspace
    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    };

    // Verify OTP
    const handleVerifyOTP = async () => {
        const otpCode = otp.join('');
        if (otpCode.length !== 6) {
            setError('Please enter the complete 6-digit OTP');
            return;
        }

        setOtpLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: otpEmail, otp: otpCode }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Invalid OTP');
                return;
            }

            // Store tokens and user data (using same keys as base44Client)
            localStorage.setItem('accessToken', data.token);
            localStorage.setItem('refreshToken', data.refreshToken);
            localStorage.setItem('smarteats_current_user', JSON.stringify(data.user));

            // Update auth context
            setUser(data.user);

            toast.success(data.message || 'Welcome! 🎉', {
                description: 'You have been logged in successfully.',
            });

            // Redirect to home (customers only use OTP login)
            navigate('/home');
        } catch (err) {
            setError('Failed to verify OTP. Please try again.');
        } finally {
            setOtpLoading(false);
        }
    };

    // Format countdown time
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
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

                        {/* Login Method Tabs */}
                        <div className="flex gap-2 mb-6">
                            <button
                                type="button"
                                onClick={() => { setLoginMethod('password'); setOtpSent(false); setError(''); }}
                                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${loginMethod === 'password'
                                    ? 'bg-[#F25C23] text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                <Lock className="w-4 h-4" />
                                Password
                            </button>
                            <button
                                type="button"
                                onClick={() => { setLoginMethod('otp'); setError(''); }}
                                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${loginMethod === 'otp'
                                    ? 'bg-[#F25C23] text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                <Mail className="w-4 h-4" />
                                Email OTP
                            </button>
                        </div>

                        {/* Password Login Form */}
                        {loginMethod === 'password' && (
                            <>
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
                            </>
                        )}

                        {/* OTP Login Form */}
                        {loginMethod === 'otp' && (
                            <div className="space-y-4">
                                {!otpSent ? (
                                    // Step 1: Enter Email
                                    <>
                                        <div className="text-center mb-4">
                                            <div className="w-16 h-16 bg-gradient-to-br from-[#F25C23] to-[#D94A18] rounded-2xl flex items-center justify-center mx-auto mb-3">
                                                <Mail className="w-8 h-8 text-white" />
                                            </div>
                                            <p className="text-gray-600 text-sm">
                                                Enter your email and we'll send you a one-time password to sign in.
                                            </p>
                                        </div>

                                        <div>
                                            <Label htmlFor="otp-email">Email Address</Label>
                                            <Input
                                                id="otp-email"
                                                type="email"
                                                placeholder="you@example.com"
                                                value={otpEmail}
                                                onChange={(e) => setOtpEmail(e.target.value)}
                                                required
                                                className="mt-1"
                                            />
                                        </div>

                                        {rateLimitCountdown > 0 ? (
                                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                                                <Clock className="w-6 h-6 text-red-500 mx-auto mb-2" />
                                                <p className="text-red-600 text-sm font-medium">
                                                    Too many attempts. Try again in:
                                                </p>
                                                <p className="text-red-700 text-2xl font-bold">
                                                    {formatTime(rateLimitCountdown)}
                                                </p>
                                            </div>
                                        ) : (
                                            <Button
                                                type="button"
                                                onClick={handleSendOTP}
                                                className="w-full bg-[#F25C23] hover:bg-[#D94A18] text-white rounded-xl h-12"
                                                disabled={otpLoading || !otpEmail}
                                            >
                                                {otpLoading ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        Sending OTP...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Mail className="w-4 h-4 mr-2" />
                                                        Send OTP
                                                    </>
                                                )}
                                            </Button>
                                        )}

                                        <div className="flex items-center gap-2 text-xs text-gray-500 justify-center">
                                            <Shield className="w-3 h-3" />
                                            <span>New to SmartEats? We'll create an account for you!</span>
                                        </div>
                                    </>
                                ) : (
                                    // Step 2: Enter OTP
                                    <>
                                        <div className="text-center mb-4">
                                            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                                <CheckCircle className="w-8 h-8 text-white" />
                                            </div>
                                            <p className="text-gray-600 text-sm">
                                                We've sent a 6-digit code to <strong>{otpEmail}</strong>
                                            </p>
                                        </div>

                                        {/* OTP Timer */}
                                        <div className="bg-gradient-to-r from-[#FFF7F2] to-[#FFEDE5] rounded-xl p-4 text-center">
                                            <div className="flex items-center justify-center gap-2 mb-1">
                                                <Clock className="w-4 h-4 text-[#F25C23]" />
                                                <span className="text-gray-600 text-sm">Code expires in:</span>
                                            </div>
                                            <span className={`text-2xl font-bold ${countdown < 60 ? 'text-red-500' : 'text-[#F25C23]'}`}>
                                                {formatTime(countdown)}
                                            </span>
                                        </div>

                                        {/* OTP Input */}
                                        <div>
                                            <Label className="text-center block mb-3">Enter OTP Code</Label>
                                            <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                                                {otp.map((digit, index) => (
                                                    <Input
                                                        key={index}
                                                        id={`otp-${index}`}
                                                        type="text"
                                                        inputMode="numeric"
                                                        maxLength={1}
                                                        value={digit}
                                                        onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
                                                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                                        className="w-12 h-14 text-center text-2xl font-bold"
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        <Button
                                            type="button"
                                            onClick={handleVerifyOTP}
                                            className="w-full bg-[#F25C23] hover:bg-[#D94A18] text-white rounded-xl h-12"
                                            disabled={otpLoading || otp.join('').length !== 6}
                                        >
                                            {otpLoading ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Verifying...
                                                </>
                                            ) : (
                                                'Verify & Sign In'
                                            )}
                                        </Button>

                                        {/* Resend OTP */}
                                        <div className="flex items-center justify-between text-sm">
                                            <button
                                                type="button"
                                                onClick={() => { setOtpSent(false); setOtp(['', '', '', '', '', '']); }}
                                                className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
                                            >
                                                <ArrowLeft className="w-4 h-4" />
                                                Change email
                                            </button>

                                            {remainingAttempts > 0 ? (
                                                <button
                                                    type="button"
                                                    onClick={handleResendOTP}
                                                    disabled={countdown > 240 || otpLoading} // Can resend after 1 minute
                                                    className={`flex items-center gap-1 ${countdown > 240 || otpLoading
                                                        ? 'text-gray-400 cursor-not-allowed'
                                                        : 'text-[#F25C23] hover:text-[#D94A18]'
                                                        }`}
                                                >
                                                    <RefreshCw className="w-4 h-4" />
                                                    Resend ({remainingAttempts} left)
                                                </button>
                                            ) : (
                                                <span className="text-red-500 text-xs">No resends left</span>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
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
