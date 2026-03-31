import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Test, Package } from '../types';
import type { Booking as BookingType } from '../types';
import { Calendar, Clock, MapPin, CreditCard, CheckCircle2, ArrowRight, Microscope } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, addDays } from 'date-fns';
import { LAB_CONFIG } from '../constants';
import { submitToFormspree } from '../lib/utils';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function Booking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const testId = searchParams.get('testId');
  const packageId = searchParams.get('packageId');

  const [item, setItem] = useState<Test | Package | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    time: '09:00 AM',
    address: profile?.address || '',
    phone: profile?.phoneNumber || '',
    patientName: profile?.displayName || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);
  const [referrerId, setReferrerId] = useState<string | null>(null);
  const [isCheckingReferral, setIsCheckingReferral] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (testId) {
        const docRef = doc(db, 'tests', testId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setItem({ id: docSnap.id, ...docSnap.data() } as Test);
      } else if (packageId) {
        const docRef = doc(db, 'packages', packageId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setItem({ id: docSnap.id, ...docSnap.data() } as Package);
      }
      setLoading(false);
    };
    fetchData();
  }, [testId, packageId]);

  const saveBookingToFirestore = async (paymentData?: { orderId: string, paymentId: string }) => {
    if (!user || !item) return;
    
    try {
      const finalPrice = discountApplied ? item.price * 0.5 : item.price;
      const booking: Omit<BookingType, 'id'> = {
        userUid: user.uid,
        testIds: testId ? [testId] : [],
        packageIds: packageId ? [packageId] : [],
        status: 'pending',
        paymentStatus: paymentData ? 'paid' : 'pending',
        razorpayOrderId: paymentData?.orderId,
        razorpayPaymentId: paymentData?.paymentId,
        date: bookingData.date,
        time: bookingData.time,
        patientName: bookingData.patientName,
        totalAmount: finalPrice,
        createdAt: new Date().toISOString(),
      };
      
      const bookingRef = await addDoc(collection(db, 'bookings'), {
        ...booking,
        createdAt: serverTimestamp(),
      });

      // Submit to Formspree
      await submitToFormspree({
        formType: 'New Booking',
        patientName: bookingData.patientName,
        email: user.email,
        phone: bookingData.phone,
        address: bookingData.address,
        service: item.name,
        date: bookingData.date,
        time: bookingData.time,
        amount: finalPrice,
        paymentStatus: paymentData ? 'Paid' : 'Pending',
        razorpayOrderId: paymentData?.orderId,
        razorpayPaymentId: paymentData?.paymentId,
        bookingId: bookingRef.id,
        timestamp: new Date().toISOString()
      });

      // Handle referral reward
      if (discountApplied && referrerId) {
        const referralId = `ref_${Date.now()}_${user.uid}`;
        await setDoc(doc(db, 'referrals', referralId), {
          id: referralId,
          referrerId: referrerId,
          refereeId: user.uid,
          status: 'pending',
          amount: 100,
          bookingId: bookingRef.id,
          createdAt: new Date().toISOString()
        });

        // Update referrer's total earnings (pending)
        const referrerRef = doc(db, 'users', referrerId);
        const referrerDoc = await getDoc(referrerRef);
        if (referrerDoc.exists()) {
          const currentEarnings = referrerDoc.data().referralEarnings || 0;
          await updateDoc(referrerRef, {
            referralEarnings: currentEarnings + 100
          });
        }
      }
      
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 3000);
    } catch (error) {
      console.error('Booking failed:', error);
      alert('Failed to save booking. Please contact support.');
    }
  };

  const checkReferralCode = async () => {
    if (!referralCode || !user) return;
    setIsCheckingReferral(true);

    try {
      // 1. Check if it's user's first booking
      const bookingsQuery = query(collection(db, 'bookings'), where('userUid', '==', user.uid));
      const bookingsSnap = await getDocs(bookingsQuery);
      
      if (!bookingsSnap.empty) {
        alert('Referral code can only be used for your first booking.');
        setIsCheckingReferral(false);
        return;
      }

      // 2. Find referrer by code
      const usersQuery = query(collection(db, 'users'), where('referralCode', '==', referralCode.toUpperCase()));
      const usersSnap = await getDocs(usersQuery);

      if (usersSnap.empty) {
        alert('Invalid referral code.');
      } else {
        const referrerDoc = usersSnap.docs[0];
        if (referrerDoc.id === user.uid) {
          alert('You cannot use your own referral code.');
        } else {
          setReferrerId(referrerDoc.id);
          setDiscountApplied(true);
          alert('Referral code applied! 50% discount added.');
        }
      }
    } catch (error) {
      console.error('Error checking referral code:', error);
    } finally {
      setIsCheckingReferral(false);
    }
  };

  const handleRazorpayPayment = async () => {
    if (!user || !item) return;
    setIsSubmitting(true);
    const finalPrice = discountApplied ? item.price * 0.5 : item.price;

    try {
      // 1. Get Razorpay Config
      const configRes = await fetch('/api/payment/config');
      const { keyId } = await configRes.json();

      if (!keyId) {
        alert('Razorpay is not configured. Please contact the administrator.');
        setIsSubmitting(false);
        return;
      }

      // 2. Create Order
      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalPrice,
          currency: 'INR',
          receipt: `rcpt_${Date.now()}`,
        }),
      });
      const order = await orderRes.json();

      if (order.error) {
        alert(order.error);
        setIsSubmitting(false);
        return;
      }

      // 3. Open Razorpay Checkout
      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: LAB_CONFIG.name,
        description: `Payment for ${item.name}`,
        order_id: order.id,
        handler: async (response: any) => {
          // 4. Verify Payment
          const verifyRes = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          const verifyData = await verifyRes.json();

          if (verifyData.status === 'success') {
            await saveBookingToFirestore({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
            });
          } else {
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: profile?.displayName || '',
          email: profile?.email || '',
          contact: bookingData.phone || '',
        },
        theme: {
          color: '#2563eb', // blue-600
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Razorpay error:', error);
      alert('Payment failed to initialize. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!item) return <div className="text-center py-20">Item not found.</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-3xl shadow-xl border border-neutral-100 overflow-hidden">
        <div className="bg-blue-600 p-8 text-white">
          <div className="flex items-center space-x-3 mb-2">
            <Microscope className="h-6 w-6" />
            <span className="font-semibold uppercase tracking-widest text-xs text-blue-200">Test Booking</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Complete your booking</h1>
        </div>

        <div className="p-8">
          <div className="flex items-center justify-between mb-12">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step >= s ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-400'
                }`}>
                  {s}
                </div>
                {s < 3 && <div className={`flex-1 h-1 mx-4 rounded-full ${step > s ? 'bg-blue-600' : 'bg-neutral-100'}`}></div>}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-neutral-900 mb-2">Booking Confirmed!</h2>
                <p className="text-neutral-500">Your appointment has been scheduled. Redirecting to dashboard...</p>
              </motion.div>
            ) : (
              <>
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-100">
                      <h3 className="text-lg font-bold text-neutral-900 mb-4">Review Selection</h3>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-neutral-800">{item.name}</p>
                          <p className="text-sm text-neutral-500">{item.category || 'Diagnostic'}</p>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">₹{item.price}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-neutral-700 mb-2">Select Date</label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                          <input
                            type="date"
                            min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-blue-500"
                            value={bookingData.date}
                            onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-neutral-700 mb-2">Select Time Slot</label>
                        <div className="relative">
                          <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                          <select
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                            value={bookingData.time}
                            onChange={(e) => setBookingData({ ...bookingData, time: e.target.value })}
                          >
                            {['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'].map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setStep(2)}
                      className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center group"
                    >
                      Next Step
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex items-start space-x-4">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <MapPin className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-blue-900">Free Home Sample Collection</h4>
                        <p className="text-sm text-blue-700">A professional medical expert will visit this address for sample collection at your selected time. Reports will also be delivered to your home.</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-bold text-neutral-700 mb-2">Patient Name</label>
                        <input
                          type="text"
                          placeholder="Enter patient's full name"
                          className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-blue-500"
                          value={bookingData.patientName}
                          onChange={(e) => setBookingData({ ...bookingData, patientName: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-neutral-700 mb-2">Contact Number</label>
                        <input
                          type="tel"
                          placeholder="Enter your phone number"
                          className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-blue-500"
                          value={bookingData.phone}
                          onChange={(e) => setBookingData({ ...bookingData, phone: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-neutral-700 mb-2">Collection Address</label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-4 h-5 w-5 text-neutral-400" />
                          <textarea
                            placeholder="Enter full address for home collection"
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-blue-500 h-32"
                            value={bookingData.address}
                            onChange={(e) => setBookingData({ ...bookingData, address: e.target.value })}
                          ></textarea>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-4">
                      <button
                        onClick={() => setStep(1)}
                        className="flex-1 bg-neutral-100 text-neutral-600 py-4 rounded-2xl font-bold hover:bg-neutral-200 transition-all"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => setStep(3)}
                        disabled={!bookingData.phone || !bookingData.address || !bookingData.patientName}
                        className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg disabled:opacity-50"
                      >
                        Review & Pay
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div className="bg-neutral-50 p-8 rounded-3xl border border-neutral-100 space-y-6">
                      <div className="flex justify-between border-b border-neutral-200 pb-4">
                        <span className="text-neutral-500">Service</span>
                        <span className="font-bold text-neutral-900">{item.name}</span>
                      </div>
                      <div className="flex justify-between border-b border-neutral-200 pb-4">
                        <span className="text-neutral-500">Appointment</span>
                        <span className="font-bold text-neutral-900">{format(new Date(bookingData.date), 'PPP')} at {bookingData.time}</span>
                      </div>
                      <div className="flex justify-between border-b border-neutral-200 pb-4">
                        <span className="text-neutral-500">Patient</span>
                        <span className="font-bold text-neutral-900">{bookingData.patientName}</span>
                      </div>
                      
                      {!discountApplied && (
                        <div className="pt-4">
                          <label className="block text-sm font-bold text-neutral-700 mb-2">Referral Code (Optional)</label>
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              placeholder="Enter code for 50% OFF"
                              className="flex-1 px-4 py-2 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                              value={referralCode}
                              onChange={(e) => setReferralCode(e.target.value)}
                            />
                            <button
                              onClick={checkReferralCode}
                              disabled={isCheckingReferral || !referralCode}
                              className="bg-neutral-900 text-white px-6 py-2 rounded-xl font-bold hover:bg-neutral-800 transition-all disabled:opacity-50"
                            >
                              {isCheckingReferral ? '...' : 'Apply'}
                            </button>
                          </div>
                          <p className="text-xs text-neutral-500 mt-2">Valid only for your first booking.</p>
                        </div>
                      )}

                      {discountApplied && (
                        <div className="flex justify-between border-b border-neutral-200 pb-4 text-green-600">
                          <span className="font-medium">Referral Discount (50% OFF)</span>
                          <span className="font-bold">-₹{item.price * 0.5}</span>
                        </div>
                      )}

                      <div className="flex justify-between pt-2">
                        <span className="text-xl font-bold text-neutral-900">Total Amount</span>
                        <span className="text-2xl font-extrabold text-blue-600">₹{discountApplied ? item.price * 0.5 : item.price}</span>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                      <div className="flex items-center space-x-3 mb-4">
                        <CreditCard className="h-6 w-6 text-blue-600" />
                        <h3 className="font-bold text-blue-900">Secure Online Payment</h3>
                      </div>
                      <p className="text-sm text-blue-700 mb-4">
                        We use Razorpay for secure payments. You can pay using UPI, Cards, Netbanking, or Wallets.
                      </p>
                      <div className="flex items-center space-x-2 text-blue-600 font-medium text-sm">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Instant confirmation after payment</span>
                      </div>
                    </div>

                    <div className="flex space-x-4">
                      <button
                        onClick={() => setStep(2)}
                        className="flex-1 bg-neutral-100 text-neutral-600 py-4 rounded-2xl font-bold hover:bg-neutral-200 transition-all"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleRazorpayPayment}
                        disabled={isSubmitting}
                        className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <CreditCard className="h-5 w-5" />
                            <span>Pay & Confirm Booking</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
