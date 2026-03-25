import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { LogIn, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const { login: loginUser } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ login: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const loginValue = form.login.trim()
    const passwordValue = form.password.trim()
    if (!loginValue || !passwordValue) {
      setError('Введите логин и пароль')
      return
    }
    setError('')
    setLoading(true)
    const res = await loginUser(loginValue, passwordValue)
    setLoading(false)
    if (res.ok) {
      navigate('/')
    } else {
      setError(res.error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-display text-5xl tracking-wider">
            RAVEZ <span className="text-brand-400">OS</span>
          </h1>
          <p className="text-xs text-surface-400 tracking-[0.25em] uppercase mt-1">
            Staff portal
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-surface-400 uppercase tracking-wider">
            Вход для сотрудников
          </h2>

          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1.5">
              Логин
            </label>
            <input
              type="text"
              value={form.login}
              onChange={e => setForm({ ...form, login: e.target.value })}
              placeholder="Ваш логин"
              autoComplete="username"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1.5">
              Пароль
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Ваш пароль"
                autoComplete="current-password"
                className="w-full pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={16} />
                Войти
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-surface-400 mt-6">
          RAVEZ ONE · Казань
        </p>
      </div>
    </div>
  )
}
