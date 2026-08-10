import React, { useEffect, useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Input } from '../components/ui/Form';
import { Button } from '../components/ui/Button';
import { useApi } from '../hooks/useApi';
import api, { API_BASE } from '../services/api';
import { formatCurrency, formatPercent, getStartOfMonth, getToday } from '../utils/formatCurrency';

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(getStartOfMonth());
  const [endDate, setEndDate] = useState(getToday());

  const { data: pnl, execute: fetchPnL, loading } = useApi(api.getPnL);

  useEffect(() => {
    fetchPnL(startDate, endDate);
  }, [startDate, endDate, fetchPnL]);

  if (loading && !pnl) {
    return <div className="loading-container"><div className="spinner"></div></div>;
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Laporan Keuangan (P&L)</h1>
        <div className="filter-bar" style={{ marginBottom: 0 }}>
          <Input 
            type="date" 
            value={startDate} 
            onChange={e => setStartDate(e.target.value)}
          />
          <span className="text-gray-400">s/d</span>
          <Input 
            type="date" 
            value={endDate} 
            onChange={e => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {!pnl ? null : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: P&L Statement (2/3 width) */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader title="Profit & Loss Statement" icon={<FileText />} />
              <CardBody>
                
                {/* REVENUE SECTION */}
                <div className="pnl-section">
                  <div className="pnl-section-title">Pendapatan (Revenue)</div>
                  {pnl.incomeBreakdown.map((inc, idx) => (
                    <div key={idx} className="pnl-row">
                      <span className="pnl-label">{inc.category}</span>
                      <span className="pnl-value text-success">{formatCurrency(inc.total)}</span>
                    </div>
                  ))}
                  <div className="pnl-row total">
                    <span>Total Pendapatan Kotor</span>
                    <span className="text-success text-lg">{formatCurrency(pnl.grossRevenue)}</span>
                  </div>
                </div>

                {/* COGS SECTION */}
                <div className="pnl-section">
                  <div className="pnl-section-title">Harga Pokok Penjualan (HPP / COGS)</div>
                  <div className="pnl-row">
                    <span className="pnl-label">Pembelian Bahan Baku (Kas Keluar)</span>
                    <span className="pnl-value text-danger">{formatCurrency(pnl.totalCogs)}</span>
                  </div>
                  <div className="text-xs text-gray-500 px-4 mb-2 italic">
                    *HPP teoritis dari penjualan: {formatCurrency(pnl.salesHpp)}
                  </div>
                  <div className="pnl-row total">
                    <span>Laba Kotor (Gross Profit)</span>
                    <div className="text-right">
                      <div className="text-primary text-lg">{formatCurrency(pnl.grossProfit)}</div>
                      <div className="text-xs text-primary-dark">Margin: {formatPercent(pnl.grossProfitMargin)}</div>
                    </div>
                  </div>
                </div>

                {/* OPEX SECTION */}
                <div className="pnl-section">
                  <div className="pnl-section-title">Biaya Operasional (OpEx)</div>
                  {pnl.expenseBreakdown
                    .filter(exp => exp.category !== 'Pembelian Bahan Baku')
                    .map((exp, idx) => (
                      <div key={idx} className="pnl-row">
                        <span className="pnl-label">{exp.category}</span>
                        <span className="pnl-value text-danger">{formatCurrency(exp.total)}</span>
                      </div>
                  ))}
                  <div className="pnl-row total">
                    <span>Total Biaya Operasional</span>
                    <span className="text-danger">{formatCurrency(pnl.totalOpex)}</span>
                  </div>
                </div>

                {/* NET PROFIT */}
                <div className="pnl-row grand-total mt-8">
                  <span className="text-xl">Laba Bersih (Net Profit)</span>
                  <div className="text-right">
                    <div className="text-2xl">{formatCurrency(pnl.netProfit)}</div>
                    <div className="text-sm font-medium opacity-90 mt-1">Margin: {formatPercent(pnl.netProfitMargin)}</div>
                  </div>
                </div>

              </CardBody>
            </Card>
          </div>

          {/* Right Column: Visual Summary */}
          <div>
            <Card className="mb-6">
              <CardHeader title="Ringkasan Margin" />
              <CardBody>
                <div className="flex flex-col gap-6">
                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-2">
                      <span>Gross Profit Margin</span>
                      <span className="text-primary">{formatPercent(pnl.grossProfitMargin)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-primary h-3 rounded-full" style={{ width: `${Math.min(100, Math.max(0, pnl.grossProfitMargin))}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Target F&B ideal: 60% - 70%</p>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-2">
                      <span>Net Profit Margin</span>
                      <span className="text-accent-dark">{formatPercent(pnl.netProfitMargin)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-accent h-3 rounded-full" style={{ width: `${Math.min(100, Math.max(0, pnl.netProfitMargin))}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Target F&B ideal: 15% - 25%</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="text-center p-8">
                <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="font-semibold mb-2">Export Laporan</h3>
                <p className="text-sm text-gray-500 mb-6">Unduh rincian seluruh transaksi kas pada periode ini dalam format CSV (Excel).</p>
                <Button 
                  className="w-full" 
                  variant="outline" 
                  icon={<Download />}
                  onClick={async () => {
                    const token = localStorage.getItem('token');
                    const response = await fetch(`${API_BASE}/cash/export?startDate=${startDate}&endDate=${endDate}`, {
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    if (!response.ok) throw new Error('Export gagal.');
                    const url = URL.createObjectURL(await response.blob());
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `kas_${startDate}_${endDate}.csv`;
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Download CSV
                </Button>
              </CardBody>
            </Card>
          </div>

        </div>
      )}
    </div>
  );
}
