import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { Truck, User, Mail, Lock, ArrowRight, Loader2, CheckCircle2, Phone } from 'lucide-react';
import { submitToFormspree } from '../lib/utils';

export default function DeliveryRegister() {
  const { registerWithEmail, user, isDelivery, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  React.useEffect(() => {
    if (user && !success && !isSubmitting && !loading) {
      if (isDelivery) {
        navigate('/delivery');
      } else if (isAdmin) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, isDelivery, isAdmin, navigate, success, isSubmitting, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6 || password.length > 16) {
      setError('Password should be between 6 and 16 characters.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Register with 'delivery' role and phone number
      await registerWithEmail(email, password, name, 'delivery', phone);
      
      // Submit to Formspree
      await submitToFormspree({
        formType: 'New Delivery Partner Registration',
        name,
        email,
        phone,
        timestamp: new Date().toISOString()
      });

      setSuccess(true);
      
      setTimeout(() => {
        navigate('/login', { state: { message: 'Delivery Partner registration successful! Please login.' } });
      }, 2000);
    } catch (err: any) {
      console.error('Registration failed:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-neutral-900">
      {/* Background Visuals */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&q=80&w=2000" 
          alt="Delivery Background"
          className="w-full h-full object-cover opacity-10"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 to-black/50"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white p-10 rounded-[3rem] shadow-2xl relative z-10"
      >
        <div className="text-center mb-10">
          <div className="bg-green-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Truck className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-3xl font-black text-neutral-900 tracking-tight">Delivery Partner</h2>
          <p className="text-neutral-500 mt-2">Join our delivery fleet and start earning today.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-2xl text-sm font-medium border border-green-100 flex items-center space-x-2">
            <CheckCircle2 className="h-5 w-5" />
            <span>Registration successful! Redirecting...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-neutral-700 mb-2 ml-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
              <input
                type="text"
                required
                placeholder="John Doe"
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-neutral-50 border border-neutral-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-neutral-700 mb-2 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
              <input
                type="email"
                required
                placeholder="john@example.com"
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-neutral-50 border border-neutral-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-neutral-700 mb-2 ml-1">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
              <input
                type="tel"
                required
                placeholder="9876543210"
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-neutral-50 border border-neutral-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-neutral-700 mb-2 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-neutral-50 border border-neutral-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-neutral-700 mb-2 ml-1">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-neutral-50 border border-neutral-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-green-700 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <span>Join as Partner</span>
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>

        <p className="mt-10 text-center text-sm text-neutral-500 font-medium">
          Already a partner?{' '}
          <Link to="/login" className="text-green-600 font-black hover:underline">
            Login here
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
