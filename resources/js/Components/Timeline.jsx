import React from "react";
import { Typography } from "@material-tailwind/react";

export default function Timeline({ items }) {
  // Function to determine the color based on category
  const getCategoryColor = (category) => {
    switch (category) {
      case "status":
        return "bg-green-500";
      case "technical":
        return "bg-blue-500";
      case "identification":
        return "bg-purple-500";
      case "dates":
        return "bg-amber-500";
      case "artifacts":
        return "bg-indigo-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 h-full w-0.5 bg-gray-200"></div>

      {/* Timeline items */}
      <div className="space-y-8">
        {items.map((item) => (
          <div key={item.id} className="relative pl-10">
            {/* Timeline dot */}
            <div
              className={`absolute left-3 top-1.5 h-3 w-3 -translate-x-1/2 rounded-full ${getCategoryColor(
                item.category
              )}`}
            ></div>

            {/* Content */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-1 flex flex-wrap items-center justify-between">
                <Typography variant="h6" className="text-sm font-semibold text-gray-900">
                  {item.title}
                </Typography>
                <Typography variant="small" className="text-xs text-gray-500">
                  {item.date}
                </Typography>
              </div>

              <Typography variant="paragraph" className="mt-2 text-sm text-gray-600">
                {item.description}
              </Typography>

              {item.user && (
                <div className="mt-3 flex items-center">
                  <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">
                    {item.user.substring(0, 2).toUpperCase()}
                  </div>
                  <Typography variant="small" className="ml-2 text-xs text-gray-500">
                    Updated by {item.user}
                  </Typography>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 