import { useMemo } from 'react'
import { formatMoney } from '../../utils/constants'

export default function FinanceReportsTab({ records, payrolls }) {
  const report = useMemo(() => {
    const income = records.filter(item => item.type === 'income').reduce((sum, item) => sum + Number(item.amount || 0), 0)
    const expense = records.filter(item => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount || 0), 0)
    const payrollFund = payrolls.reduce((sum, item) => sum + Number(item.amount || 0), 0)
    const paidPayroll = payrolls
      .filter(item => item.status === 'paid')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0)
    const toPayPayroll = payrolls
      .filter(item => item.status !== 'paid')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0)
    const net = income - expense - payrollFund

    const byCategory = records.reduce((acc, item) => {
      const key = item.category || 'Без категории'
      if (!acc[key]) acc[key] = { income: 0, expense: 0 }
      if (item.type === 'income') acc[key].income += Number(item.amount || 0)
      if (item.type === 'expense') acc[key].expense += Number(item.amount || 0)
      return acc
    }, {})

    return {
      income,
      expense,
      payrollFund,
      paidPayroll,
      toPayPayroll,
      net,
      categories: Object.entries(byCategory),
    }
  }, [records, payrolls])

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <MetricCard label="Доход" value={formatMoney(report.income)} tone="emerald" />
        <MetricCard label="Расход" value={formatMoney(report.expense)} tone="red" />
        <MetricCard label="Фонд зарплат" value={formatMoney(report.payrollFund)} tone="violet" />
        <MetricCard label="Выплачено зарплат" value={formatMoney(report.paidPayroll)} tone="emerald" />
        <MetricCard label="К выплате" value={formatMoney(report.toPayPayroll)} tone="amber" />
        <MetricCard label="Чистый результат" value={formatMoney(report.net)} tone={report.net >= 0 ? 'emerald' : 'red'} />
      </div>

      <div className="card p-4">
        <h3 className="text-sm font-semibold text-surface-700 mb-3">Разбивка по категориям</h3>
        {report.categories.length === 0 ? (
          <p className="text-sm text-surface-400">Категорий пока нет</p>
        ) : (
          <div className="space-y-2">
            {report.categories.map(([name, values]) => (
              <div key={name} className="rounded-lg border border-surface-200 p-3 flex items-center justify-between gap-3">
                <p className="text-sm text-surface-700 truncate">{name}</p>
                <div className="text-right">
                  <p className="text-xs text-emerald-600">+{formatMoney(values.income)}</p>
                  <p className="text-xs text-red-500">−{formatMoney(values.expense)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MetricCard({ label, value, tone }) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-600',
    red: 'bg-red-50 text-red-500',
    violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
  }
  return (
    <div className="stat-card">
      <p className="stat-label">{label}</p>
      <p className={`stat-value ${tones[tone] || tones.violet}`}>{value}</p>
    </div>
  )
}
