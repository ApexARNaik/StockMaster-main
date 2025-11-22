import React, { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AuthContext } from '../src/context/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const links = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Products', path: '/products', icon: '📦' },
    ...(isAdmin
      ? [
          { name: 'Receipts', path: '/inventory/receipts', icon: '📥' },
          { name: 'Deliveries', path: '/inventory/deliveries', icon: '📤' },
          { name: 'Transfers', path: '/inventory/transfers', icon: '↔️' },
          { name: 'Adjustments', path: '/inventory/adjustments', icon: '⚙️' },
        ]
      : []),
    { name: 'Ledger', path: '/ledger', icon: '📋' },
  ];

  return (
    <div className="w-64 h-screen fixed top-0 left-0 bg-gradient-to-b from-dark-surface to-dark-bg border-r border-dark-border flex flex-col shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-dark-border">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          StockMaster
        </h1>
        <p className="text-xs text-dark-text-secondary mt-1">
          {user?.email}
        </p>
        <span className="inline-block mt-2 px-2 py-1 bg-purple-900 text-purple-200 text-xs rounded font-semibold">
          {user?.role}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-grow p-4">
        <ul className="space-y-2">
          {links.map((link) => (
            <li key={link.path}>
              <NavLink
                to={link.path}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-glow'
                      : 'text-dark-text-secondary hover:bg-dark-surface hover:text-dark-text'
                  }`
                }
              >
                <span className="text-lg mr-3">{link.icon}</span>
                {link.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-dark-border">
        <button
          onClick={logout}
          className="btn-danger w-full py-2 text-sm"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;