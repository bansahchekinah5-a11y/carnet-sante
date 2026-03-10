import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Users, Calendar, CreditCard, Activity, Trash, Eye,
  Search, BarChart3, Settings, LogOut, Bell, TrendingUp,
  UserCheck, Clock, CheckCircle, XCircle, DollarSign,
  FileText, Award, AlertCircle, Video, Pill, Banknote,
  Smartphone, Building2, Receipt, RefreshCw, X, Send,
  Loader2, WifiOff, ChevronDown, ChevronUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useNavigate, Link } from 'react-router-dom';
import { adminService, DashboardStats } from '../services/adminService';
import { calendarService } from '../services/calendarService';
import UserManagement from '../components/Admin/UserManagement';

interface CalendarItem {
  id: string; date: string; slots: string[]; confirmed: boolean;
  doctor?: { firstName: string; lastName: string; id: string };
}
interface AdminPrescription {
  id: string; createdAt: string; status: string; isRead: boolean;
  medications: { medication: string; dosage: string; frequency: string; duration: string; instructions?: string }[];
  notes?: string; validUntil?: string;
  doctor?:  { id: string; firstName: string; lastName: string; specialty?: string; email?: string };
  patient?: { id: string; firstName: string; lastName: string; email?: string; phoneNumber?: string };
}
interface AdminVideoCall {
  id: string; createdAt: string; status: string; roomLink?: string; meetingUrl?: string;
  durationMinutes?: number; duration?: number; notes?: string;
  doctor?:  { id: string; firstName: string; lastName: string; specialty?: string };
  patient?: { id: string; firstName: string; lastName: string; phoneNumber?: string };
}
interface AdminAppointment {
  id: string; appointmentDate: string; status: string; type: string;
  reason?: string; duration?: number; notes?: string;
  doctor?:  { id: string; firstName: string; lastName: string; specialty?: string };
  patient?: { id: string; firstName: string; lastName: string; email?: string; phoneNumber?: string };
}
interface DoctorEarning {
  doctor: { id: string; firstName: string; lastName: string; email: string; specialty: string; phoneNumber?: string; consultationPrice?: number };
  stats:  { completedConsultations: number; paidConsultations: number; unpaidConsultations: number; totalEarned: number; doctorShare: number; totalPaid: number; amountDue: number };
  paymentHistory: any[];
}
interface DoctorPaymentRecord {
  id: string; amount: number; currency: string; paymentMethod: string;
  paymentDetails: any; period?: string; consultationsCount: number;
  status: string; notes?: string; processedAt?: string; createdAt: string;
  doctor?:   { id: string; firstName: string; lastName: string; specialty?: string };
  processor?: { id: string; firstName: string; lastName: string };
}

type Tab = 'dashboard' | 'doctors' | 'patients' | 'appointments'
         | 'prescriptions' | 'videocalls' | 'payments' | 'financial' | 'calendars';

const MOBILE_OPERATORS = [
  { id: 'tmoney',   label: 'T-Money',         country: 'Togo',       color: 'bg-red-500',     text: 'text-white',       border: 'border-red-500',    ring: 'ring-red-400',    emoji: '🔴' },
  { id: 'flooz',    label: 'Flooz (Moov)',     country: 'Togo',       color: 'bg-blue-600',    text: 'text-white',       border: 'border-blue-600',   ring: 'ring-blue-400',   emoji: '🔵' },
  { id: 'mtn',      label: 'MTN MoMo',         country: 'Multi',      color: 'bg-yellow-400',  text: 'text-black',       border: 'border-yellow-400', ring: 'ring-yellow-300', emoji: '🟡' },
  { id: 'orange',   label: 'Orange Money',     country: 'Multi',      color: 'bg-orange-500',  text: 'text-white',       border: 'border-orange-500', ring: 'ring-orange-400', emoji: '🟠' },
  { id: 'wave',     label: 'Wave',             country: 'Multi',      color: 'bg-cyan-500',    text: 'text-white',       border: 'border-cyan-500',   ring: 'ring-cyan-400',   emoji: '🌊' },
  { id: 'moov',     label: 'Moov Money',       country: 'Multi',      color: 'bg-blue-500',    text: 'text-white',       border: 'border-blue-500',   ring: 'ring-blue-400',   emoji: '💙' },
  { id: 'free',     label: 'Free Money',       country: 'Sénégal',    color: 'bg-red-600',     text: 'text-white',       border: 'border-red-600',    ring: 'ring-red-400',    emoji: '❤️' },
  { id: 'airtel',   label: 'Airtel Money',     country: 'Multi',      color: 'bg-red-700',     text: 'text-white',       border: 'border-red-700',    ring: 'ring-red-500',    emoji: '📡' },
];

