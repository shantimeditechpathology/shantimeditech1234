import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Booking, UserProfile, Report } from '../types';
import { Calendar, Clock, MapPin, Activity, User, Settings, ArrowRight, CheckCircle2, AlertCircle, Plus, TrendingUp, Users, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';
import { submitToFormspree } from '../lib/utils';

const MOCK_TRENDS_DATA = [
  { date: 'Jan', glucose: 95, cholesterol: 180, vitaminD: 25 },
  { date: 'Feb', glucose: 105, cholesterol: 175, vitaminD: 28 },
  { date: 'Mar', glucose: 98, cholesterol: 190, vitaminD: 32 },
  { date: 'Apr', glucose: 92, cholesterol: 185, vitaminD: 30 },
  { date: 'May', glucose: 100, cholesterol: 170, vitaminD: 35 },
  { date: 'Jun', glucose: 96, cholesterol: 165, vitaminD: 40 },
];

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [familyMembers, setFamilyMembers] = useState<{ id: string, name: string, relation: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddFamily, setShowAddFamily] = useState(false);
  const [newFamilyMember, setNewFamilyMember] = useState({ name: '', relation: '' });

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'bookings'),
      where('userUid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeBookings = onSnapshot(q, (snapshot) => {
      const bookingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      setBookings(bookingsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'bookings');
    });

    const reportsQ = query(
      collection(db, 'reports'),
      where('userUid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeReports = onSnapshot(reportsQ, (snapshot) => {
      const reportsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
      setReports(reportsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'reports');
    });

    const familyQ = query(
      collection(db, 'familyMembers'),
      where('userUid', '==', user.uid)
    );

    const unsubscribeFamily = onSnapshot(familyQ, (snapshot) => {
      const familyData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setFamilyMembers(familyData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'familyMembers');
    });

    return () => {
      unsubscribeBookings();
      unsubscribeReports();
      unsubscribeFamily();
    };
  }, [user]);

  const handleAddFamily = async () => {
    if (!user || !newFamilyMember.name || !newFamilyMember.relation) return;
    try {
      await addDoc(collection(db, 'familyMembers'), {
        ...newFamilyMember,
        userUid: user.uid,
        createdAt: serverTimestamp()
      });

      // Submit to Formspree
      await submitToFormspree({
        formType: 'New Family Member Added',
        userName: profile?.displayName || user.email,
        userEmail: user.email,
        memberName: newFamilyMember.name,
        relation: newFamilyMember.relation,
        timestamp: new Date().toISOString()
      });

      setNewFamilyMember({ name: '', relation: '' });
      setShowAddFamily(false);
    } catch (error) {
      console.error("Error adding family member:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'confirmed': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'completed': return 'bg-green-50 text-green-600 border-green-200';
      case 'cancelled': return 'bg-red-50 text-red-600 border-red-200';
      default: return 'bg-neutral-50 text-neutral-600 border-neutral-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-50 text-green-700 border-green-200';
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'failed': return 'bg-red-50 text-red-700 border-red-200';
      case 'refunded': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-neutral-50 text-neutral-600 border-neutral-200';
    }
  };

  const completedBookings = bookings.filter(b => b.status === 'completed');
  const hasReports = reports.length > 0;
  const healthScore = hasReports ? (profile?.healthScore || 0) : 0;
  const healthTrends = profile?.healthTrends || [];
  const hasTrends = healthTrends.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Sidebar */}
        <div className="lg:col-span-1 space-y-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-8 rounded-3xl shadow-sm border border-neutral-100 text-center"
          >
            <div className="relative inline-block mb-6">
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mx-auto border-4 border-white shadow-md overflow-hidden">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={profile?.displayName} className="w-full h-full object-cover" />
                ) : (
                  <User className="h-12 w-12 text-blue-600" />
                )}
              </div>
              <div className="absolute bottom-0 right-0 bg-green-500 w-6 h-6 rounded-full border-4 border-white"></div>
            </div>
            
            <h2 className="text-2xl font-bold text-neutral-900 mb-1">{profile?.displayName}</h2>
            <p className="text-neutral-500 text-sm mb-4">{profile?.email}</p>
            
            {profile?.role !== 'delivery' && profile?.role !== 'admin' && (
              <button 
                onClick={async () => {
                  if (user) {
                    await updateDoc(doc(db, 'users', user.uid), { role: 'delivery' });
                    window.location.reload();
                  }
                }}
                className="mb-4 text-[10px] font-black text-green-600 uppercase tracking-widest bg-green-50 px-3 py-1 rounded-lg border border-green-100 hover:bg-green-600 hover:text-white transition-all"
              >
                Become a Delivery Boy (Test)
              </button>
            )}
            
            {profile?.referralCode && (
              <div className="mb-6 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 inline-flex items-center space-x-2">
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Referral Code:</span>
                <span className="text-sm font-black text-blue-700 tracking-widest">{profile.referralCode}</span>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4 border-t border-neutral-100 pt-6">
              <div className="text-center">
                <p className="text-xl font-bold text-neutral-900">{bookings.length}</p>
                <p className="text-xs text-neutral-400 uppercase font-semibold">Bookings</p>
              </div>
              <div className="text-center border-l border-neutral-100">
                <p className="text-xl font-bold text-neutral-900">{completedBookings.length}</p>
                <p className="text-xs text-neutral-400 uppercase font-semibold">Reports</p>
              </div>
            </div>
          </motion.div>

          <div className="bg-neutral-900 p-8 rounded-3xl text-white">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-blue-400" />
              Health Tips
            </h3>
            <p className="text-sm text-neutral-400 leading-relaxed mb-6">
              Stay hydrated and maintain a balanced diet for better diagnostic results. Regular checkups help in early detection.
            </p>
            <Link to="/packages" className="text-blue-400 hover:text-blue-300 font-semibold text-sm flex items-center">
              Explore Health Packages <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          {/* Family Profile Section */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-neutral-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-neutral-900 flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-600" />
                Family Members
              </h3>
              <button 
                onClick={() => setShowAddFamily(true)}
                className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              {familyMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                      {member.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-900">{member.name}</p>
                      <p className="text-[10px] text-neutral-400 uppercase font-black">{member.relation}</p>
                    </div>
                  </div>
                  <button className="text-neutral-300 hover:text-red-500 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {familyMembers.length === 0 && (
                <p className="text-center text-xs text-neutral-400 italic py-4">No family members added yet.</p>
              )}
            </div>

            <AnimatePresence>
              {showAddFamily && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 pt-6 border-t border-neutral-100 space-y-4"
                >
                  <input 
                    type="text" 
                    placeholder="Full Name"
                    value={newFamilyMember.name}
                    onChange={(e) => setNewFamilyMember(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <select 
                    value={newFamilyMember.relation}
                    onChange={(e) => setNewFamilyMember(prev => ({ ...prev, relation: e.target.value }))}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Select Relation</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Sibling">Sibling</option>
                  </select>
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => setShowAddFamily(false)}
                      className="flex-1 py-3 text-sm font-bold text-neutral-500 hover:bg-neutral-100 rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleAddFamily}
                      className="flex-1 py-3 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md"
                    >
                      Add Member
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Health Score & Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 bg-white rounded-[3rem] p-10 border border-neutral-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-black text-neutral-900 mb-2">Your Health Score</h2>
                  <p className="text-neutral-500">Based on your recent test results and activity.</p>
                </div>
                <div className="bg-green-50 text-green-600 px-4 py-2 rounded-full font-bold text-sm flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  +5% this month
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-12">
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="currentColor"
                      strokeWidth="16"
                      fill="transparent"
                      className="text-neutral-100"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="currentColor"
                      strokeWidth="16"
                      fill="transparent"
                      strokeDasharray={552.92}
                      strokeDashoffset={552.92 * (1 - (healthScore / 100))}
                      className="text-blue-600 transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-black text-neutral-900">{healthScore}</span>
                    <span className="text-neutral-400 font-bold uppercase tracking-widest text-xs">
                      {healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : healthScore >= 40 ? 'Fair' : 'Needs Checkup'}
                    </span>
                  </div>
                </div>

                <div className="flex-grow space-y-6">
                  {[
                    { label: 'Glucose', value: hasReports ? 85 : 0, color: 'bg-blue-600' },
                    { label: 'Cholesterol', value: hasReports ? 72 : 0, color: 'bg-purple-600' },
                    { label: 'Vitamin D', value: hasReports ? 45 : 0, color: 'bg-orange-500' }
                  ].map((stat) => (
                    <div key={stat.label}>
                      <div className="flex justify-between mb-2">
                        <span className="font-bold text-neutral-700">{stat.label}</span>
                        <span className="text-neutral-500 font-medium">{stat.value}%</span>
                      </div>
                      <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${stat.value}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className={`h-full ${stat.color}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-[3rem] p-10 text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <Activity className="h-32 w-32" />
            </div>
            <div className="relative z-10 h-full flex flex-col">
              <h3 className="text-2xl font-black mb-6">Health Insights</h3>
              <p className="text-blue-50 mb-8 leading-relaxed">
                Regular checkups and a balanced diet are key to maintaining your health score. Track your trends to stay ahead.
              </p>
              <div className="mt-auto">
                <Link to="/knowledge" className="w-full bg-white text-blue-600 py-4 rounded-2xl font-black hover:bg-blue-50 transition-all flex items-center justify-center group/btn">
                  Read Health Articles
                  <ArrowRight className="ml-2 h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-10 rounded-[3rem] border border-neutral-100 shadow-sm flex items-center justify-between group">
            <div className="flex items-center space-x-6">
              <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-black text-neutral-900">Health Wallet</h3>
                <p className="text-neutral-500 font-bold tracking-widest uppercase text-xs">Balance: ₹{profile?.referralEarnings || 0}</p>
              </div>
            </div>
            <Link to="/referral" className="bg-neutral-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-600 transition-all">
              Add Money
            </Link>
          </div>

          <div className="bg-blue-600 p-10 rounded-[3rem] shadow-xl flex items-center justify-between group text-white">
            <div className="flex items-center space-x-6">
              <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black">Online Consultation</h3>
                <p className="text-blue-100 font-bold tracking-widest uppercase text-xs">Talk to a Doctor Now</p>
              </div>
            </div>
            <button className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-50 transition-all">
              Book Call
            </button>
          </div>
        </div>

        {/* Health Trends Dashboard */}
          <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-neutral-100">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-neutral-900 tracking-tight flex items-center">
                  <TrendingUp className="h-6 w-6 mr-2 text-blue-600" />
                  Health Trends
                </h2>
                <p className="text-sm text-neutral-400">Track your vital metrics over time.</p>
              </div>
              <div className="flex space-x-2">
                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Glucose</span>
                <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Cholesterol</span>
              </div>
            </div>

            <div className="h-[300px] w-full">
              {hasTrends ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={healthTrends}>
                    <defs>
                      <linearGradient id="colorGlucose" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="glucose" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorGlucose)" />
                    <Area type="monotone" dataKey="cholesterol" stroke="#9333ea" strokeWidth={3} fillOpacity={0} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-neutral-400">
                  <Activity className="h-12 w-12 mb-4 opacity-20" />
                  <p className="text-sm font-medium">No health trends data available yet.</p>
                  <p className="text-xs">Complete tests to see your progress here.</p>
                </div>
              )}
            </div>
          </section>

          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-neutral-900 tracking-tight">Recent Bookings</h2>
            <Link to="/tests" className="text-blue-600 font-semibold hover:text-blue-700 text-sm">
              Book New Test
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-neutral-100 rounded-3xl animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.length > 0 ? (
                bookings.map((booking) => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(booking.status)}`}>
                            {booking.status.toUpperCase()}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${getPaymentStatusColor(booking.paymentStatus || 'pending')}`}>
                            PAYMENT: {(booking.paymentStatus || 'pending').toUpperCase()}
                          </span>
                          <span className="text-xs text-neutral-400 font-medium">ID: #{booking.id.slice(-6).toUpperCase()}</span>
                        </div>
                        
                        <h3 className="text-xl font-bold text-neutral-900">
                          {booking.testIds?.length ? 'Diagnostic Test' : 'Health Package'}
                        </h3>
                        
                        {booking.patientName && (
                          <div className="flex items-center space-x-2 text-sm text-blue-600 font-bold bg-blue-50 w-fit px-3 py-1 rounded-lg">
                            <User className="h-3 w-3" />
                            <span>Patient: {booking.patientName}</span>
                          </div>
                        )}
                        
                        <div className="flex flex-wrap gap-4 text-sm text-neutral-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(booking.date), 'PPP')}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{booking.time}</span>
                          </div>
                          <div className="flex items-center space-x-1 w-full mt-2">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate" title={booking.address}>{booking.address}</span>
                          </div>
                        </div>

                        {/* Delivery Tracking */}
                        {booking.assignedTo && booking.status !== 'completed' && booking.status !== 'cancelled' && (
                          <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Activity className="h-4 w-4 text-blue-600 animate-pulse" />
                                <span className="text-sm font-bold text-blue-900">Delivery Tracking</span>
                              </div>
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-600 text-white rounded-full uppercase">
                                {booking.deliveryStatus?.replace('_', ' ') || 'Assigned'}
                              </span>
                            </div>
                            
                            {booking.deliveryBoyLocation ? (
                              <div className="space-y-3">
                                <p className="text-xs text-blue-700">The delivery boy is on the way to your location.</p>
                                <a
                                  href={`https://www.google.com/maps?q=${booking.deliveryBoyLocation.lat},${booking.deliveryBoyLocation.lng}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center space-x-2 text-xs font-bold text-blue-600 hover:text-blue-700 bg-white px-3 py-2 rounded-lg border border-blue-200 shadow-sm transition-all"
                                >
                                  <MapPin className="h-3 w-3" />
                                  <span>View Live Location on Map</span>
                                </a>
                              </div>
                            ) : (
                              <p className="text-xs text-blue-600 italic">Waiting for delivery boy to start movement...</p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col justify-between items-end">
                        <p className="text-2xl font-bold text-neutral-900">₹{booking.totalAmount}</p>
                        {booking.status === 'completed' ? (
                          <Link
                            to="/reports"
                            className="text-blue-600 font-bold hover:text-blue-700 flex items-center text-sm"
                          >
                            View Report <ArrowRight className="ml-1 h-4 w-4" />
                          </Link>
                        ) : (
                          <span className="text-neutral-400 text-sm italic">Report pending</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-neutral-200">
                  <div className="bg-neutral-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="h-10 w-10 text-neutral-300" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900">No bookings yet</h3>
                  <p className="text-neutral-500 mb-8">Start your health journey by booking a diagnostic test.</p>
                  <Link
                    to="/tests"
                    className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md"
                  >
                    Browse Tests
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
