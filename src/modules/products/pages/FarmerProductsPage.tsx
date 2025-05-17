// src/modules/products/pages/FarmerProductsPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../modules/auth';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/ProductCard';
import ProductStatusBadge from '../components/ProductStatusBadge';
import { formatPrice, formatDate } from '../../../shared/utils';

const FarmerProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { products, totalProducts, isLoading, error, fetchProducts, deleteProduct } = useProducts();
  const [statusFilter, setStatusFilter] = useState<string>('available');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 12;
  
  // Check if user is a farmer
  if (user?.role !== 'farmer') {
    navigate('/');
    return null;
  }
  
  // Fetch farmer's products when component mounts or filters change
  useEffect(() => {
    if (user?._id) {
      fetchProducts({
        farmer: user._id,
        status: statusFilter === 'all' ? undefined : statusFilter,
        page,
        limit
      });
    }
  }, [user, statusFilter, page, fetchProducts]);
  
  // Calculate total pages
  const totalPages = Math.ceil(totalProducts / limit);
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };
  
  // Handle status filter change
  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setPage(1); // Reset to first page when changing filter
  };
  
  // Handle edit product
  const handleEditProduct = (productId: string) => {
    navigate(`/farmer/products/${productId}/edit`);
  };
  
  // Handle delete product
  const handleDeleteProduct = async (productId: string) => {
    const success = await deleteProduct(productId);
    
    if (success) {
      // Refresh products list
      fetchProducts({
        farmer: user?._id,
        status: statusFilter === 'all' ? undefined : statusFilter,
        page,
        limit
      });
    }
    
    setDeleteConfirm(null);
  };
  
  // Status options for filter
  const statusOptions = [
    { value: 'all', label: 'Wszystkie' },
    { value: 'available', label: 'Dostępne' },
    { value: 'unavailable', label: 'Niedostępne' },
    { value: 'preparing', label: 'W przygotowaniu' },
    { value: 'shipped', label: 'Wysłane' },
    { value: 'delivered', label: 'Dostarczone' }
  ];
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between mb-6 items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Twoje produkty
          </h1>
          <p className="mt-2 text-gray-600">
            Zarządzaj swoimi produktami, dodawaj nowe i aktualizuj istniejące.
          </p>
        </div>
        
        <button
          onClick={() => navigate('/farmer/products/new')}
          className="mt-4 md:mt-0 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          Dodaj nowy produkt
        </button>
      </div>
      
      {/* Status filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {statusOptions.map(option => (
            <button
              key={option.value}
              onClick={() => handleStatusFilterChange(option.value)}
              className={`px-4 py-2 rounded-md ${
                statusFilter === option.value
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
      
      {/* Error state */}
      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Products list */}
      {!isLoading && !error && (
        <>
          {products.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                Brak produktów
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {statusFilter === 'all'
                  ? 'Nie masz jeszcze żadnych produktów.'
                  : `Nie masz produktów o statusie "${
                      statusOptions.find(opt => opt.value === statusFilter)?.label || statusFilter
                    }".`}
              </p>
              <div className="mt-6">
                <button
                  onClick={() => navigate('/farmer/products/new')}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Dodaj pierwszy produkt
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Table view */}
              <div className="overflow-x-auto bg-white rounded-lg shadow mb-6">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Produkt
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cena / Ilość
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kategoria
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data dodania
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Akcje
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map(product => (
                      <tr key={product._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                              {product.images && product.images.length > 0 ? (
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-gray-400">
                                  <svg
                                    className="h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 line-clamp-1">
                                {product.name}
                              </div>
                              <div className="text-sm text-gray-500 line-clamp-1">
                                ID: {product._id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatPrice(product.price)} / {product.unit}
                          </div>
                          <div className="text-sm text-gray-500">
                            Dostępne: {product.quantity} {product.unit}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 capitalize">
                            {product.category}
                          </div>
                          {product.subcategory && (
                            <div className="text-sm text-gray-500 capitalize">
                              {product.subcategory}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <ProductStatusBadge status={product.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(product.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => navigate(`/products/${product._id}`)}
                              className="text-primary hover:text-primary-dark"
                            >
                              Podgląd
                            </button>
                            <button
                              onClick={() => handleEditProduct(product._id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edytuj
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(product._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Usuń
                            </button>
                          </div>
                          
                          {/* Delete confirmation */}
                          {deleteConfirm === product._id && (
                            <div className="absolute z-10 right-0 mt-2 bg-white rounded-md shadow-lg p-4 border border-gray-200">
                              <p className="text-sm text-gray-700 mb-2">
                                Czy na pewno chcesz usunąć ten produkt?
                              </p>
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  className="px-3 py-1 text-xs rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                                >
                                  Anuluj
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(product._id)}
                                  className="px-3 py-1 text-xs rounded-md bg-red-500 text-white hover:bg-red-600"
                                >
                                  Usuń
                                </button>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <nav className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page <= 1}
                      className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Poprzednia
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      // Show only 5 page buttons at a time
                      .filter(p => {
                        return (
                          p === 1 ||
                          p === totalPages ||
                          Math.abs(p - page) <= 1 ||
                          (p === 2 && page === 1) ||
                          (p === totalPages - 1 && page === totalPages)
                        );
                      })
                      .map(p => {
                        const isCurrent = p === page;
                        // Add dots for pagination gaps
                        const showLeftDots = p === 2 && page > 3;
                        const showRightDots = p === totalPages - 1 && page < totalPages - 2;
                        
                        return (
                          <React.Fragment key={p}>
                            {showLeftDots && (
                              <span className="px-3 py-2 text-gray-500">...</span>
                            )}
                            
                            <button
                              onClick={() => handlePageChange(p)}
                              className={`px-3 py-2 rounded-md ${
                                isCurrent
                                  ? 'bg-primary text-white'
                                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {p}
                            </button>
                            
                            {showRightDots && (
                              <span className="px-3 py-2 text-gray-500">...</span>
                            )}
                          </React.Fragment>
                        );
                      })}
                    
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= totalPages}
                      className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Następna
                    </button>
                  </nav>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default FarmerProductsPage;