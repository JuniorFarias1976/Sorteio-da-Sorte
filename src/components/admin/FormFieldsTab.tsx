import React, { useState, useEffect } from 'react';
import { FormFieldsConfig } from '../../types';
import { SlidersHorizontal, Check, RotateCcw, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { DEFAULT_FORM_FIELDS } from '../../utils/storage';

interface FormFieldsTabProps {
  formFields: FormFieldsConfig;
  onUpdateFormFields: (fields: FormFieldsConfig) => void;
}

export const FormFieldsTab: React.FC<FormFieldsTabProps> = ({
  formFields,
  onUpdateFormFields,
}) => {
  const [fields, setFields] = useState<FormFieldsConfig>(formFields);
  const [saveToast, setSaveToast] = useState(false);

  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  useEffect(() => {
    setFields(formFields);
  }, [formFields]);

  const handleToggleEnabled = (key: keyof FormFieldsConfig) => {
    // Email is critical for single registration check
    if (key === 'email') {
      setValidationWarning('O campo E-mail é a chave de validação de cada participante e deve permanecer ativo.');
      setTimeout(() => setValidationWarning(null), 3500);
      return;
    }
    const updated = {
      ...fields,
      [key]: {
        ...fields[key],
        enabled: !fields[key].enabled,
      },
    };
    setFields(updated);
  };

  const handleToggleRequired = (key: keyof FormFieldsConfig) => {
    if (key === 'email') {
      setValidationWarning('O campo E-mail é recomendado como obrigatório para evitar duplicidade de inscrições.');
      setTimeout(() => setValidationWarning(null), 3500);
      return;
    }
    const updated = {
      ...fields,
      [key]: {
        ...fields[key],
        required: !fields[key].required,
      },
    };
    setFields(updated);
  };

  const handleUpdateText = (
    key: keyof FormFieldsConfig,
    property: 'label' | 'placeholder',
    value: string
  ) => {
    const updated = {
      ...fields,
      [key]: {
        ...fields[key],
        [property]: value,
      },
    };
    setFields(updated);
  };

  const handleSave = () => {
    onUpdateFormFields(fields);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3500);
  };

  const handleReset = () => {
    setFields(DEFAULT_FORM_FIELDS);
    onUpdateFormFields(DEFAULT_FORM_FIELDS);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-amber-400" />
            <span>Configuração dos Campos de Inscrição</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Defina quais informações solicitar aos participantes: marque como Obrigatório, Opcional ou Oculte o que não for necessário
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrão</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Salvar Alterações</span>
          </button>
        </div>
      </div>

      {saveToast && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4" />
          <span>Configuração dos campos salva com sucesso! O formulário público já está atualizado.</span>
        </div>
      )}

      {validationWarning && (
        <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-300 text-xs font-medium flex items-center gap-2 animate-fadeIn">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{validationWarning}</span>
        </div>
      )}

      {/* Grid of Fields Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(Object.keys(fields) as Array<keyof FormFieldsConfig>).map((key) => {
          const field = fields[key];
          const isEmail = key === 'email';

          return (
            <div
              key={key}
              className={`p-5 rounded-2xl border transition-all ${
                field.enabled
                  ? 'bg-slate-900 border-slate-800 shadow-md'
                  : 'bg-slate-950/60 border-slate-900 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      field.enabled ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-slate-700'
                    }`}
                  ></span>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{field.label}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({key})</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {field.enabled 
                        ? field.required 
                          ? 'Obrigatório no formulário público' 
                          : 'Preenchimento opcional pelo participante'
                        : 'Oculto (não será solicitado no site)'}
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    !field.enabled
                      ? 'bg-slate-800 text-slate-400'
                      : field.required
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                  }`}
                >
                  {!field.enabled ? 'Oculto' : field.required ? 'Obrigatório' : 'Opcional'}
                </span>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 mb-4 text-xs">
                <button
                  type="button"
                  onClick={() => handleToggleEnabled(key)}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-semibold transition-colors cursor-pointer ${
                    field.enabled
                      ? 'bg-slate-800/80 border-slate-700 text-emerald-400'
                      : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-white'
                  }`}
                >
                  {field.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{field.enabled ? 'Exibido' : 'Oculto'}</span>
                </button>

                <button
                  type="button"
                  disabled={!field.enabled || isEmail}
                  onClick={() => handleToggleRequired(key)}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-semibold transition-colors cursor-pointer disabled:opacity-50 ${
                    field.required
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{field.required ? 'Obrigatório *' : 'Opcional'}</span>
                </button>
              </div>

              {/* Text customizer when enabled */}
              {field.enabled && (
                <div className="space-y-2.5 pt-1">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">
                      Texto do Rótulo (Label):
                    </label>
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => handleUpdateText(key, 'label', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:ring-1 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] text-slate-400 uppercase font-semibold">
                        Texto de Exemplo (Placeholder):
                      </label>
                      {field.placeholder && (
                        <button
                          type="button"
                          onClick={() => handleUpdateText(key, 'placeholder', '')}
                          className="text-[10px] text-slate-500 hover:text-amber-400 underline cursor-pointer"
                        >
                          Limpar
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={field.placeholder || ''}
                      onChange={(e) => handleUpdateText(key, 'placeholder', e.target.value)}
                      placeholder="Deixe em branco para o campo ficar limpo sem texto de exemplo..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:ring-1 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-between text-xs text-slate-400">
        <span>* O campo de E-mail é mantido como validador único antifraude para garantir que cada pessoa concorra com apenas um bilhete.</span>
        <button
          onClick={handleSave}
          className="text-amber-400 hover:text-amber-300 font-bold"
        >
          Aplicar agora
        </button>
      </div>
    </div>
  );
};
