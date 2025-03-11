import React from 'react';
import { Progress } from '@material-tailwind/react';

const ProgressBar = ({ value = 0, color = 'blue', showLabel = true }) => {
  // Ensure value is between 0 and 100
  const percentage = Math.min(Math.max(0, value), 100);
  
  // Determine color based on value if not specified
  const determineColor = () => {
    if (color) return color;
    
    if (percentage >= 80) return 'green';
    if (percentage >= 50) return 'blue';
    if (percentage >= 30) return 'amber';
    return 'red';
  };
  
  // Get label text color
  const getLabelColor = () => {
    const colorMap = {
      'green': 'text-green-700',
      'blue': 'text-blue-700',
      'amber': 'text-amber-700',
      'red': 'text-red-700',
      'gray': 'text-gray-700',
    };
    
    return colorMap[determineColor()] || 'text-gray-700';
  };
  
  return (
    <div className="w-full">
      <div className="flex justify-between mb-1">
        {showLabel && (
          <span className={`text-xs font-medium ${getLabelColor()}`}>
            {percentage}%
          </span>
        )}
      </div>
      <Progress
        value={percentage}
        color={determineColor()}
        className="h-1.5"
      />
    </div>
  );
};

export default ProgressBar; 