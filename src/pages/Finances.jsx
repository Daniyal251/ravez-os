import { useEffect, useState } from 'react'
import { Wallet } from 'lucide-react'
import api from '../api/client'
import FinanceOperationsTab from '../components/finance/FinanceOperationsTab'
import PayrollTab from '../components/finance/PayrollTab'
import FinanceReportsTab from '../components/finance/FinanceReportsTab'
import IikoIntegrationTab from '../components/finance/IikoIntegrationTab'

const FINANCE_TABS = [
  { key: 'operations', label: 'Операции' },
  { key: 'payroll', label: 'Зарплаты' },
  { key: 'reports', label: 'Отчеты' },
  { key: 'iiko', label: 'Интеграция iiko' },
]

export default function Finances() {
  const [activeTab, setActiveTab] = useState('operations')
  const [records, setRecords] = useState([])
  const [payrolls, setPayrolls] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [finRes, payrollRes] = await Promise.all([
      api.get('finances/list'),
      api.get('payroll/list'),
    ])
    setRecords(finRes?.finances || [])
    setPayrolls(payrollRes?.payrolls || payrollRes?.salaries || [])
    setLoading(false)
  }

  async function saveRecord(data) {
    const res = await api.post('finance/save', data)
    if (!res?.ok) return { ok: false, error: res?.error || 'Не удалось сохранить запись' }
    await loadData()
    return { ok: true }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Wallet size={22} className="text-brand-400" />
        <h1 className="page-title">Финансы</h1>
      </div>

      <div className="card p-2">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {FINANCE_TABS.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-brand-400/10 text-brand-600 border border-brand-300'
                  : 'bg-white text-surface-500 border border-surface-200 hover:bg-surface-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'operations' && (
        <FinanceOperationsTab
          records={records}
          loading={loading}
          onSaveRecord={saveRecord}
        />
      )}

      {activeTab === 'payroll' && (
        <PayrollTab onDataChanged={loadData} />
      )}

      {activeTab === 'reports' && (
        <FinanceReportsTab records={records} payrolls={payrolls} />
      )}

      {activeTab === 'iiko' && (
        <IikoIntegrationTab />
      )}
    </div>
  )
}
