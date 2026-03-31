import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { Microscope, Mail, Lock, ArrowRight, Loader2, CheckCircle2, Phone, MessageSquare } from 'lucide-react';
import { RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function Login() {
  const { loginWithGoogle, loginWithEmail, sendOtp, verifyOtp, user, isDelivery, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message;

  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Phone Login States
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });
    }
  };

  React.useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendOtp = async (e: React.FormEvent | null) => {
    if (e) e.preventDefault();
    if (isLoggingIn) return;
    
    // Basic validation
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsLoggingIn(true);
    setError(null);

    try {
      setupRecaptcha();
      const verifier = (window as any).recaptchaVerifier;
      // Format phone number if needed (e.g., add +91 for India if not present)
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${cleanPhone}`;
      const result = await sendOtp(formattedPhone, verifier);
      setConfirmationResult(result);
      setOtpSent(true);
      setResendTimer(60); // Start 60s timer
    } catch (err: any) {
      console.error('OTP send failed:', err);
      if (err.code === 'auth/invalid-phone-number') {
        setError('Invalid phone number format. Please check again.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else if (err.code === 'auth/captcha-check-failed') {
        setError('reCAPTCHA verification failed. Please try again.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized for phone authentication. Please contact support.');
      } else {
        setError(err.message || 'Failed to send OTP. Please check the phone number.');
      }
      
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
        (window as any).recaptchaVerifier = null;
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn || !confirmationResult) return;
    setIsLoggingIn(true);
    setError(null);

    try {
      await verifyOtp(confirmationResult, otp);
      // Redirect handled by useEffect
    } catch (err: any) {
      console.error('OTP verification failed:', err);
      setError('Invalid OTP. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  React.useEffect(() => {
    if (user && !loading) {
      if (isDelivery) {
        navigate('/delivery');
      } else if (isAdmin) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, isDelivery, isAdmin, navigate, loading]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setError(null);
    try {
      await loginWithEmail(email, password);
      // Redirect handled by useEffect
    } catch (err: any) {
      console.error('Email login failed:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please try again.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Google login failed:', err);
      if (err.code === 'auth/cancelled-popup-request') {
        setError('A login popup is already open. Please check your browser windows.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Login popup was closed. Please try again.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Login popup was blocked by your browser. Please allow popups for this site.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=2000" 
          alt="Healthcare Background"
          className="w-full h-full object-cover opacity-5"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-white/50"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white p-10 rounded-[3rem] shadow-2xl border border-neutral-100 relative z-10 backdrop-blur-sm bg-white/90"
      >
        <div className="text-center mb-10">
          <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Microscope className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-black text-neutral-900 tracking-tight">Welcome Back</h2>
          <p className="text-neutral-500 mt-2">Access your reports and book diagnostic tests easily.</p>
        </div>

        <div className="flex p-1 bg-neutral-100 rounded-2xl mb-8">
          <button
            onClick={() => setLoginMethod('email')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
              loginMethod === 'email' ? 'bg-white shadow-sm text-blue-600' : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            Email
          </button>
          <button
            onClick={() => setLoginMethod('phone')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
              loginMethod === 'phone' ? 'bg-white shadow-sm text-blue-600' : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            Mobile
          </button>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={isLoggingIn}
          className="w-full flex items-center justify-center space-x-3 bg-white border-2 border-neutral-100 py-4 rounded-2xl font-bold text-neutral-700 hover:bg-neutral-50 hover:border-blue-500 transition-all group disabled:opacity-50 mb-8"
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            className="w-6 h-6"
          />
          <span>Continue with Google</span>
        </button>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-neutral-400 font-bold uppercase tracking-widest text-[10px]">Or use {loginMethod}</span>
          </div>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-2xl text-sm font-medium border border-green-100 flex items-center space-x-2">
            <CheckCircle2 className="h-5 w-5" />
            <span>{successMessage}</span>
          </div>
        )}

        {loginMethod === 'email' ? (
          <form onSubmit={handleEmailLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-neutral-700 mb-2 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-neutral-50 border border-neutral-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2 ml-1">
                <label className="block text-sm font-bold text-neutral-700">Password</label>
                <Link to="/forgot-password" title="Reset Password" id="forgot-password-link" className="text-xs font-bold text-blue-600 hover:underline">Forgot?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-neutral-50 border border-neutral-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isLoggingIn ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <span>Login Now</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-5">
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-neutral-700 mb-2 ml-1">Mobile Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                    <input
                      type="tel"
                      required
                      placeholder="9876543210"
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-neutral-50 border border-neutral-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-2 ml-1">Enter 10-digit mobile number without +91</p>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn || phoneNumber.length < 10}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isLoggingIn ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <span>Send OTP</span>
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-neutral-700 mb-2 ml-1">Enter OTP</label>
                  <div className="relative">
                    <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="123456"
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-neutral-50 border border-neutral-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-between mt-2 ml-1">
                    <button 
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      Change Number?
                    </button>
                    {resendTimer > 0 ? (
                      <span className="text-xs text-neutral-400 font-medium">Resend in {resendTimer}s</span>
                    ) : (
                      <button 
                        type="button"
                        onClick={() => handleSendOtp(null)}
                        className="text-xs font-bold text-blue-600 hover:underline"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn || otp.length < 6}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isLoggingIn ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <span>Verify & Login</span>
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </form>
            )}
            <div id="recaptcha-container"></div>
          </div>
        )}

        <div className="mt-8 p-6 bg-blue-50/50 rounded-2xl border border-blue-100/50">
          <h4 className="text-sm font-bold text-blue-900 mb-2">Trouble logging in?</h4>
          <ul className="text-xs text-blue-700 text-left space-y-2 list-disc pl-4">
            <li>Ensure popups are allowed in your browser settings.</li>
            <li>Try opening the website in a <a href={window.location.href} target="_blank" rel="noopener noreferrer" className="underline font-bold">new tab</a>.</li>
          </ul>
        </div>
        
        <p className="mt-10 text-center text-sm text-neutral-500 font-medium">
          New to Shanti Meditech?{' '}
          <Link to="/register" className="text-blue-600 font-black hover:underline">
            Create account
          </Link>
        </p>

        <div className="mt-6 pt-6 border-t border-neutral-100 text-center">
          <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mb-3">Staff Access</p>
          <div className="flex flex-col space-y-3">
            <div className="flex justify-center space-x-4">
              <Link to="/login?role=delivery" className="text-xs font-black text-green-600 hover:text-green-700 bg-green-50 px-4 py-2 rounded-lg border border-green-100 transition-all">
                Delivery Boy Login
              </Link>
              <Link to="/admin" className="text-xs font-black text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 transition-all">
                Admin Login
              </Link>
            </div>
            <Link to="/register/delivery" className="text-xs font-bold text-neutral-500 hover:text-green-600 transition-all">
              Want to join as a Delivery Partner? <span className="underline">Register here</span>
            </Link>
          </div>
          <p className="mt-3 text-[10px] text-neutral-400 italic">Note: Roles must be assigned by the administrator.</p>
        </div>
      </motion.div>
    </div>
  );
}
