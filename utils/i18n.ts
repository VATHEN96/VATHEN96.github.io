/**
 * Internationalization (i18n) Utilities
 * 
 * Simple implementation for multi-language support
 */

// Default locale
const DEFAULT_LOCALE = 'en';

// Available locales
export const AVAILABLE_LOCALES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'zh', name: '中文' },
];

// Translation keys by locale
const translations: Record<string, Record<string, string>> = {
  // English (default)
  en: {
    // General
    'app.name': 'WowzaRush',
    'app.tagline': 'Transparent, milestone-based crowdfunding on the blockchain',
    
    // Navigation
    'nav.home': 'Home',
    'nav.explore': 'Explore',
    'nav.create': 'Create',
    'nav.profile': 'Profile',
    'nav.connect': 'Connect Wallet',
    
    // Profile
    'profile.follow': 'Follow',
    'profile.unfollow': 'Unfollow',
    'profile.joined': 'Joined',
    'profile.achievements': 'Achievements',
    'profile.campaigns': 'Campaigns',
    'profile.backed': 'Backed',
    'profile.notFound': 'Profile Not Found',
    'profile.skills': 'Skills',
    'profile.badges': 'Badges',
    
    // Web3
    'web3.connectWallet': 'Connect Wallet',
    'web3.walletNotConnected': 'Wallet Not Connected',
    'web3.wrongNetwork': 'Wrong Network',
    'web3.transactionPending': 'Transaction Pending',
    'web3.transactionSuccess': 'Transaction Successful',
    'web3.transactionFailed': 'Transaction Failed',
    
    // Errors
    'error.general': 'Something went wrong',
    'error.tryAgain': 'Please try again',
    'error.reload': 'Reload Page',
    'error.goBack': 'Go Back',
  },
  
  // Spanish
  es: {
    'app.name': 'WowzaRush',
    'app.tagline': 'Financiación transparente basada en hitos en blockchain',
    
    'nav.home': 'Inicio',
    'nav.explore': 'Explorar',
    'nav.create': 'Crear',
    'nav.profile': 'Perfil',
    'nav.connect': 'Conectar Billetera',
    
    'profile.follow': 'Seguir',
    'profile.unfollow': 'Dejar de seguir',
    'profile.joined': 'Se unió',
    'profile.achievements': 'Logros',
    'profile.campaigns': 'Campañas',
    'profile.backed': 'Apoyadas',
    'profile.notFound': 'Perfil No Encontrado',
    'profile.skills': 'Habilidades',
    'profile.badges': 'Insignias',
    
    'web3.connectWallet': 'Conectar Billetera',
    'web3.walletNotConnected': 'Billetera No Conectada',
    'web3.wrongNetwork': 'Red Incorrecta',
    'web3.transactionPending': 'Transacción Pendiente',
    'web3.transactionSuccess': 'Transacción Exitosa',
    'web3.transactionFailed': 'Transacción Fallida',
    
    'error.general': 'Algo salió mal',
    'error.tryAgain': 'Por favor, inténtalo de nuevo',
    'error.reload': 'Recargar Página',
    'error.goBack': 'Volver Atrás',
  },
  
  // Add more languages here
};

// Get current locale from browser
export function getCurrentLocale(): string {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  
  // Check if locale is stored in localStorage
  const storedLocale = localStorage.getItem('locale');
  if (storedLocale) return storedLocale;
  
  // Otherwise use browser language
  const browserLocale = navigator.language.split('-')[0];
  return translations[browserLocale] ? browserLocale : DEFAULT_LOCALE;
}

// Set current locale
export function setCurrentLocale(locale: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('locale', locale);
}

// Get translation for a key
export function t(key: string, locale?: string): string {
  const currentLocale = locale || getCurrentLocale();
  const translationMap = translations[currentLocale] || translations[DEFAULT_LOCALE];
  return translationMap[key] || key;
}

// Format date according to locale
export function formatDate(date: Date, locale?: string): string {
  const currentLocale = locale || getCurrentLocale();
  return new Intl.DateTimeFormat(currentLocale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

// Format number according to locale
export function formatNumber(num: number, locale?: string): string {
  const currentLocale = locale || getCurrentLocale();
  return new Intl.NumberFormat(currentLocale).format(num);
}

// Format currency according to locale
export function formatCurrency(amount: number, currency = 'USD', locale?: string): string {
  const currentLocale = locale || getCurrentLocale();
  return new Intl.NumberFormat(currentLocale, {
    style: 'currency',
    currency,
  }).format(amount);
} 