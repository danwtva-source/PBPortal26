
import React from 'react';

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}
export const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', className = '', ...props }) => {
  const base = "font-dynapuff rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-brand-purple hover:bg-brand-darkPurple text-white shadow-lg shadow-purple-200",
    secondary: "bg-brand-teal hover:bg-brand-darkTeal text-white shadow-lg shadow-teal-200",
    outline: "border-2 border-brand-purple text-brand-purple hover:bg-brand-light",
    danger: "bg-red-100 text-red-600 hover:bg-red-200 border border-red-200",
    ghost: "text-gray-600 hover:bg-gray-100 hover:text-brand-purple"
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg font-bold"
  };

  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />;
};

// --- Card ---
export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-2xl shadow-xl border border-purple-50 p-6 ${onClick ? 'cursor-pointer hover:-translate-y-1 transition-transform' : ''} ${className}`}
  >
    {children}
  </div>
);

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}
export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-bold text-gray-700 mb-2 font-dynapuff">{label}</label>}
    <input 
      className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-purple focus:ring-4 focus:ring-purple-100 outline-none transition-all font-arial ${className}`} 
      {...props} 
    />
  </div>
);

// --- Select ---
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    options: { label: string; value: string }[];
}
export const Select: React.FC<SelectProps> = ({ label, options, className = '', ...props }) => (
    <div className="mb-4">
      {label && <label className="block text-sm font-bold text-gray-700 mb-2 font-dynapuff">{label}</label>}
      <div className="relative">
        <select 
            className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-purple focus:ring-4 focus:ring-purple-100 outline-none transition-all appearance-none bg-white ${className}`} 
            {...props}
        >
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-700">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
        </div>
      </div>
    </div>
);

// --- Modal ---
export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: 'md' | 'lg' | 'xl' | 'full' }> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  
  const sizes = {
      md: 'max-w-md',
      lg: 'max-w-2xl',
      xl: 'max-w-5xl',
      full: 'max-w-full h-[90vh]'
  };

  return (
    <div className="fixed inset-0 bg-brand-purple/20 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className={`bg-white rounded-3xl w-full ${sizes[size]} shadow-2xl flex flex-col max-h-[90vh] animate-slide-up border-4 border-white ring-1 ring-purple-100`}>
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-3xl">
          <h3 className="text-2xl font-bold font-dynapuff text-brand-purple">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full p-2 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- Badge ---
export const Badge: React.FC<{ children: React.ReactNode; variant?: 'blue' | 'green' | 'purple' | 'red' | 'gray' | 'amber' | 'teal' | null }> = ({ children, variant }) => {
    
    // Explicit mapping for AppStatus if no variant provided
    let detectedVariant = variant;
    if (!detectedVariant && typeof children === 'string') {
        const s = children as string;
        if (s === 'Submitted-Stage1') detectedVariant = 'blue';
        else if (s === 'Rejected-Stage1') detectedVariant = 'red';
        else if (s === 'Invited-Stage2') detectedVariant = 'amber';
        else if (s === 'Submitted-Stage2') detectedVariant = 'purple';
        else if (s === 'Finalist') detectedVariant = 'teal';
        else if (s === 'Funded') detectedVariant = 'green';
        else if (s === 'Rejected') detectedVariant = 'red';
        else if (s === 'Draft') detectedVariant = 'gray';
        // Fallbacks for loose matching
        else if (s.includes('Rejected')) detectedVariant = 'red';
        else if (s.includes('Submitted')) detectedVariant = 'blue';
        else if (s.includes('Invited') || s.includes('Shortlisted')) detectedVariant = 'amber';
        else detectedVariant = 'gray';
    }

    const styles: Record<string, string> = {
        blue: 'bg-blue-100 text-blue-700 border border-blue-200',
        green: 'bg-green-100 text-green-700 border border-green-200',
        purple: 'bg-purple-100 text-purple-700 border border-purple-200',
        red: 'bg-red-100 text-red-700 border border-red-200',
        gray: 'bg-gray-100 text-gray-600 border border-gray-200',
        amber: 'bg-amber-100 text-amber-800 border border-amber-200',
        teal: 'bg-teal-100 text-teal-700 border border-teal-200'
    };
    
    return <span className={`${styles[detectedVariant || 'gray']} px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide whitespace-nowrap shadow-sm`}>{children}</span>;
};
