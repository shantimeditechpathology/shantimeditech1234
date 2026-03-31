import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, FileText, RefreshCcw, Mail, Phone, MapPin, CheckCircle2 } from 'lucide-react';
import { LAB_CONFIG } from '../constants';
import { submitToFormspree } from '../lib/utils';

const PageHeader = ({ title, icon: Icon }: { title: string, icon: any }) => (
  <div className="pt-32 pb-20 px-4 bg-blue-600">
    <div className="max-w-4xl mx-auto text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="inline-flex items-center justify-center p-4 bg-white/10 rounded-3xl backdrop-blur-xl mb-6"
      >
        <Icon className="h-8 w-8 text-white" />
      </motion.div>
      <h1 className="text-4xl md:text-5xl font-black text-white mb-4">{title}</h1>
      <p className="text-blue-100 text-lg">Last updated: {new Date().toLocaleDateString()}</p>
    </div>
  </div>
);

const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <section className="mb-12">
    <h2 className="text-2xl font-bold text-neutral-900 mb-6 flex items-center">
      <span className="w-2 h-8 bg-blue-600 rounded-full mr-4"></span>
      {title}
    </h2>
    <div className="text-neutral-600 leading-relaxed space-y-4 text-lg">
      {children}
    </div>
  </section>
);

export const PrivacyPolicy = () => (
  <div className="bg-white min-h-screen">
    <PageHeader title="Privacy Policy" icon={Shield} />
    <div className="max-w-4xl mx-auto px-4 py-20">
      <Section title="Introduction">
        <p>Welcome to {LAB_CONFIG.name}. We are committed to protecting your personal data and your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website and use our services.</p>
      </Section>
      <Section title="Information We Collect">
        <p>We collect information that you provide directly to us, including:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Name and contact information (email, phone number, address)</li>
          <li>Health information related to diagnostic tests</li>
          <li>Payment information (processed securely)</li>
          <li>Account login credentials</li>
        </ul>
      </Section>
      <Section title="How We Use Your Information">
        <p>Your information is used to:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Provide and manage diagnostic services</li>
          <li>Process payments and bookings</li>
          <li>Send test reports and notifications</li>
          <li>Improve our services and customer experience</li>
        </ul>
      </Section>
      <Section title="Data Security">
        <p>We implement a variety of security measures to maintain the safety of your personal information. Your health data is treated with the highest level of confidentiality and is only accessible to authorized personnel.</p>
      </Section>
    </div>
  </div>
);

export const TermsAndConditions = () => (
  <div className="bg-white min-h-screen">
    <PageHeader title="Terms & Conditions" icon={FileText} />
    <div className="max-w-4xl mx-auto px-4 py-20">
      <Section title="Agreement to Terms">
        <p>By accessing or using the services provided by {LAB_CONFIG.name}, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our services.</p>
      </Section>
      <Section title="Services Provided">
        <p>We provide diagnostic testing and health checkup packages. The reports provided are for informational purposes and should be discussed with a qualified medical professional for diagnosis and treatment.</p>
      </Section>
      <Section title="User Responsibilities">
        <p>Users are responsible for providing accurate personal and health information. Any misuse of the platform or providing false information may lead to account suspension.</p>
      </Section>
      <Section title="Payment Terms">
        <p>All payments must be made in full at the time of booking or as specified. Prices are subject to change without prior notice.</p>
      </Section>
    </div>
  </div>
);

export const RefundPolicy = () => (
  <div className="bg-white min-h-screen">
    <PageHeader title="Refund & Cancellation" icon={RefreshCcw} />
    <div className="max-w-4xl mx-auto px-4 py-20">
      <Section title="Cancellation Policy">
        <p>Bookings can be cancelled up to 24 hours before the scheduled appointment time for a full refund. Cancellations made within 24 hours may be subject to a cancellation fee.</p>
      </Section>
      <Section title="Refund Process">
        <p>Refunds for cancelled bookings will be processed back to the original payment method within 5-7 working days. Please note that bank processing times may vary.</p>
      </Section>
      <Section title="Non-Refundable Cases">
        <p>Refunds will not be provided once the sample collection has been completed or the test has been processed.</p>
      </Section>
      <Section title="Contact for Refunds">
        <p>For any refund-related queries, please contact us at {LAB_CONFIG.email} or call {LAB_CONFIG.phone}.</p>
      </Section>
    </div>
  </div>
);

export const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const ok = await submitToFormspree({
      formType: 'Contact Form',
      ...formData,
      timestamp: new Date().toISOString()
    });

    if (ok) {
      setSuccess(true);
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setSuccess(false), 5000);
    } else {
      alert('Failed to send message. Please try again or contact us directly.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="bg-white min-h-screen">
      <PageHeader title="Contact Us" icon={Mail} />
      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <Section title="Get in Touch">
              <p>Have questions about our tests or your reports? Our team is here to help you.</p>
            </Section>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-neutral-900">Phone</p>
                  <p className="text-neutral-600">{LAB_CONFIG.phone}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-neutral-900">Email</p>
                  <p className="text-neutral-600">{LAB_CONFIG.email}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-neutral-900">Address</p>
                  <p className="text-neutral-600">{LAB_CONFIG.address}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-neutral-50 p-8 rounded-3xl border border-neutral-100">
            <h3 className="text-xl font-bold text-neutral-900 mb-6">Send us a message</h3>
            {success ? (
              <div className="bg-green-50 p-8 rounded-2xl border border-green-100 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h4 className="text-lg font-bold text-green-900 mb-2">Message Sent!</h4>
                <p className="text-green-700">Thank you for reaching out. We'll get back to you soon.</p>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-sm font-bold text-neutral-700 mb-2">Full Name</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-neutral-700 mb-2">Email Address</label>
                  <input 
                    type="email" 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-neutral-700 mb-2">Message</label>
                  <textarea 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-blue-500 h-32" 
                    placeholder="How can we help you?"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  ></textarea>
                </div>
                <button 
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
