// src/components/ui/textarea.jsx
import React from 'react';

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={`border border-gray-300 rounded p-2 focus:outline-none focus:ring focus:ring-blue-500 ${className}`}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';
export default Textarea;