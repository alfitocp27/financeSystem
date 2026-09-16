import React, { useState } from 'react';
import { X, Tag } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import type { CategoryType } from '../types/database.types';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ isOpen, onClose, onShowToast }) => {
  const { addCategory } = useFinance();

  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('expense');
  const [color, setColor] = useState('#B9924F');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    await addCategory({
      name: name.trim(),
      type,
      color,
    });
    setIsSubmitting(false);
    setName('');
    onClose();
    if (onShowToast) onShowToast(`Kategori "${name.trim()}" berhasil dibuat`);
  };

  const colors = [
    '#B9924F', '#D6B875', '#6683A3', '#5F8A70', '#A85F68', '#A98245', '#7C8491', '#8b5cf6', '#ec4899'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-surface-modal border border-border-default w-full max-w-sm rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary-soft text-text-gold rounded-xl">
              <Tag className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-text-primary">Tambah Kategori Baru</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-primary rounded-full hover:bg-surface-elevated transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Type */}
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">Tipe Kategori</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`py-2 text-xs font-bold rounded-xl border transition-all min-h-[40px] ${
                  type === 'expense'
                    ? 'bg-semantic-rose-soft border-semantic-rose/25 text-semantic-rose-text'
                    : 'bg-surface-elevated border-border-default text-text-secondary hover:text-text-primary'
                }`}
              >
                Pengeluaran
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`py-2 text-xs font-bold rounded-xl border transition-all min-h-[40px] ${
                  type === 'income'
                    ? 'bg-semantic-green-soft border-semantic-green/25 text-semantic-green-text'
                    : 'bg-surface-elevated border-border-default text-text-secondary hover:text-text-primary'
                }`}
              >
                Pemasukan
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">Nama Kategori</label>
            <input
              type="text"
              placeholder="Misal: Skripsi, Kopi & Cafe, Beasiswa"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border-default rounded-xl text-sm font-semibold text-text-primary focus:outline-none focus:border-border-gold-focus placeholder:text-text-muted"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1.5">Warna Aksen</label>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? 'scale-110 ring-2 ring-offset-2 ring-primary ring-offset-surface-modal' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-primary hover:bg-primary-hover text-slate-950 rounded-xl font-bold text-sm shadow-sm transition-all disabled:opacity-50 min-h-[44px]"
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan Kategori'}
          </button>
        </form>
      </div>
    </div>
  );
};
