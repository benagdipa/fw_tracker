import React, { memo } from 'react';

// Virtualized row component that only rerenders when its props actually change
// This dramatically improves performance for large lists
const VirtualizedRow = memo(props => {
  const { children, ...rest } = props;
  
  return (
    <div {...rest} className="virtualized-row gpu-accelerated">
      {children}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo to determine if the component should rerender
  
  // If row ID changes, always rerender
  if (prevProps.rowId !== nextProps.rowId) return false;
  
  // If children changed, rerender
  if (prevProps.children !== nextProps.children) return false;
  
  // If row data is different, rerender
  const prevData = prevProps.rowData || {};
  const nextData = nextProps.rowData || {};
  
  // Check keys
  const prevKeys = Object.keys(prevData);
  const nextKeys = Object.keys(nextData);
  
  if (prevKeys.length !== nextKeys.length) return false;
  
  // Check values for key differences
  for (const key of prevKeys) {
    if (prevData[key] !== nextData[key]) return false;
  }
  
  // If row is selected or editing state changed, rerender
  if (prevProps.isSelected !== nextProps.isSelected) return false;
  if (prevProps.isEditing !== nextProps.isEditing) return false;
  
  // No significant changes, prevent rerender
  return true;
});

export default VirtualizedRow; 