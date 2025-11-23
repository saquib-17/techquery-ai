import React, { useState } from 'react'
import api from '../services/api'
import { useNavigate, Navigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // 🔥 Redirect if logged in
  const token = localStorage.getItem("token");

if (token) {
  try {
    const decoded = jwtDecode(token);

    // check if expired
    const now = Date.now() / 1000;
    if (decoded.exp < now) {
      localStorage.removeItem("token");
      window.dispatchEvent(new Event("auth-changed"));
    } else {
      // still valid
      return <Navigate to="/generate" replace />;
    }

  } catch {
    localStorage.removeItem("token");
  }
}


  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email, password })
      localStorage.setItem('token', data.token)
      window.dispatchEvent(new Event("auth-changed"))
      navigate('/generate')
    } catch (err) {
      alert(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 ">
      <div className="w-full max-w-md bg-primary backdrop-blur-md shadow-xl rounded-xl p-8 border border-white/40 animate-fadeIn">
        
        <h2 className="text-3xl font-bold text-center mb-2 text-white">
          Welcome Back
        </h2>
        <p className="text-center text-muted mb-6">
          Login to continue your journey
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="text-sm font-medium text-muted">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              className="w-full mt-1 px-4 py-2.5 rounded-lg border border-gray-300
                         focus:outline-none focus:ring-2 focus:ring-primary/50 
                         transition text-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              className="w-full mt-1 px-4 py-2.5 rounded-lg border border-gray-300
                         focus:outline-none focus:ring-2 focus:ring-primary/50 
                         transition text-white"
            />
          </div>

          <button
            type="submit"
            className="btn-primary w-full py-3 rounded-lg text-lg cursor-pointer"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-muted">
          Don’t have an account?{" "}
          <a
            href="/register"
            className="text-indigo-600 font-semibold hover:underline"
          >
            Register
          </a>
        </p>

      </div>
    </div>
  )
}
