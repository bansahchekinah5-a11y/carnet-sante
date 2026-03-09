import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { appointmentService } from '../../services/appointmentService';
import { medicalFileService } from '../../services/medicalFileService';
import {
  Calendar, Users, Clock, X, Check, Bell, ChevronRight,
  LogOut, Plus, Video, FileText, Pill, Search, Send,
  Stethoscope, AlertCircle, CheckCircle2
} from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  type: 'in_person' | 'teleconsultation' | 'home_visit';
  reason: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
  };
}

interface StatCard {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface DoctorUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  specialty?: string;
}

interface PrescriptionLine {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

const FREQUENCIES = ['1 fois/jour', '2 fois/jour', '3 fois/jour', 'Matin et soir', 'Au besoin', 'Avant les repas', 'Après les repas'];
const DURATIONS   = ['3 jours', '5 jours', '7 jours', '10 jours', '14 jours', '1 mois', '3 mois', 'Continu'];

const DoctorDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { showNotification } = useNotification();
  const doctorUser = user as DoctorUser;

  const [appointments, setAppointments]               = useState<Appointment[]>([]);
  const [loading, setLoading]                         = useState(true);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [error, setError]                             = useState<string | null>(null);
  const [filter, setFilter]                           = useState<'today' | 'pending' | 'upcoming'>('pending');
  const [stats, setStats]                             = useState({ totalAppointments: 0, todayAppointments: 0, totalPatients: 0 });

