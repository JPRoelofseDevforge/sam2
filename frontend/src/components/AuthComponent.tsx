import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Lock, User } from 'lucide-react';

interface AuthComponentProps {
  onSuccess?: () => void;
}

const AuthComponent: React.FC<AuthComponentProps> = ({ onSuccess }) => {
  const { login, loading, isAuthenticated } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const success = await login(username, password);
    if (success) {
      if (onSuccess) {
        onSuccess();
      }
    } else {
      setError('Login failed. Please check your credentials.');
    }
  };

  if (isAuthenticated) {
    return <div className="text-green-400">Authenticated. Redirecting...</div>;
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl border border-slate-700/50 p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <Lock className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Login Required</h2>
        <p className="text-gray-400">Please log in to access biometric data.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-white mb-2">Username</label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/20 text-white border border-white/30 rounded focus:outline-none focus:border-blue-500"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-white mb-2">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/20 text-white border border-white/30 rounded focus:outline-none focus:border-blue-500"
              required
            />
          </div>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export { AuthComponent };