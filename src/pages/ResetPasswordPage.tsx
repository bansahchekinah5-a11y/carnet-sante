// pages/ResetPasswordPage.tsx
import React, { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'https://carnet-sante-backend.onrender.com/api'

const ResetPasswordPage: React.FC = () => {
  const [searchParams]              = useSearchParams()
  const navigate                    = useNavigate()
  const token                       = searchParams.get('token')

  const [password, setPassword]     = useState('')
  const [confirm, setConfirm]       = useState('')
  const [showPwd, setShowPwd]       = useState(false)
  const [status, setStatus]         = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage]       = useState('')

  // Token absent = lien invalide
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center space-y-4">
          <span className="text-5xl">⚠️</span>
          <h2 className="text-xl font-bold text-gray-800">Lien invalide</h2>
          <p className="text-gray-500 text-sm">Ce lien de réinitialisation est invalide ou a expiré.</p>
          <Link
            to="/forgot-password"
            className="block w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Faire une nouvelle demande
          </Link>
        </div>
      </div>
    )
  }

  const passwordsMatch = password === confirm
  const passwordValid  = password.length >= 6

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordValid || !passwordsMatch) return

    setStatus('loading')
    try {
      await axios.post(`${API_URL}/auth/reset-password`, { token, password })
      setStatus('success')
      setMessage('Votre mot de passe a été réinitialisé avec succès.')
      setTimeout(() => navigate('/login'), 3000)
    } catch (err: any) {
      setStatus('error')
      setMessage(
        err?.response?.data?.message ||
        'Lien expiré ou invalide. Veuillez refaire une demande.'
      )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8">

        {/* Logo */}
        <div className="text-center mb-6">
          <span className="text-4xl">🏥</span>
          <h1 className="mt-2 text-2xl font-bold text-blue-600">Carnet Santé</h1>
          <h2 className="mt-1 text-lg font-semibold text-gray-800">Nouveau mot de passe</h2>
          <p className="mt-1 text-sm text-gray-500">Choisissez un mot de passe sécurisé.</p>
        </div>

        {/* Succès */}
        {status === 'success' ? (
          <div className="text-center space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm">✅ {message}</p>
              <p className="text-green-600 text-xs mt-1">Redirection vers la connexion dans 3 secondes…</p>
            </div>
            <Link
              to="/login"
              className="block w-full text-center bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Se connecter maintenant
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Erreur */}
            {status === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
                <p className="text-red-700 text-sm">{message}</p>
                <Link to="/forgot-password" className="text-red-600 underline text-xs">
                  Faire une nouvelle demande →
                </Link>
              </div>
            )}

            {/* Nouveau mot de passe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 caractères"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12 ${
                    password && !passwordValid ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPwd ? '🙈' : '👁️'}
                </button>
              </div>
              {password && !passwordValid && (
                <p className="text-red-500 text-xs mt-1">Au moins 6 caractères requis</p>
              )}
            </div>

            {/* Confirmation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmer le mot de passe
              </label>
              <input
                type={showPwd ? 'text' : 'password'}
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Répétez le mot de passe"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  confirm && !passwordsMatch ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {confirm && !passwordsMatch && (
                <p className="text-red-500 text-xs mt-1">Les mots de passe ne correspondent pas</p>
              )}
            </div>

            <button
              type="submit"
              disabled={status === 'loading' || !passwordValid || !passwordsMatch}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {status === 'loading' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Réinitialisation…
                </>
              ) : (
                'Réinitialiser mon mot de passe'
              )}
            </button>

            <p className="text-center text-sm text-gray-500">
              <Link to="/login" className="text-blue-600 hover:underline font-medium">
                ← Retour à la connexion
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

export default ResetPasswordPage
