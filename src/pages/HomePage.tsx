import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Calendar,
  Building2,
  Bell,
  Stethoscope,
  Pill,
  LineChart,
  Shield,
  ChevronRight,
  Sparkles,
  HeartPulse,
  Activity,
  Users,
  CheckCircle2,
  Menu,
  X,
  Clock,
  Video,
  Star,
  Zap,
  Lock,
  Smartphone,
} from 'lucide-react'

// ─── Contenu détaillé affiché dans chaque modal ───────────────────────────────
const FEATURE_DETAILS = [
  {
    hash: 'appointments',
    icon: <Calendar className="w-7 h-7" />,
    color: 'from-blue-500 to-cyan-400',
    title: 'Gestion des rendez-vous',
    tagline: 'Plus besoin d\'appeler. Réservez en 30 secondes.',
    description:
      'Notre système de prise de rendez-vous intelligent vous permet de trouver le bon médecin au bon moment, depuis n\'importe quel appareil, à toute heure.',
    points: [
      { icon: <Clock className="w-4 h-4" />,        text: 'Réservation 24h/24, 7j/7 sans attente' },
      { icon: <Bell className="w-4 h-4" />,         text: 'Rappels automatiques 24h et 1h avant le RDV' },
      { icon: <CheckCircle2 className="w-4 h-4" />, text: 'Annulation et reprogrammation gratuites' },
      { icon: <Calendar className="w-4 h-4" />,     text: 'Historique complet de vos consultations' },
      { icon: <Smartphone className="w-4 h-4" />,   text: 'Synchronisation avec votre agenda mobile' },
    ],
  },
  {
    hash: 'medical-record',
    icon: <Building2 className="w-7 h-7" />,
    color: 'from-purple-500 to-pink-400',
    title: 'Dossier médical numérique',
    tagline: 'Toute votre santé en un seul endroit, toujours avec vous.',
    description:
      'Centralisez ordonnances, analyses, antécédents et vaccinations. Partagez en un clic avec n\'importe quel médecin, même en urgence.',
    points: [
      { icon: <Lock className="w-4 h-4" />,         text: 'Chiffrement AES-256 — données 100 % sécurisées' },
      { icon: <Users className="w-4 h-4" />,        text: 'Partage contrôlé médecin par médecin' },
      { icon: <Smartphone className="w-4 h-4" />,   text: 'Accessible hors ligne sur mobile' },
      { icon: <CheckCircle2 className="w-4 h-4" />, text: 'Ordonnances et résultats d\'analyses en ligne' },
      { icon: <Building2 className="w-4 h-4" />,    text: 'Export PDF de votre dossier à tout moment' },
    ],
  },
  {
    hash: 'reminders',
    icon: <Bell className="w-7 h-7" />,
    color: 'from-emerald-500 to-teal-400',
    title: 'Rappels intelligents',
    tagline: 'Ne manquez plus jamais un rendez-vous ni une prise de médicament.',
    description:
      'Notre moteur de rappels apprend vos habitudes pour vous envoyer les bonnes notifications, au bon moment, via le canal que vous préférez.',
    points: [
      { icon: <Bell className="w-4 h-4" />,         text: 'Email, SMS et notifications push' },
      { icon: <Pill className="w-4 h-4" />,         text: 'Rappels prises de médicaments quotidiens' },
      { icon: <Zap className="w-4 h-4" />,          text: 'Alertes renouvellement d\'ordonnance' },
      { icon: <CheckCircle2 className="w-4 h-4" />, text: 'Rappels bilans annuels et vaccinations' },
      { icon: <Clock className="w-4 h-4" />,        text: 'Personnalisation complète des horaires' },
    ],
  },
  {
    hash: 'teleconsultation',
    icon: <Stethoscope className="w-7 h-7" />,
    color: 'from-orange-500 to-amber-400',
    title: 'Réseau de médecins',
    tagline: 'Trouvez le bon spécialiste en quelques secondes.',
    description:
      'Accédez à un réseau de médecins vérifiés et évalués par leurs patients. Consultez en cabinet ou en téléconsultation vidéo HD.',
    points: [
      { icon: <Star className="w-4 h-4" />,         text: 'Avis vérifiés de vrais patients uniquement' },
      { icon: <Shield className="w-4 h-4" />,       text: 'Diplômes et licences contrôlés à l\'inscription' },
      { icon: <Video className="w-4 h-4" />,        text: 'Téléconsultation vidéo HD disponible' },
      { icon: <Stethoscope className="w-4 h-4" />,  text: '30+ spécialités médicales représentées' },
      { icon: <CheckCircle2 className="w-4 h-4" />, text: 'Tarifs transparents affichés avant réservation' },
    ],
  },
  {
    hash: 'availability',
    icon: <Pill className="w-7 h-7" />,
    color: 'from-indigo-500 to-blue-400',
    title: 'Gestion des traitements',
    tagline: 'Suivez chaque médicament, chaque dose, chaque jour.',
    description:
      'Centralisez vos traitements médicamenteux avec posologies et durées. Recevez des rappels de prise et évitez les interactions dangereuses.',
    points: [
      { icon: <Pill className="w-4 h-4" />,         text: 'Base de 10 000+ médicaments avec notices' },
      { icon: <Bell className="w-4 h-4" />,         text: 'Rappels matin / midi / soir / nuit' },
      { icon: <Shield className="w-4 h-4" />,       text: 'Détection automatique des interactions' },
      { icon: <CheckCircle2 className="w-4 h-4" />, text: 'Suivi de l\'observance thérapeutique' },
      { icon: <Clock className="w-4 h-4" />,        text: 'Historique complet des traitements passés' },
    ],
  },
  {
    hash: 'security',
    icon: <LineChart className="w-7 h-7" />,
    color: 'from-teal-500 to-cyan-400',
    title: 'Analyses et suivis',
    tagline: 'Vos données de santé transformées en insights visuels clairs.',
    description:
      'Suivez tension, poids, glycémie et bien plus avec des graphiques intuitifs. Partagez vos tendances avec votre médecin pour un suivi optimal.',
    points: [
      { icon: <LineChart className="w-4 h-4" />,    text: 'Tableaux de bord personnalisés et configurables' },
      { icon: <Zap className="w-4 h-4" />,          text: 'Saisie rapide des constantes en quelques secondes' },
      { icon: <Users className="w-4 h-4" />,        text: 'Partage direct de vos graphiques avec votre médecin' },
      { icon: <CheckCircle2 className="w-4 h-4" />, text: 'Comparaison avec les normes de référence' },
      { icon: <Smartphone className="w-4 h-4" />,   text: 'Intégration appareils connectés (tensiomètre, balance…)' },
    ],
  },
]

