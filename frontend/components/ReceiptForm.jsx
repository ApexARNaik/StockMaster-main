import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../src/context/AuthContext';
import { documentsAPI, productsAPI, warehousesAPI } from '../src/services/api';

const ReceiptForm = () => {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    destWarehouseId: '',
    items: [{ productId: '', quantity: '' }],
    supplierId: '',
  });
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, warehousesRes, docsRes] = await Promise.all([
        productsAPI.getAll(),
        warehousesAPI.getAll(),
        documentsAPI.getAll('RECEIPT'),
      ]);
      setProducts(productsRes.data);
      setWarehouses(warehousesRes.data);
      setDocuments(docsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { productId: '', quantity: '' }],
    }));
  };

  const handleRemoveItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData((prev) => ({ ...prev, items: newItems }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.destWarehouseId || formData.items.length === 0) {
        setMessage('Please fill in all required fields');
        return;
      }

      const payload = {
        type: 'RECEIPT',
        destWarehouseId: parseInt(formData.destWarehouseId),
        supplierId: formData.supplierId ? parseInt(formData.supplierId) : null,
        items: formData.items.map((item) => ({
          productId: parseInt(item.productId),
          quantity: parseInt(item.quantity),
        })),
      };

      await documentsAPI.create(payload);
      setMessage('Receipt created successfully!');
      setFormData({ destWarehouseId: '', items: [{ productId: '', quantity: '' }], supplierId: '' });
      setShowForm(false);
      fetchData();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Error creating receipt');
    }
  };

  const handleStatusChange = async (docId, newStatus) => {
    try {
      await documentsAPI.updateStatus(docId, newStatus);
      setMessage('Receipt status updated!');
      fetchData();
    } catch (error) {
      setMessage('Error updating status');
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  const filteredDocuments = filterStatus 
    ? documents.filter((doc) => doc.status === filterStatus)
    : documents;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">📥 Receipts</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary px-6 py-2"
        >
          {showForm ? 'Cancel' : '+ New Receipt'}
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded ${message.includes('successfully') ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
          {message}
        </div>
      )}

      {showForm && (
        <div className="app-card">
          <h2 className="text-xl font-bold mb-4">Create Receipt</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="app-label">Destination Warehouse *</label>
                <select
                  name="destWarehouseId"
                  value={formData.destWarehouseId}
                  onChange={handleInputChange}
                  className="app-select w-full"
                  required
                >
                  <option value="">Select Warehouse</option>
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name} ({wh.location})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="app-label">Supplier ID</label>
                <input
                  type="number"
                  name="supplierId"
                  value={formData.supplierId}
                  onChange={handleInputChange}
                  className="app-input w-full"
                  placeholder="Optional"
                />
              </div>
            </div>

            <div>
              <label className="app-label font-bold">Items</label>
              <div className="space-y-2">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <select
                      value={item.productId}
                      onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                      className="app-select flex-1"
                      required
                    >
                      <option value="">Select Product</option>
                      {products.map((prod) => (
                        <option key={prod.id} value={prod.id}>
                          {prod.name} ({prod.sku})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="app-input w-24"
                      placeholder="Qty"
                      required
                    />
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="px-3 py-2 bg-red-900 text-red-200 rounded hover:bg-red-800"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-purple-400 hover:text-purple-300 text-sm mt-2"
              >
                + Add Item
              </button>
            </div>

            <button type="submit" className="btn-primary w-full">
              Create Receipt
            </button>
          </form>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilterStatus('')}
          className={`px-4 py-2 rounded ${!filterStatus ? 'bg-purple-600' : 'bg-dark-surface'}`}
        >
          All
        </button>
        {['Draft', 'Waiting', 'Ready', 'Done', 'Canceled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded ${filterStatus === status ? 'bg-purple-600' : 'bg-dark-surface'}`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-border">
              <th className="text-left p-3">ID</th>
              <th className="text-left p-3">Warehouse</th>
              <th className="text-left p-3">Items</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Created By</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocuments.map((doc) => (
              <tr key={doc.id} className="border-b border-dark-border hover:bg-dark-surface">
                <td className="p-3"># {doc.id}</td>
                <td className="p-3">{doc.destWarehouse?.name || 'N/A'}</td>
                <td className="p-3">{doc.documentLines.length} items</td>
                <td className="p-3">
                  <select
                    value={doc.status}
                    onChange={(e) => handleStatusChange(doc.id, e.target.value)}
                    className="app-select text-xs"
                  >
                    {['Draft', 'Waiting', 'Ready', 'Done', 'Canceled'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="p-3 text-dark-text-secondary text-xs">{doc.createdBy.email}</td>
                <td className="p-3">
                  <button className="text-blue-400 hover:text-blue-300 text-sm">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReceiptForm;