// src/components/shared/Button.jsx
import React from 'react';

const Button = ({ 
  children, 
  type = 'button', 
  variant = 'primary', 
  size = 'md', 
  onClick, 
  disabled = false,
  className = '',
  ...props 
}) => {
  // Define variant styles
  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    info: 'bg-sky-500 hover:bg-sky-600 text-white',
    light: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    dark: 'bg-gray-800 hover:bg-gray-900 text-white',
    outline: 'bg-transparent border border-blue-600 text-blue-600 hover:bg-blue-50'
  };
  
  // Define size styles
  const sizeStyles = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
    xl: 'px-6 py-3 text-lg'
  };
  
  // Combine all styles
  const buttonStyles = `
    inline-flex items-center justify-center font-medium rounded 
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
    transition-colors duration-200 ease-in-out
    disabled:opacity-50 disabled:cursor-not-allowed
    ${variantStyles[variant] || variantStyles.primary}
    ${sizeStyles[size] || sizeStyles.md}
    ${className}
  `;

  return (
    <button
      type={type}
      className={buttonStyles}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;