// ─── Composant Modal ──────────────────────────────────────────────────────────
interface ModalProps {
  feature: typeof FEATURE_DETAILS[0] | null
  onClose: () => void
}

const FeatureModal: React.FC<ModalProps> = ({ feature, onClose }) => {
  useEffect(() => {
    if (!feature) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [feature, onClose])

  if (!feature) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />

      {/* Carte */}
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
        style={{ animation: 'modalIn 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
        onClick={e => e.stopPropagation()}
      >
        {/* En-tête coloré */}
        <div className={`bg-gradient-to-br ${feature.color} p-6 pb-10`}>
          <div className="flex items-start justify-between mb-5">
            <div className="bg-white/25 backdrop-blur rounded-2xl p-3 text-white shadow-lg">
              {feature.icon}
            </div>
            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/35 backdrop-blur rounded-xl p-2 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <h2 className="text-xl font-black text-white mb-1 leading-tight">{feature.title}</h2>
          <p className="text-white/85 text-sm font-semibold">{feature.tagline}</p>
        </div>

        {/* Corps — légèrement superposé sur le header */}
        <div className="px-6 pt-5 pb-6 bg-white -mt-4 rounded-t-3xl relative">
          <p className="text-slate-500 text-sm leading-relaxed mb-5 font-medium">
            {feature.description}
          </p>

          <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
            Ce que vous obtenez
          </p>

          <ul className="space-y-3 mb-6">
            {feature.points.map((point, i) => (
              <li key={i} className="flex items-start gap-3">
                <div
                  className={`w-7 h-7 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center shrink-0 text-white shadow-sm mt-0.5`}
                >
                  {point.icon}
                </div>
                <span className="text-slate-700 text-sm font-semibold leading-relaxed">
                  {point.text}
                </span>
              </li>
            ))}
          </ul>

          {/* CTA principal */}
          <Link
            to="/register"
            onClick={onClose}
            className={`w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r ${feature.color} text-white rounded-2xl font-black text-sm shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all`}
          >
            Commencer gratuitement
            <ChevronRight className="w-4 h-4" />
          </Link>

          <button
            onClick={onClose}
            className="w-full mt-2 py-2.5 text-slate-400 hover:text-slate-600 text-sm font-semibold transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.88) translateY(24px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
      `}</style>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
const HomePage: React.FC = () => {
  const { isAuthenticated, user } = useAuth()
  const [isVisible, setIsVisible]           = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeModal, setActiveModal]       = useState<typeof FEATURE_DETAILS[0] | null>(null)

  useEffect(() => {
    setIsVisible(true)
    const handleScroll = () => {}
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const features = [
    {
      icon: <Calendar className="w-7 h-7" />,
      title: 'Gestion des rendez-vous',
      description: 'Prenez, modifiez ou annulez vos rendez-vous en ligne facilement',
      color: 'from-blue-500 to-cyan-400',
      delay: '0ms',
      hash: 'appointments',
    },
    {
      icon: <Building2 className="w-7 h-7" />,
      title: 'Dossier médical numérique',
      description: 'Accédez à votre dossier médical complet en quelques clics',
      color: 'from-purple-500 to-pink-400',
      delay: '100ms',
      hash: 'medical-record',
    },
    {
      icon: <Bell className="w-7 h-7" />,
      title: 'Rappels intelligents',
      description: 'Recevez des rappels pour vos rendez-vous et traitements',
      color: 'from-emerald-500 to-teal-400',
      delay: '200ms',
      hash: 'reminders',
    },
    {
      icon: <Stethoscope className="w-7 h-7" />,
      title: 'Réseau de médecins',
      description: 'Trouvez et consultez des professionnels de santé qualifiés',
      color: 'from-orange-500 to-amber-400',
      delay: '300ms',
      hash: 'teleconsultation',
    },
    {
      icon: <Pill className="w-7 h-7" />,
      title: 'Gestion des traitements',
      description: 'Suivez vos médicaments et traitements au quotidien',
      color: 'from-indigo-500 to-blue-400',
      delay: '400ms',
      hash: 'availability',
    },
    {
      icon: <LineChart className="w-7 h-7" />,
      title: 'Analyses et suivis',
      description: "Visualisez l'évolution de votre santé dans le temps",
      color: 'from-teal-500 to-cyan-400',
      delay: '500ms',
      hash: 'security',
    },
  ]

  const stats = [
    { value: '10k+',  label: 'Patients satisfaits',  icon: <Users className="w-8 h-8" /> },
    { value: '500+',  label: 'Médecins partenaires',  icon: <Stethoscope className="w-8 h-8" /> },
    { value: '50k+',  label: 'Rendez-vous par mois', icon: <Calendar className="w-8 h-8" /> },
    { value: '4.9/5', label: 'Note moyenne',          icon: <CheckCircle2 className="w-8 h-8" /> },
  ]

  const benefits = ['Disponible 24/7', 'Sécurité maximale', 'Support réactif', 'Gratuit pour commencer']

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%       { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.8s ease-out forwards; }
        .animate-fade-in  { animation: fade-in  1s   ease-out forwards; }
        .animate-float    { animation: float    6s   ease-in-out infinite; }

        .feature-card { transition: all 0.4s cubic-bezier(0.4,0,0.2,1); position: relative; }
        .feature-card::before {
          content: '';
          position: absolute; inset: 0;
          border-radius: 1.5rem; padding: 2px;
          background: linear-gradient(135deg, rgba(255,255,255,.5), rgba(255,255,255,.1));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude;
          opacity: 0; transition: opacity 0.4s;
        }
        .feature-card:hover::before { opacity: 1; }
        .feature-card:hover          { transform: translateY(-8px); }
      `}</style>

      {/* ── Modal ──────────────────────────────────────────────────────── */}
      <FeatureModal feature={activeModal} onClose={() => setActiveModal(null)} />

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <nav className="backdrop-blur-xl bg-white/70 sticky top-0 z-50 border-b border-white/50 shadow-lg shadow-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">

            <Link to="/" className="flex items-center space-x-3 group cursor-pointer">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-all duration-500" />
                <div className="relative bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-3 rounded-2xl shadow-lg transform group-hover:scale-110 transition-transform">
                  <HeartPulse className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  NEXUS HEALTH
                </h1>
                <p className="text-xs text-slate-500 font-semibold">Votre santé connectée</p>
              </div>
            </Link>

            <div className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-slate-700 hover:text-blue-600 transition-colors font-semibold text-sm">Fonctionnalités</a>
              <a href="#stats"    className="text-slate-700 hover:text-blue-600 transition-colors font-semibold text-sm">Statistiques</a>
              <a href="#contact"  className="text-slate-700 hover:text-blue-600 transition-colors font-semibold text-sm">Contact</a>
            </div>

            <div className="hidden md:flex items-center space-x-3">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-200/50">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                    <span className="text-sm font-bold text-slate-700">{user?.firstName}</span>
                  </div>
                  <Link to="/dashboard"
                    className="group inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/50 transition-all hover:scale-105">
                    <span>Dashboard</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/login"
                    className="text-slate-700 hover:text-blue-600 px-5 py-2 rounded-xl text-sm font-bold transition-all hover:bg-white/70">
                    Connexion
                  </Link>
                  <Link to="/register"
                    className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/50 transition-all hover:scale-105">
                    Inscription
                  </Link>
                </>
              )}
            </div>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-white/50 transition-colors">
              {mobileMenuOpen ? <X className="w-6 h-6 text-slate-700" /> : <Menu className="w-6 h-6 text-slate-700" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-white/50">
              <div className="flex flex-col space-y-3">
                <a href="#features" className="text-slate-700 hover:text-blue-600 font-semibold px-4 py-2 rounded-xl hover:bg-white/50">Fonctionnalités</a>
                <a href="#stats"    className="text-slate-700 hover:text-blue-600 font-semibold px-4 py-2 rounded-xl hover:bg-white/50">Statistiques</a>
                <a href="#contact"  className="text-slate-700 hover:text-blue-600 font-semibold px-4 py-2 rounded-xl hover:bg-white/50">Contact</a>
                {!isAuthenticated && (
                  <>
                    <Link to="/login"    className="text-slate-700 font-bold px-4 py-2 rounded-xl hover:bg-white/50 transition-all">Connexion</Link>
                    <Link to="/register" className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-bold px-4 py-2 rounded-xl text-center">Inscription</Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '0s' }} />
          <div className="absolute top-40 right-10 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 relative">
          <div className="text-center max-w-5xl mx-auto">

            <div className={`inline-flex items-center gap-2 backdrop-blur-xl bg-white/80 px-5 py-2.5 rounded-full text-sm font-bold mb-8 border border-blue-200/50 shadow-lg ${isVisible ? 'animate-slide-up' : 'opacity-0'}`}
                 style={{ animationDelay: '0ms' }}>
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Plateforme de santé #1 en Afrique
              </span>
            </div>

            <h1 className={`text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight ${isVisible ? 'animate-slide-up' : 'opacity-0'}`}
                style={{ animationDelay: '100ms' }}>
              <span className="block mb-3 text-slate-900">Votre santé,</span>
              <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">simplifiée</span>
            </h1>

            <p className={`text-xl md:text-2xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed font-medium ${isVisible ? 'animate-slide-up' : 'opacity-0'}`}
               style={{ animationDelay: '200ms' }}>
              Gérez vos rendez-vous médicaux, consultez votre dossier de santé et
              suivez votre parcours médical en toute simplicité.
            </p>

            <div className={`flex flex-col sm:flex-row gap-4 justify-center mb-16 ${isVisible ? 'animate-slide-up' : 'opacity-0'}`}
                 style={{ animationDelay: '300ms' }}>
              {!isAuthenticated ? (
                <>
                  <Link to="/register"
                    className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-2xl text-lg font-black shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all hover:scale-105">
                    <span>Commencer gratuitement</span>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link to="/login"
                    className="group inline-flex items-center justify-center gap-2 px-8 py-4 backdrop-blur-xl bg-white/80 text-slate-700 rounded-2xl text-lg font-black border-2 border-white hover:border-blue-400 hover:text-blue-600 transition-all hover:shadow-xl">
                    <span>Se connecter</span>
                  </Link>
                </>
              ) : (
                <Link to="/dashboard"
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-2xl text-lg font-black shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all hover:scale-105">
                  <span>Accéder au dashboard</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>

            <div className={`flex flex-wrap justify-center gap-4 mb-20 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}
                 style={{ animationDelay: '400ms' }}>
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 backdrop-blur-xl bg-white/80 px-4 py-2.5 rounded-full border border-white shadow-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-bold text-slate-700">{benefit}</span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div id="stats" className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {stats.map((stat, index) => (
                <div key={index}
                  className={`backdrop-blur-xl bg-white/80 p-6 rounded-2xl border border-white shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group ${isVisible ? 'animate-slide-up' : 'opacity-0'}`}
                  style={{ animationDelay: `${500 + index * 100}ms` }}>
                  <div className="text-blue-600 mb-3 flex justify-center opacity-70 group-hover:opacity-100 transition-opacity group-hover:scale-110 transform duration-300">
                    {stat.icon}
                  </div>
                  <div className="text-3xl md:text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm font-bold text-slate-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Features ───────────────────────────────────────────────────── */}
      <div id="features" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="backdrop-blur-xl bg-white/80 px-5 py-2.5 rounded-full text-sm font-black text-blue-600 border border-blue-200/50 shadow-lg">
                Fonctionnalités
              </span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-6">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto font-semibold">
              Une plateforme complète et intuitive pour gérer votre santé
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const detail = FEATURE_DETAILS.find(d => d.hash === feature.hash)!
              return (
                <div key={index}
                  className="feature-card group backdrop-blur-xl bg-white/80 rounded-3xl p-8 border border-white shadow-xl hover:shadow-2xl"
                  style={{ animationDelay: feature.delay }}>

                  <div className="relative mb-6">
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-all duration-500`} />
                    <div className={`relative bg-gradient-to-br ${feature.color} rounded-2xl p-4 inline-flex group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <div className="text-white">{feature.icon}</div>
                    </div>
                  </div>

                  <h3 className="text-xl font-black text-slate-900 mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-4 font-semibold text-sm">
                    {feature.description}
                  </p>

                  {/* ← Bouton qui ouvre le modal */}
                  <button
                    onClick={() => setActiveModal(detail)}
                    className="flex items-center gap-1 text-sm font-black text-slate-400 group-hover:text-blue-600 transition-colors hover:gap-2 cursor-pointer"
                  >
                    <span>En savoir plus</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── CTA Banner ─────────────────────────────────────────────────── */}
      <div className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
          <div className="absolute top-10 left-10 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="mb-6">
            <Activity className="w-16 h-16 text-white/90 mx-auto mb-4 animate-float" strokeWidth={1.5} />
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
            Prêt à prendre soin de<br />votre santé ?
          </h2>
          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl mx-auto font-bold leading-relaxed">
            Rejoignez des milliers de patients et médecins qui utilisent déjà notre plateforme
          </p>
          <Link to="/register"
            className="group inline-flex items-center gap-3 px-10 py-5 bg-white text-blue-600 rounded-2xl text-lg font-black shadow-2xl hover:shadow-white/50 hover:scale-105 transition-all">
            <span>Créer un compte gratuitement</span>
            <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer id="contact" className="bg-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">

            <div className="col-span-1">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-2.5 rounded-xl shadow-lg">
                  <HeartPulse className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-black">NEXUS HEALTH</h3>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed font-semibold mb-6">
                Votre partenaire santé au quotidien. Une solution moderne et sécurisée.
              </p>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-all hover:scale-110">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-all hover:scale-110">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-all hover:scale-110">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-black mb-4">Produit</h4>
              <ul className="space-y-3">
                <li><Link to="/features" className="text-slate-400 hover:text-white transition font-semibold text-sm">Fonctionnalités</Link></li>
                <li><a href="/pricing"   className="text-slate-400 hover:text-white transition font-semibold text-sm">Tarifs</a></li>
                <li><a href="/faq"       className="text-slate-400 hover:text-white transition font-semibold text-sm">FAQ</a></li>
                <li><Link to="/docs"     className="text-slate-400 hover:text-white transition font-semibold text-sm">Documentation</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-black mb-4">Légal</h4>
              <ul className="space-y-3">
                <li><a href="/privacy" className="text-slate-400 hover:text-white transition font-semibold text-sm">Confidentialité</a></li>
                <li><a href="/terms"   className="text-slate-400 hover:text-white transition font-semibold text-sm">Conditions</a></li>
                <li><a href="/legal"   className="text-slate-400 hover:text-white transition font-semibold text-sm">Mentions légales</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-black mb-4">Contact</h4>
              <ul className="space-y-3">
                <li className="text-slate-400 font-semibold text-sm">oualoumidjeupisne@gmail.com</li>
                <li className="text-slate-400 font-semibold text-sm">+228 93 36 01 50</li>
                <li className="text-slate-400 font-semibold text-sm">Lomé, Togo</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center text-slate-500 text-sm">
              <p className="font-bold">© 2026 NEXUS HEALTH. Tous droits réservés.</p>
              <div className="flex items-center gap-2 mt-4 md:mt-0">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span className="text-slate-400 font-bold">Sécurisé et confidentiel</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage
