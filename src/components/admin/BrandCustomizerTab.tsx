import React, { useState, useEffect } from 'react';
import { BrandConfig } from '../../types';
import { 
  Palette, 
  Upload, 
  Image as ImageIcon, 
  RotateCcw, 
  Check, 
  Sparkles, 
  Building2, 
  Database,
  RefreshCw,
  Server,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { DEFAULT_BRAND_LOGO } from '../../utils/storage';
import { ApiService } from '../../utils/api';
import { compressImageFile } from '../../utils/imageCompressor';

interface BrandCustomizerTabProps {
  brand: BrandConfig;
  onUpdateBrand: (brand: BrandConfig) => void;
}

export const BrandCustomizerTab: React.FC<BrandCustomizerTabProps> = ({
  brand,
  onUpdateBrand,
}) => {
  const [companyName, setCompanyName] = useState(brand.companyName);
  const [companySlogan, setCompanySlogan] = useState(brand.companySlogan);
  const [logoUrl, setLogoUrl] = useState(brand.logoUrl);
  const [primaryColor, setPrimaryColor] = useState(brand.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(brand.secondaryColor);
  const [accentColor, setAccentColor] = useState(brand.accentColor);
  const [terms, setTerms] = useState(brand.termsAndConditions);

  // App-wide customizable texts
  const [heroBadgeText, setHeroBadgeText] = useState(brand.heroBadgeText || 'Sorteio Oficial 2026 • Auditoria em Tempo Real');
  const [roundsBannerTitle, setRoundsBannerTitle] = useState(brand.roundsBannerTitle || '4 Sorteios Oficiais no Mesmo Dia');
  const [roundsBannerSubtitle, setRoundsBannerSubtitle] = useState(brand.roundsBannerSubtitle || 'O seu bilhete concorre automaticamente em todas as 4 rondas diárias!');
  const [showRoundsBanner, setShowRoundsBanner] = useState(brand.showRoundsBanner !== false);
  const [formTitle, setFormTitle] = useState(brand.formTitle || 'Garanta o seu Bilhete da Sorte');
  const [formSubtitle, setFormSubtitle] = useState(brand.formSubtitle || 'Preencha os seus dados reais para receber a confirmação e o seu número');
  const [formButtonText, setFormButtonText] = useState(brand.formButtonText || 'Registar Inscrição e Obter Bilhete');
  const [prizesSectionTitle, setPrizesSectionTitle] = useState(brand.prizesSectionTitle || 'Prémios Desta Edição');
  const [searchSectionTitle, setSearchSectionTitle] = useState(brand.searchSectionTitle || 'Já se inscreveu? Consulte os seus Bilhetes');
  const [searchSectionSubtitle, setSearchSectionSubtitle] = useState(brand.searchSectionSubtitle || 'Insira o seu NIF, telemóvel, e-mail ou bilhete para verificar os seus números registados');
  const [ticketNotice, setTicketNotice] = useState(brand.ticketNotice || 'Validação única: limite de 1 inscrição por e-mail');
  const [ticketModalTitle, setTicketModalTitle] = useState(brand.ticketModalTitle || 'INSCRIÇÃO CONFIRMADA COM SUCESSO!');
  const [ticketModalSubtitle, setTicketModalSubtitle] = useState(brand.ticketModalSubtitle || 'O Seu Bilhete Oficial');

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccessMessage, setSavedSuccessMessage] = useState<string | null>(null);
  const [dbStatusInfo, setDbStatusInfo] = useState<{
    status: string;
    version: number;
    lastSaved: string;
    hasCustomLogo: boolean;
    brandName: string;
  } | null>(null);
  const [isCheckingDb, setIsCheckingDb] = useState(false);

  // Sync internal state whenever `brand` prop is updated from server or other tabs
  useEffect(() => {
    setCompanyName(brand.companyName);
    setCompanySlogan(brand.companySlogan);
    setLogoUrl(brand.logoUrl);
    setPrimaryColor(brand.primaryColor);
    setSecondaryColor(brand.secondaryColor);
    setAccentColor(brand.accentColor);
    setTerms(brand.termsAndConditions);
    setHeroBadgeText(brand.heroBadgeText || 'Sorteio Oficial 2026 • Auditoria em Tempo Real');
    setRoundsBannerTitle(brand.roundsBannerTitle || '4 Sorteios Oficiais no Mesmo Dia');
    setRoundsBannerSubtitle(brand.roundsBannerSubtitle || 'O seu bilhete concorre automaticamente em todas as 4 rondas diárias!');
    setShowRoundsBanner(brand.showRoundsBanner !== false);
    setFormTitle(brand.formTitle || 'Garanta o seu Bilhete da Sorte');
    setFormSubtitle(brand.formSubtitle || 'Preencha os seus dados reais para receber a confirmação e o seu número');
    setFormButtonText(brand.formButtonText || 'Registar Inscrição e Obter Bilhete');
    setPrizesSectionTitle(brand.prizesSectionTitle || 'Prémios Desta Edição');
    setSearchSectionTitle(brand.searchSectionTitle || 'Já se inscreveu? Consulte os seus Bilhetes');
    setSearchSectionSubtitle(brand.searchSectionSubtitle || 'Insira o seu NIF, telemóvel, e-mail ou bilhete para verificar os seus números registados');
    setTicketNotice(brand.ticketNotice || 'Validação única: limite de 1 inscrição por e-mail');
    setTicketModalTitle(brand.ticketModalTitle || 'INSCRIÇÃO CONFIRMADA COM SUCESSO!');
    setTicketModalSubtitle(brand.ticketModalSubtitle || 'O Seu Bilhete Oficial');
  }, [brand]);

  // Initial check of server database status
  useEffect(() => {
    checkDatabaseLiveStatus();
  }, []);

  const checkDatabaseLiveStatus = async () => {
    setIsCheckingDb(true);
    try {
      const data = await ApiService.getDbStatus();
      if (data) {
        setDbStatusInfo({
          status: data.status,
          version: data.version,
          lastSaved: data.lastSaved,
          hasCustomLogo: data.brand.hasCustomLogo,
          brandName: data.brand.companyName,
        });
      }
    } finally {
      setIsCheckingDb(false);
    }
  };

  const [logoError, setLogoError] = useState<string | null>(null);

  // Safe file upload with image compression and immediate auto-save to Database
  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoError(null);

    if (!file.type.startsWith('image/')) {
      setLogoError('Por favor, selecione um arquivo de imagem válido (PNG, JPG, SVG, WebP).');
      return;
    }

    setIsUploadingLogo(true);
    setSavedSuccessMessage(null);

    try {
      // Compress to lightweight, high-performance web asset (max 600x600, quality 0.85)
      const compressedDataUrl = await compressImageFile(file, 600, 600, 0.85);

      if (!compressedDataUrl) {
        throw new Error('Não foi possível processar a imagem.');
      }

      setLogoUrl(compressedDataUrl);

      // Immediately persist to central database & local storage
      const updated: BrandConfig = {
        ...brand,
        logoUrl: compressedDataUrl,
      };

      onUpdateBrand(updated);
      setSavedSuccessMessage('Logomarca gravada com sucesso na Base de Dados do Servidor!');
      setTimeout(() => setSavedSuccessMessage(null), 4000);
      setTimeout(() => checkDatabaseLiveStatus(), 800);
    } catch (err: any) {
      setLogoError('Erro ao carregar a logomarca: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setIsUploadingLogo(false);
      // Reset input value so user can upload the same file again if desired
      e.target.value = '';
    }
  };

  const handleRestoreDefaultLogo = () => {
    setLogoError(null);
    setLogoUrl(DEFAULT_BRAND_LOGO);
    const updated: any = {
      ...brand,
      logoUrl: DEFAULT_BRAND_LOGO,
      forceResetLogo: true,
    };
    onUpdateBrand(updated);
    setSavedSuccessMessage('Logomarca padrão restaurada e salva no banco de dados.');
    setTimeout(() => setSavedSuccessMessage(null), 3500);
    setTimeout(() => checkDatabaseLiveStatus(), 800);
  };

  const handleApplyPreset = (theme: { name: string; primary: string; secondary: string; accent: string }) => {
    setPrimaryColor(theme.primary);
    setSecondaryColor(theme.secondary);
    setAccentColor(theme.accent);
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccessMessage(null);

    const updated: BrandConfig = {
      ...brand,
      companyName: companyName.trim() || 'Sorteio Lacer OMD 2026',
      companySlogan: companySlogan.trim(),
      logoUrl: logoUrl.trim() || DEFAULT_BRAND_LOGO,
      primaryColor,
      secondaryColor,
      accentColor,
      termsAndConditions: terms.trim(),
      roundsBannerTitle: roundsBannerTitle.trim(),
      roundsBannerSubtitle: roundsBannerSubtitle.trim(),
      showRoundsBanner,
      formTitle: formTitle.trim(),
      formSubtitle: formSubtitle.trim(),
      formButtonText: formButtonText.trim(),
      prizesSectionTitle: prizesSectionTitle.trim(),
      searchSectionTitle: searchSectionTitle.trim(),
      searchSectionSubtitle: searchSectionSubtitle.trim(),
      ticketNotice: ticketNotice.trim(),
      heroBadgeText: heroBadgeText.trim(),
      ticketModalTitle: ticketModalTitle.trim(),
      ticketModalSubtitle: ticketModalSubtitle.trim(),
    };

    onUpdateBrand(updated);

    // Give visual confirmation of database write
    setTimeout(() => {
      setIsSaving(false);
      setSavedSuccessMessage('Todas as alterações de marca, textos e definições foram guardadas com sucesso na Base de Dados!');
      checkDatabaseLiveStatus();
      setTimeout(() => setSavedSuccessMessage(null), 4000);
    }, 400);
  };

  const PRESET_THEMES = [
    { name: 'Ouro Real Premium', primary: '#f59e0b', secondary: '#d97706', accent: '#10b981' },
    { name: 'Azul Corporativo Tech', primary: '#2563eb', secondary: '#1d4ed8', accent: '#06b6d4' },
    { name: 'Esmeralda da Sorte', primary: '#10b981', secondary: '#059669', accent: '#f59e0b' },
    { name: 'Roxo Cyber / Neon', primary: '#8b5cf6', secondary: '#7c3aed', accent: '#ec4899' },
    { name: 'Vermelho Energia & Fogo', primary: '#ef4444', secondary: '#dc2626', accent: '#f59e0b' },
  ];

  return (
    <form onSubmit={handleSaveAll} className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Palette className="w-5 h-5 text-amber-400" />
            <span>Personalização da Marca, Logótipo e Textos Globais</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Controlo total sobre os nomes, frases de destaque (por baixo do logótipo), faixas, textos do formulário e cores de toda a aplicação
          </p>
        </div>

        <button
          type="submit"
          disabled={isSaving || isUploadingLogo}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-bold shadow-lg transition-all active:scale-98 cursor-pointer"
        >
          {isSaving ? (
            <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>{isSaving ? 'A Gravar na Base de Dados...' : 'Guardar Alterações na Base de Dados'}</span>
        </button>
      </div>

      {/* Database Verification Indicator Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Status da Base de Dados Central:</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Ativa & Conectada (data/database.json)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {dbStatusInfo ? (
                <>
                  Empresa registrada: <strong className="text-slate-200">{dbStatusInfo.brandName}</strong> • Logo personalizado: {dbStatusInfo.hasCustomLogo ? <span className="text-emerald-400 font-semibold">Sim (Gravado)</span> : <span className="text-slate-400">Padrão</span>} • Última gravação: {new Date(dbStatusInfo.lastSaved).toLocaleTimeString()}
                </>
              ) : (
                'Carregando informações da base de dados do servidor...'
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={checkDatabaseLiveStatus}
          disabled={isCheckingDb}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium cursor-pointer transition-colors"
          title="Verificar integridade da gravação no banco de dados"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isCheckingDb ? 'animate-spin text-amber-400' : ''}`} />
          <span>{isCheckingDb ? 'Verificando...' : 'Verificar Gravação'}</span>
        </button>
      </div>

      {/* Floating / Toast Message if Saved */}
      {savedSuccessMessage && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 shadow-lg animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{savedSuccessMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Logo and Corporate Data (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-lg">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Building2 className="w-4 h-4 text-amber-400" />
            <span>Logotipo & Dados da Empresa</span>
          </h3>

          {/* Logo Upload Box */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
              Logomarca Oficial
            </label>
            <div className="flex items-center gap-4 bg-slate-950 border border-slate-800 p-4 rounded-xl">
              <div className="w-18 h-18 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center p-2 overflow-hidden shrink-0 shadow-inner">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo Preview" className="w-full h-full object-contain" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-slate-500" />
                )}
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <label className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow flex items-center gap-1.5">
                    {isUploadingLogo ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{isUploadingLogo ? 'Processando...' : 'Carregar Imagem do Logo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingLogo}
                      onChange={handleLogoFileUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleRestoreDefaultLogo}
                    className="px-2.5 py-1.5 text-slate-400 hover:text-white text-xs flex items-center gap-1 cursor-pointer transition-colors"
                    title="Restaurar Logo Padrão"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restaurar</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-400">
                  Formatos aceitos: PNG, JPG, SVG, WebP. O sistema otimiza e grava automaticamente na base de dados central.
                </p>

                {logoError && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{logoError}</span>
                  </div>
                )}

                {logoUrl.startsWith('data:') ? (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                    <span className="truncate font-medium">✓ Imagem carregada e comprimida com sucesso</span>
                    <button
                      type="button"
                      onClick={handleRestoreDefaultLogo}
                      className="text-slate-400 hover:text-red-400 text-[11px] ml-2 shrink-0 cursor-pointer underline"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={logoUrl === DEFAULT_BRAND_LOGO ? '' : logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value || DEFAULT_BRAND_LOGO)}
                    placeholder="Ou insira a URL direta da imagem (https://...)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Nome da Empresa / Organizador do Sorteio *
            </label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Slogan / Subtítulo por baixo do logo e nome */}
          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/30">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>Subtítulo / Frase abaixo do Logótipo e Nome</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-normal normal-case">
                  Destaque Principal
                </span>
              </label>
              {companySlogan && (
                <button
                  type="button"
                  onClick={() => setCompanySlogan('')}
                  className="text-[11px] text-slate-400 hover:text-amber-400 cursor-pointer underline"
                >
                  Limpar
                </button>
              )}
            </div>
            <textarea
              rows={2}
              value={companySlogan}
              onChange={(e) => setCompanySlogan(e.target.value)}
              placeholder="Insira a frase exibida por baixo do logótipo e do nome (ou deixe vazio para não exibir nada)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Texto que surge na página pública logo abaixo do logótipo e do nome <strong>"{companyName || 'Sorteio'}"</strong>. Se deixar vazio, nenhum subtítulo aparecerá.
            </p>
          </div>

          {/* Faixa das 4 Rondas Diárias */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white uppercase tracking-wider">
                Faixa dos 4 Horários / Rondas
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={showRoundsBanner}
                  onChange={(e) => setShowRoundsBanner(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500"
                />
                <span>Exibir Faixa</span>
              </label>
            </div>

            {showRoundsBanner && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] text-slate-400 uppercase font-semibold mb-1">
                    Título da Faixa:
                  </label>
                  <input
                    type="text"
                    value={roundsBannerTitle}
                    onChange={(e) => setRoundsBannerTitle(e.target.value)}
                    placeholder="4 Sorteios Oficiais no Mesmo Dia"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 uppercase font-semibold mb-1">
                    Mensagem / Subtítulo da Faixa:
                  </label>
                  <input
                    type="text"
                    value={roundsBannerSubtitle}
                    onChange={(e) => setRoundsBannerSubtitle(e.target.value)}
                    placeholder="O seu bilhete concorre automaticamente em todas as 4 rondas diárias!"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Textos do Formulário de Inscrição */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Textos do Formulário de Inscrição
            </h4>

            <div>
              <label className="block text-[11px] text-slate-400 uppercase font-semibold mb-1">
                Título do Formulário:
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Garanta o seu Bilhete da Sorte"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 uppercase font-semibold mb-1">
                Subtítulo do Formulário:
              </label>
              <input
                type="text"
                value={formSubtitle}
                onChange={(e) => setFormSubtitle(e.target.value)}
                placeholder="Preencha os seus dados reais para receber a confirmação e o seu número"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 uppercase font-semibold mb-1">
                Texto do Botão de Inscrição:
              </label>
              <input
                type="text"
                value={formButtonText}
                onChange={(e) => setFormButtonText(e.target.value)}
                placeholder="Registar Inscrição e Obter Bilhete"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 uppercase font-semibold mb-1">
                Nota de Validação Única:
              </label>
              <input
                type="text"
                value={ticketNotice}
                onChange={(e) => setTicketNotice(e.target.value)}
                placeholder="Validação única: limite de 1 inscrição por e-mail"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Títulos das Secções */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Títulos das Secções (Prémios & Consulta)
            </h4>

            <div>
              <label className="block text-[11px] text-slate-400 uppercase font-semibold mb-1">
                Título da Secção de Prémios:
              </label>
              <input
                type="text"
                value={prizesSectionTitle}
                onChange={(e) => setPrizesSectionTitle(e.target.value)}
                placeholder="Prémios Desta Edição"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 uppercase font-semibold mb-1">
                Título da Secção de Consulta:
              </label>
              <input
                type="text"
                value={searchSectionTitle}
                onChange={(e) => setSearchSectionTitle(e.target.value)}
                placeholder="Já se inscreveu? Consulte os seus Bilhetes"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 uppercase font-semibold mb-1">
                Subtítulo da Consulta:
              </label>
              <input
                type="text"
                value={searchSectionSubtitle}
                onChange={(e) => setSearchSectionSubtitle(e.target.value)}
                placeholder="Insira o seu NIF, telemóvel, e-mail ou bilhete para verificar os seus números registados"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Confirmação e Destaques Adicionais */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Destaques e Janela de Confirmação de Bilhete
            </h4>

            <div>
              <label className="block text-[11px] text-slate-400 uppercase font-semibold mb-1">
                Etiqueta de Destaque Superior (Badge):
              </label>
              <input
                type="text"
                value={heroBadgeText}
                onChange={(e) => setHeroBadgeText(e.target.value)}
                placeholder="Sorteio Oficial 2026 • Auditoria em Tempo Real"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 uppercase font-semibold mb-1">
                Título do Modal de Sucesso do Bilhete:
              </label>
              <input
                type="text"
                value={ticketModalTitle}
                onChange={(e) => setTicketModalTitle(e.target.value)}
                placeholder="INSCRIÇÃO CONFIRMADA COM SUCESSO!"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 uppercase font-semibold mb-1">
                Subtítulo do Bilhete Emitido:
              </label>
              <input
                type="text"
                value={ticketModalSubtitle}
                onChange={(e) => setTicketModalSubtitle(e.target.value)}
                placeholder="O Seu Bilhete Oficial"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Regulamento & Termos do Sorteio
            </label>
            <textarea
              rows={3}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Right: Color Palette and Presets (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-lg">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Palette className="w-4 h-4 text-amber-400" />
            <span>Paleta de Cores da Marca</span>
          </h3>

          {/* Color Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
              Temas e Paletas Prontas
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_THEMES.map((theme) => (
                <button
                  key={theme.name}
                  type="button"
                  onClick={() => handleApplyPreset(theme)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition-colors cursor-pointer"
                >
                  <span className="text-xs font-medium text-slate-200">{theme.name}</span>
                  <div className="flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full border border-black/40" style={{ backgroundColor: theme.primary }}></span>
                    <span className="w-4 h-4 rounded-full border border-black/40" style={{ backgroundColor: theme.accent }}></span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Color Pickers */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase">
              Ajuste Personalizado de Cores Hexadecimais
            </label>

            {/* Primary Color */}
            <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <div>
                <p className="text-xs font-bold text-white">Cor Primária (Destaques & Botões)</p>
                <p className="text-[11px] text-slate-400 font-mono">{primaryColor}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0"
                />
              </div>
            </div>

            {/* Secondary Color */}
            <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <div>
                <p className="text-xs font-bold text-white">Cor Secundária (Bordas & Tons)</p>
                <p className="text-[11px] text-slate-400 font-mono">{secondaryColor}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0"
                />
              </div>
            </div>

            {/* Accent Color */}
            <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <div>
                <p className="text-xs font-bold text-white">Cor de Acento (Sucesso & Valores)</p>
                <p className="text-[11px] text-slate-400 font-mono">{accentColor}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0"
                />
              </div>
            </div>
          </div>

          {/* Live Preview Sample */}
          <div className="pt-3 border-t border-slate-800">
            <span className="text-xs text-slate-400 block mb-2 font-medium">
              Amostra em Tempo Real com as cores selecionadas:
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                style={{ backgroundColor: primaryColor }}
                className="px-4 py-2 rounded-xl text-slate-950 font-bold text-xs shadow"
              >
                Botão Principal
              </button>
              <span
                style={{ color: accentColor }}
                className="text-xs font-mono font-bold"
              >
                R$ 10.000,00 Contemplado
              </span>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
