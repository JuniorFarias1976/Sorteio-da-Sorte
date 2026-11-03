import React, { useState } from 'react';
import { Prize, DrawWinner } from '../../types';
import { Gift, Plus, Trash2, Edit3, Image, DollarSign, Layers, RefreshCw, Check, AlertCircle, X, RotateCcw } from 'lucide-react';
import { compressImageFile } from '../../utils/imageCompressor';

interface PrizesTabProps {
  prizes: Prize[];
  onUpdatePrizes: (prizes: Prize[], deletedId?: string) => void;
  onResetPrize?: (prizeId: string, clearAssociatedWinners?: boolean) => void;
  winners?: DrawWinner[];
  onUpdateWinners?: (winners: DrawWinner[]) => void;
}

export const PrizesTab: React.FC<PrizesTabProps> = ({ 
  prizes, 
  onUpdatePrizes,
  onResetPrize,
  winners = [],
  onUpdateWinners,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingPrize, setEditingPrize] = useState<Prize | null>(null);
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [saveSuccessToast, setSaveSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [totalQuantity, setTotalQuantity] = useState(1);
  const [drawnQuantity, setDrawnQuantity] = useState(0);
  const [estimatedValue, setEstimatedValue] = useState(1000);
  const [imageUrl, setImageUrl] = useState('');
  const [drawOrder, setDrawOrder] = useState(1);

  const [formError, setFormError] = useState<string | null>(null);
  const [deletingPrize, setDeletingPrize] = useState<Prize | null>(null);
  const [resettingPrize, setResettingPrize] = useState<Prize | null>(null);
  const [showResetAllModal, setShowResetAllModal] = useState<boolean>(false);
  const [clearAssociatedWinners, setClearAssociatedWinners] = useState<boolean>(true);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setSaveSuccessToast(true);
    setTimeout(() => {
      setSaveSuccessToast(false);
      setToastMessage(null);
    }, 3500);
  };

  const openAddModal = () => {
    setFormError(null);
    setEditingPrize(null);
    setTitle('');
    setDescription('');
    setTotalQuantity(1);
    setDrawnQuantity(0);
    setEstimatedValue(1500);
    setImageUrl('');
    setDrawOrder(prizes.length + 1);
    setShowModal(true);
  };

  const openEditModal = (p: Prize) => {
    setFormError(null);
    setEditingPrize(p);
    setTitle(p.title);
    setDescription(p.description);
    setTotalQuantity(p.totalQuantity);
    setDrawnQuantity(p.drawnQuantity);
    setEstimatedValue(p.estimatedValue);
    setImageUrl(p.imageUrl || '');
    setDrawOrder(p.drawOrder);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!title.trim()) {
      setFormError('Por favor, indique o título do prémio.');
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
            drawnQuantity: Number(drawnQuantity),
            estimatedValue: Number(estimatedValue),
            imageUrl: imageUrl.trim() || undefined,
            drawOrder: Number(drawOrder),
          };
        }
        return p;
      });
      onUpdatePrizes(updated);
      triggerToast('Prémio atualizado com sucesso!');
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
      triggerToast('Novo prémio registado com sucesso!');
    }

    setShowModal(false);
  };

  const handleConfirmResetSingle = () => {
    if (!resettingPrize) return;
    if (onResetPrize) {
      onResetPrize(resettingPrize.id, clearAssociatedWinners);
    } else {
      const updated = prizes.map((p) =>
        p.id === resettingPrize.id ? { ...p, drawnQuantity: 0 } : p
      );
      onUpdatePrizes(updated);
      if (clearAssociatedWinners && onUpdateWinners && winners) {
        onUpdateWinners(winners.filter((w) => w.prizeId !== resettingPrize.id));
      }
    }
    const prizeTitle = resettingPrize.title;
    setResettingPrize(null);
    triggerToast(`Prémio "${prizeTitle}" resetado com sucesso! Quantidade sorteada voltou a 0.`);
  };

  const handleConfirmResetAll = () => {
    if (onResetPrize) {
      onResetPrize('all', clearAssociatedWinners);
    } else {
      const updated = prizes.map((p) => ({ ...p, drawnQuantity: 0 }));
      onUpdatePrizes(updated);
      if (clearAssociatedWinners && onUpdateWinners) {
        onUpdateWinners([]);
      }
    }
    setShowResetAllModal(false);
    triggerToast('Todos os prémios foram resetados com sucesso! Sorteios zerados.');
  };

  const handleConfirmDelete = () => {
    if (!deletingPrize) return;
    const targetId = deletingPrize.id;
    onUpdatePrizes(prizes.filter((p) => p.id !== targetId), targetId);
    setDeletingPrize(null);
    setSaveSuccessToast(true);
    setTimeout(() => setSaveSuccessToast(false), 3500);
  };

  // Image presets for convenience
  const PRESET_IMAGES = [
    { label: 'iPhone', url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80' },
    { label: 'PlayStation 5', url: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&auto=format&fit=crop&q=80' },
    { label: 'Smart TV', url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&auto=format&fit=crop&q=80' },
    { label: 'Moto / Veículo', url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80' },
    { label: 'Transferência Bancária / Dinheiro', url: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=600&auto=format&fit=crop&q=80' },
  ];

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFormError(null);

    if (!file.type.startsWith('image/')) {
      setFormError('Por favor, selecione um ficheiro de imagem válido (PNG, JPG, WebP, SVG).');
      return;
    }

    setIsCompressingImage(true);
    try {
      // Compress to ultra-lightweight asset (max 500x500, quality 0.8) so it never overflows browser memory or quota
      const compressedDataUrl = await compressImageFile(file, 500, 500, 0.8);
      if (compressedDataUrl) {
        setImageUrl(compressedDataUrl);
      }
    } catch (err: any) {
      setFormError('Erro ao processar imagem: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setIsCompressingImage(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Gift className="w-5 h-5 text-[#E30613]" />
            <span>Gestão de Prémios e Quantidades ({prizes.length})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Registe os itens que serão sorteados, estipule as unidades disponíveis e acompanhe os prémios atribuídos
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {prizes.some((p) => p.drawnQuantity > 0) && (
            <button
              type="button"
              onClick={() => {
                setClearAssociatedWinners(true);
                setShowResetAllModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer shadow-sm hover:border-amber-400 active:scale-95"
              title="Zerar as unidades já sorteadas de todos os prémios de uma vez"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Resetar Todos os Prémios</span>
            </button>
          )}

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E30613] hover:bg-[#C80510] text-white text-xs font-bold shadow-md shadow-red-600/30 transition-colors cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Novo Prémio</span>
          </button>
        </div>
      </div>

      {saveSuccessToast && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg animate-in fade-in duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage || 'Alterações nos prémios gravadas com sucesso na Base de Dados e em todos os dispositivos!'}</span>
        </div>
      )}

      {/* Grid of Prizes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {prizes.map((prize) => {
          const remaining = prize.totalQuantity - prize.drawnQuantity;
          const percentageDrawn = Math.round((prize.drawnQuantity / (prize.totalQuantity || 1)) * 100);
          const isExhausted = remaining <= 0;

          return (
            <div
              key={prize.id}
              className={`bg-slate-900 border rounded-2xl p-5 flex flex-col justify-between transition-colors shadow-lg relative group ${
                isExhausted ? 'border-red-500/40' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Header tag & Actions */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Ordem #{prize.drawOrder}
                    </span>
                    {prize.drawnQuantity > 0 && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        isExhausted 
                          ? 'bg-red-500/20 text-red-300 border-red-500/30' 
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      }`}>
                        {prize.drawnQuantity} sorteados
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {prize.drawnQuantity > 0 && (
                      <button
                        onClick={() => {
                          setClearAssociatedWinners(true);
                          setResettingPrize(prize);
                        }}
                        className="p-1.5 rounded-lg text-amber-400 hover:text-white hover:bg-amber-500/20 transition-colors cursor-pointer"
                        title={`Resetar sorteios do prémio (${prize.drawnQuantity} já atribuídos)`}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => openEditModal(prize)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Editar Prémio"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingPrize(prize)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Eliminar Prémio"
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

              {/* Progress, values and Reset Action */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Estoque de Unidades:</span>
                  <span className="font-bold text-white">
                    <strong className={isExhausted ? 'text-red-400' : 'text-emerald-400'}>{remaining}</strong> disponíveis <span className="text-slate-500">/ {prize.totalQuantity} total</span>
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isExhausted ? 'bg-red-500' : 'bg-amber-500'}`}
                    style={{ width: `${percentageDrawn}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">Valor Estimado:</span>
                  <span className="font-bold text-emerald-400">
                    € {prize.estimatedValue.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Reset button inside card */}
                {prize.drawnQuantity > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setClearAssociatedWinners(true);
                      setResettingPrize(prize);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98"
                    title={`Zerar os ${prize.drawnQuantity} sorteios deste prémio`}
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Resetar Sorteios ({prize.drawnQuantity} já atribuídos)</span>
                  </button>
                ) : (
                  <div className="w-full py-2 px-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Estoque 100% intacto (0 sorteados)</span>
                  </div>
                )}
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
              <span>{editingPrize ? 'Editar Prémio' : 'Adicionar Novo Prémio'}</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Defina os detalhes, quantidade e imagem do prémio a ser sorteado.
            </p>

            {formError && (
              <div className="bg-red-500/15 border border-red-500/30 text-red-300 p-3 rounded-xl mb-4 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="flex-1">{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Título do Prémio *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder=""
                  autoComplete="off"
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
                  placeholder=""
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
                    Valor Estimado (€)
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

              {/* Reset/Drawn Quantity Control if Editing */}
              {editingPrize && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 font-medium">Sorteios Realizados:</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm font-bold text-white font-mono">
                        {drawnQuantity} de {totalQuantity} atribuídos
                      </span>
                      {drawnQuantity >= totalQuantity && (
                        <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                          Esgotado
                        </span>
                      )}
                    </div>
                  </div>
                  {drawnQuantity > 0 && (
                    <button
                      type="button"
                      onClick={() => setDrawnQuantity(0)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Zerar a contagem de sorteios deste prémio para 0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Zerar para 0 (Reset)</span>
                    </button>
                  )}
                </div>
              )}

              {/* Computer File Upload for Prize Image */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                  Foto / Imagem do Prémio (Carregar do Computador)
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
                          {isCompressingImage ? (
                            <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                          ) : (
                            <Image className="w-4 h-4" />
                          )}
                          <span>{isCompressingImage ? 'Otimizando Imagem...' : 'Selecionar do Computador'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={isCompressingImage}
                            onChange={handleImageFileUpload}
                            className="hidden"
                          />
                        </label>

                        {imageUrl && (
                          <button
                            type="button"
                            onClick={() => setImageUrl('')}
                            className="px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                          >
                            Remover Imagem
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        O sistema comprime e otimiza a imagem automaticamente para gravação segura e instantânea.
                      </p>
                    </div>
                  </div>

                  {/* Optional URL input toggle */}
                  <div className="pt-2 border-t border-slate-900">
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Ou cole uma URL direta de imagem (opcional)..."
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
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingPrize ? 'Guardar Alterações' : 'Guardar Prémio na Base de Dados'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Deletion */}
      {deletingPrize && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-400" />
              <span>Eliminar Prémio</span>
            </h3>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Tem a certeza de que deseja remover o prémio <strong>{deletingPrize.title}</strong> do catálogo e da base de dados?
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingPrize(null)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Reset Single Prize */}
      {resettingPrize && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-400" />
              <span>Resetar Sorteios do Prémio</span>
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Deseja zerar os sorteios do prémio <strong>"{resettingPrize.title}"</strong>?
              <br />
              A quantidade atribuída voltará de <strong>{resettingPrize.drawnQuantity}</strong> para <strong>0 de {resettingPrize.totalQuantity} unidades</strong>, tornando todas as unidades disponíveis para novos sorteios imediatamente.
            </p>

            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={clearAssociatedWinners}
                onChange={(e) => setClearAssociatedWinners(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-amber-500"
              />
              <span className="text-xs text-slate-300">
                Limpar também os contemplados anteriores deste prémio da lista e relatório de vencedores
              </span>
            </label>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setResettingPrize(null)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmResetSingle}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-lg cursor-pointer flex items-center gap-2 transition-all active:scale-95"
              >
                <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                <span>Confirmar e Resetar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Reset ALL Prizes */}
      {showResetAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-400" />
              <span>Resetar Todos os Prémios</span>
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Tem a certeza de que deseja zerar a contagem de sorteios de <strong>todos os prémios</strong> do catálogo? Todas as unidades voltarão a estar 100% disponíveis para novos sorteios.
            </p>

            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={clearAssociatedWinners}
                onChange={(e) => setClearAssociatedWinners(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-amber-500"
              />
              <span className="text-xs text-slate-300">
                Limpar também todo o histórico anterior de vencedores da base de dados
              </span>
            </label>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowResetAllModal(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmResetAll}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-lg cursor-pointer flex items-center gap-2 transition-all active:scale-95"
              >
                <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                <span>Resetar Todos os Prémios</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
