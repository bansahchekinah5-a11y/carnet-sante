import React, { useState, useEffect } from 'react';
import {
  Users, Calendar, CreditCard, Activity, Trash, Eye,
  Search, BarChart3, Settings, LogOut, Bell, TrendingUp,
  UserCheck, UserX, Clock, CheckCircle, XCircle, DollarSign,
  FileText, Award, AlertCircle, Video, Pill, Banknote,
  Smartphone, Building2, Receipt, RefreshCw, X, Send, Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { adminService, User as UserType, DashboardStats } from '../../services/adminService';
import { calendarService } from '../../services/calendarService';
import UserManagement from '../../components/Admin/UserManagement';
import api from '../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────
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
  id: string; createdAt: string; status: string; roomLink: string;
  startedAt?: string; endedAt?: string; durationMinutes?: number; notes?: string;
  doctor?:  { id: string; firstName: string; lastName: string; specialty?: string };
  patient?: { id: string; firstName: string; lastName: string; phoneNumber?: string };
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
type Tab = 'dashboard' | 'doctors' | 'patients' | 'appointments' | 'prescriptions' | 'videocalls' | 'payments' | 'financial' | 'calendars';

// ─── Constantes ───────────────────────────────────────────────────────────────
const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Virement bancaire', icon: Building2,  color: 'text-blue-600'   },
  { value: 'mobile_money',  label: 'Mobile Money',      icon: Smartphone, color: 'text-green-600'  },
  { value: 'cash',          label: 'Espèces',           icon: Banknote,   color: 'text-yellow-600' },
  { value: 'check',         label: 'Chèque',            icon: Receipt,    color: 'text-purple-600' },
];
const MOBILE_OPERATORS = ['Orange Money','MTN Mobile Money','Moov Money','Wave','Free Money','T-Money'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d: string) => { try { return new Date(d).toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric'}); } catch { return '—'; } };
const fmtDateTime = (d: string) => { try { const dt=new Date(d); return { date:dt.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric'}), time:dt.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}) }; } catch { return {date:'—',time:'—'}; } };
const STATUS_STYLE: Record<string,string> = { active:'bg-green-100 text-green-700 border border-green-200', completed:'bg-blue-100 text-blue-700 border border-blue-200', cancelled:'bg-red-100 text-red-700 border border-red-200', pending:'bg-yellow-100 text-yellow-700 border border-yellow-200', scheduled:'bg-indigo-100 text-indigo-700 border border-indigo-200', ongoing:'bg-cyan-100 text-cyan-700 border border-cyan-200', missed:'bg-gray-100 text-gray-600 border border-gray-200', failed:'bg-red-100 text-red-700 border border-red-200', processing:'bg-orange-100 text-orange-700 border border-orange-200' };
const STATUS_LABEL: Record<string,string> = { active:'Actif', completed:'Terminé', cancelled:'Annulé', pending:'En attente', scheduled:'Planifié', ongoing:'En cours', missed:'Manqué', failed:'Échoué', processing:'En traitement' };

// ─── Sous-composants ──────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => (
  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[status] || STATUS_STYLE.pending}`}>{STATUS_LABEL[status] || status}</span>
);
const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 text-blue-500 animate-spin"/><p className="ml-3 text-gray-500 font-medium">Chargement…</p></div>
);
const EmptyState = ({ icon: Icon, label }: { icon: any; label: string }) => (
  <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200"><Icon className="w-12 h-12 text-gray-300 mx-auto mb-3"/><p className="text-gray-400 font-medium">{label}</p></div>
);

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
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
  const [prescriptions, setPrescriptions] = useState<AdminPrescription[]>([]);
  const [videoCalls, setVideoCalls]       = useState<AdminVideoCall[]>([]);
  const [earnings, setEarnings]           = useState<DoctorEarning[]>([]);
  const [payments, setPayments]           = useState<DoctorPaymentRecord[]>([]);
  const [loading, setLoading]             = useState(true);
  const [tabLoading, setTabLoading]       = useState(false);

  const [prescFilter, setPrescFilter] = useState('');
  const [videoFilter, setVideoFilter] = useState('');
  const [payFilter, setPayFilter]     = useState('');

  const [showPayModal, setShowPayModal]       = useState(false);
  const [selectedEarning, setSelectedEarning] = useState<DoctorEarning | null>(null);
  const [payLoading, setPayLoading]           = useState(false);
  const [payForm, setPayForm] = useState({ paymentMethod:'mobile_money', amount:'', currency:'XOF', period:'', consultationsCount:'', notes:'', bankName:'', accountNumber:'', iban:'', provider:'', phoneNumber:'', reference:'' });
  const [selectedPresc, setSelectedPresc] = useState<AdminPrescription | null>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => { fetchDashboard(); }, []);
  useEffect(() => {
    if (activeTab === 'prescriptions') fetchPrescriptions();
    if (activeTab === 'videocalls')    fetchVideoCalls();
    if (activeTab === 'payments')      fetchPaymentData();
  }, [activeTab]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [sRes, cRes] = await Promise.all([adminService.getDashboardStats(), calendarService.getAllCalendars()]);
      if (sRes.success) setStats(sRes.data);
      setCalendars(cRes.data || []);
    } catch { showNotification('Erreur chargement données', 'error'); }
    finally { setLoading(false); }
  };
  const fetchPrescriptions = async () => { try { setTabLoading(true); const r = await api.get('/admin/prescriptions?limit=100'); setPrescriptions(r.data.data||[]); } catch { showNotification('Erreur ordonnances','error'); } finally { setTabLoading(false); } };
  const fetchVideoCalls    = async () => { try { setTabLoading(true); const r = await api.get('/admin/video-calls?limit=100');   setVideoCalls(r.data.data||[]);    } catch { showNotification('Erreur appels vidéo','error'); } finally { setTabLoading(false); } };
  const fetchPaymentData   = async () => {
    try {
      setTabLoading(true);
      const [eR, pR] = await Promise.all([api.get('/admin/doctor-earnings'), api.get('/admin/doctor-payments?limit=100')]);
      setEarnings(eR.data.data||[]); setPayments(pR.data.data||[]);
    } catch { showNotification('Erreur paiements','error'); }
    finally { setTabLoading(false); }
  };

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleDeleteCalendar = async (id: string) => {
    if (!window.confirm('Supprimer ce calendrier ?')) return;
    try { await calendarService.deleteCalendar(id); setCalendars(p => p.filter(c => c.id !== id)); showNotification('✅ Calendrier supprimé','success'); }
    catch { showNotification('Erreur suppression','error'); }
  };
  const openPayModal = (e: DoctorEarning) => {
    setSelectedEarning(e);
    setPayForm(f => ({ ...f, amount:e.stats.amountDue.toString(), consultationsCount:e.stats.unpaidConsultations.toString(), period:new Date().toLocaleDateString('fr-FR',{month:'long',year:'numeric'}), phoneNumber:e.doctor.phoneNumber||'' }));
    setShowPayModal(true);
  };
  const submitPayment = async () => {
    if (!selectedEarning || !payForm.amount || parseFloat(payForm.amount)<=0) { showNotification('Montant invalide','error'); return; }
    try {
      setPayLoading(true);
      const details: any = {};
      if (payForm.paymentMethod==='bank_transfer') { details.bankName=payForm.bankName; details.accountNumber=payForm.accountNumber; details.iban=payForm.iban; }
      else if (payForm.paymentMethod==='mobile_money') { details.provider=payForm.provider; details.phoneNumber=payForm.phoneNumber; }
      else { details.reference=payForm.reference; }
      await api.post('/admin/doctor-payments', { doctorId:selectedEarning.doctor.id, amount:parseFloat(payForm.amount), currency:payForm.currency, paymentMethod:payForm.paymentMethod, paymentDetails:details, period:payForm.period, consultationsCount:parseInt(payForm.consultationsCount)||0, notes:payForm.notes });
      showNotification(`✅ Paiement de ${payForm.amount} ${payForm.currency} effectué pour Dr. ${selectedEarning.doctor.lastName}`,'success');
      setShowPayModal(false); await fetchPaymentData();
    } catch (e: any) { showNotification(e?.response?.data?.message||'Erreur paiement','error'); }
    finally { setPayLoading(false); }
  };
  const handleLogout = () => { if (window.confirm('Vous déconnecter ?')) { logout(); navigate('/login'); } };

  // ── Filtres ───────────────────────────────────────────────────────────────
  const fPresc  = prescriptions.filter(p => { const q=prescFilter.toLowerCase(); return !q || `${p.doctor?.firstName} ${p.doctor?.lastName} ${p.patient?.firstName} ${p.patient?.lastName}`.toLowerCase().includes(q); });
  const fVideos = videoCalls.filter(v => { const q=videoFilter.toLowerCase(); return !q || `${v.doctor?.firstName} ${v.doctor?.lastName} ${v.patient?.firstName} ${v.patient?.lastName}`.toLowerCase().includes(q); });
  const fEarn   = earnings.filter(e => { const q=payFilter.toLowerCase(); return !q || `${e.doctor.firstName} ${e.doctor.lastName} ${e.doctor.specialty}`.toLowerCase().includes(q); });

  const pendingPayCount  = earnings.filter(e => e.stats.amountDue > 0).length;
  const unreadPrescCount = prescriptions.filter(p => !p.isRead).length;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Administration</h1>
                <p className="text-sm text-gray-500">Connecté en tant que {user?.firstName} {user?.lastName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={fetchDashboard} title="Actualiser" className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"><RefreshCw className="w-4 h-4 text-gray-600"/></button>
              <div className="relative">
                <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition relative group"><Bell className="w-5 h-5 text-gray-600"/></button>
                {pendingPayCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold animate-pulse">{pendingPayCount}</span>}
              </div>
              <button onClick={handleLogout} className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all hover:shadow-lg hover:scale-105 flex items-center gap-2 shadow-md text-sm font-medium">
                <LogOut className="w-4 h-4"/> Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── TABS ────────────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 overflow-x-auto py-2">
            {([
              { id:'dashboard',     label:'Tableau de bord', icon:BarChart3  },
              { id:'doctors',       label:'Médecins',        icon:UserCheck  },
              { id:'patients',      label:'Patients',        icon:Users      },
              { id:'appointments',  label:'Rendez-vous',     icon:Calendar   },
              { id:'prescriptions', label:'Ordonnances',     icon:Pill,       badge:unreadPrescCount },
              { id:'videocalls',    label:'Appels vidéo',    icon:Video       },
              { id:'payments',      label:'Paiements',       icon:DollarSign, badge:pendingPayCount  },
              { id:'financial',     label:'Finances',        icon:CreditCard  },
              { id:'calendars',     label:'Calendriers',     icon:Calendar    },
            ] as { id:Tab; label:string; icon:any; badge?:number }[]).map(tab => {
              const Icon = tab.icon; const active = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`relative py-2.5 px-4 rounded-lg font-medium text-sm flex items-center gap-2 whitespace-nowrap transition-all ${active ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}>
                  <Icon className="w-4 h-4"/>
                  {tab.label}
                  {tab.badge && tab.badge > 0 ? <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded-full font-bold">{tab.badge}</span> : null}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── CONTENU ─────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ══ DASHBOARD ══ */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {[
                { title:'Utilisateurs totaux', value:stats.users.total, icon:Users, color:'from-blue-500 to-blue-600',
                  details:[ {label:'Médecins',value:stats.users.doctors,icon:UserCheck,color:'text-green-600'}, {label:'Patients',value:stats.users.patients,icon:Users,color:'text-purple-600'}, {label:'Admins',value:stats.users.admins,icon:Settings,color:'text-indigo-600'}, {label:'Actifs',value:stats.users.active,icon:CheckCircle,color:'text-green-600'}, {label:'Inactifs',value:stats.users.inactive,icon:XCircle,color:'text-red-600'} ] },
                { title:'Rendez-vous', value:stats.appointments.total, icon:Calendar, color:'from-orange-500 to-orange-600',
                  details:[ {label:'En attente',value:stats.appointments.pending,icon:Clock,color:'text-yellow-600'}, {label:'Confirmés',value:stats.appointments.confirmed,icon:CheckCircle,color:'text-green-600'}, {label:'Terminés',value:stats.appointments.completed,icon:Activity,color:'text-blue-600'}, {label:'Annulés',value:stats.appointments.cancelled,icon:XCircle,color:'text-red-600'}, {label:"Aujourd'hui",value:stats.appointments.today,icon:Calendar,color:'text-purple-600'} ] },
                { title:'Finances', value:`${stats.financial.totalRevenue} €`, icon:CreditCard, color:'from-green-500 to-green-600',
                  details:[ {label:'Commission',value:`${stats.financial.totalCommission} €`,icon:TrendingUp,color:'text-purple-600'}, {label:'En attente',value:`${stats.financial.pendingPayments} €`,icon:Clock,color:'text-yellow-600'}, {label:'Encaissé',value:`${stats.financial.completedPayments} €`,icon:CheckCircle,color:'text-green-600'} ] },
                { title:'Calendriers', value:calendars.length, icon:Calendar, color:'from-purple-500 to-purple-600',
                  details:[ {label:'Confirmés',value:calendars.filter(c=>c.confirmed).length,icon:CheckCircle,color:'text-green-600'}, {label:'En attente',value:calendars.filter(c=>!c.confirmed).length,icon:Clock,color:'text-yellow-600'} ] },
              ].map((stat,i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 group">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg group-hover:scale-110 transition-transform`}><Icon className="w-6 h-6 text-white"/></div>
                        <span className="text-3xl font-bold text-gray-900">{stat.value}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">{stat.title}</h3>
                      <div className="space-y-2">
                        {stat.details.map((d,j) => { const DI=d.icon; return (
                          <div key={j} className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-gray-50 transition">
                            <span className="text-gray-600 flex items-center gap-2"><DI className={`w-4 h-4 ${d.color}`}/>{d.label}</span>
                            <span className="font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded-md">{d.value}</span>
                          </div>
                        ); })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Activités + Calendriers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-3"><Activity className="w-5 h-5 text-blue-600"/> Activité récente</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {stats.recentActivities.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200"><Activity className="w-16 h-16 text-gray-300 mx-auto mb-3"/><p className="text-gray-500 font-medium">Aucune activité récente</p></div>
                  ) : stats.recentActivities.map(a => { const {date,time}=fmtDateTime(a.timestamp); return (
                    <div key={a.id} className="flex items-start gap-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100 hover:shadow-md hover:border-blue-200 transition">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm shrink-0"><Activity className="w-5 h-5 text-white"/></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{a.description}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{date}</span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{time}</span>
                          <StatusBadge status={a.status||'completed'}/>
                        </div>
                      </div>
                    </div>
                  ); })}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-3"><Calendar className="w-5 h-5 text-purple-600"/> Derniers calendriers</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {calendars.slice(0,5).map(cal => (
                    <div key={cal.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100 hover:shadow-md hover:border-purple-200 transition">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1"><Calendar className="w-4 h-4 text-purple-500"/><p className="font-semibold text-gray-900">{fmtDate(cal.date)}</p></div>
                        <p className="text-sm text-gray-600 ml-6">Dr. {cal.doctor?.firstName} {cal.doctor?.lastName}</p>
                        <div className="flex flex-wrap gap-1 mt-2 ml-6">
                          {cal.slots.slice(0,3).map((s,i) => <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">{s}</span>)}
                          {cal.slots.length>3 && <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs">+{cal.slots.length-3}</span>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 ml-3">
                        <StatusBadge status={cal.confirmed?'completed':'pending'}/>
                        <button onClick={() => handleDeleteCalendar(cal.id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition border border-red-200"><Trash className="w-3.5 h-3.5"/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 3 cards statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-blue-600"/> Répartition</h3>
                <div className="space-y-4">
                  {[{l:'Médecins',v:stats.users.doctors,c:'from-green-500 to-green-600'},{l:'Patients',v:stats.users.patients,c:'from-blue-500 to-blue-600'},{l:'Admins',v:stats.users.admins,c:'from-purple-500 to-purple-600'}].map(({l,v,c}) => (
                    <div key={l} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between text-sm mb-2"><span className="font-medium text-gray-700">{l}</span><span className="font-bold text-gray-900 bg-white px-2 py-1 rounded-md shadow-sm">{v}</span></div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden"><div className={`bg-gradient-to-r ${c} h-2.5 rounded-full transition-all duration-500`} style={{width:`${stats.users.total?(v/stats.users.total)*100:0}%`}}/></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-orange-600"/> Statut RDV</h3>
                <div className="space-y-3">
                  {[{l:'En attente',v:stats.appointments.pending,dot:'bg-yellow-500 animate-pulse'},{l:'Confirmés',v:stats.appointments.confirmed,dot:'bg-green-500'},{l:'Terminés',v:stats.appointments.completed,dot:'bg-blue-500'},{l:'Annulés',v:stats.appointments.cancelled,dot:'bg-red-500'}].map(({l,v,dot}) => (
                    <div key={l} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <span className="text-gray-700 flex items-center gap-2"><span className={`w-3 h-3 ${dot} rounded-full`}/>{l}</span>
                      <span className="font-bold text-gray-900 bg-white px-3 py-1 rounded-md shadow-sm">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><DollarSign className="w-5 h-5 text-green-600"/> Finances</h3>
                <div className="space-y-3">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200"><p className="text-sm text-gray-600 mb-1">Revenus totaux</p><p className="text-3xl font-bold text-green-600">{stats.financial.totalRevenue} €</p></div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200"><p className="text-sm text-gray-600 mb-1">Commission (10%)</p><p className="text-2xl font-bold text-purple-600">{stats.financial.totalCommission} €</p></div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg"><span className="text-sm text-gray-600">En attente</span><span className="font-semibold text-yellow-600 bg-yellow-50 px-3 py-1 rounded-md border border-yellow-200">{stats.financial.pendingPayments} €</span></div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg"><span className="text-sm text-gray-600">Encaissé</span><span className="font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-md border border-green-200">{stats.financial.completedPayments} €</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ MÉDECINS ══ */}
        {activeTab === 'doctors' && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6"><div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-md"><Users className="w-6 h-6 text-white"/></div><h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Gestion des médecins</h2></div>
            <UserManagement userType="doctor"/>
          </div>
        )}

        {/* ══ PATIENTS ══ */}
        {activeTab === 'patients' && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6"><div className="p-3 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl shadow-md"><Users className="w-6 h-6 text-white"/></div><h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">Gestion des patients</h2></div>
            <UserManagement userType="patient"/>
          </div>
        )}

        {/* ══ RENDEZ-VOUS ══ */}
        {activeTab === 'appointments' && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Gestion des rendez-vous</h2>
            <p className="text-gray-500">En cours de développement…</p>
          </div>
        )}

        {/* ══ ORDONNANCES ══ */}
        {activeTab === 'prescriptions' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-md"><Pill className="w-5 h-5 text-white"/></div>
                <div><h2 className="text-xl font-bold text-gray-900">Toutes les ordonnances</h2><p className="text-sm text-gray-500">{prescriptions.length} ordonnance(s)</p></div>
              </div>
              <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/><input type="text" placeholder="Rechercher médecin / patient…" value={prescFilter} onChange={e=>setPrescFilter(e.target.value)} className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 w-72"/></div>
            </div>

            {/* Mini stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[{l:'Total',v:prescriptions.length,c:'from-gray-400 to-gray-500'},{l:'Actives',v:prescriptions.filter(p=>p.status==='active').length,c:'from-green-500 to-emerald-600'},{l:'Non lues',v:prescriptions.filter(p=>!p.isRead).length,c:'from-orange-500 to-red-500'},{l:'Terminées',v:prescriptions.filter(p=>p.status==='completed').length,c:'from-blue-500 to-indigo-600'}].map(({l,v,c}) => (
                <div key={l} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 bg-gradient-to-br ${c} rounded-lg flex items-center justify-center shadow-md`}><FileText className="w-5 h-5 text-white"/></div>
                  <div><p className="text-xs text-gray-500">{l}</p><p className="text-2xl font-bold text-gray-900">{v}</p></div>
                </div>
              ))}
            </div>

            {tabLoading ? <LoadingSpinner/> : fPresc.length===0 ? <EmptyState icon={Pill} label="Aucune ordonnance trouvée"/> : (
              <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>{['Date','Médecin','Patient','Médicaments','Statut','Lu','Voir'].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {fPresc.map(p => (
                      <tr key={p.id} className={`hover:bg-gray-50 transition ${!p.isRead?'bg-orange-50/30':''}`}>
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{fmtDate(p.createdAt)}</td>
                        <td className="px-4 py-3"><p className="text-sm font-medium text-gray-900">Dr. {p.doctor?.firstName} {p.doctor?.lastName}</p><p className="text-xs text-gray-500">{p.doctor?.specialty}</p></td>
                        <td className="px-4 py-3"><p className="text-sm font-medium text-gray-900">{p.patient?.firstName} {p.patient?.lastName}</p><p className="text-xs text-gray-500">{p.patient?.email}</p></td>
                        <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{p.medications.slice(0,2).map((m,i)=><span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs">💊 {m.medication}</span>)}{p.medications.length>2&&<span className="text-xs text-gray-400">+{p.medications.length-2}</span>}</div></td>
                        <td className="px-4 py-3"><StatusBadge status={p.status}/></td>
                        <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${p.isRead?'bg-green-50 text-green-600 border border-green-200':'bg-orange-50 text-orange-600 border border-orange-200 font-bold'}`}>{p.isRead?'✓ Lu':'● Non lu'}</span></td>
                        <td className="px-4 py-3"><button onClick={()=>setSelectedPresc(p)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition border border-blue-200" title="Voir détails"><Eye className="w-4 h-4"/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══ APPELS VIDÉO ══ */}
        {activeTab === 'videocalls' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-md"><Video className="w-5 h-5 text-white"/></div>
                <div><h2 className="text-xl font-bold text-gray-900">Tous les appels vidéo</h2><p className="text-sm text-gray-500">{videoCalls.length} appel(s)</p></div>
              </div>
              <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/><input type="text" placeholder="Rechercher médecin / patient…" value={videoFilter} onChange={e=>setVideoFilter(e.target.value)} className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 w-72"/></div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[{l:'Total',v:videoCalls.length,c:'from-gray-400 to-gray-500'},{l:'Terminés',v:videoCalls.filter(v=>v.status==='completed').length,c:'from-green-500 to-emerald-600'},{l:'Planifiés',v:videoCalls.filter(v=>v.status==='scheduled').length,c:'from-blue-500 to-indigo-600'},{l:'Manqués',v:videoCalls.filter(v=>v.status==='missed').length,c:'from-red-500 to-rose-600'}].map(({l,v,c}) => (
                <div key={l} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 bg-gradient-to-br ${c} rounded-lg flex items-center justify-center shadow-md`}><Video className="w-5 h-5 text-white"/></div>
                  <div><p className="text-xs text-gray-500">{l}</p><p className="text-2xl font-bold text-gray-900">{v}</p></div>
                </div>
              ))}
            </div>

            {tabLoading ? <LoadingSpinner/> : fVideos.length===0 ? <EmptyState icon={Video} label="Aucun appel vidéo trouvé"/> : (
              <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200"><tr>{['Date','Médecin','Patient','Durée','Statut','Lien'].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {fVideos.map(v => { const {date,time}=fmtDateTime(v.createdAt); return (
                      <tr key={v.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 whitespace-nowrap"><p className="text-sm font-medium text-gray-900">{date}</p><p className="text-xs text-gray-500">{time}</p></td>
                        <td className="px-4 py-3"><p className="text-sm font-medium text-gray-900">Dr. {v.doctor?.firstName} {v.doctor?.lastName}</p><p className="text-xs text-gray-500">{v.doctor?.specialty}</p></td>
                        <td className="px-4 py-3"><p className="text-sm font-medium text-gray-900">{v.patient?.firstName} {v.patient?.lastName}</p><p className="text-xs text-gray-500">{v.patient?.phoneNumber}</p></td>
                        <td className="px-4 py-3"><span className="text-sm text-gray-700">{v.durationMinutes?`${v.durationMinutes} min`:'—'}</span></td>
                        <td className="px-4 py-3"><StatusBadge status={v.status}/></td>
                        <td className="px-4 py-3"><a href={v.roomLink} target="_blank" rel="noreferrer" className="px-2.5 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-xs font-medium hover:bg-blue-100 transition">Rejoindre</a></td>
                      </tr>
                    ); })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══ PAIEMENTS ══ */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-md"><DollarSign className="w-5 h-5 text-white"/></div>
              <div><h2 className="text-xl font-bold text-gray-900">Paiements des médecins</h2><p className="text-sm text-gray-500">Gérez les versements et suivez les soldes</p></div>
            </div>

            {tabLoading ? <LoadingSpinner/> : (
              <>
                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl border border-red-200 shadow-md p-5">
                    <p className="text-sm text-gray-500 mb-1 flex items-center gap-1"><AlertCircle className="w-4 h-4 text-red-500"/> Total dû aux médecins</p>
                    <p className="text-3xl font-bold text-red-600">{earnings.reduce((s,e)=>s+e.stats.amountDue,0).toFixed(0)} XOF</p>
                    <p className="text-xs text-gray-400 mt-1">{pendingPayCount} médecin(s) en attente</p>
                  </div>
                  <div className="bg-white rounded-xl border border-green-200 shadow-md p-5">
                    <p className="text-sm text-gray-500 mb-1 flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-500"/> Total déjà versé</p>
                    <p className="text-3xl font-bold text-green-600">{earnings.reduce((s,e)=>s+e.stats.totalPaid,0).toFixed(0)} XOF</p>
                    <p className="text-xs text-gray-400 mt-1">{payments.length} paiement(s) effectué(s)</p>
                  </div>
                  <div className="bg-white rounded-xl border border-blue-200 shadow-md p-5">
                    <p className="text-sm text-gray-500 mb-1 flex items-center gap-1"><Activity className="w-4 h-4 text-blue-500"/> Total consultations</p>
                    <p className="text-3xl font-bold text-blue-600">{earnings.reduce((s,e)=>s+e.stats.completedConsultations,0)}</p>
                    <p className="text-xs text-gray-400 mt-1">Parmi tous les médecins</p>
                  </div>
                </div>

                {/* Filtre + liste médecins */}
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Revenus par médecin</h3>
                  <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/><input type="text" placeholder="Filtrer par médecin / spécialité…" value={payFilter} onChange={e=>setPayFilter(e.target.value)} className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300 w-72"/></div>
                </div>

                <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                  {fEarn.length===0 ? <EmptyState icon={Users} label="Aucun médecin enregistré"/> : (
                    <div className="divide-y divide-gray-100">
                      {fEarn.map(e => (
                        <div key={e.doctor.id} className="p-5 hover:bg-gray-50 transition">
                          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            {/* Identité */}
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md shrink-0">{e.doctor.firstName[0]}{e.doctor.lastName[0]}</div>
                              <div>
                                <p className="font-semibold text-gray-900">Dr. {e.doctor.firstName} {e.doctor.lastName}</p>
                                <p className="text-sm text-gray-500">{e.doctor.specialty}</p>
                                <p className="text-xs text-gray-400">{e.doctor.email}</p>
                              </div>
                            </div>
                            {/* Chiffres */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div className="text-center p-2 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Consultations</p><p className="font-bold text-gray-900 text-lg">{e.stats.completedConsultations}</p><p className="text-xs text-gray-400">{e.stats.paidConsultations} payées</p></div>
                              <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-200"><p className="text-xs text-blue-500">Part médecin (90%)</p><p className="font-bold text-blue-600 text-lg">{e.stats.doctorShare}</p><p className="text-xs text-blue-400">XOF</p></div>
                              <div className="text-center p-2 bg-green-50 rounded-lg border border-green-200"><p className="text-xs text-green-500">Déjà versé</p><p className="font-bold text-green-600 text-lg">{e.stats.totalPaid}</p><p className="text-xs text-green-400">XOF</p></div>
                              <div className={`text-center p-2 rounded-lg border ${e.stats.amountDue>0?'bg-red-50 border-red-200':'bg-gray-50 border-gray-200'}`}>
                                <p className={`text-xs ${e.stats.amountDue>0?'text-red-500':'text-gray-500'}`}>Restant dû</p>
                                <p className={`font-bold text-xl ${e.stats.amountDue>0?'text-red-600':'text-gray-400'}`}>{e.stats.amountDue}</p>
                                <p className={`text-xs ${e.stats.amountDue>0?'text-red-400':'text-gray-400'}`}>XOF</p>
                              </div>
                            </div>
                            {/* Bouton */}
                            <button onClick={()=>openPayModal(e)} disabled={e.stats.amountDue<=0}
                              className={`px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shrink-0 ${e.stats.amountDue>0?'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:scale-105 shadow-md':'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                              <Send className="w-4 h-4"/>{e.stats.amountDue>0?'Payer maintenant':'✓ À jour'}
                            </button>
                          </div>
                          {e.paymentHistory.length>0 && (
                            <div className="mt-3 ml-16 flex flex-wrap gap-2">
                              {e.paymentHistory.slice(0,3).map((p:any,i:number)=><span key={i} className="px-2.5 py-1 bg-green-50 border border-green-200 text-green-700 rounded-full text-xs">✓ {p.amount} {p.currency||'XOF'} — {p.period||fmtDate(p.processedAt)}</span>)}
                              {e.paymentHistory.length>3 && <span className="px-2.5 py-1 bg-gray-50 border border-gray-200 text-gray-500 rounded-full text-xs">+{e.paymentHistory.length-3} autre(s)</span>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Historique des paiements */}
                {payments.length>0 && (
                  <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2"><Receipt className="w-5 h-5 text-gray-600"/><h3 className="font-semibold text-gray-900">Historique de tous les paiements</h3></div>
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200"><tr>{['Date','Médecin','Montant','Méthode','Période','Statut'].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
                      <tbody className="divide-y divide-gray-100">
                        {payments.map(p => { const method=PAYMENT_METHODS.find(m=>m.value===p.paymentMethod); const MI=method?.icon||Banknote; return (
                          <tr key={p.id} className="hover:bg-gray-50 transition">
                            <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{fmtDate(p.createdAt)}</td>
                            <td className="px-4 py-3"><p className="text-sm font-medium text-gray-900">Dr. {p.doctor?.firstName} {p.doctor?.lastName}</p><p className="text-xs text-gray-500">{p.doctor?.specialty}</p></td>
                            <td className="px-4 py-3"><p className="text-sm font-bold text-green-600">{p.amount} {p.currency}</p><p className="text-xs text-gray-400">{p.consultationsCount} consultations</p></td>
                            <td className="px-4 py-3"><span className={`flex items-center gap-1.5 text-sm ${method?.color||'text-gray-600'}`}><MI className="w-4 h-4"/>{method?.label||p.paymentMethod}</span></td>
                            <td className="px-4 py-3 text-sm text-gray-600">{p.period||'—'}</td>
                            <td className="px-4 py-3"><StatusBadge status={p.status}/></td>
                          </tr>
                        ); })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ══ FINANCES ══ */}
        {activeTab === 'financial' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-600"/> Revenus globaux</h3>
              <div className="space-y-3">
                {[{l:'Revenus totaux',v:`${stats.financial.totalRevenue} €`,c:'text-green-600',bg:'bg-green-50 border-green-200',big:true},{l:'Commission plateforme (10%)',v:`${stats.financial.totalCommission} €`,c:'text-purple-600',bg:'bg-purple-50 border-purple-200'},{l:'Paiements en attente',v:`${stats.financial.pendingPayments} €`,c:'text-yellow-600',bg:'bg-yellow-50 border-yellow-200'},{l:'Paiements complétés',v:`${stats.financial.completedPayments} €`,c:'text-blue-600',bg:'bg-blue-50 border-blue-200'}].map(({l,v,c,bg,big})=>(
                  <div key={l} className={`flex justify-between items-center p-4 rounded-xl border ${bg}`}><span className="text-gray-600 text-sm">{l}</span><span className={`font-bold ${big?'text-2xl':'text-lg'} ${c}`}>{v}</span></div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-600"/> Rendez-vous</h3>
              <div className="space-y-3">
                {[{l:'Total rendez-vous',v:stats.appointments.total,c:'text-gray-900',bg:'bg-gray-50 border-gray-200',big:true},{l:'Ce mois',v:stats.appointments.thisMonth||0,c:'text-blue-600',bg:'bg-blue-50 border-blue-200'},{l:'Cette semaine',v:stats.appointments.thisWeek||0,c:'text-indigo-600',bg:'bg-indigo-50 border-indigo-200'},{l:'Annulés',v:stats.appointments.cancelled,c:'text-red-500',bg:'bg-red-50 border-red-200'}].map(({l,v,c,bg,big})=>(
                  <div key={l} className={`flex justify-between items-center p-4 rounded-xl border ${bg}`}><span className="text-gray-600 text-sm">{l}</span><span className={`font-bold ${big?'text-2xl':'text-lg'} ${c}`}>{v}</span></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ CALENDRIERS ══ */}
        {activeTab === 'calendars' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Gestion des calendriers ({calendars.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {calendars.map(cal => (
                <div key={cal.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-xl transition-all hover:-translate-y-1 bg-gradient-to-br from-white to-gray-50">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-md"><Calendar className="w-5 h-5 text-white"/></div>
                      <div><p className="font-bold text-gray-900 text-lg">{fmtDate(cal.date)}</p><p className="text-sm text-gray-600 flex items-center gap-1 mt-1"><Award className="w-4 h-4 text-purple-500"/> Dr. {cal.doctor?.firstName} {cal.doctor?.lastName}</p></div>
                    </div>
                    <StatusBadge status={cal.confirmed?'completed':'pending'}/>
                  </div>
                  <div className="mt-4"><p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1"><Clock className="w-4 h-4 text-blue-500"/> Créneaux ({cal.slots.length})</p>
                    <div className="flex flex-wrap gap-2">{cal.slots.map((s,i)=><span key={i} className="px-3 py-1.5 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-200 shadow-sm hover:shadow-md transition">{s}</span>)}</div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                    <button onClick={()=>handleDeleteCalendar(cal.id)} className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all hover:shadow-lg hover:scale-105 flex items-center gap-2 text-sm shadow-md">
                      <Trash className="w-4 h-4"/> Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ══════ MODAL PAIEMENT ══════ */}
      {showPayModal && selectedEarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <div><h2 className="text-xl font-bold text-gray-900">Payer Dr. {selectedEarning.doctor.firstName} {selectedEarning.doctor.lastName}</h2><p className="text-sm text-gray-500 mt-0.5">{selectedEarning.doctor.specialty}</p></div>
              <button onClick={()=>setShowPayModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition"><X className="w-5 h-5 text-gray-500"/></button>
            </div>
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">

              {/* Résumé */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                {[{l:'Consultations non payées',v:selectedEarning.stats.unpaidConsultations,c:'text-gray-900'},{l:'Montant suggéré (XOF)',v:selectedEarning.stats.amountDue,c:'text-green-600'},{l:'Part médecin',v:'90%',c:'text-blue-600'}].map(({l,v,c})=>(
                  <div key={l} className="text-center"><p className="text-xs text-gray-500 mb-1">{l}</p><p className={`text-2xl font-bold ${c}`}>{v}</p></div>
                ))}
              </div>

              {/* Montant + devise */}
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Montant *</label><input type="number" value={payForm.amount} onChange={e=>setPayForm(f=>({...f,amount:e.target.value}))} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="0"/></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Devise</label><select value={payForm.currency} onChange={e=>setPayForm(f=>({...f,currency:e.target.value}))} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white">{['XOF','EUR','USD','GHS','XAF'].map(c=><option key={c} value={c}>{c}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Période</label><input type="text" value={payForm.period} onChange={e=>setPayForm(f=>({...f,period:e.target.value}))} placeholder="ex: Mars 2026" className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"/></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Nb consultations</label><input type="number" value={payForm.consultationsCount} onChange={e=>setPayForm(f=>({...f,consultationsCount:e.target.value}))} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"/></div>
              </div>

              {/* Méthode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Méthode de paiement *</label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map(m => { const Icon=m.icon; const active=payForm.paymentMethod===m.value; return (
                    <button key={m.value} onClick={()=>setPayForm(f=>({...f,paymentMethod:m.value}))} className={`p-3 border-2 rounded-xl flex items-center gap-2 transition-all text-sm font-medium ${active?'border-green-500 bg-green-50 text-green-700':'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      <Icon className={`w-5 h-5 ${active?'text-green-600':m.color}`}/>{m.label}
                    </button>
                  ); })}
                </div>
              </div>

              {/* Détails méthode */}
              {payForm.paymentMethod==='bank_transfer' && (
                <div className="space-y-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-sm font-semibold text-blue-700 flex items-center gap-2"><Building2 className="w-4 h-4"/> Détails virement bancaire</p>
                  {[{pl:'Nom de la banque',k:'bankName'},{pl:'Numéro de compte',k:'accountNumber'},{pl:'IBAN (optionnel)',k:'iban'}].map(({pl,k})=>(
                    <input key={k} placeholder={pl} value={(payForm as any)[k]} onChange={e=>setPayForm(f=>({...f,[k]:e.target.value}))} className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"/>
                  ))}
                </div>
              )}
              {payForm.paymentMethod==='mobile_money' && (
                <div className="space-y-3 p-4 bg-green-50 rounded-xl border border-green-200">
                  <p className="text-sm font-semibold text-green-700 flex items-center gap-2"><Smartphone className="w-4 h-4"/> Détails Mobile Money</p>
                  <select value={payForm.provider} onChange={e=>setPayForm(f=>({...f,provider:e.target.value}))} className="w-full px-3 py-2 border border-green-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white">
                    <option value="">Choisir un opérateur</option>
                    {MOBILE_OPERATORS.map(op=><option key={op} value={op}>{op}</option>)}
                  </select>
                  <input placeholder="Numéro de téléphone" value={payForm.phoneNumber} onChange={e=>setPayForm(f=>({...f,phoneNumber:e.target.value}))} className="w-full px-3 py-2 border border-green-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"/>
                </div>
              )}
              {(payForm.paymentMethod==='cash'||payForm.paymentMethod==='check') && (
                <div className="space-y-3 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                  <p className="text-sm font-semibold text-yellow-700 flex items-center gap-2"><Banknote className="w-4 h-4"/> Référence</p>
                  <input placeholder="Numéro de référence / reçu" value={payForm.reference} onChange={e=>setPayForm(f=>({...f,reference:e.target.value}))} className="w-full px-3 py-2 border border-yellow-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"/>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (optionnel)</label>
                <textarea rows={2} value={payForm.notes} onChange={e=>setPayForm(f=>({...f,notes:e.target.value}))} placeholder="Observations, justificatifs…" className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"/>
              </div>

              {/* Boutons */}
              <div className="flex gap-3 pt-2">
                <button onClick={()=>setShowPayModal(false)} className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition text-sm">Annuler</button>
                <button onClick={submitPayment} disabled={payLoading} className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm">
                  {payLoading?<Loader2 className="w-5 h-5 animate-spin"/>:<><Send className="w-4 h-4"/> Confirmer le paiement</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════ MODAL DÉTAIL PRESCRIPTION ══════ */}
      {selectedPresc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={()=>setSelectedPresc(null)}>
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50">
              <div><h2 className="text-xl font-bold text-gray-900">Détail de l'ordonnance</h2><p className="text-sm text-gray-500">Émise le {fmtDate(selectedPresc.createdAt)}</p></div>
              <button onClick={()=>setSelectedPresc(null)} className="p-2 hover:bg-gray-100 rounded-xl transition"><X className="w-5 h-5 text-gray-500"/></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200"><p className="text-xs text-blue-500 font-semibold mb-1 uppercase tracking-wider">Médecin</p><p className="font-semibold text-gray-900">Dr. {selectedPresc.doctor?.firstName} {selectedPresc.doctor?.lastName}</p><p className="text-sm text-gray-500">{selectedPresc.doctor?.specialty}</p><p className="text-xs text-gray-400">{selectedPresc.doctor?.email}</p></div>
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200"><p className="text-xs text-purple-500 font-semibold mb-1 uppercase tracking-wider">Patient</p><p className="font-semibold text-gray-900">{selectedPresc.patient?.firstName} {selectedPresc.patient?.lastName}</p><p className="text-sm text-gray-500">{selectedPresc.patient?.email}</p><p className="text-xs text-gray-400">{selectedPresc.patient?.phoneNumber}</p></div>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Médicaments prescrits</p>
                {selectedPresc.medications.map((m,i) => (
                  <div key={i} className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <p className="font-semibold text-gray-900">💊 {m.medication}</p>
                    <div className="grid grid-cols-3 gap-2 mt-1.5">
                      <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded-lg border border-gray-200">📏 {m.dosage}</span>
                      <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded-lg border border-gray-200">⏰ {m.frequency}</span>
                      <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded-lg border border-gray-200">📅 {m.duration}</span>
                    </div>
                    {m.instructions && <p className="text-xs text-gray-500 mt-1.5 italic">→ {m.instructions}</p>}
                  </div>
                ))}
              </div>
              {selectedPresc.notes && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl"><p className="text-xs text-yellow-600 font-semibold mb-1 uppercase tracking-wider">Recommandations</p><p className="text-sm text-gray-700">{selectedPresc.notes}</p></div>
              )}
              <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-gray-100">
                <StatusBadge status={selectedPresc.status}/>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${selectedPresc.isRead?'bg-green-50 text-green-700 border-green-200':'bg-orange-50 text-orange-600 border-orange-200 font-bold'}`}>{selectedPresc.isRead?'✓ Lu par le patient':'● Non lu'}</span>
                {selectedPresc.validUntil && <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">Valide jusqu'au {fmtDate(selectedPresc.validUntil)}</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
