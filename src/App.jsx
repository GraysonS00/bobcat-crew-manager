import React, { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from './supabaseClient'
import { PDFDocument } from 'pdf-lib'
import JSZip from 'jszip'

// =============================================
// CONTEXT
// =============================================

const AuthContext = createContext({})
export const useAuth = () => useContext(AuthContext)

// =============================================
// UTILITY COMPONENTS
// =============================================

const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    default: 'bg-zinc-700 text-zinc-200',
    success: 'bg-emerald-900/50 text-emerald-400 border border-emerald-700',
    warning: 'bg-amber-900/50 text-amber-400 border border-amber-700',
    danger: 'bg-red-900/50 text-red-400 border border-red-700',
    info: 'bg-sky-900/50 text-sky-400 border border-sky-700',
    purple: 'bg-purple-900/50 text-purple-400 border border-purple-700',
  }
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  )
}

const Button = ({ children, onClick, variant = 'primary', size = 'md', disabled = false, loading = false, className = '', type = 'button' }) => {
  const variants = {
    primary: 'bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold',
    secondary: 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200',
    danger: 'bg-red-600 hover:bg-red-500 text-white',
    ghost: 'bg-transparent hover:bg-zinc-800 text-zinc-400',
    success: 'bg-emerald-600 hover:bg-emerald-500 text-white font-semibold',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`rounded-lg transition-all duration-200 ${variants[variant]} ${sizes[size]} ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </span>
      ) : children}
    </button>
  )
}

const Card = ({ children, className = '' }) => (
  <div className={`bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 ${className}`}>
    {children}
  </div>
)

const Input = ({ label, type = 'text', value, onChange, placeholder, className = '', required = false, disabled = false }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    {label && <label className="text-sm text-zinc-400 font-medium">{label}</label>}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className={`bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    />
  </div>
)

const Select = ({ label, value, onChange, options, className = '', disabled = false }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    {label && <label className="text-sm text-zinc-400 font-medium">{label}</label>}
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
)

const Textarea = ({ label, value, onChange, placeholder, rows = 3, disabled = false }) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-sm text-zinc-400 font-medium">{label}</label>}
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      className={`bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all resize-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    />
  </div>
)

const Toggle = ({ label, checked, onChange, description, disabled = false }) => (
  <div className="flex items-center justify-between py-2">
    <div>
      <p className="text-zinc-200 font-medium">{label}</p>
      {description && <p className="text-xs text-zinc-500">{description}</p>}
    </div>
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative w-12 h-7 rounded-full transition-colors ${checked ? 'bg-amber-500' : 'bg-zinc-700'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  </div>
)

const YesNoToggle = ({ label, value, onChange, disabled = false }) => (
  <div className="flex items-center justify-between py-2 border-b border-zinc-800">
    <span className="text-zinc-300">{label}</span>
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => !disabled && onChange(true)}
        disabled={disabled}
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${value === true ? 'bg-emerald-600 text-white' : 'bg-zinc-700 text-zinc-400'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        YES
      </button>
      <button
        type="button"
        onClick={() => !disabled && onChange(false)}
        disabled={disabled}
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${value === false ? 'bg-red-600 text-white' : 'bg-zinc-700 text-zinc-400'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        NO
      </button>
    </div>
  </div>
)

const TimeInput = ({ label, value, onChange, disabled = false }) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-sm text-zinc-400 font-medium">{label}</label>}
    <input
      type="time"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    />
  </div>
)

const CheckboxWithQty = ({ label, checked, onCheckChange, qty, onQtyChange, disabled = false }) => (
  <div className="flex items-center gap-3 py-2">
    <button
      type="button"
      onClick={() => !disabled && onCheckChange(!checked)}
      disabled={disabled}
      className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${checked ? 'bg-amber-500 border-amber-500 text-zinc-900' : 'border-zinc-600'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {checked && <Icons.Check />}
    </button>
    <span className="text-zinc-300 flex-1">{label}</span>
    {checked && (
      <input
        type="number"
        value={qty || ''}
        onChange={(e) => onQtyChange(parseInt(e.target.value) || 0)}
        placeholder="Qty"
        disabled={disabled}
        className="w-20 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-zinc-100 text-sm"
      />
    )}
  </div>
)

const LoadingScreen = () => (
  <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
        <span className="text-2xl font-black text-zinc-900">BC</span>
      </div>
      <p className="text-zinc-500">Loading...</p>
    </div>
  </div>
)

const TabButton = ({ active, onClick, children, count }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
      active ? 'bg-amber-500 text-zinc-900' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
    }`}
  >
    {children}
    {count !== undefined && (
      <span className={`px-2 py-0.5 rounded-full text-xs ${active ? 'bg-zinc-900/30' : 'bg-zinc-700'}`}>
        {count}
      </span>
    )}
  </button>
)

// =============================================
// ICONS
// =============================================

const Icons = {
  Users: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Truck: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  ),
  Clipboard: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  Home: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Logout: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  Plus: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  Camera: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Check: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  X: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Edit: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  Trash: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  Eye: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  Document: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  CheckCircle: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  UserPlus: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  ),
  Settings: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Download: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
}

// =============================================
// LOGIN SCREEN
// =============================================

const LoginScreen = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    if (e) e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-zinc-950 to-zinc-950" />

      <Card className="w-full max-w-md relative z-10 border-zinc-700/50">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500 rounded-2xl mb-4 shadow-lg shadow-amber-500/20">
            <span className="text-2xl font-black text-zinc-900">BC</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100">Bobcat Crew Manager</h1>
          <p className="text-zinc-500 mt-1">Sign in to continue</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-zinc-400 font-medium">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 pr-12 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" loading={loading} className="w-full mt-6">
            Sign In
          </Button>
        </form>
      </Card>
    </div>
  )
}

// =============================================
// NAVIGATION
// =============================================

