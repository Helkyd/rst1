// lib/dashboard-stats.ts
import { fetcher } from './api/api_server_backend'

const MONTH_LABELS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
]

// Helper function for percentage change
function formatChange(current: number, previous: number, suffix: string = ''): string {
  if (previous === 0) return current === 0 ? '0%' : '+100%'
  const change = ((current - previous) / previous) * 100
  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(1)}%${suffix}`
}

function monthRange(year: number, month: number) {
  const start = new Date(year, month, 1, 0, 0, 0, 0)
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

function formatISO(date: Date) {
  return date.toISOString()
}

async function fetchOrdersInRange(start: Date, end: Date, requiresAuth: boolean = true) {
  try {
    const orders = await fetcher<any[]>(
      `/api/orders?startDate=${formatISO(start)}&endDate=${formatISO(end)}`,
      {},
      requiresAuth
    )
    const total = orders.reduce((sum, order) => sum + (order.total || 0), 0)
    return { count: orders.length, total }
  } catch (error) {
    console.error('Error fetching orders in range:', error)
    return { count: 0, total: 0 }
  }
}

// Main dashboard metrics function
export async function getDashboardMetrics(requiresAuth: boolean = true) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  
  const thisMonth = monthRange(currentYear, currentMonth)
  const lastMonth = monthRange(
    currentMonth === 0 ? currentYear - 1 : currentYear,
    currentMonth === 0 ? 11 : currentMonth - 1
  )

  try {
    // Fetch dashboard data from admin endpoint
    const dashboardData = await fetcher<{
      totalOrders: number
      totalRevenue: number
      totalUsers: number
      totalRestaurants: number
      recentOrders: any[]
      ordersByStatus: any[]
    }>('/api/admin/dashboard', {}, requiresAuth)

    // Fetch orders for comparison
    const [thisMonthOrders, lastMonthOrders] = await Promise.all([
      fetchOrdersInRange(thisMonth.start, thisMonth.end, requiresAuth),
      fetchOrdersInRange(lastMonth.start, lastMonth.end, requiresAuth)
    ])

    // Fetch monthly revenue chart data
    const monthlyRevenue = await getMonthlyRevenueChart(requiresAuth)

    return {
      totalOrders: dashboardData.totalOrders,
      ordersThisMonth: thisMonthOrders.count,
      ordersLastMonth: lastMonthOrders.count,
      totalUsers: dashboardData.totalUsers,
      totalRestaurants: dashboardData.totalRestaurants,
      revenueTotal: dashboardData.totalRevenue,
      revenueThisMonth: thisMonthOrders.total,
      revenueLastMonth: lastMonthOrders.total,
      recentOrders: dashboardData.recentOrders,
      monthlyRevenue,
      orderChange: formatChange(thisMonthOrders.count, lastMonthOrders.count, ' vs mês anterior'),
      revenueChange: formatChange(thisMonthOrders.total, lastMonthOrders.total, ' vs mês anterior'),
    }
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error)
    
    // Return default values in case of error
    return {
      totalOrders: 0,
      ordersThisMonth: 0,
      ordersLastMonth: 0,
      totalUsers: 0,
      totalRestaurants: 0,
      revenueTotal: 0,
      revenueThisMonth: 0,
      revenueLastMonth: 0,
      recentOrders: [],
      monthlyRevenue: [],
      orderChange: '0% vs mês anterior',
      revenueChange: '0% vs mês anterior',
    }
  }
}

// Get monthly revenue chart (last 6 months)
export async function getMonthlyRevenueChart(requiresAuth: boolean = true) {
  const now = new Date()
  const points: { month: string; revenue: number }[] = []

  // Fetch last 6 months in parallel for better performance
  const promises = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const { start, end } = monthRange(d.getFullYear(), d.getMonth())
    promises.push(fetchOrdersInRange(start, end, requiresAuth))
  }

  const results = await Promise.all(promises)
  
  for (let i = 0; i < results.length; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    points.push({
      month: MONTH_LABELS[d.getMonth()],
      revenue: results[i].total,
    })
  }

  return points
}

// Optional: For server components that have access to token directly
export async function getDashboardMetricsWithToken(accessToken: string) {
  // This is a wrapper if you need to pass token explicitly
  // But your fetcher should handle this automatically via NextAuth session
  return getDashboardMetrics(true)
}

// For backward compatibility if needed
export const getDashboardMetrics_v1 = getDashboardMetrics;
export const getDashboardMetrics_ = getDashboardMetrics;