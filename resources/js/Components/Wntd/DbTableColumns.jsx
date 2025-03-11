import React from 'react';

const DbTableColumns = ({ columnsByTable }) => {

  const removeQuote = (data) => {
    // Check if data is a string before calling includes
    if (data && typeof data === 'string' && data.includes('"')) {
      return data.replace(/"/g, '');
    }
    return data;
  }

  const typeChanger = (type) => {
    if (type === 'character varying') {
      return 'varchar(255)';
    }
    return type;
  }

  return (
    <div className="my-2">
      {columnsByTable && columnsByTable.length > 0 ? (
        columnsByTable.map((itm, index) => {
          // Add null/undefined checks for itm properties
          const columnName = itm?.column_name ? removeQuote(itm?.column_name) : 'Unknown Column';
          const columnType = itm?.data_type ? removeQuote(typeChanger(itm?.data_type)) : 'Unknown Type';

          return (
            <p key={index} className="ml-10 mt-1 text-xs font-medium">
              {columnName} - <span className="text-gray-700">{columnType}</span>
            </p>
          );
        })
      ) : (
        <p>No columns available</p> // Fallback in case columnsByTable is empty or undefined
      )}
    </div>
  );
}

export default DbTableColumns;