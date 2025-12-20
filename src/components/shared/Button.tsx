interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

const variants = {
  primary: 'bg-instagram-blue hover:bg-blue-600 text-white',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900',
  outline: 'border border-gray-300 hover:bg-gray-50 text-gray-900',
};

const sizes = {
  sm: 'px-4 py-1.5 text-sm',
  md: 'px-5 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base',
};

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  fullWidth = false,
  className = ''
}: ButtonProps) {
  return (
    <button
      className={`
        ${variants[variant]} 
        ${sizes[size]} 
        ${fullWidth ? 'w-full' : ''} 
        rounded-lg font-semibold transition-colors
        ${className}
      `}
    >
      {children}
    </button>
  );
}




