import React, { useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import {
  BookOpen, ArrowLeft, ChevronRight, Code, Users, Shield,
  Server, Lock, Smartphone, Globe, HeartPulse,
  CheckCircle2, ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react';

// ─── Contenu de chaque section de documentation ───────────────────────────────
const DOC_SECTIONS: Record<string, {
  slug: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  textColor: string;
  title: string;
  subtitle: string;
  intro: string;
  articles: { title: string; description: string; steps?: string[]; badge?: string }[];
}> = {
  'user-guide': {
    slug: 'user-guide',
    icon: <Users className="w-6 h-6" />,
    color: 'from-blue-500 to-cyan-400',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    title: 'Guide utilisateur',
    subtitle: 'Tout ce dont vous avez besoin pour utiliser la plateforme',
    intro: 'Ce guide vous accompagne pas à pas dans l\'utilisation de toutes les fonctionnalités de Nexus Health, de la création de compte à la gestion de votre dossier médical.',
    articles: [
      {
        title: 'Premiers pas',
        badge: 'Débutant',
        description: 'Commencez à utiliser Nexus Health en quelques minutes.',
        steps: [
          'Rendez-vous sur carnet-sante-frontend.onrender.com',
          'Cliquez sur "Inscription" et renseignez vos informations',
          'Vérifiez votre email et activez votre compte',
          'Complétez votre profil médical',
          'Prenez votre premier rendez-vous !',
        ],
      },
      {
        title: 'Gestion des rendez-vous',
        badge: 'Essentiel',
        description: 'Apprenez à prendre, modifier et suivre vos rendez-vous médicaux.',
        steps: [
          'Accédez à la section "Rendez-vous" depuis votre tableau de bord',
          'Recherchez un médecin par nom ou spécialité',
          'Choisissez un créneau disponible dans le calendrier',
          'Confirmez votre rendez-vous (email de confirmation envoyé)',
          'Consultez vos prochains rendez-vous dans votre agenda',
        ],
      },
      {
        title: 'Dossier médical',
        badge: 'Important',
        description: 'Accédez et gérez votre dossier de santé numérique.',
        steps: [
          'Ouvrez "Mon dossier médical" dans le menu principal',
          'Consultez vos ordonnances, analyses et antécédents',
          'Téléchargez ou partagez vos documents médicaux',
          'Mettez à jour vos allergies et traitements en cours',
        ],
      },
      {
        title: 'Téléconsultation',
        badge: 'Nouveau',
        description: 'Consultez un médecin en vidéo depuis chez vous.',
        steps: [
          'Sélectionnez "Téléconsultation" lors de la prise de rendez-vous',
          'Testez votre caméra et micro avant la consultation',
          'Rejoignez la session vidéo à l\'heure du rendez-vous',
          'Recevez l\'ordonnance numérique après la consultation',
        ],
      },
      {
        title: 'Profil et préférences',
        badge: 'Personnalisation',
        description: 'Personnalisez votre expérience et gérez vos notifications.',
        steps: [
          'Cliquez sur votre avatar en haut à droite',
          'Accédez à "Mon profil" pour modifier vos informations',
          'Configurez vos préférences de notifications',
          'Gérez vos médecins et établissements favoris',
        ],
      },
    ],
  },
  'doctor-guide': {
    slug: 'doctor-guide',
    icon: <Code className="w-6 h-6" />,
    color: 'from-purple-500 to-pink-400',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-600',
    title: 'Guide médecin',
    subtitle: 'Configurez votre compte et gérez vos patients efficacement',
    intro: 'Ce guide est destiné aux professionnels de santé inscrits sur Nexus Health. Découvrez comment optimiser votre présence, gérer votre agenda et communiquer avec vos patients.',
    articles: [
      {
        title: 'Configuration du compte',
        badge: 'Démarrage',
        description: 'Configurez votre profil médecin pour attirer de nouveaux patients.',
        steps: [
          'Inscrivez-vous avec votre numéro de licence médicale',
          'Complétez votre profil : photo, biographie, spécialités',
          'Définissez vos honoraires et modes de consultation',
          'Attendez la vérification de vos diplômes (24-48h)',
        ],
      },
      {
        title: 'Gestion des patients',
        badge: 'Essentiel',
        description: 'Accédez aux dossiers patients et gérez vos consultations.',
        steps: [
          'Consultez la liste de vos patients depuis le tableau de bord',
          'Ouvrez le dossier d\'un patient pour voir ses antécédents',
          'Rédigez des ordonnances numériques sécurisées',
          'Ajoutez des notes de consultation au dossier patient',
        ],
      },
      {
        title: 'Calendrier et disponibilités',
        badge: 'Agenda',
        description: 'Gérez votre planning et vos créneaux disponibles.',
        steps: [
          'Accédez à "Mon calendrier" depuis votre espace médecin',
          'Définissez vos heures d\'ouverture par jour de la semaine',
          'Bloquez des plages pour congés ou formations',
          'Configurez la durée par défaut de vos consultations',
        ],
      },
      {
        title: 'Téléconsultation',
        badge: 'Vidéo',
        description: 'Proposez des consultations vidéo à vos patients.',
        steps: [
          'Activez l\'option téléconsultation dans vos paramètres',
          'Configurez vos créneaux dédiés aux téléconsultations',
          'Rejoignez la salle virtuelle à l\'heure convenue',
          'Envoyez l\'ordonnance numérique à l\'issue de la consultation',
        ],
      },
      {
        title: 'Facturation',
        badge: 'Finance',
        description: 'Suivez vos revenus et l\'historique de vos paiements.',
        steps: [
          'Consultez votre tableau de bord financier',
          'Suivez les consultations facturées et en attente',
          'Téléchargez vos relevés mensuels au format PDF',
          'Configurez vos informations bancaires pour les virements',
        ],
      },
    ],
  },
  'api': {
    slug: 'api',
    icon: <Server className="w-6 h-6" />,
    color: 'from-emerald-500 to-teal-400',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-600',
    title: 'API Documentation',
    subtitle: 'Intégrez Nexus Health dans vos applications et systèmes',
    intro: 'L\'API Nexus Health est une API REST moderne qui vous permet d\'accéder à toutes les fonctionnalités de la plateforme depuis vos propres applications. Authentification JWT, endpoints RESTful, webhooks en temps réel.',
    articles: [
      {
        title: 'Authentification',
        badge: 'Sécurité',
        description: 'Utilisez JWT pour authentifier vos requêtes API.',
        steps: [
          'POST /api/auth/register — Créer un compte',
          'POST /api/auth/login — Obtenir un token JWT',
          'Ajoutez Authorization: Bearer <token> à vos requêtes',
          'Le token expire après 7 jours — rafraîchissez-le',
        ],
      },
      {
        title: 'Endpoints principaux',
        badge: 'Référence',
        description: 'Liste complète des endpoints disponibles.',
        steps: [
          'GET /api/appointments — Liste des rendez-vous',
          'POST /api/appointments — Créer un rendez-vous',
          'GET /api/prescriptions — Ordonnances du patient',
          'GET /api/auth/me — Profil utilisateur connecté',
        ],
      },
      {
        title: 'Webhooks',
        badge: 'Temps réel',
        description: 'Recevez des notifications en temps réel pour les événements importants.',
        steps: [
          'Configurez une URL de webhook dans vos paramètres',
          'Sélectionnez les événements à surveiller',
          'Vérifiez la signature HMAC des requêtes entrantes',
          'Répondez avec HTTP 200 pour confirmer la réception',
        ],
      },
      {
        title: 'Rate limiting',
        badge: 'Performance',
        description: 'Limites de taux d\'appels à respecter.',
        steps: [
          '100 requêtes/minute par IP (plan gratuit)',
          '1000 requêtes/minute par token (plan pro)',
          'Header X-RateLimit-Remaining pour voir le quota restant',
          'HTTP 429 retourné en cas de dépassement',
        ],
      },
      {
        title: 'Exemples de code',
        badge: 'JavaScript',
        description: 'Intégrez l\'API en quelques lignes de code.',
        steps: [
          'const res = await fetch("/api/auth/login", { method: "POST", body: JSON.stringify({email, password}) })',
          'const { token } = await res.json()',
          'const appts = await fetch("/api/appointments", { headers: { Authorization: `Bearer ${token}` } })',
        ],
      },
    ],
  },
  'security': {
    slug: 'security',
    icon: <Lock className="w-6 h-6" />,
    color: 'from-red-500 to-orange-400',
    bgColor: 'bg-red-50',
    textColor: 'text-red-600',
    title: 'Sécurité',
    subtitle: 'La protection de vos données médicales est notre priorité absolue',
    intro: 'Nexus Health applique les standards de sécurité les plus stricts pour protéger vos données de santé sensibles. Chiffrement de bout en bout, conformité RGPD et certifications internationales.',
    articles: [
      {
        title: 'Chiffrement des données',
        badge: 'AES-256',
        description: 'Toutes vos données sont chiffrées au repos et en transit.',
        steps: [
          'Chiffrement AES-256 pour toutes les données au repos',
          'TLS 1.3 pour toutes les communications réseau',
          'Clés de chiffrement gérées par HSM (Hardware Security Module)',
          'Aucune donnée en clair dans nos bases de données',
        ],
      },
      {
        title: 'Conformité RGPD',
        badge: 'Europe',
        description: 'Nous respectons le Règlement Général sur la Protection des Données.',
        steps: [
          'Droit d\'accès : exportez toutes vos données à tout moment',
          'Droit à l\'effacement : supprimez votre compte et données',
          'Droit de rectification : corrigez vos informations',
          'Consentement explicite requis pour chaque usage de données',
        ],
      },
      {
        title: 'Politique de confidentialité',
        badge: 'Légal',
        description: 'Comment nous collectons, utilisons et protégeons vos données.',
        steps: [
          'Données collectées uniquement pour le service médical',
          'Aucune vente ni partage commercial de vos données',
          'Données hébergées en Europe (serveurs certifiés ISO 27001)',
          'Journalisation de tous les accès à votre dossier médical',
        ],
      },
      {
        title: 'Journalisation et audit',
        badge: 'Traçabilité',
        description: 'Chaque accès à vos données est enregistré.',
        steps: [
          'Log complet de chaque accès à votre dossier médical',
          'Notification en cas d\'accès inhabituel',
          'Audit trail disponible dans vos paramètres de sécurité',
          'Alertes connexion depuis un nouvel appareil ou pays',
        ],
      },
      {
        title: 'Certifications',
        badge: 'Validé',
        description: 'Certifications et conformités réglementaires.',
        steps: [
          'ISO 27001 — Sécurité de l\'information',
          'HDS — Hébergeur de Données de Santé (France)',
          'SOC 2 Type II — Contrôles de sécurité',
          'Tests de pénétration annuels par auditeurs indépendants',
        ],
      },
    ],
  },
  'mobile': {
    slug: 'mobile',
    icon: <Smartphone className="w-6 h-6" />,
    color: 'from-orange-500 to-amber-400',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-600',
    title: 'Applications mobiles',
    subtitle: 'Nexus Health sur iOS et Android, toujours dans votre poche',
    intro: 'Nos applications mobiles natives iOS et Android vous donnent accès à toutes les fonctionnalités de la plateforme, même hors ligne. Synchronisation automatique dès que vous retrouvez une connexion.',
    articles: [
      {
        title: 'Application iOS',
        badge: 'App Store',
        description: 'Téléchargez Nexus Health sur l\'App Store pour iPhone et iPad.',
        steps: [
          'Ouvrez l\'App Store sur votre iPhone/iPad',
          'Recherchez "Nexus Health" ou "Carnet Santé"',
          'Téléchargez l\'application (gratuite)',
          'Connectez-vous avec votre compte existant',
        ],
      },
      {
        title: 'Application Android',
        badge: 'Google Play',
        description: 'Disponible sur le Google Play Store pour tous les appareils Android.',
        steps: [
          'Ouvrez le Google Play Store',
          'Recherchez "Nexus Health"',
          'Installez l\'application (gratuite)',
          'Connectez-vous avec vos identifiants',
        ],
      },
      {
        title: 'Fonctionnalités hors ligne',
        badge: 'Sans connexion',
        description: 'Accédez à vos données même sans internet.',
        steps: [
          'Votre dossier médical est synchronisé automatiquement',
          'Consultez vos rendez-vous à venir sans connexion',
          'Vos ordonnances sont disponibles hors ligne',
          'Synchronisation automatique à la reconnexion',
        ],
      },
      {
        title: 'Notifications push',
        badge: 'Alertes',
        description: 'Configurez vos notifications sur mobile.',
        steps: [
          'Autorisez les notifications lors de la première ouverture',
          'Personnalisez les types de notifications dans Réglages',
          'Choisissez les horaires de réception des rappels',
          'Gérez les notifications par médecin ou type de RDV',
        ],
      },
      {
        title: 'Dépannage',
        badge: 'Support',
        description: 'Résolvez les problèmes courants sur mobile.',
        steps: [
          'Problème de connexion : vérifiez votre mot de passe et internet',
          'App lente : libérez de l\'espace de stockage',
          'Notifications absentes : vérifiez les autorisations système',
          'Contact support : oualoumidjeupisne@gmail.com',
        ],
      },
    ],
  },
  'integration': {
    slug: 'integration',
    icon: <Globe className="w-6 h-6" />,
    color: 'from-indigo-500 to-blue-400',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-600',
    title: 'Intégration',
    subtitle: 'Connectez Nexus Health à vos systèmes existants',
    intro: 'Nexus Health s\'intègre facilement dans votre écosystème de santé existant grâce à notre API REST ouverte et nos connecteurs pré-construits pour les systèmes les plus courants.',
    articles: [
      {
        title: 'Systèmes de santé',
        badge: 'Hôpitaux',
        description: 'Connectez Nexus Health à votre système d\'information hospitalier.',
        steps: [
          'Contactez notre équipe d\'intégration',
          'Obtenez vos clés API d\'entreprise',
          'Configurez la synchronisation des dossiers patients',
          'Testez l\'intégration dans l\'environnement sandbox',
        ],
      },
      {
        title: 'Dossier patient partagé',
        badge: 'Interopérabilité',
        description: 'Intégrez-vous avec les systèmes de DMP nationaux.',
        steps: [
          'Support du standard HL7 FHIR R4',
          'Connexion au Dossier Médical Partagé (DMP)',
          'Export/import au format CDA (Clinical Document Architecture)',
          'Synchronisation bidirectionnelle des données',
        ],
      },
      {
        title: 'Systèmes de paiement',
        badge: 'Finance',
        description: 'Intégrez vos solutions de paiement existantes.',
        steps: [
          'Support Mobile Money : T-Money, Flooz, MTN, Orange',
          'Virement bancaire (SEPA et local)',
          'Webhook de confirmation de paiement en temps réel',
          'Réconciliation automatique des paiements',
        ],
      },
      {
        title: 'Notifications et SMS',
        badge: 'Communication',
        description: 'Connectez vos services de messagerie.',
        steps: [
          'Intégration SMS via Twilio ou opérateurs locaux',
          'Email transactionnel via Brevo / SMTP',
          'Personnalisation des templates de messages',
          'Gestion des désinscriptions (RGPD)',
        ],
      },
      {
        title: 'Calendriers',
        badge: 'Synchronisation',
        description: 'Synchronisez avec Google Calendar, Outlook et iCal.',
        steps: [
          'OAuth2 pour Google Calendar et Outlook',
          'Export iCal (.ics) pour tous les calendriers',
          'Synchronisation bidirectionnelle des rendez-vous',
          'Gestion des conflits de disponibilité',
        ],
      },
    ],
  },
};

// ─── FAQ Item ─────────────────────────────────────────────────────────────────
const ArticleCard: React.FC<{ article: typeof DOC_SECTIONS['user-guide']['articles'][0]; color: string; textColor: string }> = ({ article, color, textColor }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white/80 backdrop-blur rounded-2xl border border-white shadow-lg overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50/50 transition-colors">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-black text-slate-900">{article.title}</h3>
              {article.badge && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${textColor} bg-opacity-10`}
                  style={{ backgroundColor: 'rgba(99,102,241,0.1)' }}>
                  {article.badge}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 font-semibold">{article.description}</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-slate-400 shrink-0 ml-4" /> : <ChevronDown className="w-5 h-5 text-slate-400 shrink-0 ml-4" />}
      </button>
      {open && article.steps && (
        <div className="px-6 pb-6 border-t border-gray-100">
          <ol className="space-y-3 mt-4">
            {article.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className={`w-6 h-6 bg-gradient-to-br ${color} rounded-lg flex items-center justify-center shrink-0 shadow-sm mt-0.5`}>
                  <span className="text-white text-xs font-black">{i + 1}</span>
                </div>
                <span className="text-slate-700 font-semibold text-sm leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};

// ─── Composant principal ──────────────────────────────────────────────────────
const DocPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const section = slug ? DOC_SECTIONS[slug] : null;

  if (!section) return <Navigate to="/docs" replace />;

  const otherSections = Object.values(DOC_SECTIONS).filter(s => s.slug !== slug);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">

      {/* Nav */}
      <nav className="backdrop-blur-xl bg-white/70 sticky top-0 z-50 border-b border-white/50 shadow-lg shadow-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-all duration-500"></div>
                <div className="relative bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-2.5 rounded-2xl shadow-lg">
                  <HeartPulse className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <span className="font-black text-lg bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                NEXUS HEALTH
              </span>
            </Link>
            <Link to="/docs"
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-blue-600 hover:bg-white/70 rounded-xl transition-all text-sm font-bold">
              <ArrowLeft className="w-4 h-4" />
              Documentation
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className={`${section.bgColor} border-b border-white/50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-sm text-slate-500 font-semibold mb-8">
              <Link to="/" className="hover:text-blue-600 transition-colors">Accueil</Link>
              <ChevronRight className="w-3 h-3" />
              <Link to="/docs" className="hover:text-blue-600 transition-colors">Documentation</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-slate-800">{section.title}</span>
            </div>
            <div className={`inline-flex bg-gradient-to-br ${section.color} rounded-2xl p-3.5 shadow-xl mb-5`}>
              <div className="text-white">{section.icon}</div>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 leading-tight">{section.title}</h1>
            <p className="text-xl text-slate-600 font-bold mb-6">{section.subtitle}</p>
            <p className="text-slate-500 text-lg leading-relaxed">{section.intro}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Articles */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-slate-400" />
              {section.articles.length} articles dans ce guide
            </h2>
            {section.articles.map((article, i) => (
              <ArticleCard key={i} article={article} color={section.color} textColor={section.textColor} />
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Autres sections */}
            <div className="bg-white/80 backdrop-blur rounded-2xl border border-white shadow-lg p-6">
              <h3 className="font-black text-slate-900 mb-4 text-sm uppercase tracking-wider">Autres guides</h3>
              <div className="space-y-2">
                {otherSections.map(s => (
                  <Link key={s.slug} to={`/docs/${s.slug}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all group">
                    <div className={`w-8 h-8 bg-gradient-to-br ${s.color} rounded-lg flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform`}>
                      <div className="text-white scale-75">{s.icon}</div>
                    </div>
                    <span className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{s.title}</span>
                    <ChevronRight className="w-3 h-3 text-slate-300 ml-auto group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Aide */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
              <h3 className="font-black mb-2">Besoin d'aide ?</h3>
              <p className="text-white/80 text-sm font-semibold mb-4">Notre équipe support est disponible pour répondre à vos questions.</p>
              <a href="mailto:oualoumidjeupisne@gmail.com"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-black transition-all">
                <ExternalLink className="w-4 h-4" />
                Contacter le support
              </a>
            </div>

            {/* Checklist rapide */}
            <div className="bg-white/80 backdrop-blur rounded-2xl border border-white shadow-lg p-6">
              <h3 className="font-black text-slate-900 mb-4 text-sm uppercase tracking-wider">Points clés</h3>
              <ul className="space-y-2">
                {section.articles.map((a, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-600 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    {a.title}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocPage;
