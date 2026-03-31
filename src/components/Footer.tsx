import React from 'react';
import { Microscope, Phone, Mail, MapPin, Facebook, Twitter, Instagram, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LAB_CONFIG } from '../constants';
import { useAuth } from '../context/AuthContext';

export default function Footer() {
  const { isAdmin } = useAuth();

  return (
    <footer className="bg-neutral-900 text-neutral-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center space-x-2 text-white mb-4">
              <Microscope className="h-8 w-8 text-blue-500" />
              <span className="text-xl font-bold tracking-tight">{LAB_CONFIG.name}</span>
            </div>
            <p className="text-sm leading-relaxed mb-6">
              Leading pathology lab providing accurate and timely diagnostic services. Operating in 15+ countries with global quality standards.
            </p>
            <div className="space-y-3 text-xs">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-blue-500" />
                <span>{LAB_CONFIG.phone}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-blue-500" />
                <span>{LAB_CONFIG.email}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-blue-500 transition-colors">Home</Link></li>
              <li><Link to="/tests" className="hover:text-blue-500 transition-colors">All Tests</Link></li>
              <li><Link to="/packages" className="hover:text-blue-500 transition-colors">Health Packages</Link></li>
              <li><Link to="/reports" className="hover:text-blue-500 transition-colors">Download Reports</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/privacy" className="hover:text-blue-500 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-blue-500 transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/refund" className="hover:text-blue-500 transition-colors">Refund Policy</Link></li>
              <li><Link to="/contact" className="hover:text-blue-500 transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              <a href="#" className="bg-neutral-800 p-2 rounded-full hover:bg-blue-600 hover:text-white transition-all">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="bg-neutral-800 p-2 rounded-full hover:bg-blue-400 hover:text-white transition-all">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="bg-neutral-800 p-2 rounded-full hover:bg-pink-600 hover:text-white transition-all">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-neutral-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs">&copy; {new Date().getFullYear()} {LAB_CONFIG.name}. All rights reserved.</p>
          
          {isAdmin && (
            <Link 
              to="/admin" 
              className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-neutral-600 hover:text-blue-500 transition-colors bg-neutral-800/50 px-3 py-1.5 rounded-lg border border-neutral-800"
            >
              <Shield className="h-3 w-3" />
              <span>Admin Access</span>
            </Link>
          )}
        </div>
      </div>
    </footer>
  );
}
