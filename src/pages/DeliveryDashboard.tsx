import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Booking, DeliveryStatus } from '../types';
import { MapPin, Phone, Clock, CheckCircle2, Navigation, CreditCard, X, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { LAB_CONFIG } from '../constants';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

export default function DeliveryDashboard() {
  const { user, profile } = useAuth();
  const [tasks, setTasks] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Booking | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isAvailable, setIsAvailable] = useState(profile?.isAvailable || false);

  // Update live location
  useEffect(() => {
    if (!user || !isAvailable) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updateDoc(doc(db, 'users', user.uid), {
          location: { lat: latitude, lng: longitude },
        });
        
        // Also update active bookings
        tasks.forEach(task => {
          if (task.deliveryStatus === 'on_the_way') {
            updateDoc(doc(db, 'bookings', task.id), {
              deliveryBoyLocation: { lat: latitude, lng: longitude }
            });
          }
        });
      },
      (error) => console.error('Error watching location:', error),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [user, isAvailable, tasks]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'bookings'),
      where('assignedTo', '==', user.uid),
      where('status', 'in', ['confirmed', 'pending'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Booking)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'bookings');
    });

    return () => unsubscribe();
  }, [user]);

  const updateTaskStatus = async (taskId: string, status: DeliveryStatus) => {
    await updateDoc(doc(db, 'bookings', taskId), { deliveryStatus: status });
    if (status === 'delivered') {
      await updateDoc(doc(db, 'bookings', taskId), { status: 'completed' });
    }
  };

  const toggleAvailability = async () => {
    if (!user) return;
    const newStatus = !isAvailable;
    setIsAvailable(newStatus);
    await updateDoc(doc(db, 'users', user.uid), { isAvailable: newStatus });
  };

  const getUpiUrl = (amount: number, bookingId: string) => {
    return `upi://pay?pa=${LAB_CONFIG.upiId}&pn=${encodeURIComponent(LAB_CONFIG.name)}&am=${amount}&tn=${encodeURIComponent('Booking ' + bookingId)}&cu=INR`;
  };

  if (loading) return <div className="p-8 text-center">Loading tasks...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Delivery Dashboard</h1>
          <p className="text-neutral-500">Welcome back, {profile?.displayName}</p>
        </div>
        <button
          onClick={toggleAvailability}
          className={`px-6 py-2 rounded-full font-bold transition-all ${
            isAvailable 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
          }`}
        >
          {isAvailable ? '● Online & Available' : '○ Offline'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          Assigned Tasks ({tasks.length})
        </h2>

        {tasks.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-dashed border-neutral-200 text-center">
            <p className="text-neutral-500 italic">No tasks assigned yet.</p>
          </div>
        ) : (
          tasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm space-y-4"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
                      task.deliveryStatus === 'delivered' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {task.deliveryStatus?.toUpperCase() || 'ASSIGNED'}
                    </span>
                    <span className="text-xs text-neutral-400 font-mono">#{task.id.slice(-6).toUpperCase()}</span>
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900">
                    {task.testIds?.length ? 'Sample Collection' : 'Report Delivery'}
                  </h3>
                </div>
                <p className="text-xl font-black text-blue-600">₹{task.totalAmount}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-neutral-600">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-neutral-400 mt-1 flex-shrink-0" />
                  <span>{task.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-neutral-400" />
                  <span>{task.date} at {task.time}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-4 border-t border-neutral-50">
                {task.deliveryStatus !== 'on_the_way' && task.deliveryStatus !== 'sampled' && task.deliveryStatus !== 'delivered' && (
                  <button
                    onClick={() => updateTaskStatus(task.id, 'on_the_way')}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Navigation className="h-4 w-4" /> Start Journey
                  </button>
                )}
                
                {task.deliveryStatus === 'on_the_way' && (
                  <button
                    onClick={() => updateTaskStatus(task.id, 'sampled')}
                    className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Sample Collected
                  </button>
                )}

                {task.deliveryStatus === 'sampled' && (
                  <button
                    onClick={() => updateTaskStatus(task.id, 'delivered')}
                    className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Report Delivered
                  </button>
                )}

                <button
                  onClick={() => {
                    setSelectedTask(task);
                    setShowPaymentModal(true);
                  }}
                  className="flex-1 bg-neutral-900 text-white py-3 rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2"
                >
                  <CreditCard className="h-4 w-4" /> Take UPI Payment
                </button>
                
                {task.userLocation && (
                  <a
                    href={`https://www.google.com/maps?q=${task.userLocation.lat},${task.userLocation.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-white text-neutral-900 border border-neutral-200 py-3 rounded-xl font-bold hover:bg-neutral-50 transition-all flex items-center justify-center gap-2"
                  >
                    <MapPin className="h-4 w-4" /> View User Location
                  </a>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] p-8 relative overflow-hidden"
            >
              <button
                onClick={() => setShowPaymentModal(false)}
                className="absolute top-6 right-6 p-2 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <X className="h-6 w-6 text-neutral-400" />
              </button>

              <div className="text-center space-y-6">
                <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                  <CreditCard className="h-10 w-10 text-blue-600" />
                </div>
                
                <div>
                  <h3 className="text-2xl font-black text-neutral-900">UPI Payment</h3>
                  <p className="text-neutral-500">Scan to pay for Booking #{selectedTask.id.slice(-6).toUpperCase()}</p>
                </div>

                <div className="bg-white p-4 rounded-3xl border-2 border-neutral-100 inline-block mx-auto">
                  <QRCodeSVG value={getUpiUrl(selectedTask.totalAmount, selectedTask.id)} size={200} />
                </div>

                <div className="bg-neutral-50 p-4 rounded-2xl text-left">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-neutral-500 font-medium uppercase tracking-wider">Amount to Pay</span>
                    <span className="text-2xl font-black text-blue-600">₹{selectedTask.totalAmount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-500 font-medium uppercase tracking-wider">UPI ID</span>
                    <span className="text-sm font-bold text-neutral-900">{LAB_CONFIG.upiId}</span>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    await updateDoc(doc(db, 'bookings', selectedTask.id), {
                      paymentStatus: 'paid',
                      upiPaymentId: 'UPI_' + Math.random().toString(36).substring(2, 10).toUpperCase()
                    });
                    setShowPaymentModal(false);
                  }}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg"
                >
                  Mark as Paid
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
