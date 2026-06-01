import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Loader2, Truck, CheckCircle2, XCircle, TrendingUp, Package, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["#2563eb", "#10b981", "#8b5cf6", "#f97316", "#eab308", "#ef4444", "#06b6d4"];

export default function AdminShippingPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    fetch("/api/shipping/admin/analytics")
      .then(r => r.json())
      .then(d => { setAnalytics(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <AdminLayout>
      <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
    </AdminLayout>
  );

  if (!analytics) return (
    <AdminLayout>
      <p className="text-muted-foreground text-center py-20">No shipping data available</p>
    </AdminLayout>
  );

  const monthData = Object.entries(analytics.byMonth || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month: month.slice(5), shipments: count }));

  const courierData = Object.entries(analytics.byCourier || {}).map(([name, d]: any) => ({
    name, total: d.total, delivered: d.delivered,
    rate: d.total > 0 ? Math.round((d.delivered / d.total) * 100) : 0,
  }));

  const methodData = Object.entries(analytics.byMethod || {}).map(([method, count]) => ({
    name: method.charAt(0).toUpperCase() + method.slice(1), value: count as number,
  }));

  const STATS = [
    { label: "Total Shipments", value: analytics.total,        color: "#2563eb", icon: Package },
    { label: "Delivered",       value: analytics.delivered,    color: "#10b981", icon: CheckCircle2 },
    { label: "Active",          value: analytics.active,       color: "#8b5cf6", icon: Truck },
    { label: "Failed/Returned", value: analytics.failed,       color: "#ef4444", icon: XCircle },
    { label: "Delivery Rate",   value: `${analytics.deliveryRate}%`, color: "#10b981", icon: TrendingUp },
    { label: "Shipping Revenue",value: `$${analytics.totalRevenue?.toFixed(2) ?? "0.00"}`, color: "#eab308", icon: BarChart3 },
  ];

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Shipping Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform-wide shipping performance overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {STATS.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl p-4 border" style={{ borderTop: `3px solid ${s.color}` }}>
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <p className="text-2xl font-extrabold">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly volume */}
        <div className="rounded-xl border p-5">
          <p className="font-bold mb-4">Monthly Shipment Volume</p>
          {monthData.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#0f0a22", border: "1px solid #281850", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="shipments" fill="#2563eb" radius={[4, 4, 0, 0]} name="Shipments" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Method breakdown */}
        <div className="rounded-xl border p-5">
          <p className="font-bold mb-4">Shipments by Method</p>
          {methodData.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={methodData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {methodData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#0f0a22", border: "1px solid #281850", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Courier performance table */}
      <div className="rounded-xl border overflow-hidden">
        <div className="px-5 py-3 font-bold border-b">Courier Performance</div>
        {courierData.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-10">No shipments created yet</p>
        ) : (
          <div>
            <div className="grid px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-muted-foreground"
              style={{ gridTemplateColumns: "1fr 100px 100px 120px" }}>
              <span>Courier</span><span>Shipments</span><span>Delivered</span><span>Success Rate</span>
            </div>
            {courierData.map((c, idx) => (
              <div key={c.name} className="grid px-5 py-3.5 items-center border-t text-sm"
                style={{ gridTemplateColumns: "1fr 100px 100px 120px" }}>
                <p className="font-semibold">{c.name}</p>
                <p className="text-muted-foreground">{c.total}</p>
                <p className="text-green-600 font-semibold">{c.delivered}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-green-500" style={{ width: `${c.rate}%` }} />
                  </div>
                  <span className="text-xs font-bold text-green-600 w-10 text-right">{c.rate}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