const PAYMENT_METHODS = [
  { value: 'mobile_money',  label: 'Mobile Money',      icon: Smartphone, color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200'  },
  { value: 'bank_transfer', label: 'Virement bancaire', icon: Building2,  color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200'   },
  { value: 'cash',          label: 'Espèces',           icon: Banknote,   color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  { value: 'check',         label: 'Chèque',            icon: Receipt,    color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
];

const fmtDate = (d?: string) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' }); }
  catch { return '—'; }
};
const fmtDT = (d?: string) => {
  if (!d) return { date:'—', time:'—' };
  try {
    const dt = new Date(d);
    return { date: dt.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric'}), time: dt.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}) };
  } catch { return { date:'—', time:'—' }; }
};

const STATUS_STYLE: Record<string,string> = {
  active:'bg-green-100 text-green-700 border-green-200', completed:'bg-blue-100 text-blue-700 border-blue-200',
  cancelled:'bg-red-100 text-red-700 border-red-200',   pending:'bg-yellow-100 text-yellow-700 border-yellow-200',
  scheduled:'bg-indigo-100 text-indigo-700 border-indigo-200', ongoing:'bg-cyan-100 text-cyan-700 border-cyan-200',
  missed:'bg-gray-100 text-gray-600 border-gray-200',   failed:'bg-red-100 text-red-700 border-red-200',
  processing:'bg-orange-100 text-orange-700 border-orange-200', filled:'bg-teal-100 text-teal-700 border-teal-200',
  expired:'bg-gray-100 text-gray-500 border-gray-200',
};
const STATUS_LABEL: Record<string,string> = {
  active:'Actif', completed:'Terminé', cancelled:'Annulé', pending:'En attente',
  scheduled:'Planifié', ongoing:'En cours', missed:'Manqué', failed:'Échoué',
  processing:'En traitement', filled:'Délivré', expired:'Expiré',
};

const apiCall = async (path: string, options: RequestInit = {}): Promise<any> => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const BASE = (import.meta as any).env?.VITE_API_URL || 'https://carnet-sante-backend.onrender.com/api';
  const url  = `${BASE}${path}`;
  const res  = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
};

const Badge = ({ status }: { status: string }) => (
  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_STYLE[status] || STATUS_STYLE.pending}`}>
    {STATUS_LABEL[status] || status}
  </span>
);

const Spinner = ({ label = 'Chargement…' }: { label?: string }) => (
  <div className="flex items-center justify-center py-20 gap-3">
    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    <span className="text-gray-500 font-medium">{label}</span>
  </div>
);

const EmptyState = ({ icon: Icon, label, sub }: { icon: any; label: string; sub?: string }) => (
  <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200">
    <Icon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
    <p className="text-gray-500 font-medium">{label}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

const ApiError = ({ error, retry }: { error: string; retry: () => void }) => (
  <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex flex-col items-center gap-3">
    <WifiOff className="w-10 h-10 text-red-400" />
    <p className="text-red-700 font-semibold text-center">Impossible de charger les données</p>
    <p className="text-red-500 text-sm text-center font-mono bg-red-100 px-3 py-1.5 rounded-lg max-w-md break-all">{error}</p>
    <button onClick={retry} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-medium flex items-center gap-2">
      <RefreshCw className="w-4 h-4" /> Réessayer
    </button>
  </div>
);

const AdminDashboard: React.FC = () => {
  const { user, logout }     = useAuth();
  const { showNotification } = useNotification();
  const navigate             = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const [stats, setStats] = useState<DashboardStats>({
    users: { total:0, doctors:0, patients:0, admins:0, active:0, inactive:0 },
    appointments: { total:0, pending:0, confirmed:0, completed:0, cancelled:0, today:0, thisWeek:0, thisMonth:0 },
    financial: { totalRevenue:0, totalCommission:0, pendingPayments:0, completedPayments:0 },
    recentActivities: []
  });
  const [calendars, setCalendars]         = useState<CalendarItem[]>([]);
  const [appointments, setAppointments]   = useState<AdminAppointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<AdminPrescription[]>([]);
  const [videoCalls, setVideoCalls]       = useState<AdminVideoCall[]>([]);
  const [earnings, setEarnings]           = useState<DoctorEarning[]>([]);
  const [payments, setPayments]           = useState<DoctorPaymentRecord[]>([]);

  const [dashLoading, setDashLoading]   = useState(true);
  const [tabLoading, setTabLoading]     = useState(false);
  const [tabError, setTabError]         = useState<string | null>(null);

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const getComputedStatus = (dbStatus: string, appointmentDate?: string, duration: number = 30): string => {
    if (['cancelled', 'no_show'].includes(dbStatus)) return dbStatus;
    if (!appointmentDate) return dbStatus;
    const start = new Date(appointmentDate).getTime();
    const end   = start + (duration || 30) * 60 * 1000;
    const t     = now.getTime();
    if (t >= end)   return 'completed';
    if (t >= start) return (dbStatus === 'confirmed' || dbStatus === 'ongoing') ? 'ongoing' : dbStatus;
    return dbStatus;
  };

  const COMPUTED_STATUS_LABEL: Record<string, string> = {
    pending:   'En attente',
    confirmed: 'Confirmé',
    ongoing:   '🔵 En cours',
    completed: 'Terminé',
    cancelled: 'Annulé',
    no_show:   'Absent',
    missed:    'Manqué',
  };
  const COMPUTED_STATUS_STYLE: Record<string, string> = {
    pending:   'bg-yellow-100 text-yellow-700 border-yellow-200',
    confirmed: 'bg-green-100  text-green-700  border-green-200',
    ongoing:   'bg-blue-100   text-blue-700   border-blue-200   animate-pulse',
    completed: 'bg-gray-100   text-gray-600   border-gray-200',
    cancelled: 'bg-red-100    text-red-700    border-red-200',
    no_show:   'bg-gray-100   text-gray-500   border-gray-200',
    missed:    'bg-orange-100 text-orange-700 border-orange-200',
  };

  const [apptFilter,  setApptFilter]  = useState('');
  const [apptStatus,  setApptStatus]  = useState('');
  const [prescFilter, setPrescFilter] = useState('');
  const [videoFilter, setVideoFilter] = useState('');
  const [payFilter, setPayFilter]     = useState('');

  const [showPayModal,     setShowPayModal]     = useState(false);
  const [payStep,          setPayStep]          = useState<1|2>(1);
  const [selectedEarning,  setSelectedEarning]  = useState<DoctorEarning | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<string>('');
  const [payLoading,       setPayLoading]       = useState(false);
  const [payForm, setPayForm] = useState({
    paymentMethod:'mobile_money', amount:'', currency:'XOF', period:'',
    consultationsCount:'', notes:'', bankName:'', accountNumber:'', iban:'',
    provider:'', phoneNumber:'', reference:''
  });

  const [selectedPresc, setSelectedPresc] = useState<AdminPrescription | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifBtnRef = useRef<HTMLButtonElement>(null);
  const notifRef    = useRef<HTMLDivElement>(null);
  const [notifPos,  setNotifPos]  = useState({ top: 0, right: 0 });

  const handleToggleNotif = () => {
    if (!showNotifDropdown && notifBtnRef.current) {
      const rect = notifBtnRef.current.getBoundingClientRect();
      setNotifPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
    setShowNotifDropdown(prev => !prev);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        notifRef.current && !notifRef.current.contains(e.target as Node) &&
        notifBtnRef.current && !notifBtnRef.current.contains(e.target as Node)
      ) setShowNotifDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchDashboard = useCallback(async () => {
    try {
      setDashLoading(true);
      const [sRes, cRes] = await Promise.allSettled([
        adminService.getDashboardStats(),
        calendarService.getAllCalendars()
      ]);
      if (sRes.status === 'fulfilled' && sRes.value.success) setStats(sRes.value.data);
      if (cRes.status === 'fulfilled') setCalendars(cRes.value.data || []);
    } catch (e) {
      console.error('fetchDashboard:', e);
    } finally {
      setDashLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  useEffect(() => {
    const loadAppts = async () => {
      try {
        const r = await apiCall('/admin/appointments?limit=500');
        const data = Array.isArray(r.data) ? r.data : (Array.isArray(r.appointments) ? r.appointments : []);
        setAppointments(data);
      } catch {
        try {
          const r = await apiCall('/appointments?limit=500');
          setAppointments(Array.isArray(r.data) ? r.data : []);
        } catch { /* silencieux */ }
      }
    };
    loadAppts();
  }, []);

  const fetchTab = useCallback(async (tab: Tab) => {
    setTabLoading(true);
    setTabError(null);
    try {
      if (tab === 'appointments') {
        try {
          const r = await apiCall('/admin/appointments?limit=500');
          setAppointments(Array.isArray(r.data) ? r.data : (Array.isArray(r.appointments) ? r.appointments : []));
        } catch {
          const r = await apiCall('/appointments?limit=500');
          setAppointments(Array.isArray(r.data) ? r.data : (Array.isArray(r.appointments) ? r.appointments : []));
        }
      }
      if (tab === 'prescriptions') {
        const r = await apiCall('/admin/prescriptions?limit=200');
        setPrescriptions(Array.isArray(r.data) ? r.data : []);
      }
      if (tab === 'videocalls') {
        const r = await apiCall('/admin/video-calls?limit=200');
        setVideoCalls(Array.isArray(r.data) ? r.data : []);
      }
      if (tab === 'payments') {
        const [eR, pR] = await Promise.all([
          apiCall('/admin/doctor-earnings'),
          apiCall('/admin/doctor-payments?limit=200')
        ]);
        setEarnings(Array.isArray(eR.data) ? eR.data : []);
        setPayments(Array.isArray(pR.data) ? pR.data : []);
      }
    } catch (e: any) {
      const msg = e?.message || 'Erreur inconnue';
      console.error(`fetchTab(${tab}):`, msg);
      setTabError(msg);
    } finally {
      setTabLoading(false);
    }
  }, []);

  useEffect(() => {
    if (['appointments','prescriptions','videocalls','payments'].includes(activeTab)) {
      fetchTab(activeTab);
    }
  }, [activeTab, fetchTab]);

  const handleDeleteCalendar = async (id: string) => {
    if (!window.confirm('Supprimer ce calendrier ?')) return;
    try {
      await calendarService.deleteCalendar(id);
      setCalendars(p => p.filter(c => c.id !== id));
      showNotification('✅ Calendrier supprimé','success');
    } catch { showNotification('Erreur suppression','error'); }
  };

  const openPayModal = (e: DoctorEarning) => {
    setSelectedEarning(e);
    setPayStep(1);
    setSelectedOperator('');
    setPayForm(f => ({
      ...f,
      paymentMethod: 'mobile_money',
      amount: e.stats.amountDue.toString(),
      consultationsCount: e.stats.unpaidConsultations.toString(),
      period: new Date().toLocaleDateString('fr-FR',{month:'long',year:'numeric'}),
      phoneNumber: e.doctor.phoneNumber || '',
      bankName:'', accountNumber:'', iban:'', provider:'', reference:''
    }));
    setShowPayModal(true);
  };

  const submitPayment = async () => {
    if (!selectedEarning || !payForm.amount || parseFloat(payForm.amount) <= 0) {
      showNotification('Montant invalide','error'); return;
    }
    try {
      setPayLoading(true);
      const details: any = {};
      if (payForm.paymentMethod === 'bank_transfer') { details.bankName = payForm.bankName; details.accountNumber = payForm.accountNumber; details.iban = payForm.iban; }
      else if (payForm.paymentMethod === 'mobile_money') { details.provider = selectedOperator || payForm.provider; details.phoneNumber = payForm.phoneNumber; }
      else { details.reference = payForm.reference; }

      await apiCall('/admin/doctor-payments', {
        method: 'POST',
        body: JSON.stringify({
          doctorId: selectedEarning.doctor.id,
          amount: parseFloat(payForm.amount),
          currency: payForm.currency,
          paymentMethod: payForm.paymentMethod,
          paymentDetails: details,
          period: payForm.period,
          consultationsCount: parseInt(payForm.consultationsCount) || 0,
          notes: payForm.notes
        })
      });

      showNotification(`✅ Paiement de ${payForm.amount} ${payForm.currency} effectué pour Dr. ${selectedEarning.doctor.lastName}`,'success');
      setShowPayModal(false);
      await fetchTab('payments');
    } catch (e: any) {
      showNotification(e?.message || 'Erreur paiement','error');
    } finally { setPayLoading(false); }
  };

  const handleLogout = () => {
    logout(); navigate('/login');
  };

  const APPT_STATUS_LABELS: Record<string,string> = {
    pending:'En attente', confirmed:'Confirmé', ongoing:'En cours',
    completed:'Terminé', cancelled:'Annulé', no_show:'Absent', missed:'Manqué'
  };
  const fAppts = (appointments || []).filter(a => {
    const q = apptFilter.toLowerCase();
    const matchQ = !q || (`${a.doctor?.firstName||''} ${a.doctor?.lastName||''} ${a.patient?.firstName||''} ${a.patient?.lastName||''}`).toLowerCase().includes(q);
    const computed = getComputedStatus(a.status, a.appointmentDate, a.duration);
    const matchS = !apptStatus || computed === apptStatus;
    return matchQ && matchS;
  });
  const fPresc  = (prescriptions || []).filter(p => { const q = prescFilter.toLowerCase(); return !q || `${p.doctor?.firstName||''} ${p.doctor?.lastName||''} ${p.patient?.firstName||''} ${p.patient?.lastName||''}`.toLowerCase().includes(q); });
  const fVideos = (videoCalls || []).filter(v => { const q = videoFilter.toLowerCase(); return !q || `${v.doctor?.firstName||''} ${v.doctor?.lastName||''} ${v.patient?.firstName||''} ${v.patient?.lastName||''}`.toLowerCase().includes(q); });
  const fEarn   = (earnings || []).filter(e => { const q = payFilter.toLowerCase(); return !q || `${e.doctor.firstName} ${e.doctor.lastName} ${e.doctor.specialty||''}`.toLowerCase().includes(q); });

  const pendingPayCount  = (earnings || []).filter(e => e.stats?.amountDue > 0).length;
  const unreadPrescCount = (prescriptions || []).filter(p => !p.isRead).length;

  const NAV: { id: Tab; label: string; icon: any; badge?: number }[] = [
    { id:'dashboard',     label:'Tableau de bord', icon:BarChart3  },
    { id:'doctors',       label:'Médecins',        icon:UserCheck  },
    { id:'patients',      label:'Patients',        icon:Users      },
    { id:'appointments',  label:'Rendez-vous',     icon:Calendar   },
    { id:'prescriptions', label:'Ordonnances',     icon:Pill,       badge: unreadPrescCount },
    { id:'videocalls',    label:'Appels vidéo',    icon:Video       },
    { id:'payments',      label:'Paiements',       icon:DollarSign, badge: pendingPayCount  },
    { id:'financial',     label:'Finances',        icon:CreditCard  },
    { id:'calendars',     label:'Calendriers',     icon:Calendar    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Administration</h1>
              <p className="text-xs text-gray-500">{user?.firstName} {user?.lastName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchDashboard} title="Actualiser" className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
              <RefreshCw className="w-4 h-4 text-gray-600" />
            </button>
            <div className="relative">
              <button
                ref={notifBtnRef}
                onClick={handleToggleNotif}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                title={pendingPayCount > 0 ? `${pendingPayCount} paiement(s) en attente` : 'Aucune notification'}
              >
                <Bell className="w-5 h-5 text-gray-600"/>
              </button>
              {pendingPayCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold animate-pulse">
                  {pendingPayCount}
                </span>
              )}
            </div>
            <button
              onClick={() => setShowLogoutModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:shadow-lg flex items-center gap-2 text-sm font-medium shadow-md transition-all"
            >
              <LogOut className="w-4 h-4"/> Déconnexion
            </button>
          </div>
        </div>
      </header>

      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
            {NAV.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative shrink-0 py-2.5 px-4 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${
                    active ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.badge && tab.badge > 0 ? (
                    <span className="ml-0.5 px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded-full font-bold leading-none">
                      {tab.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {dashLoading ? <Spinner /> : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  {(() => {
                    const allApts = appointments || [];
                    const aptStats = {
                      total:     allApts.length,
                      pending:   allApts.filter(a=>getComputedStatus(a.status,a.appointmentDate,a.duration)==='pending').length,
                      confirmed: allApts.filter(a=>getComputedStatus(a.status,a.appointmentDate,a.duration)==='confirmed').length,
                      completed: allApts.filter(a=>getComputedStatus(a.status,a.appointmentDate,a.duration)==='completed').length,
                      today:     allApts.filter(a=>new Date(a.appointmentDate).toDateString()===new Date().toDateString()).length,
                    };
                    return [
                      { title:'Utilisateurs', value:stats.users.total, icon:Users, color:'from-blue-500 to-indigo-600',
                        rows:[{l:'Médecins',v:stats.users.doctors},{l:'Patients',v:stats.users.patients},{l:'Actifs',v:stats.users.active},{l:'Inactifs',v:stats.users.inactive}] },
                      { title:'Rendez-vous', value:aptStats.total, icon:Calendar, color:'from-orange-500 to-rose-500',
                        rows:[{l:'En attente',v:aptStats.pending},{l:'Confirmés',v:aptStats.confirmed},{l:'Terminés',v:aptStats.completed},{l:"Aujourd'hui",v:aptStats.today}] },
                      { title:'Revenus', value:`${stats.financial.totalRevenue} XOF`, icon:DollarSign, color:'from-emerald-500 to-teal-600',
                        rows:[{l:'Commission',v:`${stats.financial.totalCommission} XOF`},{l:'En attente',v:`${stats.financial.pendingPayments} XOF`},{l:'Encaissé',v:`${stats.financial.completedPayments} XOF`}] },
                      { title:'Calendriers', value:calendars.length, icon:Calendar, color:'from-violet-500 to-purple-600',
                        rows:[{l:'Confirmés',v:calendars.filter(c=>c.confirmed).length},{l:'En attente',v:calendars.filter(c=>!c.confirmed).length}] },
                    ].map((c,i) => {
                      const Icon = c.icon;
                      return (
                        <div key={i} className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-xl hover:-translate-y-1 transition-all group">
                          <div className="flex items-center justify-between mb-3">
                            <div className={`p-3 rounded-xl bg-gradient-to-br ${c.color} shadow-lg group-hover:scale-110 transition-transform`}><Icon className="w-6 h-6 text-white"/></div>
                            <span className="text-3xl font-bold text-gray-900">{c.value}</span>
                          </div>
                          <h3 className="text-base font-semibold text-gray-900 mb-3">{c.title}</h3>
                          <div className="space-y-1.5">
                            {c.rows.map((r,j) => (
                              <div key={j} className="flex justify-between text-sm px-2 py-1.5 bg-gray-50 rounded-lg">
                                <span className="text-gray-600">{r.l}</span>
                                <span className="font-semibold text-gray-900">{r.v}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2 pb-3 border-b border-gray-100">
                      <Activity className="w-5 h-5 text-blue-600"/> Activité récente
                    </h3>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {(() => {
                        const recentApts = [...(appointments || [])]
                          .sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime())
                          .slice(0, 8);
                        if (recentApts.length === 0) return (
                          <div className="text-center py-10"><Activity className="w-10 h-10 text-gray-200 mx-auto mb-2"/><p className="text-sm text-gray-400">Aucune activité récente</p></div>
                        );
                        const STATUS_META: Record<string, { bg: string; icon: string; label: string; pill: string; dot: string }> = {
                          completed: { bg:'bg-blue-100',   icon:'text-blue-600',   label:'Terminé',     pill:'bg-blue-100 text-blue-700 border-blue-300',     dot:'bg-blue-500'   },
                          ongoing:   { bg:'bg-cyan-100',   icon:'text-cyan-600',   label:'En cours',    pill:'bg-cyan-100 text-cyan-700 border-cyan-300 animate-pulse',     dot:'bg-cyan-500'   },
                          confirmed: { bg:'bg-green-100',  icon:'text-green-600',  label:'Confirmé',    pill:'bg-green-100 text-green-700 border-green-300',   dot:'bg-green-500'  },
                          pending:   { bg:'bg-yellow-100', icon:'text-yellow-600', label:'En attente',  pill:'bg-yellow-100 text-yellow-700 border-yellow-300', dot:'bg-yellow-500' },
                          cancelled: { bg:'bg-red-100',    icon:'text-red-500',    label:'Annulé',      pill:'bg-red-100 text-red-600 border-red-300',         dot:'bg-red-500'    },
                          missed:    { bg:'bg-orange-100', icon:'text-orange-600', label:'Manqué',      pill:'bg-orange-100 text-orange-700 border-orange-300', dot:'bg-orange-500' },
                          no_show:   { bg:'bg-gray-100',   icon:'text-gray-500',   label:'Non honoré',  pill:'bg-gray-100 text-gray-600 border-gray-300',      dot:'bg-gray-400'   },
                        };
                        return recentApts.map(a => {
                          const computed = getComputedStatus(a.status, a.appointmentDate, a.duration);
                          const meta = STATUS_META[computed] || STATUS_META.pending;
                          const d = new Date(a.appointmentDate);
                          const dateStr = d.toLocaleDateString('fr-FR', { day:'2-digit', month:'short' });
                          const timeStr = d.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
                          return (
                            <div key={a.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                              <div className={`w-9 h-9 ${meta.bg} rounded-xl flex items-center justify-center shrink-0 shadow-sm`}>
                                <span className={`text-base ${meta.icon}`}>
                                  {computed==='completed'?'✓':computed==='ongoing'?'▶':computed==='confirmed'?'📅':computed==='pending'?'⏳':computed==='cancelled'?'✕':computed==='missed'?'⚠':'👻'}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                  {a.patient?.firstName} {a.patient?.lastName}
                                </p>
                                <p className="text-xs text-gray-500 truncate">Dr. {a.doctor?.lastName} • {a.motif || a.reason || '—'}</p>
                              </div>
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                <span className="text-xs text-gray-400 font-medium">{dateStr} {timeStr}</span>
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${meta.pill}`}>
                                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${meta.dot} mr-1`}/>
                                  {meta.label}
                                </span>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2 pb-3 border-b border-gray-100">
                      <Calendar className="w-5 h-5 text-purple-600"/> Derniers calendriers
                    </h3>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {calendars.length === 0 ? (
                        <div className="text-center py-10"><Calendar className="w-10 h-10 text-gray-200 mx-auto mb-2"/><p className="text-sm text-gray-400">Aucun calendrier</p></div>
                      ) : calendars.slice(0,6).map(cal => (
                        <div key={cal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-purple-200 transition">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm">{fmtDate(cal.date)}</p>
                            <p className="text-xs text-gray-500">Dr. {cal.doctor?.firstName} {cal.doctor?.lastName}</p>
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {(cal.slots||[]).slice(0,3).map((s,i) => <span key={i} className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{s}</span>)}
                              {(cal.slots||[]).length > 3 && <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">+{cal.slots.length-3}</span>}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 ml-3 shrink-0">
                            <Badge status={cal.confirmed ? 'completed' : 'pending'} />
                            <button onClick={() => handleDeleteCalendar(cal.id)} className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition border border-red-200">
                              <Trash className="w-3.5 h-3.5"/>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-blue-600"/>Répartition</h3>
                    <div className="space-y-3">
                      {[{l:'Médecins',v:stats.users.doctors,c:'from-green-500 to-green-600'},{l:'Patients',v:stats.users.patients,c:'from-blue-500 to-blue-600'},{l:'Admins',v:stats.users.admins,c:'from-purple-500 to-purple-600'}].map(({l,v,c})=>(
                        <div key={l} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between text-sm mb-1.5"><span className="font-medium text-gray-700">{l}</span><span className="font-bold text-gray-900">{v}</span></div>
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden"><div className={`bg-gradient-to-r ${c} h-2 rounded-full`} style={{width:`${stats.users.total?(v/stats.users.total)*100:0}%`}}/></div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-orange-500"/>Statut RDV</h3>
                    <div className="space-y-2">
                      {(() => {
                        const allApts = appointments || [];
                        const ct = {
                          pending:   allApts.filter(a=>getComputedStatus(a.status,a.appointmentDate,a.duration)==='pending').length,
                          confirmed: allApts.filter(a=>getComputedStatus(a.status,a.appointmentDate,a.duration)==='confirmed').length,
                          completed: allApts.filter(a=>getComputedStatus(a.status,a.appointmentDate,a.duration)==='completed').length,
                          cancelled: allApts.filter(a=>a.status==='cancelled').length,
                        };
                        return [{l:'En attente',v:ct.pending,dot:'bg-yellow-400 animate-pulse'},{l:'Confirmés',v:ct.confirmed,dot:'bg-green-500'},{l:'Terminés',v:ct.completed,dot:'bg-blue-500'},{l:'Annulés',v:ct.cancelled,dot:'bg-red-500'}].map(({l,v,dot})=>(
                          <div key={l} className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                            <span className="text-gray-700 text-sm flex items-center gap-2"><span className={`w-2.5 h-2.5 ${dot} rounded-full`}/>{l}</span>
                            <span className="font-bold text-gray-900 bg-white px-3 py-1 rounded-md shadow-sm text-sm">{v}</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2"><DollarSign className="w-5 h-5 text-green-500"/>Performance financière</h3>
                    <div className="space-y-3">
                      <div className="bg-green-50 border border-green-200 p-3 rounded-xl"><p className="text-xs text-gray-500">Revenus totaux</p><p className="text-2xl font-bold text-green-600">{stats.financial.totalRevenue} XOF</p></div>
                      <div className="bg-purple-50 border border-purple-200 p-3 rounded-xl"><p className="text-xs text-gray-500">Commission (10%)</p><p className="text-xl font-bold text-purple-600">{stats.financial.totalCommission} XOF</p></div>
                      <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg"><span className="text-sm text-gray-600">En attente</span><span className="font-semibold text-yellow-600 text-sm">{stats.financial.pendingPayments} XOF</span></div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'doctors' && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-md"><UserCheck className="w-6 h-6 text-white"/></div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Gestion des médecins</h2>
            </div>
            <UserManagement userType="doctor"/>
          </div>
        )}

        {activeTab === 'patients' && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl shadow-md"><Users className="w-6 h-6 text-white"/></div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">Gestion des patients</h2>
            </div>
            <UserManagement userType="patient"/>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-orange-500 to-rose-600 rounded-xl shadow-md"><Calendar className="w-5 h-5 text-white"/></div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Tous les rendez-vous</h2>
                  <p className="text-sm text-gray-500">{appointments.length} au total</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <select value={apptStatus} onChange={e=>setApptStatus(e.target.value)}
                  className="px-3 py-2.5 border-2 border-orange-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white shadow-md text-gray-700">
                  <option value="">Tous les statuts</option>
                  {Object.entries(APPT_STATUS_LABELS).map(([v,l])=><option key={v} value={v}>{l}</option>)}
                </select>
                <div className="relative shadow-md rounded-xl">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400"/>
                  <input type="text" placeholder="Rechercher médecin ou patient…" value={apptFilter} onChange={e=>setApptFilter(e.target.value)}
                    className="pl-9 pr-4 py-2.5 border-2 border-orange-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 w-64 bg-white text-gray-700 font-medium"/>
                </div>
                <button onClick={()=>fetchTab('appointments')} className="p-2.5 bg-orange-50 border-2 border-orange-200 text-orange-600 rounded-xl hover:bg-orange-100 transition shadow-md">
                  <RefreshCw className="w-4 h-4"/>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                {l:'Total',      v:appointments.length,                                                                                              c:'from-gray-400 to-gray-500'},
                {l:'En attente', v:appointments.filter(a=>getComputedStatus(a.status,a.appointmentDate,a.duration)==='pending').length,              c:'from-yellow-500 to-amber-600'},
                {l:'Confirmés',  v:appointments.filter(a=>getComputedStatus(a.status,a.appointmentDate,a.duration)==='confirmed').length,            c:'from-green-500 to-emerald-600'},
                {l:'Terminés',   v:appointments.filter(a=>getComputedStatus(a.status,a.appointmentDate,a.duration)==='completed').length,            c:'from-blue-500 to-indigo-600'},
                {l:'Annulés',    v:appointments.filter(a=>a.status==='cancelled').length,                                                            c:'from-red-500 to-rose-600'},
              ].map(({l,v,c})=>(
                <div key={l} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 bg-gradient-to-br ${c} rounded-lg flex items-center justify-center shadow-md shrink-0`}><Calendar className="w-5 h-5 text-white"/></div>
                  <div><p className="text-xs text-gray-500">{l}</p><p className="text-2xl font-bold text-gray-900">{v}</p></div>
                </div>
              ))}
            </div>
            {tabLoading ? <Spinner label="Chargement des rendez-vous…"/> :
              tabError ? <ApiError error={tabError} retry={()=>fetchTab('appointments')}/> :
              fAppts.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3"/>
                  <p className="text-gray-500 font-medium">Aucun rendez-vous trouvé</p>
                  <p className="text-xs text-gray-400 mt-1">{appointments.length===0?"Les rendez-vous apparaîtront ici dès qu'un patient prendra rendez-vous":"Aucun résultat pour ce filtre"}</p>
                </div>
              ) : (
              <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-x-auto">
                <table className="w-full min-w-[850px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>{['Date & Heure','Médecin','Patient','Type','Motif','Durée','Statut','Action'].map(h=>(
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {fAppts.map(a => {
                      const dt = a.appointmentDate ? new Date(a.appointmentDate) : null;
                      const dateStr = dt ? dt.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric'}) : '—';
                      const timeStr = dt ? dt.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}) : '—';
                      const typeLabels: Record<string,string> = {in_person:'Présentiel',teleconsultation:'Téléconsult.',home_visit:'Domicile'};
                      const computed = getComputedStatus(a.status, a.appointmentDate, a.duration);
                      return (
                        <tr key={a.id} className={`hover:bg-gray-50 transition ${computed === 'ongoing' ? 'bg-blue-50/40' : ''}`}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <p className="text-sm font-semibold text-gray-900">{dateStr}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3"/>{timeStr}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-gray-900">Dr. {a.doctor?.firstName} {a.doctor?.lastName}</p>
                            <p className="text-xs text-gray-500">{a.doctor?.specialty}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-gray-900">{a.patient?.firstName} {a.patient?.lastName}</p>
                            <p className="text-xs text-gray-400">{a.patient?.email}</p>
                            <p className="text-xs text-gray-400">{a.patient?.phoneNumber}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-medium">
                              {typeLabels[a.type] || a.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 max-w-[160px]">
                            <p className="text-sm text-gray-700 truncate" title={a.reason||'—'}>{a.reason||'—'}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                            {a.duration ? `${a.duration} min` : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${COMPUTED_STATUS_STYLE[computed] || COMPUTED_STATUS_STYLE.pending}`}>
                              {COMPUTED_STATUS_LABEL[computed] || computed}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              to={`/appointments/${a.id}`}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all whitespace-nowrap ${
                                computed === 'completed'
                                  ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                                  : computed === 'ongoing'
                                  ? 'bg-cyan-50 text-cyan-600 border-cyan-200 hover:bg-cyan-100 animate-pulse'
                                  : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                              }`}
                            >
                              <Eye className="w-3.5 h-3.5"/>
                              {computed === 'ongoing' ? 'En cours' : 'Voir détail'}
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'prescriptions' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-md"><Pill className="w-5 h-5 text-white"/></div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Toutes les ordonnances</h2>
                  <p className="text-sm text-gray-500">{prescriptions.length} au total</p>
                </div>
              </div>
              <div className="relative shadow-md rounded-xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400"/>
                <input type="text" placeholder="Rechercher médecin ou patient…"
                  value={prescFilter} onChange={e => setPrescFilter(e.target.value)}
                  className="pl-9 pr-4 py-2.5 border-2 border-emerald-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 w-64 bg-white text-gray-700 font-medium shadow-md"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {l:'Total',      v:prescriptions.length,                              c:'from-gray-400 to-gray-500'},
                {l:'Actives',    v:prescriptions.filter(p=>p.status==='active').length, c:'from-green-500 to-emerald-600'},
                {l:'Non lues',   v:prescriptions.filter(p=>!p.isRead).length,          c:'from-orange-500 to-red-500'},
                {l:'Terminées',  v:prescriptions.filter(p=>p.status==='completed' || p.status==='filled').length, c:'from-blue-500 to-indigo-600'},
              ].map(({l,v,c}) => (
                <div key={l} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 bg-gradient-to-br ${c} rounded-lg flex items-center justify-center shadow-md shrink-0`}><FileText className="w-5 h-5 text-white"/></div>
                  <div><p className="text-xs text-gray-500">{l}</p><p className="text-2xl font-bold text-gray-900">{v}</p></div>
                </div>
              ))}
            </div>

            {tabLoading ? <Spinner/> : tabError ? <ApiError error={tabError} retry={() => fetchTab('prescriptions')}/> : fPresc.length === 0 ? (
              <EmptyState icon={Pill} label="Aucune ordonnance trouvée" sub={prescriptions.length === 0 ? "Aucun médecin n'a encore créé d'ordonnance" : "Aucun résultat pour ce filtre"}/>
            ) : (
              <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>{['Date','Médecin','Patient','Médicaments','Statut','Lu','Voir'].map(h=>(
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {fPresc.map(p => (
                      <tr key={p.id} className={`hover:bg-gray-50 transition ${!p.isRead ? 'bg-orange-50/40' : ''}`}>
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{fmtDate(p.createdAt)}</td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">Dr. {p.doctor?.firstName} {p.doctor?.lastName}</p>
                          <p className="text-xs text-gray-500">{p.doctor?.specialty}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">{p.patient?.firstName} {p.patient?.lastName}</p>
                          <p className="text-xs text-gray-500">{p.patient?.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(p.medications||[]).slice(0,2).map((m,i)=>(
                              <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs">💊 {m.medication}</span>
                            ))}
                            {(p.medications||[]).length > 2 && <span className="text-xs text-gray-400">+{p.medications.length-2}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3"><Badge status={p.status}/></td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${p.isRead ? 'bg-green-50 text-green-600 border-green-200' : 'bg-orange-50 text-orange-600 border-orange-200 animate-pulse'}`}>
                            {p.isRead ? '✓ Lu' : '● Non lu'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={()=>setSelectedPresc(p)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition border border-blue-200">
                            <Eye className="w-4 h-4"/>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'videocalls' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-md"><Video className="w-5 h-5 text-white"/></div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Tous les appels vidéo</h2>
                  <p className="text-sm text-gray-500">{videoCalls.length} au total</p>
                </div>
              </div>
              <div className="relative shadow-md rounded-xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400"/>
                <input type="text" placeholder="Rechercher médecin ou patient…"
                  value={videoFilter} onChange={e => setVideoFilter(e.target.value)}
                  className="pl-9 pr-4 py-2.5 border-2 border-blue-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-64 bg-white text-gray-700 font-medium shadow-md"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {l:'Total',     v:videoCalls.length, c:'from-gray-400 to-gray-500'},
                {l:'Terminés',  v:videoCalls.filter(v=>v.status==='completed').length, c:'from-green-500 to-emerald-600'},
                {l:'Planifiés', v:videoCalls.filter(v=>v.status==='scheduled').length, c:'from-blue-500 to-indigo-600'},
                {l:'Manqués',   v:videoCalls.filter(v=>v.status==='missed').length,    c:'from-red-500 to-rose-600'},
              ].map(({l,v,c})=>(
                <div key={l} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 bg-gradient-to-br ${c} rounded-lg flex items-center justify-center shadow-md shrink-0`}><Video className="w-5 h-5 text-white"/></div>
                  <div><p className="text-xs text-gray-500">{l}</p><p className="text-2xl font-bold text-gray-900">{v}</p></div>
                </div>
              ))}
            </div>

            {tabLoading ? <Spinner/> : tabError ? <ApiError error={tabError} retry={() => fetchTab('videocalls')}/> : fVideos.length === 0 ? (
              <EmptyState icon={Video} label="Aucun appel vidéo trouvé" sub="Les appels démarreront dès les premières consultations vidéo"/>
            ) : (
              <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>{['Date','Médecin','Patient','Durée','Statut','Lien'].map(h=>(
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {fVideos.map(v => {
                      const {date,time} = fmtDT(v.createdAt);
                      const link = v.roomLink || v.meetingUrl;
                      const dur  = v.durationMinutes || v.duration;
                      return (
                        <tr key={v.id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3 whitespace-nowrap"><p className="text-sm font-medium text-gray-900">{date}</p><p className="text-xs text-gray-500">{time}</p></td>
                          <td className="px-4 py-3"><p className="text-sm font-medium text-gray-900">Dr. {v.doctor?.firstName} {v.doctor?.lastName}</p><p className="text-xs text-gray-500">{v.doctor?.specialty}</p></td>
                          <td className="px-4 py-3"><p className="text-sm font-medium text-gray-900">{v.patient?.firstName} {v.patient?.lastName}</p><p className="text-xs text-gray-500">{v.patient?.phoneNumber}</p></td>
                          <td className="px-4 py-3 text-sm text-gray-700">{dur ? `${dur} min` : '—'}</td>
                          <td className="px-4 py-3"><Badge status={v.status}/></td>
                          <td className="px-4 py-3">
                            {link ? (
                              <a href={link} target="_blank" rel="noreferrer" className="px-2.5 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-xs font-medium hover:bg-blue-100 transition">Rejoindre</a>
                            ) : <span className="text-gray-400 text-xs">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-md"><DollarSign className="w-5 h-5 text-white"/></div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Paiements des médecins</h2>
                <p className="text-sm text-gray-500">Gérez les versements et suivez les soldes</p>
              </div>
            </div>

            {tabLoading ? <Spinner label="Calcul des revenus…"/> : tabError ? <ApiError error={tabError} retry={() => fetchTab('payments')}/> : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl border border-gray-200 shadow-md p-5">
                    <p className="text-sm text-gray-500 mb-1 flex items-center gap-1"><Activity className="w-4 h-4 text-blue-400"/>Consultations totales</p>
                    <p className="text-3xl font-bold text-blue-600">{earnings.reduce((s,e)=>s+(e.stats?.completedConsultations||0),0)}</p>
                    <p className="text-xs text-gray-400 mt-1">Parmi tous les médecins</p>
                  </div>
                  <div className="bg-white rounded-xl border border-purple-200 shadow-md p-5">
                    <p className="text-sm text-gray-500 mb-1 flex items-center gap-1"><DollarSign className="w-4 h-4 text-purple-400"/>Part totale (90%)</p>
                    <p className="text-3xl font-bold text-purple-600">{earnings.reduce((s,e)=>s+(e.stats?.doctorShare||0),0).toFixed(0)} XOF</p>
                    <p className="text-xs text-gray-400 mt-1">Montant total dû aux médecins</p>
                  </div>
                  <div className="bg-white rounded-xl border border-green-200 shadow-md p-5">
                    <p className="text-sm text-gray-500 mb-1 flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-400"/>Total versé</p>
                    <p className="text-3xl font-bold text-green-600">{earnings.reduce((s,e)=>s+(e.stats?.totalPaid||0),0).toFixed(0)} XOF</p>
                    <p className="text-xs text-gray-400 mt-1">{payments.length} paiement(s) effectué(s)</p>
                  </div>
                  <div className="bg-white rounded-xl border border-red-200 shadow-md p-5">
                    <p className="text-sm text-gray-500 mb-1 flex items-center gap-1"><AlertCircle className="w-4 h-4 text-red-400"/>Restant dû</p>
                    <p className="text-3xl font-bold text-red-600">{earnings.reduce((s,e)=>s+(e.stats?.amountDue||0),0).toFixed(0)} XOF</p>
                    <p className="text-xs text-gray-400 mt-1">{pendingPayCount} médecin(s) en attente</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Revenus par médecin</h3>
                  <div className="relative shadow-md rounded-xl">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400"/>
                    <input type="text" placeholder="Filtrer par médecin…"
                      value={payFilter} onChange={e => setPayFilter(e.target.value)}
                      className="pl-9 pr-4 py-2.5 border-2 border-green-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 w-64 bg-white text-gray-700 font-medium"
                    />
                  </div>
                </div>

                {fEarn.length === 0 ? (
                  <EmptyState icon={Users} label="Aucun médecin enregistré" sub="Les médecins apparaîtront ici dès leur inscription"/>
                ) : (
                  <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[1000px]">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Médecin</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Consultations</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Part (90%)</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Versé</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Restant dû</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {fEarn.map(e => {
                            const consultations = e.stats.completedConsultations || 0;
                            const partMedecin = e.stats.doctorShare || 0;
                            const verse = e.stats.totalPaid || 0;
                            const restantDu = e.stats.amountDue || 0;
                            
                            return (
                              <tr key={e.doctor.id} className="hover:bg-gray-50 transition">
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md shrink-0 text-sm">
                                      {(e.doctor.firstName||'?')[0]}{(e.doctor.lastName||'?')[0]}
                                    </div>
                                    <div>
                                      <p className="font-semibold text-gray-900">Dr. {e.doctor.firstName} {e.doctor.lastName}</p>
                                      <p className="text-xs text-gray-500">{e.doctor.specialty}</p>
                                      <p className="text-xs text-gray-400 truncate max-w-[180px]">{e.doctor.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-center">
                                  <div className="inline-flex items-center justify-center">
                                    <span className="text-xl font-bold text-gray-900">{consultations}</span>
                                    <span className="ml-1 text-xs text-gray-400">consult.</span>
                                  </div>
                                  <p className="text-xs text-gray-400 mt-1">{e.stats.paidConsultations || 0} payées</p>
                                </td>
                                <td className="px-4 py-4 text-center">
                                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-2">
                                    <span className="text-lg font-bold text-purple-700">{partMedecin.toLocaleString('fr-FR')}</span>
                                    <span className="ml-1 text-xs text-purple-500">XOF</span>
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-center">
                                  <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                                    <span className="text-lg font-bold text-green-700">{verse.toLocaleString('fr-FR')}</span>
                                    <span className="ml-1 text-xs text-green-500">XOF</span>
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-center">
                                  {restantDu > 0 ? (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                                      <span className="text-lg font-bold text-red-600">{restantDu.toLocaleString('fr-FR')}</span>
                                      <span className="ml-1 text-xs text-red-400">XOF</span>
                                    </div>
                                  ) : (
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                                      <span className="text-lg font-bold text-gray-400">0</span>
                                      <span className="ml-1 text-xs text-gray-400">XOF</span>
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-4 text-center">
                                  <button
                                    onClick={() => openPayModal(e)}
                                    disabled={restantDu <= 0}
                                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                                      restantDu > 0
                                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:scale-105 shadow-md'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                                  >
                                    {restantDu > 0 ? (
                                      <>
                                        <Send className="w-4 h-4"/>
                                        Payer
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="w-4 h-4"/>
                                        À jour
                                      </>
                                    )}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="border-t border-gray-200 bg-gray-50 p-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-gray-500"/>
                        Historique des derniers paiements
                      </h4>
                      <div className="space-y-2">
                        {fEarn.filter(e => e.paymentHistory?.length > 0).slice(0, 3).map(e => (
                          <div key={e.doctor.id} className="bg-white rounded-lg border border-gray-200 p-3">
                            <p className="text-sm font-medium text-gray-800 mb-2">Dr. {e.doctor.lastName}</p>
                            <div className="flex flex-wrap gap-2">
                              {(e.paymentHistory || []).slice(0, 3).map((p: any, i: number) => (
                                <span key={i} className="px-2.5 py-1 bg-green-50 border border-green-200 text-green-700 rounded-full text-xs flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3"/>
                                  {p.amount?.toLocaleString('fr-FR')} XOF — {p.period || fmtDate(p.processedAt)}
                                </span>
                              ))}
                              {(e.paymentHistory || []).length > 3 && (
                                <span className="px-2.5 py-1 bg-gray-100 border border-gray-200 text-gray-500 rounded-full text-xs">
                                  +{(e.paymentHistory || []).length - 3} autres
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        {fEarn.filter(e => e.paymentHistory?.length > 0).length === 0 && (
                          <p className="text-sm text-gray-400 text-center py-4">Aucun historique de paiement</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {payments.length > 0 && (
                  <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-gray-500"/>
                      <h3 className="font-semibold text-gray-900">Historique complet des paiements</h3>
                      <span className="ml-auto text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">{payments.length}</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[600px]">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Médecin</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Montant</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Consult.</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Méthode</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Période</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {payments.map(p => {
                            const method = PAYMENT_METHODS.find(m=>m.value===p.paymentMethod);
                            const MI = method?.icon || Banknote;
                            return (
                              <tr key={p.id} className="hover:bg-gray-50 transition">
                                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{fmtDate(p.createdAt)}</td>
                                <td className="px-4 py-3">
                                  <p className="text-sm font-medium text-gray-900">Dr. {p.doctor?.firstName} {p.doctor?.lastName}</p>
                                  <p className="text-xs text-gray-500">{p.doctor?.specialty}</p>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <p className="text-sm font-bold text-green-600">{p.amount?.toLocaleString('fr-FR')} {p.currency}</p>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className="text-sm text-gray-600">{p.consultationsCount || 0}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`flex items-center gap-1.5 text-sm ${method?.color||'text-gray-600'}`}>
                                    <MI className="w-4 h-4"/>
                                    {method?.label || p.paymentMethod}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">{p.period || '—'}</td>
                                <td className="px-4 py-3 text-center"><Badge status={p.status}/></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'financial' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-500"/>Revenus globaux</h3>
              <div className="space-y-3">
                {[
                  {l:'Revenus totaux',     v:`${stats.financial.totalRevenue} XOF`,      c:'text-green-600', bg:'bg-green-50 border-green-200',   big:true},
                  {l:'Commission (10%)',   v:`${stats.financial.totalCommission} XOF`,   c:'text-purple-600',bg:'bg-purple-50 border-purple-200'       },
                  {l:'Paiements en attente',v:`${stats.financial.pendingPayments} XOF`,  c:'text-yellow-600',bg:'bg-yellow-50 border-yellow-200'       },
                  {l:'Paiements complétés',v:`${stats.financial.completedPayments} XOF`, c:'text-blue-600',  bg:'bg-blue-50 border-blue-200'           },
                ].map(({l,v,c,bg,big})=>(
                  <div key={l} className={`flex justify-between items-center p-4 rounded-xl border ${bg}`}>
                    <span className="text-gray-600 text-sm">{l}</span>
                    <span className={`font-bold ${big?'text-2xl':'text-base'} ${c}`}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-500"/>Statistiques RDV</h3>
              <div className="space-y-3">
                {[
                  {l:'Total RDV',    v:stats.appointments.total,              c:'text-gray-900', bg:'bg-gray-50 border-gray-200',   big:true},
                  {l:'Ce mois',      v:stats.appointments.thisMonth||0,        c:'text-blue-600', bg:'bg-blue-50 border-blue-200'       },
                  {l:'Cette semaine',v:stats.appointments.thisWeek||0,         c:'text-indigo-600',bg:'bg-indigo-50 border-indigo-200'  },
                  {l:'Annulés',      v:stats.appointments.cancelled,           c:'text-red-500',  bg:'bg-red-50 border-red-200'         },
                ].map(({l,v,c,bg,big})=>(
                  <div key={l} className={`flex justify-between items-center p-4 rounded-xl border ${bg}`}>
                    <span className="text-gray-600 text-sm">{l}</span>
                    <span className={`font-bold ${big?'text-2xl':'text-base'} ${c}`}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calendars' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Gestion des calendriers ({calendars.length})</h2>
            {calendars.length === 0 ? (
              <EmptyState icon={Calendar} label="Aucun calendrier" sub="Les médecins n'ont pas encore créé de disponibilités"/>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {calendars.map(cal => (
                  <div key={cal.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-xl hover:-translate-y-1 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-md"><Calendar className="w-5 h-5 text-white"/></div>
                        <div>
                          <p className="font-bold text-gray-900">{fmtDate(cal.date)}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5"><Award className="w-3.5 h-3.5 text-purple-400"/>Dr. {cal.doctor?.firstName} {cal.doctor?.lastName}</p>
                        </div>
                      </div>
                      <Badge status={cal.confirmed ? 'completed' : 'pending'}/>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {(cal.slots||[]).map((s,i)=><span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium">{s}</span>)}
                    </div>
                    <div className="flex justify-end border-t border-gray-100 pt-3">
                      <button onClick={() => handleDeleteCalendar(cal.id)} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-medium flex items-center gap-2">
                        <Trash className="w-4 h-4"/> Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showPayModal && selectedEarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md text-white font-bold text-lg">
                  {selectedEarning.doctor.firstName[0]}{selectedEarning.doctor.lastName[0]}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Payer Dr. {selectedEarning.doctor.firstName} {selectedEarning.doctor.lastName}
                  </h2>
                  <p className="text-xs text-gray-500">{selectedEarning.doctor.specialty}</p>
                </div>
              </div>
              <button onClick={() => setShowPayModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition">
                <X className="w-5 h-5 text-gray-500"/>
              </button>
            </div>

            <div className="flex items-center gap-2 px-6 pt-4 pb-2">
              {[{n:1,l:'Méthode de paiement'},{n:2,l:'Détails & confirmation'}].map(({n,l})=>(
                <React.Fragment key={n}>
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-all ${payStep>=n?'bg-green-500 text-white shadow-md':'bg-gray-200 text-gray-500'}`}>{n}</div>
                    <span className={`text-xs font-medium transition-colors ${payStep>=n?'text-green-600':'text-gray-400'}`}>{l}</span>
                  </div>
                  {n<2 && <div className={`flex-1 h-0.5 transition-all ${payStep>=2?'bg-green-400':'bg-gray-200'}`}/>}
                </React.Fragment>
              ))}
            </div>

            <div className="p-6 max-h-[65vh] overflow-y-auto">
              {payStep === 1 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    {[
                      {l:'Consultations impayées', v:selectedEarning.stats.unpaidConsultations, c:'text-gray-900'},
                      {l:'Montant dû',             v:`${selectedEarning.stats.amountDue} XOF`,  c:'text-red-600'},
                      {l:'Part médecin',           v:'90%',                                      c:'text-blue-600'},
                    ].map(({l,v,c})=>(
                      <div key={l} className="text-center"><p className="text-xs text-gray-500 leading-tight mb-1">{l}</p><p className={`text-xl font-bold ${c}`}>{v}</p></div>
                    ))}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-3">Comment souhaitez-vous payer ?</p>
                    <div className="grid grid-cols-2 gap-3">
                      {PAYMENT_METHODS.map(m => {
                        const Icon = m.icon;
                        const active = payForm.paymentMethod === m.value;
                        return (
                          <button key={m.value} type="button"
                            onClick={() => { setPayForm(f=>({...f,paymentMethod:m.value})); setSelectedOperator(''); }}
                            className={`p-4 border-2 rounded-xl flex items-center gap-3 transition-all font-medium ${active?`border-green-500 ${m.bg} shadow-md`:`border-gray-200 hover:border-gray-300 hover:bg-gray-50`}`}>
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${active?'bg-green-500 shadow-md':'bg-gray-100'}`}>
                              <Icon className={`w-5 h-5 ${active?'text-white':m.color}`}/>
                            </div>
                            <div className="text-left">
                              <p className={`text-sm font-semibold ${active?'text-green-700':'text-gray-700'}`}>{m.label}</p>
                            </div>
                            {active && <CheckCircle className="w-5 h-5 text-green-500 ml-auto"/>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {payForm.paymentMethod === 'mobile_money' && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-green-500"/>
                        Choisissez l'opérateur
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {MOBILE_OPERATORS.map(op => {
                          const active = selectedOperator === op.id;
                          return (
                            <button key={op.id} type="button"
                              onClick={() => setSelectedOperator(op.id)}
                              className={`p-3 rounded-xl border-2 flex items-center gap-3 transition-all font-medium ${active?`border-green-500 bg-green-50 shadow-md`:'border-gray-200 hover:border-gray-300 bg-white'}`}>
                              <div className={`w-10 h-10 ${op.color} rounded-xl flex items-center justify-center text-xl shadow-sm shrink-0`}>
                                {op.emoji}
                              </div>
                              <div className="text-left min-w-0">
                                <p className={`text-sm font-semibold truncate ${active?'text-green-700':'text-gray-800'}`}>{op.label}</p>
                                <p className="text-xs text-gray-400 truncate">{op.country}</p>
                              </div>
                              {active && <CheckCircle className="w-4 h-4 text-green-500 ml-auto shrink-0"/>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <button type="button"
                    onClick={() => setPayStep(2)}
                    disabled={payForm.paymentMethod==='mobile_money' && !selectedOperator}
                    className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    Continuer →
                    {payForm.paymentMethod==='mobile_money' && !selectedOperator && (
                      <span className="text-xs text-green-200 ml-1">(choisir un opérateur)</span>
                    )}
                  </button>
                </div>
              )}

              {payStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                    {(() => {
                      const method = PAYMENT_METHODS.find(m=>m.value===payForm.paymentMethod);
                      const op = MOBILE_OPERATORS.find(o=>o.id===selectedOperator);
                      const Icon = method?.icon || Smartphone;
                      return <>
                        <div className={`w-10 h-10 ${op?op.color:'bg-green-500'} rounded-xl flex items-center justify-center shadow-sm shrink-0`}>
                          {op ? <span className="text-xl">{op.emoji}</span> : <Icon className="w-5 h-5 text-white"/>}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{op?.label || method?.label}</p>
                          <p className="text-xs text-gray-500">{op?.country || 'Méthode sélectionnée'}</p>
                        </div>
                        <button type="button" onClick={()=>setPayStep(1)} className="ml-auto text-xs text-green-600 hover:underline font-medium">Changer</button>
                      </>;
                    })()}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">💰 Montant *</label>
                      <input type="number" value={payForm.amount} onChange={e=>setPayForm(f=>({...f,amount:e.target.value}))}
                        className="w-full px-3 py-2.5 border-2 border-green-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 bg-green-50 text-gray-800 shadow-sm" placeholder="0"/>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Devise</label>
                      <select value={payForm.currency} onChange={e=>setPayForm(f=>({...f,currency:e.target.value}))}
                        className="w-full px-3 py-2.5 border-2 border-green-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 bg-green-50 text-gray-800 shadow-sm">
                        {['XOF','EUR','USD','GHS','XAF'].map(c=><option key={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">📅 Période</label>
                      <input type="text" value={payForm.period} onChange={e=>setPayForm(f=>({...f,period:e.target.value}))}
                        placeholder="ex: Mars 2026" className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-800 shadow-sm"/>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">🩺 Nb consultations</label>
                      <input type="number" value={payForm.consultationsCount} onChange={e=>setPayForm(f=>({...f,consultationsCount:e.target.value}))}
                        className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-800 shadow-sm"/>
                    </div>
                  </div>

                  {payForm.paymentMethod === 'mobile_money' && (
                    <div className="space-y-2.5 p-4 bg-green-50 rounded-xl border-2 border-green-300 shadow-sm">
                      <p className="text-xs font-bold text-green-800 uppercase tracking-wider flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5"/>Informations Mobile Money</p>
                      <div>
                        <label className="block text-xs font-semibold text-green-700 mb-1">📱 Numéro de téléphone *</label>
                        <input placeholder="+228 XX XX XX XX" value={payForm.phoneNumber} onChange={e=>setPayForm(f=>({...f,phoneNumber:e.target.value}))}
                          className="w-full px-3 py-2.5 border-2 border-green-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-800 shadow-sm"
                          type="tel"/>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-green-700 mb-1">🔖 Référence transaction (optionnel)</label>
                        <input placeholder="Ex: TXN-2026-XXXXX" value={payForm.reference} onChange={e=>setPayForm(f=>({...f,reference:e.target.value}))}
                          className="w-full px-3 py-2.5 border-2 border-green-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-800 shadow-sm"/>
                      </div>
                    </div>
                  )}

                  {payForm.paymentMethod === 'bank_transfer' && (
                    <div className="space-y-2.5 p-4 bg-blue-50 rounded-xl border-2 border-blue-300 shadow-sm">
                      <p className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5"/>Informations bancaires</p>
                      {[
                        {pl:'🏦 Nom de la banque *', k:'bankName'},
                        {pl:'🔢 Numéro de compte *', k:'accountNumber'},
                        {pl:'🌍 IBAN (optionnel)',    k:'iban'}
                      ].map(({pl,k})=>(
                        <div key={k}>
                          <label className="block text-xs font-semibold text-blue-700 mb-1">{pl}</label>
                          <input placeholder={pl.replace(/^[^ ]+ /,'')} value={(payForm as any)[k]} onChange={e=>setPayForm(f=>({...f,[k]:e.target.value}))}
                            className="w-full px-3 py-2.5 border-2 border-blue-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800 shadow-sm"/>
                        </div>
                      ))}
                    </div>
                  )}

                  {(payForm.paymentMethod==='cash'||payForm.paymentMethod==='check') && (
                    <div className="space-y-2.5 p-4 bg-yellow-50 rounded-xl border-2 border-yellow-300 shadow-sm">
                      <p className="text-xs font-bold text-yellow-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Banknote className="w-3.5 h-3.5"/>{payForm.paymentMethod==='cash'?'Paiement espèces':'Paiement par chèque'}
                      </p>
                      <div>
                        <label className="block text-xs font-semibold text-yellow-700 mb-1">🔖 Numéro de référence / reçu</label>
                        <input placeholder="Ex: REC-2026-XXXXX" value={payForm.reference} onChange={e=>setPayForm(f=>({...f,reference:e.target.value}))}
                          className="w-full px-3 py-2.5 border-2 border-yellow-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white text-gray-800 shadow-sm"/>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">📝 Notes (optionnel)</label>
                    <textarea rows={2} value={payForm.notes} onChange={e=>setPayForm(f=>({...f,notes:e.target.value}))}
                      placeholder="Observations, justificatifs…"
                      className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-800 shadow-sm resize-none"/>
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={()=>setPayStep(1)}
                      className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition text-sm flex items-center justify-center gap-1">
                      ← Retour
                    </button>
                    <button type="button" onClick={submitPayment} disabled={payLoading || !payForm.amount || parseFloat(payForm.amount)<=0}
                      className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50 text-sm">
                      {payLoading
                        ? <Loader2 className="w-5 h-5 animate-spin"/>
                        : <><Send className="w-4 h-4"/> Confirmer le paiement</>
                      }
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedPresc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={()=>setSelectedPresc(null)}>
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50">
              <div><h2 className="text-xl font-bold text-gray-900">Détail de l'ordonnance</h2><p className="text-sm text-gray-500">Émise le {fmtDate(selectedPresc.createdAt)}</p></div>
              <button onClick={()=>setSelectedPresc(null)} className="p-2 hover:bg-gray-100 rounded-xl transition"><X className="w-5 h-5 text-gray-500"/></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-xs text-blue-500 font-bold mb-1 uppercase tracking-wider">Médecin</p>
                  <p className="font-semibold text-gray-900">Dr. {selectedPresc.doctor?.firstName} {selectedPresc.doctor?.lastName}</p>
                  <p className="text-sm text-gray-500">{selectedPresc.doctor?.specialty}</p>
                  <p className="text-xs text-gray-400">{selectedPresc.doctor?.email}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                  <p className="text-xs text-purple-500 font-bold mb-1 uppercase tracking-wider">Patient</p>
                  <p className="font-semibold text-gray-900">{selectedPresc.patient?.firstName} {selectedPresc.patient?.lastName}</p>
                  <p className="text-sm text-gray-500">{selectedPresc.patient?.email}</p>
                  <p className="text-xs text-gray-400">{selectedPresc.patient?.phoneNumber}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Médicaments</p>
                <div className="space-y-2">
                  {(selectedPresc.medications||[]).map((m,i)=>(
                    <div key={i} className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <p className="font-semibold text-gray-900">💊 {m.medication}</p>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded-lg border border-gray-200 text-center">📏 {m.dosage}</span>
                        <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded-lg border border-gray-200 text-center">⏰ {m.frequency}</span>
                        <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded-lg border border-gray-200 text-center">📅 {m.duration}</span>
                      </div>
                      {m.instructions && <p className="text-xs text-gray-500 mt-1.5 italic">→ {m.instructions}</p>}
                    </div>
                  ))}
                </div>
              </div>
              {selectedPresc.notes && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <p className="text-xs text-yellow-600 font-bold mb-1 uppercase tracking-wider">Recommandations</p>
                  <p className="text-sm text-gray-700">{selectedPresc.notes}</p>
                </div>
              )}
              <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-gray-100">
                <Badge status={selectedPresc.status}/>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${selectedPresc.isRead?'bg-green-50 text-green-700 border-green-200':'bg-orange-50 text-orange-600 border-orange-200 font-bold'}`}>
                  {selectedPresc.isRead ? '✓ Lu' : '● Non lu'}
                </span>
                {selectedPresc.validUntil && <span className="px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-600 border border-gray-200">Valide jusqu'au {fmtDate(selectedPresc.validUntil)}</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {showNotifDropdown && createPortal(
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 99998 }}
            onClick={() => setShowNotifDropdown(false)}
          />
          <div
            ref={notifRef}
            style={{
              position: 'fixed',
              top:   notifPos.top,
              right: notifPos.right,
              zIndex: 99999,
              width: '340px',
              animation: 'adminNotifIn 0.22s cubic-bezier(0.34,1.56,0.64,1) forwards',
            }}
            className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
          >
            <style>{`
              @keyframes adminNotifIn {
                from { opacity:0; transform:translateY(-10px) scale(0.97); }
                to   { opacity:1; transform:translateY(0) scale(1); }
              }
            `}</style>

            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600"/>
                <span className="text-gray-900 font-bold text-sm">Notifications</span>
                {pendingPayCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                    {pendingPayCount}
                  </span>
                )}
              </div>
              <button onClick={() => setShowNotifDropdown(false)} className="text-gray-400 hover:text-gray-600 transition">
                <XCircle className="w-4 h-4"/>
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto">
              {pendingPayCount === 0 ? (
                <div className="py-10 text-center">
                  <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-60"/>
                  <p className="text-gray-500 text-sm font-medium">Tout est à jour !</p>
                  <p className="text-gray-400 text-xs mt-1">Aucun paiement en attente</p>
                </div>
              ) : (
                earnings.filter(e => e.stats.amountDue > 0).map(e => (
                  <div key={e.doctor.id} className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                        <span className="text-white text-xs font-bold">
                          {e.doctor.firstName[0]}{e.doctor.lastName[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">Dr. {e.doctor.firstName} {e.doctor.lastName}</p>
                        <p className="text-xs text-gray-500 truncate">{e.doctor.specialty}</p>
                      </div>
                      <span className="text-sm font-bold text-red-600 shrink-0">{e.stats.amountDue} XOF</span>
                    </div>
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={() => { openPayModal(e); setShowNotifDropdown(false); }}
                        className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 hover:shadow-md transition-all"
                      >
                        <DollarSign className="w-3 h-3"/> Payer maintenant
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {pendingPayCount > 0 && (
              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={() => { setActiveTab('payments'); setShowNotifDropdown(false); }}
                  className="w-full text-center text-blue-600 hover:text-blue-700 text-xs font-semibold transition-colors"
                >
                  Voir tous les paiements →
                </button>
              </div>
            )}
          </div>
        </>,
        document.body
      )}

      {showLogoutModal && createPortal(
        <div
          className="flex items-center justify-center"
          style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-sm mx-4"
            style={{ animation: 'adminNotifIn 0.25s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
          >
            <div className="flex flex-col items-center pt-8 pb-4 px-6">
              <div className="w-16 h-16 bg-gradient-to-br from-red-50 to-rose-100 border-2 border-red-200 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                <LogOut className="w-8 h-8 text-red-500"/>
              </div>
              <h2 className="text-xl font-black text-gray-900 mb-2">Déconnexion</h2>
              <p className="text-gray-500 text-sm text-center leading-relaxed">
                Êtes-vous sûr de vouloir quitter le panneau d'administration ?
              </p>
              <p className="text-gray-400 text-xs text-center mt-1">
                Vous devrez vous reconnecter pour accéder au dashboard.
              </p>
            </div>

            <div className="border-t border-gray-100 mx-6"/>

            <div className="flex gap-3 p-5">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-3 bg-gray-100 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all text-sm"
              >
                Annuler
              </button>
              <button
                onClick={() => { setShowLogoutModal(false); handleLogout(); }}
                className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-200 transition-all hover:scale-[1.02] text-sm"
              >
                <LogOut className="w-4 h-4"/> Se déconnecter
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdminDashboard;
