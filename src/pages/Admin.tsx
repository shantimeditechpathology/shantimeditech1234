import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, addDoc, serverTimestamp, deleteDoc, setDoc, where, getDocs, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Booking, Test, Package, Report } from '../types';
import { LayoutDashboard, FlaskConical, Package as PackageIcon, ClipboardList, FileText, Plus, Edit2, Trash2, CheckCircle2, XCircle, Search, Upload, Users, Navigation, MapPin, UserPlus, BookOpen, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

interface KnowledgePost {
  id: string;
  title: string;
  content: string;
  category: string;
  author: string;
  date: string;
  createdAt: any;
  image?: string;
  excerpt?: string;
  readTime?: string;
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'bookings' | 'tests' | 'packages' | 'reports' | 'referrals' | 'delivery' | 'users' | 'knowledge' | 'settings'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<any[]>([]);
  const [knowledgePosts, setKnowledgePosts] = useState<KnowledgePost[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<any>({ referralAmount: 100, referralMessage: 'Share this code with your friends. They get 50% off on their first test!' });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    const unsubBookings = onSnapshot(query(collection(db, 'bookings'), orderBy('createdAt', 'desc')), (snap) => {
      setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'bookings');
    });
    const unsubTests = onSnapshot(query(collection(db, 'tests'), orderBy('name')), (snap) => {
      setTests(snap.docs.map(d => ({ id: d.id, ...d.data() } as Test)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'tests');
    });
    const unsubPackages = onSnapshot(query(collection(db, 'packages'), orderBy('name')), (snap) => {
      setPackages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Package)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'packages');
    });
    const unsubReports = onSnapshot(query(collection(db, 'reports'), orderBy('createdAt', 'desc')), (snap) => {
      setReports(snap.docs.map(d => ({ id: d.id, ...d.data() } as Report)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'reports');
    });
    const unsubReferrals = onSnapshot(query(collection(db, 'referrals'), orderBy('createdAt', 'desc')), (snap) => {
      setReferrals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'referrals');
    });
    const unsubDelivery = onSnapshot(query(collection(db, 'users'), where('role', '==', 'delivery')), (snap) => {
      setDeliveryBoys(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });
    const unsubKnowledge = onSnapshot(query(collection(db, 'knowledge_posts'), orderBy('createdAt', 'desc')), (snap) => {
      setKnowledgePosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as KnowledgePost)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'knowledge_posts');
    });
    const unsubAllUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setAllUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });
    const unsubSettings = onSnapshot(doc(db, 'settings', 'site'), (snap) => {
      if (snap.exists()) {
        setSiteSettings(snap.data());
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings');
    });

    setLoading(false);
    return () => {
      unsubBookings();
      unsubTests();
      unsubPackages();
      unsubReports();
      unsubReferrals();
      unsubDelivery();
      unsubKnowledge();
      unsubAllUsers();
      unsubSettings();
    };
  }, []);

  const handleStatusUpdate = async (bookingId: string, status: string) => {
    await updateDoc(doc(db, 'bookings', bookingId), { status });

    // If booking is completed, check for associated referral
    if (status === 'completed') {
      const referralsQuery = query(collection(db, 'referrals'), where('bookingId', '==', bookingId));
      const referralsSnap = await getDocs(referralsQuery);

      if (!referralsSnap.empty) {
        const referralDoc = referralsSnap.docs[0];
        const referralData = referralDoc.data();

        if (referralData.status === 'pending') {
          // 1. Update referral status
          await updateDoc(doc(db, 'referrals', referralDoc.id), { status: 'completed' });

          // 2. Update referrer's withdrawable balance
          const referrerRef = doc(db, 'users', referralData.referrerId);
          const referrerDoc = await getDoc(referrerRef);
          if (referrerDoc.exists()) {
            const currentBalance = referrerDoc.data().withdrawableBalance || 0;
            await updateDoc(referrerRef, {
              withdrawableBalance: currentBalance + referralData.amount
            });
          }
        }
      }
    }
  };

  const handleDelete = async (collectionName: string, id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      await deleteDoc(doc(db, collectionName, id));
    }
  };

  const seedData = async () => {
    const initialTests = [
      { name: 'Complete Blood Count (CBC)', price: 499, category: 'Hematology', description: 'Measures different components of blood.' },
      { name: 'All Blood Test (General)', price: 1200, category: 'Blood Test', description: 'Comprehensive screening of blood parameters.' },
      { name: 'Urine Routine & Microscopy', price: 299, category: 'Urine Test', description: 'Analysis of urine for diagnostic purposes.' },
      { name: 'Blood Sugar (Fast & PP)', price: 199, category: 'Diabetes', description: 'Measures glucose levels in blood.' },
      { name: 'Thyroid Profile (T3, T4, TSH)', price: 799, category: 'Hormones', description: 'Evaluates thyroid gland function.' },
      { name: 'Lipid Profile', price: 899, category: 'Biochemistry', description: 'Measures cholesterol and triglycerides.' },
      { name: 'Liver Function Test (LFT)', price: 999, category: 'Biochemistry', description: 'Assesses liver health.' },
    ];

    const initialPackages = [
      { name: 'Full Body Checkup', price: 1999, category: 'Wellness', tests: ['CBC', 'LFT', 'KFT', 'Lipid Profile'], description: 'Complete health assessment.' },
      { name: 'Diabetes Care', price: 1499, category: 'Specialized', tests: ['HbA1c', 'Fast Blood Sugar', 'Urine Routine'], description: 'Comprehensive diabetes monitoring.' },
    ];

    try {
      for (const test of initialTests) {
        await addDoc(collection(db, 'tests'), { ...test, createdAt: new Date().toISOString() });
      }
      for (const pkg of initialPackages) {
        await addDoc(collection(db, 'packages'), { ...pkg, createdAt: new Date().toISOString() });
      }
      alert('Requested tests and packages added successfully!');
    } catch (error) {
      console.error('Error seeding data:', error);
      alert('Failed to add tests. Check console for details.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (activeTab === 'tests') {
        if (editingItem?.id) {
          await updateDoc(doc(db, 'tests', editingItem.id), editingItem);
        } else {
          await addDoc(collection(db, 'tests'), { ...editingItem, createdAt: new Date().toISOString() });
        }
      } else if (activeTab === 'packages') {
        if (editingItem?.id) {
          await updateDoc(doc(db, 'packages', editingItem.id), editingItem);
        } else {
          await addDoc(collection(db, 'packages'), { ...editingItem, createdAt: new Date().toISOString() });
        }
      } else if (activeTab === 'knowledge') {
        if (editingItem?.id) {
          await updateDoc(doc(db, 'knowledge_posts', editingItem.id), {
            ...editingItem,
            updatedAt: new Date().toISOString()
          });
        } else {
          await addDoc(collection(db, 'knowledge_posts'), {
            ...editingItem,
            createdAt: new Date().toISOString(),
            date: format(new Date(), 'MMMM dd, yyyy')
          });
        }
      }
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Failed to save item.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-neutral-900 tracking-tight mb-2">Admin Panel</h1>
          <p className="text-neutral-500">Manage bookings, tests, packages and patient reports.</p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={seedData}
            className="bg-neutral-100 text-neutral-700 px-6 py-2 rounded-xl font-bold hover:bg-neutral-200 transition-all"
          >
            Seed Initial Data
          </button>
          <button
            onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
            className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Add New</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-8 bg-neutral-100 p-1.5 rounded-2xl w-fit">
        {[
          { id: 'bookings', label: 'Bookings & Payments', icon: ClipboardList },
          { id: 'tests', label: 'Tests', icon: FlaskConical },
          { id: 'packages', label: 'Packages', icon: PackageIcon },
          { id: 'reports', label: 'Reports', icon: FileText },
          { id: 'referrals', label: 'Referrals', icon: Users },
          { id: 'knowledge', label: 'Knowledge Center', icon: BookOpen },
          { id: 'delivery', label: 'Delivery Boys', icon: Navigation },
          { id: 'users', label: 'User Management', icon: Users },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'settings'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden min-h-[400px]">
        {activeTab === 'bookings' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-neutral-50 border-b border-neutral-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Booking ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Address</th>
                  <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Date/Time</th>
                  <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Assign To</th>
                  <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-neutral-500">#{booking.id.slice(-6).toUpperCase()}</td>
                    <td className="px-6 py-4 font-bold text-neutral-900">{booking.patientName || 'N/A'}</td>
                    <td className="px-6 py-4 text-xs text-neutral-500 max-w-[200px] truncate" title={booking.address}>
                      {booking.address || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      {booking.date} <br />
                      <span className="text-xs text-neutral-400">{booking.time}</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-neutral-900">₹{booking.totalAmount}</td>
                    <td className="px-6 py-4">
                      <select
                        value={booking.paymentStatus || 'pending'}
                        onChange={(e) => updateDoc(doc(db, 'bookings', booking.id), { paymentStatus: e.target.value })}
                        className={`text-[10px] font-bold px-2 py-1 rounded-full border outline-none focus:ring-2 focus:ring-blue-500 ${
                          booking.paymentStatus === 'paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                        }`}
                      >
                        <option value="pending">PENDING</option>
                        <option value="paid">PAID</option>
                        <option value="failed">FAILED</option>
                        <option value="refunded">REFUNDED</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={booking.status}
                        onChange={(e) => handleStatusUpdate(booking.id, e.target.value)}
                        className="text-xs font-bold px-3 py-1.5 rounded-full border border-neutral-200 outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="pending">PENDING</option>
                        <option value="confirmed">CONFIRMED</option>
                        <option value="completed">COMPLETED</option>
                        <option value="cancelled">CANCELLED</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={booking.assignedTo || ''}
                        onChange={(e) => updateDoc(doc(db, 'bookings', booking.id), { assignedTo: e.target.value, deliveryStatus: 'assigned' })}
                        className="text-[10px] font-bold px-2 py-1 rounded-full border border-neutral-200 outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Unassigned</option>
                        {deliveryBoys.map(dboy => (
                          <option key={dboy.id} value={dboy.id}>{dboy.displayName || dboy.email}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDelete('bookings', booking.id)} className="text-red-500 hover:text-red-700 p-2">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'tests' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {tests.map((test) => (
              <div key={test.id} className="bg-neutral-50 p-6 rounded-2xl border border-neutral-100 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-neutral-900">{test.name}</h3>
                  <p className="text-xs text-neutral-500 mb-2">{test.category}</p>
                  <p className="text-lg font-extrabold text-blue-600">₹{test.price}</p>
                </div>
                <div className="flex space-x-2">
                  <button className="text-neutral-400 hover:text-blue-600"><Edit2 className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete('tests', test.id)} className="text-neutral-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'packages' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            {packages.map((pkg) => (
              <div key={pkg.id} className="bg-neutral-50 p-6 rounded-2xl border border-neutral-100 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-neutral-900">{pkg.name}</h3>
                  <p className="text-xs text-neutral-500 mb-4">{pkg.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {pkg.tests?.map((t, i) => (
                      <span key={i} className="text-[10px] bg-white px-2 py-1 rounded-md border border-neutral-200">{t}</span>
                    ))}
                  </div>
                  <p className="text-lg font-extrabold text-blue-600">₹{pkg.price}</p>
                </div>
                <div className="flex space-x-2">
                  <button className="text-neutral-400 hover:text-blue-600"><Edit2 className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete('packages', pkg.id)} className="text-neutral-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="p-6">
            <div className="text-center py-20">
              <FileText className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-500">Report management interface would go here.</p>
            </div>
          </div>
        )}
        {activeTab === 'referrals' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-neutral-50 border-b border-neutral-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Referrer ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Referee ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {referrals.map((ref) => (
                  <tr key={ref.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-neutral-500">{ref.referrerId.slice(0, 8)}...</td>
                    <td className="px-6 py-4 font-mono text-xs text-neutral-500">{ref.refereeId.slice(0, 8)}...</td>
                    <td className="px-6 py-4">
                      <input 
                        type="number" 
                        value={ref.amount}
                        onChange={(e) => updateDoc(doc(db, 'referrals', ref.id), { amount: Number(e.target.value) })}
                        className="w-20 px-2 py-1 rounded border border-neutral-200 text-sm font-bold"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={ref.status}
                        onChange={(e) => updateDoc(doc(db, 'referrals', ref.id), { status: e.target.value })}
                        className={`text-[10px] font-bold px-2 py-1 rounded-full border outline-none ${
                          ref.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                        }`}
                      >
                        <option value="pending">PENDING</option>
                        <option value="completed">COMPLETED</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      {new Date(ref.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleDelete('referrals', ref.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {activeTab === 'knowledge' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-neutral-900">Knowledge Center Articles</h2>
              <button 
                onClick={() => {
                  setEditingItem({
                    title: '',
                    excerpt: '',
                    content: '',
                    author: '',
                    category: 'Health',
                    image: 'https://images.unsplash.com/photo-1505751172177-51ad18601bc8?auto=format&fit=crop&q=80&w=800',
                    readTime: '5 min read'
                  });
                  setIsModalOpen(true);
                }}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center space-x-2 hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span>Add Article</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {knowledgePosts.map((post) => (
                <div key={post.id} className="bg-white rounded-3xl border border-neutral-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <img src={post.image} alt={post.title} className="w-full h-48 object-cover" />
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs font-bold uppercase">{post.category}</span>
                      <div className="flex space-x-2">
                        <button onClick={() => { setEditingItem(post); setIsModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete('knowledge_posts', post.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <h3 className="font-black text-neutral-900 mb-2 line-clamp-2">{post.title}</h3>
                    <p className="text-neutral-500 text-sm line-clamp-3 mb-4">{post.excerpt}</p>
                    <div className="flex items-center text-xs text-neutral-400 font-bold uppercase tracking-wider">
                      <span>{post.author}</span>
                      <span className="mx-2">•</span>
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'delivery' && (
          <div className="p-6">
            <div className="mb-8 bg-blue-50 p-6 rounded-2xl border border-blue-100">
              <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Add New Delivery Boy
              </h3>
              <div className="flex gap-4">
                <input 
                  type="email" 
                  id="delivery-email"
                  placeholder="Enter user email to assign delivery role"
                  className="flex-1 px-4 py-3 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button 
                  onClick={async () => {
                    const email = (document.getElementById('delivery-email') as HTMLInputElement).value;
                    if (!email) return;
                    const q = query(collection(db, 'users'), where('email', '==', email));
                    const snap = await getDocs(q);
                    if (!snap.empty) {
                      await updateDoc(doc(db, 'users', snap.docs[0].id), { role: 'delivery' });
                      alert('Delivery role assigned successfully!');
                      (document.getElementById('delivery-email') as HTMLInputElement).value = '';
                    } else {
                      alert('User not found with this email.');
                    }
                  }}
                  className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md"
                >
                  Assign Role
                </button>
              </div>
              <div className="mt-4 pt-4 border-t border-blue-100 flex items-center justify-between">
                <p className="text-xs text-blue-600 italic">Note: The user must have already registered on the platform.</p>
                <Link to="/register/delivery" className="text-xs font-black text-blue-700 hover:underline flex items-center gap-1">
                  <UserPlus className="h-3 w-3" /> Or Register New Delivery Partner
                </Link>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
              <thead className="bg-neutral-50 border-b border-neutral-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Live Location</th>
                  <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {deliveryBoys.map((dboy) => (
                  <tr key={dboy.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-neutral-900">{dboy.displayName || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-neutral-600">{dboy.email}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
                        dboy.isAvailable ? 'bg-green-50 text-green-700 border-green-200' : 'bg-neutral-50 text-neutral-500 border-neutral-200'
                      }`}>
                        {dboy.isAvailable ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {dboy.location ? (
                        <a
                          href={`https://www.google.com/maps?q=${dboy.location.lat},${dboy.location.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-xs font-bold"
                        >
                          <MapPin className="h-3 w-3" /> View on Map
                        </a>
                      ) : (
                        <span className="text-xs text-neutral-400 italic">No location data</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => updateDoc(doc(db, 'users', dboy.id), { role: 'user' })}
                        className="text-red-500 hover:text-red-700 text-xs font-bold"
                      >
                        Remove Role
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}
        {activeTab === 'users' && (
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-neutral-50 border-b border-neutral-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {allUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                            {u.displayName?.[0] || u.email[0].toUpperCase()}
                          </div>
                          <span className="font-bold text-neutral-900">{u.displayName || 'No Name'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600">{u.email}</td>
                      <td className="px-6 py-4">
                        <select 
                          value={u.role}
                          onChange={(e) => updateDoc(doc(db, 'users', u.id), { role: e.target.value })}
                          className={`text-[10px] font-bold px-2 py-1 rounded-full border outline-none ${
                            u.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            u.role === 'delivery' ? 'bg-green-50 text-green-700 border-green-200' :
                            'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          <option value="user">USER</option>
                          <option value="delivery">DELIVERY</option>
                          <option value="admin">ADMIN</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-500">
                        {u.createdAt ? format(new Date(u.createdAt), 'MMM dd, yyyy') : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => handleDelete('users', u.id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="p-10 max-w-2xl">
            <h2 className="text-2xl font-black text-neutral-900 mb-8">Site Settings</h2>
            <div className="space-y-8">
              <div className="bg-neutral-50 p-8 rounded-3xl border border-neutral-100">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="bg-blue-100 p-3 rounded-2xl">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900">Referral Program</h3>
                    <p className="text-xs text-neutral-500">Set the reward amount for each successful referral.</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-neutral-700 mb-2">Referral Reward Amount (₹)</label>
                    <input 
                      type="number" 
                      value={siteSettings.referralAmount || 100}
                      onChange={(e) => setSiteSettings({ ...siteSettings, referralAmount: Number(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-neutral-700 mb-2">Referral Message</label>
                    <textarea 
                      value={siteSettings.referralMessage || ''}
                      onChange={(e) => setSiteSettings({ ...siteSettings, referralMessage: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-blue-500 h-24"
                      placeholder="Enter the message users will see on the referral page..."
                    />
                  </div>
                  <button 
                    onClick={async () => {
                      await setDoc(doc(db, 'settings', 'site'), siteSettings, { merge: true });
                      alert('Settings updated successfully!');
                    }}
                    className="w-full bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-neutral-100 flex justify-between items-center">
                <h2 className="text-2xl font-black text-neutral-900">
                  {editingItem?.id ? 'Edit' : 'Add New'} {activeTab.slice(0, -1)}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                  <XCircle className="h-6 w-6 text-neutral-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 overflow-y-auto max-h-[calc(90vh-160px)]">
                <div className="space-y-6">
                  {activeTab === 'tests' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Test Name</label>
                        <input 
                          type="text" 
                          required
                          value={editingItem?.name || ''}
                          onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Price (₹)</label>
                          <input 
                            type="number" 
                            required
                            value={editingItem?.price || ''}
                            onChange={(e) => setEditingItem({ ...editingItem, price: Number(e.target.value) })}
                            className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Category</label>
                          <input 
                            type="text" 
                            required
                            value={editingItem?.category || ''}
                            onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Description</label>
                        <textarea 
                          value={editingItem?.description || ''}
                          onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-blue-500 h-24"
                        />
                      </div>
                    </>
                  )}

                  {activeTab === 'packages' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Package Name</label>
                        <input 
                          type="text" 
                          required
                          value={editingItem?.name || ''}
                          onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Price (₹)</label>
                        <input 
                          type="number" 
                          required
                          value={editingItem?.price || ''}
                          onChange={(e) => setEditingItem({ ...editingItem, price: Number(e.target.value) })}
                          className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Tests (comma separated)</label>
                        <input 
                          type="text" 
                          value={editingItem?.tests?.join(', ') || ''}
                          onChange={(e) => setEditingItem({ ...editingItem, tests: e.target.value.split(',').map(s => s.trim()) })}
                          className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Description</label>
                        <textarea 
                          value={editingItem?.description || ''}
                          onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-blue-500 h-24"
                        />
                      </div>
                    </>
                  )}

                  {activeTab === 'knowledge' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Article Title</label>
                        <input 
                          type="text" 
                          required
                          value={editingItem?.title || ''}
                          onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Author</label>
                          <input 
                            type="text" 
                            required
                            value={editingItem?.author || ''}
                            onChange={(e) => setEditingItem({ ...editingItem, author: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Category</label>
                          <input 
                            type="text" 
                            required
                            value={editingItem?.category || ''}
                            onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Image URL</label>
                        <input 
                          type="text" 
                          value={editingItem?.image || ''}
                          onChange={(e) => setEditingItem({ ...editingItem, image: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Excerpt</label>
                        <textarea 
                          required
                          value={editingItem?.excerpt || ''}
                          onChange={(e) => setEditingItem({ ...editingItem, excerpt: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-blue-500 h-20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Full Content</label>
                        <textarea 
                          required
                          value={editingItem?.content || ''}
                          onChange={(e) => setEditingItem({ ...editingItem, content: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-blue-500 h-48"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-10 flex space-x-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-4 rounded-2xl font-bold text-neutral-500 bg-neutral-100 hover:bg-neutral-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-6 py-4 rounded-2xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                  >
                    {editingItem?.id ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
