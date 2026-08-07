import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Percent, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { useApi } from '../hooks/useApi';
import api from '../services/api';
import { formatCurrency, formatPercent, getStartOfMonth, getToday, formatDate } from '../utils/formatCurrency';
import { useRequireRole } from '../hooks/useAuthHooks';

const COLORS = ['#e63946', '#f4a261', '#e9c46a', '#2a9d8f', '#264653', '#8ab17d'];

export default function DashboardPage() {
  const { isOwner } = useRequireRole();
  const [period, setPeriod] = useState('month'); // 'today', 'week', 'month'
  
  const { data: kpi, execute: fetchKpi, loading: kpiLoading } = useApi(api.getKPI);
  const { data: trendData, execute: fetchTrend } = useApi(api.getSalesTrend);
  const { data: expenseData, execute: fetchExpense } = useApi(api.getExpenseComposition);
  const { data: alerts, execute: fetchAlerts } = useApi(api.getAlerts);

  useEffect(() => {
    let start, end = getToday();
    if (period === 'today') {
      start = end;
    } else if (period === 'week') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      start = d.toISOString().split('T')[0];
    } else {
      start = getStartOfMonth();
    }
    
    fetchKpi(start, end);
    if (isOwner) {
      fetchExpense(start, end);
    }
  }, [period, fetchKpi, fetchExpense, isOwner]);

  useEffect(() => {
    fetchTrend(14); // Last 14 days
    if (isOwner) {
      fetchAlerts();
    }
  }, [fetchTrend, fetchAlerts, isOwner]);

  const kpiItems = kpi ? [
    { 
      label: 'Omset Penjualan', 
      value: formatCurrency(kpi.totalIncome), 
      type: 'income',
      icon: TrendingUp 
    },
    { 
      label: 'Total Pengeluaran', 
      value: formatCurrency(kpi.totalExpense), 
      type: 'expense',
      icon: Wallet 
    },
    { 
      label: 'Laba Bersih', 
      value: formatCurrency(kpi.netProfit), 
      type: 'profit',
      icon: TrendingDown // Just for visual variant
    },
    { 
      label: 'Margin Profit', 
      value: formatPercent(kpi.profitMargin), 
      type: 'margin',
      icon: Percent 
    }
  ] : [];

  // Format trend data for chart
  const formattedTrendData = (trendData || []).map(item => ({
    name: formatDate(item.date).split(' ')[0] + ' ' + formatDate(item.date).split(' ')[1],
    Omset: item.total
  }));

  // Render Kasir simplified view
  if (!isOwner) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <h1>Dashboard Kasir</h1>
          <div className="period-selector">
            <button className={`period-btn ${period === 'today' ? 'active' : ''}`} onClick={() => setPeriod('today')}>Hari Ini</button>
            <button className={`period-btn ${period === 'week' ? 'active' : ''}`} onClick={() => setPeriod('week')}>7 Hari</button>
            <button className={`period-btn ${period === 'month' ? 'active' : ''}`} onClick={() => setPeriod('month')}>Bulan Ini</button>
          </div>
        </div>

        <div className="kpi-grid">
          {kpiLoading ? (
            Array(2).fill(0).map((_, i) => <div key={i} className="kpi-card" style={{ height: '140px', opacity: 0.5 }}>Loading...</div>)
          ) : (
            <>
              <div className="kpi-card income">
                <div className="kpi-icon income"><TrendingUp /></div>
                <div className="kpi-label">Kas Masuk (Penjualan)</div>
                <div className="kpi-value income">{formatCurrency(kpi?.totalIncome)}</div>
              </div>
              <div className="kpi-card expense">
                <div className="kpi-icon expense"><Wallet /></div>
                <div className="kpi-label">Kas Keluar (Operasional)</div>
                <div className="kpi-value expense">{formatCurrency(kpi?.totalExpense)}</div>
              </div>
            </>
          )}
        </div>

        <div className="charts-grid" style={{ gridTemplateColumns: '1fr' }}>
          <Card>
            <CardHeader title="Tren Penjualan (14 Hari Terakhir)" />
            <CardBody>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedTrendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      tickFormatter={(value) => `Rp${value / 1000}k`}
                    />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value), 'Omset']}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Line type="monotone" dataKey="Omset" stroke="hsl(5, 80%, 52%)" strokeWidth={3} dot={{ r: 4, fill: "hsl(5, 80%, 52%)", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  // Render Owner full view
  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Ringkasan Bisnis</h1>
        <div className="period-selector">
          <button className={`period-btn ${period === 'today' ? 'active' : ''}`} onClick={() => setPeriod('today')}>Hari Ini</button>
          <button className={`period-btn ${period === 'week' ? 'active' : ''}`} onClick={() => setPeriod('week')}>7 Hari</button>
          <button className={`period-btn ${period === 'month' ? 'active' : ''}`} onClick={() => setPeriod('month')}>Bulan Ini</button>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts && alerts.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <Card className="border-warning border-l-4">
            <CardBody className="py-3 px-4 flex justify-between items-center">
              <div className="flex items-center gap-3 text-warning-dark">
                <AlertTriangle size={20} color="hsl(38, 95%, 45%)" />
                <span className="font-semibold text-sm">Peringatan: {alerts.length} bahan baku mencapai batas minimum stok!</span>
              </div>
              <Link to="/inventory" className="btn btn-sm btn-outline" style={{ borderColor: 'hsl(38, 95%, 70%)', color: 'hsl(38, 95%, 40%)' }}>
                Cek Inventaris <ArrowRight size={14} />
              </Link>
            </CardBody>
          </Card>
        </div>
      )}

      {/* KPIs */}
      <div className="kpi-grid">
        {kpiLoading ? (
          Array(4).fill(0).map((_, i) => <div key={i} className="kpi-card" style={{ height: '140px', opacity: 0.5 }}>Loading...</div>)
        ) : (
          kpiItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className={`kpi-card ${item.type}`}>
                <div className={`kpi-icon ${item.type}`}><Icon size={24} /></div>
                <div className="kpi-label">{item.label}</div>
                <div className={`kpi-value ${item.type}`}>{item.value}</div>
              </div>
            );
          })
        )}
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <Card>
          <CardHeader title="Tren Omset (14 Hari Terakhir)" />
          <CardBody>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formattedTrendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickFormatter={(value) => `Rp${value / 1000}k`}
                  />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value), 'Omset']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Line type="monotone" dataKey="Omset" stroke="hsl(5, 80%, 52%)" strokeWidth={3} dot={{ r: 4, fill: "hsl(5, 80%, 52%)", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Komposisi Pengeluaran" />
          <CardBody>
            <div style={{ height: '300px' }}>
              {!expenseData || expenseData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-gray-400 text-sm">Tidak ada data pengeluaran pada periode ini.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="total"
                      nameKey="category"
                    >
                      {expenseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
