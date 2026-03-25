import { useState } from 'react'
import { Cable, RefreshCcw } from 'lucide-react'
import iikoProvider from '../../api/iikoProvider'
import { formatMoney } from '../../utils/constants'

function defaultPeriod() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  return {
    from: new Date(year, month, 1).toISOString().split('T')[0],
    to: new Date(year, month + 1, 0).toISOString().split('T')[0],
  }
}

export default function IikoIntegrationTab() {
  const [period, setPeriod] = useState(defaultPeriod())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sales, setSales] = useState(null)

  async function loadSales() {
    setLoading(true)
    setError('')
    const res = await iikoProvider.getSalesByPeriod({ date_from: period.from, date_to: period.to })
    setLoading(false)
    if (!res?.ok) {
      setError('Не удалось получить данные iiko')
      return
    }
    setSales(res.data)
  }

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-2">
          <Cable size={16} className="text-brand-500" />
          <p className="text-sm font-semibold text-surface-700">iiko integration (API-ready)</p>
        </div>
        <p className="text-xs text-surface-500">
          Сейчас используется подготовленный слой интеграции. После созвона подключим реальные API-ключи iiko без переделки страниц.
        </p>
      </div>

      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1.5">Период с</label>
            <input type="date" value={period.from} onChange={e => setPeriod(prev => ({ ...prev, from: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1.5">по</label>
            <input type="date" value={period.to} onChange={e => setPeriod(prev => ({ ...prev, to: e.target.value }))} />
          </div>
          <button onClick={loadSales} disabled={loading} className="btn-primary">
            <RefreshCcw size={14} /> {loading ? 'Загрузка...' : 'Обновить из iiko'}
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {sales && (
        <div className="grid sm:grid-cols-3 gap-3">
          <Stat label="Общая выручка" value={formatMoney(sales.total_revenue)} />
          <Stat label="Бар" value={formatMoney(sales.bar_revenue)} />
          <Stat label="Вход" value={formatMoney(sales.entrance_revenue)} />
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="stat-card">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
    </div>
  )
}
