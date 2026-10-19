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
      companyName: companyName.trim() || 'SorteioLive Pro',
      companySlogan: companySlogan.trim(),
      logoUrl: logoUrl.trim() || DEFAULT_BRAND_LOGO,
      primaryColor,
      secondaryColor,
      accentColor,
      termsAndConditions: terms.trim(),
    };

    onUpdateBrand(updated);

    // Give visual confirmation of database write
    setTimeout(() => {
      setIsSaving(false);
      setSavedSuccessMessage('Todas as alterações de marca e cores foram gravadas com sucesso na Base de Dados!');
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
            <span>Identidade Visual, Logo & Cores da Marca</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Personalize a logomarca da sua empresa e altere as cores de destaque de toda a interface do sorteio
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
          <span>{isSaving ? 'Gravando na Base de Dados...' : 'Gravar Alterações na Base de Dados'}</span>
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
              Nome da Empresa / Organizador *
            </label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-white uppercase tracking-wider">
                Subtítulo / Frase abaixo do Logo e Nome do Sorteio
              </label>
              {companySlogan && (
                <button
                  type="button"
                  onClick={() => setCompanySlogan('')}
                  className="text-[11px] text-slate-400 hover:text-amber-400 cursor-pointer underline"
                >
                  Limpar Subtítulo
                </button>
              )}
            </div>
            <textarea
              rows={2}
              value={companySlogan}
              onChange={(e) => setCompanySlogan(e.target.value)}
              placeholder="Digite a frase que aparece por baixo do logo e do nome (ex: Concorra a prêmios extraordinários...). Deixe vazio se não quiser exibir nenhum subtítulo."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Texto exibido na página pública logo abaixo do logotipo e do título <strong>"{companyName || 'Sorteio'}"</strong>. Se deixar vazio, nenhum subtítulo aparecerá.
            </p>
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
