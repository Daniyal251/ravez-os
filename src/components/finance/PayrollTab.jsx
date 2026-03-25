import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Settings2 } from 'lucide-react'
import api from '../../api/client'
import { PAYROLL_STATUSES, SALARY_MODEL_LABELS, SALARY_MODELS } from '../../utils/constants'

function monthRange() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const from = new Date(year, month, 1).toISOString().split('T')[0]
  const to = new Date(year, month + 1, 0).toISOString().split('T')[0]
  return { from, to }
}

const EMPTY_RULE = {
  staff_id: null,
  model: 'fixed',
  fixed_amount: 0,
  rate_per_shift: 0,
  percent_rate: 0,
  piece_rate: 0,
  bonus_fixed: 0,
}

export default function PayrollTab({ onDataChanged }) {
  const [staff, setStaff] = useState([])
  const [rules, setRules] = useState([])
  const [payrolls, setPayrolls] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [ruleModal, setRuleModal] = useState(false)
  const [ruleForm, setRuleForm] = useState(EMPTY_RULE)
  const [period, setPeriod] = useState(monthRange())

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    setError('')
    const [staffRes, ruleRes, payrollRes] = await Promise.all([
      api.get('staff/list'),
      api.get('payroll/rules/list'),
      api.get('payroll/list'),
    ])
    setStaff(staffRes?.staff || [])
    setRules(ruleRes?.rules || [])
    setPayrolls(payrollRes?.payrolls || payrollRes?.salaries || [])
    setLoading(false)
  }

  const rulesByStaff = useMemo(
    () => Object.fromEntries(rules.map(item => [Number(item.staff_id), item])),
    [rules]
  )

  function openRuleModal(person) {
    const existing = rulesByStaff[Number(person.id)]
    setRuleForm(existing ? { ...existing } : { ...EMPTY_RULE, staff_id: person.id })
    setRuleModal(true)
  }

  async function saveRule(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const payload = {
      ...ruleForm,
      staff_id: Number(ruleForm.staff_id),
      fixed_amount: Number(ruleForm.fixed_amount || 0),
      rate_per_shift: Number(ruleForm.rate_per_shift || 0),
      percent_rate: Number(ruleForm.percent_rate || 0),
      piece_rate: Number(ruleForm.piece_rate || 0),
      bonus_fixed: Number(ruleForm.bonus_fixed || 0),
    }
    const res = await api.post('payroll/rule/save', payload)
    setSaving(false)
    if (!res?.ok) {
      setError(res?.error || 'Не удалось сохранить правило')
      return
    }
    setRuleModal(false)
    await loadData()
  }

  async function calculatePayroll() {
    setSaving(true)
    setError('')
    const res = await api.post('payroll/calc', { date_from: period.from, date_to: period.to })
    setSaving(false)
    if (!res?.ok) {
      setError(res?.error || 'Не удалось рассчитать зарплаты')
      return
    }
    await loadData()
    onDataChanged?.()
  }

  async function markPaid(item) {
    const res = await api.post('payroll/mark-paid', { id: item.id })
    if (!res?.ok) return
    await loadData()
    onDataChanged?.()
  }

  return (
    <div className="space-y-4">
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
          <button onClick={calculatePayroll} disabled={saving} className="btn-primary">
            {saving ? 'Расчет...' : 'Рассчитать зарплаты'}
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-surface-700 mb-3">Правила зарплат сотрудников</h3>
            <div className="space-y-2 max-h-[480px] overflow-auto pr-1">
              {staff.map(person => {
                const rule = rulesByStaff[Number(person.id)]
                return (
                  <div key={person.id} className="rounded-lg border border-surface-200 p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-surface-700 truncate">{person.name}</p>
                      <p className="text-xs text-surface-400">
                        {rule ? SALARY_MODEL_LABELS[rule.model] || rule.model : 'Правило не задано'}
                      </p>
                    </div>
                    <button onClick={() => openRuleModal(person)} className="btn-secondary">
                      <Settings2 size={14} /> Настроить
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="card p-4">
            <h3 className="text-sm font-semibold text-surface-700 mb-3">Начисления</h3>
            {payrolls.length === 0 ? (
              <p className="text-sm text-surface-400">Начислений пока нет</p>
            ) : (
              <div className="space-y-2 max-h-[480px] overflow-auto pr-1">
                {payrolls.map(item => {
                  const person = staff.find(s => Number(s.id) === Number(item.staff_id))
                  const st = PAYROLL_STATUSES[item.status] || PAYROLL_STATUSES.draft
                  return (
                    <div key={item.id} className="rounded-lg border border-surface-200 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-surface-700 truncate">{person?.name || `Сотрудник #${item.staff_id}`}</p>
                        <span className={`badge ${st.color}`}>{st.label}</span>
                      </div>
                      <p className="text-xs text-surface-500 mt-1">
                        {SALARY_MODEL_LABELS[item.model] || item.model} · {Math.round(Number(item.amount || 0)).toLocaleString('ru-RU')} ₽
                      </p>
                      {item.status !== 'paid' && (
                        <button onClick={() => markPaid(item)} className="mt-2 text-xs text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1">
                          <CheckCircle2 size={13} /> Отметить выплаченной
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {ruleModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={saveRule} className="card w-full max-w-lg">
            <div className="p-5 border-b border-surface-100">
              <h3 className="text-base font-semibold">Настройка правила зарплаты</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-surface-500 mb-1.5">Модель</label>
                <select value={ruleForm.model} onChange={e => setRuleForm(prev => ({ ...prev, model: e.target.value }))}>
                  {SALARY_MODELS.map(item => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Фикс (₽)" value={ruleForm.fixed_amount} onChange={value => setRuleForm(prev => ({ ...prev, fixed_amount: value }))} />
                <Field label="Ставка за смену (₽)" value={ruleForm.rate_per_shift} onChange={value => setRuleForm(prev => ({ ...prev, rate_per_shift: value }))} />
                <Field label="Процент от выручки (%)" value={ruleForm.percent_rate} onChange={value => setRuleForm(prev => ({ ...prev, percent_rate: value }))} />
                <Field label="Сдельно за единицу (₽)" value={ruleForm.piece_rate} onChange={value => setRuleForm(prev => ({ ...prev, piece_rate: value }))} />
                <Field label="Бонус фикс (₽)" value={ruleForm.bonus_fixed} onChange={value => setRuleForm(prev => ({ ...prev, bonus_fixed: value }))} />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <div className="p-5 border-t border-surface-100 flex justify-end gap-2">
              <button type="button" onClick={() => setRuleModal(false)} className="btn-secondary">Отмена</button>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Сохранение...' : 'Сохранить'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-surface-500 mb-1.5">{label}</label>
      <input type="number" value={value} onChange={e => onChange(e.target.value)} />
    </div>
  )
}
