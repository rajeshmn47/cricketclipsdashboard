import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../actions/userAction';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';


export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { loading, error, user } = useSelector(state => state.userLogin || {});

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(login({ email, password }));
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      <form onSubmit={handleSubmit} className="bg-white m-10 rounded-xl shadow-lg w-full max-w-sm relative p-6">
        <h2 className="text-3xl font-extrabold mb-6 text-center text-purple-700">Sign In</h2>
        <div className="mb-4 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Mail size={18} /></span>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="pl-10"
            autoComplete="username"
          />
        </div>
        <div className="mb-2 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Lock size={18} /></span>
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="pl-10 pr-10"
            autoComplete="current-password"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 focus:outline-none cursor-pointer"
            onClick={() => setShowPassword((v) => !v)}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {error && <div className="mb-4 text-red-500 text-center animate-shake">{error}</div>}
        <div className="mb-6 text-right">
          <a href="#" className="text-xs text-purple-600 hover:underline cursor-pointer">Forgot Password?</a>
        </div>
        <Button type="submit" disabled={loading} className="w-full transition-all duration-200 cursor-pointer">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /></svg>
              Logging in...
            </span>
          ) : 'Login'}
        </Button>
        <div className="mt-6 text-center text-sm text-gray-500">
          Don't have an account? <a href="#" className="text-purple-600 hover:underline cursor-pointer">Sign Up</a>
        </div>
      </form>
    </div>
  );
}
