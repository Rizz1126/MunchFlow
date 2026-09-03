import React, { useEffect, useState } from 'react';
import { Plus, Download, Filter } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Feedback';
import { Modal } from '../components/ui/Modal';
import { Input, Select, Textarea } from '../components/ui/Form';
import { useApi } from '../hooks/useApi';
import api from '../services/api';
import { formatCurrency, formatDateTime, getToday, getStartOfMonth } from '../utils/formatCurrency';
import { CASH_CATEGORIES, PAYMENT_METHODS } from '../utils/constants';
import { useBusiness } from '../contexts/BusinessContext';

export default function CashManagementPage() {
  const [filterType, setFilterType] = useState('');
  const [startDate, setStartDate] = useState(getStartOfMonth());
  const [endDate, setEndDate] = useState(getToday());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txType, setTxType] = useState('income');
  
  // Form state
  const [formData, setFormData] = useState({
    category: CASH_CATEGORIES.income[0],
    amount: '',
    paymentMethod: 'cash',
    description: '',
    transactionDate: getToday()
  });

  const { data: transactions, execute: fetchTransactions, loading } = useApi(api.getCashTransactions);
  const { data: summary, execute: fetchSummary } = useApi(api.getCashSummary);
  const { execute: createTx, loading: creating } = useApi(api.createCashTransaction);

  const { selectedBusinessId } = useBusiness();

  const loadData = () => {
    fetchTransactions({ type: filterType, startDate, endDate });
    fetchSummary(startDate, endDate);
  };

  useEffect(() => {
    loadData();
  }, [filterType, startDate, endDate, selectedBusinessId]);

  const handleExport = async () => {
    try {
      const res = await api.exportCash({ type: filterType, startDate, endDate });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kas_${getToday()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Gagal export CSV');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || formData.amount <= 0) {
      alert('Jumlah harus lebih dari 0');
      return;
    }
    
    try {
      await createTx({
        type: txType,
        ...formData,
        amount: parseFloat(formData.amount)
      });
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Change category options when tx type changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      category: CASH_CATEGORIES[txType][0]
    }));
  }, [txType]);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Kas Masuk & Keluar</h1>
        <div className="page-header-actions">
          <Button variant="outline" icon={<Download />} onClick={handleExport}>Export CSV</Button>
          <Button icon={<Plus />} onClick={() => setIsModalOpen(true)}>Catat Transaksi</Button>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '24px' }}>
        <div className="kpi-card income">
          <div className="kpi-label">Total Kas Masuk</div>
          <div className="kpi-value income text-2xl">{formatCurrency(summary?.totalIncome)}</div>
        </div>
        <div className="kpi-card expense">
          <div className="kpi-label">Total Kas Keluar</div>
          <div className="kpi-value expense text-2xl">{formatCurrency(summary?.totalExpense)}</div>
        </div>
        <div className="kpi-card profit">
          <div className="kpi-label">Saldo Kas (Net)</div>
          <div className="kpi-value profit text-2xl">{formatCurrency(summary?.netProfit)}</div>
        </div>
      </div>

      <Card>
        <CardHeader title="Riwayat Transaksi">
          <div className="filter-bar" style={{ marginBottom: 0 }}>
            <Select 
              value={filterType} 
              onChange={e => setFilterType(e.target.value)}
              options={[{value:'', label:'Semua Tipe'}, {value:'income', label:'Kas Masuk'}, {value:'expense', label:'Kas Keluar'}]}
              style={{ padding: '6px 12px', minWidth: '130px' }}
            />
            <Input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              style={{ padding: '6px 12px', minWidth: '140px' }}
            />
            <span className="text-gray-400">s/d</span>
            <Input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
              style={{ padding: '6px 12px', minWidth: '140px' }}
            />
          </div>
        </CardHeader>
        <CardBody style={{ padding: 0 }}>
          {loading ? (
            <div className="loading-container"><div className="spinner"></div></div>
          ) : !transactions || transactions.length === 0 ? (
            <div className="empty-state">
              <h4>Belum ada transaksi</h4>
              <p>Tidak ada data transaksi untuk filter yang dipilih.</p>
            </div>
          ) : (
            <Table headers={['Tanggal', 'Kategori', 'Deskripsi', 'Metode', 'Masuk', 'Keluar']}>
              {transactions.map(t => (
                <tr key={t.id}>
                  <td>{formatDateTime(t.createdAt)}</td>
                  <td>
                    <Badge variant={t.type === 'income' ? 'success' : 'danger'}>
                      {t.category}
                    </Badge>
                  </td>
                  <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.description || '-'}
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>{t.paymentMethod}</td>
                  <td className="font-semibold text-success text-right">
                    {t.type === 'income' ? formatCurrency(t.amount) : '-'}
                  </td>
                  <td className="font-semibold text-danger text-right">
                    {t.type === 'expense' ? formatCurrency(t.amount) : '-'}
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Transaction Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Catat Transaksi Manual"
      >
        <form id="tx-form" onSubmit={handleSubmit}>
          <div className="tab-switcher mb-5" style={{ width: '100%', display: 'flex' }}>
            <button 
              type="button" 
              className={txType === 'income' ? 'active' : ''} 
              onClick={() => setTxType('income')}
              style={{ flex: 1 }}
            >
              Kas Masuk
            </button>
            <button 
              type="button" 
              className={txType === 'expense' ? 'active' : ''} 
              onClick={() => setTxType('expense')}
              style={{ flex: 1 }}
            >
              Kas Keluar
            </button>
          </div>

          <div className="form-row">
            <Select 
              label="Kategori" 
              required
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value})}
              options={CASH_CATEGORIES[txType]}
            />
            <Input 
              label="Tanggal" 
              type="date" 
              required
              value={formData.transactionDate}
              onChange={e => setFormData({...formData, transactionDate: e.target.value})}
            />
          </div>

          <div className="form-row">
            <Input 
              label="Jumlah (Rp)" 
              type="number" 
              required
              min="0"
              value={formData.amount}
              onChange={e => setFormData({...formData, amount: e.target.value})}
            />
            <Select 
              label="Metode Pembayaran" 
              required
              value={formData.paymentMethod}
              onChange={e => setFormData({...formData, paymentMethod: e.target.value})}
              options={PAYMENT_METHODS}
            />
          </div>

          <Textarea 
            label="Keterangan (Opsional)" 
            placeholder="Catatan tambahan..."
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
          />
          
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit" loading={creating}>Simpan Transaksi</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
