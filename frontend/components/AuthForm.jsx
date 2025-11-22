import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../src/context/AuthContext';

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'STAFF',
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData.email, formData.password, formData.role);
        setIsLogin(true);
        setFormData({ email: '', password: '', role: 'STAFF' });
        setError('Registration successful! Please log in.');
        return;
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-bg via-dark-surface to-dark-bg p-4">
      <div className="w-full max-w-md">
        <div className="app-card space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              StockMaster
            </h1>
            <p className="text-dark-text-secondary">
              {isLogin ? 'Sign in to your account' : 'Create a new account'}
            </p>
          </div>

          {error && (
            <div className={`p-3 rounded text-sm ${isLogin && error.includes('successful') ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="app-label">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  placeholder="Enter your name"
                  className="app-input w-full"
                  required
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="app-label">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                className="app-input w-full"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="app-label">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                className="app-input w-full"
                required
              />
            </div>

            {!isLogin && (
              <div>
                <label htmlFor="role" className="app-label">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="app-select w-full"
                >
                  <option value="STAFF">Warehouse Staff</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            )}

            <button type="submit" className="btn-primary w-full mt-6" disabled={isLoading}>
              {isLoading ? 'Loading...' : isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <div className="text-center text-sm">
            <p className="text-dark-text-secondary">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                }}
                className="text-purple-400 hover:text-purple-300 font-semibold"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>

          <div className="border-t border-dark-border pt-4 text-xs text-dark-text-secondary">
            <p className="font-semibold mb-2">Demo Credentials:</p>
            <p>Admin: admin@test.com / password</p>
            <p>Manager: manager@test.com / password</p>
            <p>Staff: staff@test.com / password</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;