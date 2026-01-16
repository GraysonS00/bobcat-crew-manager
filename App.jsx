import React, { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from './supabaseClient'

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
  }
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  )
}

const Button = ({ children, onClick, variant = 'primary', size = 'md', disabled = false, loading = false, className = '' }) => {
  const variants = {
    primary: 'bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold',
    secondary: 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200',
    danger: 'bg-red-600 hover:bg-red-500 text-white',
    ghost: 'bg-transparent hover:bg-zinc-800 text-zinc-400',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  }
  return (
    <button
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

const Input = ({ label, type = 'text', value, onChange, placeholder, className = '', required = false }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    {label && <label className="text-sm text-zinc-400 font-medium">{label}</label>}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
    />
  </div>
)

const Select = ({ label, value, onChange, options, className = '' }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    {label && <label className="text-sm text-zinc-400 font-medium">{label}</label>}
    <select
      value={value}
      onChange={onChange}
      className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
)

const Textarea = ({ label, value, onChange, placeholder, rows = 3 }) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-sm text-zinc-400 font-medium">{label}</label>}
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all resize-none"
    />
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
}

// =============================================
// LOGIN SCREEN
// =============================================

const LoginScreen = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
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

        <div className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          
          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          
          <Button onClick={handleLogin} loading={loading} className="w-full mt-6">
            Sign In
          </Button>
        </div>
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
      { id: 'employees', label: 'Employees', icon: Icons.Users },
      { id: 'crews', label: 'All Crews', icon: Icons.Users },
      { id: 'equipment', label: 'All Equipment', icon: Icons.Truck },
      { id: 'reports', label: 'All Reports', icon: Icons.Clipboard },
    ],
    supervisor: [
      { id: 'dashboard', label: 'Dashboard', icon: Icons.Home },
      { id: 'crews', label: 'All Crews', icon: Icons.Users },
      { id: 'equipment', label: 'All Equipment', icon: Icons.Truck },
      { id: 'reports', label: 'All Reports', icon: Icons.Clipboard },
    ],
    foreman: [
      { id: 'dashboard', label: 'Dashboard', icon: Icons.Home },
      { id: 'my-crew', label: 'My Crew', icon: Icons.Users },
      { id: 'my-equipment', label: 'Equipment', icon: Icons.Truck },
      { id: 'my-reports', label: 'Job Reports', icon: Icons.Clipboard },
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
            
            <div className="flex gap-1">
              {items.map(item => (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
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
// DASHBOARD
// =============================================

const Dashboard = ({ profile, crews, employees, equipment, reports }) => {
  const isForeman = profile?.role === 'foreman'
  const userCrew = isForeman ? crews.find(c => c.foreman_user_id === profile.id) : null
  
  const filteredEquipment = isForeman && userCrew 
    ? equipment.filter(e => e.crew_id === userCrew.id)
    : equipment
  
  const filteredReports = isForeman && userCrew
    ? reports.filter(r => r.crew_id === userCrew.id)
    : reports

  const activeEmployees = employees.filter(e => e.active).length
  const equipmentInService = filteredEquipment.filter(e => e.status === 'In Service').length
  const outOfServiceCount = filteredEquipment.filter(e => e.status === 'Out of Service').length

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
              <Icons.Clipboard />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-100">{filteredReports.length}</p>
              <p className="text-sm text-zinc-500">Job Reports</p>
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
                Check your equipment list for details.
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
                      <p className="text-sm text-zinc-500">
                        {crew.foreman?.name || 'No foreman'} • {(crew.crew_members?.length || 0) + 1} members
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {outOfService > 0 && (
                        <Badge variant="warning">{outOfService} equipment issue{outOfService > 1 ? 's' : ''}</Badge>
                      )}
                      <Badge variant="success">Active</Badge>
                    </div>
                  </div>
                )
              })}
              {crews.length === 0 && (
                <p className="text-zinc-500 text-center py-4">No crews created yet</p>
              )}
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-zinc-100 mb-4">Recent Reports</h2>
            <div className="space-y-3">
              {reports.slice(-5).reverse().map(report => {
                const crew = crews.find(c => c.id === report.crew_id)
                return (
                  <div key={report.id} className="p-3 bg-zinc-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-zinc-200">{report.job_number}</p>
                      <span className="text-xs text-zinc-500">{report.job_date}</span>
                    </div>
                    <p className="text-sm text-zinc-400">
                      {crew?.name || 'Unknown crew'} • {report.job_report_employees?.length || 0} on site
                    </p>
                  </div>
                )
              })}
              {reports.length === 0 && (
                <p className="text-zinc-500 text-center py-4">No reports submitted yet</p>
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

const EmployeesView = ({ employees, onRefresh, readOnly = false }) => {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [loading, setLoading] = useState(false)
  const [newEmployee, setNewEmployee] = useState({ 
    name: '', 
    classification: 'General Labor', 
    phone: '', 
    active: true 
  })

  const handleAdd = async () => {
    setLoading(true)
    const { error } = await supabase
      .from('employees')
      .insert([newEmployee])
    
    if (!error) {
      setNewEmployee({ name: '', classification: 'General Labor', phone: '', active: true })
      setShowAddModal(false)
      onRefresh()
    }
    setLoading(false)
  }

  const handleUpdate = async () => {
    setLoading(true)
    const { error } = await supabase
      .from('employees')
      .update({
        name: editingEmployee.name,
        classification: editingEmployee.classification,
        phone: editingEmployee.phone,
        active: editingEmployee.active,
      })
      .eq('id', editingEmployee.id)
    
    if (!error) {
      setEditingEmployee(null)
      onRefresh()
    }
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to remove this employee?')) {
      await supabase.from('employees').delete().eq('id', id)
      onRefresh()
    }
  }

  const classifications = ['Foreman', 'Skilled Labor', 'General Labor', 'Operator']

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
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Classification</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Phone</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Status</th>
                {!readOnly && <th className="text-right py-3 px-4 text-sm font-medium text-zinc-400">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3 px-4 text-zinc-200 font-medium">{emp.name}</td>
                  <td className="py-3 px-4">
                    <Badge variant={emp.classification === 'Foreman' ? 'info' : 'default'}>
                      {emp.classification}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-zinc-400">{emp.phone || '-'}</td>
                  <td className="py-3 px-4">
                    <Badge variant={emp.active ? 'success' : 'danger'}>
                      {emp.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  {!readOnly && (
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingEmployee(emp)}
                          className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 rounded-lg transition-all"
                        >
                          <Icons.Edit />
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id)}
                          className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 rounded-lg transition-all"
                        >
                          <Icons.Trash />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {employees.length === 0 && (
            <p className="text-zinc-500 text-center py-8">No employees added yet</p>
          )}
        </div>
      </Card>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-100">Add Employee</h2>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-200">
                <Icons.X />
              </button>
            </div>
            <div className="space-y-4">
              <Input
                label="Name"
                value={newEmployee.name}
                onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                placeholder="Full name"
              />
              <Select
                label="Classification"
                value={newEmployee.classification}
                onChange={(e) => setNewEmployee({ ...newEmployee, classification: e.target.value })}
                options={classifications.map(c => ({ value: c, label: c }))}
              />
              <Input
                label="Phone"
                value={newEmployee.phone}
                onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                placeholder="555-0100"
              />
              <div className="flex gap-3 pt-4">
                <Button variant="secondary" onClick={() => setShowAddModal(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleAdd} loading={loading} className="flex-1" disabled={!newEmployee.name}>
                  Add Employee
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Modal */}
      {editingEmployee && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-100">Edit Employee</h2>
              <button onClick={() => setEditingEmployee(null)} className="text-zinc-400 hover:text-zinc-200">
                <Icons.X />
              </button>
            </div>
            <div className="space-y-4">
              <Input
                label="Name"
                value={editingEmployee.name}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, name: e.target.value })}
              />
              <Select
                label="Classification"
                value={editingEmployee.classification}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, classification: e.target.value })}
                options={classifications.map(c => ({ value: c, label: c }))}
              />
              <Input
                label="Phone"
                value={editingEmployee.phone || ''}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, phone: e.target.value })}
              />
              <Select
                label="Status"
                value={editingEmployee.active ? 'active' : 'inactive'}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, active: e.target.value === 'active' })}
                options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
              />
              <div className="flex gap-3 pt-4">
                <Button variant="secondary" onClick={() => setEditingEmployee(null)} className="flex-1">Cancel</Button>
                <Button onClick={handleUpdate} loading={loading} className="flex-1">Save Changes</Button>
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

