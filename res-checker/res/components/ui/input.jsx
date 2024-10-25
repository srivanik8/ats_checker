// src/components/ui/input.jsx
import React from 'react';

const Input = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={`border border-gray-300 rounded p-2 focus:outline-none focus:ring focus:ring-blue-500 ${className}`}
      {...props}
    />
  );
});

Input.displayName = 'Input';
export default Input;