import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useNotification } from '../../context/NotificationContext'

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'patient' as 'patient' | 'doctor',
    dateOfBirth: '',
    gender: 'male' as 'male' | 'female' | 'other',
    phoneNumber: '',
    specialty: '',
    licenseNumber: '',
    biography: '',
    languages: [] as string[],
    bloodType: '' as '' | 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const { register } = useAuth()
  const { showNotification } = useNotification()
  const navigate = useNavigate()

  const [currentLanguage, setCurrentLanguage] = useState('')

  // ── Regex : lettres uniquement (accents inclus) ──────────────────────────
  const LETTERS_ONLY = /^[a-zA-ZÀ-ÿÀ-ÖØ-öø-ÿ\s'\-]+$/

  // ── Listes déroulantes ────────────────────────────────────────────────────
  const SPECIALTIES = [
    'Généraliste','Médecine générale','Cardiologie','Dermatologie','Neurologie',
    'Pédiatrie','Gynécologie','Ophtalmologie','ORL','Psychiatrie','Psychologue',
    'Dentiste','Chirurgien','Radiologue','Anesthésiste','Urgentiste','Rhumatologue',
    'Endocrinologue','Gastro-entérologue','Urologue','Néphrologue','Pneumologue',
    'Hématologue','Oncologue','Médecin du sport','Nutritionniste','Kinésithérapeute',
    'Orthophoniste','Podologue','Ostéopathe','Acupuncteur','Homéopathe',
    'Médecin esthétique','Médecin du travail','Allergologue','Immunologue',
    'Infectiologue','Médecin interniste','Gériatre','Médecin vasculaire','Généticien',
    'Médecin tropical','Gynécologue-obstétricien',
  ]

  const LANGUAGES_LIST = [
    'Français','Anglais','Arabe','Espagnol','Portugais','Allemand','Italien',
    'Néerlandais','Russe','Chinois (mandarin)','Japonais','Coréen','Hindi',
    'Haoussa','Yoruba','Igbo','Amharique','Swahili','Wolof','Bambara','Mooré',
    'Éwé','Fon','Twi','Lingala','Kirundi','Kinyarwanda','Somalien','Tigrigna',
    'Afrikaans','Malagasy','Créole haïtien','Turc','Persan','Hébreu',
  ]

  const [specialtySearch, setSpecialtySearch]           = useState('')
  const [showSpecialtyDropdown, setShowSpecialtyDropdown] = useState(false)
  const [showLangDropdown, setShowLangDropdown]           = useState(false)
  const [langSearch, setLangSearch]                       = useState('')

  const filteredSpecialties = SPECIALTIES.filter(s =>
    s.toLowerCase().includes(specialtySearch.toLowerCase())
  )
  const filteredLanguages = LANGUAGES_LIST.filter(
    l => l.toLowerCase().includes(langSearch.toLowerCase()) && !formData.languages.includes(l)
  )

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validation prénom
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis'
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'Le prénom doit contenir au moins 2 caractères'
    } else if (!LETTERS_ONLY.test(formData.firstName.trim())) {
      newErrors.firstName = 'Le prénom ne peut contenir que des lettres'
    }

    // Validation nom
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Le nom est requis'
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Le nom doit contenir au moins 2 caractères'
    } else if (!LETTERS_ONLY.test(formData.lastName.trim())) {
      newErrors.lastName = 'Le nom ne peut contenir que des lettres'
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email) {
      newErrors.email = "L'email est requis"
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Format d'email invalide"
    }

    // Validation date de naissance
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'La date de naissance est requise'
    } else {
      const birthDate = new Date(formData.dateOfBirth)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--
      if (age < 16) {
        newErrors.dateOfBirth = `Vous devez avoir au moins 16 ans (actuellement: ${age} ans)`
      } else if (age > 120) {
        newErrors.dateOfBirth = 'Date de naissance invalide'
      }
    }

    // Validation mot de passe
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères'
    }

    // Validation téléphone
    if (formData.phoneNumber && !/^\+?[\d\s\-\(\)]{10,}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
      newErrors.phoneNumber = 'Format de téléphone invalide'
    }

    // Validation groupe sanguin
    if (formData.bloodType && !['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].includes(formData.bloodType)) {
      newErrors.bloodType = 'Groupe sanguin invalide'
    }

    // Validation médecin
    if (formData.role === 'doctor') {
      if (!formData.specialty.trim()) newErrors.specialty = 'La spécialité est requise'
      if (!formData.licenseNumber.trim()) {
        newErrors.licenseNumber = 'Le numéro de licence est requis'
      } else if (formData.licenseNumber.trim().length < 3) {
        newErrors.licenseNumber = 'Le numéro de licence doit contenir au moins 3 caractères'
      }
      const bioLength = formData.biography.trim().length
      if (!formData.biography.trim()) {
        newErrors.biography = 'La biographie est requise'
      } else if (bioLength < 50) {
        newErrors.biography = `La biographie doit contenir au moins 50 caractères (actuellement: ${bioLength})`
      }
      if (formData.languages.length === 0) newErrors.languages = 'Au moins une langue doit être spécifiée'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ── handleChange : filtre les chiffres/caractères spéciaux pour prénom/nom ─
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    // Bloquer tout caractère non-lettre pour prénom et nom
    if (name === 'firstName' || name === 'lastName') {
      // Autoriser : lettres (y compris accentuées), espaces, tirets, apostrophes
      const filtered = value.replace(/[^a-zA-ZÀ-ÿÀ-ÖØ-öø-ÿ\s'\-]/g, '')
      setFormData(prev => ({ ...prev, [name]: filtered }))
      if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
      return
    }

    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleLanguageAdd = () => {
    if (currentLanguage.trim() && !formData.languages.includes(currentLanguage.trim())) {
      setFormData(prev => ({ ...prev, languages: [...prev.languages, currentLanguage.trim()] }))
      setCurrentLanguage('')
      if (errors.languages) setErrors(prev => ({ ...prev, languages: '' }))
    }
  }

  const handleLanguageRemove = (languageToRemove: string) => {
    setFormData(prev => ({ ...prev, languages: prev.languages.filter(lang => lang !== languageToRemove) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
      showNotification('Veuillez corriger les erreurs dans le formulaire', 'error')
      return
    }
    setIsLoading(true)
    try {
      const submitData: any = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        role: formData.role,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
      }
      if (formData.phoneNumber.trim()) submitData.phoneNumber = formData.phoneNumber.trim()
      if (formData.bloodType) submitData.bloodType = formData.bloodType
      if (formData.role === 'doctor') {
        submitData.specialty = formData.specialty.trim()
        submitData.licenseNumber = formData.licenseNumber.trim()
        submitData.biography = formData.biography.trim()
        submitData.languages = formData.languages
      }
      await register(submitData)
      showNotification('Compte créé avec succès!', 'success')
      navigate('/dashboard')
    } catch (error: any) {
      if (error.response?.data?.errors) {
        const apiErrors = error.response.data.errors
        const fieldErrors: Record<string, string> = {}
        if (Array.isArray(apiErrors)) {
          apiErrors.forEach((err: any) => { if (err.field) fieldErrors[err.field] = err.message })
        } else if (typeof apiErrors === 'object') {
          Object.keys(apiErrors).forEach(key => { fieldErrors[key] = apiErrors[key] })
        }
        setErrors(fieldErrors)
        showNotification('Erreur lors de la création du compte', 'error')
      } else {
        showNotification(error.response?.data?.message || 'Erreur lors de la création du compte', 'error')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const getMaxBirthDate = () => {
    const today = new Date()
    return new Date(today.getFullYear() - 16, today.getMonth(), today.getDate()).toISOString().split('T')[0]
  }
  const getMinBirthDate = () => {
    const today = new Date()
    return new Date(today.getFullYear() - 120, today.getMonth(), today.getDate()).toISOString().split('T')[0]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-2xl w-full relative z-10">
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-8 md:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center space-x-2 mb-6 cursor-pointer group" onClick={() => navigate('/')}>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform">
                <span className="text-2xl">⚕️</span>
              </div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">NEXUS HEALTH</h1>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Créer un compte</h2>
            <p className="text-white/70 text-sm">Rejoignez notre plateforme de santé connectée</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {/* Infos personnelles */}
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Prénom */}
                <div>
                  <label htmlFor="firstName" className="block text-sm font-semibold text-white/90 mb-2">Prénom *</label>
                  <input
                    id="firstName" name="firstName" type="text" required
                    value={formData.firstName} onChange={handleChange}
                    className={`w-full px-4 py-3 text-white bg-white/5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm transition-all placeholder-white/40 ${errors.firstName ? 'border-red-500/70 ring-2 ring-red-500/30' : 'border-white/20'}`}
                    placeholder="Votre prénom"
                  />
                  {errors.firstName && <p className="mt-1.5 text-xs text-red-300 flex items-center"><span className="mr-1">⚠</span> {errors.firstName}</p>}
                  <p className="mt-1 text-xs text-white/40">Lettres uniquement (pas de chiffres)</p>
                </div>

                {/* Nom */}
                <div>
                  <label htmlFor="lastName" className="block text-sm font-semibold text-white/90 mb-2">Nom *</label>
                  <input
                    id="lastName" name="lastName" type="text" required
                    value={formData.lastName} onChange={handleChange}
                    className={`w-full px-4 py-3 text-white bg-white/5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm transition-all placeholder-white/40 ${errors.lastName ? 'border-red-500/70 ring-2 ring-red-500/30' : 'border-white/20'}`}
                    placeholder="Votre nom"
                  />
                  {errors.lastName && <p className="mt-1.5 text-xs text-red-300 flex items-center"><span className="mr-1">⚠</span> {errors.lastName}</p>}
                  <p className="mt-1 text-xs text-white/40">Lettres uniquement (pas de chiffres)</p>
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-white/90 mb-2">Adresse email *</label>
                <input
                  id="email" name="email" type="email" required
                  value={formData.email} onChange={handleChange} autoComplete="email"
                  className={`w-full px-4 py-3 text-white bg-white/5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm transition-all placeholder-white/40 ${errors.email ? 'border-red-500/70 ring-2 ring-red-500/30' : 'border-white/20'}`}
                  placeholder="vous@exemple.com"
                />
                {errors.email && <p className="mt-1.5 text-xs text-red-300 flex items-center"><span className="mr-1">⚠</span> {errors.email}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date de naissance */}
                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-semibold text-white/90 mb-2">Date de naissance *</label>
                  <input
                    id="dateOfBirth" name="dateOfBirth" type="date" required
                    value={formData.dateOfBirth} onChange={handleChange}
                    min={getMinBirthDate()} max={getMaxBirthDate()}
                    className={`w-full px-4 py-3 text-white bg-white/5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm transition-all ${errors.dateOfBirth ? 'border-red-500/70 ring-2 ring-red-500/30' : 'border-white/20'}`}
                  />
                  {errors.dateOfBirth && <p className="mt-1.5 text-xs text-red-300 flex items-center"><span className="mr-1">⚠</span> {errors.dateOfBirth}</p>}
                </div>

                {/* Genre */}
                <div>
                  <label htmlFor="gender" className="block text-sm font-semibold text-white/90 mb-2">Genre *</label>
                  <select id="gender" name="gender" required value={formData.gender} onChange={handleChange}
                    className="w-full px-4 py-3 text-white bg-white/5 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm transition-all">
                    <option value="male" className="bg-gray-800">Homme</option>
                    <option value="female" className="bg-gray-800">Femme</option>
                    <option value="other" className="bg-gray-800">Autre</option>
                  </select>
                </div>
              </div>

              {/* Téléphone */}
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-semibold text-white/90 mb-2">Téléphone</label>
                <input
                  id="phoneNumber" name="phoneNumber" type="tel"
                  value={formData.phoneNumber} onChange={handleChange}
                  className={`w-full px-4 py-3 text-white bg-white/5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm transition-all placeholder-white/40 ${errors.phoneNumber ? 'border-red-500/70 ring-2 ring-red-500/30' : 'border-white/20'}`}
                  placeholder="+228 90 00 00 00"
                />
                {errors.phoneNumber && <p className="mt-1.5 text-xs text-red-300 flex items-center"><span className="mr-1">⚠</span> {errors.phoneNumber}</p>}
              </div>

              {/* Rôle */}
              <div>
                <label htmlFor="role" className="block text-sm font-semibold text-white/90 mb-2">Je suis *</label>
                <select id="role" name="role" required value={formData.role} onChange={handleChange}
                  className="w-full px-4 py-3 text-white bg-white/5 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm transition-all">
                  <option value="patient" className="bg-gray-800">Patient</option>
                  <option value="doctor" className="bg-gray-800">Médecin</option>
                </select>
              </div>
            </div>

            {/* Champs médecin */}
            {formData.role === 'doctor' && (
              <div className="space-y-5 pt-4 border-t border-white/10">
                <h3 className="text-lg font-semibold text-white/90 flex items-center"><span className="mr-2">👨‍⚕️</span>Informations professionnelles</h3>

                <div className="relative">
                  <label htmlFor="specialty" className="block text-sm font-semibold text-white/90 mb-2">Spécialité médicale *</label>
                  <div className="relative">
                    <input
                      id="specialty" name="specialty" type="text" autoComplete="off"
                      value={specialtySearch || formData.specialty}
                      onFocus={() => { setShowSpecialtyDropdown(true); setSpecialtySearch('') }}
                      onChange={(e) => {
                        setSpecialtySearch(e.target.value)
                        setFormData(prev => ({ ...prev, specialty: e.target.value }))
                        if (errors.specialty) setErrors(prev => ({ ...prev, specialty: '' }))
                      }}
                      onBlur={() => setTimeout(() => setShowSpecialtyDropdown(false), 150)}
                      className={`w-full px-4 py-3 pr-10 text-white bg-white/5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm transition-all placeholder-white/40 ${errors.specialty ? 'border-red-500/70 ring-2 ring-red-500/30' : 'border-white/20'}`}
                      placeholder="Rechercher une spécialité…"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">▾</span>
                  </div>
                  {showSpecialtyDropdown && filteredSpecialties.length > 0 && (
                    <ul className="absolute z-50 left-0 right-0 mt-1 max-h-52 overflow-y-auto rounded-xl border border-white/20 bg-indigo-950/95 backdrop-blur-xl shadow-2xl">
                      {filteredSpecialties.map(s => (
                        <li key={s}
                          onMouseDown={() => {
                            setFormData(prev => ({ ...prev, specialty: s }))
                            setSpecialtySearch('')
                            setShowSpecialtyDropdown(false)
                            if (errors.specialty) setErrors(prev => ({ ...prev, specialty: '' }))
                          }}
                          className={`px-4 py-2.5 text-sm cursor-pointer transition-colors hover:bg-purple-500/30 text-white/90 ${formData.specialty === s ? 'bg-purple-500/20 font-semibold text-purple-200' : ''}`}
                        >
                          {s}
                        </li>
                      ))}
                    </ul>
                  )}
                  {errors.specialty && <p className="mt-1.5 text-xs text-red-300 flex items-center"><span className="mr-1">⚠</span> {errors.specialty}</p>}
                </div>

                <div>
                  <label htmlFor="licenseNumber" className="block text-sm font-semibold text-white/90 mb-2">Numéro de licence médicale *</label>
                  <input id="licenseNumber" name="licenseNumber" type="text" required value={formData.licenseNumber} onChange={handleChange}
                    className={`w-full px-4 py-3 text-white bg-white/5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm transition-all placeholder-white/40 ${errors.licenseNumber ? 'border-red-500/70 ring-2 ring-red-500/30' : 'border-white/20'}`}
                    placeholder="Votre numéro de licence"/>
                  {errors.licenseNumber && <p className="mt-1.5 text-xs text-red-300 flex items-center"><span className="mr-1">⚠</span> {errors.licenseNumber}</p>}
                </div>

                <div className="relative">
                  <label className="block text-sm font-semibold text-white/90 mb-2">Langues parlées *</label>
                  <div className="relative">
                    <input
                      type="text" value={langSearch} autoComplete="off"
                      onFocus={() => setShowLangDropdown(true)}
                      onChange={(e) => { setLangSearch(e.target.value); setShowLangDropdown(true) }}
                      onBlur={() => setTimeout(() => setShowLangDropdown(false), 150)}
                      className="w-full px-4 py-3 pr-10 text-white bg-white/5 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm transition-all placeholder-white/40"
                      placeholder="Rechercher et ajouter une langue…"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">▾</span>
                  </div>

                  {showLangDropdown && filteredLanguages.length > 0 && (
                    <ul className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl border border-white/20 bg-indigo-950/95 backdrop-blur-xl shadow-2xl">
                      {filteredLanguages.map(l => (
                        <li key={l}
                          onMouseDown={() => {
                            setFormData(prev => ({ ...prev, languages: [...prev.languages, l] }))
                            setLangSearch('')
                            if (errors.languages) setErrors(prev => ({ ...prev, languages: '' }))
                          }}
                          className="px-4 py-2.5 text-sm cursor-pointer transition-colors hover:bg-purple-500/30 text-white/90"
                        >
                          {l}
                        </li>
                      ))}
                    </ul>
                  )}

                  {formData.languages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.languages.map((language, index) => (
                        <span key={index} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-purple-400/30 text-purple-200 text-sm font-medium">
                          {language}
                          <button type="button" onClick={() => handleLanguageRemove(language)} className="text-red-300 hover:text-red-200 font-bold">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                  {errors.languages && <p className="mt-1.5 text-xs text-red-300 flex items-center"><span className="mr-1">⚠</span> {errors.languages}</p>}
                  <p className="mt-1.5 text-xs text-white/40">Sélectionnez une ou plusieurs langues dans la liste</p>
                </div>

                <div>
                  <label htmlFor="biography" className="block text-sm font-semibold text-white/90 mb-2">Biographie professionnelle *</label>
                  <textarea id="biography" name="biography" required value={formData.biography} onChange={handleChange} rows={4}
                    className={`w-full px-4 py-3 text-white bg-white/5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm transition-all placeholder-white/40 resize-none ${errors.biography ? 'border-red-500/70 ring-2 ring-red-500/30' : 'border-white/20'}`}
                    placeholder="Décrivez votre parcours professionnel, vos compétences et votre expérience..."/>
                  {errors.biography && <p className="mt-1.5 text-xs text-red-300 flex items-center"><span className="mr-1">⚠</span> {errors.biography}</p>}
                  <p className="mt-1.5 text-xs text-white/50">{formData.biography.trim().length}/50 caractères minimum</p>
                </div>
              </div>
            )}

            {/* Infos complémentaires */}
            <div className="space-y-5 pt-4 border-t border-white/10">
              <h3 className="text-lg font-semibold text-white/90">Informations complémentaires <span className="text-sm font-normal text-white/50 ml-2">(optionnel)</span></h3>
              <div>
                <label htmlFor="bloodType" className="block text-sm font-semibold text-white/90 mb-2">Groupe sanguin</label>
                <select id="bloodType" name="bloodType" value={formData.bloodType} onChange={handleChange}
                  className={`w-full px-4 py-3 text-white bg-white/5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm transition-all ${errors.bloodType ? 'border-red-500/70 ring-2 ring-red-500/30' : 'border-white/20'}`}>
                  <option value="" className="bg-gray-800">Sélectionnez votre groupe sanguin</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => <option key={g} value={g} className="bg-gray-800">{g}</option>)}
                </select>
                {errors.bloodType && <p className="mt-1.5 text-xs text-red-300 flex items-center"><span className="mr-1">⚠</span> {errors.bloodType}</p>}
              </div>
            </div>

            {/* Mot de passe */}
            <div className="pt-4 border-t border-white/10">
              <label htmlFor="password" className="block text-sm font-semibold text-white/90 mb-2">Mot de passe *</label>
              <input id="password" name="password" type="password" required
                value={formData.password} onChange={handleChange} autoComplete="new-password"
                className={`w-full px-4 py-3 text-white bg-white/5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm transition-all placeholder-white/40 ${errors.password ? 'border-red-500/70 ring-2 ring-red-500/30' : 'border-white/20'}`}
                placeholder="Minimum 6 caractères"/>
              {errors.password && <p className="mt-1.5 text-xs text-red-300 flex items-center"><span className="mr-1">⚠</span> {errors.password}</p>}
            </div>

            {/* Boutons */}
            <div className="flex flex-col gap-3 pt-4">
              <button type="submit" disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold py-3.5 px-4 rounded-xl hover:shadow-lg hover:shadow-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]">
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    <span>Création du compte...</span>
                  </div>
                ) : 'Créer mon compte'}
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/20"></div></div>
                <div className="relative flex justify-center text-sm"><span className="px-4 bg-transparent text-white/60">Vous avez déjà un compte ?</span></div>
              </div>

              <button type="button" onClick={() => navigate('/login')}
                className="w-full backdrop-blur-sm bg-white/5 hover:bg-white/10 border border-white/20 text-white font-medium py-3 px-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]">
                Se connecter
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6">
          <button onClick={() => navigate('/')}
            className="w-full backdrop-blur-sm bg-white/5 hover:bg-white/10 border border-white/20 text-white font-medium py-3 px-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]">
            ← Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  )
}

export default Register
