import api from './client'

async function getSalesByPeriod({ date_from, date_to }) {
  const res = await api.post('iiko/sales', { date_from, date_to })
  if (res?.ok && res.data) return { ok: true, data: res.data }
  return {
    ok: true,
    data: {
      total_revenue: 0,
      bar_revenue: 0,
      entrance_revenue: 0,
      source: 'stub',
    },
  }
}

async function getBarSalesByStaff({ date_from, date_to }) {
  const res = await api.post('iiko/bar-sales', { date_from, date_to })
  if (res?.ok && Array.isArray(res.items)) return { ok: true, items: res.items }
  return { ok: true, items: [] }
}

async function getEntranceSales({ date_from, date_to }) {
  const res = await api.post('iiko/entrance-sales', { date_from, date_to })
  if (res?.ok && res.data) return { ok: true, data: res.data }
  return { ok: true, data: { amount: 0, source: 'stub' } }
}

const iikoProvider = {
  getSalesByPeriod,
  getBarSalesByStaff,
  getEntranceSales,
}

export default iikoProvider
