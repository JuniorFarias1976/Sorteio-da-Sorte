import React, { useState } from 'react';
import { AppUser, UserRole, BrandConfig } from '../../types';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  User, 
  Search, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Key, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  ShieldAlert,
  Tv,
  Gift,
  Calendar,
  FileCheck2,
  SlidersHorizontal,
  Palette,
  QrCode
} from 'lucide-react';
import { isLightColor } from '../../utils/storage';

interface UsersTabProps {
  users: AppUser[];
  brand: BrandConfig;
  currentUser: AppUser | null;
  onUpdateUsers: (users: AppUser[], deletedId?: string) => void;
}

export const UsersTab: React.FC<UsersTabProps> = ({
  users,
  brand,
  currentUser,
  onUpdateUsers,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  
  // Form fields
  const [formData, setFormData] = useState<{
    name: string;
    username: string;
    password: string;
    role: UserRole;
    active: boolean;
  }>({
    name: '',
    username: '',
    password: '',
    role: 'standard',
    active: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<AppUser | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const isLight = isLightColor(brand.backgroundColor || '#FFFFFF');

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3200);
  };

  const triggerErrorToast = (msg: string) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(null), 4000);
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      username: '',
      password: '',
      role: 'standard',
      active: true,
    });
    setFormError(null);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: AppUser) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      username: user.username,
      password: user.password || '',
      role: user.role,
      active: user.active,
    });
    setFormError(null);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const name = formData.name.trim();
    const username = formData.username.trim().toLowerCase();
    const password = formData.password.trim();

    if (!name) {
      setFormError('Por favor, indique o nome completo do utilizador.');
      return;
    }

    if (!username) {
      setFormError('Por favor, defina um nome de utilizador (login).');
      return;
    }

    // Check duplicate username
    const duplicate = users.find(
      (u) => u.username.toLowerCase() === username && (!editingUser || u.id !== editingUser.id)
    );
    if (duplicate) {
      setFormError(`O nome de utilizador "${username}" já se encontra em utilização.`);
      return;
    }

    if (!editingUser && !password) {
      setFormError('Por favor, defina uma palavra-passe para o novo utilizador.');
      return;
    }

    if (editingUser) {
      // Editing existing user
      const updated = users.map((u) => {
        if (u.id === editingUser.id) {
          return {
            ...u,
            name,
            username,
            password: password || u.password,
            role: formData.role,
            active: formData.active,
          };
        }
        return u;
      });
      onUpdateUsers(updated);
      triggerToast(`Utilizador "${name}" atualizado com sucesso!`);
    } else {
      // Creating new user
      const newUser: AppUser = {
        id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name,
        username,
        password,
        role: formData.role,
        active: formData.active,
        createdAt: new Date().toISOString(),
      };
      onUpdateUsers([newUser, ...users]);
      triggerToast(`Novo utilizador "${name}" criado com sucesso!`);
    }

    setIsModalOpen(false);
  };

  const handleToggleStatus = (user: AppUser) => {
    if (user.id === currentUser?.id) {
      triggerErrorToast('Não é possível desativar a sua própria conta atualmente em sessão.');
      return;
    }

    const updated = users.map((u) =>
      u.id === user.id ? { ...u, active: !u.active } : u
    );
    onUpdateUsers(updated);
    triggerToast(
      `Utilizador "${user.name}" ${!user.active ? 'ativado' : 'desativado'} com sucesso!`
    );
  };

  const handleDeleteUser = (user: AppUser) => {
    if (user.id === currentUser?.id) {
      setDeleteConfirmUser(null);
      triggerErrorToast('Não é possível eliminar a sua própria conta atualmente em sessão.');
      return;
    }

    const adminCount = users.filter((u) => u.role === 'admin' && u.active).length;
    if (user.role === 'admin' && adminCount <= 1) {
      setDeleteConfirmUser(null);
      triggerErrorToast('Não é possível eliminar o único Administrador ativo do sistema.');
      return;
    }

    const filtered = users.filter((u) => u.id !== user.id);
    onUpdateUsers(filtered, user.id);
    setDeleteConfirmUser(null);
    triggerToast(`Utilizador "${user.name}" eliminado com sucesso.`);
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalUsers = users.length;
  const adminUsers = users.filter((u) => u.role === 'admin').length;
  const standardUsers = users.filter((u) => u.role === 'standard').length;
  const activeCount = users.filter((u) => u.active).length;

  return (
    <div className="space-y-6">
      {/* Header & Role Privileges Explanation Banner */}
      <div className={`p-5 sm:p-6 rounded-2xl border shadow-sm ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`p-3 rounded-2xl border shrink-0 ${
              isLight ? 'bg-red-50 border-red-200 text-[#E30613]' : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Gestão de Utilizadores & Permissões
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-100 text-[#E30613] border border-red-200">
                  Acesso Restrito
                </span>
              </div>
              <p className={`text-xs mt-1 max-w-3xl ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Cadastre e administre utilizadores com credenciais individuais de login. Os utilizadores padrão têm acesso estritamente restrito às 5 abas operacionais do sorteio.
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#E30613] hover:bg-[#C80510] text-white font-bold rounded-xl text-xs shadow-md shadow-red-600/20 transition-all cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Adicionar Utilizador</span>
          </button>
        </div>

        {/* Roles Breakdown Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-5 pt-5 border-t border-slate-200 dark:border-slate-800 text-xs">
          <div className={`p-3.5 rounded-xl border flex flex-col gap-2 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
          }`}>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                <User className="w-3 h-3" />
                Utilizador Padrão
              </span>
              <span className={`text-[11px] font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Visualiza exclusivamente as 5 abas autorizadas:
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-medium text-slate-700 dark:text-slate-300">
                <Users className="w-2.5 h-2.5 text-blue-500" /> 1. Participantes Inscritos
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-medium text-slate-700 dark:text-slate-300">
                <Gift className="w-2.5 h-2.5 text-amber-500" /> 2. Prêmios e Quantidades
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-medium text-slate-700 dark:text-slate-300">
                <Calendar className="w-2.5 h-2.5 text-emerald-500" /> 3. Calendário do Sorteios
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-medium text-slate-700 dark:text-slate-300">
                <FileCheck2 className="w-2.5 h-2.5 text-purple-500" /> 4. Relatório & Auditoria PDF
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-bold text-[#E30613]">
                <Tv className="w-2.5 h-2.5 text-[#E30613]" /> 5. Sorteio
              </span>
            </div>
          </div>

          <div className={`p-3.5 rounded-xl border flex flex-col gap-2 ${
            isLight ? 'bg-red-50/50 border-red-200/80' : 'bg-red-950/20 border-red-900/40'
          }`}>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Administrador
              </span>
              <span className={`text-[11px] font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Acesso Total & Configurações Avançadas
              </span>
            </div>
            <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Possui permissões completas, incluindo edição de campos de formulário, personalização de logótipo e cores, poster QR Code, gestão de utilizadores e reposição de dados do sistema.
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className={`p-4 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total de Utilizadores</p>
          <p className="text-2xl font-black mt-1 text-slate-900 dark:text-white">{totalUsers}</p>
        </div>
        <div className={`p-4 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
          <p className="text-[11px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">Administradores</p>
          <p className="text-2xl font-black mt-1 text-[#E30613]">{adminUsers}</p>
        </div>
        <div className={`p-4 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
          <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Utilizadores Padrão</p>
          <p className="text-2xl font-black mt-1 text-blue-600 dark:text-blue-400">{standardUsers}</p>
        </div>
        <div className={`p-4 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
          <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Contas Ativas</p>
          <p className="text-2xl font-black mt-1 text-emerald-600 dark:text-emerald-400">{activeCount}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className={`p-3 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar por nome ou utilizador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full rounded-xl pl-9 pr-3 py-2 text-xs outline-none transition-all focus:ring-2 focus:ring-[#E30613] ${
              isLight 
                ? 'bg-slate-50 border border-slate-200 text-slate-900' 
                : 'bg-slate-950 border border-slate-800 text-white'
            }`}
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setRoleFilter('all')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              roleFilter === 'all'
                ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900'
                : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            Todos ({totalUsers})
          </button>
          <button
            onClick={() => setRoleFilter('admin')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              roleFilter === 'admin'
                ? 'bg-[#E30613] text-white'
                : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            Administradores ({adminUsers})
          </button>
          <button
            onClick={() => setRoleFilter('standard')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              roleFilter === 'standard'
                ? 'bg-blue-600 text-white'
                : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            Padrão ({standardUsers})
          </button>
        </div>
      </div>

      {/* Users Table / Cards */}
      <div className={`border rounded-2xl overflow-hidden shadow-sm ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`border-b text-[11px] font-bold uppercase tracking-wider ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950/60 border-slate-800 text-slate-400'
            }`}>
              <tr>
                <th className="py-3 px-4">Utilizador</th>
                <th className="py-3 px-4">Nome de Acesso (Login)</th>
                <th className="py-3 px-4">Tipo de Permissão</th>
                <th className="py-3 px-4">Abas Visíveis</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Nenhum utilizador encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isCurrent = currentUser?.id === user.id;
                  const isAdmin = user.role === 'admin';

                  return (
                    <tr 
                      key={user.id}
                      className={`transition-colors ${
                        isCurrent 
                          ? (isLight ? 'bg-amber-50/40' : 'bg-amber-950/10') 
                          : (isLight ? 'hover:bg-slate-50/70' : 'hover:bg-slate-800/40')
                      }`}
                    >
                      <td className="py-3.5 px-4 font-semibold">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0 ${
                            isAdmin 
                              ? 'bg-red-100 text-[#E30613] border border-red-200' 
                              : 'bg-blue-100 text-blue-700 border border-blue-200'
                          }`}>
                            {user.name.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                {user.name}
                              </span>
                              {isCurrent && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                  Você (Em Sessão)
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400">
                              Criado em: {new Date(user.createdAt).toLocaleDateString('pt-PT')}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                          {user.username}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-red-100 text-[#E30613] border border-red-200">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Administrador
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                            <User className="w-3.5 h-3.5" />
                            Utilizador Padrão
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {isAdmin ? (
                          <span className="text-[11px] text-slate-500 font-medium">
                            Todas as abas + Configurações
                          </span>
                        ) : (
                          <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                            5 Abas: Participantes, Prêmios, Calendário, Relatório & Sorteio
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(user)}
                          disabled={isCurrent}
                          title={isCurrent ? 'Não pode desativar o seu próprio utilizador' : 'Alternar estado ativo/inativo'}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                            isCurrent ? 'opacity-80 cursor-default' : 'cursor-pointer hover:scale-105'
                          } ${
                            user.active
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-200 text-slate-600 border border-slate-300 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {user.active ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Ativo</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-slate-400" />
                              <span>Inativo</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-slate-800 text-slate-300'
                            }`}
                            title="Editar Utilizador"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setDeleteConfirmUser(user)}
                            disabled={isCurrent}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isCurrent
                                ? 'opacity-30 cursor-not-allowed text-slate-400'
                                : 'text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30'
                            }`}
                            title={isCurrent ? 'Não pode eliminar o seu próprio utilizador' : 'Eliminar Utilizador'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create / Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className={`border rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <h3 className="text-lg font-black tracking-tight mb-1">
              {editingUser ? 'Editar Utilizador' : 'Adicionar Novo Utilizador'}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              {editingUser 
                ? 'Atualize as permissões ou a palavra-passe deste utilizador.' 
                : 'Crie uma nova conta com perfil de Administrador ou Utilizador Padrão.'}
            </p>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">
                  Nome Completo: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Dra. Ana Ferreira ou Operador Stand"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#E30613] ${
                    isLight ? 'bg-slate-50 border border-slate-200 text-slate-900' : 'bg-slate-950 border border-slate-800 text-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">
                  Nome de Utilizador (Login): <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: operador ou ana.ferreira"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-mono outline-none focus:ring-2 focus:ring-[#E30613] ${
                    isLight ? 'bg-slate-50 border border-slate-200 text-slate-900' : 'bg-slate-950 border border-slate-800 text-white'
                  }`}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold">
                    Palavra-passe: {!editingUser && <span className="text-red-500">*</span>}
                  </label>
                  {editingUser && (
                    <span className="text-[10px] text-slate-400">
                      (Deixe em branco para manter a atual)
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={editingUser ? 'Nova palavra-passe (opcional)' : 'Defina uma palavra-passe segura'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`w-full rounded-xl pl-3.5 pr-10 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#E30613] ${
                      isLight ? 'bg-slate-50 border border-slate-200 text-slate-900' : 'bg-slate-950 border border-slate-800 text-white'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold mb-2">
                  Tipo de Perfil e Acesso: <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Standard Option */}
                  <label
                    onClick={() => setFormData({ ...formData, role: 'standard' })}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col gap-1.5 ${
                      formData.role === 'standard'
                        ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/30 ring-2 ring-blue-500/20'
                        : isLight ? 'bg-white border-slate-200 hover:border-slate-300' : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
                        <User className="w-4 h-4" />
                        Utilizador Padrão
                      </span>
                      <input
                        type="radio"
                        name="userRole"
                        checked={formData.role === 'standard'}
                        onChange={() => {}}
                        className="accent-blue-600"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Acesso restrito às 5 abas operacionais do sorteio (Participantes, Prêmios, Calendário, Relatório, Sorteio).
                    </p>
                  </label>

                  {/* Admin Option */}
                  <label
                    onClick={() => setFormData({ ...formData, role: 'admin' })}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col gap-1.5 ${
                      formData.role === 'admin'
                        ? 'border-[#E30613] bg-red-50/70 dark:bg-red-950/30 ring-2 ring-red-500/20'
                        : isLight ? 'bg-white border-slate-200 hover:border-slate-300' : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold flex items-center gap-1.5 text-[#E30613]">
                        <ShieldCheck className="w-4 h-4" />
                        Administrador
                      </span>
                      <input
                        type="radio"
                        name="userRole"
                        checked={formData.role === 'admin'}
                        onChange={() => {}}
                        className="accent-red-600"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Acesso completo a todas as funcionalidades, configurações avançadas, formulário, personalização e utilizadores.
                    </p>
                  </label>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="userActiveCheck"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded accent-[#E30613] w-4 h-4 cursor-pointer"
                />
                <label htmlFor="userActiveCheck" className="text-xs font-semibold cursor-pointer select-none">
                  Conta ativa (permite início de sessão imediato)
                </label>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-xs text-[#E30613] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold cursor-pointer border ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#E30613] hover:bg-[#C80510] text-white font-bold rounded-xl text-xs shadow-md shadow-red-600/20 cursor-pointer"
                >
                  {editingUser ? 'Guardar Alterações' : 'Criar Utilizador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className={`border rounded-3xl p-6 max-w-sm w-full shadow-2xl relative ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <ShieldAlert className="w-6 h-6" />
              <h4 className="text-base font-black">Eliminar Utilizador</h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">
              Tem a certeza de que deseja eliminar permanentemente a conta de <strong className="text-slate-900 dark:text-white">"{deleteConfirmUser.name}"</strong> ({deleteConfirmUser.username})? Esta ação não pode ser anulada.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteUser(deleteConfirmUser)}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-md"
              >
                Sim, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Success Toast */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border-2 border-emerald-500 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-bold text-emerald-200">{successToast}</p>
        </div>
      )}

      {/* Floating Error Toast */}
      {errorToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-red-950 border-2 border-[#E30613] text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-xs font-bold text-red-100">{errorToast}</p>
        </div>
      )}
    </div>
  );
};
