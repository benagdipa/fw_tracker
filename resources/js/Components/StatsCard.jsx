import React from "react";
import { Card, Typography } from "@material-tailwind/react";
import PropTypes from "prop-types";

const StatsCard = ({ title, value, icon, color = "blue", change, tooltip }) => {
  // Color variants for the cards
  const colorVariants = {
    blue: {
      bgColor: "bg-blue-50",
      iconBg: "bg-blue-500",
      textColor: "text-blue-500",
      changeUp: "text-blue-700",
      changeDown: "text-red-500",
    },
    green: {
      bgColor: "bg-green-50",
      iconBg: "bg-green-500",
      textColor: "text-green-500",
      changeUp: "text-green-700",
      changeDown: "text-red-500",
    },
    amber: {
      bgColor: "bg-amber-50",
      iconBg: "bg-amber-500",
      textColor: "text-amber-500",
      changeUp: "text-green-700",
      changeDown: "text-red-500",
    },
    purple: {
      bgColor: "bg-purple-50",
      iconBg: "bg-purple-500",
      textColor: "text-purple-500",
      changeUp: "text-green-700",
      changeDown: "text-red-500",
    },
    indigo: {
      bgColor: "bg-indigo-50",
      iconBg: "bg-indigo-500",
      textColor: "text-indigo-500",
      changeUp: "text-green-700",
      changeDown: "text-red-500",
    },
    red: {
      bgColor: "bg-red-50",
      iconBg: "bg-red-500",
      textColor: "text-red-500",
      changeUp: "text-green-700",
      changeDown: "text-red-700",
    },
  };

  // Get the color variant or fallback to blue
  const colorStyle = colorVariants[color] || colorVariants.blue;

  return (
    <Card className={`${colorStyle.bgColor} shadow-sm`}>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <Typography variant="small" className="text-gray-600 font-medium">
              {title}
            </Typography>
            <Typography variant="h4" className={`mt-1 ${colorStyle.textColor} font-bold`}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Typography>
            
            {change && (
              <div className="mt-1 flex items-center">
                {change > 0 ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 ${colorStyle.changeUp}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 ${colorStyle.changeDown}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                )}
                <Typography variant="small" className={change > 0 ? "text-green-700" : "text-red-500"}>
                  {Math.abs(change)}%
                </Typography>
              </div>
            )}
          </div>
          <div className={`rounded-full p-2.5 ${colorStyle.iconBg} text-white`}>
            {icon}
          </div>
        </div>
        
        {tooltip && (
          <Typography variant="small" className="mt-2 text-gray-500">
            {tooltip}
          </Typography>
        )}
      </div>
    </Card>
  );
};

StatsCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  icon: PropTypes.node.isRequired,
  color: PropTypes.oneOf(["blue", "green", "amber", "purple", "red", "indigo"]),
  change: PropTypes.number,
  tooltip: PropTypes.string,
};

export default StatsCard; 