  // ── 🔔 Notification dropdown ────────────────────────────────────────────────
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef    = useRef<HTMLDivElement>(null);
  const notifBtnRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });

  // Calcule la position du dropdown en fixed par rapport au bouton
  const handleToggleDropdown = () => {
    if (!showNotifDropdown && notifBtnRef.current) {
      const rect = notifBtnRef.current.getBoundingClientRect();
      setDropdownPos({
        top:   rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
    setShowNotifDropdown(prev => !prev);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        notifRef.current && !notifRef.current.contains(e.target as Node) &&
        notifBtnRef.current && !notifBtnRef.current.contains(e.target as Node)
      ) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Prescription state ──────────────────────────────────────────────────────
  const [showPrescription, setShowPrescription]           = useState(false);
  const [prescriptionPatient, setPrescriptionPatient]     = useState<Appointment['patient'] | null>(null);
  const [prescriptionAppointmentId, setPrescriptionAppointmentId] = useState<string | null>(null);
  const [prescriptionLines, setPrescriptionLines]         = useState<PrescriptionLine[]>([
    { id: '1', medication: '', dosage: '', frequency: '1 fois/jour', duration: '7 jours', instructions: '' }
  ]);
  const [prescriptionNote, setPrescriptionNote]           = useState('');
  const [prescriptionSent, setPrescriptionSent]           = useState(false);
  const [prescriptionLoading, setPrescriptionLoading]     = useState(false);
  const [searchPatient, setSearchPatient]                 = useState('');

  // ── Video call state ────────────────────────────────────────────────────────
  const [showVideoModal, setShowVideoModal]             = useState(false);
  const [videoPatient, setVideoPatient]                 = useState<Appointment['patient'] | null>(null);
  const [videoAppointmentId, setVideoAppointmentId]     = useState<string | null>(null);
  const [videoLink, setVideoLink]                       = useState('');
  const [videoLoading, setVideoLoading]                 = useState(false);
  const [videoSearchPatient, setVideoSearchPatient]     = useState('');

  // ─────────────────────────────────────────────────────────────────────────────
  // DATA FETCHING
  // ─────────────────────────────────────────────────────────────────────────────

  const handleLogout = () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      try { logout(); } catch { showNotification('❌ Erreur lors de la déconnexion', 'error'); }
    }
  };

  const fetchAppointments = async () => {
    if (!user?.id) return;
    try {
      setAppointmentsLoading(true);
      const data = await appointmentService.getAppointments();
      if (!data || !Array.isArray(data)) { setAppointments([]); return; }
      const doctorAppointments = data.filter(apt =>
        apt.doctorId === user?.id && apt.status !== 'completed' && apt.status !== 'cancelled'
      );
      setAppointments(doctorAppointments);
    } catch { showNotification('Erreur lors du chargement des rendez-vous', 'error'); }
    finally { setAppointmentsLoading(false); }
  };

  const fetchStats = async () => {
    try {
      const statsResponse = await userService.getDashboardStats();
      setStats(statsResponse.data.stats);
    } catch { /* silencieux */ }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true); setError(null);
        await fetchStats(); await fetchAppointments();
      } catch (error: any) {
        setError(error.message || 'Impossible de charger les données.');
        setStats({ totalAppointments: 24, todayAppointments: 5, totalPatients: 12 });
      } finally { setLoading(false); }
    };
    fetchData();
    const interval = setInterval(fetchAppointments, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // ─────────────────────────────────────────────────────────────────────────────
  // APPOINTMENTS
  // ─────────────────────────────────────────────────────────────────────────────

  const handleConfirmAppointment = async (appointmentId: string) => {
    try {
      await appointmentService.confirmAppointment(appointmentId);
      showNotification('✅ Rendez-vous confirmé ! Le patient a été notifié.', 'success');
      await fetchAppointments(); await fetchStats();
    } catch { showNotification('❌ Erreur lors de la confirmation', 'error'); }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) return;
    try {
      await appointmentService.cancelAppointment(appointmentId, 'Annulé par le médecin');
      showNotification('✅ Rendez-vous annulé', 'success');
      await fetchAppointments(); await fetchStats();
    } catch { showNotification('❌ Erreur lors de l\'annulation', 'error'); }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // ✅ PRESCRIPTION — APPEL API RÉEL
  // ─────────────────────────────────────────────────────────────────────────────

  const openPrescription = (patient: Appointment['patient'], appointmentId?: string) => {
    setPrescriptionPatient(patient);
    setPrescriptionAppointmentId(appointmentId || null);
    setPrescriptionLines([{ id: '1', medication: '', dosage: '', frequency: '1 fois/jour', duration: '7 jours', instructions: '' }]);
    setPrescriptionNote('');
    setPrescriptionSent(false);
    setShowPrescription(true);
  };

  const addPrescriptionLine = () => {
    setPrescriptionLines(prev => [...prev, {
      id: Date.now().toString(), medication: '', dosage: '',
      frequency: '1 fois/jour', duration: '7 jours', instructions: ''
    }]);
  };

  const removePrescriptionLine = (id: string) => {
    if (prescriptionLines.length === 1) return;
    setPrescriptionLines(prev => prev.filter(l => l.id !== id));
  };

  const updateLine = (id: string, field: keyof PrescriptionLine, value: string) => {
    setPrescriptionLines(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const sendPrescription = async () => {
    const valid = prescriptionLines.every(l => l.medication.trim() && l.dosage.trim());
    if (!valid) {
      showNotification('⚠️ Remplissez le médicament et la posologie pour chaque ligne', 'warning');
      return;
    }
    if (!prescriptionPatient) return;

    try {
      setPrescriptionLoading(true);

      const medications = prescriptionLines.map(l => ({
        medication:   l.medication.trim(),
        dosage:       l.dosage.trim(),
        frequency:    l.frequency,
        duration:     l.duration,
        instructions: l.instructions.trim() || undefined
      }));

      await medicalFileService.createPrescription({
        patientId:     prescriptionPatient.id,
        appointmentId: prescriptionAppointmentId || undefined,
        medications,
        notes:         prescriptionNote.trim() || undefined,
      });

      setPrescriptionSent(true);
      showNotification(
        `✅ Ordonnance envoyée à ${prescriptionPatient.firstName} ${prescriptionPatient.lastName}`,
        'success'
      );
    } catch (error: any) {
      console.error('❌ Erreur envoi prescription:', error);
      showNotification(
        error?.response?.data?.message || '❌ Erreur lors de l\'envoi de l\'ordonnance',
        'error'
      );
    } finally {
      setPrescriptionLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // ✅ APPEL VIDÉO — APPEL API RÉEL
  // ─────────────────────────────────────────────────────────────────────────────

  const openVideoModal = (patient: Appointment['patient'], appointmentId?: string) => {
    setVideoPatient(patient);
    setVideoAppointmentId(appointmentId || null);
    const roomName = `CarnetSante-${doctorUser?.lastName}-${patient.lastName}-${Date.now()}`.replace(/\s+/g, '');
    setVideoLink(`https://meet.jit.si/${roomName}`);
    setShowVideoModal(true);
  };

  const startVideoCall = async () => {
    if (!videoPatient || !videoLink) return;

    try {
      setVideoLoading(true);

      await medicalFileService.createVideoCall({
        patientId:     videoPatient.id,
        appointmentId: videoAppointmentId || undefined,
        roomLink:      videoLink,
        notes:         `Téléconsultation avec Dr. ${doctorUser?.lastName}`,
      });

      window.open(videoLink, '_blank');

      showNotification(
        `📹 Appel vidéo lancé avec ${videoPatient.firstName} ${videoPatient.lastName}. Le patient peut consulter le lien dans son dossier.`,
        'success'
      );

      setShowVideoModal(false);
    } catch (error: any) {
      console.error('❌ Erreur création appel vidéo:', error);
      showNotification(
        error?.response?.data?.message || '❌ Erreur lors de la création de l\'appel vidéo',
        'error'
      );
    } finally {
      setVideoLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  const filteredAppointments = appointments.filter(apt => {
    const now = new Date();
    const aptDate = new Date(apt.appointmentDate);
    switch(filter) {
      case 'today':    return aptDate.toDateString() === now.toDateString();
      case 'pending':  return apt.status === 'pending';
      case 'upcoming': return aptDate > now && apt.status === 'confirmed';
      default:         return true;
    }
  });

  const confirmedPatients = Array.from(
    new Map(
      appointments
        .filter(a => a.status === 'confirmed' && a.patient)
        .map(a => [a.patient.id, a.patient])
    ).values()
  );

  const filteredPrescriptionPatients = confirmedPatients.filter(p =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchPatient.toLowerCase())
  );

  const filteredVideoPatients = confirmedPatients.filter(p =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(videoSearchPatient.toLowerCase())
  );

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      day:  date.toLocaleDateString('fr-FR', { weekday: 'long' })
    };
  };

  const pendingAppointments = appointments.filter(a => a.status === 'pending');

  const statCards: StatCard[] = [
    { title: "Rendez-vous aujourd'hui", value: stats.todayAppointments, icon: Calendar, color: 'from-blue-500 to-blue-600' },
    { title: 'Total rendez-vous',       value: stats.totalAppointments,  icon: Calendar, color: 'from-green-500 to-green-600' },
    { title: 'Patients totaux',          value: stats.totalPatients,      icon: Users,    color: 'from-purple-500 to-purple-600' },
    { title: 'En attente',               value: pendingAppointments.length, icon: Clock, color: 'from-yellow-500 to-yellow-600' },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen p-6 space-y-6">

      {/* HEADER */}
      <div className="futuristic-card p-6 animate-slide-in">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
              <span className="text-2xl font-bold text-white">
                {doctorUser?.firstName?.[0]}{doctorUser?.lastName?.[0]}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text">
                Dr. {doctorUser?.firstName} {doctorUser?.lastName}
              </h1>
              <p className="text-gray-300 mt-1">
                {doctorUser?.specialty || 'Médecin'} • Tableau de bord médical
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">

            {/* ══ 🔔 CLOCHE CLIQUABLE ══ */}
            <div className="relative">
              <button
                ref={notifBtnRef}
                onClick={handleToggleDropdown}
                className="relative p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300"
                title={pendingAppointments.length > 0 ? `${pendingAppointments.length} rendez-vous en attente` : 'Aucune notification'}
              >
                <Bell className={`w-5 h-5 text-white ${pendingAppointments.length > 0 ? 'animate-bounce' : ''}`} />
                {pendingAppointments.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg pulse-glow">
                    {pendingAppointments.length}
                  </span>
                )}
              </button>

              {/* Portail — rendu directement dans document.body, hors de tout stacking context */}
              {showNotifDropdown && createPortal(
                <>
                  {/* Overlay invisible pour détecter le clic extérieur */}
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 99998 }}
                    onClick={() => setShowNotifDropdown(false)}
                  />

                  {/* Dropdown */}
                  <div
                    ref={notifRef}
                    className="w-80 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                    style={{
                      position:  'fixed',
                      top:       dropdownPos.top,
                      right:     dropdownPos.right,
                      zIndex:    99999,
                      animation: 'notifDropIn 0.22s cubic-bezier(0.34,1.56,0.64,1) forwards',
                    }}
                  >
                    <style>{`
                      @keyframes notifDropIn {
                        from { opacity: 0; transform: translateY(-10px) scale(0.97); }
                        to   { opacity: 1; transform: translateY(0) scale(1); }
                      }
                    `}</style>

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-yellow-400" />
                        <span className="text-white font-bold text-sm">Notifications</span>
                        {pendingAppointments.length > 0 && (
                          <span className="bg-yellow-500 text-black text-xs font-black px-2 py-0.5 rounded-full">
                            {pendingAppointments.length}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setShowNotifDropdown(false)}
                        className="text-gray-500 hover:text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Liste */}
                    <div className="max-h-72 overflow-y-auto">
                      {pendingAppointments.length === 0 ? (
                        <div className="py-10 text-center">
                          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-60" />
                          <p className="text-gray-400 text-sm font-medium">Tout est à jour !</p>
                          <p className="text-gray-600 text-xs mt-1">Aucun rendez-vous en attente</p>
                        </div>
                      ) : (
                        pendingAppointments.map(apt => {
                          const { date, time } = formatDateTime(apt.appointmentDate);
                          return (
                            <div key={apt.id} className="px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors">
                              <div className="flex items-start gap-3">
                                <div className="w-9 h-9 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                                  <span className="text-white text-xs font-bold">
                                    {apt.patient?.firstName?.[0]}{apt.patient?.lastName?.[0]}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-sm font-semibold truncate">
                                    {apt.patient?.firstName} {apt.patient?.lastName}
                                  </p>
                                  <p className="text-gray-400 text-xs truncate">{apt.reason}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-yellow-400 text-xs font-medium">{date}</span>
                                    <span className="text-gray-600 text-xs">•</span>
                                    <span className="text-gray-300 text-xs">{time}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2 mt-2.5 ml-12">
                                <button
                                  onClick={() => { handleConfirmAppointment(apt.id); setShowNotifDropdown(false); }}
                                  className="flex-1 py-1.5 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg text-xs font-semibold hover:bg-green-500/30 transition-all flex items-center justify-center gap-1"
                                >
                                  <Check className="w-3 h-3" /> Confirmer
                                </button>
                                <button
                                  onClick={() => { handleCancelAppointment(apt.id); setShowNotifDropdown(false); }}
                                  className="flex-1 py-1.5 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-xs font-semibold hover:bg-red-500/30 transition-all flex items-center justify-center gap-1"
                                >
                                  <X className="w-3 h-3" /> Refuser
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Footer */}
                    {pendingAppointments.length > 0 && (
                      <div className="px-4 py-3 border-t border-white/10 bg-white/5">
                        <button
                          onClick={() => { setFilter('pending'); setShowNotifDropdown(false); }}
                          className="w-full text-center text-blue-400 hover:text-blue-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                        >
                          Voir tous les rendez-vous en attente
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </>,
                document.body
              )}
            </div>
            {/* ══ FIN CLOCHE ══ */}

            <button onClick={handleLogout} className="futuristic-btn-secondary flex items-center gap-2 hover:scale-105">
              <LogOut className="w-5 h-5" />
              <span className="font-semibold">Déconnexion</span>
            </button>
          </div>
        </div>
      </div>

      {/* ERREUR */}
      {error && (
        <div className="futuristic-card p-4 border-red-500/50 bg-red-500/10 animate-slide-in">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <strong className="text-red-400">Erreur: </strong>
            <span className="text-red-300">{error}</span>
          </div>
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="futuristic-card p-6 hover:scale-105 transition-transform duration-300 animate-slide-in cursor-pointer" style={{ animationDelay: `${index * 100}ms` }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-2">{stat.title}</p>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                </div>
                <div className={`p-4 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* OUTILS MÉDICAUX */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* PRESCRIPTION */}
        <div className="futuristic-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-emerald-500/20 rounded-xl">
              <FileText className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Rédiger une ordonnance</h3>
              <p className="text-gray-400 text-sm">Patients avec RDV confirmé</p>
            </div>
          </div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un patient..."
              value={searchPatient}
              onChange={e => setSearchPatient(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 text-sm"
            />
          </div>
          {confirmedPatients.length === 0 ? (
            <div className="text-center py-8">
              <Stethoscope className="w-10 h-10 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Aucun patient avec RDV confirmé</p>
            </div>
          ) : filteredPrescriptionPatients.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">Aucun résultat</p>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {filteredPrescriptionPatients.map(patient => (
                <div key={patient.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{patient.firstName[0]}{patient.lastName[0]}</span>
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{patient.firstName} {patient.lastName}</p>
                      <p className="text-gray-500 text-xs">{patient.phoneNumber || 'Tél. non renseigné'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => openPrescription(patient)}
                    className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-semibold hover:bg-emerald-500/30 transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Prescrire
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* APPEL VIDÉO */}
        <div className="futuristic-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-blue-500/20 rounded-xl">
              <Video className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Lancer un appel vidéo</h3>
              <p className="text-gray-400 text-sm">Téléconsultation avec un patient</p>
            </div>
          </div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un patient..."
              value={videoSearchPatient}
              onChange={e => setVideoSearchPatient(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 text-sm"
            />
          </div>
          {confirmedPatients.length === 0 ? (
            <div className="text-center py-8">
              <Video className="w-10 h-10 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Aucun patient avec RDV confirmé</p>
            </div>
          ) : filteredVideoPatients.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">Aucun résultat</p>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {filteredVideoPatients.map(patient => (
                <div key={patient.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{patient.firstName[0]}{patient.lastName[0]}</span>
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{patient.firstName} {patient.lastName}</p>
                      <p className="text-gray-500 text-xs">{patient.phoneNumber || 'Tél. non renseigné'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => openVideoModal(patient)}
                    className="px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg text-xs font-semibold hover:bg-blue-500/30 transition-all flex items-center gap-1"
                  >
                    <Video className="w-3 h-3" /> Appeler
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RENDEZ-VOUS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 futuristic-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-blue-500/20 rounded-xl">
              <Calendar className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Demandes de rendez-vous</h3>
              <p className="text-gray-400 text-sm">Gérez les demandes en attente, aujourd'hui et à venir</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="flex gap-1 p-1 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
              {(['pending', 'today', 'upcoming'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                    filter === f
                      ? f === 'pending'  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                      : f === 'today'    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                                         : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {f === 'pending'  ? `En attente (${pendingAppointments.length})`
                   : f === 'today'  ? "Aujourd'hui"
                   : 'À venir'}
                </button>
              ))}
            </div>

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un patient..."
                value={searchPatient}
                onChange={e => setSearchPatient(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 text-sm"
              />
            </div>
          </div>

          {appointmentsLoading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-400 mt-4">Chargement...</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="w-10 h-10 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">Aucune demande de rendez-vous</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredAppointments
                .filter(apt =>
                  !searchPatient ||
                  `${apt.patient?.firstName} ${apt.patient?.lastName}`.toLowerCase().includes(searchPatient.toLowerCase())
                )
                .map(apt => {
                  const { date, time, day } = formatDateTime(apt.appointmentDate);
                  return (
                    <div key={apt.id} className={`p-4 bg-white/5 border rounded-xl hover:bg-white/10 transition-all ${
                      apt.status === 'pending'
                        ? 'border-yellow-500/30 hover:border-yellow-500/50'
                        : apt.status === 'confirmed'
                        ? 'border-green-500/30 hover:border-green-500/50'
                        : 'border-white/10 hover:border-white/30'
                    }`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shrink-0">
                              <span className="text-white text-xs font-bold">
                                {apt.patient?.firstName?.[0]}{apt.patient?.lastName?.[0]}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-white font-medium text-sm truncate">
                                {apt.patient?.firstName} {apt.patient?.lastName}
                              </p>
                              <p className="text-gray-500 text-xs truncate">
                                {apt.patient?.phoneNumber || 'Tél. non renseigné'}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <div className="bg-white/5 rounded-lg p-2">
                              <p className="text-xs text-gray-400 mb-1">Date</p>
                              <p className="text-white text-sm font-semibold capitalize truncate">{day}</p>
                              <p className="text-gray-300 text-xs">{date}</p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-2">
                              <p className="text-xs text-gray-400 mb-1">Heure</p>
                              <p className="text-white text-sm font-semibold">{time}</p>
                              <p className="text-gray-300 text-xs">{apt.duration} min</p>
                            </div>
                          </div>
                          <div className="bg-white/5 rounded-lg p-2 mb-2">
                            <p className="text-xs text-gray-400 mb-1">Motif</p>
                            <p className="text-white text-sm truncate">{apt.reason}</p>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            apt.status === 'pending'
                              ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                              : apt.status === 'confirmed'
                              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}>
                            {apt.status === 'pending' ? '⏳ En attente' :
                             apt.status === 'confirmed' ? '✅ Confirmé' :
                             apt.status}
                          </span>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          {apt.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleConfirmAppointment(apt.id)}
                                className="px-3 py-1.5 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg text-xs font-semibold hover:bg-green-500/30 transition-all flex items-center gap-1.5 whitespace-nowrap"
                              >
                                <Check className="w-3 h-3" /> Confirmer
                              </button>
                              <button
                                onClick={() => handleCancelAppointment(apt.id)}
                                className="px-3 py-1.5 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-xs font-semibold hover:bg-red-500/30 transition-all flex items-center gap-1.5 whitespace-nowrap"
                              >
                                <X className="w-3 h-3" /> Refuser
                              </button>
                            </>
                          )}
                          {apt.status === 'confirmed' && (
                            <>
                              <button
                                onClick={() => openPrescription(apt.patient, apt.id)}
                                className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-semibold hover:bg-emerald-500/30 transition-all flex items-center gap-1.5 whitespace-nowrap"
                              >
                                <FileText className="w-3 h-3" /> Ordonnance
                              </button>
                              <button
                                onClick={() => openVideoModal(apt.patient, apt.id)}
                                className="px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg text-xs font-semibold hover:bg-blue-500/30 transition-all flex items-center gap-1.5 whitespace-nowrap"
                              >
                                <Video className="w-3 h-3" /> Appel vidéo
                              </button>
                              <Link
                                to={`/appointments/${apt.id}`}
                                className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg text-xs font-semibold hover:from-blue-600 hover:to-cyan-700 transition-all flex items-center gap-1.5 shadow-lg whitespace-nowrap"
                              >
                                Détails <ChevronRight className="w-3 h-3" />
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* ACTIONS RAPIDES */}
        <div className="futuristic-card p-6">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            Actions rapides
          </h3>
          <div className="space-y-3">
            <Link to="/doctor/calendar" className="w-full text-left p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all group flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-blue-500/20 rounded-lg mr-3 group-hover:bg-blue-500/30 transition-colors">
                  <Calendar className="h-5 w-5 text-blue-400" />
                </div>
                <span className="text-white font-medium">Gérer mes disponibilités</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
            </Link>
            <Link to="/doctor/patients" className="w-full text-left p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all group flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-purple-500/20 rounded-lg mr-3 group-hover:bg-purple-500/30 transition-colors">
                  <Users className="h-5 w-5 text-purple-400" />
                </div>
                <span className="text-white font-medium">Voir mes patients</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
            </Link>
            <Link to="/doctor/appointments" className="w-full text-left p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all group flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-green-500/20 rounded-lg mr-3 group-hover:bg-green-500/30 transition-colors">
                  <Calendar className="h-5 w-5 text-green-400" />
                </div>
                <span className="text-white font-medium">Tous les rendez-vous</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            <h4 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Statistiques du jour
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-gray-300 text-sm">En attente</span>
                <span className="font-bold text-yellow-400 text-lg">{pendingAppointments.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-gray-300 text-sm">Confirmés aujourd'hui</span>
                <span className="font-bold text-green-400 text-lg">
                  {appointments.filter(a => a.status === 'confirmed' &&
                    new Date(a.appointmentDate).toDateString() === new Date().toDateString()).length}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-gray-300 text-sm">Taux de confirmation</span>
                <span className="font-bold text-blue-400 text-lg">
                  {appointments.length > 0 ?
                    Math.round((appointments.filter(a => a.status === 'confirmed').length / appointments.length) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GESTION CALENDRIER */}
      <div className="futuristic-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Gestion des disponibilités</h3>
            <p className="text-gray-400 text-sm">Créez et gérez vos calendriers de disponibilités</p>
          </div>
          <Link to="/doctor/calendar" className="futuristic-btn flex items-center gap-2">
            <Plus className="w-5 h-5" /> Créer un nouveau calendrier
          </Link>
        </div>
      </div>

      {/* ══════════════════ MODAL ORDONNANCE ══════════════════ */}
      {showPrescription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) setShowPrescription(false); }}>
          <div className="w-full max-w-2xl bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">

            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-xl"><FileText className="w-5 h-5 text-emerald-400" /></div>
                <div>
                  <h2 className="text-xl font-bold text-white">Nouvelle ordonnance</h2>
                  {prescriptionPatient && (
                    <p className="text-emerald-400 text-sm">Pour {prescriptionPatient.firstName} {prescriptionPatient.lastName}</p>
                  )}
                </div>
              </div>
              <button onClick={() => setShowPrescription(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {prescriptionSent ? (
              <div className="p-12 text-center space-y-4">
                <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
                <h3 className="text-2xl font-bold text-white">Ordonnance envoyée !</h3>
                <p className="text-gray-400">
                  L'ordonnance est maintenant visible dans le dossier médical de{' '}
                  {prescriptionPatient?.firstName} {prescriptionPatient?.lastName}.
                </p>
                <button onClick={() => setShowPrescription(false)} className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-colors">
                  Fermer
                </button>
              </div>
            ) : (
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {prescriptionLines.map((line, idx) => (
                  <div key={line.id} className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Pill className="w-3.5 h-3.5" /> Médicament {idx + 1}
                      </span>
                      {prescriptionLines.length > 1 && (
                        <button onClick={() => removePrescriptionLine(line.id)} className="text-red-400 hover:text-red-300 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="Nom du médicament *" value={line.medication} onChange={e => updateLine(line.id, 'medication', e.target.value)}
                        className="col-span-2 px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 text-sm" />
                      <input type="text" placeholder="Posologie (ex: 1 comprimé) *" value={line.dosage} onChange={e => updateLine(line.id, 'dosage', e.target.value)}
                        className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 text-sm" />
                      <select value={line.frequency} onChange={e => updateLine(line.id, 'frequency', e.target.value)} className="px-3 py-2.5 bg-gray-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500/50 text-sm">
                        {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                      <select value={line.duration} onChange={e => updateLine(line.id, 'duration', e.target.value)} className="px-3 py-2.5 bg-gray-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500/50 text-sm">
                        {DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <input type="text" placeholder="Instructions particulières" value={line.instructions} onChange={e => updateLine(line.id, 'instructions', e.target.value)}
                        className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 text-sm" />
                    </div>
                  </div>
                ))}
                <button onClick={addPrescriptionLine} className="w-full py-2.5 border border-dashed border-emerald-500/30 text-emerald-400 rounded-xl text-sm font-medium hover:bg-emerald-500/5 transition-colors flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> Ajouter un médicament
                </button>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Note / Recommandations</label>
                  <textarea rows={3} placeholder="Conseils, recommandations, suivi..." value={prescriptionNote} onChange={e => setPrescriptionNote(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 text-sm resize-none" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowPrescription(false)} className="flex-1 py-3 bg-white/5 border border-white/10 text-gray-300 rounded-xl font-semibold hover:bg-white/10 transition-colors">
                    Annuler
                  </button>
                  <button onClick={sendPrescription} disabled={prescriptionLoading}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                    {prescriptionLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send className="w-4 h-4" /> Envoyer l'ordonnance</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════ MODAL APPEL VIDÉO ══════════════════ */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) setShowVideoModal(false); }}>
          <div className="w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-xl"><Video className="w-5 h-5 text-blue-400" /></div>
                <div>
                  <h2 className="text-xl font-bold text-white">Appel vidéo</h2>
                  {videoPatient && <p className="text-blue-400 text-sm">avec {videoPatient.firstName} {videoPatient.lastName}</p>}
                </div>
              </div>
              <button onClick={() => setShowVideoModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {videoPatient && (
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold">{videoPatient.firstName[0]}{videoPatient.lastName[0]}</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold">{videoPatient.firstName} {videoPatient.lastName}</p>
                    <p className="text-gray-400 text-sm">{videoPatient.phoneNumber || 'Tél. non renseigné'}</p>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Lien de la salle</label>
                <input type="text" value={videoLink} onChange={e => setVideoLink(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/50" />
                <p className="text-gray-500 text-xs mt-1.5">
                  Propulsé par <span className="text-blue-400">Jitsi Meet</span> — le lien sera enregistré dans le dossier du patient
                </p>
              </div>
              <div className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
                <p className="text-yellow-300 text-xs">
                  L'appel sera enregistré dans le dossier médical du patient avec le lien pour qu'il puisse rejoindre.
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowVideoModal(false)} className="flex-1 py-3 bg-white/5 border border-white/10 text-gray-300 rounded-xl font-semibold hover:bg-white/10 transition-colors">
                  Annuler
                </button>
                <button onClick={startVideoCall} disabled={videoLoading}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed">
                  {videoLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Video className="w-4 h-4" /> Lancer l'appel</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default DoctorDashboard;
