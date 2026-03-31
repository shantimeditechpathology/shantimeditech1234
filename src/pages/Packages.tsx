import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Package } from '../types';
import { Heart, CheckCircle2, ShoppingCart, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

export default function Packages() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'packages'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const packagesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Package));
      setPackages(packagesData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'packages');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="relative min-h-screen">
      {/* Background Visuals */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-blue-50/50 rounded-full blur-3xl -ml-24 -mt-24"></div>
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-purple-50/50 rounded-full blur-3xl -mr-24 -mb-24"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-neutral-900 tracking-tight mb-4">Health Checkup Packages</h1>
          <p className="text-neutral-500 max-w-2xl mx-auto">
            Comprehensive health checkups tailored for different age groups and lifestyles.
            Early detection is the key to a healthy life.
          </p>
        </div>

        {/* Subscription Plans Section */}
        <section className="mb-24">
          <div className="flex items-center justify-center space-x-3 mb-12">
            <div className="h-px w-12 bg-neutral-200"></div>
            <h2 className="text-xl font-black text-blue-600 uppercase tracking-[0.3em]">Subscription Plans</h2>
            <div className="h-px w-12 bg-neutral-200"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: 'Chronic Care Monthly',
                price: '999',
                period: 'month',
                features: ['Monthly Blood Sugar Check', 'Quarterly HbA1c', 'Free Home Collection', 'Health Trends'],
                color: 'bg-blue-600'
              },
              {
                title: 'Senior Citizen Annual',
                price: '9999',
                period: 'year',
                features: ['Full Body Checkup (2/year)', 'Monthly Vital Monitoring', 'Priority Support', 'Family Profile Access'],
                color: 'bg-purple-600'
              }
            ].map((plan) => (
              <div key={plan.title} className="bg-white rounded-[3rem] p-10 border border-neutral-100 shadow-xl hover:shadow-2xl transition-all relative overflow-hidden group">
                <div className={`absolute top-0 right-0 w-32 h-32 ${plan.color} opacity-5 rounded-bl-[5rem] group-hover:scale-110 transition-transform`}></div>
                <h3 className="text-2xl font-black text-neutral-900 mb-2">{plan.title}</h3>
                <div className="flex items-baseline space-x-2 mb-8">
                  <span className="text-5xl font-black text-neutral-900">₹{plan.price}</span>
                  <span className="text-neutral-400 font-bold">/{plan.period}</span>
                </div>
                <ul className="space-y-4 mb-10">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center space-x-3 text-neutral-600 font-medium">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-5 rounded-2xl font-black text-white ${plan.color} shadow-lg hover:brightness-110 transition-all`}>
                  Subscribe Now
                </button>
              </div>
            ))}
          </div>
        </section>

        {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-96 bg-neutral-100 rounded-3xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {packages.map((pkg) => (
            <motion.div
              key={pkg.id}
              whileHover={{ y: -10 }}
              className="bg-white rounded-3xl overflow-hidden border border-neutral-100 shadow-sm hover:shadow-xl transition-all flex flex-col"
            >
              <div className="bg-blue-600 p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Heart className="h-24 w-24" />
                </div>
                <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
                <div className="flex items-baseline space-x-2">
                  <span className="text-4xl font-bold">₹{pkg.price}</span>
                  <span className="text-blue-200 line-through text-sm">₹{Math.round(pkg.price * 1.5)}</span>
                </div>
              </div>
              
              <div className="p-8 flex-grow">
                <p className="text-neutral-600 mb-6 text-sm leading-relaxed">
                  {pkg.description || 'Comprehensive health assessment for complete peace of mind.'}
                </p>
                
                <div className="space-y-3 mb-8">
                  {pkg.tests?.slice(0, 5).map((test, idx) => (
                    <div key={idx} className="flex items-start space-x-3 text-sm text-neutral-700">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                      <span>{test}</span>
                    </div>
                  ))}
                  {pkg.tests && pkg.tests.length > 5 && (
                    <p className="text-xs text-blue-600 font-semibold pl-8">
                      + {pkg.tests.length - 5} more tests included
                    </p>
                  )}
                </div>
              </div>
              
              <div className="p-8 pt-0">
                <Link
                  to={`/booking?packageId=${pkg.id}`}
                  className="w-full flex items-center justify-center space-x-2 bg-neutral-900 text-white py-4 rounded-2xl font-bold hover:bg-blue-600 transition-all shadow-md group"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span>Book Package</span>
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && packages.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-neutral-300">
          <Heart className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-neutral-900">No packages available</h3>
          <p className="text-neutral-500">Check back later for new health packages.</p>
        </div>
      )}
      </div>
    </div>
  );
}