const Navigation = ({ currentView, setCurrentView, profile, onLogout }) => {
  const navItems = {
    admin: [
      { id: 'dashboard', label: 'Dashboard', icon: Icons.Home },
      { id: 'users', label: 'Users', icon: Icons.UserPlus },
      { id: 'employees', label: 'Employees', icon: Icons.Users },
      { id: 'crews', label: 'Crews', icon: Icons.Users },
      { id: 'equipment', label: 'Equipment', icon: Icons.Truck },
      { id: 'leak-reports', label: 'Leak Reports', icon: Icons.Document },
    ],
    supervisor: [
      { id: 'dashboard', label: 'Dashboard', icon: Icons.Home },
      { id: 'crews', label: 'My Crews', icon: Icons.Users },
      { id: 'equipment', label: 'Equipment', icon: Icons.Truck },
      { id: 'review-reports', label: 'Review Reports', icon: Icons.Document },
    ],
    foreman: [
      { id: 'dashboard', label: 'Dashboard', icon: Icons.Home },
      { id: 'my-crew', label: 'My Crew', icon: Icons.Users },
      { id: 'my-equipment', label: 'Equipment', icon: Icons.Truck },
      { id: 'my-leak-reports', label: 'Leak Reports', icon: Icons.Document },
    ],
  }

  const items = navItems[profile?.role] || []

  return (
    <nav className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center">
                <span className="text-sm font-black text-zinc-900">BC</span>
              </div>
              <span className="font-semibold text-zinc-100 hidden sm:block">Crew Manager</span>
            </div>
            
            <div className="flex gap-1 overflow-x-auto hide-scrollbar">
              {items.map(item => (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all whitespace-nowrap ${
                    currentView === item.id
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  <item.icon />
                  <span className="hidden md:inline">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-zinc-200">{profile?.name}</p>
              <p className="text-xs text-zinc-500 capitalize">{profile?.role}</p>
            </div>
            <button
              onClick={onLogout}
              className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-all"
            >
              <Icons.Logout />
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

// =============================================
// USER MANAGEMENT VIEW (Admin Only)
// =============================================

const UsersManagementView = ({ profiles, crews, employees, onRefresh, logActivity }) => {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [showCrewAssignment, setShowCrewAssignment] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    name: '',
    role: 'foreman',
    phone: ''
  })

  const supervisors = profiles.filter(p => p.role === 'supervisor')
  const foremen = profiles.filter(p => p.role === 'foreman')
  const admins = profiles.filter(p => p.role === 'admin')

  const handleCreateUser = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('https://jkghcufbigixfpnnfcet.supabase.co/functions/v1/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.password,
          name: newUser.name,
          role: newUser.role,
          phone: newUser.phone
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user')
      }

      setSuccess(`User ${newUser.name} created successfully!`)
      if (logActivity) {
        await logActivity('created', 'user', data.user?.id, newUser.name)
      }
      setNewUser({ email: '', password: '', name: '', role: 'foreman', phone: '' })
      setTimeout(() => {
        setShowAddModal(false)
        setSuccess('')
        onRefresh()
      }, 1500)

    } catch (err) {
      setError(err.message || 'Failed to create user')
    }
    
    setLoading(false)
  }

  const handleUpdateRole = async (userId, newRole) => {
    setLoading(true)
    const userProfile = profiles.find(p => p.id === userId)
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)

    if (!error) {
      if (logActivity) {
        await logActivity(`changed role to ${newRole} for`, 'user', userId, userProfile?.name)
      }
      onRefresh()
    }
    setLoading(false)
  }

  const handleAssignSupervisor = async (crewId, supervisorId) => {
    setLoading(true)
    const crew = crews.find(c => c.id === crewId)
    const supervisor = profiles.find(p => p.id === supervisorId)
    const { error } = await supabase
      .from('crews')
      .update({ supervisor_id: supervisorId || null })
      .eq('id', crewId)

    if (!error) {
      if (logActivity) {
        await logActivity(supervisorId ? `assigned ${supervisor?.name} as supervisor for` : 'removed supervisor from', 'crew', crewId, crew?.name)
      }
      onRefresh()
      setShowCrewAssignment(null)
    }
    setLoading(false)
  }

  const handleAssignForeman = async (crewId, foremanUserId, foremanEmployeeId) => {
    setLoading(true)
    const crew = crews.find(c => c.id === crewId)
    const foremanProfile = profiles.find(p => p.id === foremanUserId)
    const { error } = await supabase
      .from('crews')
      .update({
        foreman_user_id: foremanUserId || null,
        foreman_id: foremanEmployeeId || null
      })
      .eq('id', crewId)

    if (!error) {
      if (logActivity) {
        await logActivity(foremanUserId ? `assigned ${foremanProfile?.name} as foreman for` : 'removed foreman from', 'crew', crewId, crew?.name)
      }
      onRefresh()
      setShowCrewAssignment(null)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">User Management</h1>
          <p className="text-zinc-500">Create and manage user accounts</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <span className="flex items-center gap-2"><Icons.UserPlus /> Add User</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400">
              <Icons.Users />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-100">{admins.length}</p>
              <p className="text-sm text-zinc-500">Admins</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-sky-500/10 rounded-xl flex items-center justify-center text-sky-400">
              <Icons.Users />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-100">{supervisors.length}</p>
              <p className="text-sm text-zinc-500">Supervisors</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400">
              <Icons.Users />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-100">{foremen.length}</p>
              <p className="text-sm text-zinc-500">Foremen</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <h2 className="text-lg font-semibold text-zinc-100 mb-4">All Users</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Email</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Role</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Phone</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map(user => (
                <tr key={user.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                  <td className="py-3 px-4 text-zinc-200 font-medium">{user.name}</td>
                  <td className="py-3 px-4 text-zinc-400">{user.id.substring(0, 8)}...</td>
                  <td className="py-3 px-4">
                    <Badge variant={user.role === 'admin' ? 'purple' : user.role === 'supervisor' ? 'info' : 'warning'}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-zinc-400">{user.phone || '-'}</td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => setEditingUser(user)}>
                      <Icons.Edit />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Crew Assignments */}
      <Card>
        <h2 className="text-lg font-semibold text-zinc-100 mb-4">Crew Assignments</h2>
        <p className="text-sm text-zinc-500 mb-4">Assign supervisors and foremen to crews</p>
        <div className="space-y-3">
          {crews.map(crew => {
            const supervisor = profiles.find(p => p.id === crew.supervisor_id)
            const foremanProfile = profiles.find(p => p.id === crew.foreman_user_id)
            const foremanEmployee = employees.find(e => e.id === crew.foreman_id)
            
            return (
              <div key={crew.id} className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
                <div>
                  <p className="font-medium text-zinc-200">{crew.name}</p>
                  <div className="flex gap-4 mt-1 text-sm text-zinc-500">
                    <span>Supervisor: <span className="text-zinc-300">{supervisor?.name || 'Not assigned'}</span></span>
                    <span>Foreman: <span className="text-zinc-300">{foremanProfile?.name || foremanEmployee?.name || 'Not assigned'}</span></span>
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setShowCrewAssignment(crew)}>
                  <span className="flex items-center gap-1"><Icons.Edit /> Assign</span>
                </Button>
              </div>
            )
          })}
          {crews.length === 0 && <p className="text-zinc-500 text-center py-4">No crews created yet</p>}
        </div>
      </Card>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-100">Add New User</h2>
              <button onClick={() => { setShowAddModal(false); setError(''); setSuccess('') }} className="text-zinc-400 hover:text-zinc-200">
                <Icons.X />
              </button>
            </div>
            
            {error && <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2 mb-4">{error}</p>}
            {success && <p className="text-emerald-400 text-sm bg-emerald-900/20 border border-emerald-800 rounded-lg px-3 py-2 mb-4">{success}</p>}
            
            <div className="space-y-4">
              <Input
                label="Full Name"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                placeholder="John Smith"
              />
              <Input
                label="Email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="john@bobcatcontracting.com"
              />
              <Input
                label="Password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Minimum 6 characters"
              />
              <Select
                label="Role"
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                options={[
                  { value: 'foreman', label: 'Foreman' },
                  { value: 'supervisor', label: 'Supervisor' },
                  { value: 'admin', label: 'Admin' },
                ]}
              />
              <Input
                label="Phone (optional)"
                value={newUser.phone}
                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                placeholder="555-0100"
              />
              
              <div className="flex gap-3 pt-4">
                <Button variant="secondary" onClick={() => { setShowAddModal(false); setError(''); setSuccess('') }} className="flex-1">Cancel</Button>
                <Button onClick={handleCreateUser} loading={loading} className="flex-1" disabled={!newUser.name || !newUser.email || !newUser.password}>
                  Create User
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-100">Edit User</h2>
              <button onClick={() => setEditingUser(null)} className="text-zinc-400 hover:text-zinc-200">
                <Icons.X />
              </button>
            </div>
            
            <div className="space-y-4">
              <Input label="Name" value={editingUser.name} disabled />
              
              <Select
                label="Role"
                value={editingUser.role}
                onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                options={[
                  { value: 'foreman', label: 'Foreman' },
                  { value: 'supervisor', label: 'Supervisor' },
                  { value: 'admin', label: 'Admin' },
                ]}
              />
              
              <div className="flex gap-3 pt-4">
                <Button variant="secondary" onClick={() => setEditingUser(null)} className="flex-1">Cancel</Button>
                <Button onClick={() => { handleUpdateRole(editingUser.id, editingUser.role); setEditingUser(null) }} loading={loading} className="flex-1">
                  Save Changes
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Crew Assignment Modal */}
      {showCrewAssignment && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-100">Assign to {showCrewAssignment.name}</h2>
              <button onClick={() => setShowCrewAssignment(null)} className="text-zinc-400 hover:text-zinc-200">
                <Icons.X />
              </button>
            </div>
            
            <div className="space-y-4">
              <Select
                label="Supervisor"
                value={showCrewAssignment.supervisor_id || ''}
                onChange={(e) => handleAssignSupervisor(showCrewAssignment.id, e.target.value)}
                options={[
                  { value: '', label: 'Not assigned' },
                  ...supervisors.map(s => ({ value: s.id, label: s.name }))
                ]}
              />
              
              <Select
                label="Foreman (User Account)"
                value={showCrewAssignment.foreman_user_id || ''}
                onChange={(e) => {
                  const selectedForeman = foremen.find(f => f.id === e.target.value)
                  const matchingEmployee = employees.find(emp => 
                    emp.classification === 'Foreman' && 
                    emp.name.toLowerCase() === selectedForeman?.name?.toLowerCase()
                  )
                  handleAssignForeman(showCrewAssignment.id, e.target.value, matchingEmployee?.id)
                }}
                options={[
                  { value: '', label: 'Not assigned' },
                  ...foremen.map(f => ({ value: f.id, label: f.name }))
                ]}
              />
              
              <div className="pt-4">
                <Button variant="secondary" onClick={() => setShowCrewAssignment(null)} className="w-full">Done</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

// =============================================
// DASHBOARD
// =============================================

const Dashboard = ({ profile, crews, employees, equipment, leakReports, activityLogs = [] }) => {
  const [activitySearch, setActivitySearch] = useState('')
  const [foremanActivitySearch, setForemanActivitySearch] = useState('')

  // Filter activity logs by search query (for admin)
  const filteredActivityLogs = activityLogs.filter(log => {
    if (!activitySearch.trim()) return true
    const query = activitySearch.toLowerCase()
    return (
      log.user_name?.toLowerCase().includes(query) ||
      log.action?.toLowerCase().includes(query) ||
      log.entity_type?.toLowerCase().includes(query) ||
      log.entity_name?.toLowerCase().includes(query)
    )
  })
  const isForeman = profile?.role === 'foreman'
  const isSupervisor = profile?.role === 'supervisor'
  const userCrew = isForeman ? crews.find(c => c.foreman_user_id === profile.id) : null
  const supervisorCrews = isSupervisor ? crews.filter(c => c.supervisor_id === profile.id) : []

  // Get foreman user IDs for supervisor's crews
  const foremanUserIds = supervisorCrews.map(c => c.foreman_user_id).filter(Boolean)

  // Filter activity logs to show only activity from supervisor's foremen
  const foremanActivityLogs = activityLogs.filter(log => {
    if (!foremanUserIds.includes(log.user_id)) return false
    if (!foremanActivitySearch.trim()) return true
    const query = foremanActivitySearch.toLowerCase()
    return (
      log.user_name?.toLowerCase().includes(query) ||
      log.action?.toLowerCase().includes(query) ||
      log.entity_type?.toLowerCase().includes(query) ||
      log.entity_name?.toLowerCase().includes(query)
    )
  })

  const filteredEquipment = isForeman && userCrew 
    ? equipment.filter(e => e.crew_id === userCrew.id)
    : equipment
  
  const filteredReports = isForeman && userCrew
    ? leakReports.filter(r => r.crew_id === userCrew.id)
    : isSupervisor 
    ? leakReports.filter(r => supervisorCrews.some(c => c.id === r.crew_id))
    : leakReports

  const pendingReports = filteredReports.filter(r => r.status === 'submitted')
  const reviewedReports = filteredReports.filter(r => r.status === 'reviewed')

  const activeEmployees = employees.filter(e => e.active).length
  const equipmentInService = filteredEquipment.filter(e => e.status === 'In Service').length
  const outOfServiceCount = filteredEquipment.filter(e => e.status === 'Out of Service').length

  if (isSupervisor) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Supervisor Dashboard</h1>
          <p className="text-zinc-500">Manage your crews and review reports</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400">
                <Icons.Users />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-100">{supervisorCrews.length}</p>
                <p className="text-sm text-zinc-500">Crews Under You</p>
              </div>
            </div>
          </Card>

          <Card className={pendingReports.length > 0 ? 'border-amber-700/50' : ''}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${pendingReports.length > 0 ? 'bg-amber-500/10' : 'bg-zinc-700/50'} rounded-xl flex items-center justify-center ${pendingReports.length > 0 ? 'text-amber-400' : 'text-zinc-500'}`}>
                <Icons.Clock />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-100">{pendingReports.length}</p>
                <p className="text-sm text-zinc-500">Pending Review</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
                <Icons.CheckCircle />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-100">{reviewedReports.length}</p>
                <p className="text-sm text-zinc-500">Reviewed</p>
              </div>
            </div>
          </Card>
        </div>

        {pendingReports.length > 0 && (
          <Card className="border-amber-700/50 bg-amber-900/10">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center text-amber-400 flex-shrink-0">
                <Icons.Document />
              </div>
              <div>
                <h3 className="font-semibold text-amber-400">Reports Need Review</h3>
                <p className="text-sm text-zinc-400 mt-1">
                  You have {pendingReports.length} leak report{pendingReports.length > 1 ? 's' : ''} waiting for review.
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h2 className="text-lg font-semibold text-zinc-100 mb-4">Your Crews</h2>
            <div className="space-y-3">
              {supervisorCrews.map(crew => {
                const foreman = employees.find(e => e.id === crew.foreman_id)
                const crewPending = leakReports.filter(r => r.crew_id === crew.id && r.status === 'submitted').length
                
                return (
                  <div key={crew.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                    <div>
                      <p className="font-medium text-zinc-200">{crew.name}</p>
                      <p className="text-sm text-zinc-500">Foreman: {foreman?.name || 'Not assigned'}</p>
                    </div>
                    {crewPending > 0 && <Badge variant="warning">{crewPending} pending</Badge>}
                  </div>
                )
              })}
              {supervisorCrews.length === 0 && <p className="text-zinc-500 text-center py-4">No crews assigned to you</p>}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-zinc-100">Foreman Activity</h2>
              <span className="text-xs text-zinc-500">{foremanActivityLogs.length} entries</span>
            </div>
            <Input
              placeholder="Search activity..."
              value={foremanActivitySearch}
              onChange={(e) => setForemanActivitySearch(e.target.value)}
              className="mb-4"
            />
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {foremanActivityLogs.slice(0, 50).map(log => {
                const getActionColor = (action) => {
                  if (action?.includes('created') || action?.includes('added') || action?.includes('submitted')) return 'text-emerald-400'
                  if (action?.includes('deleted') || action?.includes('removed')) return 'text-red-400'
                  if (action?.includes('updated') || action?.includes('edited') || action?.includes('changed')) return 'text-amber-400'
                  if (action?.includes('reviewed') || action?.includes('approved')) return 'text-sky-400'
                  return 'text-zinc-400'
                }
                const getEntityIcon = (entityType) => {
                  switch (entityType) {
                    case 'crew': return <Icons.Users />
                    case 'equipment': return <Icons.Truck />
                    case 'leak_report': return <Icons.Document />
                    default: return <Icons.Document />
                  }
                }
                const timeAgo = (date) => {
                  const now = new Date()
                  const then = new Date(date)
                  const diff = Math.floor((now - then) / 1000)
                  if (diff < 60) return 'just now'
                  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
                  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
                  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
                  return then.toLocaleDateString()
                }
                return (
                  <div key={log.id} className="p-2 bg-zinc-800/50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-zinc-700/50 rounded-lg flex items-center justify-center text-zinc-400 flex-shrink-0 mt-0.5">
                        {getEntityIcon(log.entity_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-200">
                          <span className="font-medium">{log.user_name}</span>
                          <span className={`${getActionColor(log.action)} mx-1`}>{log.action}</span>
                          <span className="text-zinc-400">{log.entity_name || log.entity_type}</span>
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">{timeAgo(log.created_at)}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
              {foremanActivityLogs.length === 0 && (
                <p className="text-zinc-500 text-center py-4">
                  {foremanActivitySearch ? 'No matching activity' : 'No foreman activity recorded yet'}
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">
          {isForeman ? 'Welcome back' : 'Admin Dashboard'}
        </h1>
        <p className="text-zinc-500">
          {isForeman && userCrew ? `${userCrew.name} Dashboard` : 'Overview of all crews and operations'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {!isForeman && (
          <Card>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-sky-500/10 rounded-xl flex items-center justify-center text-sky-400">
                <Icons.Users />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-100">{activeEmployees}</p>
                <p className="text-sm text-zinc-500">Active Employees</p>
              </div>
            </div>
          </Card>
        )}
        
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400">
              <Icons.Users />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-100">
                {isForeman && userCrew ? (userCrew.crew_members?.length || 0) + 1 : crews.length}
              </p>
              <p className="text-sm text-zinc-500">{isForeman ? 'Crew Members' : 'Active Crews'}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 ${outOfServiceCount > 0 ? 'bg-amber-500/10' : 'bg-emerald-500/10'} rounded-xl flex items-center justify-center ${outOfServiceCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              <Icons.Truck />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-100">{equipmentInService}/{filteredEquipment.length}</p>
              <p className="text-sm text-zinc-500">Equipment {isForeman ? 'Ready' : 'In Service'}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400">
              <Icons.Document />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-100">{filteredReports.length}</p>
              <p className="text-sm text-zinc-500">Leak Reports</p>
            </div>
          </div>
        </Card>
      </div>

      {outOfServiceCount > 0 && isForeman && (
        <Card className="border-amber-700/50 bg-amber-900/10">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center text-amber-400 flex-shrink-0">
              <Icons.Truck />
            </div>
            <div>
              <h3 className="font-semibold text-amber-400">Equipment Alert</h3>
              <p className="text-sm text-zinc-400 mt-1">
                {outOfServiceCount} piece{outOfServiceCount > 1 ? 's' : ''} of equipment marked out of service.
              </p>
            </div>
          </div>
        </Card>
      )}

      {!isForeman && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h2 className="text-lg font-semibold text-zinc-100 mb-4">Crew Status</h2>
            <div className="space-y-3">
              {crews.map(crew => {
                const crewEquipment = equipment.filter(e => e.crew_id === crew.id)
                const outOfService = crewEquipment.filter(e => e.status === 'Out of Service').length
                
                return (
                  <div key={crew.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                    <div>
                      <p className="font-medium text-zinc-200">{crew.name}</p>
                      <p className="text-sm text-zinc-500">{crew.foreman?.name || 'No foreman'} • {(crew.crew_members?.length || 0) + 1} members</p>
                    </div>
                    <div className="flex gap-2">
                      {outOfService > 0 && <Badge variant="warning">{outOfService} equipment issue{outOfService > 1 ? 's' : ''}</Badge>}
                      <Badge variant="success">Active</Badge>
                    </div>
                  </div>
                )
              })}
              {crews.length === 0 && <p className="text-zinc-500 text-center py-4">No crews created yet</p>}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-zinc-100">Activity</h2>
              <span className="text-xs text-zinc-500">{filteredActivityLogs.length} entries</span>
            </div>
            <Input
              placeholder="Search activity..."
              value={activitySearch}
              onChange={(e) => setActivitySearch(e.target.value)}
              className="mb-4"
            />
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {filteredActivityLogs.slice(0, 50).map(log => {
                const getActionColor = (action) => {
                  if (action?.includes('created') || action?.includes('added')) return 'text-emerald-400'
                  if (action?.includes('deleted') || action?.includes('removed')) return 'text-red-400'
                  if (action?.includes('updated') || action?.includes('edited') || action?.includes('changed')) return 'text-amber-400'
                  if (action?.includes('reviewed') || action?.includes('approved')) return 'text-sky-400'
                  return 'text-zinc-400'
                }
                const getEntityIcon = (entityType) => {
                  switch (entityType) {
                    case 'user': return <Icons.Users />
                    case 'employee': return <Icons.Users />
                    case 'crew': return <Icons.Users />
                    case 'equipment': return <Icons.Truck />
                    case 'leak_report': return <Icons.Document />
                    default: return <Icons.Document />
                  }
                }
                const timeAgo = (date) => {
                  const now = new Date()
                  const then = new Date(date)
                  const diff = Math.floor((now - then) / 1000)
                  if (diff < 60) return 'just now'
                  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
                  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
                  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
                  return then.toLocaleDateString()
                }
                return (
                  <div key={log.id} className="p-2 bg-zinc-800/50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-zinc-700/50 rounded-lg flex items-center justify-center text-zinc-400 flex-shrink-0 mt-0.5">
                        {getEntityIcon(log.entity_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-200">
                          <span className="font-medium">{log.user_name}</span>
                          <span className={`${getActionColor(log.action)} mx-1`}>{log.action}</span>
                          <span className="text-zinc-400">{log.entity_name || log.entity_type}</span>
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">{timeAgo(log.created_at)}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
              {filteredActivityLogs.length === 0 && (
                <p className="text-zinc-500 text-center py-4">
                  {activitySearch ? 'No matching activity' : 'No activity recorded yet'}
                </p>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

// =============================================
// EMPLOYEES VIEW
// =============================================

const EmployeesView = ({ employees, crews, onRefresh, readOnly = false, logActivity }) => {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [loading, setLoading] = useState(false)
  const [newEmployee, setNewEmployee] = useState({ name: '', classification: 'General Labor', phone: '', employee_number: '', active: true })

  const getEmployeeWarnings = (employee) => {
    const warnings = []
    const crewMemberships = crews?.filter(c => 
      c.crew_members?.some(m => m.employee_id === employee.id)
    ) || []
    const foremanOf = crews?.filter(c => c.foreman_id === employee.id) || []
    
    if (crewMemberships.length > 0) {
      warnings.push(`Assigned to ${crewMemberships.length} crew${crewMemberships.length > 1 ? 's' : ''}`)
    }
    if (foremanOf.length > 0) {
      warnings.push(`Foreman of ${foremanOf.map(c => c.name).join(', ')}`)
    }
    return warnings
  }

  const handleAdd = async () => {
    setLoading(true)
    const { data } = await supabase.from('employees').insert([newEmployee]).select()
    if (data?.[0] && logActivity) {
      await logActivity('added', 'employee', data[0].id, newEmployee.name)
    }
    setNewEmployee({ name: '', classification: 'General Labor', phone: '', employee_number: '', active: true })
    setShowAddModal(false)
    onRefresh()
    setLoading(false)
  }

  const handleUpdate = async () => {
    setLoading(true)
    await supabase.from('employees').update({
      name: editingEmployee.name, classification: editingEmployee.classification,
      phone: editingEmployee.phone, employee_number: editingEmployee.employee_number, active: editingEmployee.active,
    }).eq('id', editingEmployee.id)
    if (logActivity) {
      await logActivity('updated', 'employee', editingEmployee.id, editingEmployee.name)
    }
    setEditingEmployee(null)
    onRefresh()
    setLoading(false)
  }

  const handleDelete = async (employee) => {
    setLoading(true)
    try {
      await supabase.from('crew_members').delete().eq('employee_id', employee.id)
      await supabase.from('crews').update({ foreman_id: null }).eq('foreman_id', employee.id)
      const { error } = await supabase.from('employees').delete().eq('id', employee.id)
      if (error) throw error
      if (logActivity) {
        await logActivity('deleted', 'employee', employee.id, employee.name)
      }
      setShowDeleteConfirm(null)
      onRefresh()
    } catch (err) {
      alert('Error deleting employee: ' + err.message)
    }
    setLoading(false)
  }

  const classifications = ['Foreman', 'Skilled Labor', 'General Labor', 'Operator', 'Welder', 'Truck Driver']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Employee Roster</h1>
          <p className="text-zinc-500">{employees.filter(e => e.active).length} active employees</p>
        </div>
        {!readOnly && (
          <Button onClick={() => setShowAddModal(true)}>
            <span className="flex items-center gap-2"><Icons.Plus /> Add Employee</span>
          </Button>
        )}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Employee #</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Classification</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Phone</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Status</th>
                {!readOnly && <th className="text-right py-3 px-4 text-sm font-medium text-zinc-400">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                  <td className="py-3 px-4 text-zinc-200 font-medium">{emp.name}</td>
                  <td className="py-3 px-4 text-zinc-400">{emp.employee_number || '-'}</td>
                  <td className="py-3 px-4"><Badge variant={emp.classification === 'Foreman' ? 'info' : 'default'}>{emp.classification}</Badge></td>
                  <td className="py-3 px-4 text-zinc-400">{emp.phone || '-'}</td>
                  <td className="py-3 px-4"><Badge variant={emp.active ? 'success' : 'danger'}>{emp.active ? 'Active' : 'Inactive'}</Badge></td>
                  {!readOnly && (
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingEmployee(emp)} className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 rounded-lg"><Icons.Edit /></button>
                        <button onClick={() => setShowDeleteConfirm(emp)} className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 rounded-lg"><Icons.Trash /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {employees.length === 0 && <p className="text-zinc-500 text-center py-8">No employees added yet</p>}
        </div>
      </Card>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-100">Add Employee</h2>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-200"><Icons.X /></button>
            </div>
            <div className="space-y-4">
              <Input label="Name" value={newEmployee.name} onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })} placeholder="Full name" />
              <Input label="Employee Number" value={newEmployee.employee_number} onChange={(e) => setNewEmployee({ ...newEmployee, employee_number: e.target.value })} placeholder="e.g., 1234" />
              <Select label="Classification" value={newEmployee.classification} onChange={(e) => setNewEmployee({ ...newEmployee, classification: e.target.value })} options={classifications.map(c => ({ value: c, label: c }))} />
              <Input label="Phone" value={newEmployee.phone} onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })} placeholder="555-0100" />
              <div className="flex gap-3 pt-4">
                <Button variant="secondary" onClick={() => setShowAddModal(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleAdd} loading={loading} className="flex-1" disabled={!newEmployee.name}>Add Employee</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {editingEmployee && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-100">Edit Employee</h2>
              <button onClick={() => setEditingEmployee(null)} className="text-zinc-400 hover:text-zinc-200"><Icons.X /></button>
            </div>
            <div className="space-y-4">
              <Input label="Name" value={editingEmployee.name} onChange={(e) => setEditingEmployee({ ...editingEmployee, name: e.target.value })} />
              <Input label="Employee Number" value={editingEmployee.employee_number || ''} onChange={(e) => setEditingEmployee({ ...editingEmployee, employee_number: e.target.value })} />
              <Select label="Classification" value={editingEmployee.classification} onChange={(e) => setEditingEmployee({ ...editingEmployee, classification: e.target.value })} options={classifications.map(c => ({ value: c, label: c }))} />
              <Input label="Phone" value={editingEmployee.phone || ''} onChange={(e) => setEditingEmployee({ ...editingEmployee, phone: e.target.value })} />
              <Select label="Status" value={editingEmployee.active ? 'active' : 'inactive'} onChange={(e) => setEditingEmployee({ ...editingEmployee, active: e.target.value === 'active' })} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
              <div className="flex gap-3 pt-4">
                <Button variant="secondary" onClick={() => setEditingEmployee(null)} className="flex-1">Cancel</Button>
                <Button onClick={handleUpdate} loading={loading} className="flex-1">Save Changes</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-100">Remove Employee</h2>
              <button onClick={() => setShowDeleteConfirm(null)} className="text-zinc-400 hover:text-zinc-200"><Icons.X /></button>
            </div>
            <div className="space-y-4">
              <p className="text-zinc-300">
                Are you sure you want to remove <span className="font-semibold text-zinc-100">{showDeleteConfirm.name}</span>?
              </p>
              {getEmployeeWarnings(showDeleteConfirm).length > 0 && (
                <div className="bg-amber-900/20 border border-amber-700 rounded-lg p-3">
                  <p className="text-amber-400 font-medium text-sm mb-2">Warning:</p>
                  <ul className="text-sm text-zinc-400 space-y-1">
                    {getEmployeeWarnings(showDeleteConfirm).map((warning, i) => (
                      <li key={i}>• {warning}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-zinc-500 mt-2">These assignments will be removed.</p>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <Button variant="secondary" onClick={() => setShowDeleteConfirm(null)} className="flex-1">Cancel</Button>
                <Button variant="danger" onClick={() => handleDelete(showDeleteConfirm)} loading={loading} className="flex-1">
                  Remove Employee
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

// =============================================
// CREWS VIEW
// =============================================

const CrewsView = ({ crews, employees, profiles, profile, onRefresh, equipment, leakReports, logActivity }) => {
  const [selectedCrew, setSelectedCrew] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAddCrew, setShowAddCrew] = useState(false)
  const [newCrewName, setNewCrewName] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const isForeman = profile?.role === 'foreman'
  const isSupervisor = profile?.role === 'supervisor'
  const isAdmin = profile?.role === 'admin'
  const userCrew = isForeman ? crews.find(c => c.foreman_user_id === profile.id) : null
  const supervisorCrews = isSupervisor ? crews.filter(c => c.supervisor_id === profile.id) : []

  const displayCrews = isForeman ? (userCrew ? [userCrew] : []) : isSupervisor ? supervisorCrews : crews
  const availableEmployees = employees.filter(e => e.active && e.classification !== 'Foreman')

  // Fuzzy search function - returns employees sorted by match quality
  const getFilteredEmployees = (query) => {
    if (!query.trim()) return availableEmployees
    const lowerQuery = query.toLowerCase()
    return availableEmployees
      .map(emp => {
        const name = emp.name.toLowerCase()
        const classification = emp.classification?.toLowerCase() || ''
        let score = 0
        // Exact match at start of name
        if (name.startsWith(lowerQuery)) score += 100
        // Exact match at start of any word in name
        else if (name.split(' ').some(word => word.startsWith(lowerQuery))) score += 80
        // Contains the query
        else if (name.includes(lowerQuery)) score += 60
        // Classification match
        if (classification.includes(lowerQuery)) score += 40
        // Partial character matching for typos
        if (score === 0) {
          const queryChars = lowerQuery.split('')
          let matchCount = 0
          let lastIndex = -1
          for (const char of queryChars) {
            const idx = name.indexOf(char, lastIndex + 1)
            if (idx > lastIndex) {
              matchCount++
              lastIndex = idx
            }
          }
          score = (matchCount / queryChars.length) * 30
        }
        return { ...emp, score }
      })
      .filter(emp => emp.score > 0)
      .sort((a, b) => b.score - a.score)
  }

  const filteredEmployees = getFilteredEmployees(searchQuery)

  const getCrewWarnings = (crew) => {
    const warnings = []
    const crewEquipment = equipment?.filter(e => e.crew_id === crew.id) || []
    const crewReports = leakReports?.filter(r => r.crew_id === crew.id) || []
    const memberCount = crew.crew_members?.length || 0
    
    if (memberCount > 0) warnings.push(`${memberCount} crew member${memberCount > 1 ? 's' : ''} assigned`)
    if (crewEquipment.length > 0) warnings.push(`${crewEquipment.length} equipment item${crewEquipment.length > 1 ? 's' : ''} will be unassigned`)
    if (crewReports.length > 0) warnings.push(`${crewReports.length} leak report${crewReports.length > 1 ? 's' : ''} linked (will remain in system)`)
    
    return warnings
  }

  const startEditing = (crew) => {
    setSelectedCrew(crew)
    setSelectedMembers(crew.crew_members?.map(m => m.employee_id) || [])
    setSearchQuery('')
    setIsEditing(true)
  }

  const toggleMember = (id) => setSelectedMembers(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id])

  const handleSave = async () => {
    setLoading(true)
    await supabase.from('crew_members').delete().eq('crew_id', selectedCrew.id)
    if (selectedMembers.length > 0) {
      await supabase.from('crew_members').insert(selectedMembers.map(empId => ({ crew_id: selectedCrew.id, employee_id: empId })))
    }
    if (logActivity) {
      await logActivity('updated crew members for', 'crew', selectedCrew.id, selectedCrew.name)
    }
    setIsEditing(false)
    setSelectedCrew(null)
    setSearchQuery('')
    onRefresh()
    setLoading(false)
  }

  const handleAddCrew = async () => {
    if (!newCrewName.trim()) return
    setLoading(true)
    const { data } = await supabase.from('crews').insert([{ name: newCrewName.trim() }]).select()
    if (data?.[0] && logActivity) {
      await logActivity('created', 'crew', data[0].id, newCrewName.trim())
    }
    setNewCrewName('')
    setShowAddCrew(false)
    onRefresh()
    setLoading(false)
  }

  const handleDeleteCrew = async (crew) => {
    setLoading(true)
    try {
      await supabase.from('crew_members').delete().eq('crew_id', crew.id)
      await supabase.from('equipment').update({ crew_id: null }).eq('crew_id', crew.id)
      const { error } = await supabase.from('crews').delete().eq('id', crew.id)
      if (error) throw error
      if (logActivity) {
        await logActivity('deleted', 'crew', crew.id, crew.name)
      }
      setShowDeleteConfirm(null)
      onRefresh()
    } catch (err) {
      alert('Error deleting crew: ' + err.message)
    }
    setLoading(false)
  }

  if (isForeman && userCrew) {
    const crewMembers = employees.filter(e => userCrew.crew_members?.some(m => m.employee_id === e.id))
    const foreman = employees.find(e => e.id === userCrew.foreman_id)

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">{userCrew.name}</h1>
            <p className="text-zinc-500">Manage your crew composition</p>
          </div>
          {!isEditing && <Button onClick={() => startEditing(userCrew)}><span className="flex items-center gap-2"><Icons.Edit /> Edit Crew</span></Button>}
        </div>

        <Card>
          <h2 className="text-lg font-semibold text-zinc-100 mb-4">Foreman</h2>
          <div className="flex items-center gap-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
            <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-zinc-900 font-bold">
              {foreman?.name?.split(' ').map(n => n[0]).join('') || '?'}
            </div>
            <div>
              <p className="font-medium text-zinc-100">{foreman?.name || 'Not assigned'}</p>
              <p className="text-sm text-zinc-500">{foreman?.phone || '-'}</p>
            </div>
            <Badge variant="info" className="ml-auto">Foreman</Badge>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-zinc-100 mb-4">Crew Members {isEditing && <span className="text-amber-400">- Editing</span>}</h2>
          {isEditing ? (
            <div className="space-y-4">
              <Input
                placeholder="Search employees by name or classification..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <p className="text-sm text-zinc-400">
                {searchQuery ? `${filteredEmployees.length} matching employees` : `${availableEmployees.length} employees available`}
                {selectedMembers.length > 0 && ` • ${selectedMembers.length} selected`}
              </p>
              {/* Selected employees - always visible at top */}
              {selectedMembers.length > 0 && (
                <div className="space-y-2 pb-3 border-b border-zinc-700">
                  <p className="text-xs font-medium text-amber-400 uppercase tracking-wide">Current Crew Members</p>
                  <div className="grid gap-2">
                    {availableEmployees.filter(emp => selectedMembers.includes(emp.id)).map(emp => (
                      <button key={emp.id} onClick={() => toggleMember(emp.id)}
                        className="flex items-center gap-4 p-3 rounded-lg border text-left border-amber-500 bg-amber-500/10">
                        <div className="w-6 h-6 rounded border-2 flex items-center justify-center border-amber-500 bg-amber-500 text-zinc-900">
                          <Icons.Check />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-zinc-200">{emp.name}</p>
                          <p className="text-sm text-zinc-500">{emp.classification}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {/* Available employees to add */}
              <div className="grid gap-2 max-h-80 overflow-y-auto">
                {filteredEmployees.filter(emp => !selectedMembers.includes(emp.id)).map(emp => (
                  <button key={emp.id} onClick={() => toggleMember(emp.id)}
                    className="flex items-center gap-4 p-3 rounded-lg border text-left border-zinc-700 hover:border-zinc-600 bg-zinc-800/50">
                    <div className="w-6 h-6 rounded border-2 flex items-center justify-center border-zinc-600">
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-zinc-200">{emp.name}</p>
                      <p className="text-sm text-zinc-500">{emp.classification}</p>
                    </div>
                  </button>
                ))}
                {filteredEmployees.filter(emp => !selectedMembers.includes(emp.id)).length === 0 && searchQuery && (
                  <p className="text-zinc-500 py-4 text-center">No additional employees match "{searchQuery}"</p>
                )}
              </div>
              <div className="flex gap-3 pt-4 border-t border-zinc-800">
                <Button variant="secondary" onClick={() => { setIsEditing(false); setSearchQuery(''); }} className="flex-1">Cancel</Button>
                <Button onClick={handleSave} loading={loading} className="flex-1">Save Crew</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {crewMembers.length === 0 ? <p className="text-zinc-500 py-8 text-center">No crew members assigned</p> : crewMembers.map(emp => (
                <div key={emp.id} className="flex items-center gap-4 p-3 bg-zinc-800/50 rounded-lg">
                  <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center text-zinc-300 font-medium">{emp.name.split(' ').map(n => n[0]).join('')}</div>
                  <div className="flex-1">
                    <p className="font-medium text-zinc-200">{emp.name}</p>
                    <p className="text-sm text-zinc-500">{emp.phone || '-'}</p>
                  </div>
                  <Badge>{emp.classification}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">{isSupervisor ? 'My Crews' : 'All Crews'}</h1>
          <p className="text-zinc-500">{displayCrews.length} crews</p>
        </div>
        {isAdmin && <Button onClick={() => setShowAddCrew(true)}><span className="flex items-center gap-2"><Icons.Plus /> Add Crew</span></Button>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {displayCrews.map(crew => {
          const foreman = employees.find(e => e.id === crew.foreman_id)
          const supervisor = profiles?.find(p => p.id === crew.supervisor_id)
          const members = employees.filter(e => crew.crew_members?.some(m => m.employee_id === e.id))
          
          return (
            <Card key={crew.id} className="hover:border-zinc-700">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-zinc-100">{crew.name}</h3>
                  <p className="text-sm text-zinc-500">Foreman: {foreman?.name || 'Not assigned'}</p>
                  {!isSupervisor && supervisor && <p className="text-sm text-zinc-500">Supervisor: {supervisor.name}</p>}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedCrew(crew)}><span className="flex items-center gap-1"><Icons.Eye /> View</span></Button>
                  {(isSupervisor || isAdmin) && (
                    <Button variant="ghost" size="sm" onClick={() => startEditing(crew)}><span className="flex items-center gap-1"><Icons.Edit /> Edit</span></Button>
                  )}
                  {isAdmin && (
                    <button onClick={() => setShowDeleteConfirm(crew)} className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 rounded-lg">
                      <Icons.Trash />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {members.slice(0, 3).map(m => <div key={m.id} className="px-2 py-1 bg-zinc-800 rounded text-sm text-zinc-300">{m.name}</div>)}
                {members.length > 3 && <span className="px-2 py-1 text-sm text-zinc-500">+{members.length - 3} more</span>}
                {members.length === 0 && <span className="text-sm text-zinc-500">No members assigned</span>}
              </div>
            </Card>
          )
        })}
      </div>

      {displayCrews.length === 0 && <Card className="text-center py-12"><p className="text-zinc-400">{isSupervisor ? 'No crews assigned to you' : 'No crews created yet'}</p></Card>}

      {selectedCrew && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-100">{selectedCrew.name} {isEditing && <span className="text-amber-400">- Editing</span>}</h2>
              <button onClick={() => { setSelectedCrew(null); setIsEditing(false); setSearchQuery(''); }} className="text-zinc-400 hover:text-zinc-200"><Icons.X /></button>
            </div>
            {isEditing ? (
              <div className="space-y-4">
                <Input
                  placeholder="Search employees by name or classification..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <p className="text-sm text-zinc-400">
                  {searchQuery ? `${filteredEmployees.length} matching employees` : `${availableEmployees.length} employees available`}
                  {selectedMembers.length > 0 && ` • ${selectedMembers.length} selected`}
                </p>
                {/* Selected employees - always visible at top */}
                {selectedMembers.length > 0 && (
                  <div className="space-y-2 pb-3 border-b border-zinc-700">
                    <p className="text-xs font-medium text-amber-400 uppercase tracking-wide">Current Crew Members</p>
                    <div className="grid gap-2">
                      {availableEmployees.filter(emp => selectedMembers.includes(emp.id)).map(emp => (
                        <button key={emp.id} onClick={() => toggleMember(emp.id)}
                          className="flex items-center gap-4 p-3 rounded-lg border text-left border-amber-500 bg-amber-500/10">
                          <div className="w-6 h-6 rounded border-2 flex items-center justify-center border-amber-500 bg-amber-500 text-zinc-900">
                            <Icons.Check />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-zinc-200">{emp.name}</p>
                            <p className="text-sm text-zinc-500">{emp.classification}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {/* Available employees to add */}
                <div className="grid gap-2 max-h-80 overflow-y-auto">
                  {filteredEmployees.filter(emp => !selectedMembers.includes(emp.id)).map(emp => (
                    <button key={emp.id} onClick={() => toggleMember(emp.id)}
                      className="flex items-center gap-4 p-3 rounded-lg border text-left border-zinc-700 hover:border-zinc-600 bg-zinc-800/50">
                      <div className="w-6 h-6 rounded border-2 flex items-center justify-center border-zinc-600">
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-zinc-200">{emp.name}</p>
                        <p className="text-sm text-zinc-500">{emp.classification}</p>
                      </div>
                    </button>
                  ))}
                  {filteredEmployees.filter(emp => !selectedMembers.includes(emp.id)).length === 0 && searchQuery && (
                    <p className="text-zinc-500 py-4 text-center">No additional employees match "{searchQuery}"</p>
                  )}
                </div>
                <div className="flex gap-3 pt-4 border-t border-zinc-800">
                  <Button variant="secondary" onClick={() => { setIsEditing(false); setSearchQuery(''); }} className="flex-1">Cancel</Button>
                  <Button onClick={handleSave} loading={loading} className="flex-1">Save Crew</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {employees.filter(e => selectedCrew.crew_members?.some(m => m.employee_id === e.id) || e.id === selectedCrew.foreman_id).map(emp => (
                  <div key={emp.id} className="flex items-center gap-4 p-3 bg-zinc-800/50 rounded-lg">
                    <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center text-zinc-300 font-medium">{emp.name.split(' ').map(n => n[0]).join('')}</div>
                    <div className="flex-1">
                      <p className="font-medium text-zinc-200">{emp.name}</p>
                      <p className="text-sm text-zinc-500">{emp.phone || '-'}</p>
                    </div>
                    <Badge variant={emp.id === selectedCrew.foreman_id ? 'info' : 'default'}>{emp.id === selectedCrew.foreman_id ? 'Foreman' : emp.classification}</Badge>
                  </div>
                ))}
                {(isSupervisor || isAdmin) && (
                  <div className="pt-4 border-t border-zinc-800">
                    <Button onClick={() => startEditing(selectedCrew)} className="w-full"><span className="flex items-center justify-center gap-2"><Icons.Edit /> Edit Crew Members</span></Button>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {showAddCrew && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-100">Add New Crew</h2>
              <button onClick={() => setShowAddCrew(false)} className="text-zinc-400 hover:text-zinc-200"><Icons.X /></button>
            </div>
            <div className="space-y-4">
              <Input label="Crew Name" value={newCrewName} onChange={(e) => setNewCrewName(e.target.value)} placeholder="e.g., North Team" />
              <p className="text-sm text-zinc-500">You can assign a supervisor and foreman after creating the crew in the Users section.</p>
              <div className="flex gap-3 pt-4">
                <Button variant="secondary" onClick={() => setShowAddCrew(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleAddCrew} loading={loading} className="flex-1" disabled={!newCrewName.trim()}>Create Crew</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-100">Remove Crew</h2>
              <button onClick={() => setShowDeleteConfirm(null)} className="text-zinc-400 hover:text-zinc-200"><Icons.X /></button>
            </div>
            <div className="space-y-4">
              <p className="text-zinc-300">
                Are you sure you want to remove <span className="font-semibold text-zinc-100">{showDeleteConfirm.name}</span>?
              </p>
              {getCrewWarnings(showDeleteConfirm).length > 0 && (
                <div className="bg-amber-900/20 border border-amber-700 rounded-lg p-3">
                  <p className="text-amber-400 font-medium text-sm mb-2">Warning:</p>
                  <ul className="text-sm text-zinc-400 space-y-1">
                    {getCrewWarnings(showDeleteConfirm).map((warning, i) => (
                      <li key={i}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <Button variant="secondary" onClick={() => setShowDeleteConfirm(null)} className="flex-1">Cancel</Button>
                <Button variant="danger" onClick={() => handleDeleteCrew(showDeleteConfirm)} loading={loading} className="flex-1">
                  Remove Crew
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

// =============================================
// EQUIPMENT VIEW
// =============================================

const EquipmentView = ({ equipment, crews, profile, onRefresh, logActivity }) => {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState(null)
  const [loading, setLoading] = useState(false)
  const [newEquipment, setNewEquipment] = useState({ type: 'Tool', description: '', equipment_number: '', serial_number: '', photo_url: null, status: 'In Service', notes: '', crew_id: '' })

  const isForeman = profile?.role === 'foreman'
  const isSupervisor = profile?.role === 'supervisor'
  const isAdmin = profile?.role === 'admin'
  const userCrew = isForeman ? crews.find(c => c.foreman_user_id === profile.id) : null
  const supervisorCrews = isSupervisor ? crews.filter(c => c.supervisor_id === profile.id) : []

  // Filter equipment based on role
  const filteredEquipment = isForeman && userCrew
    ? equipment.filter(e => e.crew_id === userCrew.id)
    : isSupervisor
    ? equipment.filter(e => supervisorCrews.some(c => c.id === e.crew_id))
    : equipment

  const equipmentTypes = ['Truck', 'Trailer', 'Excavator', 'Tool', 'Other']

  const handlePhotoUpload = async (e, isEdit = false) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fileName = `${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('equipment-photos').upload(fileName, file)
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('equipment-photos').getPublicUrl(fileName)
      if (isEdit) setEditingEquipment({ ...editingEquipment, photo_url: publicUrl })
      else setNewEquipment({ ...newEquipment, photo_url: publicUrl })
    }
  }

  const handleAdd = async () => {
    setLoading(true)
    // For foremen, use their crew. For supervisors, use selected crew. For admins, use selected crew or null.
    const crewId = isForeman ? userCrew?.id : (newEquipment.crew_id || null)
    const { data } = await supabase.from('equipment').insert([{ ...newEquipment, crew_id: crewId }]).select()
    if (data?.[0] && logActivity) {
      await logActivity('added', 'equipment', data[0].id, newEquipment.description || newEquipment.type)
    }
    setNewEquipment({ type: 'Tool', description: '', equipment_number: '', serial_number: '', photo_url: null, status: 'In Service', notes: '', crew_id: '' })
    setShowAddModal(false)
    onRefresh()
    setLoading(false)
  }

  const handleUpdate = async () => {
    setLoading(true)
    const updateData = {
      type: editingEquipment.type, description: editingEquipment.description, equipment_number: editingEquipment.equipment_number,
      serial_number: editingEquipment.serial_number, photo_url: editingEquipment.photo_url, status: editingEquipment.status, notes: editingEquipment.notes,
    }
    // Allow supervisors and admins to change crew assignment
    if (isSupervisor || isAdmin) {
      updateData.crew_id = editingEquipment.crew_id || null
    }
    await supabase.from('equipment').update(updateData).eq('id', editingEquipment.id)
    if (logActivity) {
      await logActivity('updated', 'equipment', editingEquipment.id, editingEquipment.description || editingEquipment.type)
    }
    setEditingEquipment(null)
    onRefresh()
    setLoading(false)
  }

  const handleDelete = async (item) => {
    if (confirm('Remove?')) {
      await supabase.from('equipment').delete().eq('id', item.id)
      if (logActivity) {
        await logActivity('deleted', 'equipment', item.id, item.description || item.type)
      }
      onRefresh()
    }
  }

  const getTitle = () => {
    if (isForeman) return 'My Equipment'
    if (isSupervisor) return "My Crews' Equipment"
    return 'All Equipment'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">{getTitle()}</h1>
          <p className="text-zinc-500">{filteredEquipment.length} items</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}><span className="flex items-center gap-2"><Icons.Plus /> Add Equipment</span></Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEquipment.map(item => {
          const crew = crews.find(c => c.id === item.crew_id)
          return (
            <Card key={item.id} className={item.status === 'Out of Service' ? 'border-amber-700/50' : ''}>
              {item.photo_url ? (
                <div className="w-full h-40 mb-4 rounded-lg overflow-hidden bg-zinc-800"><img src={item.photo_url} alt={item.description} className="w-full h-full object-cover" /></div>
              ) : (
                <div className="w-full h-40 mb-4 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-600"><Icons.Camera /><span className="ml-2">No photo</span></div>
              )}
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div><h3 className="font-semibold text-zinc-100">{item.description}</h3><p className="text-sm text-zinc-500">{item.type}</p></div>
                  <Badge variant={item.status === 'In Service' ? 'success' : 'warning'}>{item.status}</Badge>
                </div>
                <div className="text-sm text-zinc-400 space-y-1">
                  <p>Equipment #: <span className="text-zinc-300">{item.equipment_number}</span></p>
                  {!isForeman && crew && <p>Crew: <span className="text-zinc-300">{crew.name}</span></p>}
                </div>
                {item.notes && <p className="text-sm text-amber-400 bg-amber-900/20 rounded px-2 py-1">{item.notes}</p>}
                <div className="flex gap-2 pt-2">
                  <Button variant="secondary" size="sm" onClick={() => setEditingEquipment(item)} className="flex-1"><span className="flex items-center justify-center gap-1"><Icons.Edit /> Edit</span></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(item)}><Icons.Trash /></Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {filteredEquipment.length === 0 && (
        <Card className="text-center py-12">
          <Icons.Truck />
          <p className="text-zinc-400 mt-4">No equipment tracked</p>
          <Button onClick={() => setShowAddModal(true)} className="mt-4">Add Equipment</Button>
        </Card>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-100">Add Equipment</h2>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-200"><Icons.X /></button>
            </div>
            <div className="space-y-4">
              {(isSupervisor || isAdmin) && (
                <Select
                  label="Assign to Crew"
                  value={newEquipment.crew_id}
                  onChange={(e) => setNewEquipment({ ...newEquipment, crew_id: e.target.value })}
                  options={[
                    { value: '', label: 'Select a crew...' },
                    ...(isSupervisor ? supervisorCrews : crews).map(c => ({ value: c.id, label: c.name }))
                  ]}
                />
              )}
              <Select label="Type" value={newEquipment.type} onChange={(e) => setNewEquipment({ ...newEquipment, type: e.target.value })} options={equipmentTypes.map(t => ({ value: t, label: t }))} />
              <Input label="Description" value={newEquipment.description} onChange={(e) => setNewEquipment({ ...newEquipment, description: e.target.value })} placeholder="e.g., 2022 Ford F-350" />
              <Input label="Equipment Number" value={newEquipment.equipment_number} onChange={(e) => setNewEquipment({ ...newEquipment, equipment_number: e.target.value })} />
              <Input label="Serial Number" value={newEquipment.serial_number} onChange={(e) => setNewEquipment({ ...newEquipment, serial_number: e.target.value })} />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-zinc-400 font-medium">Photo</label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-700 border-dashed rounded-lg cursor-pointer hover:border-amber-500 bg-zinc-800/50">
                  {newEquipment.photo_url ? <img src={newEquipment.photo_url} className="h-full object-contain rounded" /> : <div className="flex flex-col items-center text-zinc-500"><Icons.Camera /><span className="text-sm mt-2">Tap to upload</span></div>}
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>
              <Textarea label="Notes" value={newEquipment.notes} onChange={(e) => setNewEquipment({ ...newEquipment, notes: e.target.value })} />
              <div className="flex gap-3 pt-4">
                <Button variant="secondary" onClick={() => setShowAddModal(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleAdd} loading={loading} className="flex-1" disabled={!newEquipment.description || !newEquipment.equipment_number || (isSupervisor && !newEquipment.crew_id)}>Add</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {editingEquipment && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-100">Edit Equipment</h2>
              <button onClick={() => setEditingEquipment(null)} className="text-zinc-400 hover:text-zinc-200"><Icons.X /></button>
            </div>
            <div className="space-y-4">
              {(isSupervisor || isAdmin) && (
                <Select
                  label="Assigned Crew"
                  value={editingEquipment.crew_id || ''}
                  onChange={(e) => setEditingEquipment({ ...editingEquipment, crew_id: e.target.value })}
                  options={[
                    { value: '', label: 'Unassigned' },
                    ...(isSupervisor ? supervisorCrews : crews).map(c => ({ value: c.id, label: c.name }))
                  ]}
                />
              )}
              <Select label="Type" value={editingEquipment.type} onChange={(e) => setEditingEquipment({ ...editingEquipment, type: e.target.value })} options={equipmentTypes.map(t => ({ value: t, label: t }))} />
              <Input label="Description" value={editingEquipment.description} onChange={(e) => setEditingEquipment({ ...editingEquipment, description: e.target.value })} />
              <Input label="Equipment Number" value={editingEquipment.equipment_number} onChange={(e) => setEditingEquipment({ ...editingEquipment, equipment_number: e.target.value })} />
              <Input label="Serial Number" value={editingEquipment.serial_number || ''} onChange={(e) => setEditingEquipment({ ...editingEquipment, serial_number: e.target.value })} />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-zinc-400 font-medium">Photo</label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-700 border-dashed rounded-lg cursor-pointer hover:border-amber-500 bg-zinc-800/50">
                  {editingEquipment.photo_url ? <img src={editingEquipment.photo_url} className="h-full object-contain rounded" /> : <div className="flex flex-col items-center text-zinc-500"><Icons.Camera /><span className="text-sm mt-2">Tap to upload</span></div>}
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handlePhotoUpload(e, true)} />
                </label>
              </div>
              <Select label="Status" value={editingEquipment.status} onChange={(e) => setEditingEquipment({ ...editingEquipment, status: e.target.value })} options={[{ value: 'In Service', label: 'In Service' }, { value: 'Out of Service', label: 'Out of Service' }]} />
              <Textarea label="Notes" value={editingEquipment.notes || ''} onChange={(e) => setEditingEquipment({ ...editingEquipment, notes: e.target.value })} />
              <div className="flex gap-3 pt-4">
                <Button variant="secondary" onClick={() => setEditingEquipment(null)} className="flex-1">Cancel</Button>
                <Button onClick={handleUpdate} loading={loading} className="flex-1">Save</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

// =============================================
// LEAK REPORT FORM COMPONENT
// =============================================

const LeakReportForm = ({ formData, updateForm, addDowntimePeriod, updateDowntimePeriod, removeDowntimePeriod, disabled = false }) => (
  <div className="space-y-6">
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-amber-400 border-b border-zinc-800 pb-2">Basic Information</h3>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Date" type="date" value={formData.date} onChange={(e) => updateForm('date', e.target.value)} disabled={disabled} />
        <Input label="Supervisor" value={formData.supervisor} onChange={(e) => updateForm('supervisor', e.target.value)} disabled={disabled} />
        <Input label="Project #" value={formData.project_number} onChange={(e) => updateForm('project_number', e.target.value)} disabled={disabled} />
        <Input label="Leak #" value={formData.leak_number} onChange={(e) => updateForm('leak_number', e.target.value)} disabled={disabled} />
      </div>
      <Input label="Address" value={formData.address} onChange={(e) => updateForm('address', e.target.value)} placeholder="Full address" disabled={disabled} />
    </div>

    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-amber-400 border-b border-zinc-800 pb-2">Job Type</h3>
      <div className="flex flex-wrap gap-2">
        {[{ value: 'regular_leak', label: 'Regular Leak' }, { value: 'grade_1', label: 'Grade 1' }, { value: 'laying_sod_cleanup', label: 'Laying Sod/Cleanup' }].map(type => (
          <button key={type.value} type="button" onClick={() => !disabled && updateForm('job_type', type.value)} disabled={disabled}
            className={`px-4 py-2 rounded-lg font-medium ${formData.job_type === type.value ? 'bg-amber-500 text-zinc-900' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {type.label}
          </button>
        ))}
      </div>
      {(formData.job_type === 'grade_1' || formData.crew_called_off_to_grade_1 || formData.leak_turned_into_grade_1) && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 space-y-3">
          <Toggle label="Crew Called Off to GRADE 1" checked={formData.crew_called_off_to_grade_1} onChange={(v) => updateForm('crew_called_off_to_grade_1', v)} disabled={disabled} />
          {formData.crew_called_off_to_grade_1 && <TimeInput label="Time Called OFF" value={formData.time_called_off_to_grade_1} onChange={(v) => updateForm('time_called_off_to_grade_1', v)} disabled={disabled} />}
          <Toggle label="Leak Turned into GRADE 1" checked={formData.leak_turned_into_grade_1} onChange={(v) => updateForm('leak_turned_into_grade_1', v)} disabled={disabled} />
          {formData.leak_turned_into_grade_1 && <TimeInput label="Time Turned GRADE 1" value={formData.time_leak_turned_grade_1} onChange={(v) => updateForm('time_leak_turned_grade_1', v)} disabled={disabled} />}
        </div>
      )}
    </div>

    {formData.job_type === 'regular_leak' && (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-amber-400 border-b border-zinc-800 pb-2">Regular Leak Details</h3>
        <YesNoToggle label="Leak Located?" value={formData.leak_located} onChange={(v) => updateForm('leak_located', v)} disabled={disabled} />
        <YesNoToggle label="Leak Located before arrival?" value={formData.leak_located_before_arrival} onChange={(v) => updateForm('leak_located_before_arrival', v)} disabled={disabled} />
        {formData.leak_located === false && <YesNoToggle label="Over 25 min to locate?" value={formData.took_over_25_min_to_locate} onChange={(v) => updateForm('took_over_25_min_to_locate', v)} disabled={disabled} />}
        
        <div className="grid grid-cols-2 gap-4 py-3">
          <div>
            <p className="text-sm text-zinc-400 mb-2">Type of Leak</p>
            <div className="flex gap-2">
              {['main', 'service'].map(t => (
                <button key={t} type="button" onClick={() => !disabled && updateForm('leak_type', formData.leak_type === t ? '' : t)} disabled={disabled}
                  className={`px-3 py-1.5 rounded font-medium capitalize ${formData.leak_type === t ? 'bg-amber-500 text-zinc-900' : 'bg-zinc-800 text-zinc-400'} ${disabled ? 'opacity-50' : ''}`}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-zinc-400 mb-2">Pipe Type</p>
            <div className="flex gap-2">
              {['steel', 'poly'].map(t => (
                <button key={t} type="button" onClick={() => !disabled && updateForm('pipe_type', formData.pipe_type === t ? '' : t)} disabled={disabled}
                  className={`px-3 py-1.5 rounded font-medium capitalize ${formData.pipe_type === t ? 'bg-amber-500 text-zinc-900' : 'bg-zinc-800 text-zinc-400'} ${disabled ? 'opacity-50' : ''}`}>{t}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-zinc-400">Type of Replacement</p>
          <CheckboxWithQty label="Short Side" checked={formData.short_side} onCheckChange={(v) => updateForm('short_side', v)} qty={formData.short_side_qty} onQtyChange={(v) => updateForm('short_side_qty', v)} disabled={disabled} />
          <CheckboxWithQty label="Long Side" checked={formData.long_side} onCheckChange={(v) => updateForm('long_side', v)} qty={formData.long_side_qty} onQtyChange={(v) => updateForm('long_side_qty', v)} disabled={disabled} />
          <CheckboxWithQty label="Insert" checked={formData.insert_replacement} onCheckChange={(v) => updateForm('insert_replacement', v)} qty={formData.insert_qty} onQtyChange={(v) => updateForm('insert_qty', v)} disabled={disabled} />
          <CheckboxWithQty label="Retirement" checked={formData.retirement} onCheckChange={(v) => updateForm('retirement', v)} qty={formData.retirement_qty} onQtyChange={(v) => updateForm('retirement_qty', v)} disabled={disabled} />
        </div>

        <YesNoToggle label="Section out main?" value={formData.section_out_main} onChange={(v) => updateForm('section_out_main', v)} disabled={disabled} />
        <YesNoToggle label="Excessive Haul Off?" value={formData.excessive_haul_off} onChange={(v) => updateForm('excessive_haul_off', v)} disabled={disabled} />
        <YesNoToggle label="Excessive restoration?" value={formData.excessive_restoration} onChange={(v) => updateForm('excessive_restoration', v)} disabled={disabled} />
        <YesNoToggle label="Downtown extensive paving?" value={formData.downtown_extensive_paving} onChange={(v) => updateForm('downtown_extensive_paving', v)} disabled={disabled} />
        <YesNoToggle label="Increased Traffic control?" value={formData.increased_traffic_control} onChange={(v) => updateForm('increased_traffic_control', v)} disabled={disabled} />
        <YesNoToggle label="Rock in Bellhole?" value={formData.rock_in_bellhole} onChange={(v) => updateForm('rock_in_bellhole', v)} disabled={disabled} />
        <YesNoToggle label="Street Plates Used?" value={formData.street_plates_used} onChange={(v) => updateForm('street_plates_used', v)} disabled={disabled} />
        <YesNoToggle label="Vac Truck Used?" value={formData.vac_truck_used} onChange={(v) => updateForm('vac_truck_used', v)} disabled={disabled} />
      </div>
    )}

    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-amber-400 border-b border-zinc-800 pb-2">Downtime Due to Atmos</h3>
      {(formData.downtime_periods || []).map((period, index) => (
        <div key={index} className="flex items-center gap-3 bg-zinc-800/50 p-3 rounded-lg">
          <TimeInput label="Start" value={period.start} onChange={(v) => updateDowntimePeriod(index, 'start', v)} disabled={disabled} />
          <TimeInput label="End" value={period.end} onChange={(v) => updateDowntimePeriod(index, 'end', v)} disabled={disabled} />
          {!disabled && <button type="button" onClick={() => removeDowntimePeriod(index)} className="p-2 text-red-400 hover:bg-zinc-700 rounded mt-6"><Icons.Trash /></button>}
        </div>
      ))}
      {!disabled && <Button variant="secondary" size="sm" onClick={addDowntimePeriod}><span className="flex items-center gap-2"><Icons.Plus /> Add Downtime</span></Button>}
    </div>

    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-amber-400 border-b border-zinc-800 pb-2">Adders Used</h3>
      <CheckboxWithQty label="NoBlowKit" checked={formData.no_blow_kit} onCheckChange={(v) => updateForm('no_blow_kit', v)} qty={formData.no_blow_kit_qty} onQtyChange={(v) => updateForm('no_blow_kit_qty', v)} disabled={disabled} />
      <CheckboxWithQty label='2"-4" Short Stop' checked={formData.short_stop_2_4} onCheckChange={(v) => updateForm('short_stop_2_4', v)} qty={formData.short_stop_2_4_qty} onQtyChange={(v) => updateForm('short_stop_2_4_qty', v)} disabled={disabled} />
      <CheckboxWithQty label='6"+ Short Stop' checked={formData.short_stop_6_plus} onCheckChange={(v) => updateForm('short_stop_6_plus', v)} qty={formData.short_stop_6_plus_qty} onQtyChange={(v) => updateForm('short_stop_6_plus_qty', v)} disabled={disabled} />
    </div>

    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-amber-400 border-b border-zinc-800 pb-2">Welder</h3>
      <YesNoToggle label="Welder Used?" value={formData.welder_used} onChange={(v) => updateForm('welder_used', v)} disabled={disabled} />
      {formData.welder_used && (
        <div className="flex gap-2">
          {['bobcat', 'subbed_out'].map(t => (
            <button key={t} type="button" onClick={() => !disabled && updateForm('welder_type', t)} disabled={disabled}
              className={`px-3 py-1.5 rounded font-medium ${formData.welder_type === t ? 'bg-amber-500 text-zinc-900' : 'bg-zinc-800 text-zinc-400'} ${disabled ? 'opacity-50' : ''}`}>
              {t === 'bobcat' ? 'Bobcat' : 'Subbed Out'}
            </button>
          ))}
        </div>
      )}
    </div>

    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-amber-400 border-b border-zinc-800 pb-2">Bore</h3>
      <YesNoToggle label="Bore Used?" value={formData.bore_used} onChange={(v) => updateForm('bore_used', v)} disabled={disabled} />
      {formData.bore_used && (
        <>
          <div className="flex gap-2">
            {['bobcat', 'subbed_out'].map(t => (
              <button key={t} type="button" onClick={() => !disabled && updateForm('bore_type', t)} disabled={disabled}
                className={`px-3 py-1.5 rounded font-medium ${formData.bore_type === t ? 'bg-amber-500 text-zinc-900' : 'bg-zinc-800 text-zinc-400'} ${disabled ? 'opacity-50' : ''}`}>
                {t === 'bobcat' ? 'Bobcat' : 'Subbed Out'}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <p className="text-sm text-zinc-400 self-center">Soil:</p>
            {['dirt', 'rock'].map(t => (
              <button key={t} type="button" onClick={() => !disabled && updateForm('soil_type', t)} disabled={disabled}
                className={`px-3 py-1.5 rounded font-medium capitalize ${formData.soil_type === t ? 'bg-amber-500 text-zinc-900' : 'bg-zinc-800 text-zinc-400'} ${disabled ? 'opacity-50' : ''}`}>{t}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Bore Size (in)" type="number" value={formData.bore_size_inches} onChange={(e) => updateForm('bore_size_inches', e.target.value)} disabled={disabled} />
            <Input label="Bore Footage (ft)" type="number" value={formData.bore_footage} onChange={(e) => updateForm('bore_footage', e.target.value)} disabled={disabled} />
          </div>
        </>
      )}
    </div>

    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-amber-400 border-b border-zinc-800 pb-2">Crew Times</h3>
      <div className="grid grid-cols-2 gap-4">
        <TimeInput label="Start Time" value={formData.crew_start_time} onChange={(v) => updateForm('crew_start_time', v)} disabled={disabled} />
        <TimeInput label="End Time" value={formData.crew_end_time} onChange={(v) => updateForm('crew_end_time', v)} disabled={disabled} />
      </div>
    </div>

    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-amber-400 border-b border-zinc-800 pb-2">Completion</h3>
      <YesNoToggle label="Leak Repair Completed?" value={formData.leak_repair_completed} onChange={(v) => updateForm('leak_repair_completed', v)} disabled={disabled} />
    </div>

    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-amber-400 border-b border-zinc-800 pb-2">FCC Information</h3>
      <Input label="FCC Name" value={formData.fcc_name} onChange={(e) => updateForm('fcc_name', e.target.value)} disabled={disabled} />
      <Input label="FCC Signature" value={formData.fcc_signature} onChange={(e) => updateForm('fcc_signature', e.target.value)} placeholder="Type name" disabled={disabled} />
    </div>

    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-amber-400 border-b border-zinc-800 pb-2">Notes</h3>
      <Textarea value={formData.notes} onChange={(e) => updateForm('notes', e.target.value)} placeholder="Additional notes..." rows={4} disabled={disabled} />
    </div>
  </div>
)

// =============================================
// FOREMAN LEAK REPORTS VIEW
// =============================================

const ForemanLeakReportsView = ({ leakReports, crews, profile, onRefresh, logActivity }) => {
  const [showAddModal, setShowAddModal] = useState(false)
  const [viewingReport, setViewingReport] = useState(null)
  const [loading, setLoading] = useState(false)
  
  const initialFormState = {
    date: new Date().toISOString().split('T')[0], supervisor: '', project_number: '', leak_number: '', address: '', job_type: 'regular_leak',
    crew_called_off_to_grade_1: false, time_called_off_to_grade_1: '', leak_turned_into_grade_1: false, time_leak_turned_grade_1: '',
    leak_located: null, leak_located_before_arrival: null, took_over_25_min_to_locate: null, section_out_main: null, excessive_haul_off: null,
    excessive_restoration: null, downtown_extensive_paving: null, increased_traffic_control: null, rock_in_bellhole: null, street_plates_used: null,
    vac_truck_used: null, leak_type: '', pipe_type: '', short_side: false, short_side_qty: null, long_side: false, long_side_qty: null,
    insert_replacement: false, insert_qty: null, retirement: false, retirement_qty: null, downtime_periods: [], no_blow_kit: false, no_blow_kit_qty: null,
    short_stop_2_4: false, short_stop_2_4_qty: null, short_stop_6_plus: false, short_stop_6_plus_qty: null, welder_used: null, welder_type: '',
    bore_used: null, bore_type: '', soil_type: '', bore_size_inches: '', bore_footage: '', crew_start_time: '', crew_end_time: '',
    leak_repair_completed: null, fcc_name: '', fcc_signature: '', notes: ''
  }
  
  const [formData, setFormData] = useState(initialFormState)

  const userCrew = crews.find(c => c.foreman_user_id === profile.id)
  const filteredReports = leakReports.filter(r => r.crew_id === userCrew?.id)

  const updateForm = (field, value) => setFormData(prev => ({ ...prev, [field]: value }))
  const addDowntimePeriod = () => setFormData(prev => ({ ...prev, downtime_periods: [...prev.downtime_periods, { start: '', end: '' }] }))
  const updateDowntimePeriod = (index, field, value) => setFormData(prev => ({ ...prev, downtime_periods: prev.downtime_periods.map((p, i) => i === index ? { ...p, [field]: value } : p) }))
  const removeDowntimePeriod = (index) => setFormData(prev => ({ ...prev, downtime_periods: prev.downtime_periods.filter((_, i) => i !== index) }))

  const handleSubmit = async () => {
    setLoading(true)
    const submitData = {
      crew_id: userCrew?.id, submitted_by: profile.id, status: 'submitted', date: formData.date,
      supervisor: formData.supervisor || null, project_number: formData.project_number || null, leak_number: formData.leak_number || null,
      address: formData.address || null, job_type: formData.job_type, crew_called_off_to_grade_1: formData.crew_called_off_to_grade_1,
      time_called_off_to_grade_1: formData.time_called_off_to_grade_1 || null, leak_turned_into_grade_1: formData.leak_turned_into_grade_1,
      time_leak_turned_grade_1: formData.time_leak_turned_grade_1 || null, leak_located: formData.leak_located,
      leak_located_before_arrival: formData.leak_located_before_arrival, took_over_25_min_to_locate: formData.took_over_25_min_to_locate,
      section_out_main: formData.section_out_main, excessive_haul_off: formData.excessive_haul_off, excessive_restoration: formData.excessive_restoration,
      downtown_extensive_paving: formData.downtown_extensive_paving, increased_traffic_control: formData.increased_traffic_control,
      rock_in_bellhole: formData.rock_in_bellhole, street_plates_used: formData.street_plates_used, vac_truck_used: formData.vac_truck_used,
      leak_type: formData.leak_type || null, pipe_type: formData.pipe_type || null, short_side: formData.short_side,
      short_side_qty: formData.short_side_qty || null, long_side: formData.long_side, long_side_qty: formData.long_side_qty || null,
      insert_replacement: formData.insert_replacement, insert_qty: formData.insert_qty || null, retirement: formData.retirement,
      retirement_qty: formData.retirement_qty || null, downtime_periods: JSON.stringify(formData.downtime_periods || []),
      no_blow_kit: formData.no_blow_kit, no_blow_kit_qty: formData.no_blow_kit_qty || null, short_stop_2_4: formData.short_stop_2_4,
      short_stop_2_4_qty: formData.short_stop_2_4_qty || null, short_stop_6_plus: formData.short_stop_6_plus,
      short_stop_6_plus_qty: formData.short_stop_6_plus_qty || null, welder_used: formData.welder_used,
      welder_type: formData.welder_type || null, bore_used: formData.bore_used, bore_type: formData.bore_type || null,
      soil_type: formData.soil_type || null, bore_size_inches: formData.bore_size_inches ? parseFloat(formData.bore_size_inches) : null,
      bore_footage: formData.bore_footage ? parseFloat(formData.bore_footage) : null, crew_start_time: formData.crew_start_time || null,
      crew_end_time: formData.crew_end_time || null, leak_repair_completed: formData.leak_repair_completed,
      fcc_name: formData.fcc_name || null, fcc_signature: formData.fcc_signature || null, notes: formData.notes || null,
    }
    const { data, error } = await supabase.from('leak_reports').insert([submitData]).select()
    if (!error) {
      if (logActivity && data?.[0]) {
        await logActivity('submitted', 'leak_report', data[0].id, `Leak #${formData.leak_number || 'N/A'}`)
      }
      setFormData(initialFormState); setShowAddModal(false); onRefresh()
    }
    else alert('Error: ' + error.message)
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-zinc-100">Leak Reports</h1><p className="text-zinc-500">{filteredReports.length} reports</p></div>
        <Button onClick={() => setShowAddModal(true)}><span className="flex items-center gap-2"><Icons.Plus /> New Report</span></Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Leak #</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Address</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Status</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map(report => (
                <tr key={report.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                  <td className="py-3 px-4 text-zinc-200">{report.date}</td>
                  <td className="py-3 px-4 text-zinc-200 font-medium">{report.leak_number || '-'}</td>
                  <td className="py-3 px-4 text-zinc-400">{report.address || '-'}</td>
                  <td className="py-3 px-4"><Badge variant={report.status === 'reviewed' ? 'success' : 'warning'}>{report.status === 'reviewed' ? 'Reviewed' : 'Pending'}</Badge></td>
                  <td className="py-3 px-4 text-right"><Button variant="ghost" size="sm" onClick={() => setViewingReport(report)}><span className="flex items-center gap-1"><Icons.Eye /> View</span></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredReports.length === 0 && <p className="text-zinc-500 text-center py-8">No reports</p>}
        </div>
      </Card>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-zinc-900 py-2 -mt-2">
              <h2 className="text-xl font-bold text-zinc-100">New Leak Report</h2>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-200"><Icons.X /></button>
            </div>
            <LeakReportForm formData={formData} updateForm={updateForm} addDowntimePeriod={addDowntimePeriod} updateDowntimePeriod={updateDowntimePeriod} removeDowntimePeriod={removeDowntimePeriod} />
            <div className="flex gap-3 pt-4 border-t border-zinc-800 sticky bottom-0 bg-zinc-900 py-4 -mb-5">
              <Button variant="secondary" onClick={() => setShowAddModal(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSubmit} loading={loading} className="flex-1">Submit Report</Button>
            </div>
          </Card>
        </div>
      )}

      {viewingReport && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-100">Report Details</h2>
              <button onClick={() => setViewingReport(null)} className="text-zinc-400 hover:text-zinc-200"><Icons.X /></button>
            </div>
            <div className="space-y-4">
              <div className="flex gap-2 mb-4">
                <Badge variant={viewingReport.status === 'reviewed' ? 'success' : 'warning'}>{viewingReport.status === 'reviewed' ? 'Reviewed' : 'Pending'}</Badge>
                {viewingReport.rate_type && <Badge variant={viewingReport.rate_type === 'all_hourly' ? 'info' : viewingReport.rate_type === 'unit_rates' ? 'purple' : 'default'}>{viewingReport.rate_type === 'all_hourly' ? 'Hourly' : viewingReport.rate_type === 'unit_rates' ? 'Unit' : 'Both'}</Badge>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-zinc-500">Date</p><p className="text-zinc-200">{viewingReport.date}</p></div>
                <div><p className="text-sm text-zinc-500">Leak #</p><p className="text-zinc-200">{viewingReport.leak_number || '-'}</p></div>
                <div><p className="text-sm text-zinc-500">Project #</p><p className="text-zinc-200">{viewingReport.project_number || '-'}</p></div>
                <div><p className="text-sm text-zinc-500">Supervisor</p><p className="text-zinc-200">{viewingReport.supervisor || '-'}</p></div>
              </div>
              <div><p className="text-sm text-zinc-500">Address</p><p className="text-zinc-200">{viewingReport.address || '-'}</p></div>
              {viewingReport.notes && <div><p className="text-sm text-zinc-500">Notes</p><p className="text-zinc-300 bg-zinc-800/50 rounded-lg p-3">{viewingReport.notes}</p></div>}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

// =============================================
// SUPERVISOR REVIEW VIEW
// =============================================

const SupervisorReviewView = ({ leakReports, crews, profile, onRefresh, logActivity }) => {
  const [activeTab, setActiveTab] = useState('pending')
  const [reviewingReport, setReviewingReport] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState(null)
  const [classification, setClassification] = useState('')
  const [classificationNotes, setClassificationNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const supervisorCrews = crews.filter(c => c.supervisor_id === profile.id)
  const supervisorReports = leakReports.filter(r => supervisorCrews.some(c => c.id === r.crew_id))
  const pendingReports = supervisorReports.filter(r => r.status === 'submitted')
  const reviewedReports = supervisorReports.filter(r => r.status === 'reviewed')
  const displayReports = activeTab === 'pending' ? pendingReports : reviewedReports

  const openReview = (report) => {
    const parsed = { ...report, downtime_periods: typeof report.downtime_periods === 'string' ? JSON.parse(report.downtime_periods || '[]') : (report.downtime_periods || []) }
    setReviewingReport(report)
    setFormData(parsed)
    setClassification(report.rate_type || '')
    setClassificationNotes(report.rate_type_notes || '')
    setEditMode(false)
  }

  const updateForm = (field, value) => setFormData(prev => ({ ...prev, [field]: value }))
  const addDowntimePeriod = () => setFormData(prev => ({ ...prev, downtime_periods: [...(prev.downtime_periods || []), { start: '', end: '' }] }))
  const updateDowntimePeriod = (index, field, value) => setFormData(prev => ({ ...prev, downtime_periods: (prev.downtime_periods || []).map((p, i) => i === index ? { ...p, [field]: value } : p) }))
  const removeDowntimePeriod = (index) => setFormData(prev => ({ ...prev, downtime_periods: (prev.downtime_periods || []).filter((_, i) => i !== index) }))

  const handleSubmitReview = async () => {
    if (!classification) { alert('Select a classification'); return }
    if (classification === 'both' && !classificationNotes.trim()) { alert('Explain why Both'); return }
    setLoading(true)
    const updateData = {
      ...formData, downtime_periods: JSON.stringify(formData.downtime_periods || []),
      bore_size_inches: formData.bore_size_inches ? parseFloat(formData.bore_size_inches) : null,
      bore_footage: formData.bore_footage ? parseFloat(formData.bore_footage) : null,
      leak_type: formData.leak_type || null, pipe_type: formData.pipe_type || null,
      welder_type: formData.welder_type || null, bore_type: formData.bore_type || null, soil_type: formData.soil_type || null,
      crew_start_time: formData.crew_start_time || null, crew_end_time: formData.crew_end_time || null,
      time_called_off_to_grade_1: formData.time_called_off_to_grade_1 || null, time_leak_turned_grade_1: formData.time_leak_turned_grade_1 || null,
      rate_type: classification, rate_type_notes: classification === 'both' ? classificationNotes : null,
      status: 'reviewed', reviewed_by: profile.id, reviewed_at: new Date().toISOString(),
    }
    const { error } = await supabase.from('leak_reports').update(updateData).eq('id', reviewingReport.id)
    if (!error) {
      if (logActivity) {
        await logActivity('reviewed', 'leak_report', reviewingReport.id, `Leak #${reviewingReport.leak_number || 'N/A'}`)
      }
      setReviewingReport(null); setFormData(null); onRefresh()
    }
    else alert('Error: ' + error.message)
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-zinc-100">Review Reports</h1><p className="text-zinc-500">Review leak reports from your foremen</p></div>

      <div className="flex gap-2">
        <TabButton active={activeTab === 'pending'} onClick={() => setActiveTab('pending')} count={pendingReports.length}>Pending</TabButton>
        <TabButton active={activeTab === 'reviewed'} onClick={() => setActiveTab('reviewed')} count={reviewedReports.length}>Reviewed</TabButton>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Crew</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Leak #</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Address</th>
                {activeTab === 'reviewed' && <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Classification</th>}
                <th className="text-right py-3 px-4 text-sm font-medium text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayReports.map(report => {
                const crew = crews.find(c => c.id === report.crew_id)
                return (
                  <tr key={report.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="py-3 px-4 text-zinc-200">{report.date}</td>
                    <td className="py-3 px-4 text-zinc-400">{crew?.name || '-'}</td>
                    <td className="py-3 px-4 text-zinc-200 font-medium">{report.leak_number || '-'}</td>
                    <td className="py-3 px-4 text-zinc-400">{report.address || '-'}</td>
                    {activeTab === 'reviewed' && (
                      <td className="py-3 px-4"><Badge variant={report.rate_type === 'all_hourly' ? 'info' : report.rate_type === 'unit_rates' ? 'purple' : 'default'}>{report.rate_type === 'all_hourly' ? 'Hourly' : report.rate_type === 'unit_rates' ? 'Unit' : 'Both'}</Badge></td>
                    )}
                    <td className="py-3 px-4 text-right">
                      <Button variant={activeTab === 'pending' ? 'primary' : 'ghost'} size="sm" onClick={() => openReview(report)}>
                        <span className="flex items-center gap-1">{activeTab === 'pending' ? <><Icons.Edit /> Review</> : <><Icons.Eye /> View</>}</span>
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {displayReports.length === 0 && <p className="text-zinc-500 text-center py-8">{activeTab === 'pending' ? 'No pending' : 'No reviewed'}</p>}
        </div>
      </Card>

      {reviewingReport && formData && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-zinc-900 py-2 -mt-2 z-10">
              <div>
                <h2 className="text-xl font-bold text-zinc-100">Review Report</h2>
                <p className="text-sm text-zinc-500">{crews.find(c => c.id === reviewingReport.crew_id)?.name} • {reviewingReport.date}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setEditMode(!editMode)}>{editMode ? 'View Only' : 'Edit'}</Button>
                <button onClick={() => { setReviewingReport(null); setFormData(null) }} className="text-zinc-400 hover:text-zinc-200"><Icons.X /></button>
              </div>
            </div>

            <LeakReportForm formData={formData} updateForm={updateForm} addDowntimePeriod={addDowntimePeriod} updateDowntimePeriod={updateDowntimePeriod} removeDowntimePeriod={removeDowntimePeriod} disabled={!editMode} />

            <div className="space-y-4 mt-6 pt-6 border-t-2 border-amber-500/50">
              <h3 className="text-lg font-semibold text-amber-400">Supervisor Classification</h3>
              <p className="text-sm text-zinc-400">Select billing type:</p>
              <div className="flex flex-wrap gap-2">
                {[{ value: 'all_hourly', label: 'Hourly' }, { value: 'unit_rates', label: 'Unit' }, { value: 'both', label: 'Both' }].map(opt => (
                  <button key={opt.value} onClick={() => editMode && setClassification(opt.value)} disabled={!editMode}
                    className={`px-6 py-3 rounded-lg font-medium ${classification === opt.value
                      ? opt.value === 'all_hourly' ? 'bg-sky-500 text-white' : opt.value === 'unit_rates' ? 'bg-purple-500 text-white' : 'bg-amber-500 text-zinc-900'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'} ${!editMode ? 'opacity-50 cursor-not-allowed' : ''}`}>{opt.label}</button>
                ))}
              </div>
              {classification === 'both' && <Textarea label="Explain why both (required)" value={classificationNotes} onChange={(e) => setClassificationNotes(e.target.value)} rows={3} disabled={!editMode} />}
            </div>

            {reviewingReport.status === 'reviewed' && !editMode && (
              <div className="mt-4 p-4 bg-emerald-900/20 border border-emerald-800 rounded-lg">
                <p className="text-emerald-400 font-medium">✓ Reviewed</p>
                <p className="text-sm text-zinc-400">{new Date(reviewingReport.reviewed_at).toLocaleDateString()}</p>
              </div>
            )}

            {(reviewingReport.status === 'submitted' || editMode) && (
              <div className="flex gap-3 pt-4 border-t border-zinc-800 sticky bottom-0 bg-zinc-900 py-4 -mb-5">
                <Button variant="secondary" onClick={() => { setReviewingReport(null); setFormData(null) }} className="flex-1">Cancel</Button>
                <Button variant="success" onClick={handleSubmitReview} loading={loading} className="flex-1"><span className="flex items-center gap-2"><Icons.Check /> {reviewingReport.status === 'reviewed' ? 'Save Changes' : 'Submit Review'}</span></Button>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}

// =============================================
// PDF GENERATION HELPERS
// =============================================

// Cache for the PDF template
let pdfTemplateCache = null

const loadPdfTemplate = async () => {
  if (pdfTemplateCache) return pdfTemplateCache
  const response = await fetch('/LeakReportTemplate.pdf')
  const arrayBuffer = await response.arrayBuffer()
  pdfTemplateCache = arrayBuffer
  return arrayBuffer
}

const generateLeakReportPDF = async (report, crew, supervisorProfile, foremanEmployee) => {
  // Load the template
  const templateBytes = await loadPdfTemplate()
  const pdfDoc = await PDFDocument.load(templateBytes)
  const form = pdfDoc.getForm()

  // Helper to safely set text field
  const setText = (fieldName, value) => {
    try {
      const field = form.getTextField(fieldName)
      field.setText(value || '')
    } catch (e) { /* Field doesn't exist */ }
  }

  // Helper to safely set checkbox
  const setCheck = (fieldName, checked) => {
    try {
      const field = form.getCheckBox(fieldName)
      if (checked) field.check()
      else field.uncheck()
    } catch (e) { /* Field doesn't exist */ }
  }

  // Parse downtime periods
  const downtimePeriods = typeof report.downtime_periods === 'string'
    ? JSON.parse(report.downtime_periods || '[]')
    : (report.downtime_periods || [])

  // ============================================
  // FILL TEXT FIELDS
  // ============================================

  setText('date', report.date || '')
  setText('foreman', foremanEmployee?.name || report.supervisor || '')
  setText('supervisor', supervisorProfile?.name || '')
  setText('project_number', report.project_number || '')
  setText('leak_number', report.leak_number || '')
  setText('address', report.address || '')

  // Grade 1 times
  setText('time_called_off_to_grade_1', report.time_called_off_to_grade_1 || '')
  setText('time_leak_turned_grade_1', report.time_leak_turned_grade_1 || '')

  // Replacement quantities
  setText('short_side_qty', report.short_side_qty?.toString() || '')
  setText('long_side_qty', report.long_side_qty?.toString() || '')
  setText('insert_qty', report.insert_qty?.toString() || '')
  setText('retirement_qty', report.retirement_qty?.toString() || '')

  // Downtime periods
  if (downtimePeriods[0]) {
    setText('downtime_1_start', downtimePeriods[0].start || '')
    setText('downtime_1_end', downtimePeriods[0].end || '')
  }
  if (downtimePeriods[1]) {
    setText('downtime_2_start', downtimePeriods[1].start || '')
    setText('downtime_2_end', downtimePeriods[1].end || '')
  }
  if (downtimePeriods[2]) {
    setText('downtime_3_start', downtimePeriods[2].start || '')
    setText('downtime_3_end', downtimePeriods[2].end || '')
  }

  // Adder quantities
  setText('no_blow_kit_qty', report.no_blow_kit_qty?.toString() || '')
  setText('short_stop_2_4_qty', report.short_stop_2_4_qty?.toString() || '')
  setText('short_stop_6_plus_qty', report.short_stop_6_plus_qty?.toString() || '')

  // Bore details
  setText('bore_size_inches', report.bore_size_inches?.toString() || '')
  setText('bore_footage', report.bore_footage?.toString() || '')

  // Crew times
  setText('crew_start_time', report.crew_start_time || '')
  setText('crew_end_time', report.crew_end_time || '')

  // FCC and Notes
  setText('fcc_name', foremanEmployee?.name || '')
  const notesText = [report.notes, report.rate_type === 'both' && report.rate_type_notes ? `Classification: ${report.rate_type_notes}` : ''].filter(Boolean).join(' | ')
  setText('notes', notesText)

  // ============================================
  // FILL CHECKBOXES
  // ============================================

  // Job Type
  setCheck('job_type_regular_leak', report.job_type === 'regular_leak')
  setCheck('job_type_grade_1', report.job_type === 'grade_1')
  setCheck('job_type_laying_sod', report.job_type === 'laying_sod_cleanup')

  // Grade 1 checkboxes
  setCheck('crew_called_off_to_grade_1', report.crew_called_off_to_grade_1)
  setCheck('leak_turned_into_grade_1', report.leak_turned_into_grade_1)

  // Classification (Superintendent)
  setCheck('rate_type_all_hourly', report.rate_type === 'all_hourly')
  setCheck('rate_type_unit_rates', report.rate_type === 'unit_rates')
  setCheck('rate_type_both', report.rate_type === 'both')

  // Leak Located
  setCheck('leak_located_yes', report.leak_located === true)
  setCheck('leak_located_no', report.leak_located === false)

  // Leak located before arrival
  setCheck('leak_located_before_arrival_yes', report.leak_located_before_arrival === true)
  setCheck('leak_located_before_arrival_no', report.leak_located_before_arrival === false)

  // Over 25 min
  setCheck('over_25_min_yes', report.took_over_25_min_to_locate === true)
  setCheck('over_25_min_no', report.took_over_25_min_to_locate === false)

  // Type of Leak
  setCheck('leak_type_main', report.leak_type === 'main')
  setCheck('leak_type_service', report.leak_type === 'service')

  // Pipe Type
  setCheck('pipe_type_steel', report.pipe_type === 'steel')
  setCheck('pipe_type_poly', report.pipe_type === 'poly')

  // Replacements
  setCheck('short_side', report.short_side)
  setCheck('long_side', report.long_side)
  setCheck('insert_replacement', report.insert_replacement)
  setCheck('retirement', report.retirement)

  // Yes/No questions
  setCheck('section_out_main_yes', report.section_out_main === true)
  setCheck('section_out_main_no', report.section_out_main === false)
  setCheck('excessive_haul_off_yes', report.excessive_haul_off === true)
  setCheck('excessive_haul_off_no', report.excessive_haul_off === false)
  setCheck('excessive_restoration_yes', report.excessive_restoration === true)
  setCheck('excessive_restoration_no', report.excessive_restoration === false)
  setCheck('downtown_paving_yes', report.downtown_extensive_paving === true)
  setCheck('downtown_paving_no', report.downtown_extensive_paving === false)
  setCheck('traffic_control_yes', report.increased_traffic_control === true)
  setCheck('traffic_control_no', report.increased_traffic_control === false)
  setCheck('rock_in_bellhole_yes', report.rock_in_bellhole === true)
  setCheck('rock_in_bellhole_no', report.rock_in_bellhole === false)
  setCheck('street_plates_yes', report.street_plates_used === true)
  setCheck('street_plates_no', report.street_plates_used === false)
  setCheck('vac_truck_yes', report.vac_truck_used === true)
  setCheck('vac_truck_no', report.vac_truck_used === false)

  // Adders
  setCheck('no_blow_kit', report.no_blow_kit)
  setCheck('short_stop_2_4', report.short_stop_2_4)
  setCheck('short_stop_6_plus', report.short_stop_6_plus)

  // Welder
  setCheck('welder_used_yes', report.welder_used === true)
  setCheck('welder_used_no', report.welder_used === false)
  setCheck('welder_bobcat', report.welder_type === 'bobcat_welder')
  setCheck('welder_subbed', report.welder_type === 'subbed_out_welder')

  // Bore
  setCheck('bore_used_yes', report.bore_used === true)
  setCheck('bore_used_no', report.bore_used === false)
  setCheck('bore_bobcat', report.bore_type === 'bobcat_bore')
  setCheck('bore_subbed', report.bore_type === 'subbed_out_bore')
  setCheck('soil_type_dirt', report.soil_type === 'dirt')
  setCheck('soil_type_rock', report.soil_type === 'rock')

  // Leak repair completed
  setCheck('leak_repair_completed_yes', report.leak_repair_completed === true)
  setCheck('leak_repair_completed_no', report.leak_repair_completed === false)

  // Flatten form to make it non-editable in the output
  form.flatten()

  // Return PDF bytes
  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}

const getInitials = (name) => {
  if (!name) return 'XX'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const exportReportsAsZip = async (reports, crews, profiles, employees) => {
  const zip = new JSZip()

  for (const report of reports) {
    const crew = crews.find(c => c.id === report.crew_id)
    const supervisorProfile = crew?.supervisor_id ? profiles.find(p => p.id === crew.supervisor_id) : null
    const foremanEmployee = crew?.foreman_id ? employees.find(e => e.id === crew.foreman_id) : null

    // Generate PDF using the fillable template
    const pdfBytes = await generateLeakReportPDF(report, crew, supervisorProfile, foremanEmployee)

    // Filename: SupervisorInitials_ForemanName_Date.pdf
    const supInitials = getInitials(supervisorProfile?.name)
    const foremanName = (foremanEmployee?.name || 'Unknown').replace(/\s+/g, '')
    const dateStr = report.date || 'NoDate'
    const filename = `${supInitials}_${foremanName}_${dateStr}.pdf`

    zip.file(filename, pdfBytes)
  }

  const content = await zip.generateAsync({ type: 'blob' })

  // Trigger download
  const url = URL.createObjectURL(content)
  const a = document.createElement('a')
  a.href = url
  a.download = `LeakReports_${new Date().toISOString().split('T')[0]}.zip`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// =============================================
// ADMIN LEAK REPORTS VIEW
// =============================================

const AdminLeakReportsView = ({ leakReports, crews, profiles, onRefresh, employees, logActivity }) => {
  const [activeSupervisor, setActiveSupervisor] = useState('all')
  const [activeWeek, setActiveWeek] = useState('all')
  const [viewingReport, setViewingReport] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState(null)
  const [classification, setClassification] = useState('')
  const [classificationNotes, setClassificationNotes] = useState('')
  const [loading, setLoading] = useState(false)

  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [exportFilters, setExportFilters] = useState({
    startDate: '',
    endDate: '',
    supervisors: [],
    classification: 'all' // all, all_hourly, unit_rates, both
  })

  // Get Monday of a given date's week
  const getWeekMonday = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00')
    const day = date.getDay()
    const diff = day === 0 ? -6 : 1 - day // Adjust so Monday is start of week
    const monday = new Date(date)
    monday.setDate(date.getDate() + diff)
    return monday.toISOString().split('T')[0]
  }

  // Format date for display
  const formatWeekLabel = (mondayStr) => {
    const date = new Date(mondayStr + 'T00:00:00')
    return `Week of ${date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })}`
  }

  // Get supervisor for a report (via crew)
  const getReportSupervisor = (report) => {
    const crew = crews.find(c => c.id === report.crew_id)
    return crew?.supervisor_id || null
  }

  // Get unique supervisors who have reports
  const supervisorsWithReports = [...new Set(leakReports.map(r => getReportSupervisor(r)).filter(Boolean))]
  const supervisorProfiles = supervisorsWithReports.map(id => profiles.find(p => p.id === id)).filter(Boolean)

  // Filter reports by supervisor
  const reportsBySupervisor = activeSupervisor === 'all'
    ? leakReports
    : leakReports.filter(r => getReportSupervisor(r) === activeSupervisor)

  // Get unique weeks for current supervisor's reports, sorted descending
  const weeksInReports = [...new Set(reportsBySupervisor.map(r => r.date ? getWeekMonday(r.date) : null).filter(Boolean))].sort((a, b) => b.localeCompare(a))

  // Filter reports by week
  const displayReports = activeWeek === 'all'
    ? reportsBySupervisor
    : reportsBySupervisor.filter(r => r.date && getWeekMonday(r.date) === activeWeek)

  // Reset week tab when supervisor changes
  const handleSupervisorChange = (supId) => {
    setActiveSupervisor(supId)
    setActiveWeek('all')
  }

  const openReport = (report) => {
    const parsed = { ...report, downtime_periods: typeof report.downtime_periods === 'string' ? JSON.parse(report.downtime_periods || '[]') : (report.downtime_periods || []) }
    setViewingReport(report)
    setFormData(parsed)
    setClassification(report.rate_type || '')
    setClassificationNotes(report.rate_type_notes || '')
    setEditMode(false)
  }

  const closeReport = () => {
    setViewingReport(null)
    setFormData(null)
    setEditMode(false)
  }

  const updateForm = (field, value) => setFormData(prev => ({ ...prev, [field]: value }))
  const addDowntimePeriod = () => setFormData(prev => ({ ...prev, downtime_periods: [...(prev.downtime_periods || []), { start: '', end: '' }] }))
  const updateDowntimePeriod = (index, field, value) => setFormData(prev => ({ ...prev, downtime_periods: (prev.downtime_periods || []).map((p, i) => i === index ? { ...p, [field]: value } : p) }))
  const removeDowntimePeriod = (index) => setFormData(prev => ({ ...prev, downtime_periods: (prev.downtime_periods || []).filter((_, i) => i !== index) }))

  const handleSave = async () => {
    setLoading(true)
    const updateData = {
      ...formData, downtime_periods: JSON.stringify(formData.downtime_periods || []),
      bore_size_inches: formData.bore_size_inches ? parseFloat(formData.bore_size_inches) : null,
      bore_footage: formData.bore_footage ? parseFloat(formData.bore_footage) : null,
      leak_type: formData.leak_type || null, pipe_type: formData.pipe_type || null,
      welder_type: formData.welder_type || null, bore_type: formData.bore_type || null, soil_type: formData.soil_type || null,
      crew_start_time: formData.crew_start_time || null, crew_end_time: formData.crew_end_time || null,
      time_called_off_to_grade_1: formData.time_called_off_to_grade_1 || null, time_leak_turned_grade_1: formData.time_leak_turned_grade_1 || null,
      rate_type: classification || null, rate_type_notes: classification === 'both' ? classificationNotes : null,
    }
    delete updateData.id
    delete updateData.created_at
    const { error } = await supabase.from('leak_reports').update(updateData).eq('id', viewingReport.id)
    if (!error) {
      if (logActivity) {
        await logActivity('edited', 'leak_report', viewingReport.id, `Leak #${viewingReport.leak_number || 'N/A'}`)
      }
      closeReport(); onRefresh()
    }
    else alert('Error: ' + error.message)
    setLoading(false)
  }

  // Export current view
  const handleExportCurrentView = async () => {
    if (displayReports.length === 0) { alert('No reports to export'); return }
    setExportLoading(true)
    try {
      await exportReportsAsZip(displayReports, crews, profiles, employees)
    } catch (err) {
      alert('Export failed: ' + err.message)
    }
    setExportLoading(false)
  }

  // Export with filters
  const handleExportWithFilters = async () => {
    let filtered = [...leakReports]

    // Filter by date range
    if (exportFilters.startDate) {
      filtered = filtered.filter(r => r.date >= exportFilters.startDate)
    }
    if (exportFilters.endDate) {
      filtered = filtered.filter(r => r.date <= exportFilters.endDate)
    }

    // Filter by supervisors
    if (exportFilters.supervisors.length > 0) {
      filtered = filtered.filter(r => {
        const supId = getReportSupervisor(r)
        return exportFilters.supervisors.includes(supId)
      })
    }

    // Filter by classification
    if (exportFilters.classification !== 'all') {
      filtered = filtered.filter(r => r.rate_type === exportFilters.classification)
    }

    if (filtered.length === 0) { alert('No reports match the selected filters'); return }

    setExportLoading(true)
    try {
      await exportReportsAsZip(filtered, crews, profiles, employees)
      setShowExportModal(false)
    } catch (err) {
      alert('Export failed: ' + err.message)
    }
    setExportLoading(false)
  }

  const toggleSupervisorFilter = (supId) => {
    setExportFilters(prev => ({
      ...prev,
      supervisors: prev.supervisors.includes(supId)
        ? prev.supervisors.filter(id => id !== supId)
        : [...prev.supervisors, supId]
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">All Leak Reports</h1>
          <p className="text-zinc-500">{leakReports.length} total</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowExportModal(true)}>
            <span className="flex items-center gap-2"><Icons.Download /> Export with Filters</span>
          </Button>
          {displayReports.length > 0 && (
            <Button variant="primary" onClick={handleExportCurrentView} loading={exportLoading}>
              <span className="flex items-center gap-2"><Icons.Download /> Export Current View ({displayReports.length})</span>
            </Button>
          )}
        </div>
      </div>

      {/* Supervisor Tabs */}
      <div>
        <p className="text-sm text-zinc-500 mb-2">By Supervisor</p>
        <div className="flex flex-wrap gap-2">
          <TabButton active={activeSupervisor === 'all'} onClick={() => handleSupervisorChange('all')} count={leakReports.length}>All</TabButton>
          {supervisorProfiles.map(sup => {
            const count = leakReports.filter(r => getReportSupervisor(r) === sup.id).length
            return <TabButton key={sup.id} active={activeSupervisor === sup.id} onClick={() => handleSupervisorChange(sup.id)} count={count}>{sup.name}</TabButton>
          })}
        </div>
      </div>

      {/* Week Tabs */}
      <div>
        <p className="text-sm text-zinc-500 mb-2">By Week</p>
        <div className="flex flex-wrap gap-2">
          <TabButton active={activeWeek === 'all'} onClick={() => setActiveWeek('all')} count={reportsBySupervisor.length}>All Weeks</TabButton>
          {weeksInReports.map(week => {
            const count = reportsBySupervisor.filter(r => r.date && getWeekMonday(r.date) === week).length
            return <TabButton key={week} active={activeWeek === week} onClick={() => setActiveWeek(week)} count={count}>{formatWeekLabel(week)}</TabButton>
          })}
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Crew</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Leak #</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Address</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Class</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayReports.map(report => {
                const crew = crews.find(c => c.id === report.crew_id)
                return (
                  <tr key={report.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="py-3 px-4 text-zinc-200">{report.date}</td>
                    <td className="py-3 px-4 text-zinc-400">{crew?.name || '-'}</td>
                    <td className="py-3 px-4 text-zinc-200 font-medium">{report.leak_number || '-'}</td>
                    <td className="py-3 px-4 text-zinc-400 max-w-[200px] truncate">{report.address || '-'}</td>
                    <td className="py-3 px-4"><Badge variant={report.status === 'reviewed' ? 'success' : 'warning'}>{report.status === 'reviewed' ? 'Reviewed' : 'Pending'}</Badge></td>
                    <td className="py-3 px-4">{report.rate_type ? <Badge variant={report.rate_type === 'all_hourly' ? 'info' : report.rate_type === 'unit_rates' ? 'purple' : 'default'}>{report.rate_type === 'all_hourly' ? 'Hourly' : report.rate_type === 'unit_rates' ? 'Unit' : 'Both'}</Badge> : '-'}</td>
                    <td className="py-3 px-4 text-right"><Button variant="ghost" size="sm" onClick={() => openReport(report)}><Icons.Eye /></Button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {displayReports.length === 0 && <p className="text-zinc-500 text-center py-8">No reports</p>}
        </div>
      </Card>

      {viewingReport && formData && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-zinc-900 py-2 -mt-2 z-10">
              <div>
                <h2 className="text-xl font-bold text-zinc-100">Report Details</h2>
                <p className="text-sm text-zinc-500">{crews.find(c => c.id === viewingReport.crew_id)?.name} • {viewingReport.date}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setEditMode(!editMode)}>{editMode ? 'View Only' : 'Edit'}</Button>
                <button onClick={closeReport} className="text-zinc-400 hover:text-zinc-200"><Icons.X /></button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant={viewingReport.status === 'reviewed' ? 'success' : 'warning'}>{viewingReport.status === 'reviewed' ? 'Reviewed' : 'Pending'}</Badge>
              {viewingReport.rate_type && <Badge variant={viewingReport.rate_type === 'all_hourly' ? 'info' : viewingReport.rate_type === 'unit_rates' ? 'purple' : 'default'}>{viewingReport.rate_type === 'all_hourly' ? 'Hourly' : viewingReport.rate_type === 'unit_rates' ? 'Unit' : 'Both'}</Badge>}
            </div>

            <LeakReportForm formData={formData} updateForm={updateForm} addDowntimePeriod={addDowntimePeriod} updateDowntimePeriod={updateDowntimePeriod} removeDowntimePeriod={removeDowntimePeriod} disabled={!editMode} />

            <div className="space-y-4 mt-6 pt-6 border-t-2 border-amber-500/50">
              <h3 className="text-lg font-semibold text-amber-400">Classification</h3>
              <div className="flex flex-wrap gap-2">
                {[{ value: 'all_hourly', label: 'Hourly' }, { value: 'unit_rates', label: 'Unit' }, { value: 'both', label: 'Both' }].map(opt => (
                  <button key={opt.value} onClick={() => editMode && setClassification(opt.value)} disabled={!editMode}
                    className={`px-6 py-3 rounded-lg font-medium ${classification === opt.value
                      ? opt.value === 'all_hourly' ? 'bg-sky-500 text-white' : opt.value === 'unit_rates' ? 'bg-purple-500 text-white' : 'bg-amber-500 text-zinc-900'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'} ${!editMode ? 'opacity-50 cursor-not-allowed' : ''}`}>{opt.label}</button>
                ))}
              </div>
              {classification === 'both' && <Textarea label="Explain why both" value={classificationNotes} onChange={(e) => setClassificationNotes(e.target.value)} rows={3} disabled={!editMode} />}
            </div>

            {viewingReport.reviewed_by && (
              <div className="mt-4 p-4 bg-emerald-900/20 border border-emerald-800 rounded-lg">
                <p className="text-emerald-400 font-medium">✓ Reviewed by {profiles.find(p => p.id === viewingReport.reviewed_by)?.name || 'Unknown'}</p>
                <p className="text-sm text-zinc-400">{new Date(viewingReport.reviewed_at).toLocaleDateString()}</p>
              </div>
            )}

            {editMode && (
              <div className="flex gap-3 pt-4 border-t border-zinc-800 sticky bottom-0 bg-zinc-900 py-4 -mb-5 mt-4">
                <Button variant="secondary" onClick={closeReport} className="flex-1">Cancel</Button>
                <Button variant="primary" onClick={handleSave} loading={loading} className="flex-1"><span className="flex items-center gap-2"><Icons.Check /> Save Changes</span></Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Export Filter Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-zinc-100">Export Leak Reports</h2>
                <p className="text-sm text-zinc-500">Select filters for PDF export</p>
              </div>
              <button onClick={() => setShowExportModal(false)} className="text-zinc-400 hover:text-zinc-200"><Icons.X /></button>
            </div>

            <div className="space-y-6">
              {/* Date Range */}
              <div>
                <p className="text-sm text-zinc-400 font-medium mb-2">Date Range</p>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Start Date"
                    type="date"
                    value={exportFilters.startDate}
                    onChange={(e) => setExportFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                  <Input
                    label="End Date"
                    type="date"
                    value={exportFilters.endDate}
                    onChange={(e) => setExportFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>

              {/* Supervisors */}
              <div>
                <p className="text-sm text-zinc-400 font-medium mb-2">Supervisors (leave empty for all)</p>
                <div className="flex flex-wrap gap-2">
                  {supervisorProfiles.map(sup => (
                    <button
                      key={sup.id}
                      onClick={() => toggleSupervisorFilter(sup.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        exportFilters.supervisors.includes(sup.id)
                          ? 'bg-amber-500 text-zinc-900'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      {sup.name}
                    </button>
                  ))}
                </div>
                {supervisorProfiles.length === 0 && <p className="text-zinc-500 text-sm">No supervisors with reports</p>}
              </div>

              {/* Classification */}
              <div>
                <p className="text-sm text-zinc-400 font-medium mb-2">Classification</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'all_hourly', label: 'Hourly' },
                    { value: 'unit_rates', label: 'Unit' },
                    { value: 'both', label: 'Both' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setExportFilters(prev => ({ ...prev, classification: opt.value }))}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        exportFilters.classification === opt.value
                          ? opt.value === 'all_hourly' ? 'bg-sky-500 text-white'
                          : opt.value === 'unit_rates' ? 'bg-purple-500 text-white'
                          : opt.value === 'both' ? 'bg-amber-500 text-zinc-900'
                          : 'bg-amber-500 text-zinc-900'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview count */}
              <div className="bg-zinc-800/50 rounded-lg p-3">
                <p className="text-sm text-zinc-400">
                  Reports matching filters: <span className="text-zinc-100 font-medium">
                    {(() => {
                      let filtered = [...leakReports]
                      if (exportFilters.startDate) filtered = filtered.filter(r => r.date >= exportFilters.startDate)
                      if (exportFilters.endDate) filtered = filtered.filter(r => r.date <= exportFilters.endDate)
                      if (exportFilters.supervisors.length > 0) filtered = filtered.filter(r => exportFilters.supervisors.includes(getReportSupervisor(r)))
                      if (exportFilters.classification !== 'all') filtered = filtered.filter(r => r.rate_type === exportFilters.classification)
                      return filtered.length
                    })()}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-zinc-800">
              <Button variant="secondary" onClick={() => setShowExportModal(false)} className="flex-1">Cancel</Button>
              <Button variant="primary" onClick={handleExportWithFilters} loading={exportLoading} className="flex-1">
                <span className="flex items-center gap-2"><Icons.Download /> Export as ZIP</span>
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

// =============================================
// MAIN APP
// =============================================

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState('dashboard')
  
  const [employees, setEmployees] = useState([])
  const [crews, setCrews] = useState([])
  const [equipment, setEquipment] = useState([])
  const [leakReports, setLeakReports] = useState([])
  const [profiles, setProfiles] = useState([])
  const [activityLogs, setActivityLogs] = useState([])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data)
    if (data) fetchAllData()
    setLoading(false)
  }

  const fetchAllData = async () => {
    const [empRes, crewRes, equipRes, reportRes, profRes, logsRes] = await Promise.all([
      supabase.from('employees').select('*').order('name'),
      supabase.from('crews').select('*, crew_members(*)').order('name'),
      supabase.from('equipment').select('*').order('created_at', { ascending: false }),
      supabase.from('leak_reports').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('name'),
      supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(100),
    ])
    setEmployees(empRes.data || [])
    setCrews(crewRes.data || [])
    setEquipment(equipRes.data || [])
    setLeakReports(reportRes.data || [])
    setProfiles(profRes.data || [])
    setActivityLogs(logsRes.data || [])
  }

  const logActivity = async (action, entityType, entityId, entityName, details = null) => {
    try {
      await supabase.from('activity_logs').insert([{
        user_id: profile?.id,
        user_name: profile?.name || 'Unknown',
        action,
        entity_type: entityType,
        entity_id: entityId,
        entity_name: entityName,
        details
      }])
    } catch (err) {
      console.error('Failed to log activity:', err)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setCurrentView('dashboard')
  }

  if (loading) return <LoadingScreen />
  if (!session) return <LoginScreen />
  if (!profile) return <LoadingScreen />

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard profile={profile} crews={crews} employees={employees} equipment={equipment} leakReports={leakReports} activityLogs={activityLogs} />
      case 'users': return <UsersManagementView profiles={profiles} crews={crews} employees={employees} onRefresh={fetchAllData} logActivity={logActivity} />
      case 'employees': return <EmployeesView employees={employees} crews={crews} onRefresh={fetchAllData} readOnly={profile?.role !== 'admin'} logActivity={logActivity} />
      case 'crews': case 'my-crew': return <CrewsView crews={crews} employees={employees} profiles={profiles} profile={profile} onRefresh={fetchAllData} equipment={equipment} leakReports={leakReports} logActivity={logActivity} />
      case 'equipment': case 'my-equipment': return <EquipmentView equipment={equipment} crews={crews} profile={profile} onRefresh={fetchAllData} logActivity={logActivity} />
      case 'leak-reports': return <AdminLeakReportsView leakReports={leakReports} crews={crews} profiles={profiles} onRefresh={fetchAllData} employees={employees} logActivity={logActivity} />
      case 'my-leak-reports': return <ForemanLeakReportsView leakReports={leakReports} crews={crews} profile={profile} onRefresh={fetchAllData} logActivity={logActivity} />
      case 'review-reports': return <SupervisorReviewView leakReports={leakReports} crews={crews} profile={profile} onRefresh={fetchAllData} logActivity={logActivity} />
      default: return <Dashboard profile={profile} crews={crews} employees={employees} equipment={equipment} leakReports={leakReports} activityLogs={activityLogs} />
    }
  }

  return (
    <AuthContext.Provider value={{ session, profile }}>
      <div className="min-h-screen bg-zinc-950">
        <Navigation currentView={currentView} setCurrentView={setCurrentView} profile={profile} onLogout={handleLogout} />
        <main className="max-w-7xl mx-auto px-4 py-6">{renderView()}</main>
      </div>
    </AuthContext.Provider>
  )
}
