import React from 'react';
import { MessageCircle } from 'lucide-react';
import { LAB_CONFIG } from '../constants';

export default function WhatsAppButton() {
  const phoneNumber = LAB_CONFIG.phone;
  const message = `Hello ${LAB_CONFIG.name}, I would like to inquire about a test.`;
  
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-all z-50 flex items-center justify-center group"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
      <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 font-medium whitespace-nowrap">
        Chat with us
      </span>
    </a>
  );
}
