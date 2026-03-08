// src/pages/PatientMedicalFilePage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  medicalFileService,
  MedicalFile,
  Prescription,
  VideoCall,
  Medication,
  Allergy,
  MedicalCondition
} from '../services/medicalFileService';
import {
  FileText, Calendar, Clock, User, Pill, AlertCircle, Heart,
  ArrowLeft, X, ChevronRight, Loader2, Video, CheckCircle2,
  AlertTriangle, Info, Eye, Stethoscope
} from 'lucide-react';

// ─── Types d'onglets ──────────────────────────────────────────────────────────
type Tab = 'records' | 'prescriptions' | 'videocalls' | 'medications' | 'allergies' | 'conditions';

const PatientMedicalFilePage: React.FC = () => {
  const { user }             = useAuth();
  const navigate             = useNavigate();
  const { showNotification } = useNotification();

  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState<Tab>('records');

  const [medicalRecords, setMedicalRecords]   = useState<MedicalFile[]>([]);
  const [prescriptions, setPrescriptions]     = useState<Prescription[]>([]);
  const [videoCalls, setVideoCalls]           = useState<VideoCall[]>([]);
  const [medications, setMedications]         = useState<Medication[]>([]);
  const [allergies, setAllergies]             = useState<Allergy[]>([]);
  const [conditions, setConditions]           = useState<MedicalCondition[]>([]);

  const [selectedRecord, setSelectedRecord]         = useState<MedicalFile | null>(null);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [showModal, setShowModal]                   = useState(false);
  const [showPrescModal, setShowPrescModal]         = useState(false);

  // ── Chargement ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (user?.id) fetchAll();
  }, [user?.id]);

  const fetchAll = async () => {
    try {
      setLoading(true);

      const [recordsRes, prescs, calls, meds, alls, conds] = await Promise.all([
        medicalFileService.getPatientMedicalFiles(user!.id),
        medicalFileService.getPatientPrescriptions(user!.id),
        medicalFileService.getPatientVideoCalls(user!.id),
        medicalFileService.getMedications(user!.id),
        medicalFileService.getAllergies(user!.id),
        medicalFileService.getMedicalConditions(user!.id)
      ]);

      if (recordsRes.success) setMedicalRecords(recordsRes.data);
      setPrescriptions(prescs);
      setVideoCalls(calls);
      setMedications(meds);
      setAllergies(alls);
      setConditions(conds);
    } catch (error) {
      console.error('❌ Erreur chargement dossier médical:', error);
      showNotification('Erreur lors du chargement des données', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const fmtDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return 'Date invalide'; }
  };

  const fmtDateTime = (d: string) => {
    try {
      const dt = new Date(d);
      return {
        date: dt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        time: dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      };
    } catch { return { date: '—', time: '—' }; }
  };

  const recordTypeLabel: Record<string, string> = {
    consultation: 'Consultation', lab_result: "Résultat d'analyse",
    prescription: 'Prescription', vaccination: 'Vaccination',
    allergy: 'Allergie', surgery: 'Chirurgie',
    hospitalization: 'Hospitalisation', chronic_disease: 'Maladie chronique',
    family_history: 'Antécédent familial'
  };

  const statusConfig: Record<string, { bg: string; text: string; border: string; label: string }> = {
    active:    { bg: 'bg-green-500/20',  text: 'text-green-300',  border: 'border-green-500/30',  label: 'Actif'      },
    completed: { bg: 'bg-blue-500/20',   text: 'text-blue-300',   border: 'border-blue-500/30',   label: 'Terminé'    },
    cancelled: { bg: 'bg-red-500/20',    text: 'text-red-300',    border: 'border-red-500/30',    label: 'Annulé'     },
    scheduled: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', border: 'border-yellow-500/30', label: 'Planifié'   },
    ongoing:   { bg: 'bg-cyan-500/20',   text: 'text-cyan-300',   border: 'border-cyan-500/30',   label: 'En cours'   },
    missed:    { bg: 'bg-gray-500/20',   text: 'text-gray-300',   border: 'border-gray-500/30',   label: 'Manqué'     },
    resolved:  { bg: 'bg-green-500/20',  text: 'text-green-300',  border: 'border-green-500/30',  label: 'Résolu'     },
    stopped:   { bg: 'bg-gray-500/20',   text: 'text-gray-300',   border: 'border-gray-500/30',   label: 'Arrêté'     },
    mild:      { bg: 'bg-yellow-500/20', text: 'text-yellow-300', border: 'border-yellow-500/30', label: 'Léger'      },
    moderate:  { bg: 'bg-orange-500/20', text: 'text-orange-300', border: 'border-orange-500/30', label: 'Modéré'     },
    severe:    { bg: 'bg-red-500/20',    text: 'text-red-300',    border: 'border-red-500/30',    label: 'Sévère'     },
  };

  const Badge = ({ status }: { status: string }) => {
    const c = statusConfig[status] || statusConfig.active;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text} border ${c.border}`}>
        {c.label}
      </span>
    );
  };

  // Nombre de prescriptions non lues
  const unreadPrescriptions = prescriptions.filter(p => !p.isRead).length;

  // ── Onglets ─────────────────────────────────────────────────────────────────
  const tabs: { id: Tab; label: string; icon: any; count: number; badge?: number }[] = [
    { id: 'records',       label: 'Dossiers',      icon: FileText,     count: medicalRecords.length },
    { id: 'prescriptions', label: 'Ordonnances',   icon: Pill,         count: prescriptions.length, badge: unreadPrescriptions },
    { id: 'videocalls',    label: 'Appels vidéo',  icon: Video,        count: videoCalls.length },
    { id: 'medications',   label: 'Traitements',   icon: Stethoscope,  count: medications.length },
    { id: 'allergies',     label: 'Allergies',     icon: AlertCircle,  count: allergies.length },
    { id: 'conditions',    label: 'Conditions',    icon: Heart,        count: conditions.length },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="glass-nav sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="mr-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-black text-white">Dossier Médical</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Onglets ─────────────────────────────────────────────────────────── */}
      <div className="border-b border-white/10 bg-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-6 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap transition relative ${
                    activeTab === tab.id
                      ? 'border-blue-400 text-blue-400'
                      : 'border-transparent text-white/60 hover:text-white/80'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="ml-1 px-2 py-0.5 bg-white/10 rounded-full text-xs">{tab.count}</span>
                  )}
                  {/* Badge notification non lu */}
                  {tab.badge && tab.badge > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── Contenu ─────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-white/60">Chargement de votre dossier médical...</p>
          </div>
        ) : (
          <>

            {/* ════════════════ DOSSIERS MÉDICAUX ════════════════ */}
            {activeTab === 'records' && (
              <div className="space-y-4">
                {medicalRecords.length === 0 ? (
                  <Empty icon={FileText} label="Aucun dossier médical" />
                ) : (
                  medicalRecords.map(record => {
                    const { date, time } = fmtDateTime(record.consultationDate);
                    return (
                      <div
                        key={record.id}
                        onClick={() => { setSelectedRecord(record); setShowModal(true); }}
                        className="futuristic-card p-6 hover:border-white/30 transition cursor-pointer group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className={`p-2 rounded-lg ${record.isCritical ? 'bg-red-500/20' : 'bg-blue-500/20'}`}>
                                <FileText className={`w-5 h-5 ${record.isCritical ? 'text-red-400' : 'text-blue-400'}`} />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-white">{record.title}</h3>
                                <p className="text-sm text-blue-400">{recordTypeLabel[record.recordType] || record.recordType}</p>
                              </div>
                              {record.isCritical && (
                                <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded-full text-xs font-semibold border border-red-500/30">Critique</span>
                              )}
                            </div>
                            {record.description && (
                              <p className="text-white/70 mb-3 text-sm line-clamp-2">{record.description}</p>
                            )}
                            <div className="flex flex-wrap gap-4 text-sm text-white/50">
                              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{date}</span>
                              <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{time}</span>
                              {record.doctor && (
                                <span className="flex items-center gap-1"><User className="w-4 h-4" />Dr. {record.doctor.firstName} {record.doctor.lastName}</span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white/70 transition" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ════════════════ ORDONNANCES ════════════════ */}
            {activeTab === 'prescriptions' && (
              <div className="space-y-4">
                {prescriptions.length === 0 ? (
                  <Empty icon={Pill} label="Aucune ordonnance reçue" />
                ) : (
                  prescriptions.map(presc => (
                    <div
                      key={presc.id}
                      onClick={() => { setSelectedPrescription(presc); setShowPrescModal(true); }}
                      className={`futuristic-card p-6 hover:border-white/30 transition cursor-pointer group ${!presc.isRead ? 'border-emerald-500/40 bg-emerald-500/5' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-emerald-500/20 rounded-lg">
                              <Pill className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold text-white">
                                  Ordonnance du {fmtDate(presc.createdAt)}
                                </h3>
                                {!presc.isRead && (
                                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs rounded-full border border-emerald-500/30 font-semibold">Nouveau</span>
                                )}
                              </div>
                              {presc.doctor && (
                                <p className="text-sm text-emerald-400">Dr. {presc.doctor.firstName} {presc.doctor.lastName} · {presc.doctor.specialty}</p>
                              )}
                            </div>
                          </div>

                          {/* Aperçu médicaments */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {presc.medications.slice(0, 3).map((m, i) => (
                              <span key={i} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-white/80">
                                💊 {m.medication}
                              </span>
                            ))}
                            {presc.medications.length > 3 && (
                              <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-white/50">
                                +{presc.medications.length - 3} autres
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-sm text-white/50">
                            <Badge status={presc.status} />
                            {presc.validUntil && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" /> Valide jusqu'au {fmtDate(presc.validUntil)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-white/30 group-hover:text-white/70 transition" />
                          <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white/70 transition" />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ════════════════ HISTORIQUE APPELS VIDÉO ════════════════ */}
            {activeTab === 'videocalls' && (
              <div className="space-y-4">
                {videoCalls.length === 0 ? (
                  <Empty icon={Video} label="Aucun appel vidéo enregistré" />
                ) : (
                  videoCalls.map(call => {
                    const { date, time } = fmtDateTime(call.createdAt);
                    return (
                      <div key={call.id} className="futuristic-card p-6 hover:border-white/30 transition">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${
                              call.status === 'completed' ? 'bg-green-500/20' :
                              call.status === 'missed'    ? 'bg-red-500/20' :
                              call.status === 'ongoing'   ? 'bg-cyan-500/20' :
                              'bg-blue-500/20'
                            }`}>
                              <Video className={`w-6 h-6 ${
                                call.status === 'completed' ? 'text-green-400' :
                                call.status === 'missed'    ? 'text-red-400' :
                                call.status === 'ongoing'   ? 'text-cyan-400' :
                                'text-blue-400'
                              }`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-white font-semibold">
                                  Appel avec {call.doctor
                                    ? `Dr. ${call.doctor.firstName} ${call.doctor.lastName}`
                                    : 'Médecin'}
                                </h3>
                                <Badge status={call.status} />
                              </div>
                              {call.doctor?.specialty && (
                                <p className="text-sm text-blue-400 mb-2">{call.doctor.specialty}</p>
                              )}
                              <div className="flex flex-wrap gap-4 text-sm text-white/50">
                                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{date}</span>
                                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{time}</span>
                                {call.durationMinutes && (
                                  <span className="flex items-center gap-1">⏱️ {call.durationMinutes} min</span>
                                )}
                              </div>
                              {call.notes && (
                                <p className="text-white/60 text-sm mt-2">{call.notes}</p>
                              )}
                            </div>
                          </div>
                          {call.status === 'scheduled' && (
                            <a
                              href={call.roomLink}
                              target="_blank"
                              rel="noreferrer"
                              className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-xl text-sm font-semibold hover:bg-blue-500/30 transition flex items-center gap-2"
                            >
                              <Video className="w-4 h-4" /> Rejoindre
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ════════════════ TRAITEMENTS ════════════════ */}
            {activeTab === 'medications' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {medications.length === 0 ? (
                  <div className="col-span-2"><Empty icon={Stethoscope} label="Aucun traitement en cours" /></div>
                ) : (
                  medications.map((med, i) => (
                    <div key={med.id || i} className="futuristic-card p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-500/20 rounded-lg"><Pill className="w-5 h-5 text-green-400" /></div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">{med.name}</h3>
                            <p className="text-sm text-white/60">{med.dosage}</p>
                          </div>
                        </div>
                        <Badge status={med.status} />
                      </div>
                      <div className="space-y-1.5 text-sm text-white/70">
                        <p>🔁 Fréquence : {med.frequency}</p>
                        <p>👨‍⚕️ Prescrit par : {med.prescribedBy}</p>
                        <p>📅 Début : {fmtDate(med.startDate)}</p>
                        {med.endDate && <p>🏁 Fin : {fmtDate(med.endDate)}</p>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ════════════════ ALLERGIES ════════════════ */}
            {activeTab === 'allergies' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allergies.length === 0 ? (
                  <div className="col-span-2"><Empty icon={AlertCircle} label="Aucune allergie enregistrée" /></div>
                ) : (
                  allergies.map(al => (
                    <div key={al.id} className="futuristic-card p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${al.severity === 'severe' ? 'bg-red-500/20' : al.severity === 'moderate' ? 'bg-orange-500/20' : 'bg-yellow-500/20'}`}>
                            <AlertCircle className={`w-5 h-5 ${al.severity === 'severe' ? 'text-red-400' : al.severity === 'moderate' ? 'text-orange-400' : 'text-yellow-400'}`} />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">{al.name}</h3>
                            <p className="text-sm text-white/50">Diagnostiqué le {fmtDate(al.diagnosedDate)}</p>
                          </div>
                        </div>
                        <Badge status={al.severity} />
                      </div>
                      <p className="text-sm text-white/70"><span className="text-white/50">Réaction :</span> {al.reaction}</p>
                      {al.notes && <p className="text-sm text-white/50 mt-2">{al.notes}</p>}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ════════════════ CONDITIONS ════════════════ */}
            {activeTab === 'conditions' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {conditions.length === 0 ? (
                  <div className="col-span-2"><Empty icon={Heart} label="Aucune condition médicale enregistrée" /></div>
                ) : (
                  conditions.map(cond => (
                    <div key={cond.id} className="futuristic-card p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-500/20 rounded-lg"><Heart className="w-5 h-5 text-purple-400" /></div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">{cond.name}</h3>
                            <p className="text-sm text-white/50">Diagnostiqué le {fmtDate(cond.diagnosedDate)}</p>
                          </div>
                        </div>
                        <Badge status={cond.status} />
                      </div>
                      {cond.notes && <p className="text-sm text-white/70">{cond.notes}</p>}
                    </div>
                  ))
                )}
              </div>
            )}

          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL DOSSIER MÉDICAL
      ══════════════════════════════════════════════════════════════════════ */}
      {showModal && selectedRecord && (
        <Modal onClose={() => setShowModal(false)} title="Détails du dossier" color="from-blue-600 to-purple-600">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-white">{selectedRecord.title}</h3>
                <p className="text-blue-400 mt-1">{recordTypeLabel[selectedRecord.recordType]}</p>
              </div>
              {selectedRecord.isCritical && (
                <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm font-semibold border border-red-500/30">Critique</span>
              )}
            </div>

            <InfoGrid items={[
              { label: 'Date', value: fmtDate(selectedRecord.consultationDate) },
              ...(selectedRecord.nextAppointment ? [{ label: 'Prochain RDV', value: fmtDate(selectedRecord.nextAppointment) }] : [])
            ]} />

            {selectedRecord.doctor && (
              <InfoBlock color="blue" label="Médecin">
                Dr. {selectedRecord.doctor.firstName} {selectedRecord.doctor.lastName}
                {selectedRecord.doctor.specialty && <span className="text-white/50 text-sm block">{selectedRecord.doctor.specialty}</span>}
              </InfoBlock>
            )}
            {selectedRecord.description && <FieldBlock label="Description">{selectedRecord.description}</FieldBlock>}
            {selectedRecord.diagnosis    && <FieldBlock label="Diagnostic">{selectedRecord.diagnosis}</FieldBlock>}
            {selectedRecord.symptoms && (
              <FieldBlock label="Symptômes">
                {Array.isArray(selectedRecord.symptoms) ? selectedRecord.symptoms.join(', ') : JSON.stringify(selectedRecord.symptoms)}
              </FieldBlock>
            )}
            {Array.isArray(selectedRecord.medications) && selectedRecord.medications.length > 0 && (
              <div>
                <p className="text-sm text-white/50 mb-2">Médicaments prescrits</p>
                <div className="space-y-2">
                  {selectedRecord.medications.map((m: any, i: number) => (
                    <div key={i} className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                      <p className="font-medium text-white">{m.name || m.medication || 'Médicament'}</p>
                      <p className="text-sm text-white/60">{m.dosage} · {m.frequency}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL ORDONNANCE
      ══════════════════════════════════════════════════════════════════════ */}
      {showPrescModal && selectedPrescription && (
        <Modal onClose={() => setShowPrescModal(false)} title="Ordonnance" color="from-emerald-600 to-teal-600">
          <div className="space-y-4">
            {/* En-tête */}
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/50 text-sm">Émise le</p>
                <p className="text-white font-semibold">{fmtDate(selectedPrescription.createdAt)}</p>
              </div>
              <Badge status={selectedPrescription.status} />
            </div>

            {selectedPrescription.doctor && (
              <InfoBlock color="emerald" label="Médecin prescripteur">
                Dr. {selectedPrescription.doctor.firstName} {selectedPrescription.doctor.lastName}
                {selectedPrescription.doctor.specialty && <span className="text-white/50 text-sm block">{selectedPrescription.doctor.specialty}</span>}
              </InfoBlock>
            )}

            {selectedPrescription.validUntil && (
              <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
                <p className="text-yellow-300 text-sm">Valide jusqu'au {fmtDate(selectedPrescription.validUntil)}</p>
              </div>
            )}

            {/* Médicaments */}
            <div>
              <p className="text-sm text-white/50 mb-3 font-semibold uppercase tracking-wider">Médicaments prescrits</p>
              <div className="space-y-3">
                {selectedPrescription.medications.map((m, i) => (
                  <div key={i} className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Pill className="w-4 h-4 text-emerald-400" />
                      <p className="font-semibold text-white">{m.medication}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-white/70">
                      <p>💊 Posologie : {m.dosage}</p>
                      <p>🔁 Fréquence : {m.frequency}</p>
                      <p>⏱️ Durée : {m.duration}</p>
                      {m.instructions && <p className="col-span-2">📝 {m.instructions}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedPrescription.notes && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <Info className="w-4 h-4 text-blue-400" />
                  <p className="text-blue-400 text-sm font-semibold">Recommandations du médecin</p>
                </div>
                <p className="text-white/80 text-sm">{selectedPrescription.notes}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── Sous-composants ─────────────────────────────────────────────────────────

const Empty = ({ icon: Icon, label }: { icon: any; label: string }) => (
  <div className="text-center py-16">
    <Icon className="w-16 h-16 text-white/10 mx-auto mb-4" />
    <p className="text-white/50">{label}</p>
  </div>
);

const Modal = ({ onClose, title, color, children }: { onClose: () => void; title: string; color: string; children: React.ReactNode }) => (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
      <div className={`sticky top-0 bg-gradient-to-r ${color} px-6 py-4 rounded-t-xl flex justify-between items-center`}>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5" />{title}
        </h2>
        <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition">
          <X className="w-5 h-5 text-white" />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

const InfoGrid = ({ items }: { items: { label: string; value: string }[] }) => (
  <div className="grid grid-cols-2 gap-4 p-4 bg-white/5 rounded-lg">
    {items.map((item, i) => (
      <div key={i}>
        <p className="text-sm text-white/50">{item.label}</p>
        <p className="text-white font-medium">{item.value}</p>
      </div>
    ))}
  </div>
);

const InfoBlock = ({ label, color, children }: { label: string; color: string; children: React.ReactNode }) => (
  <div className={`p-4 bg-${color}-500/10 rounded-lg border border-${color}-500/20`}>
    <p className={`text-sm text-${color}-400 mb-1`}>{label}</p>
    <div className="text-white font-medium">{children}</div>
  </div>
);

const FieldBlock = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <p className="text-sm text-white/50 mb-1">{label}</p>
    <p className="text-white bg-white/5 p-3 rounded-lg text-sm">{children}</p>
  </div>
);

export default PatientMedicalFilePage;
