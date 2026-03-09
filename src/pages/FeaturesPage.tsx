import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Building2, 
  Bell, 
  Stethoscope, 
  Shield,
  ArrowLeft,
  Video,
  Clock,
  CheckCircle2,
  ChevronRight,
  HeartPulse
} from 'lucide-react';

const FeaturesPage: React.FC = () => {
  const features = [
    {
      id: 'appointments',
      icon: <Calendar className="w-6 h-6" />,
      title: "Gestion des rendez-vous",
      description: "Prenez, modifiez ou annulez vos rendez-vous en ligne en quelques clics.",
      color: "bg-blue-100",
      textColor: "text-blue-600",
      details: [
        "Prise de RDV 24h/24",
        "Rappels automatiques",
        "Annulation en ligne",
        "Historique complet"
      ]
    },
    {
      id: 'medical-record',
      icon: <Building2 className="w-6 h-6" />,
      title: "Dossier médical",
      description: "Accédez à votre dossier médical complet, où que vous soyez.",
      color: "bg-purple-100",
      textColor: "text-purple-600",
      details: [
        "Documents sécurisés",
        "Partage contrôlé",
        "Historique médical",
        "Résultats d'analyses"
      ]
    },
    {
      id: 'reminders',
      icon: <Bell className="w-6 h-6" />,
      title: "Rappels intelligents",
      description: "Recevez des notifications pour vos rendez-vous et traitements.",
      color: "bg-emerald-100",
      textColor: "text-emerald-600",
      details: [
        "Rappels personnalisés",
        "Notifications push",
        "Rappels SMS",
        "Alertes préventives"
      ]
    },
    {
      id: 'teleconsultation',
      icon: <Video className="w-6 h-6" />,
      title: "Téléconsultation",
      description: "Consultez vos médecins à distance en toute sécurité.",
      color: "bg-orange-100",
      textColor: "text-orange-600",
      details: [
        "Visioconférence HD",
        "Partage d'écran",
        "Envoi de documents",
        "Consultations en direct"
      ]
    },
    {
      id: 'availability',
      icon: <Clock className="w-6 h-6" />,
      title: "Disponible 24/7",
      description: "Accédez à vos informations à tout moment, partout.",
      color: "bg-indigo-100",
      textColor: "text-indigo-600",
      details: [
        "Accès permanent",
        "Support réactif",
        "Mises à jour temps réel",
        "Disponible partout"
      ]
    },
    {
      id: 'security',
      icon: <Shield className="w-6 h-6" />,
      title: "Sécurité maximale",
      description: "Vos données sont protégées par les plus hauts standards.",
      color: "bg-red-100",
      textColor: "text-red-600",
      details: [
        "Chiffrement AES-256",
        "Conformité RGPD",
        "Double authentification",
        "Audit régulier"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20">
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center">
                <HeartPulse className="w-4 h-4 text-white" />
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
            Fonctionnalités
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Découvrez toutes les fonctionnalités de notre plateforme pour gérer votre santé en toute simplicité
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.id}
              id={feature.id}
              className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all border border-gray-200 overflow-hidden scroll-mt-20 group"
            >
              <div className="p-6">
                <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <div className={feature.textColor}>
                    {feature.icon}
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {feature.description}
                </p>

                <div className="space-y-2 mb-5">
                  {feature.details.map((detail, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-500">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>

                <Link
                  to="/register"
                  className={`inline-flex items-center gap-1 text-sm font-semibold ${feature.textColor} hover:gap-2 transition-all`}
                >
                  Commencer
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Section CTA */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Prêt à commencer ?
          </h2>
          <p className="text-white/90 mb-6">
            Rejoignez des milliers d'utilisateurs satisfaits
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:shadow-lg transition-all group"
          >
            Créer un compte gratuit
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FeaturesPage;
