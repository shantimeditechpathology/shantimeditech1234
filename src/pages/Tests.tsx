import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Test } from '../types';
import { Search, FlaskConical, ShoppingCart, Filter } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

export default function Tests() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const q = query(collection(db, 'tests'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const testsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Test));
      setTests(testsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'tests');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const categories = ['All', ...Array.from(new Set(tests.map(t => t.category).filter(Boolean)))];

  const filteredTests = tests.filter(test => {
    const matchesSearch = test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         test.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || test.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const bodyParts = [
    { id: 'brain', label: 'Brain', icon: '🧠', category: 'Neurology' },
    { id: 'heart', label: 'Heart', icon: '❤️', category: 'Cardiology' },
    { id: 'liver', label: 'Liver', icon: '🧪', category: 'Liver' },
    { id: 'kidney', label: 'Kidney', icon: '💧', category: 'Kidney' },
    { id: 'stomach', label: 'Stomach', icon: '🍽️', category: 'Gastro' },
    { id: 'bones', label: 'Bones', icon: '🦴', category: 'Bone' },
    { id: 'lungs', label: 'Lungs', icon: '🫁', category: 'Respiratory' },
    { id: 'blood', label: 'Blood', icon: '🩸', category: 'Hematology' }
  ];

  return (
    <div className="relative min-h-screen">
      {/* Background Visuals */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-50/50 rounded-full blur-3xl -mr-24 -mt-24"></div>
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-indigo-50/50 rounded-full blur-3xl -ml-24 -mb-24"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Interactive Body Map Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-neutral-900 tracking-tight mb-2">Interactive Body Map</h2>
            <p className="text-neutral-500">Click on a body part to find related diagnostic tests.</p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4">
            {bodyParts.map((part) => (
              <button
                key={part.id}
                onClick={() => setSelectedCategory(part.category)}
                className={`flex flex-col items-center p-6 rounded-[2rem] border-2 transition-all group ${
                  selectedCategory === part.category 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-xl scale-105' 
                    : 'bg-white border-neutral-100 text-neutral-600 hover:border-blue-500 hover:shadow-lg'
                }`}
              >
                <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">{part.icon}</span>
                <span className="text-xs font-black uppercase tracking-widest">{part.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Prescription Upload Banner */}
        <div className="mb-20 bg-gradient-to-r from-blue-600 to-blue-800 rounded-[3rem] p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <img 
              src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=1000" 
              alt="Medical"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="md:w-2/3 relative z-10">
            <h2 className="text-4xl font-black mb-4 leading-tight">Don't know which test to book?</h2>
            <p className="text-blue-100 text-lg leading-relaxed">Upload your doctor's prescription and let our experts guide you. We'll suggest the right tests and book them for you at the best prices.</p>
          </div>
          <button className="bg-white text-blue-600 px-12 py-5 rounded-2xl font-black shadow-lg hover:bg-blue-50 transition-all whitespace-nowrap relative z-10 hover:scale-105 active:scale-95">
            Upload Prescription
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 space-y-6 md:space-y-0">
        <div>
          <h1 className="text-4xl font-extrabold text-neutral-900 tracking-tight mb-2">Diagnostic Tests</h1>
          <p className="text-neutral-500">Search and book from our wide range of individual tests.</p>
        </div>
        
        <div className="relative max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search for a test (e.g. CBC, Diabetes)..."
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-neutral-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat || 'All')}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-neutral-600 border border-neutral-200 hover:border-blue-500'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-48 bg-neutral-100 rounded-3xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTests.map((test) => (
            <motion.div
              key={test.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-blue-50 p-3 rounded-2xl">
                  <FlaskConical className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-2xl font-bold text-neutral-900">₹{test.price}</span>
              </div>
              
              <h3 className="text-xl font-bold text-neutral-900 mb-2 group-hover:text-blue-600 transition-colors">
                {test.name}
              </h3>
              <p className="text-neutral-500 text-sm mb-6 line-clamp-2">
                {test.description || 'Comprehensive diagnostic test for accurate health assessment.'}
              </p>
              
              <Link
                to={`/booking?testId=${test.id}`}
                className="w-full flex items-center justify-center space-x-2 bg-neutral-50 text-neutral-900 py-3 rounded-xl font-bold hover:bg-blue-600 hover:text-white transition-all"
              >
                <ShoppingCart className="h-5 w-5" />
                <span>Book Test</span>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && filteredTests.length === 0 && (
        <div className="text-center py-20">
          <div className="bg-neutral-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="h-10 w-10 text-neutral-400" />
          </div>
          <h3 className="text-xl font-bold text-neutral-900">No tests found</h3>
          <p className="text-neutral-500">Try searching with a different keyword.</p>
        </div>
      )}
      </div>
    </div>
  );
}
