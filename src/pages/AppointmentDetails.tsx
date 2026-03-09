import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, User, MessageSquare, CheckCircle, XCircle,
  AlertCircle, Loader2, ArrowLeft, Phone, Video, Home, Star,
  Mail, DollarSign, FileText, MapPin, Check, X
} from 'lucide-react';
import { appointmentService, Appointment } from '../services/appointmentService';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const AppointmentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeElapsed, setTimeElapsed] = useState<string>('');
  const [confirmationDelay, setConfirmationDelay] = useState<string>('');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id2 = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id2);
  }, []);

  useEffect(() => {
    if (id) fetchAppointmentDetails();
  }, [id]);

  useEffect(() => {
    if (appointment?.createdAt) {
      updateTimeElapsed();
      const timer = setInterval(updateTimeElapsed, 60000);
      return () => clearInterval(timer);
    }
  }, [appointment]);

  useEffect(() => {
    if (appointment?.createdAt && appointment?.confirmedAt) calculateConfirmationDelay();
  }, [appointment]);

  // Calcule le statut réel selon l'heure actuelle
  const getComputedStatus = (dbStatus: string, appointmentDate: string, duration: number = 30): string => {
    if (['cancelled', 'no_show'].includes(dbStatus)) return dbStatus;
    const start = new Date(appointmentDate).getTime();
    const end   = start + (duration || 30) * 60 * 1000;
    const t     = now.getTime();
    if (t >= end)   return 'completed';
    if (t >= start) return (dbStatus === 'confirmed' || dbStatus === 'ongoing') ? 'ongoing' : dbStatus;
    return dbStatus;
  };

  const fetchAppointmentDetails = async () => {
    try {
      setLoading(true);
      const data = await appointmentService.getAppointmentById(id!);
      setAppointment(data);
    } catch (err) {
      setError('Impossible de charger les détails du rendez-vous');
      console.error('❌ Erreur chargement:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateTimeElapsed = () => {
    if (appointment?.createdAt) {
      const submitted = new Date(appointment.createdAt);
      const n = new Date();
      const diffMs = n.getTime() - submitted.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays > 0) setTimeElapsed(`Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`);
      else if (diffHours > 0) setTimeElapsed(`Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`);
      else if (diffMins > 0) setTimeElapsed(`Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`);
      else setTimeElapsed(`À l'instant`);
    }
  };

  const calculateConfirmationDelay = () => {
    if (appointment?.createdAt && appointment?.confirmedAt) {
      const diffMs = new Date(appointment.confirmedAt).getTime() - new Date(appointment.createdAt).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours > 0) {
        const rem = diffMins % 60;
        setConfirmationDelay(`${diffHours}h${rem > 0 ? rem : ''}`);
      } else {
        setConfirmationDelay(`${diffMins} min`);
      }
    }
  };

  const handleRateAppointment = async () => {
    if (rating === 0) { alert('Veuillez donner une note'); return; }
    try {
      setSubmittingRating(true);
      await appointmentService.rateAppointment(appointment!.id, rating, feedback);
      setShowRatingModal(false);
      fetchAppointmentDetails();
    } catch (error) {
      console.error('Erreur lors de la notation:', error);
      alert('Erreur lors de la soumission de la note');
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) return;
    try {
      await appointmentService.cancelAppointment(appointment!.id);
      fetchAppointmentDetails();
    } catch (error) {
      console.error('Erreur annulation:', error);
      alert('Erreur lors de l\'annulation du rendez-vous');
    }
  };

  const getStatusBadge = (dbStatus: string, appointmentDate: string, duration?: number) => {
    const status = appointment ? getComputedStatus(dbStatus, appointmentDate, duration) : dbStatus;
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      pending:   { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: AlertCircle,  label: 'En attente' },
      confirmed: { color: 'bg-green-100  text-green-800  border-green-200',  icon: CheckCircle,  label: 'Confirmé' },
      ongoing:   { color: 'bg-cyan-100   text-cyan-800   border-cyan-200',   icon: Clock,        label: 'En cours' },
      completed: { color: 'bg-blue-100   text-blue-800   border-blue-200',   icon: CheckCircle,  label: 'Terminé' },
      cancelled: { color: 'bg-red-100    text-red-800    border-red-200',    icon: XCircle,      label: 'Annulé' },
      no_show:   { color: 'bg-gray-100   text-gray-800   border-gray-200',   icon: XCircle,      label: 'Non présent' },
      missed:    { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: AlertCircle,  label: 'Manqué' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${config.color}`}>
        <Icon className="w-4 h-4 mr-2" />
        {config.label}
      </span>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'in_person': return <User className="w-5 h-5" />;
      case 'teleconsultation': return <Video className="w-5 h-5" />;
      case 'home_visit': return <Home className="w-5 h-5" />;
      default: return <User className="w-5 h-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'in_person': return 'Consultation en cabinet';
      case 'teleconsultation': return 'Téléconsultation';
      case 'home_visit': return 'Visite à domicile';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-700 text-lg">Chargement des détails du rendez-vous...</p>
        </div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg max-w-md">
          <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Rendez-vous non trouvé</h2>
          <p className="text-gray-600 mb-6">{error || 'Le rendez-vous demandé n\'existe pas'}</p>
          <button onClick={() => navigate('/dashboard')}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-md">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  const appointmentDate = parseISO(appointment.appointmentDate);
  const createdAt  = appointment.createdAt  ? parseISO(appointment.createdAt)  : null;
  const confirmedAt = appointment.confirmedAt ? parseISO(appointment.confirmedAt) : null;
  const computedStatus = getComputedStatus(appointment.status, appointment.appointmentDate, appointment.duration);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <button onClick={() => navigate('/dashboard')}
            className="inline-flex items-center px-4 py-2 text-gray-700 bg-white rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Tableau de bord
          </button>
          {getStatusBadge(appointment.status, appointment.appointmentDate, appointment.duration)}
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Détails du rendez-vous</h1>
          <p className="text-gray-600 text-lg">Référence: {appointment.id}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Médecin + Patient */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-800">
                  <User className="w-6 h-6 mr-2 text-blue-600" />
                  Médecin
                </h2>
                {appointment.doctor ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-600 mb-1">Nom complet</p>
                      <p className="font-bold text-xl text-gray-900">Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}</p>
                    </div>
                    <div className="flex items-start">
                      <FileText className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Spécialité</p>
                        <p className="font-medium text-gray-800">{appointment.doctor.specialty}</p>
                      </div>
                    </div>
                    {appointment.doctor.consultationPrice && (
                      <div className="flex items-start">
                        <DollarSign className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-600">Prix de la consultation</p>
                          <p className="font-bold text-xl text-green-600">{appointment.doctor.consultationPrice} €</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">Informations médecin non disponibles</p>
                )}
              </div>

              {appointment.patient && (
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                  <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-800">
                    <User className="w-6 h-6 mr-2 text-green-600" />
                    Patient
                  </h2>
                  <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-600 mb-1">Nom complet</p>
                      <p className="font-bold text-xl text-gray-900">{appointment.patient.firstName} {appointment.patient.lastName}</p>
                    </div>
                    {appointment.patient.email && (
                      <div className="flex items-center">
                        <Mail className="w-5 h-5 text-gray-400 mr-3" />
                        <p className="text-gray-700">{appointment.patient.email}</p>
                      </div>
                    )}
                    {appointment.patient.phoneNumber && (
                      <div className="flex items-center">
                        <Phone className="w-5 h-5 text-gray-400 mr-3" />
                        <p className="text-gray-700">{appointment.patient.phoneNumber}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Infos RDV */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-800">
                <Calendar className="w-6 h-6 mr-2 text-purple-600" />
                Informations du rendez-vous
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Date</p>
                      <p className="font-semibold text-gray-800">{format(appointmentDate, 'EEEE d MMMM yyyy', { locale: fr })}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Clock className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Heure</p>
                      <p className="font-semibold text-gray-800">{format(appointmentDate, 'HH:mm')}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start">
                    {getTypeIcon(appointment.type)}
                    <div className="ml-3">
                      <p className="text-sm text-gray-600">Type</p>
                      <p className="font-semibold text-gray-800">{getTypeLabel(appointment.type)}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Clock className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Durée</p>
                      <p className="font-semibold text-gray-800">{appointment.duration} minutes</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Motif et Notes */}
            {(appointment.reason || appointment.notes) && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-800">
                  <MessageSquare className="w-6 h-6 mr-2 text-orange-600" />
                  Détails de la consultation
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {appointment.reason && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Motif</p>
                      <p className="text-gray-800 bg-gray-50 p-4 rounded-xl border border-gray-100">{appointment.reason}</p>
                    </div>
                  )}
                  {appointment.notes && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Notes</p>
                      <p className="text-gray-800 bg-gray-50 p-4 rounded-xl border border-gray-100">{appointment.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Chronologie */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 sticky top-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center text-gray-800">
                <Clock className="w-6 h-6 mr-2 text-indigo-600" />
                Chronologie
              </h2>
              <div className="space-y-6">
                {createdAt && (
                  <div className="relative pl-8 pb-6 border-l-2 border-blue-200">
                    <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow"></div>
                    <p className="text-sm font-semibold text-blue-600 mb-1">Soumission</p>
                    <p className="text-gray-800 font-medium">{format(createdAt, 'dd MMM yyyy', { locale: fr })}</p>
                    <p className="text-gray-600">{format(createdAt, 'HH:mm')}</p>
                    <p className="text-sm text-gray-500 mt-2 bg-blue-50 p-2 rounded-lg">{timeElapsed}</p>
                  </div>
                )}
                {confirmedAt ? (
                  <div className="relative pl-8 pb-6 border-l-2 border-green-200">
                    <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow"></div>
                    <p className="text-sm font-semibold text-green-600 mb-1">Confirmation</p>
                    <p className="text-gray-800 font-medium">{format(confirmedAt, 'dd MMM yyyy', { locale: fr })}</p>
                    <p className="text-gray-600">{format(confirmedAt, 'HH:mm')}</p>
                    {confirmationDelay && (
                      <p className="text-sm text-green-600 mt-2 bg-green-50 p-2 rounded-lg font-medium">
                        Confirmé en {confirmationDelay}
                      </p>
                    )}
                  </div>
                ) : appointment.status === 'pending' && (
                  <div className="relative pl-8 pb-6 border-l-2 border-yellow-200">
                    <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-yellow-500 border-2 border-white shadow animate-pulse"></div>
                    <p className="text-sm font-semibold text-yellow-600 mb-1">En attente de confirmation</p>
                    <p className="text-gray-500">Le médecin n'a pas encore confirmé</p>
                  </div>
                )}
                <div className="relative pl-8">
                  <div className={`absolute left-[-9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow ${
                    computedStatus === 'confirmed' ? 'bg-green-500' :
                    computedStatus === 'ongoing'   ? 'bg-cyan-500 animate-pulse' :
                    computedStatus === 'completed' ? 'bg-blue-500' :
                    computedStatus === 'cancelled' ? 'bg-red-500' :
                    computedStatus === 'no_show'   ? 'bg-gray-500' :
                    'bg-yellow-500'
                  }`}></div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Statut actuel</p>
                  <div className="mt-2">
                    {getStatusBadge(appointment.status, appointment.appointmentDate, appointment.duration)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notation si terminé */}
        {computedStatus === 'completed' && !appointment.rating && (
          <div className="mt-8 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center">
                <Star className="w-8 h-8 text-yellow-500 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Comment s'est passé votre consultation ?</h3>
                  <p className="text-gray-600">Votre avis est important pour nous</p>
                </div>
              </div>
              <button onClick={() => setShowRatingModal(true)}
                className="px-6 py-3 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-colors shadow-md font-medium">
                Noter la consultation
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex justify-end space-x-4">
          {computedStatus === 'pending' && (
            <button onClick={handleCancelAppointment}
              className="px-6 py-3 border-2 border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition-colors font-medium">
              Annuler le rendez-vous
            </button>
          )}
        </div>
      </div>

      {/* Modal notation */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Noter la consultation</h3>
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">Votre note</p>
              <div className="flex justify-center space-x-2">
                {[1,2,3,4,5].map((star) => (
                  <button key={star} onClick={() => setRating(star)} className="focus:outline-none">
                    <Star className={`w-10 h-10 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} transition-colors`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm text-gray-600 mb-2">Commentaire (optionnel)</label>
              <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Partagez votre expérience..." />
            </div>
            <div className="flex space-x-3">
              <button onClick={() => setShowRatingModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">
                Annuler
              </button>
              <button onClick={handleRateAppointment} disabled={rating === 0 || submittingRating}
                className="flex-1 px-4 py-3 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {submittingRating ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentDetails;
