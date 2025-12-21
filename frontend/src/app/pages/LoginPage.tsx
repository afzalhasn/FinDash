import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LogIn, Loader2 } from 'lucide-react';
import { ApiError } from '../../shared/lib/api';

export function LoginPage() {
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const success = await login(email, password);
      if (!success) {
        setError('Invalid credentials. Please try again.');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || 'Unable to sign in. Please check your credentials.');
      } else {
        setError('Unexpected error while signing in. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card/95 border border-border/70 rounded-2xl shadow-xl w-full max-w-md p-8 backdrop-blur">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4 shadow-sm">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-primary mb-2">Finance Dashboard</h1>
          {/* <p className="text-gray-600">Cash Flow Management System</p> */}
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-muted-foreground mb-2">
              Email / Username
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-input bg-input-background text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-muted-foreground mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-input bg-input-background text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
              placeholder="Enter your password"
              required
            />
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        {/* Demo Credentials */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border/60">
          <p className="text-foreground mb-2">Demo Credentials:</p>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p><strong>Admin:</strong> admin@findash.com</p>
            <p><strong>Partner:</strong> partner@findash.com</p>
            <p><strong>Staff:</strong> staff@findash.com</p>
            <p><strong>Password:</strong> password</p>
          </div>
        </div>
      </div>
    </div>
  );
}
