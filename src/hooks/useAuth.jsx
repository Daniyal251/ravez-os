import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  async function refreshMe() {
    const res = await api.get('staff/me')
    if (res?.staff) {
      setUser(res.staff)
      return { ok: true, staff: res.staff }
    }
    return { ok: false, error: res?.error || 'Не удалось обновить профиль' }
  }

  // Check if user is already logged in on mount
  useEffect(() => {
    const token = api.getToken()
    if (token) {
      refreshMe().then(res => {
        if (res?.staff) {
          setUser(res.staff)
        } else {
          api.clearToken()
        }
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [])

  async function login(loginStr, password) {
    const res = await api.post('staff/login', { login: loginStr, password })
    if (res?.token) {
      api.setToken(res.token)
      setUser(res.staff)
      return { ok: true }
    }
    return { ok: false, error: res?.error || 'Ошибка входа' }
  }

  function logout() {
    api.clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
