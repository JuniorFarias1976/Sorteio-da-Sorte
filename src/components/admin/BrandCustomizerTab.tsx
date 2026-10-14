import React, { useState } from 'react';
import { BrandConfig } from '../../types';
import { Palette, Upload, Image, RotateCcw, Check, Sparkles, Building2, ShieldCheck } from 'lucide-react';
import { DEFAULT_BRAND_LOGO } from '../../utils/storage';

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
  const [savedSuccess, setSavedSuccess] = useState(false);

  // File upload reader for logo
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, envie um arquivo de imagem (PNG, JPG, SVG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyPreset = (theme: { name: string; primary: string; secondary: string; accent: string }) => {
    setPrimaryColor(theme.primary);
    setSecondaryColor(theme.secondary);
    setAccentColor(theme.accent);
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
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
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
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
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md transition-all active:scale-98 cursor-pointer"
        >
          {savedSuccess ? <Check className="w-4 h-4 text-emerald-950" /> : <Sparkles className="w-4 h-4" />}
          <span>{savedSuccess ? 'Salvo com Sucesso!' : 'Aplicar Alterações'}</span>
        </button>
      </div>

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
              <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center p-2 overflow-hidden shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo Preview" className="w-full h-full object-contain" />
                ) : (
                  <Image className="w-8 h-8 text-slate-500" />
                )}
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer border border-slate-700 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload do Arquivo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => setLogoUrl(DEFAULT_BRAND_LOGO)}
                    className="px-2.5 py-1.5 text-slate-400 hover:text-white text-xs flex items-center gap-1"
                    title="Restaurar Logo Padrão"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restaurar</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="Ou insira a URL da imagem..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
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
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Slogan / Mensagem de Apresentação
            </label>
            <input
              type="text"
              value={companySlogan}
              onChange={(e) => setCompanySlogan(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
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
              Amostra de Botão e Elemento com as cores selecionadas:
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
