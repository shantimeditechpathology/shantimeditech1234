import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'hi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    'nav.home': 'Home',
    'nav.tests': 'Tests',
    'nav.packages': 'Packages',
    'nav.reports': 'Reports',
    'nav.referral': 'Refer & Earn',
    'nav.login': 'Login',
    'nav.register': 'Register',
    'nav.dashboard': 'Dashboard',
    'nav.logout': 'Logout',
    'hero.title': 'Advanced Diagnostics for Your Better Health',
    'hero.subtitle': 'Experience world-class diagnostic services with Shanti Meditech. Accurate results, quick reports, and expert care.',
    'hero.bookTest': 'Book a Test',
    'hero.healthPackages': 'Health Packages',
  },
  hi: {
    'nav.home': 'होम',
    'nav.tests': 'टेस्ट',
    'nav.packages': 'पैकेज',
    'nav.reports': 'रिपोर्ट्स',
    'nav.referral': 'रेफर और कमाएं',
    'nav.login': 'लॉगिन',
    'nav.register': 'रजिस्टर',
    'nav.dashboard': 'डैशबोर्ड',
    'nav.logout': 'लॉगआउट',
    'hero.title': 'आपके बेहतर स्वास्थ्य के लिए उन्नत निदान',
    'hero.subtitle': 'शांति मेडिटेक के साथ विश्व स्तरीय नैदानिक सेवाओं का अनुभव करें। सटीक परिणाम, त्वरित रिपोर्ट और विशेषज्ञ देखभाल।',
    'hero.bookTest': 'टेस्ट बुक करें',
    'hero.healthPackages': 'स्वास्थ्य पैकेज',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('app_language', language);
  }, [language]);

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
