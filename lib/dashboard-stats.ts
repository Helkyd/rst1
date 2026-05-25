import { fetcher } from './api/api_server_backend'
import { formatChange } from './utils'

const MONTH_LABELS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

function monthRange(year: number, month: number) {
  const start = new Date(year, month, 1, 0, 0, 0, 0)
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

function formatISO(date: Date) {
  return date.toISOString()
}

async function fetchOrdersInRange(start: Date, end: Date) {
  try {
    const orders = await fetcher<Order[]>(`/api/orders?startDate=${formatISO(start)}&endDate=${formatISO(end)}`)
    const total = orders.reduce((sum, order) => sum + (order.total || 0), 0)
    return { count: orders.length, total }
  } catch (error) {
    console.error('Error fetching orders in range:', error)
    return { count: 0, total: 0 }
  }
}

// lib/dashboard-stats.ts

export async function getDashboardMetrics() {
  const now = new Date()
  const thisMonth = monthRange(now.getFullYear(), now.getMonth())
  const lastMonth = monthRange(
    now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear(),
    now.getMonth() === 0 ? 11 : now.getMonth() - 1
  )

  try {
    // Fetch dashboard data - fetcher will handle auth automatically
    const dashboardData = await fetcher<{
      totalOrders: number
      totalRevenue: number
      totalUsers: number
      totalRestaurants: number
      recentOrders: any[]
      ordersByStatus: any[]
    }>('/api/admin/dashboard', {}, true) // requiresAuth = true

    // Fetch orders for current month
    const thisMonthOrders = await fetchOrdersInRange(thisMonth.start, thisMonth.end)
    // Fetch orders for last month
    const lastMonthOrders = await fetchOrdersInRange(lastMonth.start, lastMonth.end)

    const usersToday = 0
    const revThis = thisMonthOrders.total
    const revLast = lastMonthOrders.total

    // Fetch monthly revenue chart
    const monthlyRevenue = await getMonthlyRevenueChart()

    return {
      totalOrders: dashboardData.totalOrders,
      ordersThisMonth: thisMonthOrders.count,
      ordersLastMonth: lastMonthOrders.count,
      totalUsers: dashboardData.totalUsers,
      usersToday,
      totalRestaurants: dashboardData.totalRestaurants,
      revenueTotal: dashboardData.totalRevenue,
      revenueThisMonth: revThis,
      revenueLastMonth: revLast,
      recentOrders: dashboardData.recentOrders,
      monthlyRevenue,
      orderChange: formatChange(thisMonthOrders.count, lastMonthOrders.count, ' vs mês anterior'),
      revenueChange: formatChange(revThis, revLast, ' vs mês anterior'),
    }
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error)
    // Return default values in case of error
    return {
      totalOrders: 0,
      ordersThisMonth: 0,
      ordersLastMonth: 0,
      totalUsers: 0,
      usersToday: 0,
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

/*
// Update fetchOrdersInRange and getMonthlyRevenueChart similarly
export async function fetchOrdersInRange(startDate: Date, endDate: Date) {
  const start = startDate.toISOString().split('T')[0];
  const end = endDate.toISOString().split('T')[0];
  
  const data = await fetcher<{ count: number; total: number }>(
    `/api/admin/orders/range?startDate=${start}&endDate=${end}`,
    {},
    true
  );
  
  return data;
}

export async function getMonthlyRevenueChart() {
  const data = await fetcher<any[]>('/api/admin/revenue/monthly', {}, true);
  return data;
}
  */

// lib/dashboard-stats.ts
export async function getDashboardMetrics_v1(accessToken?: string) {
  const now = new Date()
  const thisMonth = monthRange(now.getFullYear(), now.getMonth())
  const lastMonth = monthRange(
    now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear(),
    now.getMonth() === 0 ? 11 : now.getMonth() - 1
  )

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  try {
    // Fetch dashboard data for totals - pass the token
    const dashboardData = await fetcher<{
      totalOrders: number
      totalRevenue: number
      totalUsers: number
      totalRestaurants: number
      recentOrders: any[]
      ordersByStatus: any[]
    }>('/api/admin/dashboard', {
      token: accessToken // Pass token to fetcher
    })

    // Fetch orders for current month - pass the token
    const thisMonthOrders = await fetchOrdersInRange(thisMonth.start, thisMonth.end, accessToken)
    // Fetch orders for last month - pass the token
    const lastMonthOrders = await fetchOrdersInRange(lastMonth.start, lastMonth.end, accessToken)

    // For usersToday, we don't have a direct API, so we'll set to 0 (limitation)
    const usersToday = 0

    const revThis = thisMonthOrders.total
    const revLast = lastMonthOrders.total

    // Fetch monthly revenue chart - pass the token
    const monthlyRevenue = await getMonthlyRevenueChart(accessToken)

    return {
      totalOrders: dashboardData.totalOrders,
      ordersThisMonth: thisMonthOrders.count,
      ordersLastMonth: lastMonthOrders.count,
      totalUsers: dashboardData.totalUsers,
      usersToday,
      totalRestaurants: dashboardData.totalRestaurants,
      revenueTotal: dashboardData.totalRevenue,
      revenueThisMonth: revThis,
      revenueLastMonth: revLast,
      recentOrders: dashboardData.recentOrders,
      monthlyRevenue,
      orderChange: formatChange(thisMonthOrders.count, lastMonthOrders.count, ' vs mês anterior'),
      revenueChange: formatChange(revThis, revLast, ' vs mês anterior'),
    }
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error)
    // Return default values in case of error
    return {
      totalOrders: 0,
      ordersThisMonth: 0,
      ordersLastMonth: 0,
      totalUsers: 0,
      usersToday: 0,
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

export async function getDashboardMetrics_() {
  const now = new Date()
  const thisMonth = monthRange(now.getFullYear(), now.getMonth())
  const lastMonth = monthRange(
    now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear(),
    now.getMonth() === 0 ? 11 : now.getMonth() - 1
  )

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  try {
    // Fetch dashboard data for totals
    const dashboardData = await fetcher<{
      totalOrders: number
      totalRevenue: number
      totalUsers: number
      totalRestaurants: number
      recentOrders: any[]
      ordersByStatus: any[]
    }>('/api/admin/dashboard')

    // Fetch orders for current month
    const thisMonthOrders = await fetchOrdersInRange(thisMonth.start, thisMonth.end)
    // Fetch orders for last month
    const lastMonthOrders = await fetchOrdersInRange(lastMonth.start, lastMonth.end)

    // For usersToday, we don't have a direct API, so we'll set to 0 (limitation)
    const usersToday = 0

    const revThis = thisMonthOrders.total
    const revLast = lastMonthOrders.total

    // Fetch monthly revenue chart (last 6 months)
    const monthlyRevenue = await getMonthlyRevenueChart()

    return {
      totalOrders: dashboardData.totalOrders,
      ordersThisMonth: thisMonthOrders.count,
      ordersLastMonth: lastMonthOrders.count,
      totalUsers: dashboardData.totalUsers,
      usersToday,
      totalRestaurants: dashboardData.totalRestaurants,
      revenueTotal: dashboardData.totalRevenue,
      revenueThisMonth: revThis,
      revenueLastMonth: revLast,
      recentOrders: dashboardData.recentOrders,
      monthlyRevenue,
      orderChange: formatChange(thisMonthOrders.count, lastMonthOrders.count, ' vs mês anterior'),
      revenueChange: formatChange(revThis, revLast, ' vs mês anterior'),
    }
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error)
    // Return default values in case of error
    return {
      totalOrders: 0,
      ordersThisMonth: 0,
      ordersLastMonth: 0,
      totalUsers: 0,
      usersToday: 0,
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

export async function getMonthlyRevenueChart() {
  const now = new Date()
  const points: { month: string; revenue: number }[] = []

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const { start, end } = monthRange(d.getFullYear(), d.getMonth())

    const { total } = await fetchOrdersInRange(start, end)

    points.push({
      month: MONTH_LABELS[d.getMonth()],
      revenue: total,
    })
  }

  return points
}

interface Order {
  total: number
  // other fields as needed
}
