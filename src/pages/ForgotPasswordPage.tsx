import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'https://carnet-sante-backend.onrender.com/api'

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail]       = useState('')
  const [status, setStatus]     = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage]   = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('loading')
    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email })
      setStatus('success')
      setMessage('Si un compte avec cet email existe, un lien de réinitialisation a été envoyé. Vérifiez votre boîte mail (et vos spams).')
    } catch {
      setStatus('error')
      setMessage('Une erreur est survenue. Veuillez réessayer.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full futuristic-card p-8">

        {/* Logo */}
        <div className="text-center mb-6">
          <span className="text-4xl">🏥</span>
          <h1 className="mt-2 text-2xl font-bold gradient-text">Carnet Santé</h1>
          <h2 className="mt-1 text-lg font-semibold text-white">Mot de passe oublié</h2>
          <p className="mt-1 text-sm text-gray-300">
            Entrez votre email pour recevoir un lien de réinitialisation.
          </p>
        </div>

        {/* Succès */}
        {status === 'success' ? (
          <div className="text-center space-y-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 backdrop-blur-sm">
              <p className="text-green-400 text-sm">📧 {message}</p>
            </div>
            <Link
              to="/login"
              className="futuristic-btn block w-full text-center"
            >
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Erreur */}
            {status === 'error' && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-red-400 text-sm">{message}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="futuristic-input"
              />
            </div>

            <button
              type="submit"
              disabled={status === 'loading' || !email.trim()}
              className="futuristic-btn w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {status === 'loading' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                'Envoyer le lien de réinitialisation'
              )}
            </button>

            <p className="text-center text-sm text-gray-400">
              <Link to="/login" className="text-blue-400 hover:text-blue-300 hover:underline font-medium transition-colors">
                ← Retour à la connexion
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

export default ForgotPasswordPage
