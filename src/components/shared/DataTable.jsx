// src/components/shared/DataTable.jsx
import React, { useState } from 'react';

const DataTable = ({ 
  columns, 
  data, 
  onRowClick,
  emptyMessage = 'No data available',
  loading = false,
  actions = null,
  pagination = false,
  itemsPerPage = 10
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  
  // Calculate pagination
  const totalPages = pagination ? Math.ceil(data.length / itemsPerPage) : 1;
  const paginatedData = pagination
    ? data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : data;
  
  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  
  // Handle row click
  const handleRowClick = (row) => {
    if (onRowClick) {
      onRowClick(row);
    }
  };

  return (
    <div className="overflow-x-auto">
      {actions && (
        <div className="flex justify-between items-center mb-4">
          {actions}
        </div>
      )}
      
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-4 text-center">
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              </td>
            </tr>
          ) : paginatedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            paginatedData.map((row, rowIndex) => (
              <tr 
                key={row.id || rowIndex} 
                className={onRowClick ? "cursor-pointer hover:bg-gray-50" : ""}
                onClick={() => handleRowClick(row)}
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      
      {pagination && totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-500">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, data.length)} of {data.length} entries
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded disabled:opacity-50"
            >
              First
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded disabled:opacity-50"
            >
              Prev
            </button>
            {[...Array(totalPages).keys()].map((page) => (
              <button
                key={page + 1}
                onClick={() => handlePageChange(page + 1)}
                className={`px-3 py-1 text-sm border rounded ${
                  currentPage === page + 1
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white border-gray-300'
                }`}
              >
                {page + 1}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded disabled:opacity-50"
            >
              Next
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded disabled:opacity-50"
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
