import React, { useState } from 'react';
import { Prize } from '../../types';
import { Gift, Plus, Trash2, Edit3, Image, DollarSign, Layers } from 'lucide-react';

interface PrizesTabProps {
  prizes: Prize[];
  onUpdatePrizes: (prizes: Prize[]) => void;
}

export const PrizesTab: React.FC<PrizesTabProps> = ({ prizes, onUpdatePrizes }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingPrize, setEditingPrize] = useState<Prize | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [totalQuantity, setTotalQuantity] = useState(1);
  const [estimatedValue, setEstimatedValue] = useState(1000);
  const [imageUrl, setImageUrl] = useState('');
  const [drawOrder, setDrawOrder] = useState(1);

  const openAddModal = () => {
    setEditingPrize(null);
    setTitle('');
    setDescription('');
    setTotalQuantity(1);
    setEstimatedValue(1500);
    setImageUrl('');
    setDrawOrder(prizes.length + 1);
    setShowModal(true);
  };

  const openEditModal = (p: Prize) => {
    setEditingPrize(p);
    setTitle(p.title);
    setDescription(p.description);
    setTotalQuantity(p.totalQuantity);
    setEstimatedValue(p.estimatedValue);
    setImageUrl(p.imageUrl || '');
    setDrawOrder(p.drawOrder);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Preencha o título do prêmio.');
      return;
    }

    if (editingPrize) {
      const updated = prizes.map((p) => {
        if (p.id === editingPrize.id) {
          return {
            ...p,
            title: title.trim(),
            description: description.trim(),
            totalQuantity: Number(totalQuantity),
            estimatedValue: Number(estimatedValue),
            imageUrl: imageUrl.trim() || undefined,
            drawOrder: Number(drawOrder),
          };
        }
        return p;
      });
      onUpdatePrizes(updated);
    } else {
      const newPrize: Prize = {
        id: `prz-${Date.now()}`,
        title: title.trim(),
        description: description.trim(),
        totalQuantity: Number(totalQuantity),
        drawnQuantity: 0,
        estimatedValue: Number(estimatedValue),
        imageUrl: imageUrl.trim() || undefined,
        drawOrder: Number(drawOrder),
      };
      onUpdatePrizes([...prizes, newPrize]);
    }

    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este prêmio?')) {
      onUpdatePrizes(prizes.filter((p) => p.id !== id));
    }
  };

  // Image presets for convenience
  const PRESET_IMAGES = [
    { label: 'iPhone', url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80' },
    { label: 'PlayStation 5', url: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&auto=format&fit=crop&q=80' },
    { label: 'Smart TV', url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&auto=format&fit=crop&q=80' },
    { label: 'Moto / Veículo', url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80' },
    { label: 'Dinheiro / Pix', url: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=600&auto=format&fit=crop&q=80' },
  ];

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WebP, SVG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-400" />
            <span>Gestão de Prêmios e Quantidades ({prizes.length})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cadastre os itens que serão sorteados, estipule as unidades disponíveis e acompanhe o estoque de prêmios
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Novo Prêmio</span>
        </button>
      </div>

      {/* Grid of Prizes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {prizes.map((prize) => {
          const remaining = prize.totalQuantity - prize.drawnQuantity;
          const percentageDrawn = Math.round((prize.drawnQuantity / (prize.totalQuantity || 1)) * 100);

          return (
            <div
              key={prize.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-colors shadow-lg relative group"
            >
              <div>
                {/* Header tag & Actions */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    Ordem de Sorteio #{prize.drawOrder}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(prize)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Editar Prêmio"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(prize.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Excluir Prêmio"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Prize Image */}
                <div className="h-40 w-full rounded-xl overflow-hidden mb-4 bg-slate-950 border border-slate-800">
                  {prize.imageUrl ? (
                    <img
                      src={prize.imageUrl}
                      alt={prize.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-amber-400">
                      <Gift className="w-12 h-12" />
                    </div>
                  )}
                </div>

                <h3 className="text-base font-bold text-white mb-1">
                  {prize.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                  {prize.description || 'Sem descrição informada.'}
                </p>
              </div>

              {/* Progress and values */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Estoque de Unidades:</span>
                  <span className="font-bold text-white">
                    {remaining} disponíveis <span className="text-slate-500">/ {prize.totalQuantity} total</span>
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${percentageDrawn}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">Valor Unitário:</span>
                  <span className="font-bold text-emerald-400">
                    R$ {prize.estimatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-400" />
              <span>{editingPrize ? 'Editar Prêmio' : 'Adicionar Novo Prêmio'}</span>
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Defina os detalhes, quantidade e imagem do prêmio a ser sorteado.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Título do Prêmio *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: PlayStation 5 Slim 1TB"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Descrição dos Detalhes
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Aparelho novo, lacrado, acompanha 2 controles..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Qtd Estipulada *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={totalQuantity}
                    onChange={(e) => setTotalQuantity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Valor Estimado (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={estimatedValue}
                    onChange={(e) => setEstimatedValue(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Ordem de Sorteio
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={drawOrder}
                    onChange={(e) => setDrawOrder(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Computer File Upload for Prize Image */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                  Foto / Imagem do Prêmio (Carregar do Computador)
                </label>
                
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-4">
                    {/* Preview box */}
                    <div className="w-20 h-20 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                      {imageUrl ? (
                        <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Image className="w-8 h-8 text-slate-600" />
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer transition-colors shadow flex items-center gap-2">
                          <Image className="w-4 h-4" />
                          <span>Selecionar do Computador</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageFileUpload}
                            className="hidden"
                          />
                        </label>

                        {imageUrl && (
                          <button
                            type="button"
                            onClick={() => setImageUrl('')}
                            className="px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
                          >
                            Remover Imagem
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Selecione um arquivo JPG, PNG ou WebP diretamente do seu dispositivo.
                      </p>
                    </div>
                  </div>

                  {/* Optional URL input toggle */}
                  <div className="pt-2 border-t border-slate-900">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Ou cole uma URL externa de imagem (opcional)..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />

                    {/* Quick presets */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[10px] text-slate-500">Presets rápidos:</span>
                      {PRESET_IMAGES.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setImageUrl(preset.url)}
                          className="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-800 transition-colors"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow"
                >
                  {editingPrize ? 'Salvar Alterações' : 'Cadastrar Prêmio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
