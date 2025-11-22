import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../src/context/AuthContext';
import { warehousesAPI, categoriesAPI } from '../src/services/api';

const WarehouseList = () => {
  const { user } = useContext(AuthContext);
  const [warehouses, setWarehouses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWarehouseForm, setShowWarehouseForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [warehouseData, setWarehouseData] = useState({ name: '', location: '' });
  const [categoryData, setCategoryData] = useState({ name: '' });
  const [message, setMessage] = useState('');

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [warehousesRes, categoriesRes] = await Promise.all([
        warehousesAPI.getAll(),
        categoriesAPI.getAll(),
      ]);
      setWarehouses(warehousesRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage('Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const handleWarehouseSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!warehouseData.name || !warehouseData.location) {
        setMessage('Please fill in all fields');
        return;
      }
      await warehousesAPI.create(warehouseData);
      setMessage('Warehouse created successfully!');
      setWarehouseData({ name: '', location: '' });
      setShowWarehouseForm(false);
      fetchData();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Error creating warehouse');
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      if (!categoryData.name) {
        setMessage('Please enter a category name');
        return;
      }
      await categoriesAPI.create(categoryData);
      setMessage('Category created successfully!');
      setCategoryData({ name: '' });
      setShowCategoryForm(false);
      fetchData();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Error creating category');
    }
  };

  // Calculate total stock in warehouse
  const getWarehouseStock = (warehouse) => {
    if (!warehouse.stocks || warehouse.stocks.length === 0) return 0;
    return warehouse.stocks.reduce((total, stock) => total + stock.quantity, 0);
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">🏭 Warehouses & Categories</h1>

      {message && (
        <div className={`p-3 rounded ${message.includes('successfully') ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Warehouses Section */}
        <div className="app-card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Warehouses</h2>
            {isAdmin && (
              <button
                onClick={() => setShowWarehouseForm(!showWarehouseForm)}
                className="text-sm px-4 py-2 bg-purple-600 rounded hover:bg-purple-700"
              >
                {showWarehouseForm ? 'Cancel' : '+ Add'}
              </button>
            )}
          </div>

          {showWarehouseForm && (
            <form onSubmit={handleWarehouseSubmit} className="mb-4 p-4 bg-dark-bg rounded space-y-3">
              <div>
                <label className="app-label">Name</label>
                <input
                  type="text"
                  value={warehouseData.name}
                  onChange={(e) => setWarehouseData({ ...warehouseData, name: e.target.value })}
                  className="app-input w-full"
                  placeholder="e.g., Main Warehouse"
                />
              </div>
              <div>
                <label className="app-label">Location</label>
                <input
                  type="text"
                  value={warehouseData.location}
                  onChange={(e) => setWarehouseData({ ...warehouseData, location: e.target.value })}
                  className="app-input w-full"
                  placeholder="e.g., Mumbai"
                />
              </div>
              <button type="submit" className="btn-primary w-full">
                Create Warehouse
              </button>
            </form>
          )}

          <div className="space-y-3">
            {warehouses.length === 0 ? (
              <p className="text-dark-text-secondary text-center py-4">No warehouses yet</p>
            ) : (
              warehouses.map((wh) => (
                <div key={wh.id} className="p-4 bg-dark-bg rounded flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{wh.name}</p>
                    <p className="text-sm text-dark-text-secondary">{wh.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-purple-400">{getWarehouseStock(wh)}</p>
                    <p className="text-xs text-dark-text-secondary">total items</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Categories Section */}
        <div className="app-card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Categories</h2>
            {isAdmin && (
              <button
                onClick={() => setShowCategoryForm(!showCategoryForm)}
                className="text-sm px-4 py-2 bg-purple-600 rounded hover:bg-purple-700"
              >
                {showCategoryForm ? 'Cancel' : '+ Add'}
              </button>
            )}
          </div>

          {showCategoryForm && (
            <form onSubmit={handleCategorySubmit} className="mb-4 p-4 bg-dark-bg rounded space-y-3">
              <div>
                <label className="app-label">Category Name</label>
                <input
                  type="text"
                  value={categoryData.name}
                  onChange={(e) => setCategoryData({ name: e.target.value })}
                  className="app-input w-full"
                  placeholder="e.g., Electronics"
                />
              </div>
              <button type="submit" className="btn-primary w-full">
                Create Category
              </button>
            </form>
          )}

          <div className="space-y-3">
            {categories.length === 0 ? (
              <p className="text-dark-text-secondary text-center py-4">No categories yet</p>
            ) : (
              categories.map((cat) => (
                <div key={cat.id} className="p-4 bg-dark-bg rounded flex justify-between items-center">
                  <p className="font-semibold">{cat.name}</p>
                  <span className="text-sm text-dark-text-secondary">
                    {cat.products?.length || 0} products
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarehouseList;