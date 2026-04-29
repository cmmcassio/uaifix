import { createContext, useContext, useState, useCallback } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('uaifix_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const login = useCallback(async (email, password, role = 'technician') => {
    const endpoint = role === 'admin' ? '/auth/login/admin'
                   : role === 'client' ? '/auth/login/client'
                   : '/auth/login/technician'
    const { data } = await api.post(endpoint, { email, password })
    localStorage.setItem('uaifix_token', data.access_token)
    const userData = { name: data.name, role: data.role, status: data.status }
    localStorage.setItem('uaifix_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('uaifix_token')
    localStorage.removeItem('uaifix_user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
