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
  AlertCircle,
  Lock,
  Key,
  Calendar,
  ArrowRight,
  FileText,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { DEFAULT_BRAND_LOGO, isLightColor } from '../../utils/storage';
import { ApiService } from '../../utils/api';
import { compressImageFile } from '../../utils/imageCompressor';
import { openPdfDocument } from '../../utils/export';

interface BrandCustomizerTabProps {
  brand: BrandConfig;
  onUpdateBrand: (brand: BrandConfig) => void;
  onNavigateToCalendar?: () => void;
}

export const BrandCustomizerTab: React.FC<BrandCustomizerTabProps> = ({
  brand,
  onUpdateBrand,
  onNavigateToCalendar,
}) => {
  const [companyName, setCompanyName] = useState(brand.companyName);
  const [companySlogan, setCompanySlogan] = useState(brand.companySlogan);
  const [logoUrl, setLogoUrl] = useState(brand.logoUrl);
  const [primaryColor, setPrimaryColor] = useState(brand.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(brand.secondaryColor);
  const [accentColor, setAccentColor] = useState(brand.accentColor);
  const [backgroundColor, setBackgroundColor] = useState(brand.backgroundColor || '#FFFFFF');
  const [textColor, setTextColor] = useState(brand.textColor || '#0F172A');
  const [terms, setTerms] = useState(brand.termsAndConditions);
  const [adminPassword, setAdminPassword] = useState(brand.adminPassword || 'admin');

  // Display toggles (Hero and Navbar)
  const [showNavbar, setShowNavbar] = useState(brand.showNavbar !== false);
  const [heroLogoSize, setHeroLogoSize] = useState<'normal' | 'medium' | 'large' | 'xlarge' | '2xlarge'>(
    (brand.heroLogoSize as any) || 'large'
  );
  const [showHeroTitle, setShowHeroTitle] = useState(brand.showHeroTitle === true);
  const [showNavbarBrandText, setShowNavbarBrandText] = useState(brand.showNavbarBrandText === true);
  const [showNavbarParticipateButton, setShowNavbarParticipateButton] = useState(brand.showNavbarParticipateButton === true);
  const [showPrizesSection, setShowPrizesSection] = useState(brand.showPrizesSection === true);

  // App-wide customizable texts
  const [heroBadgeText, setHeroBadgeText] = useState(brand.heroBadgeText || 'Sorteio Oficial 2026 • Auditoria em Tempo Real');
  const [roundsBannerTitle, setRoundsBannerTitle] = useState(brand.roundsBannerTitle || '2 Sorteios Oficiais por Dia');
  const [roundsBannerSubtitle, setRoundsBannerSubtitle] = useState(brand.roundsBannerSubtitle || 'O seu bilhete concorre automaticamente em todas as rondas e datas programadas!');
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
  const [regulationPdfUrl, setRegulationPdfUrl] = useState(brand.regulationPdfUrl || '');
  const [regulationPdfName, setRegulationPdfName] = useState(brand.regulationPdfName || '');
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [pdfUploadError, setPdfUploadError] = useState<string | null>(null);
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
    setBackgroundColor(brand.backgroundColor || '#FFFFFF');
    setTextColor(brand.textColor || '#0F172A');
    setTerms(brand.termsAndConditions);
    setRegulationPdfUrl(brand.regulationPdfUrl || '');
    setRegulationPdfName(brand.regulationPdfName || '');
    setHeroBadgeText(brand.heroBadgeText || 'Sorteio Oficial 2026 • Auditoria em Tempo Real');
    setRoundsBannerTitle(brand.roundsBannerTitle || '2 Sorteios Oficiais por Dia');
    setRoundsBannerSubtitle(brand.roundsBannerSubtitle || 'O seu bilhete concorre automaticamente em todas as rondas e datas programadas!');
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
    setAdminPassword(brand.adminPassword || 'admin');
    setShowNavbar(brand.showNavbar !== false);
    setHeroLogoSize((brand.heroLogoSize as any) || 'large');
    setShowHeroTitle(brand.showHeroTitle === true);
    setShowNavbarBrandText(brand.showNavbarBrandText === true);
    setShowNavbarParticipateButton(brand.showNavbarParticipateButton === true);
    setShowPrizesSection(brand.showPrizesSection === true);
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

  const syncAndSave = (overrides: Partial<BrandConfig> = {}, showToast = false) => {
    const finalBg = overrides.backgroundColor !== undefined ? overrides.backgroundColor : backgroundColor;
    const finalTextColor = overrides.textColor !== undefined ? overrides.textColor : textColor;
    const computedTheme = overrides.backgroundTheme ?? (isLightColor(finalBg) ? 'white' : 'dark');

    const updated: BrandConfig = {
      ...brand,
      companyName: (overrides.companyName !== undefined ? overrides.companyName : companyName).trim() || 'Sorteio Lacer OMD 2026',
      companySlogan: (overrides.companySlogan !== undefined ? overrides.companySlogan : companySlogan).trim(),
      logoUrl: (overrides.logoUrl !== undefined ? overrides.logoUrl : logoUrl).trim() || DEFAULT_BRAND_LOGO,
      primaryColor: overrides.primaryColor ?? primaryColor,
      secondaryColor: overrides.secondaryColor ?? secondaryColor,
      accentColor: overrides.accentColor ?? accentColor,
      backgroundColor: finalBg,
      textColor: finalTextColor,
      backgroundTheme: computedTheme,
      termsAndConditions: (overrides.termsAndConditions !== undefined ? overrides.termsAndConditions : terms).trim(),
      roundsBannerTitle: (overrides.roundsBannerTitle !== undefined ? overrides.roundsBannerTitle : roundsBannerTitle).trim(),
      roundsBannerSubtitle: (overrides.roundsBannerSubtitle !== undefined ? overrides.roundsBannerSubtitle : roundsBannerSubtitle).trim(),
      showRoundsBanner: overrides.showRoundsBanner !== undefined ? overrides.showRoundsBanner : showRoundsBanner,
      formTitle: (overrides.formTitle !== undefined ? overrides.formTitle : formTitle).trim(),
      formSubtitle: (overrides.formSubtitle !== undefined ? overrides.formSubtitle : formSubtitle).trim(),
      formButtonText: (overrides.formButtonText !== undefined ? overrides.formButtonText : formButtonText).trim(),
      prizesSectionTitle: (overrides.prizesSectionTitle !== undefined ? overrides.prizesSectionTitle : prizesSectionTitle).trim(),
      searchSectionTitle: (overrides.searchSectionTitle !== undefined ? overrides.searchSectionTitle : searchSectionTitle).trim(),
      searchSectionSubtitle: (overrides.searchSectionSubtitle !== undefined ? overrides.searchSectionSubtitle : searchSectionSubtitle).trim(),
      ticketNotice: (overrides.ticketNotice !== undefined ? overrides.ticketNotice : ticketNotice).trim(),
      heroBadgeText: (overrides.heroBadgeText !== undefined ? overrides.heroBadgeText : heroBadgeText).trim(),
      ticketModalTitle: (overrides.ticketModalTitle !== undefined ? overrides.ticketModalTitle : ticketModalTitle).trim(),
      ticketModalSubtitle: (overrides.ticketModalSubtitle !== undefined ? overrides.ticketModalSubtitle : ticketModalSubtitle).trim(),
      showNavbar: overrides.showNavbar !== undefined ? overrides.showNavbar : showNavbar,
      heroLogoSize: overrides.heroLogoSize !== undefined ? overrides.heroLogoSize : heroLogoSize,
      showHeroTitle: overrides.showHeroTitle !== undefined ? overrides.showHeroTitle : showHeroTitle,
      showNavbarBrandText: overrides.showNavbarBrandText !== undefined ? overrides.showNavbarBrandText : showNavbarBrandText,
      showNavbarParticipateButton: overrides.showNavbarParticipateButton !== undefined ? overrides.showNavbarParticipateButton : showNavbarParticipateButton,
      showPrizesSection: overrides.showPrizesSection !== undefined ? overrides.showPrizesSection : showPrizesSection,
      regulationPdfUrl: overrides.regulationPdfUrl !== undefined ? overrides.regulationPdfUrl : (regulationPdfUrl || '').trim(),
      regulationPdfName: overrides.regulationPdfName !== undefined ? overrides.regulationPdfName : (regulationPdfName || '').trim(),
    };

    onUpdateBrand(updated);

    if (showToast) {
      setIsSaving(true);
      setSavedSuccessMessage(null);
      setTimeout(() => {
        setIsSaving(false);
        setSavedSuccessMessage('Todas as alterações de cores, fundo e textos foram guardadas na Base de Dados e já estão ativas!');
        checkDatabaseLiveStatus();
        setTimeout(() => setSavedSuccessMessage(null), 4000);
      }, 350);
    }
  };

  const handlePdfFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfUploadError(null);

    const rawName = file.name || 'Regulamento_Oficial.pdf';
    let targetName = rawName;
    if (!targetName.toLowerCase().endsWith('.pdf')) {
      targetName = `${targetName}.pdf`;
    }

    if (file.size > 25 * 1024 * 1024) {
      setPdfUploadError('O ficheiro selecionado é demasiado grande (limite de 25MB).');
      return;
    }

    setIsUploadingPdf(true);

    try {
      // 1. Read file as Base64 Data URL (always works in browser)
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Falha ao ler o ficheiro no navegador.'));
        reader.readAsDataURL(file);
      });
      const fileData = await base64Promise;

      if (!fileData || !fileData.startsWith('data:')) {
        throw new Error('Falha ao processar os dados do ficheiro.');
      }

      // 2. Default targetUrl to base64 Data URL (guarantees immediate persistence and display)
      let targetUrl = fileData;

      // 3. Attempt server upload to disk for clean /uploads/ URL if server is available
      try {
        const res = await fetch('/api/upload-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileData, fileName: targetName }),
        });

        if (res.ok) {
          const result = await res.json();
          if (result.url) {
            targetUrl = result.url;
            targetName = result.fileName || targetName;
          }
        }
      } catch (uploadErr) {
        console.warn('Server storage fallback to Data URL:', uploadErr);
      }

      setRegulationPdfUrl(targetUrl);
      setRegulationPdfName(targetName);

      const updated: BrandConfig = {
        ...brand,
        regulationPdfUrl: targetUrl,
        regulationPdfName: targetName,
      };

      onUpdateBrand(updated);
      setSavedSuccessMessage(`Ficheiro PDF "${targetName}" carregado e associado com sucesso!`);
      setTimeout(() => setSavedSuccessMessage(null), 4500);
      checkDatabaseLiveStatus();
    } catch (err: any) {
      console.error('PDF upload error:', err);
      setPdfUploadError('Erro ao carregar o PDF: ' + (err.message || 'Falha ao processar ficheiro.'));
    } finally {
      setIsUploadingPdf(false);
      try {
        e.target.value = '';
      } catch {}
    }
  };

  const handleRemovePdf = () => {
    setRegulationPdfUrl('');
    setRegulationPdfName('');
    const updated: BrandConfig = {
      ...brand,
      regulationPdfUrl: '',
      regulationPdfName: '',
    };
    onUpdateBrand(updated);
    setSavedSuccessMessage('PDF personalizado removido. O sistema voltará a gerar o PDF oficial automaticamente.');
    setTimeout(() => setSavedSuccessMessage(null), 3500);
  };

  const handleApplyPreset = (theme: { 
    name: string; 
    primary: string; 
    secondary: string; 
    accent: string; 
    backgroundColor?: string; 
    textColor?: string; 
  }) => {
    const newBg = theme.backgroundColor || '#FFFFFF';
    const newText = theme.textColor || '#0F172A';
    setPrimaryColor(theme.primary);
    setSecondaryColor(theme.secondary);
    setAccentColor(theme.accent);
    setBackgroundColor(newBg);
    setTextColor(newText);
    syncAndSave({ 
      primaryColor: theme.primary, 
      secondaryColor: theme.secondary, 
      accentColor: theme.accent,
      backgroundColor: newBg,
      textColor: newText,
      backgroundTheme: isLightColor(newBg) ? 'white' : 'dark',
    }, true);
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    syncAndSave({}, true);
  };

  const PRESET_THEMES = [
    { 
      name: '⭐ Lacer Oficial (Fundo Branco & Vermelho)', 
      primary: '#E30613', 
      secondary: '#B91C1C', 
      accent: '#E30613', 
      backgroundColor: '#FFFFFF', 
      textColor: '#0F172A' 
    },
    { 
      name: '⚪ Lacer Minimalista (Branco Gelo)', 
      primary: '#E30613', 
      secondary: '#991B1B', 
      accent: '#B91C1C', 
      backgroundColor: '#F8FAFC', 
      textColor: '#1E293B' 
    },
    { 
      name: '🌙 Lacer Dark Mode (Fundo Escuro Noturno)', 
      primary: '#E30613', 
      secondary: '#DC2626', 
      accent: '#FFFFFF', 
      backgroundColor: '#0B0F19', 
      textColor: '#F8FAFC' 
    },
    { 
      name: '🏆 Ouro & Branco (Fundo Claro)', 
      primary: '#D97706', 
      secondary: '#B45309', 
      accent: '#059669', 
      backgroundColor: '#FFFDF7', 
      textColor: '#1E293B' 
    },
    { 
      name: '🏥 Clínico Odonto (Branco & Azul)', 
      primary: '#0284C7', 
      secondary: '#0369A1', 
      accent: '#E30613', 
      backgroundColor: '#FFFFFF', 
      textColor: '#0F172A' 
    },
  ];

  return (
    <form onSubmit={handleSaveAll} className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Palette className="w-5 h-5 text-[#E30613]" />
            <span>Personalização da Marca, Logótipo e Textos Globais</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Controlo total sobre os nomes, frases de destaque (por baixo do logótipo), faixas, textos do formulário e cores de toda a aplicação
          </p>
        </div>

        <button
          type="submit"
          disabled={isSaving || isUploadingLogo}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#E30613] hover:bg-[#C80510] disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition-all active:scale-98 cursor-pointer"
        >
          {isSaving ? (
            <RefreshCw className="w-4 h-4 animate-spin text-white" />
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
                  <label className="px-3.5 py-1.5 bg-[#E30613] hover:bg-[#C80510] text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-md shadow-red-600/25 flex items-center gap-1.5">
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
              onBlur={() => syncAndSave()}
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
                  onClick={() => {
                    setCompanySlogan('');
                    syncAndSave({ companySlogan: '' });
                  }}
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
              onBlur={() => syncAndSave()}
              placeholder="Insira a frase exibida por baixo do logótipo e do nome (ou deixe vazio para não exibir nada)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Texto que surge na página pública logo abaixo do logótipo e do nome <strong>"{companyName || 'Sorteio'}"</strong>. Se deixar vazio, nenhum subtítulo aparecerá.
            </p>
          </div>

          {/* Controlo de Exibição do Logótipo & Cabeçalho (Manter Apenas Logótipo & Tamanho do Logo) */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>Exibição do Logótipo & Cabeçalho</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Ajuste o tamanho do logótipo oficial no centro da página e controle a visibilidade da barra de navegação superior.
              </p>
            </div>

            {/* Seletor de Tamanho do Logótipo Central */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <span>Tamanho do Logótipo Central</span>
                  <span className="text-[10px] bg-red-500/20 text-red-300 px-1.5 py-0.2 rounded font-normal">
                    {heroLogoSize === 'normal' && 'Normal (120px)'}
                    {heroLogoSize === 'medium' && 'Médio (170px)'}
                    {heroLogoSize === 'large' && 'Grande (240px - Recomendado)'}
                    {heroLogoSize === 'xlarge' && 'Extra Grande (300px)'}
                    {heroLogoSize === '2xlarge' && 'Máximo (360px)'}
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                {[
                  { id: 'normal', label: 'Normal', sizeDesc: '120px' },
                  { id: 'medium', label: 'Médio', sizeDesc: '170px' },
                  { id: 'large', label: 'Grande ★', sizeDesc: '240px' },
                  { id: 'xlarge', label: 'X-Grande', sizeDesc: '300px' },
                  { id: '2xlarge', label: 'Máximo', sizeDesc: '360px' },
                ].map((item) => {
                  const isSelected = heroLogoSize === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        const newSize = item.id as any;
                        setHeroLogoSize(newSize);
                        syncAndSave({ heroLogoSize: newSize }, true);
                      }}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                        isSelected
                          ? 'bg-[#E30613] text-white border-red-500 font-bold shadow-md shadow-red-500/30'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <span className="text-xs">{item.label}</span>
                      <span className={`text-[10px] ${isSelected ? 'text-red-100' : 'text-slate-500'}`}>
                        {item.sizeDesc}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-400">
                O logótipo oficial é ampliado mantendo proporção nítida e alta definição com cantos arredondados e sombra premium.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              {/* Barra de Navegação Superior (Navbar) toggle principal */}
              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 cursor-pointer hover:bg-slate-900 transition-colors">
                <input
                  type="checkbox"
                  checked={showNavbar}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setShowNavbar(val);
                    syncAndSave({ showNavbar: val }, true);
                  }}
                  className="mt-0.5 rounded bg-slate-950 border-slate-700 text-[#E30613] focus:ring-red-500"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-200 block">
                    Exibir Barra de Navegação Superior (Navbar)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Desmarque para <strong>ocultar completamente a barra superior</strong> da página pública (barra com logótipo pequeno e cadeado). O ecrã fica 100% limpo com o logótipo oficial ampliado em grande destaque.
                  </span>
                  <div className="mt-1.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
                    💡 <strong>Acesso Admin garantido:</strong> mesmo com a barra oculta, o administrador pode abrir o painel clicando <strong>3 vezes seguidas no logótipo central</strong> ou pressionando o atalho <strong>Alt+C</strong> (ou através do ícone discreto no rodapé).
                  </div>
                </div>
              </label>

              {/* Sub-opções da Navbar (apenas quando a navbar estiver ativa) */}
              {showNavbar && (
                <div className="pl-4 space-y-2.5 border-l-2 border-slate-800 ml-2 animate-in fade-in duration-200">
                  {/* Navbar Brand text toggle */}
                  <label className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-900/40 border border-slate-800 cursor-pointer hover:bg-slate-900 transition-colors">
                    <input
                      type="checkbox"
                      checked={showNavbarBrandText}
                      onChange={(e) => {
                        setShowNavbarBrandText(e.target.checked);
                        syncAndSave({ showNavbarBrandText: e.target.checked });
                      }}
                      className="mt-0.5 rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-amber-500"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-slate-200 block">
                        Exibir Nome da Empresa ao lado do logo na Navbar
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Desmarque para manter apenas o ícone do logótipo na barra superior.
                      </span>
                    </div>
                  </label>

                  {/* Navbar Participate button toggle */}
                  <label className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-900/40 border border-slate-800 cursor-pointer hover:bg-slate-900 transition-colors">
                    <input
                      type="checkbox"
                      checked={showNavbarParticipateButton}
                      onChange={(e) => {
                        setShowNavbarParticipateButton(e.target.checked);
                        syncAndSave({ showNavbarParticipateButton: e.target.checked });
                      }}
                      className="mt-0.5 rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-amber-500"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-slate-200 block">
                        Exibir Botão "Participar" na Navbar
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Desmarque para remover o botão de inscrição do topo da página.
                      </span>
                    </div>
                  </label>
                </div>
              )}

              {/* Hero Title toggle */}
              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 cursor-pointer hover:bg-slate-900 transition-colors">
                <input
                  type="checkbox"
                  checked={showHeroTitle}
                  onChange={(e) => {
                    setShowHeroTitle(e.target.checked);
                    syncAndSave({ showHeroTitle: e.target.checked });
                  }}
                  className="mt-0.5 rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-amber-500"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-200 block">
                    Exibir Título do Sorteio no Centro da Página (Abaixo do Logótipo)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Desmarque para <strong>manter exclusivamente o logótipo oficial</strong> no cabeçalho central da página (recomendado para destaque visual limpo).
                  </span>
                </div>
              </label>

              {/* Bloco Lateral Prémios Desta Edição (Adicionar/Remover) */}
              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 cursor-pointer hover:bg-slate-900 transition-colors">
                <input
                  type="checkbox"
                  checked={showPrizesSection}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setShowPrizesSection(val);
                    syncAndSave({ showPrizesSection: val }, true);
                  }}
                  className="mt-0.5 rounded bg-slate-950 border-slate-700 text-[#E30613] focus:ring-red-500"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-200 block">
                    Exibir Bloco "Prémios Desta Edição" na Página Pública
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Desmarque para <strong>remover o bloco lateral de prémios</strong> assinalado na página pública. A página fica com o formulário de inscrição centralizado e visualmente mais limpo.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Faixa das Datas & Horários dos Sorteios */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-red-500" />
                  <span>Datas e Horários dos Sorteios</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Faixa com as rondas e horários diários na página pública e gestão do calendário.
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={showRoundsBanner}
                  onChange={(e) => {
                    setShowRoundsBanner(e.target.checked);
                    syncAndSave({ showRoundsBanner: e.target.checked });
                  }}
                  className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500"
                />
                <span>Exibir Faixa de Datas</span>
              </label>
            </div>

            {showRoundsBanner && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] text-slate-400 uppercase font-semibold mb-1">
                    Título da Faixa de Datas:
                  </label>
                  <input
                    type="text"
                    value={roundsBannerTitle}
                    onChange={(e) => setRoundsBannerTitle(e.target.value)}
                    onBlur={() => syncAndSave()}
                    placeholder="2 Sorteios Oficiais por Dia"
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
                    onBlur={() => syncAndSave()}
                    placeholder="O seu bilhete concorre automaticamente em todas as rondas e datas programadas!"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            )}

            {onNavigateToCalendar && (
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Quer alterar os dias, horários e prémios de cada ronda?
                </span>
                <button
                  type="button"
                  onClick={onNavigateToCalendar}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 text-xs font-semibold border border-red-500/30 transition-all cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Gerir Calendário & Rondas</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
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
                onBlur={() => syncAndSave()}
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
                onBlur={() => syncAndSave()}
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
                onBlur={() => syncAndSave()}
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
                onBlur={() => syncAndSave()}
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
                onBlur={() => syncAndSave()}
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
                onBlur={() => syncAndSave()}
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
                onBlur={() => syncAndSave()}
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
                onBlur={() => syncAndSave()}
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
                onBlur={() => syncAndSave()}
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
                onBlur={() => syncAndSave()}
                placeholder="O Seu Bilhete Oficial"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase">
              Regulamento & Termos do Sorteio (Texto Resumo)
            </label>
            <textarea
              rows={3}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              onBlur={() => syncAndSave()}
              placeholder="Sorteio autorizado e auditado em tempo real..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Card Especial de Carregamento do Documento PDF do Regulamento */}
          <div className="p-4 rounded-2xl bg-slate-950 border-2 border-red-500/40 space-y-4 shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#E30613]" />
                  <span>Documento PDF do Regulamento & Política de Privacidade</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Carregue aqui o ficheiro PDF oficial do regulamento. É exatamente este documento que abre quando o participante clica na ligação assinalada no formulário: <strong className="text-white">"Consulte o regulamento completo do sorteio e a política de privacidade [PDF]"</strong>.
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 uppercase shrink-0">
                PDF Oficial
              </span>
            </div>

            {/* Status do PDF Ativo */}
            {regulationPdfUrl ? (
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                        <span>Ficheiro PDF Personalizado Ativo</span>
                      </p>
                      <p className="text-[11px] text-slate-300 font-mono truncate" title={regulationPdfName || regulationPdfUrl}>
                        {regulationPdfName || regulationPdfUrl}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openPdfDocument(regulationPdfUrl, regulationPdfName || 'Regulamento_Oficial.pdf')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>Abrir / Testar</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleRemovePdf}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors cursor-pointer"
                      title="Remover ficheiro e voltar ao gerador padrão"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                <span>Nenhum PDF carregado. A aplicação gera atualmente o PDF oficial de modo automático.</span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">Modo Padrão</span>
              </div>
            )}

            {pdfUploadError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{pdfUploadError}</span>
              </div>
            )}

            {/* Ações de Upload */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  1. Carregar Ficheiro PDF do seu Computador (.pdf)
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <label 
                    htmlFor="pdf-upload-file-input"
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all ${
                    isUploadingPdf 
                      ? 'bg-slate-800 text-slate-400 cursor-not-allowed' 
                      : 'bg-[#E30613] hover:bg-[#C80510] text-white shadow-md shadow-red-500/20 active:scale-95'
                  }`}>
                    {isUploadingPdf ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    <span>{isUploadingPdf ? 'A processar e gravar PDF...' : 'Escolher Ficheiro PDF...'}</span>
                  </label>
                  <input
                    id="pdf-upload-file-input"
                    type="file"
                    accept=".pdf,application/pdf,application/x-pdf,*/*"
                    disabled={isUploadingPdf}
                    onClick={(e) => {
                      (e.target as HTMLInputElement).value = '';
                    }}
                    onChange={handlePdfFileUpload}
                    className="hidden"
                  />
                  <span className="text-[11px] text-slate-400">
                    Formatos aceites: .pdf (máx. 25MB)
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-900">
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  2. Ou Inserir Link / URL Direto de um PDF Externo
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={regulationPdfUrl}
                    onChange={(e) => setRegulationPdfUrl(e.target.value)}
                    onBlur={() => {
                      if (regulationPdfUrl !== brand.regulationPdfUrl) {
                        syncAndSave({ regulationPdfUrl: regulationPdfUrl.trim() }, true);
                      }
                    }}
                    placeholder="https://exemplo.pt/documentos/regulamento_lacer.pdf"
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-red-500 font-mono"
                  />
                  {regulationPdfUrl && (
                    <button
                      type="button"
                      onClick={() => syncAndSave({ regulationPdfUrl: regulationPdfUrl.trim() }, true)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      Guardar Link
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Pode usar um link direto para o PDF alojado no Google Drive, OneDrive, Dropbox ou site institucional.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Color Palette, Background & Text Colors, and Presets (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-lg">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-amber-400" />
              <span>Cores de Fundo, Texto e Identidade da Marca</span>
            </h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              isLightColor(backgroundColor)
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
            }`}>
              {isLightColor(backgroundColor) ? '⚪ Fundo Claro (Lacer)' : '🌙 Fundo Escuro (Dark)'}
            </span>
          </div>

          {/* 1. SEÇÃO PRINCIPAL: Cores de Fundo e Texto da Aplicação */}
          <div className="p-4 rounded-2xl bg-slate-950 border-2 border-red-500/30 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Cor de Fundo & Cor do Texto da App
                </h4>
                <p className="text-[11px] text-slate-400">
                  Define a cor geral da página (fundo branco recomendado) e a cor de leitura dos textos.
                </p>
              </div>
            </div>

            {/* Fundo da Aplicação */}
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-white">Cor de Fundo da Aplicação (Background)</p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">Hex: {backgroundColor}</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBackgroundColor(val);
                      syncAndSave({ backgroundColor: val });
                    }}
                    className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono text-center focus:outline-none focus:border-red-500"
                    placeholder="#FFFFFF"
                  />
                  <input
                    type="color"
                    value={backgroundColor.startsWith('#') && backgroundColor.length === 7 ? backgroundColor : '#FFFFFF'}
                    onChange={(e) => {
                      setBackgroundColor(e.target.value);
                      syncAndSave({ backgroundColor: e.target.value });
                    }}
                    className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0"
                    title="Selecione a cor de fundo no seletor"
                  />
                </div>
              </div>

              {/* Botões rápidos de fundo */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase mr-1">Atalhos de Fundo:</span>
                {[
                  { label: '⚪ Branco Puro (Lacer)', val: '#FFFFFF' },
                  { label: '❄️ Branco Gelo', val: '#F8FAFC' },
                  { label: '📄 Cinza Claro', val: '#F1F5F9' },
                  { label: '🌑 Escuro Noturno', val: '#0B0F19' },
                  { label: '🌌 Azul Profundo', val: '#0F172A' },
                ].map((chip) => (
                  <button
                    key={chip.val}
                    type="button"
                    onClick={() => {
                      setBackgroundColor(chip.val);
                      syncAndSave({ backgroundColor: chip.val });
                    }}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                      backgroundColor.toUpperCase() === chip.val.toUpperCase()
                        ? 'bg-red-500/20 text-red-300 border-red-500 font-bold'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full border border-black/30" style={{ backgroundColor: chip.val }}></span>
                    <span>{chip.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Cor do Texto Principal */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-white">Cor do Texto Principal (Text Color)</p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">Hex: {textColor}</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={textColor}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTextColor(val);
                      syncAndSave({ textColor: val });
                    }}
                    className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono text-center focus:outline-none focus:border-red-500"
                    placeholder="#0F172A"
                  />
                  <input
                    type="color"
                    value={textColor.startsWith('#') && textColor.length === 7 ? textColor : '#0F172A'}
                    onChange={(e) => {
                      setTextColor(e.target.value);
                      syncAndSave({ textColor: e.target.value });
                    }}
                    className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0"
                    title="Selecione a cor do texto no seletor"
                  />
                </div>
              </div>

              {/* Botões rápidos de texto */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase mr-1">Atalhos de Texto:</span>
                {[
                  { label: '⚫ Preto Corporativo', val: '#0F172A' },
                  { label: '🔘 Grafite Escuro', val: '#334155' },
                  { label: '🔴 Vermelho Lacer', val: '#E30613' },
                  { label: '⚪ Branco Puro', val: '#FFFFFF' },
                ].map((chip) => (
                  <button
                    key={chip.val}
                    type="button"
                    onClick={() => {
                      setTextColor(chip.val);
                      syncAndSave({ textColor: chip.val });
                    }}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                      textColor.toUpperCase() === chip.val.toUpperCase()
                        ? 'bg-red-500/20 text-red-300 border-red-500 font-bold'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full border border-black/30" style={{ backgroundColor: chip.val }}></span>
                    <span>{chip.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Cores de Identidade da Marca (Primária, Secundária, Acento) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>Cores da Marca (Identidade Lacer)</span>
            </h4>

            {/* Primary Color */}
            <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <div>
                <p className="text-xs font-bold text-white">Cor Primária (Vermelho Lacer • Botões & Destaques)</p>
                <p className="text-[11px] text-slate-400 font-mono">{primaryColor}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => {
                    setPrimaryColor(e.target.value);
                    syncAndSave({ primaryColor: e.target.value });
                  }}
                  className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono text-center focus:outline-none focus:border-red-500"
                />
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => {
                    setPrimaryColor(e.target.value);
                    syncAndSave({ primaryColor: e.target.value });
                  }}
                  className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0"
                />
              </div>
            </div>

            {/* Secondary Color */}
            <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <div>
                <p className="text-xs font-bold text-white">Cor Secundária (Bordas, Faixas & Tons)</p>
                <p className="text-[11px] text-slate-400 font-mono">{secondaryColor}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => {
                    setSecondaryColor(e.target.value);
                    syncAndSave({ secondaryColor: e.target.value });
                  }}
                  className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono text-center focus:outline-none focus:border-red-500"
                />
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => {
                    setSecondaryColor(e.target.value);
                    syncAndSave({ secondaryColor: e.target.value });
                  }}
                  className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0"
                />
              </div>
            </div>

            {/* Accent Color */}
            <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <div>
                <p className="text-xs font-bold text-white">Cor de Acento (Selos & Indicadores)</p>
                <p className="text-[11px] text-slate-400 font-mono">{accentColor}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={accentColor}
                  onChange={(e) => {
                    setAccentColor(e.target.value);
                    syncAndSave({ accentColor: e.target.value });
                  }}
                  className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono text-center focus:outline-none focus:border-red-500"
                />
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => {
                    setAccentColor(e.target.value);
                    syncAndSave({ accentColor: e.target.value });
                  }}
                  className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0"
                />
              </div>
            </div>
          </div>

          {/* 3. Color Presets */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
              Paletas e Temas Prontos (1-Clique)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_THEMES.map((theme) => (
                <button
                  key={theme.name}
                  type="button"
                  onClick={() => handleApplyPreset(theme)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-red-500/50 text-left transition-colors cursor-pointer group"
                >
                  <span className="text-xs font-medium text-slate-200 group-hover:text-white truncate pr-2">
                    {theme.name}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <span 
                      className="w-4 h-4 rounded-full border border-black/40 shadow-sm" 
                      style={{ backgroundColor: theme.backgroundColor || '#FFFFFF' }}
                      title={`Fundo: ${theme.backgroundColor}`}
                    ></span>
                    <span 
                      className="w-4 h-4 rounded-full border border-black/40 shadow-sm" 
                      style={{ backgroundColor: theme.primary }}
                      title={`Primária: ${theme.primary}`}
                    ></span>
                    <span 
                      className="w-4 h-4 rounded-full border border-black/40 shadow-sm" 
                      style={{ backgroundColor: theme.textColor || '#0F172A' }}
                      title={`Texto: ${theme.textColor}`}
                    ></span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Live Preview Simulation */}
          <div className="pt-3 border-t border-slate-800">
            <span className="text-xs text-slate-400 block mb-2 font-medium">
              Amostra em Tempo Real (Como os Utilizadores Verão a Aplicação):
            </span>
            <div 
              style={{ 
                backgroundColor: backgroundColor, 
                color: textColor,
                borderColor: secondaryColor 
              }}
              className="p-5 rounded-2xl border-2 shadow-2xl transition-all space-y-3.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain rounded-lg p-0.5 bg-white/80 border border-slate-200 shadow-sm" />
                  ) : (
                    <div style={{ backgroundColor: primaryColor }} className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                      L
                    </div>
                  )}
                  <div>
                    <h5 className="text-xs font-extrabold truncate" style={{ color: textColor }}>
                      {companyName || 'Lacer'}
                    </h5>
                    <p className="text-[10px] opacity-75 truncate" style={{ color: textColor }}>
                      {companySlogan || 'Saúde e Higiene Oral'}
                    </p>
                  </div>
                </div>

                <span 
                  style={{ 
                    backgroundColor: `${primaryColor}15`, 
                    color: primaryColor,
                    borderColor: `${primaryColor}40` 
                  }}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase"
                >
                  Sorteio Ativo
                </span>
              </div>

              <div className="pt-2 border-t border-current/15 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold leading-tight" style={{ color: textColor }}>
                    {formTitle || 'Garanta o seu Bilhete'}
                  </p>
                  <p className="text-[10px] opacity-70 truncate" style={{ color: textColor }}>
                    Fundo selecionado: <span className="font-mono font-bold">{backgroundColor}</span> • Texto: <span className="font-mono font-bold">{textColor}</span>
                  </p>
                </div>

                <button
                  type="button"
                  style={{ backgroundColor: primaryColor }}
                  className="px-4 py-2 rounded-xl text-white font-bold text-xs shadow-md shrink-0 cursor-pointer hover:opacity-90 active:scale-95 transition-all"
                >
                  {formButtonText || 'Participar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
