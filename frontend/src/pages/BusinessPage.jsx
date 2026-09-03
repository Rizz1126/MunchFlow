import React, { useEffect, useState } from 'react';
import { Building2, Plus, Users, Edit2, Trash2, Shield } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Form';
import { Badge } from '../components/ui/Feedback';
import { useApi } from '../hooks/useApi';
import api from '../services/api';
import { formatDateTime } from '../utils/formatCurrency';
import { useBusiness } from '../contexts/BusinessContext';
import { ACCESSIBLE_MENU_OPTIONS } from '../utils/constants';

export default function BusinessPage() {
  const { businesses, refreshBusinesses } = useBusiness();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBiz, setEditingBiz] = useState(null);
  const [formData, setFormData] = useState({ name: '', address: '', phone: '' });

  // Users Management Modal
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  const [selectedBiz, setSelectedBiz] = useState(null);
  
  // Access Editor state
  const [editingAccess, setEditingAccess] = useState(null); // userId being edited
  const [accessMenusForm, setAccessMenusForm] = useState([]);
  
  const { data: bizUsers, execute: fetchBizUsers, loading: loadingUsers } = useApi(api.getBusinessUsers);
  const { data: allUsers, execute: fetchAllUsers } = useApi(api.getAllUsers);

  useEffect(() => {
    if (isUsersModalOpen && selectedBiz) {
      fetchBizUsers(selectedBiz.id);
      fetchAllUsers();
    }
  }, [isUsersModalOpen, selectedBiz, fetchBizUsers, fetchAllUsers]);

  const handleOpenModal = (biz = null) => {
    if (biz) {
      setEditingBiz(biz);
      setFormData({ name: biz.name, address: biz.address || '', phone: biz.phone || '' });
    } else {
      setEditingBiz(null);
      setFormData({ name: '', address: '', phone: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBiz) {
        await api.updateBusiness(editingBiz.id, formData);
      } else {
        await api.createBusiness(formData);
      }
      setIsModalOpen(false);
      refreshBusinesses();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Yakin ingin menghapus bisnis ${name}?`)) {
      try {
        await api.deleteBusiness(id);
        refreshBusinesses();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleOpenUsers = (biz) => {
    setSelectedBiz(biz);
    setEditingAccess(null);
    setIsUsersModalOpen(true);
  };

  const handleAssignUser = async (userId) => {
    try {
      // Assign with default menus: pos, cash, dashboard
      const defaultMenus = 'dashboard,pos,cash';
      await api.assignUserToBusiness(selectedBiz.id, userId, defaultMenus);
      fetchBizUsers(selectedBiz.id);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUnassignUser = async (userId) => {
    if (window.confirm('Hapus akses user ini?')) {
      try {
        await api.unassignUserFromBusiness(selectedBiz.id, userId);
        fetchBizUsers(selectedBiz.id);
      } catch (err) {
        alert(err.message);
      }
    }
  };

  // Access menu editing
  const handleOpenAccessEditor = (user) => {
    setEditingAccess(user.id);
    const currentMenus = user.accessibleMenus ? user.accessibleMenus.split(',').map(s => s.trim()) : [];
    setAccessMenusForm(currentMenus);
  };

  const handleToggleMenu = (key) => {
    setAccessMenusForm(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleSaveAccess = async (userId) => {
    try {
      const accessibleMenus = accessMenusForm.length > 0 ? accessMenusForm.join(',') : null;
      await api.updateUserAccess(selectedBiz.id, userId, accessibleMenus);
      setEditingAccess(null);
      fetchBizUsers(selectedBiz.id);
    } catch (err) {
      alert(err.message);
    }
  };

  // Filter out users who are already assigned to the selected business
  const unassignedUsers = allUsers?.filter(u => 
    u.role !== 'owner' && // Owners have access to everything, don't need assignment
    !bizUsers?.some(bu => bu.id === u.id)
  ) || [];

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Kelola Bisnis & Cabang</h1>
        <Button icon={<Plus />} onClick={() => handleOpenModal()}>Tambah Bisnis</Button>
      </div>

      <Card>
        <CardBody style={{ padding: 0 }}>
          {!businesses || businesses.length === 0 ? (
            <div className="empty-state">
              <h4>Belum ada bisnis</h4>
              <p>Tambahkan bisnis pertama Anda untuk memulai.</p>
            </div>
          ) : (
            <Table headers={['Nama Bisnis', 'Alamat', 'No. HP', 'Tanggal Dibuat', 'Aksi']}>
              {businesses.map(biz => (
                <tr key={biz.id}>
                  <td className="font-semibold">
                    <div className="flex items-center gap-2">
                      <Building2 size={16} className="text-gray-400" />
                      {biz.name}
                    </div>
                  </td>
                  <td>{biz.address || '-'}</td>
                  <td>{biz.phone || '-'}</td>
                  <td>{formatDateTime(biz.createdAt)}</td>
                  <td>
                    <div className="flex gap-2">
                      <Button 
                        variant="accent" 
                        size="sm" 
                        icon={<Users size={14} />} 
                        onClick={() => handleOpenUsers(biz)}
                      >
                        Akses User
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        icon={<Edit2 size={14} />} 
                        onClick={() => handleOpenModal(biz)}
                      />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        icon={<Trash2 size={14} className="text-danger" />} 
                        onClick={() => handleDelete(biz.id, biz.name)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Add/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingBiz ? 'Edit Bisnis' : 'Tambah Bisnis'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <Input 
              label="Nama Bisnis / Cabang" 
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="Contoh: Cabang Sudirman"
            />
            <Input 
              label="Nomor HP" 
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
            />
          </div>
          <Input 
            label="Alamat" 
            value={formData.address}
            onChange={e => setFormData({...formData, address: e.target.value})}
          />
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit">Simpan</Button>
          </div>
        </form>
      </Modal>

      {/* Users Access Modal */}
      <Modal 
        isOpen={isUsersModalOpen} 
        onClose={() => setIsUsersModalOpen(false)} 
        title={`Akses User: ${selectedBiz?.name}`}
      >
        <div className="mb-6">
          <h4 className="text-sm font-semibold mb-3">User yang Memiliki Akses</h4>
          {loadingUsers ? (
            <div className="text-center p-4"><div className="spinner inline-block"></div></div>
          ) : bizUsers?.length > 0 ? (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {bizUsers.map(u => (
                <div key={u.id} className="p-3 border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <div className="font-medium">{u.displayName}</div>
                      <div className="text-xs text-gray-500">@{u.username}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={u.role === 'owner' ? 'primary' : 'secondary'}>{u.role}</Badge>
                      {u.role !== 'owner' && (
                        <div className="flex gap-1">
                          <button 
                            className="text-primary hover:bg-blue-50 p-2 rounded-md transition-colors"
                            onClick={() => editingAccess === u.id ? setEditingAccess(null) : handleOpenAccessEditor(u)}
                            title="Atur akses menu"
                          >
                            <Shield size={16} />
                          </button>
                          <button 
                            className="text-danger hover:bg-red-50 p-2 rounded-md transition-colors"
                            onClick={() => handleUnassignUser(u.id)}
                            title="Hapus akses"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Show current access menus */}
                  {u.role !== 'owner' && (
                    <div className="text-xs text-gray-500">
                      Akses: {u.accessibleMenus 
                        ? u.accessibleMenus.split(',').map(s => s.trim()).map(key => {
                            const opt = ACCESSIBLE_MENU_OPTIONS.find(o => o.key === key);
                            return opt ? opt.label : key;
                          }).join(', ')
                        : <span className="text-warning font-medium">Belum diatur</span>
                      }
                    </div>
                  )}
                  
                  {/* Access Editor */}
                  {editingAccess === u.id && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-xs font-semibold mb-2">Pilih Menu yang Dapat Diakses:</div>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {ACCESSIBLE_MENU_OPTIONS.map(opt => (
                          <label 
                            key={opt.key} 
                            className="flex items-center gap-2 cursor-pointer text-sm p-2 rounded hover:bg-white transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={accessMenusForm.includes(opt.key)}
                              onChange={() => handleToggleMenu(opt.key)}
                              className="w-4 h-4 text-primary rounded focus:ring-primary border-gray-300"
                            />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => setEditingAccess(null)}>Batal</Button>
                        <Button size="sm" onClick={() => handleSaveAccess(u.id)}>Simpan Akses</Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-sm p-4 bg-gray-50 rounded-lg text-center">Belum ada user staf/kasir yang ditugaskan.</div>
          )}
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-3">Tambahkan Akses User</h4>
          {unassignedUsers.length > 0 ? (
            <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto">
              {unassignedUsers.map(u => (
                <div key={u.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div>
                    <div className="font-medium text-sm">{u.displayName}</div>
                    <div className="text-xs text-gray-500">@{u.username} • {u.role}</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleAssignUser(u.id)}>Beri Akses</Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-sm italic">Semua user sudah ditugaskan ke bisnis ini.</div>
          )}
        </div>
      </Modal>
    </div>
  );
}
