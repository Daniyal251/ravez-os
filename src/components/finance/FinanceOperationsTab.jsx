import { useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, Plus, TrendingDown, TrendingUp, Wallet, X } from 'lucide-react'
import { formatDate, formatMoney } from '../../utils/constants'

export default function FinanceOperationsTab({ records, loading, onSaveRecord }) {
  const [filter, setFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [saveError, setSaveError] = useState('')

  const income = useMemo(
    () => records.filter(r => r.type === 'income').reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [records]
  )
  const expense = useMemo(
    () => records.filter(r => r.type === 'expense').reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [records]
  )
  const profit = income - expense

  const filtered = useMemo(
    () => records
      .filter(item => filter === 'all' || item.type === filter)
      .sort((a, b) => (b.date || '').localeCompare(a.date || '')),
    [records, filter]
  )

  async function handleSave(payload) {
    setSaveError('')
    const result = await onSaveRecord(payload)
    if (result?.ok) {
      setShowModal(false)
      return
    }
    setSaveError(result?.error || 'Не удалось сохранить запись')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-surface-700">Операции</h2>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={16} /> Добавить операцию
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
            <span className="stat-label">Доход</span>
          </div>
          <p className="stat-value text-emerald-600">{formatMoney(income)}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
              <TrendingDown size={16} />
            </div>
            <span className="stat-label">Расход</span>
          </div>
          <p className="stat-value text-red-500">{formatMoney(expense)}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${profit >= 0 ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
              <Wallet size={16} />
            </div>
            <span className="stat-label">Прибыль</span>
          </div>
          <p className={`stat-value ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {profit >= 0 ? '+' : ''}{formatMoney(profit)}
          </p>
        </div>
      </div>

      <div className="flex gap-1.5">
        <FilterPill active={filter === 'all'} onClick={() => setFilter('all')}>Все</FilterPill>
        <FilterPill active={filter === 'income'} onClick={() => setFilter('income')}>Доходы</FilterPill>
        <FilterPill active={filter === 'expense'} onClick={() => setFilter('expense')}>Расходы</FilterPill>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-surface-400">Записей пока нет</div>
      ) : (
        <div className="card divide-y divide-surface-100">
          {filtered.map(item => {
            const isIncome = item.type === 'income'
            return (
              <div key={item.id} className="flex items-center gap-4 px-4 sm:px-5 py-3.5 hover:bg-surface-50/60 transition-colors">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isIncome ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
                  {isIncome ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-surface-700 truncate">
                    {item.description || item.category || (isIncome ? 'Доход' : 'Расход')}
                  </p>
                  <p className="text-xs text-surface-400 mt-0.5">
                    {item.category && <span className="badge-neutral badge mr-2">{item.category}</span>}
                    {formatDate(item.date)}
                  </p>
                </div>
                <p className={`text-sm font-bold shrink-0 ${isIncome ? 'text-emerald-600' : 'text-red-500'}`}>
                  {isIncome ? '+' : '−'}{formatMoney(item.amount)}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <FinanceOperationModal
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          saveError={saveError}
        />
      )}
    </div>
  )
}

function FilterPill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        active ? 'bg-brand-400/10 text-brand-500' : 'bg-white border border-surface-200 text-surface-500 hover:bg-surface-50'
      }`}
    >
      {children}
    </button>
  )
}

function FinanceOperationModal({ onSave, onClose, saveError }) {
  const [form, setForm] = useState({
    type: 'income',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.amount) return
    setSaving(true)
    await onSave({ ...form, amount: Number(form.amount) })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <form onSubmit={handleSubmit} className="card w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-surface-100">
          <h3 className="text-base font-semibold">Новая операция</h3>
          <button type="button" onClick={onClose} className="text-surface-400 hover:text-surface-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, type: 'income' }))}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                form.type === 'income' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-surface-50 text-surface-400 border border-surface-200'
              }`}
            >
              Доход
            </button>
            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, type: 'expense' }))}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                form.type === 'expense' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-surface-50 text-surface-400 border border-surface-200'
              }`}
            >
              Расход
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1.5">Сумма (₽)</label>
            <input type="number" value={form.amount} onChange={e => setForm(prev => ({ ...prev, amount: e.target.value }))} placeholder="0" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1.5">Категория</label>
              <input value={form.category} onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))} placeholder="Бар, вход, аренда..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1.5">Дата</label>
              <input type="date" value={form.date} onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1.5">Описание</label>
            <input value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Комментарий..." />
          </div>
          {saveError && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">{saveError}</p>}
        </div>

        <div className="flex justify-end gap-2.5 p-5 border-t border-surface-100">
          <button type="button" onClick={onClose} className="btn-secondary">Отмена</button>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Сохранение...' : 'Сохранить'}</button>
        </div>
      </form>
    </div>
  )
}
