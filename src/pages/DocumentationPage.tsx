import React from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  ArrowLeft,
  Code,
  Users,
  Shield,
  Zap,
  Globe,
  Smartphone,
  Server,
  Lock,
  ChevronRight
} from 'lucide-react';

const DocumentationPage: React.FC = () => {
  const sections = [
    {
      title: 'Guide utilisateur',
      slug: 'user-guide',
      icon: <Users className="w-5 h-5" />,
      color: 'bg-blue-100',
      textColor: 'text-blue-600',
      description: 'Apprenez à utiliser toutes les fonctionnalités de la plateforme',
      links: [
        { label: 'Premiers pas',               slug: 'user-guide'   },
        { label: 'Gestion des rendez-vous',    slug: 'user-guide'   },
        { label: 'Dossier médical',            slug: 'user-guide'   },
        { label: 'Téléconsultation',           slug: 'user-guide'   },
        { label: 'Profil et préférences',      slug: 'user-guide'   },
      ],
    },
    {
      title: 'Guide médecin',
      slug: 'doctor-guide',
      icon: <Code className="w-5 h-5" />,
      color: 'bg-purple-100',
      textColor: 'text-purple-600',
      description: 'Configurez votre compte et gérez vos patients',
      links: [
        { label: 'Configuration du compte',   slug: 'doctor-guide' },
        { label: 'Gestion des patients',       slug: 'doctor-guide' },
        { label: 'Calendrier et disponibilités', slug: 'doctor-guide' },
        { label: 'Téléconsultation',           slug: 'doctor-guide' },
        { label: 'Facturation',                slug: 'doctor-guide' },
      ],
    },
    {
      title: 'API Documentation',
      slug: 'api',
      icon: <Server className="w-5 h-5" />,
      color: 'bg-emerald-100',
      textColor: 'text-emerald-600',
      description: 'Intégrez notre API dans vos applications',
      links: [
        { label: 'Authentification',           slug: 'api' },
        { label: 'Endpoints',                  slug: 'api' },
        { label: 'Webhooks',                   slug: 'api' },
        { label: 'Rate limiting',              slug: 'api' },
        { label: 'Exemples de code',           slug: 'api' },
      ],
    },
    {
      title: 'Sécurité',
      slug: 'security',
      icon: <Lock className="w-5 h-5" />,
      color: 'bg-red-100',
      textColor: 'text-red-600',
      description: 'Comprendre nos mesures de sécurité',
      links: [
        { label: 'Chiffrement des données',    slug: 'security' },
        { label: 'RGPD',                       slug: 'security' },
        { label: 'Politique de confidentialité', slug: 'security' },
        { label: 'Journalisation',             slug: 'security' },
        { label: 'Certifications',             slug: 'security' },
      ],
    },
    {
      title: 'Applications mobiles',
      slug: 'mobile',
      icon: <Smartphone className="w-5 h-5" />,
      color: 'bg-orange-100',
      textColor: 'text-orange-600',
      description: 'Utilisez nos applications iOS et Android',
      links: [
        { label: 'iOS',                        slug: 'mobile' },
        { label: 'Android',                    slug: 'mobile' },
        { label: 'Installation',               slug: 'mobile' },
        { label: 'Mise à jour',                slug: 'mobile' },
        { label: 'Dépannage',                  slug: 'mobile' },
      ],
    },
    {
      title: 'Intégration',
      slug: 'integration',
      icon: <Globe className="w-5 h-5" />,
      color: 'bg-indigo-100',
      textColor: 'text-indigo-600',
      description: 'Intégrez nos services dans votre système',
      links: [
        { label: 'Systèmes de santé',          slug: 'integration' },
        { label: 'Dossier patient',            slug: 'integration' },
        { label: 'Paiements',                  slug: 'integration' },
        { label: 'Notifications',              slug: 'integration' },
        { label: 'Calendriers',                slug: 'integration' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20">
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">Carnet Santé</span>
            </Link>
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Documentation
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Tout ce dont vous avez besoin pour utiliser et intégrer notre plateforme
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all border border-gray-200 overflow-hidden group"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 ${section.color} rounded-lg flex items-center justify-center`}>
                    <div className={section.textColor}>
                      {section.icon}
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900">{section.title}</h3>
                </div>

                <p className="text-sm text-gray-500 mb-4">
                  {section.description}
                </p>

                {/* Liens cliquables vers la page de la section */}
                <ul className="space-y-2">
                  {section.links.slice(0, 3).map((link, idx) => (
                    <li key={idx}>
                      <Link
                        to={`/docs/${link.slug}`}
                        className="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-2 group/link"
                      >
                        <span className="w-1 h-1 bg-gray-300 group-hover/link:bg-blue-400 rounded-full transition-colors shrink-0"></span>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>

                {/* Bouton "Voir plus" cliquable */}
                <Link
                  to={`/docs/${section.slug}`}
                  className="mt-4 flex items-center gap-1 text-sm text-blue-600 hover:gap-2 transition-all font-medium"
                >
                  <span>Voir plus</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Start */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-2xl p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Démarrage rapide</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { n: '1.', title: 'Créez un compte', desc: 'Inscrivez-vous gratuitement en quelques clics', to: '/register' },
              { n: '2.', title: 'Configurez votre profil', desc: 'Renseignez vos informations personnelles', to: '/docs/user-guide' },
              { n: '3.', title: 'Commencez à utiliser', desc: 'Prenez vos premiers rendez-vous', to: '/docs/user-guide' },
            ].map(({ n, title, desc, to }) => (
              <Link key={n} to={to}
                className="bg-white/10 hover:bg-white/20 rounded-xl p-4 backdrop-blur transition-all group">
                <div className="text-2xl font-bold text-white mb-2">{n}</div>
                <h3 className="font-semibold text-white mb-1 group-hover:underline">{title}</h3>
                <p className="text-sm text-white/80">{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentationPage;
