import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../utils/formatCurrency';
import api from '../../services/api';

export default function POSAddonModal({ isOpen, onClose, menu, onAddToCart }) {
  const [modifiers, setModifiers] = useState([]);
  const [selectedModifiers, setSelectedModifiers] = useState([]); // [{id, name, extraPrice}]
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && menu) {
      setLoading(true);
      setSelectedModifiers([]);
      setNote('');
      api.getModifiers()
        .then(data => setModifiers(data || []))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, menu]);

  const toggleModifier = (mod) => {
    setSelectedModifiers(prev => {
      const exists = prev.find(m => m.id === mod.id);
      if (exists) {
        return prev.filter(m => m.id !== mod.id);
      }
      return [...prev, { id: mod.id, name: mod.name, extraPrice: mod.extraPrice }];
    });
  };

  const modifiersTotal = selectedModifiers.reduce((sum, m) => sum + m.extraPrice, 0);

  const handleConfirm = () => {
    // Build the note string from modifiers + custom note
    const modifierNames = selectedModifiers.map(m => m.name);
    const noteString = [...modifierNames, note.trim()].filter(Boolean).join(', ');

    onAddToCart(menu, selectedModifiers, modifiersTotal, noteString);
    onClose();
  };

  if (!menu) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Tambah Pesanan: ${menu.name}`}>
      {loading ? (
        <div className="p-8 text-center"><div className="spinner inline-block"></div></div>
      ) : (
        <div>
          {/* Modifiers Selection */}
          {modifiers.length > 0 && (
            <div className="mb-5">
              <h4 className="font-semibold text-gray-800 mb-2">Modifier (Opsional)</h4>
              <p className="text-xs text-gray-500 mb-3">Pilih satu atau lebih modifier sesuai permintaan pelanggan.</p>
              
              <div className="grid grid-cols-1 gap-2 max-h-[40vh] overflow-y-auto pr-1">
                {modifiers.map(mod => {
                  const isSelected = selectedModifiers.some(m => m.id === mod.id);
                  return (
                    <div 
                      key={mod.id}
                      onClick={() => toggleModifier(mod)}
                      className={`
                        p-3 rounded-lg border-2 cursor-pointer transition-all flex justify-between items-center
                        ${isSelected ? 'border-primary bg-primary-50' : 'border-gray-200 bg-white hover:border-primary-300'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-5 h-5 rounded flex items-center justify-center border
                          ${isSelected ? 'border-primary bg-primary' : 'border-gray-300'}
                        `}>
                          {isSelected && (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <span className="font-medium text-sm text-gray-800">{mod.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-600">
                        {mod.extraPrice > 0 ? `+${formatCurrency(mod.extraPrice)}` : 'Gratis'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Custom Note */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Catatan Khusus</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Cth: gula setengah, extra plastik..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              style={{ backgroundColor: 'var(--surface-alt, #f9fafb)' }}
            />
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
            <div>
              <div className="text-xs text-gray-500">Harga Item</div>
              <div className="font-bold text-lg text-primary">
                {formatCurrency(menu.sellingPrice + modifiersTotal)}
              </div>
              {modifiersTotal > 0 && (
                <div className="text-xs text-gray-500">
                  ({formatCurrency(menu.sellingPrice)} + {formatCurrency(modifiersTotal)} modifier)
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose}>Batal</Button>
              <Button onClick={handleConfirm}>Tambahkan</Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
