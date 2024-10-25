// src/components/ui/card.jsx
import React from 'react';

const Card = ({ children, className }) => {
  return (
    <div className={`border rounded-lg shadow-md p-4 bg-white ${className}`}>
      {children}
    </div>
  );
};
// src/components/ui/card.jsx (continued)
const CardHeader = ({ children }) => (
    <div className="border-b mb-2 pb-2">{children}</div>
  );
  
  const CardContent = ({ children }) => (
    <div className="mt-2">{children}</div>
  );
  
  const CardTitle = ({ children }) => (
    <h2 className="text-lg font-bold">{children}</h2>
  );
  
  const CardDescription = ({ children }) => (
    <p className="text-sm text-gray-600">{children}</p>
  );
  
  export { Card, CardHeader, CardContent, CardTitle, CardDescription };

export default Card;