const CrewsView = ({ crews, employees, profile, onRefresh }) => {
  const [selectedCrew, setSelectedCrew] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState([])
  const [loading, setLoading] = useState(false)

  const isForeman = profile?.role === 'foreman'
  const userCrew = isForeman ? crews.find(c => c.foreman_user_id === profile.id) : null

  // For foreman view, show only their crew
  const displayCrews = isForeman ? (userCrew ? [userCrew] : []) : crews

  const availableEmployees = employees.filter(e => 
    e.active && e.classification !== 'Foreman'
  )

  const startEditing = (crew) => {
    setSelectedCrew(crew)
    setSelectedMembers(crew.crew_members?.map(m => m.employee_id) || [])
    setIsEditing(true)
  }

  const toggleMember = (id) => {
    setSelectedMembers(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  const handleSave = async () => {
    setLoading(true)
    
    // Delete existing members
    await supabase
      .from('crew_members')
      .delete()
      .eq('crew_id', selectedCrew.id)
    
    // Add new members
    if (selectedMembers.length > 0) {
      await supabase
        .from('crew_members')
        .insert(selectedMembers.map(empId => ({
          crew_id: selectedCrew.id,
          employee_id: empId
        })))
    }
    
    setIsEditing(false)
    setSelectedCrew(null)
    onRefresh()
    setLoading(false)
  }

  if (isForeman && userCrew) {
    // Foreman single crew view
    const crewMembers = employees.filter(e => 
      userCrew.crew_members?.some(m => m.employee_id === e.id)
    )
    const foreman = employees.find(e => e.id === userCrew.foreman_id)

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">{userCrew.name}</h1>
            <p className="text-zinc-500">Manage your crew composition</p>
          </div>
          {!isEditing && (
            <Button onClick={() => startEditing(userCrew)}>
              <span className="flex items-center gap-2"><Icons.Edit /> Edit Crew</span>
            </Button>
          )}
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
          <h2 className="text-lg font-semibold text-zinc-100 mb-4">
            Crew Members {isEditing && <span className="text-amber-400">- Editing</span>}
          </h2>
          
          {isEditing ? (
            <div className="space-y-4">
              <p className="text-sm text-zinc-400">Select employees to add to your crew:</p>
              <div className="grid gap-2 max-h-80 overflow-y-auto">
                {availableEmployees.map(emp => (
                  <button
                    key={emp.id}
                    onClick={() => toggleMember(emp.id)}
                    className={`flex items-center gap-4 p-3 rounded-lg border transition-all text-left ${
                      selectedMembers.includes(emp.id)
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-zinc-700 hover:border-zinc-600 bg-zinc-800/50'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                      selectedMembers.includes(emp.id)
                        ? 'border-amber-500 bg-amber-500 text-zinc-900'
                        : 'border-zinc-600'
                    }`}>
                      {selectedMembers.includes(emp.id) && <Icons.Check />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-zinc-200">{emp.name}</p>
                      <p className="text-sm text-zinc-500">{emp.classification}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex gap-3 pt-4 border-t border-zinc-800">
                <Button variant="secondary" onClick={() => setIsEditing(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleSave} loading={loading} className="flex-1">Save Crew</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {crewMembers.length === 0 ? (
                <p className="text-zinc-500 py-8 text-center">No crew members assigned yet</p>
              ) : (
                crewMembers.map(emp => (
                  <div key={emp.id} className="flex items-center gap-4 p-3 bg-zinc-800/50 rounded-lg">
                    <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center text-zinc-300 font-medium">
                      {emp.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-zinc-200">{emp.name}</p>
                      <p className="text-sm text-zinc-500">{emp.phone || '-'}</p>
                    </div>
                    <Badge>{emp.classification}</Badge>
                  </div>
                ))
              )}
            </div>
          )}
        </Card>
      </div>
    )
  }

  // Admin/Supervisor view - all crews
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">All Crews</h1>
        <p className="text-zinc-500">{crews.length} active crews</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {displayCrews.map(crew => {
          const foreman = employees.find(e => e.id === crew.foreman_id)
          const members = employees.filter(e => 
            crew.crew_members?.some(m => m.employee_id === e.id)
          )
          
          return (
            <Card key={crew.id} className="hover:border-zinc-700 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-zinc-100">{crew.name}</h3>
                  <p className="text-sm text-zinc-500">Foreman: {foreman?.name || 'Not assigned'}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedCrew(crew)}>
                  <span className="flex items-center gap-1"><Icons.Eye /> View</span>
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {members.slice(0, 3).map(m => (
                  <div key={m.id} className="flex items-center gap-2 px-2 py-1 bg-zinc-800 rounded text-sm">
                    <span className="text-zinc-300">{m.name}</span>
                    <Badge variant="default">{m.classification}</Badge>
                  </div>
                ))}
                {members.length > 3 && (
                  <span className="px-2 py-1 text-sm text-zinc-500">+{members.length - 3} more</span>
                )}
                {members.length === 0 && (
                  <span className="text-sm text-zinc-500">No members assigned</span>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {crews.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-zinc-400">No crews created yet</p>
        </Card>
      )}

      {/* View Crew Modal */}
      {selectedCrew && !isEditing && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-100">{selectedCrew.name}</h2>
              <button onClick={() => setSelectedCrew(null)} className="text-zinc-400 hover:text-zinc-200">
                <Icons.X />
              </button>
            </div>
            <div className="space-y-4">
              {employees.filter(e => 
                selectedCrew.crew_members?.some(m => m.employee_id === e.id) || e.id === selectedCrew.foreman_id
              ).map(emp => (
                <div key={emp.id} className="flex items-center gap-4 p-3 bg-zinc-800/50 rounded-lg">
                  <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center text-zinc-300 font-medium">
                    {emp.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-zinc-200">{emp.name}</p>
                    <p className="text-sm text-zinc-500">{emp.phone || '-'}</p>
                  </div>
                  <Badge variant={emp.id === selectedCrew.foreman_id ? 'info' : 'default'}>
                    {emp.id === selectedCrew.foreman_id ? 'Foreman' : emp.classification}
                  </Badge>
                </div>
              ))}
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

const EquipmentView = ({ equipment, crews, profile, onRefresh }) => {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState(null)
  const [loading, setLoading] = useState(false)
  const [newEquipment, setNewEquipment] = useState({
    type: 'Tool',
    description: '',
    equipment_number: '',
    serial_number: '',
    photo_url: null,
    status: 'In Service',
    notes: ''
  })

  const isForeman = profile?.role === 'foreman'
  const userCrew = isForeman ? crews.find(c => c.foreman_user_id === profile.id) : null
  const filteredEquipment = isForeman && userCrew 
    ? equipment.filter(e => e.crew_id === userCrew.id)
    : equipment

  const equipmentTypes = ['Truck', 'Trailer', 'Excavator', 'Tool', 'Other']

  const handlePhotoUpload = async (e, isEdit = false) => {
    const file = e.target.files?.[0]
    if (!file) return

    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    
    const { data, error } = await supabase.storage
      .from('equipment-photos')
      .upload(fileName, file)
    
    if (!error) {
      const { data: { publicUrl } } = supabase.storage
        .from('equipment-photos')
        .getPublicUrl(fileName)
      
      if (isEdit) {
        setEditingEquipment({ ...editingEquipment, photo_url: publicUrl })
      } else {
        setNewEquipment({ ...newEquipment, photo_url: publicUrl })
      }
    }
  }

  const handleAdd = async () => {
    setLoading(true)
    const { error } = await supabase
      .from('equipment')
      .insert([{ ...newEquipment, crew_id: userCrew?.id }])
    
    if (!error) {
      setNewEquipment({ type: 'Tool', description: '', equipment_number: '', serial_number: '', photo_url: null, status: 'In Service', notes: '' })
      setShowAddModal(false)
      onRefresh()
    }
    setLoading(false)
  }

  const handleUpdate = async () => {
    setLoading(true)
    const { error } = await supabase
      .from('equipment')
      .update({
        type: editingEquipment.type,
        description: editingEquipment.description,
        equipment_number: editingEquipment.equipment_number,
        serial_number: editingEquipment.serial_number,
        photo_url: editingEquipment.photo_url,
        status: editingEquipment.status,
        notes: editingEquipment.notes,
      })
      .eq('id', editingEquipment.id)
    
    if (!error) {
      setEditingEquipment(null)
      onRefresh()
    }
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to remove this equipment?')) {
      await supabase.from('equipment').delete().eq('id', id)
      onRefresh()
    }
  }

  const readOnly = profile?.role === 'supervisor'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">{isForeman ? 'My Equipment' : 'All Equipment'}</h1>
          <p className="text-zinc-500">{filteredEquipment.length} items tracked</p>
        </div>
        {!readOnly && (
          <Button onClick={() => setShowAddModal(true)}>
            <span className="flex items-center gap-2"><Icons.Plus /> Add Equipment</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEquipment.map(item => {
          const crew = crews.find(c => c.id === item.crew_id)
          return (
            <Card key={item.id} className={`${item.status === 'Out of Service' ? 'border-amber-700/50' : ''}`}>
              {item.photo_url ? (
                <div className="w-full h-40 mb-4 rounded-lg overflow-hidden bg-zinc-800">
                  <img src={item.photo_url} alt={item.description} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-full h-40 mb-4 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-600">
                  <Icons.Camera />
                  <span className="ml-2">No photo</span>
                </div>
              )}
              
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-zinc-100">{item.description}</h3>
                    <p className="text-sm text-zinc-500">{item.type}</p>
                  </div>
                  <Badge variant={item.status === 'In Service' ? 'success' : 'warning'}>
                    {item.status}
                  </Badge>
                </div>
                
                <div className="text-sm text-zinc-400 space-y-1">
                  <p>Equipment #: <span className="text-zinc-300">{item.equipment_number}</span></p>
                  <p>Serial #: <span className="text-zinc-300">{item.serial_number || '-'}</span></p>
                  {!isForeman && crew && (
                    <p>Crew: <span className="text-zinc-300">{crew.name}</span></p>
                  )}
                </div>

                {item.notes && (
                  <p className="text-sm text-amber-400 bg-amber-900/20 rounded px-2 py-1">{item.notes}</p>
                )}

                {!readOnly && (
                  <div className="flex gap-2 pt-2">
                    <Button variant="secondary" size="sm" onClick={() => setEditingEquipment(item)} className="flex-1">
                      <span className="flex items-center justify-center gap-1"><Icons.Edit /> Edit</span>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                      <Icons.Trash />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {filteredEquipment.length === 0 && (
        <Card className="text-center py-12">
          <div className="text-zinc-600 mb-4"><Icons.Truck /></div>
          <p className="text-zinc-400">No equipment tracked yet</p>
          {!readOnly && (
            <Button onClick={() => setShowAddModal(true)} className="mt-4">Add Your First Equipment</Button>
          )}
        </Card>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-100">Add Equipment</h2>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-200">
                <Icons.X />
              </button>
            </div>
            <div className="space-y-4">
              <Select
                label="Type"
                value={newEquipment.type}
                onChange={(e) => setNewEquipment({ ...newEquipment, type: e.target.value })}
                options={equipmentTypes.map(t => ({ value: t, label: t }))}
              />
              <Input
                label="Description"
                value={newEquipment.description}
                onChange={(e) => setNewEquipment({ ...newEquipment, description: e.target.value })}
                placeholder="e.g., 2022 Ford F-350"
              />
              <Input
                label="Equipment Number"
                value={newEquipment.equipment_number}
                onChange={(e) => setNewEquipment({ ...newEquipment, equipment_number: e.target.value })}
                placeholder="e.g., TRK-001"
              />
              <Input
                label="Serial Number"
                value={newEquipment.serial_number}
                onChange={(e) => setNewEquipment({ ...newEquipment, serial_number: e.target.value })}
                placeholder="e.g., 1FT8W3BT5NEC12345"
              />
              
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-zinc-400 font-medium">Photo</label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-700 border-dashed rounded-lg cursor-pointer hover:border-amber-500 transition-colors bg-zinc-800/50">
                  {newEquipment.photo_url ? (
                    <img src={newEquipment.photo_url} alt="Preview" className="h-full object-contain rounded" />
                  ) : (
                    <div className="flex flex-col items-center text-zinc-500">
                      <Icons.Camera />
                      <span className="text-sm mt-2">Tap to take or upload photo</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handlePhotoUpload(e)} />
                </label>
              </div>

              <Textarea
                label="Notes (optional)"
                value={newEquipment.notes}
                onChange={(e) => setNewEquipment({ ...newEquipment, notes: e.target.value })}
                placeholder="Any additional notes..."
              />
              
              <div className="flex gap-3 pt-4">
                <Button variant="secondary" onClick={() => setShowAddModal(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleAdd} loading={loading} className="flex-1" disabled={!newEquipment.description || !newEquipment.equipment_number}>
                  Add Equipment
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Modal */}
      {editingEquipment && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-100">Edit Equipment</h2>
              <button onClick={() => setEditingEquipment(null)} className="text-zinc-400 hover:text-zinc-200">
                <Icons.X />
              </button>
            </div>
            <div className="space-y-4">
              <Select
                label="Type"
                value={editingEquipment.type}
                onChange={(e) => setEditingEquipment({ ...editingEquipment, type: e.target.value })}
                options={equipmentTypes.map(t => ({ value: t, label: t }))}
              />
              <Input
                label="Description"
                value={editingEquipment.description}
                onChange={(e) => setEditingEquipment({ ...editingEquipment, description: e.target.value })}
              />
              <Input
                label="Equipment Number"
                value={editingEquipment.equipment_number}
                onChange={(e) => setEditingEquipment({ ...editingEquipment, equipment_number: e.target.value })}
              />
              <Input
                label="Serial Number"
                value={editingEquipment.serial_number || ''}
                onChange={(e) => setEditingEquipment({ ...editingEquipment, serial_number: e.target.value })}
              />
              
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-zinc-400 font-medium">Photo</label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-700 border-dashed rounded-lg cursor-pointer hover:border-amber-500 transition-colors bg-zinc-800/50">
                  {editingEquipment.photo_url ? (
                    <img src={editingEquipment.photo_url} alt="Preview" className="h-full object-contain rounded" />
                  ) : (
                    <div className="flex flex-col items-center text-zinc-500">
                      <Icons.Camera />
                      <span className="text-sm mt-2">Tap to take or upload photo</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handlePhotoUpload(e, true)} />
                </label>
              </div>

              <Select
                label="Status"
                value={editingEquipment.status}
                onChange={(e) => setEditingEquipment({ ...editingEquipment, status: e.target.value })}
                options={[
                  { value: 'In Service', label: 'In Service' },
                  { value: 'Out of Service', label: 'Out of Service' }
                ]}
              />

              <Textarea
                label="Notes"
                value={editingEquipment.notes || ''}
                onChange={(e) => setEditingEquipment({ ...editingEquipment, notes: e.target.value })}
                placeholder="Any additional notes..."
              />
              
              <div className="flex gap-3 pt-4">
                <Button variant="secondary" onClick={() => setEditingEquipment(null)} className="flex-1">Cancel</Button>
                <Button onClick={handleUpdate} loading={loading} className="flex-1">Save Changes</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

// =============================================
// REPORTS VIEW
// =============================================

const ReportsView = ({ reports, employees, crews, profile, onRefresh }) => {
  const [showAddModal, setShowAddModal] = useState(false)
  const [viewingReport, setViewingReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [newReport, setNewReport] = useState({
    job_number: '',
    job_date: new Date().toISOString().split('T')[0],
    employees_on_site: [],
    notes: ''
  })

  const isForeman = profile?.role === 'foreman'
  const userCrew = isForeman ? crews.find(c => c.foreman_user_id === profile.id) : null
  const filteredReports = isForeman && userCrew 
    ? reports.filter(r => r.crew_id === userCrew.id)
    : reports

  const availableEmployees = employees.filter(e => e.active)
  const readOnly = profile?.role === 'supervisor'

  const toggleEmployee = (id) => {
    setNewReport(prev => ({
      ...prev,
      employees_on_site: prev.employees_on_site.includes(id)
        ? prev.employees_on_site.filter(e => e !== id)
        : [...prev.employees_on_site, id]
    }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    
    // Create the report
    const { data: report, error: reportError } = await supabase
      .from('job_reports')
      .insert([{
        crew_id: userCrew?.id,
        job_number: newReport.job_number,
        job_date: newReport.job_date,
        submitted_by: profile.id,
        notes: newReport.notes
      }])
      .select()
      .single()
    
    if (!reportError && report) {
      // Add employees to report
      if (newReport.employees_on_site.length > 0) {
        await supabase
          .from('job_report_employees')
          .insert(newReport.employees_on_site.map(empId => ({
            report_id: report.id,
            employee_id: empId
          })))
      }
      
      setNewReport({
        job_number: '',
        job_date: new Date().toISOString().split('T')[0],
        employees_on_site: [],
        notes: ''
      })
      setShowAddModal(false)
      onRefresh()
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">{isForeman ? 'Job Reports' : 'All Job Reports'}</h1>
          <p className="text-zinc-500">{filteredReports.length} reports submitted</p>
        </div>
        {!readOnly && isForeman && (
          <Button onClick={() => setShowAddModal(true)}>
            <span className="flex items-center gap-2"><Icons.Plus /> New Report</span>
          </Button>
        )}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Job #</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Date</th>
                {!isForeman && <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Crew</th>}
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">On Site</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.slice().reverse().map(report => {
                const crew = crews.find(c => c.id === report.crew_id)
                return (
                  <tr key={report.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-4 text-zinc-200 font-medium">{report.job_number}</td>
                    <td className="py-3 px-4 text-zinc-400">{report.job_date}</td>
                    {!isForeman && <td className="py-3 px-4 text-zinc-400">{crew?.name || '-'}</td>}
                    <td className="py-3 px-4">
                      <Badge>{report.job_report_employees?.length || 0} employees</Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setViewingReport(report)}>
                        <span className="flex items-center gap-1"><Icons.Eye /> View</span>
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filteredReports.length === 0 && (
            <p className="text-zinc-500 text-center py-8">No reports submitted yet</p>
          )}
        </div>
      </Card>

      {/* New Report Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-100">New Job Report</h2>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-200">
                <Icons.X />
              </button>
            </div>
            <div className="space-y-4">
              <Input
                label="Job Number"
                value={newReport.job_number}
                onChange={(e) => setNewReport({ ...newReport, job_number: e.target.value })}
                placeholder="e.g., JOB-2024-003"
              />
              <Input
                label="Job Date"
                type="date"
                value={newReport.job_date}
                onChange={(e) => setNewReport({ ...newReport, job_date: e.target.value })}
              />
              
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-zinc-400 font-medium">Employees On Site</label>
                <p className="text-xs text-zinc-500 mb-2">Select all employees who worked on this job today</p>
                <div className="grid gap-2 max-h-48 overflow-y-auto border border-zinc-700 rounded-lg p-2">
                  {availableEmployees.map(emp => (
                    <button
                      key={emp.id}
                      onClick={() => toggleEmployee(emp.id)}
                      className={`flex items-center gap-3 p-2 rounded-lg border transition-all text-left ${
                        newReport.employees_on_site.includes(emp.id)
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-zinc-700/50 hover:border-zinc-600 bg-zinc-800/30'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        newReport.employees_on_site.includes(emp.id)
                          ? 'border-amber-500 bg-amber-500 text-zinc-900'
                          : 'border-zinc-600'
                      }`}>
                        {newReport.employees_on_site.includes(emp.id) && <Icons.Check />}
                      </div>
                      <span className="text-zinc-200 text-sm">{emp.name}</span>
                      <Badge variant="default" className="ml-auto text-xs">{emp.classification}</Badge>
                    </button>
                  ))}
                </div>
              </div>

              <Textarea
                label="Notes"
                value={newReport.notes}
                onChange={(e) => setNewReport({ ...newReport, notes: e.target.value })}
                placeholder="Describe work completed, any issues, weather conditions..."
                rows={4}
              />
              
              <div className="flex gap-3 pt-4">
                <Button variant="secondary" onClick={() => setShowAddModal(false)} className="flex-1">Cancel</Button>
                <Button 
                  onClick={handleSubmit} 
                  loading={loading}
                  className="flex-1" 
                  disabled={!newReport.job_number || newReport.employees_on_site.length === 0}
                >
                  Submit Report
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* View Report Modal */}
      {viewingReport && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-100">Job Report Details</h2>
              <button onClick={() => setViewingReport(null)} className="text-zinc-400 hover:text-zinc-200">
                <Icons.X />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-zinc-500">Job Number</p>
                  <p className="text-zinc-200 font-medium">{viewingReport.job_number}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">Date</p>
                  <p className="text-zinc-200">{viewingReport.job_date}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-zinc-500 mb-2">Employees On Site ({viewingReport.job_report_employees?.length || 0})</p>
                <div className="flex flex-wrap gap-2">
                  {viewingReport.job_report_employees?.map(re => {
                    const emp = employees.find(e => e.id === re.employee_id)
                    return emp ? (
                      <Badge key={re.id} variant="info">{emp.name}</Badge>
                    ) : null
                  })}
                </div>
              </div>

              {viewingReport.notes && (
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Notes</p>
                  <p className="text-zinc-300 bg-zinc-800/50 rounded-lg p-3">{viewingReport.notes}</p>
                </div>
              )}

              <div className="text-xs text-zinc-500 pt-4 border-t border-zinc-800">
                Submitted: {new Date(viewingReport.created_at).toLocaleString()}
              </div>
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
  
  // Data state
  const [employees, setEmployees] = useState([])
  const [crews, setCrews] = useState([])
  const [equipment, setEquipment] = useState([])
  const [reports, setReports] = useState([])

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Fetch profile
  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (data) {
      setProfile(data)
      fetchAllData()
    }
    setLoading(false)
  }

  // Fetch all data
  const fetchAllData = async () => {
    const [employeesRes, crewsRes, equipmentRes, reportsRes] = await Promise.all([
      supabase.from('employees').select('*').order('name'),
      supabase.from('crews').select(`
        *,
        foreman:employees!crews_foreman_id_fkey(id, name, phone),
        crew_members(employee_id)
      `),
      supabase.from('equipment').select('*').order('created_at', { ascending: false }),
      supabase.from('job_reports').select(`
        *,
        job_report_employees(id, employee_id)
      `).order('job_date', { ascending: false })
    ])

    if (employeesRes.data) setEmployees(employeesRes.data)
    if (crewsRes.data) setCrews(crewsRes.data)
    if (equipmentRes.data) setEquipment(equipmentRes.data)
    if (reportsRes.data) setReports(reportsRes.data)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setCurrentView('dashboard')
  }

  if (loading) {
    return <LoadingScreen />
  }

  if (!session) {
    return <LoginScreen />
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard profile={profile} crews={crews} employees={employees} equipment={equipment} reports={reports} />
      case 'employees':
        return <EmployeesView employees={employees} onRefresh={fetchAllData} readOnly={profile?.role !== 'admin'} />
      case 'crews':
      case 'my-crew':
        return <CrewsView crews={crews} employees={employees} profile={profile} onRefresh={fetchAllData} />
      case 'equipment':
      case 'my-equipment':
        return <EquipmentView equipment={equipment} crews={crews} profile={profile} onRefresh={fetchAllData} />
      case 'reports':
      case 'my-reports':
        return <ReportsView reports={reports} employees={employees} crews={crews} profile={profile} onRefresh={fetchAllData} />
      default:
        return <Dashboard profile={profile} crews={crews} employees={employees} equipment={equipment} reports={reports} />
    }
  }

  return (
    <AuthContext.Provider value={{ session, profile }}>
      <div className="min-h-screen bg-zinc-950">
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-zinc-950 pointer-events-none" />
        <div className="relative z-10">
          <Navigation 
            currentView={currentView} 
            setCurrentView={setCurrentView} 
            profile={profile}
            onLogout={handleLogout}
          />
          <main className="max-w-7xl mx-auto px-4 py-6">
            {renderView()}
          </main>
        </div>
      </div>
    </AuthContext.Provider>
  )
}
