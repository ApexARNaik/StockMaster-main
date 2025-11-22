import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../src/context/AuthContext';
import { productsAPI, warehousesAPI, documentsAPI } from '../src/services/api';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalWarehouses: 0,
    totalDocuments: 0,
    documentsByType: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [products, warehouses, documents] = await Promise.all([
          productsAPI.getAll(),
          warehousesAPI.getAll(),
          documentsAPI.getAll(),
        ]);

        const docsByType = ['RECEIPT', 'DELIVERY', 'TRANSFER', 'ADJUSTMENT'].map((type) => ({
          name: type,
          value: documents.data.filter((d) => d.type === type).length,
        }));

        setStats({
          totalProducts: products.data.length,
          totalWarehouses: warehouses.data.length,
          totalDocuments: documents.data.length,
          documentsByType: docsByType,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div className="text-center py-8">Loading...</div>;

  const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981'];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="app-card">
          <p className="text-dark-text-secondary text-sm">Total Products</p>
          <p className="text-3xl font-bold text-purple-400">{stats.totalProducts}</p>
        </div>
        <div className="app-card">
          <p className="text-dark-text-secondary text-sm">Total Warehouses</p>
          <p className="text-3xl font-bold text-pink-400">{stats.totalWarehouses}</p>
        </div>
        <div className="app-card">
          <p className="text-dark-text-secondary text-sm">Total Documents</p>
          <p className="text-3xl font-bold text-cyan-400">{stats.totalDocuments}</p>
        </div>
        <div className="app-card">
          <p className="text-dark-text-secondary text-sm">Logged in as</p>
          <p className="text-lg font-bold text-green-400">{user?.role}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="app-card">
          <h2 className="text-xl font-bold mb-4">Documents by Type</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.documentsByType}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {COLORS.map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="app-card">
          <h2 className="text-xl font-bold mb-4">System Overview</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-dark-text-secondary">Products</span>
              <div className="w-32 bg-dark-bg rounded h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded"
                  style={{ width: `${Math.min(stats.totalProducts * 5, 100)}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-dark-text-secondary">Warehouses</span>
              <div className="w-32 bg-dark-bg rounded h-2">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded"
                  style={{ width: `${Math.min(stats.totalWarehouses * 15, 100)}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-dark-text-secondary">Documents</span>
              <div className="w-32 bg-dark-bg rounded h-2">
                <div
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded"
                  style={{ width: `${Math.min(stats.totalDocuments * 3, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;