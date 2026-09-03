import React, { useEffect, useState } from 'react';
import { Plus, Edit2, ListChecks, Trash2, Settings2 } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { Input, Select } from '../components/ui/Form';
import { Badge } from '../components/ui/Feedback';
import { useApi } from '../hooks/useApi';
import api from '../services/api';
import { formatCurrency, formatPercent } from '../utils/formatCurrency';
import { MENU_CATEGORIES } from '../utils/constants';

export default function RecipesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [isModifiersModalOpen, setIsModifiersModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  
  // Menu Form
  const [menuForm, setMenuForm] = useState({ name: '', sellingPrice: '', category: MENU_CATEGORIES[0], isActive: true });
  
  // Recipe Form
  const [recipeItems, setRecipeItems] = useState([]);
  const [selectedIngredient, setSelectedIngredient] = useState('');
  const [ingredientQty, setIngredientQty] = useState('');

  // Global Modifiers
  const [modifiers, setModifiers] = useState([]);
  const [modifierForm, setModifierForm] = useState({ name: '', extraPrice: '' });
  const [editingModifier, setEditingModifier] = useState(null);
  const [loadingModifiers, setLoadingModifiers] = useState(false);

  const { data: menuItems, execute: fetchMenu, loading } = useApi(api.getMenuItems);
  const { data: ingredients, execute: fetchIngredients } = useApi(api.getIngredients);
  const { execute: createMenu, loading: creating } = useApi(api.createMenuItem);
  const { execute: updateMenu, loading: updating } = useApi(api.updateMenuItem);
  const { execute: setRecipe, loading: savingRecipe } = useApi(api.setRecipe);

  useEffect(() => {
    fetchMenu();
    fetchIngredients();
  }, [fetchMenu, fetchIngredients]);

  const handleOpenMenuModal = (menu = null) => {
    if (menu) {
      setEditingMenu(menu);
      setMenuForm({
        name: menu.name,
        sellingPrice: menu.sellingPrice,
        category: menu.category,
        isActive: menu.isActive
      });
    } else {
      setEditingMenu(null);
      setMenuForm({ name: '', sellingPrice: '', category: MENU_CATEGORIES[0], isActive: true });
    }
    setIsModalOpen(true);
  };

  const handleOpenRecipeModal = (menu) => {
    setEditingMenu(menu);
    // Transform recipe format for the UI
    setRecipeItems(menu.recipe ? menu.recipe.map(r => ({
      ...r,
      qty: r.quantityNeeded // match local state key
    })) : []);
    setSelectedIngredient('');
    setIngredientQty('');
    setIsRecipeModalOpen(true);
  };

  // --- Global Modifiers ---
  const fetchModifiers = async () => {
    setLoadingModifiers(true);
    try {
      const data = await api.getModifiers();
      setModifiers(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingModifiers(false);
    }
  };

  const handleOpenModifiersModal = () => {
    fetchModifiers();
    setEditingModifier(null);
    setModifierForm({ name: '', extraPrice: '' });
    setIsModifiersModalOpen(true);
  };

  const handleModifierSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingModifier) {
        await api.updateModifier(editingModifier.id, {
          name: modifierForm.name,
          extraPrice: parseFloat(modifierForm.extraPrice) || 0,
        });
      } else {
        await api.createModifier({
          name: modifierForm.name,
          extraPrice: parseFloat(modifierForm.extraPrice) || 0,
        });
      }
      setEditingModifier(null);
      setModifierForm({ name: '', extraPrice: '' });
      fetchModifiers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditModifier = (mod) => {
    setEditingModifier(mod);
    setModifierForm({ name: mod.name, extraPrice: mod.extraPrice });
  };

  const handleDeleteModifier = async (id) => {
    if (window.confirm('Yakin hapus modifier ini?')) {
      try {
        await api.deleteModifier(id);
        fetchModifiers();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleMenuSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMenu) {
        await updateMenu(editingMenu.id, menuForm);
      } else {
        await createMenu(menuForm);
      }
      setIsModalOpen(false);
      fetchMenu();
    } catch (err) {
      alert(err.message);
    }
  };

  const addIngredientToRecipe = () => {
    if (!selectedIngredient || !ingredientQty) return;
    
    const ing = ingredients.find(i => i.id === parseInt(selectedIngredient));
    if (!ing) return;

    // Check if already exists
    if (recipeItems.some(r => r.ingredientId === ing.id)) {
      alert('Bahan ini sudah ada di resep.');
      return;
    }

    setRecipeItems([
      ...recipeItems, 
      { 
        ingredientId: ing.id, 
        ingredientName: ing.name, 
        unit: ing.unit,
        buyPricePerUnit: ing.buyPricePerUnit,
        qty: parseFloat(ingredientQty) 
      }
    ]);
    
    setSelectedIngredient('');
    setIngredientQty('');
  };

  const removeIngredientFromRecipe = (id) => {
    setRecipeItems(recipeItems.filter(r => r.ingredientId !== id));
  };

  const handleRecipeSubmit = async () => {
    try {
      const payload = recipeItems.map(r => ({
        ingredientId: r.ingredientId,
        quantityNeeded: r.qty
      }));
      await setRecipe(editingMenu.id, payload);
      setIsRecipeModalOpen(false);
      fetchMenu();
      alert('Resep & HPP berhasil diperbarui!');
    } catch (err) {
      alert(err.message);
    }
  };

  // Calculate dynamic HPP for recipe modal
  const modalHpp = recipeItems.reduce((sum, item) => sum + (item.buyPricePerUnit * item.qty), 0);
  const modalProfit = editingMenu?.sellingPrice - modalHpp;
  const modalMargin = editingMenu?.sellingPrice > 0 ? (modalProfit / editingMenu?.sellingPrice) * 100 : 0;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Resep & Menu Jual</h1>
        <div className="flex gap-2">
          <Button variant="outline" icon={<Settings2 />} onClick={handleOpenModifiersModal}>Global Modifiers</Button>
          <Button icon={<Plus />} onClick={() => handleOpenMenuModal()}>Tambah Menu</Button>
        </div>
      </div>

      <Card>
        <CardBody style={{ padding: 0 }}>
          {loading ? (
            <div className="loading-container"><div className="spinner"></div></div>
          ) : !menuItems || menuItems.length === 0 ? (
            <div className="empty-state">
              <h4>Belum ada menu</h4>
              <p>Tambahkan menu pertama Anda untuk mulai berjualan.</p>
            </div>
          ) : (
            <Table headers={['Menu & Kategori', 'Harga Jual', 'Total HPP (BOM)', 'Profit Kotor', 'Margin', 'Status', 'Aksi']}>
              {menuItems.map(item => (
                <tr key={item.id} style={{ opacity: item.isActive ? 1 : 0.6 }}>
                  <td>
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.category}</div>
                  </td>
                  <td className="font-bold text-primary">{formatCurrency(item.sellingPrice)}</td>
                  <td>
                    {item.recipe && item.recipe.length > 0 ? (
                      formatCurrency(item.hpp)
                    ) : (
                      <span className="text-warning text-xs font-semibold">Resep Belum Diatur</span>
                    )}
                  </td>
                  <td className={item.profitPerItem > 0 ? 'text-success font-semibold' : 'text-danger font-semibold'}>
                    {formatCurrency(item.profitPerItem)}
                  </td>
                  <td>
                    <Badge variant={item.profitMargin >= 40 ? 'success' : item.profitMargin > 0 ? 'warning' : 'danger'}>
                      {formatPercent(item.profitMargin)}
                    </Badge>
                  </td>
                  <td>
                    <Badge variant={item.isActive ? 'success' : 'neutral'}>
                      {item.isActive ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <Button 
                        variant="accent" 
                        size="sm" 
                        icon={<ListChecks size={14} />} 
                        onClick={() => handleOpenRecipeModal(item)}
                      >
                        Resep BOM
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        icon={<Edit2 size={14} />} 
                        onClick={() => handleOpenMenuModal(item)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Add/Edit Menu Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingMenu ? 'Edit Menu' : 'Tambah Menu Baru'}
      >
        <form onSubmit={handleMenuSubmit}>
          <Input 
            label="Nama Menu" 
            required
            value={menuForm.name}
            onChange={e => setMenuForm({...menuForm, name: e.target.value})}
          />
          <div className="form-row">
            <Input 
              label="Harga Jual (Rp)" 
              type="number" 
              required
              min="0"
              value={menuForm.sellingPrice}
              onChange={e => setMenuForm({...menuForm, sellingPrice: e.target.value})}
            />
            <Select 
              label="Kategori" 
              required
              value={menuForm.category}
              onChange={e => setMenuForm({...menuForm, category: e.target.value})}
              options={MENU_CATEGORIES}
            />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <input 
              type="checkbox" 
              id="isActive"
              checked={menuForm.isActive}
              onChange={e => setMenuForm({...menuForm, isActive: e.target.checked})}
              className="w-4 h-4 text-primary rounded focus:ring-primary border-gray-300"
            />
            <label htmlFor="isActive" className="text-sm cursor-pointer">Menu Aktif (Tampil di Kasir)</label>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit" loading={creating || updating}>Simpan Menu</Button>
          </div>
        </form>
      </Modal>

      {/* Recipe (BOM) Builder Modal */}
      <Modal 
        isOpen={isRecipeModalOpen} 
        onClose={() => setIsRecipeModalOpen(false)} 
        title={`Resep BOM: ${editingMenu?.name}`}
        size="lg"
      >
        {/* Ingredient Picker */}
        <div className="bg-surface-alt p-4 rounded-lg border border-border-light mb-6 flex items-end gap-3 flex-wrap">
          <div style={{ flex: 2, minWidth: '200px' }}>
            <Select 
              label="Pilih Bahan Baku" 
              value={selectedIngredient}
              onChange={e => setSelectedIngredient(e.target.value)}
              options={[
                {value: '', label: '-- Pilih Bahan --'},
                ...(ingredients || []).map(i => ({ value: i.id, label: `${i.name} (${formatCurrency(i.buyPricePerUnit)}/${i.unit})` }))
              ]}
              style={{ marginBottom: 0 }}
            />
          </div>
          <div style={{ flex: 1, minWidth: '100px' }}>
            <Input 
              label="Takaran (Qty)" 
              type="number"
              step="any"
              min="0"
              value={ingredientQty}
              onChange={e => setIngredientQty(e.target.value)}
              style={{ marginBottom: 0 }}
            />
          </div>
          <Button type="button" onClick={addIngredientToRecipe} disabled={!selectedIngredient || !ingredientQty}>
            Tambah
          </Button>
        </div>

        {/* Recipe Table */}
        {recipeItems.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-sm border-2 border-dashed border-gray-200 rounded-lg">
            Belum ada bahan dalam resep ini.
          </div>
        ) : (
          <Table headers={['Bahan', 'Takaran', 'Harga/Satuan', 'Subtotal HPP', '']}>
            {recipeItems.map((item, idx) => (
              <tr key={idx}>
                <td className="font-medium">{item.ingredientName}</td>
                <td>{item.qty} {item.unit}</td>
                <td className="text-gray-500">{formatCurrency(item.buyPricePerUnit)}</td>
                <td className="font-semibold text-danger">{formatCurrency(item.buyPricePerUnit * item.qty)}</td>
                <td className="text-right">
                  <button type="button" onClick={() => removeIngredientFromRecipe(item.ingredientId)} className="text-danger hover:text-red-700 p-1">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </Table>
        )}

        {/* Dynamic HPP Summary */}
        <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 flex justify-between items-center flex-wrap gap-4">
          <div>
            <div className="text-sm text-gray-600 mb-1">Harga Jual Menu: <strong>{formatCurrency(editingMenu?.sellingPrice)}</strong></div>
            <div className="text-sm font-semibold flex items-center gap-2">
              Estimasi Profit Kotor: 
              <span className={modalProfit > 0 ? 'text-success' : 'text-danger'}>{formatCurrency(modalProfit)}</span>
              <Badge variant={modalMargin >= 40 ? 'success' : modalMargin > 0 ? 'warning' : 'danger'}>{formatPercent(modalMargin)}</Badge>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-red-900 mb-1">Total HPP / Porsi</div>
            <div className="text-2xl font-extrabold text-red-600">{formatCurrency(modalHpp)}</div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <Button type="button" variant="ghost" onClick={() => setIsRecipeModalOpen(false)}>Tutup</Button>
          <Button type="button" loading={savingRecipe} onClick={handleRecipeSubmit}>Simpan Resep & HPP</Button>
        </div>
      </Modal>

      {/* Global Modifiers Modal */}
      <Modal
        isOpen={isModifiersModalOpen}
        onClose={() => setIsModifiersModalOpen(false)}
        title="Global Modifiers"
        size="lg"
      >
        <p className="text-sm text-gray-500 mb-4">
          Modifiers adalah opsi tambahan yang bisa dipilih kasir saat membuat pesanan (contoh: Less Ice, Extra Shot, Plastik). 
          Berlaku untuk semua menu di bisnis aktif.
        </p>

        {/* Add/Edit Modifier Form */}
        <form onSubmit={handleModifierSubmit} className="bg-surface-alt p-4 rounded-lg border border-border-light mb-6 flex items-end gap-3 flex-wrap">
          <div style={{ flex: 2, minWidth: '180px' }}>
            <Input 
              label="Nama Modifier" 
              required
              value={modifierForm.name}
              onChange={e => setModifierForm({...modifierForm, name: e.target.value})}
              placeholder="Cth: Less Ice, Extra Shot"
              style={{ marginBottom: 0 }}
            />
          </div>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <Input 
              label="Harga Tambahan (Rp)" 
              type="number"
              min="0"
              value={modifierForm.extraPrice}
              onChange={e => setModifierForm({...modifierForm, extraPrice: e.target.value})}
              placeholder="0"
              style={{ marginBottom: 0 }}
            />
          </div>
          <div className="flex gap-2">
            {editingModifier && (
              <Button type="button" variant="ghost" onClick={() => {
                setEditingModifier(null);
                setModifierForm({ name: '', extraPrice: '' });
              }}>
                Batal
              </Button>
            )}
            <Button type="submit">
              {editingModifier ? 'Update' : 'Tambah'}
            </Button>
          </div>
        </form>

        {/* Modifier List */}
        {loadingModifiers ? (
          <div className="loading-container"><div className="spinner"></div></div>
        ) : modifiers.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm border-2 border-dashed border-gray-200 rounded-lg">
            Belum ada modifier. Tambahkan modifier pertama di atas.
          </div>
        ) : (
          <Table headers={['Nama Modifier', 'Harga Tambahan', 'Aksi']}>
            {modifiers.map(mod => (
              <tr key={mod.id}>
                <td className="font-semibold">{mod.name}</td>
                <td>
                  {mod.extraPrice > 0 ? (
                    <span className="text-primary font-medium">+{formatCurrency(mod.extraPrice)}</span>
                  ) : (
                    <span className="text-gray-400">Gratis</span>
                  )}
                </td>
                <td>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      icon={<Edit2 size={14} />} 
                      onClick={() => handleEditModifier(mod)}
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      icon={<Trash2 size={14} className="text-danger" />} 
                      onClick={() => handleDeleteModifier(mod.id)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Modal>
    </div>
  );
}
