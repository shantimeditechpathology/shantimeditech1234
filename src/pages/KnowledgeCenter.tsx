import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Calendar, User, ArrowRight, Search, Tag, Heart, Shield, Activity } from 'lucide-react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { KnowledgePost } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

export default function KnowledgeCenter() {
  const [posts, setPosts] = useState<KnowledgePost[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'knowledge_posts'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as KnowledgePost)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'knowledge_posts');
    });
    return unsub;
  }, []);

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative min-h-screen bg-neutral-50 pb-20">
      {/* Hero Section */}
      <section className="relative py-24 bg-blue-600 text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&q=80&w=2000" 
            alt="Healthcare Background"
            className="w-full h-full object-cover opacity-10"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-blue-600/90 to-blue-700"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-full text-sm font-bold mb-6 backdrop-blur-sm">
              <BookOpen className="h-4 w-4" />
              <span>Health Knowledge Center</span>
            </div>
            <h1 className="text-5xl font-black tracking-tight mb-6">Expert Health Insights & Tips</h1>
            <p className="text-blue-100 text-xl max-w-2xl mx-auto mb-10">
              Stay informed with the latest medical research, wellness advice, and diagnostic guides from our experts.
            </p>
            
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-neutral-400" />
              <input 
                type="text" 
                placeholder="Search articles (e.g., Diabetes, Heart Health)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white text-neutral-900 pl-16 pr-6 py-5 rounded-2xl shadow-xl focus:outline-none focus:ring-4 focus:ring-white/20 transition-all"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <div className="flex flex-wrap justify-center gap-4">
          {[
            { icon: Heart, label: 'Heart Health' },
            { icon: Activity, label: 'Diabetes' },
            { icon: Shield, label: 'Immunity' },
            { icon: Tag, label: 'Diagnostics' }
          ].map((cat) => (
            <button 
              key={cat.label} 
              onClick={() => setSearchTerm(cat.label)}
              className="bg-white px-8 py-4 rounded-2xl shadow-lg border border-neutral-100 flex items-center space-x-3 hover:bg-blue-50 transition-all group"
            >
              <cat.icon className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-neutral-800">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Blog Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {filteredPosts.map((post, idx) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-[3rem] overflow-hidden shadow-xl border border-neutral-100 group flex flex-col"
              >
                <div className="h-72 relative overflow-hidden">
                  <img 
                    src={post.image} 
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-6 left-6 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest">
                    {post.category}
                  </div>
                </div>
                
                <div className="p-10 flex-grow">
                  <div className="flex items-center space-x-4 text-xs text-neutral-400 font-bold uppercase tracking-widest mb-6">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>{post.date}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>{post.author}</span>
                    </div>
                  </div>
                  
                  <h2 className="text-3xl font-black text-neutral-900 mb-4 group-hover:text-blue-600 transition-colors leading-tight">
                    {post.title}
                  </h2>
                  <p className="text-neutral-500 text-sm mb-8 leading-relaxed line-clamp-3">
                    {post.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between mt-auto pt-8 border-t border-neutral-50">
                    <span className="text-sm font-bold text-neutral-400 uppercase tracking-widest">{post.readTime}</span>
                    <button className="flex items-center space-x-2 text-blue-600 font-black text-lg group/btn">
                      <span>Read More</span>
                      <ArrowRight className="h-5 w-5 group-hover/btn:translate-x-2 transition-transform" />
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <BookOpen className="h-16 w-16 text-neutral-200 mx-auto mb-4" />
            <h3 className="text-2xl font-black text-neutral-900 mb-2">No articles found</h3>
            <p className="text-neutral-500">Try searching for something else or check back later.</p>
          </div>
        )}
      </section>
    </div>
  );
}
