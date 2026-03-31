import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mail, ShieldCheck, Loader2, ArrowRight, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function OTPVerify() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Email, 2: OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [timer, setTimer] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep(2);
        setTimer(60);
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(data.error || 'Invalid OTP');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-neutral-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white p-10 rounded-[3rem] shadow-2xl border border-neutral-100"
      >
        <div className="text-center mb-10">
          <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-black text-neutral-900 tracking-tight">
            {step === 1 ? 'Email Verification' : 'Enter OTP'}
          </h2>
          <p className="text-neutral-500 mt-2">
            {step === 1 
              ? 'Verify your email to secure your account.' 
              : `We've sent a 6-digit code to ${email}`}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium border border-red-100 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-2xl text-sm font-medium border border-green-100 flex items-center">
            <CheckCircle2 className="h-5 w-5 mr-2 flex-shrink-0" />
            <span>Email verified successfully! Redirecting...</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOTP} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-neutral-700 mb-2 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input
                  type="email"
                  required
                  placeholder="name@gmail.com"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-neutral-50 border border-neutral-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <>
                  <span>Send OTP</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-neutral-700 mb-2 ml-1">6-Digit OTP</label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="000000"
                className="w-full px-4 py-4 rounded-2xl bg-neutral-50 border border-neutral-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-center text-2xl font-black tracking-[1rem]"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            <button
              type="submit"
              disabled={loading || success}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <>
                  <span>Verify OTP</span>
                  <CheckCircle2 className="h-5 w-5" />
                </>
              )}
            </button>
            
            <div className="text-center">
              {timer > 0 ? (
                <p className="text-sm text-neutral-400 font-medium">
                  Resend OTP in <span className="text-blue-600 font-bold">{timer}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOTP}
                  className="text-sm text-blue-600 font-bold hover:underline flex items-center justify-center mx-auto"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Resend OTP
                </button>
              )}
            </div>
            
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-sm text-neutral-400 font-bold hover:text-neutral-600"
            >
              Change Email
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
