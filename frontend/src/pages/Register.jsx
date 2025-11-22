import React, { useState } from 'react'
import api from '../services/api'
import { useNavigate, Navigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // 🔥 Redirect if logged in
  const token = localStorage.getItem('token')
  if (token) {
    try {
      const decoded = jwtDecode(token)
      if (decoded?.id) return <Navigate to="/generate" replace />
    } catch {}
  }

  const handleSubmit = async (e) => {
  e.preventDefault()
  setLoading(true)
  try {
    await api.post('/auth/register', { name, email, password })

    alert("Account created successfully! Please login to continue.")

    // ❌ remove auto login
    // ❌ do NOT store token

    navigate('/login')

  } catch (err) {
    alert(err.response?.data?.message || 'Registration failed')
  } finally {
    setLoading(false)
  }
}


  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-primary backdrop-blur-md shadow-xl rounded-xl p-8 border border-white/40 animate-fadeIn">
        
        <h2 className="text-3xl font-bold text-center mb-2 text-white">
          Create Account
        </h2>
        <p className="text-center text-muted mb-6">
          Join us and start building
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="text-sm font-medium text-muted">Full Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="Enter your name"
              className="w-full mt-1 px-4 py-2.5 rounded-lg border border-gray-300
                         focus:outline-none focus:ring-2 focus:ring-primary/50 
                         transition text-white"
            />
          </div>

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
            <label className="text-sm font-medium text-muted">
              Password (min 6 chars)
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="Create a strong password"
              className="w-full mt-1 px-4 py-2.5 rounded-lg border border-gray-300
                         focus:outline-none focus:ring-2 focus:ring-primary/50 
                         transition text-white"
            />
          </div>

          <button
            type="submit"
            className="btn-primary w-full py-3 rounded-lg text-lg cursor-pointer"
          >
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-muted">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-indigo-600 font-semibold hover:underline"
          >
            Login
          </a>
        </p>

      </div>
    </div>
  )
}
