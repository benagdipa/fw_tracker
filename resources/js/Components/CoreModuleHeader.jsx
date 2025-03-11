import React from "react";
import { Typography, Chip, Tooltip } from "@material-tailwind/react";
import { motion } from "framer-motion";
import StatsCard from "@/Components/StatsCard";
import SearchIcon from '@mui/icons-material/Search';
import InputWithIcon from "@/Components/InputWithIcon";

const CoreModuleHeader = ({
  title,
  icon,
  description,
  stats = [],
  searchEnabled = true,
  onSearchChange = () => {},
  searchPlaceholder = "Search...",
  actionButtons = [],
  className = "",
}) => {
  const containerVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className={`w-full mb-6 ${className}`}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between w-full mb-4">
        <motion.div className="flex items-center gap-3" variants={itemVariants}>
          {icon}
          <div>
            <Typography variant="h4" className="text-gray-800 dark:text-white font-bold">
              {title}
            </Typography>
            {description && (
              <Typography variant="paragraph" className="text-gray-600 dark:text-gray-300 mt-1">
                {description}
              </Typography>
            )}
          </div>
        </motion.div>
        
        <motion.div 
          className="flex flex-col sm:flex-row items-center gap-3 mt-4 md:mt-0 w-full md:w-auto"
          variants={itemVariants}
        >
          {searchEnabled && (
            <div className="w-full sm:w-64">
              <InputWithIcon
                icon={<SearchIcon />}
                placeholder={searchPlaceholder}
                onChange={onSearchChange}
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
              />
            </div>
          )}
          
          <div className="flex gap-2 mt-3 sm:mt-0">
            {actionButtons.map((btn, index) => (
              <React.Fragment key={index}>{btn}</React.Fragment>
            ))}
          </div>
        </motion.div>
      </div>
      
      {stats.length > 0 && (
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6" 
          variants={itemVariants}
        >
          {stats.map((stat, index) => (
            <StatsCard
              key={index}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              color={stat.color || "blue"}
              percentage={stat.percentage}
              footer={stat.footer}
              tooltip={stat.tooltip}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

export default CoreModuleHeader; 