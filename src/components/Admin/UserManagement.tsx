import React, { useState, useEffect } from 'react';
import { 
  User, Search, Edit, Trash, Eye, X, Check, UserPlus, 
  Filter, ChevronDown, Mail, Phone, Calendar, Award, 
  Activity, AlertCircle, DollarSign, Stethoscope, Users,
  MapPin, Heart, Globe, Clock
} from 'lucide-react';
import { adminService, User as UserType } from '../../services/adminService';
import { useNotification } from '../../context/NotificationContext';

interface UserManagementProps {
  userType: 'doctor' | 'patient' | 'all';
}

const UserManagement: React.FC<UserManagementProps> = ({ userType }) => {
  const { showNotification } = useNotification();
  const [users, setUsers] = useState<UserType[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: userType === 'all' ? 'patient' : userType,
    phoneNumber: '',
    specialty: '',
    isActive: true,
    dateOfBirth: '',
    gender: '',
    address: '',
    bloodType: '',
    licenseNumber: '',
    biography: '',
    languages: [] as string[],
    consultationPrice: 50
  });

  useEffect(() => {
    fetchUsers();
  }, [userType]);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, users, filterStatus]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllUsers();
      let filtered = response.data;
      if (userType !== 'all') {
        filtered = filtered.filter(u => u.role === userType);
      }
      setUsers(filtered);
      setFilteredUsers(filtered);
    } catch (error) {
      console.error('Erreur récupération utilisateurs:', error);
      showNotification('Erreur lors du chargement des utilisateurs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        u =>
          u.firstName?.toLowerCase().includes(term) ||
          u.lastName?.toLowerCase().includes(term) ||
          u.email?.toLowerCase().includes(term) ||
          (u.phoneNumber && u.phoneNumber.toLowerCase().includes(term)) ||
          (u.specialty && u.specialty.toLowerCase().includes(term))
      );
    }
    if (filterStatus === 'active') {
      filtered = filtered.filter(u => u.isActive);
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter(u => !u.isActive);
    }
    setFilteredUsers(filtered);
  };

  const handleCreateUser = async () => {
    try {
      if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
        showNotification('Veuillez remplir tous les champs obligatoires', 'error');
        return;
      }
      const response = await adminService.createUser(formData);
      if (response.success) {
        showNotification(`✅ ${formData.role === 'doctor' ? 'Médecin' : 'Patient'} créé avec succès`, 'success');
        setIsCreating(false);
        resetForm();
        setShowUserModal(false);
        fetchUsers();
      }
    } catch (error) {
      console.error('Erreur création:', error);
      showNotification('❌ Erreur lors de la création', 'error');
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    try {
      const response = await adminService.updateUser(selectedUser.id, formData);
      if (response.success) {
        showNotification(`✅ ${selectedUser.role === 'doctor' ? 'Médecin' : 'Patient'} mis à jour`, 'success');
        setShowUserModal(false);
        setIsEditing(false);
        fetchUsers();
      }
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      showNotification('❌ Erreur lors de la mise à jour', 'error');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    try {
      const response = await adminService.deleteUser(userId);
      if (response.success) {
        showNotification('✅ Utilisateur supprimé avec succès', 'success');
        fetchUsers();
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      showNotification('❌ Erreur lors de la suppression', 'error');
    }
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      const response = await adminService.toggleUserStatus(userId);
      if (response.success) {
        showNotification(`✅ Utilisateur ${response.data.isActive ? 'activé' : 'désactivé'}`, 'success');
        fetchUsers();
      }
    } catch (error) {
      console.error('Erreur changement statut:', error);
      showNotification('❌ Erreur lors du changement de statut', 'error');
    }
  };

  const handleViewUser = async (user: UserType) => {
    try {
      const response = await adminService.getUserById(user.id);
      setSelectedUser(response.data);
      setFormData({
        firstName: response.data.firstName || '',
        lastName: response.data.lastName || '',
        email: response.data.email || '',
        password: '',
        role: response.data.role,
        phoneNumber: response.data.phoneNumber || '',
        specialty: response.data.specialty || '',
        isActive: response.data.isActive,
        dateOfBirth: response.data.dateOfBirth || '',
        gender: response.data.gender || '',
        address: response.data.address || '',
        bloodType: response.data.bloodType || '',
        licenseNumber: response.data.licenseNumber || '',
        biography: response.data.biography || '',
        languages: response.data.languages || [],
        consultationPrice: response.data.consultationPrice || 50
      });
      setShowUserModal(true);
      setIsEditing(false);
    } catch (error) {
      console.error('Erreur récupération détails:', error);
      showNotification('❌ Erreur lors du chargement des détails', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: userType === 'all' ? 'patient' : userType,
      phoneNumber: '',
      specialty: '',
      isActive: true,
      dateOfBirth: '',
      gender: '',
      address: '',
      bloodType: '',
      licenseNumber: '',
      biography: '',
      languages: [],
      consultationPrice: 50
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-green-50 text-green-700 border border-green-200 shadow-sm">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        Actif
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-red-100 to-red-50 text-red-700 border border-red-200 shadow-sm">
        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
        Inactif
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'doctor':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-200 shadow-sm">
            <Stethoscope className="w-3 h-3" />
            Médecin
          </span>
        );
      case 'patient':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-green-100 to-green-50 text-green-700 rounded-full text-xs font-semibold border border-green-200 shadow-sm">
            <Users className="w-3 h-3" />
            Patient
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 rounded-full text-xs font-semibold border border-purple-200 shadow-sm">
            <User className="w-3 h-3" />
            Admin
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec filtres */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl shadow-md ${
              userType === 'doctor' 
                ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                : userType === 'patient'
                ? 'bg-gradient-to-br from-green-500 to-teal-600'
                : 'bg-gradient-to-br from-gray-500 to-gray-600'
            }`}>
              {userType === 'doctor' ? <Stethoscope className="w-6 h-6 text-white" /> : <Users className="w-6 h-6 text-white" />}
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                {userType === 'doctor' ? 'Gestion des médecins' : 
                 userType === 'patient' ? 'Gestion des patients' : 
                 'Gestion des utilisateurs'}
              </h2>
              <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  userType === 'doctor' ? 'bg-blue-500' : userType === 'patient' ? 'bg-green-500' : 'bg-purple-500'
                }`}></span>
                {filteredUsers.length} {userType === 'doctor' ? 'médecin' : userType === 'patient' ? 'patient' : 'utilisateur'}
                {filteredUsers.length > 1 ? 's' : ''} trouvé{filteredUsers.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            {/* Barre de recherche - CORRIGÉE */}
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={`Rechercher ${userType === 'doctor' ? 'un médecin' : userType === 'patient' ? 'un patient' : '...'}`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm bg-white text-gray-900"
              />
            </div>

            {/* Menu filtre */}
            <div className="relative">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="px-4 py-2.5 bg-gradient-to-r from-gray-100 to-gray-50 border border-gray-300 rounded-lg hover:from-gray-200 hover:to-gray-100 transition-all flex items-center gap-2 shadow-sm hover:shadow-md text-gray-900"
              >
                <Filter className="w-4 h-4 text-gray-600" />
                <span className="text-gray-700 font-medium">Filtres</span>
                <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform duration-300 ${showFilterMenu ? 'rotate-180' : ''}`} />
              </button>

              {showFilterMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 animate-slide-down">
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setFilterStatus('all');
                        setShowFilterMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition flex items-center gap-2 ${
                        filterStatus === 'all' 
                          ? 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 border border-blue-200' 
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      Tous
                    </button>
                    <button
                      onClick={() => {
                        setFilterStatus('active');
                        setShowFilterMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition flex items-center gap-2 ${
                        filterStatus === 'active' 
                          ? 'bg-gradient-to-r from-green-100 to-green-50 text-green-700 border border-green-200' 
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      Actifs
                    </button>
                    <button
                      onClick={() => {
                        setFilterStatus('inactive');
                        setShowFilterMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition flex items-center gap-2 ${
                        filterStatus === 'inactive' 
                          ? 'bg-gradient-to-r from-red-100 to-red-50 text-red-700 border border-red-200' 
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <X className="w-4 h-4" />
                      Inactifs
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bouton création */}
            <button
              onClick={() => {
                resetForm();
                setIsCreating(true);
                setShowUserModal(true);
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all hover:shadow-lg hover:scale-105 flex items-center gap-2 shadow-md"
            >
              <UserPlus className="w-4 h-4" />
              <span className="font-medium">Nouveau</span>
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="text-center py-16">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 bg-white rounded-full"></div>
              </div>
            </div>
            <p className="text-gray-600 mt-4 font-medium">Chargement des données...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              {userType === 'doctor' ? (
                <Stethoscope className="w-12 h-12 text-gray-400" />
              ) : (
                <Users className="w-12 h-12 text-gray-400" />
              )}
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Aucun {userType === 'doctor' ? 'médecin' : userType === 'patient' ? 'patient' : 'utilisateur'} trouvé
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? 'Aucun résultat pour votre recherche' : 'Commencez par créer un nouvel utilisateur'}
            </p>
            <button
              onClick={() => {
                resetForm();
                setIsCreating(true);
                setShowUserModal(true);
              }}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all hover:shadow-lg inline-flex items-center gap-2 font-medium"
            >
              <UserPlus className="w-5 h-5" />
              Créer un {userType === 'doctor' ? 'médecin' : userType === 'patient' ? 'patient' : 'utilisateur'}
            </button>
          </div>
        ) : (
          /* Liste des utilisateurs - Format cartes */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="group bg-white border border-gray-200 rounded-xl p-5 hover:shadow-xl transition-all hover:-translate-y-1 hover:border-blue-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Avatar */}
                    <div className={`w-16 h-16 rounded-xl shadow-md flex items-center justify-center text-white font-bold text-xl ${
                      user.role === 'doctor' 
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                        : user.role === 'patient'
                        ? 'bg-gradient-to-br from-green-500 to-teal-600'
                        : 'bg-gradient-to-br from-gray-500 to-gray-600'
                    }`}>
                      {getInitials(user.firstName, user.lastName)}
                    </div>

                    {/* Informations */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-bold text-gray-900 text-lg">
                          {user.firstName} {user.lastName}
                        </h3>
                        {getRoleBadge(user.role)}
                      </div>

                      {user.role === 'doctor' && user.specialty && (
                        <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                          <Award className="w-4 h-4 text-blue-500" />
                          <span className="font-medium">{user.specialty}</span>
                        </p>
                      )}

                      <div className="space-y-1.5 mb-3">
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="truncate">{user.email}</span>
                        </p>
                        {user.phoneNumber && (
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            {user.phoneNumber}
                          </p>
                        )}
                      </div>

                      {user.role === 'doctor' && user.consultationPrice && (
                        <p className="text-sm font-semibold text-green-600 flex items-center gap-1 bg-green-50 inline-flex px-3 py-1 rounded-full border border-green-200">
                          <DollarSign className="w-3 h-3" />
                          {user.consultationPrice} € / consultation
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 ml-2">
                    <button
                      onClick={() => handleViewUser(user)}
                      className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all hover:scale-110 border border-blue-200 shadow-sm"
                      title="Voir détails"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setFormData({
                          firstName: user.firstName || '',
                          lastName: user.lastName || '',
                          email: user.email || '',
                          password: '',
                          role: user.role,
                          phoneNumber: user.phoneNumber || '',
                          specialty: user.specialty || '',
                          isActive: user.isActive,
                          dateOfBirth: user.dateOfBirth || '',
                          gender: user.gender || '',
                          address: user.address || '',
                          bloodType: user.bloodType || '',
                          licenseNumber: user.licenseNumber || '',
                          biography: user.biography || '',
                          languages: user.languages || [],
                          consultationPrice: user.consultationPrice || 50
                        });
                        setIsEditing(true);
                        setShowUserModal(true);
                      }}
                      className="p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200 transition-all hover:scale-110 border border-yellow-200 shadow-sm"
                      title="Modifier"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(user.id)}
                      className={`p-2 rounded-lg transition-all hover:scale-110 border shadow-sm ${
                        user.isActive 
                          ? 'bg-orange-100 text-orange-600 hover:bg-orange-200 border-orange-200' 
                          : 'bg-green-100 text-green-600 hover:bg-green-200 border-green-200'
                      }`}
                      title={user.isActive ? 'Désactiver' : 'Activer'}
                    >
                      {user.isActive ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all hover:scale-110 border border-red-200 shadow-sm"
                      title="Supprimer"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Pied de carte */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                  {getStatusBadge(user.isActive)}
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Calendar className="w-3 h-3" />
                    Inscrit le {formatDate(user.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal création/édition - INPUTS CORRIGÉS */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-t-xl flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                {isCreating ? (
                  <><UserPlus className="w-5 h-5" /> Créer un {formData.role === 'doctor' ? 'médecin' : 'patient'}</>
                ) : isEditing ? (
                  <><Edit className="w-5 h-5" /> Modifier {formData.role === 'doctor' ? 'le médecin' : 'le patient'}</>
                ) : (
                  <><Eye className="w-5 h-5" /> Détails {formData.role === 'doctor' ? 'du médecin' : 'du patient'}</>
                )}
              </h2>
              <button
                onClick={() => {
                  setShowUserModal(false);
                  setIsEditing(false);
                  setIsCreating(false);
                }}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Informations personnelles */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  Informations personnelles
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      disabled={!isEditing && !isCreating}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-600 bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      disabled={!isEditing && !isCreating}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-600 bg-white text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  Contact
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!isEditing && !isCreating}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-600 bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      disabled={!isEditing && !isCreating}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-600 bg-white text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Mot de passe */}
              {(isCreating || isEditing) && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600" />
                    Sécurité
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {isCreating ? 'Mot de passe *' : 'Nouveau mot de passe (laisser vide pour ne pas changer)'}
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    />
                  </div>
                </div>
              )}

              {/* Informations complémentaires */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  Informations complémentaires
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      disabled={!isEditing && !isCreating}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-600 bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sexe</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      disabled={!isEditing && !isCreating}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-600 bg-white text-gray-900"
                    >
                      <option value="">Non spécifié</option>
                      <option value="M">Masculin</option>
                      <option value="F">Féminin</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Champs spécifiques médecins */}
              {formData.role === 'doctor' && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-blue-600" />
                    Informations professionnelles
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Spécialité</label>
                        <input
                          type="text"
                          value={formData.specialty}
                          onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                          disabled={!isEditing && !isCreating}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-600 bg-white text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">N° Licence</label>
                        <input
                          type="text"
                          value={formData.licenseNumber}
                          onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                          disabled={!isEditing && !isCreating}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-600 bg-white text-gray-900"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Biographie</label>
                      <textarea
                        value={formData.biography}
                        onChange={(e) => setFormData({ ...formData, biography: e.target.value })}
                        disabled={!isEditing && !isCreating}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-600 bg-white text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Prix consultation (€)</label>
                      <input
                        type="number"
                        value={formData.consultationPrice}
                        onChange={(e) => setFormData({ ...formData, consultationPrice: parseInt(e.target.value) })}
                        disabled={!isEditing && !isCreating}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-600 bg-white text-gray-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Statut */}
              {(isEditing || !isCreating) && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-600" />
                    Statut du compte
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">État du compte :</span>
                    {getStatusBadge(formData.isActive)}
                    {isEditing && (
                      <button
                        onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          formData.isActive 
                            ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-200' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
                        }`}
                      >
                        {formData.isActive ? 'Désactiver' : 'Activer'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Actions du formulaire */}
              {(isEditing || isCreating) && (
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={isCreating ? handleCreateUser : handleUpdateUser}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all hover:shadow-lg hover:scale-105 font-medium"
                  >
                    {isCreating ? 'Créer' : 'Mettre à jour'}
                  </button>
                  <button
                    onClick={() => {
                      setShowUserModal(false);
                      setIsEditing(false);
                      setIsCreating(false);
                    }}
                    className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                  >
                    Annuler
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Styles pour l'animation */}
      <style>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default UserManagement;
