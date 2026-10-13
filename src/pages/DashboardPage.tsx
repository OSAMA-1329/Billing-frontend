import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { apiGet } from '../api/client';
import { formatCurrency } from '../utils/format';

interface DashboardData {
  todaySales: number;
  todayCashSales: number;
  todayUpiSales: number;
  todayCredit: number;
  todayPurchases: number;
  todayBills: number;
  totalProducts: number;
  lowStockProducts: number;
  customerOutstanding: number;
  supplierOutstanding: number;
  monthRetailProfit: number;
  monthWholesaleProfit: number;
  salesTrend: { _id: string; total: number }[];
  purchaseTrend: { _id: string; total: number }[];
  topProducts: { name: string; qty: number; revenue: number }[];
}

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiGet<DashboardData>('/dashboard'),
  });

  if (isLoading || !data) {
    return <div className="text-slate-600">Loading dashboard...</div>;
  }

  const cards = [
    { label: "Today's Sales", value: formatCurrency(data.todaySales) },
    { label: "Today's Cash", value: formatCurrency(data.todayCashSales) },
    { label: "Today's UPI", value: formatCurrency(data.todayUpiSales) },
    { label: "Today's Credit Due", value: formatCurrency(data.todayCredit) },
    { label: "Today's Purchases", value: formatCurrency(data.todayPurchases) },
    { label: "This Month's Retail Profit", value: formatCurrency(data.monthRetailProfit) },
    { label: "This Month's Wholesale Profit", value: formatCurrency(data.monthWholesaleProfit) },
    { label: "Today's Bills", value: String(data.todayBills) },
    { label: 'Total Products', value: String(data.totalProducts) },
    { label: 'Low Stock', value: String(data.lowStockProducts), alert: data.lowStockProducts > 0 },
    { label: 'Customer Outstanding', value: formatCurrency(data.customerOutstanding) },
    { label: 'Supplier Outstanding', value: formatCurrency(data.supplierOutstanding) },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-600">Overview of shop activity</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-4">
            <p className="text-xs font-medium uppercase text-slate-500">{c.label}</p>
            <p className={`mt-1 text-2xl font-bold ${c.alert ? 'text-amber-600' : 'text-slate-900'}`}>
              {c.value}
            </p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <h2 className="mb-3 font-semibold">Sales (7 days)</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.salesTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-4">
          <h2 className="mb-3 font-semibold">Purchases (7 days)</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.purchaseTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="total" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="card p-4">
        <h2 className="mb-3 font-semibold">Top selling products (7 days)</h2>
        <div className="overflow-x-auto">
          <table className="table-dense w-full">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.topProducts.map((p) => (
                <tr key={p.name}>
                  <td>{p.name}</td>
                  <td>{p.qty}</td>
                  <td>{formatCurrency(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
