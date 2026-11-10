import React, { useState, useEffect } from 'react';
import { BrandConfig, LogoAnimationEffect, ModalLogoSize } from '../../types';
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
  Trash2,
  ShieldCheck
} from 'lucide-react';
import { DEFAULT_BRAND_LOGO, isLightColor, getLogoAnimationClass, getModalLogoSizeClass } from '../../utils/storage';
import { ApiService } from '../../utils/api';
import { compressImageFile } from '../../utils/imageCompressor';
import { 
  openPdfDocument, 
  exportLegalTermsPDF, 
  exportHcpPrivacyPDF, 
  exportRafflePrivacyPDF 
} from '../../utils/export';

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
  const [logoAnimationEffect, setLogoAnimationEffect] = useState<LogoAnimationEffect>(
    brand.logoAnimationEffect || 'pulse'
  );
  const [modalLogoSize, setModalLogoSize] = useState<ModalLogoSize>(
    brand.modalLogoSize || 'xlarge'
  );
  const [previewThemeMode, setPreviewThemeMode] = useState<'light' | 'dark'>('light');
  const [showHeroTitle, setShowHeroTitle] = useState(brand.showHeroTitle === true);
  const [showNavbarBrandText, setShowNavbarBrandText] = useState(brand.showNavbarBrandText === true);
  const [showNavbarParticipateButton, setShowNavbarParticipateButton] = useState(brand.showNavbarParticipateButton === true);
  const [showPrizesSection, setShowPrizesSection] = useState(brand.showPrizesSection === true);
  const [showSearchSection, setShowSearchSection] = useState(brand.showSearchSection !== false);
  const [showFormPrizeHighlight, setShowFormPrizeHighlight] = useState(brand.showFormPrizeHighlight !== false);

  // App-wide customizable texts
  const [heroBadgeText, setHeroBadgeText] = useState(brand.heroBadgeText || 'Sorteio Oficial 2026 • Auditoria em Tempo Real');
  const [roundsBannerTitle, setRoundsBannerTitle] = useState(brand.roundsBannerTitle || '2 Sorteios Oficiais por Dia');
  const [roundsBannerSubtitle, setRoundsBannerSubtitle] = useState(brand.roundsBannerSubtitle || 'O seu bilhete concorre automaticamente em todas as rondas e datas programadas!');
  const [showRoundsBanner, setShowRoundsBanner] = useState(brand.showRoundsBanner !== false);
  const [formTitle, setFormTitle] = useState(brand.formTitle || 'PARTICIPE NO SORTEIO E PODE GANHAR UM IRRIGADOR ORAL LACER');
  const [showFormContactSectionTitle, setShowFormContactSectionTitle] = useState(brand.showFormContactSectionTitle === true);
  const [formContactSectionTitle, setFormContactSectionTitle] = useState(brand.formContactSectionTitle || '');
  const [formSubtitle, setFormSubtitle] = useState(brand.formSubtitle || 'Preencha os seus dados reais para receber a confirmação e o seu número');
  const [formButtonText, setFormButtonText] = useState(brand.formButtonText || 'Registar Inscrição e Obter Bilhete');
  const [prizesSectionTitle, setPrizesSectionTitle] = useState(brand.prizesSectionTitle || 'Prémios Desta Edição');
  const [searchSectionTitle, setSearchSectionTitle] = useState(brand.searchSectionTitle || 'Já se inscreveu? Consulte os seus Bilhetes');
  const [searchSectionSubtitle, setSearchSectionSubtitle] = useState(brand.searchSectionSubtitle || 'Insira o seu NIF, telemóvel, e-mail ou bilhete para verificar os seus números registados');
  const [ticketNotice, setTicketNotice] = useState(brand.ticketNotice || 'Validação única: limite de 1 inscrição por e-mail');
  const [ticketModalTitle, setTicketModalTitle] = useState(brand.ticketModalTitle || 'INSCRIÇÃO CONFIRMADA COM SUCESSO!');
  const [ticketModalSubtitle, setTicketModalSubtitle] = useState(brand.ticketModalSubtitle || 'O Seu Bilhete Oficial');

  // RGPD & Consent Text States
  const [consentVisitTitle, setConsentVisitTitle] = useState(
    brand.consentVisitTitle || 'Gostaria que um representante da LACER visitasse a sua clínica para lhe apresentar os nossos produtos?'
  );
  const [consentHcpDatabaseText, setConsentHcpDatabaseText] = useState(
    brand.consentHcpDatabaseText || 'Sim, concordo que os meus dados sejam armazenados na base de dados de profissionais de saúde para gerir interações científicas, incluindo consultas médicas.'
  );
  const [consentCommunicationsText, setConsentCommunicationsText] = useState(
    brand.consentCommunicationsText || 'Concordo em receber comunicações científicas e educacionais, bem como informações sobre produtos ou atividades, por e-mail ou outros meios, e que essas sejam seguidas através de tecnologias de rastreio.'
  );
  const [consentProfilingText, setConsentProfilingText] = useState(
    brand.consentProfilingText || 'Concordo com a criação de um perfil profissional que tenha em conta os meus interesses técnico-profissionais em áreas terapêuticas relevantes (perfilado).'
  );
  const [consentLegalNoticeP1, setConsentLegalNoticeP1] = useState(
    brand.consentLegalNoticeP1 || 'A LACER, S.A. processará os dados pessoais fornecidos para gerir a sua participação no sorteio, incluindo, quando aplicável, a seleção e comunicação dos vencedores e a gestão da entrega dos prémios. Além disso, com base no seu consentimento, iremos: enviar-lhe, incluindo por meios eletrónicos, informações científicas e educativas, notícias, eventos e produtos, e seguir esses envios utilizando tecnologias de rastreio; criar um perfil profissional com base nos seus interesses técnicos e profissionais em áreas terapêuticas relevantes; e incluir os seus dados na base de dados de profissionais de saúde para gerir as interações consigo, incluindo consultas médicas e atividades científicas.'
  );
  const [consentLegalNoticeP2, setConsentLegalNoticeP2] = useState(
    brand.consentLegalNoticeP2 || 'Também processaremos os seus dados para cumprir as obrigações legais aplicáveis ao setor farmacêutico.'
  );
  const [consentLegalNoticeP3, setConsentLegalNoticeP3] = useState(
    brand.consentLegalNoticeP3 || 'Para mais informações e para saber como exercer os seus direitos de acesso, retificação, supressão, revogação do consentimento, entre outros, consulte a nossa Política de Privacidade do Sorteio e a nossa Política de Privacidade para Profissionais de Saúde.'
  );
  const [consentTermsDeclaration, setConsentTermsDeclaration] = useState(
    brand.consentTermsDeclaration || 'Declaro que li e aceito os Termos Legais do Sorteio e que fui informado(a) sobre o processamento dos meus dados pessoais através da Política de Privacidade do Sorteio e a nossa Política de Privacidade para Profissionais de Saúde.'
  );

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [regulationPdfUrl, setRegulationPdfUrl] = useState(brand.legalTermsPdfUrl || brand.regulationPdfUrl || '');
  const [regulationPdfName, setRegulationPdfName] = useState(brand.legalTermsPdfName || brand.regulationPdfName || '');
  const [legalTermsPdfUrl, setLegalTermsPdfUrl] = useState(brand.legalTermsPdfUrl || brand.regulationPdfUrl || '');
  const [legalTermsPdfName, setLegalTermsPdfName] = useState(brand.legalTermsPdfName || brand.regulationPdfName || '');
  const [hcpPrivacyPdfUrl, setHcpPrivacyPdfUrl] = useState(brand.hcpPrivacyPdfUrl || '');
  const [hcpPrivacyPdfName, setHcpPrivacyPdfName] = useState(brand.hcpPrivacyPdfName || '');
  const [rafflePrivacyPdfUrl, setRafflePrivacyPdfUrl] = useState(brand.rafflePrivacyPdfUrl || '');
  const [rafflePrivacyPdfName, setRafflePrivacyPdfName] = useState(brand.rafflePrivacyPdfName || '');
  const [activePdfDocType, setActivePdfDocType] = useState<'legal_terms' | 'hcp_privacy' | 'raffle_privacy'>('legal_terms');
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);
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
    const resolvedLegalTermsUrl = brand.legalTermsPdfUrl || brand.regulationPdfUrl || '';
    const resolvedLegalTermsName = brand.legalTermsPdfName || brand.regulationPdfName || '';
    setLegalTermsPdfUrl(resolvedLegalTermsUrl);
    setLegalTermsPdfName(resolvedLegalTermsName);
    setRegulationPdfUrl(resolvedLegalTermsUrl);
    setRegulationPdfName(resolvedLegalTermsName);
    setHcpPrivacyPdfUrl(brand.hcpPrivacyPdfUrl || '');
    setHcpPrivacyPdfName(brand.hcpPrivacyPdfName || '');
    setRafflePrivacyPdfUrl(brand.rafflePrivacyPdfUrl || '');
    setRafflePrivacyPdfName(brand.rafflePrivacyPdfName || '');
    setHeroBadgeText(brand.heroBadgeText || 'Sorteio Oficial 2026 • Auditoria em Tempo Real');
    setRoundsBannerTitle(brand.roundsBannerTitle || '2 Sorteios Oficiais por Dia');
    setRoundsBannerSubtitle(brand.roundsBannerSubtitle || 'O seu bilhete concorre automaticamente em todas as rondas e datas programadas!');
    setShowRoundsBanner(brand.showRoundsBanner !== false);
    setFormTitle(brand.formTitle || 'PARTICIPE NO SORTEIO E PODE GANHAR UM IRRIGADOR ORAL LACER');
    setShowFormContactSectionTitle(brand.showFormContactSectionTitle === true);
    setFormContactSectionTitle(brand.formContactSectionTitle || '');
    setFormSubtitle(brand.formSubtitle || 'Preencha os seus dados reais para receber a confirmação e o seu número');
    setFormButtonText(brand.formButtonText || 'Registar Inscrição e Obter Bilhete');
    setPrizesSectionTitle(brand.prizesSectionTitle || 'Prémios Desta Edição');
    setSearchSectionTitle(brand.searchSectionTitle || 'Já se inscreveu? Consulte os seus Bilhetes');
    setSearchSectionSubtitle(brand.searchSectionSubtitle || 'Insira o seu NIF, telemóvel, e-mail ou bilhete para verificar os seus números registados');
    setTicketNotice(brand.ticketNotice || 'Validação única: limite de 1 inscrição por e-mail');
    setTicketModalTitle(brand.ticketModalTitle || 'INSCRIÇÃO CONFIRMADA COM SUCESSO!');
    setTicketModalSubtitle(brand.ticketModalSubtitle || 'O Seu Bilhete Oficial');
    setConsentVisitTitle(brand.consentVisitTitle || 'Gostaria que um representante da LACER visitasse a sua clínica para lhe apresentar os nossos produtos?');
    setConsentHcpDatabaseText(brand.consentHcpDatabaseText || 'Sim, concordo que os meus dados sejam armazenados na base de dados de profissionais de saúde para gerir interações científicas, incluindo consultas médicas.');
    setConsentCommunicationsText(brand.consentCommunicationsText || 'Concordo em receber comunicações científicas e educacionais, bem como informações sobre produtos ou atividades, por e-mail ou outros meios, e que essas sejam seguidas através de tecnologias de rastreio.');
    setConsentProfilingText(brand.consentProfilingText || 'Concordo com a criação de um perfil profissional que tenha em conta os meus interesses técnico-profissionais em áreas terapêuticas relevantes (perfilado).');
    setConsentLegalNoticeP1(brand.consentLegalNoticeP1 || 'A LACER, S.A. processará os dados pessoais fornecidos para gerir a sua participação no sorteio, incluindo, quando aplicável, a seleção e comunicação dos vencedores e a gestão da entrega dos prémios. Além disso, com base no seu consentimento, iremos: enviar-lhe, incluindo por meios eletrónicos, informações científicas e educativas, notícias, eventos e produtos, e seguir esses envios utilizando tecnologias de rastreio; criar um perfil profissional com base nos seus interesses técnicos e profissionais em áreas terapêuticas relevantes; e incluir os seus dados na base de dados de profissionais de saúde para gerir as interações consigo, incluindo consultas médicas e atividades científicas.');
    setConsentLegalNoticeP2(brand.consentLegalNoticeP2 || 'Também processaremos os seus dados para cumprir as obrigações legais aplicáveis ao setor farmacêutico.');
    setConsentLegalNoticeP3(brand.consentLegalNoticeP3 || 'Para mais informações e para saber como exercer os seus direitos de acesso, retificação, supressão, revogação do consentimento, entre outros, consulte a nossa Política de Privacidade do Sorteio e a nossa Política de Privacidade para Profissionais de Saúde.');
    setConsentTermsDeclaration(brand.consentTermsDeclaration || 'Declaro que li e aceito os Termos Legais do Sorteio e que fui informado(a) sobre o processamento dos meus dados pessoais através da Política de Privacidade do Sorteio e a nossa Política de Privacidade para Profissionais de Saúde.');
    setAdminPassword(brand.adminPassword || 'admin');
    setShowNavbar(brand.showNavbar !== false);
    setHeroLogoSize((brand.heroLogoSize as any) || 'large');
    setLogoAnimationEffect(brand.logoAnimationEffect || 'pulse');
    setModalLogoSize(brand.modalLogoSize || 'xlarge');
    setShowHeroTitle(brand.showHeroTitle === true);
    setShowNavbarBrandText(brand.showNavbarBrandText === true);
    setShowNavbarParticipateButton(brand.showNavbarParticipateButton === true);
    setShowPrizesSection(brand.showPrizesSection === true);
    setShowSearchSection(brand.showSearchSection !== false);
    setShowFormPrizeHighlight(brand.showFormPrizeHighlight !== false);
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
      showFormContactSectionTitle: overrides.showFormContactSectionTitle !== undefined ? overrides.showFormContactSectionTitle : showFormContactSectionTitle,
      formContactSectionTitle: (overrides.formContactSectionTitle !== undefined ? overrides.formContactSectionTitle : formContactSectionTitle).trim(),
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
      logoAnimationEffect: overrides.logoAnimationEffect !== undefined ? overrides.logoAnimationEffect : logoAnimationEffect,
      modalLogoSize: overrides.modalLogoSize !== undefined ? overrides.modalLogoSize : modalLogoSize,
      showHeroTitle: overrides.showHeroTitle !== undefined ? overrides.showHeroTitle : showHeroTitle,
      showNavbarBrandText: overrides.showNavbarBrandText !== undefined ? overrides.showNavbarBrandText : showNavbarBrandText,
      showNavbarParticipateButton: overrides.showNavbarParticipateButton !== undefined ? overrides.showNavbarParticipateButton : showNavbarParticipateButton,
      showPrizesSection: overrides.showPrizesSection !== undefined ? overrides.showPrizesSection : showPrizesSection,
      showSearchSection: overrides.showSearchSection !== undefined ? overrides.showSearchSection : showSearchSection,
      showFormPrizeHighlight: overrides.showFormPrizeHighlight !== undefined ? overrides.showFormPrizeHighlight : showFormPrizeHighlight,
      legalTermsPdfUrl: overrides.legalTermsPdfUrl !== undefined ? overrides.legalTermsPdfUrl : (legalTermsPdfUrl || '').trim(),
      legalTermsPdfName: overrides.legalTermsPdfName !== undefined ? overrides.legalTermsPdfName : (legalTermsPdfName || '').trim(),
      regulationPdfUrl: overrides.legalTermsPdfUrl !== undefined ? overrides.legalTermsPdfUrl : (legalTermsPdfUrl || overrides.regulationPdfUrl || regulationPdfUrl || '').trim(),
      regulationPdfName: overrides.legalTermsPdfName !== undefined ? overrides.legalTermsPdfName : (legalTermsPdfName || overrides.regulationPdfName || regulationPdfName || '').trim(),
      hcpPrivacyPdfUrl: overrides.hcpPrivacyPdfUrl !== undefined ? overrides.hcpPrivacyPdfUrl : (hcpPrivacyPdfUrl || '').trim(),
      hcpPrivacyPdfName: overrides.hcpPrivacyPdfName !== undefined ? overrides.hcpPrivacyPdfName : (hcpPrivacyPdfName || '').trim(),
      rafflePrivacyPdfUrl: overrides.rafflePrivacyPdfUrl !== undefined ? overrides.rafflePrivacyPdfUrl : (rafflePrivacyPdfUrl || '').trim(),
      rafflePrivacyPdfName: overrides.rafflePrivacyPdfName !== undefined ? overrides.rafflePrivacyPdfName : (rafflePrivacyPdfName || '').trim(),
      goodLuckBadgeUrl: overrides.goodLuckBadgeUrl !== undefined ? overrides.goodLuckBadgeUrl : (brand.goodLuckBadgeUrl || '/assets/boa_sorte_badge.jpg'),
      consentVisitTitle: (overrides.consentVisitTitle !== undefined ? overrides.consentVisitTitle : consentVisitTitle).trim(),
      consentHcpDatabaseText: (overrides.consentHcpDatabaseText !== undefined ? overrides.consentHcpDatabaseText : consentHcpDatabaseText).trim(),
      consentCommunicationsText: (overrides.consentCommunicationsText !== undefined ? overrides.consentCommunicationsText : consentCommunicationsText).trim(),
      consentProfilingText: (overrides.consentProfilingText !== undefined ? overrides.consentProfilingText : consentProfilingText).trim(),
      consentLegalNoticeP1: (overrides.consentLegalNoticeP1 !== undefined ? overrides.consentLegalNoticeP1 : consentLegalNoticeP1).trim(),
      consentLegalNoticeP2: (overrides.consentLegalNoticeP2 !== undefined ? overrides.consentLegalNoticeP2 : consentLegalNoticeP2).trim(),
      consentLegalNoticeP3: (overrides.consentLegalNoticeP3 !== undefined ? overrides.consentLegalNoticeP3 : consentLegalNoticeP3).trim(),
      consentTermsDeclaration: (overrides.consentTermsDeclaration !== undefined ? overrides.consentTermsDeclaration : consentTermsDeclaration).trim(),
    };

    onUpdateBrand(updated);

    if (showToast) {
      setIsSaving(true);
      setSavedSuccessMessage(null);
      setTimeout(() => {
        setIsSaving(false);
        setSavedSuccessMessage('Todas as alterações de cores, fundo, textos e PDFs foram guardadas na Base de Dados e já estão ativas!');
        checkDatabaseLiveStatus();
        setTimeout(() => setSavedSuccessMessage(null), 4000);
      }, 350);
    }
  };

  const handleSpecificPdfUpload = async (
    docType: 'legal_terms' | 'hcp_privacy' | 'raffle_privacy',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfUploadError(null);

    const docDefaultNames: Record<string, string> = {
      legal_terms: 'Termos_Legais_Sorteio.pdf',
      hcp_privacy: 'Politica_Privacidade_Profissionais_Saude.pdf',
      raffle_privacy: 'Politica_Privacidade_Sorteio.pdf',
    };

    let targetName = file.name || docDefaultNames[docType];
    if (!targetName.toLowerCase().endsWith('.pdf')) {
      targetName = `${targetName}.pdf`;
    }

    if (file.size > 25 * 1024 * 1024) {
      setPdfUploadError('O ficheiro selecionado é demasiado grande (limite de 25MB).');
      return;
    }

    setIsUploadingPdf(true);
    setUploadingDocType(docType);

    try {
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

      let targetUrl = fileData;

      try {
        const res = await fetch('/api/upload-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileData, fileName: targetName, docType }),
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

      const updatedBrand: Partial<BrandConfig> = {};
      if (docType === 'legal_terms') {
        setLegalTermsPdfUrl(targetUrl);
        setLegalTermsPdfName(targetName);
        setRegulationPdfUrl(targetUrl);
        setRegulationPdfName(targetName);
        updatedBrand.legalTermsPdfUrl = targetUrl;
        updatedBrand.legalTermsPdfName = targetName;
        updatedBrand.regulationPdfUrl = targetUrl;
        updatedBrand.regulationPdfName = targetName;
      } else if (docType === 'hcp_privacy') {
        setHcpPrivacyPdfUrl(targetUrl);
        setHcpPrivacyPdfName(targetName);
        updatedBrand.hcpPrivacyPdfUrl = targetUrl;
        updatedBrand.hcpPrivacyPdfName = targetName;
      } else if (docType === 'raffle_privacy') {
        setRafflePrivacyPdfUrl(targetUrl);
        setRafflePrivacyPdfName(targetName);
        updatedBrand.rafflePrivacyPdfUrl = targetUrl;
        updatedBrand.rafflePrivacyPdfName = targetName;
      }

      const updated: BrandConfig = {
        ...brand,
        ...updatedBrand,
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
      setUploadingDocType(null);
      try {
        e.target.value = '';
      } catch {}
    }
  };

  const handleRemoveSpecificPdf = (docType: 'legal_terms' | 'hcp_privacy' | 'raffle_privacy') => {
    const updatedBrand: Partial<BrandConfig> = {};
    if (docType === 'legal_terms') {
      setLegalTermsPdfUrl('');
      setLegalTermsPdfName('');
      setRegulationPdfUrl('');
      setRegulationPdfName('');
      updatedBrand.legalTermsPdfUrl = '';
      updatedBrand.legalTermsPdfName = '';
      updatedBrand.regulationPdfUrl = '';
      updatedBrand.regulationPdfName = '';
    } else if (docType === 'hcp_privacy') {
      setHcpPrivacyPdfUrl('');
      setHcpPrivacyPdfName('');
      updatedBrand.hcpPrivacyPdfUrl = '';
      updatedBrand.hcpPrivacyPdfName = '';
    } else if (docType === 'raffle_privacy') {
      setRafflePrivacyPdfUrl('');
      setRafflePrivacyPdfName('');
      updatedBrand.rafflePrivacyPdfUrl = '';
      updatedBrand.rafflePrivacyPdfName = '';
    }

    const updated: BrandConfig = {
      ...brand,
      ...updatedBrand,
    };
    onUpdateBrand(updated);
    setSavedSuccessMessage('PDF removido. O sistema voltará a utilizar o modelo oficial gerado automaticamente.');
    setTimeout(() => setSavedSuccessMessage(null), 3500);
  };

  // Legacy wrappers for backwards compatibility
  const handlePdfFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => handleSpecificPdfUpload('legal_terms', e);
  const handleRemovePdf = () => handleRemoveSpecificPdf('legal_terms');

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

            {/* Configuração de Efeitos e Animação do Logótipo (Modal de Confirmação & Destaques) */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-inner">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                <div>
                  <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Efeito de Animação do Logótipo</span>
                  </h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Personalize o efeito animado do logótipo no ecrã de confirmação e nos pontos de destaque.
                  </p>
                </div>
                <span className="text-[10px] bg-red-500/20 text-red-300 font-bold px-2 py-0.5 rounded-full border border-red-500/30 uppercase self-start sm:self-auto">
                  {logoAnimationEffect === 'pulse' && '💓 Pulsar Suave (Ativo)'}
                  {logoAnimationEffect === 'heartbeat' && '🩺 Batimento Cardíaco (Ativo)'}
                  {logoAnimationEffect === 'glow' && '✨ Brilho / Glow (Ativo)'}
                  {logoAnimationEffect === 'bounce' && '🦘 Salto Suave (Ativo)'}
                  {logoAnimationEffect === 'float' && '☁️ Flutuação (Ativo)'}
                  {logoAnimationEffect === 'none' && '⏸️ Estático (Sem Animação)'}
                </span>
              </div>

              {/* Botões dos Efeitos de Animação */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300 uppercase block">
                  Escolha o Efeito Animado:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'pulse', label: 'Pulsar Suave', icon: '💓', desc: 'Respiração e escala sutil (Padrão)' },
                    { id: 'heartbeat', label: 'Batimento', icon: '🩺', desc: 'Duplo pulsar rítmico dinâmico' },
                    { id: 'glow', label: 'Brilho Glow', icon: '✨', desc: 'Aura suave e luminosa vermelha' },
                    { id: 'bounce', label: 'Salto Bounce', icon: '🦘', desc: 'Movimento vertical saltitante' },
                    { id: 'float', label: 'Flutuação', icon: '☁️', desc: 'Levitação contínua suave' },
                    { id: 'none', label: 'Estático', icon: '⏸️', desc: 'Fixo e sem animação' },
                  ].map((item) => {
                    const isSelected = logoAnimationEffect === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          const newEffect = item.id as LogoAnimationEffect;
                          setLogoAnimationEffect(newEffect);
                          syncAndSave({ logoAnimationEffect: newEffect }, true);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#E30613] text-white border-red-500 font-bold shadow-md shadow-red-500/25 ring-1 ring-red-400'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-base">{item.icon}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <span className="text-xs font-bold leading-tight">{item.label}</span>
                        <span className={`text-[10px] mt-0.5 leading-snug ${isSelected ? 'text-red-100' : 'text-slate-400'}`}>
                          {item.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Seletor de Tamanho no Ecrã de Confirmação (Sem Moldura) */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-300 uppercase block">
                    Tamanho no Ecrã de Confirmação (Sem Moldura):
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {modalLogoSize === 'normal' && 'Médio (70px)'}
                    {modalLogoSize === 'large' && 'Grande (90px)'}
                    {modalLogoSize === 'xlarge' && 'Extra Grande (110px ★ Recomendado)'}
                    {modalLogoSize === '2xlarge' && 'Máximo (135px)'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {[
                    { id: 'normal', label: 'Médio', desc: '70px' },
                    { id: 'large', label: 'Grande', desc: '90px' },
                    { id: 'xlarge', label: 'X-Grande ★', desc: '110px' },
                    { id: '2xlarge', label: 'Máximo', desc: '135px' },
                  ].map((item) => {
                    const isSelected = modalLogoSize === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          const newSize = item.id as ModalLogoSize;
                          setModalLogoSize(newSize);
                          syncAndSave({ modalLogoSize: newSize }, true);
                        }}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#E30613] text-white border-red-500 font-bold shadow-sm'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        <span className="text-xs block">{item.label}</span>
                        <span className={`text-[10px] ${isSelected ? 'text-red-100' : 'text-slate-400'}`}>
                          {item.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pré-visualização em Tempo Real do Logo Sem Moldura */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-slate-300 uppercase flex items-center gap-1.5">
                    <span>Pré-Visualização em Tempo Real (Sem Moldura)</span>
                  </span>
                  <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setPreviewThemeMode('light')}
                      className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                        previewThemeMode === 'light'
                          ? 'bg-white text-slate-900 font-bold shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Fundo Claro
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewThemeMode('dark')}
                      className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                        previewThemeMode === 'dark'
                          ? 'bg-slate-800 text-white font-bold shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Fundo Escuro
                    </button>
                  </div>
                </div>

                <div className={`p-6 rounded-2xl flex flex-col items-center justify-center transition-colors min-h-[140px] relative overflow-hidden ${
                  previewThemeMode === 'light' ? 'bg-slate-100 border border-slate-300' : 'bg-slate-950 border border-slate-800'
                }`}>
                  {/* Logo sem qualquer moldura externa, em tamanho grande e com animação ativa */}
                  <img
                    src={logoUrl || DEFAULT_BRAND_LOGO}
                    alt="Pré-visualização do Logótipo"
                    className={`object-contain select-none transition-all duration-300 ${getLogoAnimationClass(logoAnimationEffect)} ${getModalLogoSizeClass(modalLogoSize)}`}
                  />
                  <span className={`mt-3 text-[10px] font-medium px-2.5 py-0.5 rounded-full ${
                    previewThemeMode === 'light'
                      ? 'bg-slate-200 text-slate-700'
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}>
                    Sem moldura • Efeito: <strong>{logoAnimationEffect}</strong> • Tamanho: <strong>{modalLogoSize}</strong>
                  </span>
                </div>
              </div>
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

              {/* Bloco Consulta de Bilhetes Registados (Mostrar/Ocultar) */}
              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 cursor-pointer hover:bg-slate-900 transition-colors">
                <input
                  type="checkbox"
                  checked={showSearchSection}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setShowSearchSection(val);
                    syncAndSave({ showSearchSection: val }, true);
                  }}
                  className="mt-0.5 rounded bg-slate-950 border-slate-700 text-[#E30613] focus:ring-red-500"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-200 block">
                    Exibir Bloco "Já se inscreveu? Consulte os seus Bilhetes"
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Desmarque para <strong>ocultar a barra de consulta/pesquisa de bilhetes</strong> na parte inferior da página pública.
                  </span>
                </div>
              </label>

              {/* Cartão de Destaque do Prémio acima do Botão (LACER HIDRO) */}
              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 cursor-pointer hover:bg-slate-900 transition-colors">
                <input
                  type="checkbox"
                  checked={showFormPrizeHighlight}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setShowFormPrizeHighlight(val);
                    syncAndSave({ showFormPrizeHighlight: val }, true);
                  }}
                  className="mt-0.5 rounded bg-slate-950 border-slate-700 text-[#E30613] focus:ring-red-500"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-200 block flex items-center gap-1.5">
                    <span>Exibir Cartão de Destaque do Prémio no Formulário</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${showFormPrizeHighlight ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                      {showFormPrizeHighlight ? 'Visível' : 'Oculto'}
                    </span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Desmarque para <strong>retirar o cartão com foto e descrição do prémio</strong> (LACER HIDRO) que surge logo acima do botão "Participar do sorteio".
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
                placeholder="PARTICIPE NO SORTEIO E PODE GANHAR UM IRRIGADOR ORAL LACER"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] text-slate-400 uppercase font-semibold">
                  Título da Secção 1 (Informações de Contato):
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-400 hover:text-white">
                  <input
                    type="checkbox"
                    checked={showFormContactSectionTitle}
                    onChange={(e) => {
                      setShowFormContactSectionTitle(e.target.checked);
                      syncAndSave({ showFormContactSectionTitle: e.target.checked });
                    }}
                    className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span>Exibir no formulário</span>
                </label>
              </div>
              <input
                type="text"
                value={formContactSectionTitle}
                disabled={!showFormContactSectionTitle}
                onChange={(e) => setFormContactSectionTitle(e.target.value)}
                onBlur={() => syncAndSave()}
                placeholder="INFORMAÇÕES DE CONTATO (Opcional)"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-40"
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

            {/* Destaque do Prémio acima do Botão */}
            <div className="pt-2 border-t border-slate-800/80">
              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 cursor-pointer hover:bg-slate-900 transition-colors">
                <input
                  type="checkbox"
                  checked={showFormPrizeHighlight}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setShowFormPrizeHighlight(val);
                    syncAndSave({ showFormPrizeHighlight: val }, true);
                  }}
                  className="mt-0.5 rounded bg-slate-950 border-slate-700 text-[#E30613] focus:ring-red-500"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-200 block flex items-center gap-1.5">
                    <span>Cartão de Destaque do Prémio (Acima do Botão de Inscrição)</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${showFormPrizeHighlight ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                      {showFormPrizeHighlight ? 'Ativo' : 'Removido'}
                    </span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Marque para exibir ou desmarque para <strong>retirar o cartão com imagem e descrição do prémio</strong> (LACER HIDRO) imediatamente acima do botão de submissão.
                  </span>
                </div>
              </label>
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

          {/* Secção de Gestão dos 3 Documentos Oficiais em PDF */}
          <div className="p-5 rounded-2xl bg-slate-950 border-2 border-red-500/50 space-y-5 shadow-xl">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#E30613]" />
                  <span>Documentos Oficiais em PDF (Consulta & Upload)</span>
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Carregue os ficheiros PDF oficiais para cada um dos 3 documentos legais exigidos. Os participantes poderão consultá-los diretamente no formulário de inscrição através dos botões e links dedicados.
                </p>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 uppercase shrink-0">
                3 Documentos Oficiais
              </span>
            </div>

            {pdfUploadError && (
              <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{pdfUploadError}</span>
              </div>
            )}

            {/* Selector de Abas dos 3 PDFs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setActivePdfDocType('legal_terms')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  activePdfDocType === 'legal_terms'
                    ? 'bg-red-500/15 border-red-500/60 shadow-md ring-1 ring-red-500/40'
                    : 'bg-slate-900 border-slate-800 hover:bg-slate-850 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Documento 1</span>
                  {legalTermsPdfUrl ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  ) : (
                    <span className="text-[9px] text-slate-500 font-mono">Padrão</span>
                  )}
                </div>
                <p className="text-xs font-bold text-white mt-1">Termos Legais do Sorteio</p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {legalTermsPdfName || (legalTermsPdfUrl ? 'PDF carregado' : 'Gerador Oficial jsPDF')}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setActivePdfDocType('hcp_privacy')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  activePdfDocType === 'hcp_privacy'
                    ? 'bg-red-500/15 border-red-500/60 shadow-md ring-1 ring-red-500/40'
                    : 'bg-slate-900 border-slate-800 hover:bg-slate-850 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Documento 2</span>
                  {hcpPrivacyPdfUrl ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  ) : (
                    <span className="text-[9px] text-slate-500 font-mono">Padrão</span>
                  )}
                </div>
                <p className="text-xs font-bold text-white mt-1">Privacidade Prof. Saúde</p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {hcpPrivacyPdfName || (hcpPrivacyPdfUrl ? 'PDF carregado' : 'Gerador Oficial jsPDF')}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setActivePdfDocType('raffle_privacy')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  activePdfDocType === 'raffle_privacy'
                    ? 'bg-red-500/15 border-red-500/60 shadow-md ring-1 ring-red-500/40'
                    : 'bg-slate-900 border-slate-800 hover:bg-slate-850 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Documento 3</span>
                  {rafflePrivacyPdfUrl ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  ) : (
                    <span className="text-[9px] text-slate-500 font-mono">Padrão</span>
                  )}
                </div>
                <p className="text-xs font-bold text-white mt-1">Privacidade do Sorteio</p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {rafflePrivacyPdfName || (rafflePrivacyPdfUrl ? 'PDF carregado' : 'Gerador Oficial jsPDF')}
                </p>
              </button>
            </div>

            {/* Painel do Documento Selecionado */}
            {activePdfDocType === 'legal_terms' && (
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div>
                    <h5 className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-red-400" />
                      <span>1. Termos Legais do Sorteio</span>
                    </h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Regulamento geral, regras de elegibilidade, prémios e apuramento dos vencedores.
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                    Identificador: termos-legais.pdf
                  </span>
                </div>

                {/* Status do Arquivo */}
                {legalTermsPdfUrl ? (
                  <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-emerald-300">Ficheiro PDF Personalizado Ativo</p>
                          <p className="text-[11px] text-slate-300 font-mono truncate max-w-sm" title={legalTermsPdfName || legalTermsPdfUrl}>
                            {legalTermsPdfName || legalTermsPdfUrl}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => openPdfDocument(legalTermsPdfUrl, legalTermsPdfName || 'Termos_Legais_Sorteio.pdf')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <span>Abrir / Testar</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveSpecificPdf('legal_terms')}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors cursor-pointer"
                          title="Remover ficheiro e voltar ao gerador padrão"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
                    <span>Nenhum PDF carregado. A aplicação gera e descarrega automaticamente o documento oficial formatado.</span>
                    <button
                      type="button"
                      onClick={() => exportLegalTermsPDF(brand)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Pré-visualizar Padrão</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Upload & Link */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      Carregar Ficheiro (.pdf)
                    </label>
                    <div className="flex items-center gap-2">
                      <label 
                        htmlFor="upload-legal-terms-pdf"
                        className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all ${
                          isUploadingPdf && uploadingDocType === 'legal_terms'
                            ? 'bg-slate-800 text-slate-400 cursor-not-allowed' 
                            : 'bg-[#E30613] hover:bg-[#C80510] text-white shadow-md active:scale-95'
                        }`}
                      >
                        {isUploadingPdf && uploadingDocType === 'legal_terms' ? (
                          <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        <span>{isUploadingPdf && uploadingDocType === 'legal_terms' ? 'A carregar...' : 'Escolher Ficheiro...'}</span>
                      </label>
                      <input
                        id="upload-legal-terms-pdf"
                        type="file"
                        accept=".pdf,application/pdf"
                        disabled={isUploadingPdf}
                        onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
                        onChange={(e) => handleSpecificPdfUpload('legal_terms', e)}
                        className="hidden"
                      />
                      <span className="text-[10px] text-slate-500">Máx. 25MB</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      Ou Inserir URL Direto
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="url"
                        value={legalTermsPdfUrl}
                        onChange={(e) => {
                          setLegalTermsPdfUrl(e.target.value);
                          setRegulationPdfUrl(e.target.value);
                        }}
                        onBlur={() => {
                          if (legalTermsPdfUrl !== brand.legalTermsPdfUrl) {
                            syncAndSave({ 
                              legalTermsPdfUrl: legalTermsPdfUrl.trim(),
                              regulationPdfUrl: legalTermsPdfUrl.trim() 
                            }, true);
                          }
                        }}
                        placeholder="https://exemplo.pt/termos-legais.pdf"
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-red-500 font-mono"
                      />
                      {legalTermsPdfUrl && (
                        <button
                          type="button"
                          onClick={() => syncAndSave({ 
                            legalTermsPdfUrl: legalTermsPdfUrl.trim(),
                            regulationPdfUrl: legalTermsPdfUrl.trim() 
                          }, true)}
                          className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                          Salvar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activePdfDocType === 'hcp_privacy' && (
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div>
                    <h5 className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-red-400" />
                      <span>2. Política de Privacidade para Profissionais de Saúde</span>
                    </h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Tratamento de dados em conformidade com o RGPD, interações científicas, visitas à clínica e perfilamento.
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                    Identificador: privacidade-profissionais.pdf
                  </span>
                </div>

                {/* Status do Arquivo */}
                {hcpPrivacyPdfUrl ? (
                  <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-emerald-300">Ficheiro PDF Personalizado Ativo</p>
                          <p className="text-[11px] text-slate-300 font-mono truncate max-w-sm" title={hcpPrivacyPdfName || hcpPrivacyPdfUrl}>
                            {hcpPrivacyPdfName || hcpPrivacyPdfUrl}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => openPdfDocument(hcpPrivacyPdfUrl, hcpPrivacyPdfName || 'Politica_Privacidade_Profissionais_Saude.pdf')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <span>Abrir / Testar</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveSpecificPdf('hcp_privacy')}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors cursor-pointer"
                          title="Remover ficheiro e voltar ao gerador padrão"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
                    <span>Nenhum PDF carregado. A aplicação gera e descarrega automaticamente o documento oficial formatado.</span>
                    <button
                      type="button"
                      onClick={() => exportHcpPrivacyPDF(brand)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Pré-visualizar Padrão</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Upload & Link */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      Carregar Ficheiro (.pdf)
                    </label>
                    <div className="flex items-center gap-2">
                      <label 
                        htmlFor="upload-hcp-privacy-pdf"
                        className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all ${
                          isUploadingPdf && uploadingDocType === 'hcp_privacy'
                            ? 'bg-slate-800 text-slate-400 cursor-not-allowed' 
                            : 'bg-[#E30613] hover:bg-[#C80510] text-white shadow-md active:scale-95'
                        }`}
                      >
                        {isUploadingPdf && uploadingDocType === 'hcp_privacy' ? (
                          <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        <span>{isUploadingPdf && uploadingDocType === 'hcp_privacy' ? 'A carregar...' : 'Escolher Ficheiro...'}</span>
                      </label>
                      <input
                        id="upload-hcp-privacy-pdf"
                        type="file"
                        accept=".pdf,application/pdf"
                        disabled={isUploadingPdf}
                        onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
                        onChange={(e) => handleSpecificPdfUpload('hcp_privacy', e)}
                        className="hidden"
                      />
                      <span className="text-[10px] text-slate-500">Máx. 25MB</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      Ou Inserir URL Direto
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="url"
                        value={hcpPrivacyPdfUrl}
                        onChange={(e) => setHcpPrivacyPdfUrl(e.target.value)}
                        onBlur={() => {
                          if (hcpPrivacyPdfUrl !== brand.hcpPrivacyPdfUrl) {
                            syncAndSave({ hcpPrivacyPdfUrl: hcpPrivacyPdfUrl.trim() }, true);
                          }
                        }}
                        placeholder="https://exemplo.pt/privacidade-profissionais.pdf"
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-red-500 font-mono"
                      />
                      {hcpPrivacyPdfUrl && (
                        <button
                          type="button"
                          onClick={() => syncAndSave({ hcpPrivacyPdfUrl: hcpPrivacyPdfUrl.trim() }, true)}
                          className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                          Salvar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activePdfDocType === 'raffle_privacy' && (
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div>
                    <h5 className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-red-400" />
                      <span>3. Política de Privacidade do Sorteio</span>
                    </h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Tratamento de dados estritamente para gestão do sorteio, apuramento e entrega do prémio.
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                    Identificador: privacidade-sorteio.pdf
                  </span>
                </div>

                {/* Status do Arquivo */}
                {rafflePrivacyPdfUrl ? (
                  <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-emerald-300">Ficheiro PDF Personalizado Ativo</p>
                          <p className="text-[11px] text-slate-300 font-mono truncate max-w-sm" title={rafflePrivacyPdfName || rafflePrivacyPdfUrl}>
                            {rafflePrivacyPdfName || rafflePrivacyPdfUrl}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => openPdfDocument(rafflePrivacyPdfUrl, rafflePrivacyPdfName || 'Politica_Privacidade_Sorteio.pdf')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <span>Abrir / Testar</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveSpecificPdf('raffle_privacy')}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors cursor-pointer"
                          title="Remover ficheiro e voltar ao gerador padrão"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
                    <span>Nenhum PDF carregado. A aplicação gera e descarrega automaticamente o documento oficial formatado.</span>
                    <button
                      type="button"
                      onClick={() => exportRafflePrivacyPDF(brand)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Pré-visualizar Padrão</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Upload & Link */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      Carregar Ficheiro (.pdf)
                    </label>
                    <div className="flex items-center gap-2">
                      <label 
                        htmlFor="upload-raffle-privacy-pdf"
                        className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all ${
                          isUploadingPdf && uploadingDocType === 'raffle_privacy'
                            ? 'bg-slate-800 text-slate-400 cursor-not-allowed' 
                            : 'bg-[#E30613] hover:bg-[#C80510] text-white shadow-md active:scale-95'
                        }`}
                      >
                        {isUploadingPdf && uploadingDocType === 'raffle_privacy' ? (
                          <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        <span>{isUploadingPdf && uploadingDocType === 'raffle_privacy' ? 'A carregar...' : 'Escolher Ficheiro...'}</span>
                      </label>
                      <input
                        id="upload-raffle-privacy-pdf"
                        type="file"
                        accept=".pdf,application/pdf"
                        disabled={isUploadingPdf}
                        onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
                        onChange={(e) => handleSpecificPdfUpload('raffle_privacy', e)}
                        className="hidden"
                      />
                      <span className="text-[10px] text-slate-500">Máx. 25MB</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      Ou Inserir URL Direto
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="url"
                        value={rafflePrivacyPdfUrl}
                        onChange={(e) => setRafflePrivacyPdfUrl(e.target.value)}
                        onBlur={() => {
                          if (rafflePrivacyPdfUrl !== brand.rafflePrivacyPdfUrl) {
                            syncAndSave({ rafflePrivacyPdfUrl: rafflePrivacyPdfUrl.trim() }, true);
                          }
                        }}
                        placeholder="https://exemplo.pt/privacidade-sorteio.pdf"
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-red-500 font-mono"
                      />
                      {rafflePrivacyPdfUrl && (
                        <button
                          type="button"
                          onClick={() => syncAndSave({ rafflePrivacyPdfUrl: rafflePrivacyPdfUrl.trim() }, true)}
                          className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                          Salvar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Card Especial de Textos Oficiais de Consentimento RGPD & Visitas LACER */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 shadow-lg">
            <div className="flex items-start justify-between border-b border-slate-900 pb-3">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#E30613]" />
                  <span>Textos de Consentimento RGPD & Visita da LACER</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Textos apresentados na secção de consentimentos e proteção de dados no formulário público.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const defaults = {
                    consentVisitTitle: 'Gostaria que um representante da LACER visitasse a sua clínica para lhe apresentar os nossos produtos?',
                    consentHcpDatabaseText: 'Sim, concordo que os meus dados sejam armazenados na base de dados de profissionais de saúde para gerir interações científicas, incluindo consultas médicas.',
                    consentCommunicationsText: 'Concordo em receber comunicações científicas e educacionais, bem como informações sobre produtos ou atividades, por e-mail ou outros meios, e que essas sejam seguidas através de tecnologias de rastreio.',
                    consentProfilingText: 'Concordo com a criação de um perfil profissional que tenha em conta os meus interesses técnico-profissionais em áreas terapêuticas relevantes (perfilado).',
                    consentLegalNoticeP1: 'A LACER, S.A. processará os dados pessoais fornecidos para gerir a sua participação no sorteio, incluindo, quando aplicável, a seleção e comunicação dos vencedores e a gestão da entrega dos prémios. Além disso, com base no seu consentimento, iremos: enviar-lhe, incluindo por meios eletrónicos, informações científicas e educativas, notícias, eventos e produtos, e seguir esses envios utilizando tecnologias de rastreio; criar um perfil profissional com base nos seus interesses técnicos e profissionais em áreas terapêuticas relevantes; e incluir os seus dados na base de dados de profissionais de saúde para gerir as interações consigo, incluindo consultas médicas e atividades científicas.',
                    consentLegalNoticeP2: 'Também processaremos os seus dados para cumprir as obrigações legais aplicáveis ao setor farmacêutico.',
                    consentLegalNoticeP3: 'Para mais informações e para saber como exercer os seus direitos de acesso, retificação, supressão, revogação do consentimento, entre outros, consulte a nossa Política de Privacidade do Sorteio e a nossa Política de Privacidade para Profissionais de Saúde.',
                    consentTermsDeclaration: 'Declaro que li e aceito os Termos Legais do Sorteio e que fui informado(a) sobre o processamento dos meus dados pessoais através da Política de Privacidade do Sorteio e a nossa Política de Privacidade para Profissionais de Saúde.',
                  };
                  setConsentVisitTitle(defaults.consentVisitTitle);
                  setConsentHcpDatabaseText(defaults.consentHcpDatabaseText);
                  setConsentCommunicationsText(defaults.consentCommunicationsText);
                  setConsentProfilingText(defaults.consentProfilingText);
                  setConsentLegalNoticeP1(defaults.consentLegalNoticeP1);
                  setConsentLegalNoticeP2(defaults.consentLegalNoticeP2);
                  setConsentLegalNoticeP3(defaults.consentLegalNoticeP3);
                  setConsentTermsDeclaration(defaults.consentTermsDeclaration);
                  syncAndSave(defaults, true);
                }}
                className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 cursor-pointer transition-colors"
                title="Repor redação oficial padrão da LACER"
              >
                Restaurar Padrão Oficial
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  1. Pergunta de Visita da LACER à Clínica
                </label>
                <input
                  type="text"
                  value={consentVisitTitle}
                  onChange={(e) => setConsentVisitTitle(e.target.value)}
                  onBlur={() => syncAndSave()}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  2. Consentimento: Base de Dados de Profissionais de Saúde
                </label>
                <textarea
                  rows={2}
                  value={consentHcpDatabaseText}
                  onChange={(e) => setConsentHcpDatabaseText(e.target.value)}
                  onBlur={() => syncAndSave()}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  3. Consentimento: Comunicações Científicas e Educacionais
                </label>
                <textarea
                  rows={2}
                  value={consentCommunicationsText}
                  onChange={(e) => setConsentCommunicationsText(e.target.value)}
                  onBlur={() => syncAndSave()}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  4. Consentimento: Perfil Profissional (Perfilado)
                </label>
                <textarea
                  rows={2}
                  value={consentProfilingText}
                  onChange={(e) => setConsentProfilingText(e.target.value)}
                  onBlur={() => syncAndSave()}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  5. Texto Informativo: Finalidade e Tratamento de Dados (LACER, S.A.)
                </label>
                <textarea
                  rows={3}
                  value={consentLegalNoticeP1}
                  onChange={(e) => setConsentLegalNoticeP1(e.target.value)}
                  onBlur={() => syncAndSave()}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  6. Declaração Obrigatória de Aceitação dos Termos do Sorteio
                </label>
                <textarea
                  rows={2}
                  value={consentTermsDeclaration}
                  onChange={(e) => setConsentTermsDeclaration(e.target.value)}
                  onBlur={() => syncAndSave()}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                />
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
                    {formTitle || 'PARTICIPE NO SORTEIO E PODE GANHAR UM IRRIGADOR ORAL LACER'}
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
