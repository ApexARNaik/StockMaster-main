import React, { useEffect, useState } from 'react';
import { ledgerAPI, productsAPI, warehousesAPI } from '../src/services/api';

const LedgerView = () => {
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    productId: '',
    warehouseId: '',
    direction: '',
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchLedger();
  }, [filters]);

  const fetchInitialData = async () => {
    try {
      const [productsRes, warehousesRes] = await Promise.all([
        productsAPI.getAll(),
        warehousesAPI.getAll(),
      ]);
      setProducts(productsRes.data);
      setWarehouses(warehousesRes.data);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const res = await ledgerAPI.getAll(
        filters.productId || undefined,
        filters.warehouseId || undefined,
        filters.direction || undefined
      );
      setLedgerEntries(res.data);
    } catch (error) {
      console.error('Error fetching ledger:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ productId: '', warehouseId: '', direction: '' });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">📋 Stock Ledger</h1>
        <button
          onClick={fetchLedger}
          className="btn-primary px-6 py-2"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="app-card">
        <h2 className="text-lg font-bold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="app-label">Product</label>
            <select
              name="productId"
              value={filters.productId}
              onChange={handleFilterChange}
              className="app-select w-full"
            >
              <option value="">All Products</option>
              {products.map((prod) => (
                <option key={prod.id} value={prod.id}>
                  {prod.name} ({prod.sku})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="app-label">Warehouse</label>
            <select
              name="warehouseId"
              value={filters.warehouseId}
              onChange={handleFilterChange}
              className="app-select w-full"
            >
              <option value="">All Warehouses</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="app-label">Direction</label>
            <select
              name="direction"
              value={filters.direction}
              onChange={handleFilterChange}
              className="app-select w-full"
            >
              <option value="">All</option>
              <option value="IN">Stock In</option>
              <option value="OUT">Stock Out</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-dark-surface text-dark-text rounded hover:bg-dark-bg w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="app-card">
          <p className="text-dark-text-secondary text-sm">Total Entries</p>
          <p className="text-2xl font-bold text-purple-400">{ledgerEntries.length}</p>
        </div>
        <div className="app-card">
          <p className="text-dark-text-secondary text-sm">Stock In</p>
          <p className="text-2xl font-bold text-green-400">
            {ledgerEntries.filter(e => e.direction === 'IN').length}
          </p>
        </div>
        <div className="app-card">
          <p className="text-dark-text-secondary text-sm">Stock Out</p>
          <p className="text-2xl font-bold text-red-400">
            {ledgerEntries.filter(e => e.direction === 'OUT').length}
          </p>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="app-card overflow-x-auto">
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : ledgerEntries.length === 0 ? (
          <div className="text-center py-8 text-dark-text-secondary">
            No ledger entries found. Create documents and mark them as "Done" to see ledger entries.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-left p-3 text-dark-text-secondary">Timestamp</th>
                <th className="text-left p-3 text-dark-text-secondary">Document</th>
                <th className="text-left p-3 text-dark-text-secondary">Product</th>
                <th className="text-left p-3 text-dark-text-secondary">Direction</th>
                <th className="text-left p-3 text-dark-text-secondary">Quantity</th>
                <th className="text-left p-3 text-dark-text-secondary">From</th>
                <th className="text-left p-3 text-dark-text-secondary">To</th>
                <th className="text-left p-3 text-dark-text-secondary">User</th>
              </tr>
            </thead>
            <tbody>
              {ledgerEntries.map((entry) => (
                <tr key={entry.id} className="border-b border-dark-border hover:bg-dark-surface">
                  <td className="p-3 text-xs">{formatDate(entry.timestamp)}</td>
                  <td className="p-3">
                    <span className="text-purple-400">#{entry.documentId}</span>
                    <span className="text-xs text-dark-text-secondary ml-2">
                      ({entry.document?.type})
                    </span>
                  </td>
                  <td className="p-3">
                    <div>{entry.product?.name}</div>
                    <div className="text-xs text-dark-text-secondary">{entry.product?.sku}</div>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      entry.direction === 'IN' 
                        ? 'bg-green-900 text-green-200' 
                        : 'bg-red-900 text-red-200'
                    }`}>
                      {entry.direction === 'IN' ? '📥 IN' : '📤 OUT'}
                    </span>
                  </td>
                  <td className="p-3 font-bold">
                    <span className={entry.direction === 'IN' ? 'text-green-400' : 'text-red-400'}>
                      {entry.direction === 'IN' ? '+' : '-'}{entry.quantity}
                    </span>
                  </td>
                  <td className="p-3">{entry.sourceWarehouse?.name || '-'}</td>
                  <td className="p-3">{entry.destWarehouse?.name || '-'}</td>
                  <td className="p-3 text-xs text-dark-text-secondary">
                    {entry.user?.email}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default LedgerView;