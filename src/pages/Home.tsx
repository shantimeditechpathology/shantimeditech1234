import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Microscope, ShieldCheck, Clock, FileText, ArrowRight, Activity, Heart, FlaskConical, Sparkles, TrendingUp, BookOpen, CheckCircle2, MapPin, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LAB_CONFIG } from '../constants';

export default function Home() {
  const { isAdmin } = useAuth();
  const { t } = useLanguage();

  const stats = [
    { label: 'Happy Patients', value: '50,000+' },
    { label: 'Tests Available', value: '500+' },
    { label: 'Expert Doctors', value: '20+' },
    { label: 'Years Experience', value: '15+' }
  ];

  const features = [
    { title: 'Advanced Lab', desc: 'State-of-the-art diagnostic equipment for accurate results.' },
    { title: 'Quick Reports', desc: 'Get your test reports within 24 hours of sample collection.' },
    { title: 'Home Collection', desc: 'Free home sample collection by professional phlebotomists.' },
    { title: 'Expert Care', desc: 'Highly qualified medical staff and experienced pathologists.' }
  ];

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative h-[90vh] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1579154234431-da6781d706c1?auto=format&fit=crop&q=80&w=2000" 
            alt="Medical Lab Background"
            className="w-full h-full object-cover opacity-20"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent"></div>
        </div>
        
        <div className="absolute inset-0 z-10 overflow-y-auto custom-scrollbar">
          <div className="min-h-full flex items-center py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h1 className="text-5xl lg:text-7xl font-extrabold text-neutral-900 leading-tight mb-6 tracking-tight">
                  {t('hero.title').split('Better Health')[0]} <span className="text-blue-600">{t('hero.title').includes('Better Health') ? 'Better Health' : (t('hero.title').includes('बेहतर स्वास्थ्य') ? 'बेहतर स्वास्थ्य' : '')}</span>
                </h1>
                <p className="text-xl text-neutral-600 mb-8 max-w-lg leading-relaxed">
                  {t('hero.subtitle')}
                </p>
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <Link
                    to="/tests"
                    className="bg-blue-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center group"
                  >
                    {t('hero.bookTest')}
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/packages"
                    className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-50 transition-all flex items-center justify-center"
                  >
                    {t('hero.healthPackages')}
                  </Link>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="hidden lg:block relative"
              >
                <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl border-8 border-white">
                  <img
                    src="https://images.unsplash.com/photo-1579154234431-da6781d706c1?auto=format&fit=crop&q=80&w=1000"
                    alt="Laboratory"
                    className="w-full h-auto object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="absolute -bottom-10 -left-10 bg-white p-6 rounded-2xl shadow-xl z-20 flex items-center space-x-4 border border-neutral-100">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <ShieldCheck className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-neutral-900">NABL Accredited</p>
                    <p className="text-xs text-neutral-500">Highest Quality Standards</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-neutral-900 mb-4">Why Choose {LAB_CONFIG.name}?</h2>
          <div className="w-20 h-1.5 bg-blue-600 mx-auto rounded-full"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {features.map((feature, idx) => {
            const icons = [Microscope, Activity, Clock, FileText];
            const Icon = icons[idx % icons.length];
            return (
              <motion.div
                key={idx}
                whileHover={{ y: -10 }}
                className="bg-white p-8 rounded-3xl shadow-sm border border-neutral-100 text-center"
              >
                <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">{feature.title}</h3>
                <p className="text-neutral-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Home Collection Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-blue-600 rounded-[3rem] text-white overflow-hidden relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <div>
            <span className="bg-white/20 text-white px-4 py-1 rounded-full text-sm font-bold mb-6 inline-block">Premium Service</span>
            <h2 className="text-4xl lg:text-5xl font-black mb-6 leading-tight">Free Home Sample Collection</h2>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Don't step out. Our professional medical experts will visit your home for sample collection. Safe, hygienic, and completely free of charge.
            </p>
            <ul className="space-y-4 mb-10">
              {[
                'Professional Phlebotomists',
                'Hygienic & Safe Collection',
                'Reports Delivered to Your Doorstep',
                'Zero Convenience Fees'
              ].map((item, i) => (
                <li key={i} className="flex items-center space-x-3">
                  <div className="bg-white/20 p-1 rounded-full">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/tests"
              className="bg-white text-blue-600 px-10 py-4 rounded-full font-black text-lg hover:bg-blue-50 transition-all shadow-xl inline-block"
            >
              Book Home Collection
            </Link>
          </div>
          <div className="relative">
            <div className="rounded-3xl overflow-hidden shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
              <img
                src="https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&q=80&w=1000"
                alt="Home Collection"
                className="w-full h-auto object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>
      </section>

      {/* Popular Packages Section */}
      <section className="relative py-24 text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&q=80&w=2000" 
            alt="Healthcare Background"
            className="w-full h-full object-cover opacity-10"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-neutral-900/95"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-4">Popular Health Packages</h2>
              <p className="text-neutral-400 max-w-md">Comprehensive checkups designed for your lifestyle and age group.</p>
            </div>
            <Link to="/packages" className="text-blue-400 hover:text-blue-300 font-semibold flex items-center mt-4 md:mt-0">
              View All Packages <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Basic Wellness', price: '₹999', tests: '45+ Tests', color: 'bg-blue-600' },
              { name: 'Executive Health', price: '₹2499', tests: '75+ Tests', color: 'bg-indigo-600' },
              { name: 'Senior Citizen', price: '₹1999', tests: '60+ Tests', color: 'bg-purple-600' },
            ].map((pkg, idx) => (
              <div key={idx} className="bg-neutral-800 rounded-3xl p-8 border border-neutral-700 hover:border-blue-500 transition-all group">
                <div className={`${pkg.color} w-12 h-12 rounded-xl flex items-center justify-center mb-6`}>
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
                <p className="text-neutral-400 mb-6">{pkg.tests} included</p>
                <div className="flex items-baseline space-x-2 mb-8">
                  <span className="text-3xl font-bold">{pkg.price}</span>
                  <span className="text-neutral-500 line-through text-sm">₹4999</span>
                </div>
                <Link
                  to="/booking"
                  className="block w-full text-center bg-white text-neutral-900 py-3 rounded-xl font-bold hover:bg-blue-500 hover:text-white transition-all"
                >
                  Book Now
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-white rounded-[3rem] shadow-xl border border-neutral-100 -mt-10 relative z-20 grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat, idx) => (
          <div key={idx} className="text-center">
            <p className="text-4xl font-extrabold text-blue-600 mb-2">{stat.value}</p>
            <p className="text-neutral-500 font-medium uppercase tracking-wider text-xs">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Smart Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-neutral-900 tracking-tight mb-4">Smart Health Tools</h2>
          <p className="text-neutral-500 max-w-2xl mx-auto">
            Experience the future of diagnostics with our personalized health tracking and expert insights.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: 'Health Trends',
              desc: 'Track your vital metrics with interactive charts and data.',
              icon: TrendingUp,
              path: '/dashboard',
              color: 'bg-purple-50 text-purple-600'
            },
            {
              title: 'Knowledge Center',
              desc: 'Expert health tips, diet advice, and medical insights.',
              icon: BookOpen,
              path: '/knowledge',
              color: 'bg-green-50 text-green-600'
            }
          ].map((feature) => (
            <Link 
              key={feature.title} 
              to={feature.path}
              className="bg-white p-10 rounded-[3rem] border border-neutral-100 shadow-sm hover:shadow-xl transition-all group"
            >
              <div className={`${feature.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                <feature.icon className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-black text-neutral-900 mb-4">{feature.title}</h3>
              <p className="text-neutral-500 mb-8 leading-relaxed">{feature.desc}</p>
              <div className="flex items-center text-blue-600 font-bold group-hover:translate-x-2 transition-transform">
                <span>Try Now</span>
                <ArrowRight className="ml-2 h-5 w-5" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
