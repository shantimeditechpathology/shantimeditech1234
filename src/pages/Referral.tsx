import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Share2, Users, Wallet, Copy, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot, orderBy, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Referral } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';
import { submitToFormspree } from '../lib/utils';

export default function ReferralPage() {
  const { profile } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [copied, setCopied] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [referralAmount, setReferralAmount] = useState(100);
  const [referralMessage, setReferralMessage] = useState('Share this code with your friends. They get 50% off on their first test!');

  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, 'settings', 'site'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setReferralAmount(data.referralAmount || 100);
        setReferralMessage(data.referralMessage || 'Share this code with your friends. They get 50% off on their first test!');
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings');
    });

    return () => unsubSettings();
  }, []);

  useEffect(() => {
    if (!profile?.uid) return;

    const q = query(
      collection(db, 'referrals'),
      where('referrerId', '==', profile.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const refs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Referral));
      setReferrals(refs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'referrals');
    });

    return () => unsubscribe();
  }, [profile?.uid]);

  const copyToClipboard = () => {
    if (profile?.referralCode) {
      navigator.clipboard.writeText(profile.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWithdraw = async () => {
    if (!profile || (profile.withdrawableBalance || 0) < 500) return;
    
    setIsWithdrawing(true);
    const ok = await submitToFormspree({
      formType: 'Withdrawal Request',
      userId: profile.uid,
      userName: profile.displayName,
      email: profile.email,
      phone: profile.phoneNumber,
      amount: profile.withdrawableBalance,
      timestamp: new Date().toISOString()
    });

    if (ok) {
      alert('Withdrawal request submitted successfully! Our team will contact you for payment details.');
    } else {
      alert('Failed to submit withdrawal request. Please try again later.');
    }
    setIsWithdrawing(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-neutral-900 mb-4">Refer & Earn</h1>
        <p className="text-neutral-500 text-lg">Invite your friends and earn ₹{referralAmount} for each successful referral!</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Referral Code Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden"
        >
          <div className="relative z-10">
            <Share2 className="h-12 w-12 mb-6 opacity-50" />
            <h3 className="text-xl font-bold mb-2">Your Referral Code</h3>
            <div className="flex items-center justify-between bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
              <span className="text-3xl font-black tracking-widest">
                {profile?.referralCode || (
                  <div className="h-8 w-32 bg-white/20 animate-pulse rounded-lg"></div>
                )}
              </span>
              <button
                onClick={copyToClipboard}
                disabled={!profile?.referralCode}
                className="p-2 hover:bg-white/20 rounded-xl transition-all disabled:opacity-50"
              >
                {copied ? <CheckCircle2 className="h-6 w-6" /> : <Copy className="h-6 w-6" />}
              </button>
            </div>
            <p className="mt-6 text-blue-100 text-sm">{referralMessage}</p>
          </div>
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        </motion.div>

        {/* Total Earnings Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-8 border border-neutral-100 shadow-xl"
        >
          <Wallet className="h-12 w-12 text-green-600 mb-6" />
          <h3 className="text-xl font-bold text-neutral-900 mb-2">Total Earnings</h3>
          <p className="text-4xl font-black text-neutral-900">₹{profile?.referralEarnings || 0}</p>
          <div className="mt-6 flex items-center text-sm text-neutral-500">
            <Clock className="h-4 w-4 mr-2" />
            <span>Includes pending rewards</span>
          </div>
        </motion.div>

        {/* Withdrawable Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-8 border border-neutral-100 shadow-xl"
        >
          <Users className="h-12 w-12 text-blue-600 mb-6" />
          <h3 className="text-xl font-bold text-neutral-900 mb-2">Withdrawable Balance</h3>
          <p className="text-4xl font-black text-blue-600">₹{profile?.withdrawableBalance || 0}</p>
          <button
            onClick={handleWithdraw}
            disabled={(profile?.withdrawableBalance || 0) < 500 || isWithdrawing}
            className="mt-6 w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isWithdrawing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              (profile?.withdrawableBalance || 0) < 500 ? 'Min ₹500 to withdraw' : 'Withdraw Now'
            )}
          </button>
        </motion.div>
      </div>

      {/* Referral History */}
      <div className="bg-white rounded-3xl border border-neutral-100 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-neutral-100">
          <h3 className="text-2xl font-bold text-neutral-900">Referral History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-neutral-50 text-neutral-500 text-sm uppercase tracking-wider">
              <tr>
                <th className="px-8 py-4 font-bold">Date</th>
                <th className="px-8 py-4 font-bold">Status</th>
                <th className="px-8 py-4 font-bold">Reward</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {referrals.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-8 py-12 text-center text-neutral-500">
                    No referrals yet. Start sharing your code!
                  </td>
                </tr>
              ) : (
                referrals.map((ref) => (
                  <tr key={ref.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-8 py-6 text-neutral-900 font-medium">
                      {new Date(ref.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        ref.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {ref.status === 'completed' ? 'Completed' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-neutral-900 font-bold">
                      ₹{ref.amount}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
