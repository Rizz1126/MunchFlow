import React, { useEffect, useState } from 'react';
import { Plus, Edit2, AlertTriangle, ArrowDownToLine, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { Input, Select } from '../components/ui/Form';
import { Badge } from '../components/ui/Feedback';
import { useApi } from '../hooks/useApi';
import api from '../services/api';
import { formatCurrency, formatNumber } from '../utils/formatCurrency';
import { UNITS } from '../utils/constants';

export default function InventoryPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [restockingItem, setRestockingItem] = useState(null);
  
  // Forms
  const [formData, setFormData] = useState({
    name: '', unit: 'gram', buyPricePerUnit: '', currentStock: '', minimumStock: ''
  });
  const [restockQty, setRestockQty] = useState('');

  const { data: ingredients, execute: fetchIngredients, loading } = useApi(api.getIngredients);
  const { execute: createIngredient, loading: creating } = useApi(api.createIngredient);
  const { execute: updateIngredient, loading: updating } = useApi(api.updateIngredient);
  const { execute: deleteIngredient } = useApi(api.deleteIngredient);
  const { execute: restock, loading: restocking } = useApi(api.restockIngredient);

  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        unit: item.unit,
        buyPricePerUnit: item.buyPricePerUnit,
        currentStock: item.currentStock,
        minimumStock: item.minimumStock
      });
    } else {
      setEditingItem(null);
      setFormData({ name: '', unit: 'gram', buyPricePerUnit: '', currentStock: '', minimumStock: '' });
    }
    setIsModalOpen(true);
  };

  const handleOpenRestock = (item) => {
    setRestockingItem(item);
    setRestockQty('');
    setIsRestockModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateIngredient(editingItem.id, formData);
      } else {
        await createIngredient(formData);
      }
      setIsModalOpen(false);
      fetchIngredients();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!restockQty || restockQty <= 0) return;
    
    try {
      await restock(restockingItem.id, restockQty);
      setIsRestockModalOpen(false);
      fetchIngredients();
      alert('Restock berhasil! Transaksi Kas Keluar otomatis dicatat.');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Yakin ingin menghapus ${name}? Data tidak bisa dikembalikan.`)) {
      try {
        await deleteIngredient(id);
        fetchIngredients();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Master Inventaris</h1>
        <Button icon={<Plus />} onClick={() => handleOpenModal()}>Tambah Bahan Baku</Button>
      </div>

      <Card>
        <CardBody style={{ padding: 0 }}>
          {loading ? (
            <div className="loading-container"><div className="spinner"></div></div>
          ) : !ingredients || ingredients.length === 0 ? (
            <div className="empty-state">
              <h4>Belum ada bahan baku</h4>
              <p>Tambahkan bahan baku pertama Anda untuk memulai.</p>
            </div>
          ) : (
            <Table headers={['Nama Bahan', 'Stok Saat Ini', 'Batas Minimum', 'Harga Beli Satuan', 'Total Nilai Stok', 'Aksi']}>
              {ingredients.map(item => {
                const isLowStock = item.currentStock <= item.minimumStock;
                const stockValue = item.currentStock * item.buyPricePerUnit;
                
                return (
                  <tr key={item.id}>
                    <td className="font-semibold">{item.name}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={isLowStock ? 'text-danger font-bold' : ''}>
                          {formatNumber(item.currentStock)} {item.unit}
                        </span>
                        {isLowStock && (
                          <Badge variant="warning" className="text-[10px] px-1 py-0">Low</Badge>
                        )}
                      </div>
                    </td>
                    <td>{formatNumber(item.minimumStock)} {item.unit}</td>
                    <td>{formatCurrency(item.buyPricePerUnit)} / {item.unit}</td>
                    <td>{formatCurrency(stockValue)}</td>
                    <td>
                      <div className="flex gap-2">
                        <Button 
                          variant="accent" 
                          size="sm" 
                          icon={<ArrowDownToLine size={14} />} 
                          onClick={() => handleOpenRestock(item)}
                          title="Restock (Beli)"
                        >
                          Restock
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          icon={<Edit2 size={14} />} 
                          onClick={() => handleOpenModal(item)}
                          title="Edit"
                        />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          icon={<Trash2 size={14} className="text-danger" />} 
                          onClick={() => handleDelete(item.id, item.name)}
                          title="Hapus"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Add/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingItem ? 'Edit Bahan Baku' : 'Tambah Bahan Baku'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <Input 
              label="Nama Bahan" 
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="Contoh: Kopi Bubuk"
            />
            <Select 
              label="Satuan" 
              required
              value={formData.unit}
              onChange={e => setFormData({...formData, unit: e.target.value})}
              options={UNITS}
            />
          </div>
          
          <div className="form-row">
            <Input 
              label="Harga Beli (Rp) per Satuan" 
              type="number" 
              required
              step="any"
              value={formData.buyPricePerUnit}
              onChange={e => setFormData({...formData, buyPricePerUnit: e.target.value})}
            />
            <Input 
              label={`Batas Minimum Stok (${formData.unit})`} 
              type="number" 
              required
              step="any"
              value={formData.minimumStock}
              onChange={e => setFormData({...formData, minimumStock: e.target.value})}
            />
          </div>

          {!editingItem && (
            <Input 
              label={`Stok Awal (${formData.unit})`} 
              type="number" 
              required
              step="any"
              value={formData.currentStock}
              onChange={e => setFormData({...formData, currentStock: e.target.value})}
            />
          )}

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit" loading={creating || updating}>Simpan</Button>
          </div>
        </form>
      </Modal>

      {/* Restock Modal */}
      <Modal 
        isOpen={isRestockModalOpen} 
        onClose={() => setIsRestockModalOpen(false)} 
        title={`Restock: ${restockingItem?.name}`}
      >
        {restockingItem && (
          <form onSubmit={handleRestockSubmit}>
            <div className="alert-card info mb-6" style={{ background: 'var(--color-surface-alt)', border: 'none' }}>
              <div className="alert-content text-sm">
                <p>Harga saat ini: <strong>{formatCurrency(restockingItem.buyPricePerUnit)} / {restockingItem.unit}</strong></p>
                <p className="mt-1 text-gray-500">Mencatat restock akan otomatis membuat entri Kas Keluar pada hari ini.</p>
              </div>
            </div>

            <Input 
              label={`Jumlah Pembelian (${restockingItem.unit})`} 
              type="number" 
              required
              min="0.1"
              step="any"
              value={restockQty}
              onChange={e => setRestockQty(e.target.value)}
              autoFocus
            />

            {restockQty > 0 && (
              <div className="mt-4 p-4 rounded-md bg-red-50 border border-red-100 flex justify-between items-center">
                <span className="font-semibold text-red-900">Total Biaya (Masuk Kas Keluar):</span>
                <span className="text-xl font-bold text-red-600">
                  {formatCurrency(restockQty * restockingItem.buyPricePerUnit)}
                </span>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <Button type="button" variant="ghost" onClick={() => setIsRestockModalOpen(false)}>Batal</Button>
              <Button type="submit" loading={restocking}>Proses Restock</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
