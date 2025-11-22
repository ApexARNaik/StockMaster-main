import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../src/context/AuthContext';
import { productsAPI, categoriesAPI } from '../src/services/api';

const ProductList = () => {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    categoryId: '',
    uom: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        productsAPI.getAll(),
        categoriesAPI.getAll(),
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage('Error fetching products');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.name || !formData.sku || !formData.categoryId || !formData.uom) {
        setMessage('Please fill in all fields');
        return;
      }

      await productsAPI.create({
        ...formData,
        categoryId: parseInt(formData.categoryId),
      });

      setMessage('Product created successfully!');
      setFormData({ name: '', sku: '', categoryId: '', uom: '' });
      setShowForm(false);
      fetchData();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Error creating product');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productsAPI.delete(id);
        setMessage('Product deleted successfully!');
        fetchData();
      } catch (error) {
        setMessage('Error deleting product');
      }
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate total stock for each product
  const getProductStock = (product) => {
    if (!product.stocks || product.stocks.length === 0) return 0;
    return product.stocks.reduce((total, stock) => total + stock.quantity, 0);
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">📦 Products</h1>
        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary px-6 py-2"
          >
            {showForm ? 'Cancel' : '+ Add Product'}
          </button>
        )}
      </div>

      {message && (
        <div className={`p-3 rounded ${message.includes('successfully') ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
          {message}
        </div>
      )}

      {showForm && (
        <div className="app-card">
          <h2 className="text-xl font-bold mb-4">Create New Product</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="app-label">Product Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="app-input w-full"
                placeholder="e.g., Laptop"
              />
            </div>
            <div>
              <label className="app-label">SKU</label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                className="app-input w-full"
                placeholder="e.g., SKU-001"
              />
            </div>
            <div>
              <label className="app-label">Category</label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleInputChange}
                className="app-select w-full"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="app-label">Unit of Measure</label>
              <input
                type="text"
                name="uom"
                value={formData.uom}
                onChange={handleInputChange}
                className="app-input w-full"
                placeholder="e.g., pcs, kg, liters"
              />
            </div>
            <button type="submit" className="btn-primary w-full">
              Create Product
            </button>
          </form>
        </div>
      )}

      <div>
        <input
          type="text"
          placeholder="Search by product name or SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="app-input w-full mb-4"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-border">
              <th className="text-left p-3 text-dark-text-secondary">Product Name</th>
              <th className="text-left p-3 text-dark-text-secondary">SKU</th>
              <th className="text-left p-3 text-dark-text-secondary">Category</th>
              <th className="text-left p-3 text-dark-text-secondary">UOM</th>
              <th className="text-left p-3 text-dark-text-secondary">Total Stock</th>
              <th className="text-left p-3 text-dark-text-secondary">Status</th>
              {isAdmin && <th className="text-left p-3 text-dark-text-secondary">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id} className="border-b border-dark-border hover:bg-dark-surface">
                <td className="p-3 font-semibold">{product.name}</td>
                <td className="p-3 text-purple-400">{product.sku}</td>
                <td className="p-3">{product.category?.name || 'N/A'}</td>
                <td className="p-3">{product.uom}</td>
                <td className="p-3">
                  <span className={`font-bold ${getProductStock(product) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {getProductStock(product)}
                  </span>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${product.isActive ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                {isAdmin && (
                  <td className="p-3">
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductList;