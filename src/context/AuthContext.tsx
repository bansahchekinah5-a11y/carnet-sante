import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { authService, LoginData, RegisterData } from '../services/authService'

export interface User {
  id: string
  uniqueCode: string
  email: string
  firstName: string
  lastName: string
  role: 'patient' | 'doctor' | 'admin' | 'hospital_admin'
  dateOfBirth: string
  gender: string
  phoneNumber?: string
  isActive: boolean
  isVerified: boolean
  profileCompleted: boolean
  profilePicture?: string
  createdAt?: string
  updatedAt?: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: Partial<User> } // NOUVEAU

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => void
  updateUser: (user: User) => void
  updateProfilePicture: (pictureUrl: string, newToken?: string) => void // NOUVEAU
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
        error: null,
      }
    case 'UPDATE_USER': // NOUVEAU
      if (!state.user) return state
      const updatedUser = { ...state.user, ...action.payload }
      // Mettre à jour localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser))
      return {
        ...state,
        user: updatedUser,
        isLoading: false,
        error: null,
      }
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      }
    case 'LOGOUT':
      return {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      }
    default:
      return state
  }
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')

    if (token && savedUser) {
      try {
        console.log('🔍 Vérification du token...')
        const user = JSON.parse(savedUser)
        
        // Vérifier le token avec le backend
        try {
          const currentUser = await authService.getCurrentUser()
          dispatch({ type: 'SET_USER', payload: currentUser })
        } catch (error) {
          console.warn('⚠️ Token invalide, déconnexion...')
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      } catch (error) {
        console.error('❌ Erreur de vérification du token:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    } else {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const login = async (email: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      console.log('🔐 Tentative de connexion pour:', email)
      
      const result = await authService.login({ email, password })

      if (!result || !result.user) {
        throw new Error('Réponse invalide du serveur')
      }

      const { user, token } = result

      // Stocker le token et les données utilisateur
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))

      dispatch({ type: 'SET_USER', payload: user })

      setTimeout(() => {
        const event = new CustomEvent('showNotification', {
          detail: {
            message: `Bienvenue ${user.firstName}!`,
            type: 'success',
          },
        })
        window.dispatchEvent(event)
      }, 100)

    } catch (error: any) {
      console.error('❌ Erreur login:', error)

      const message =
        error.response?.data?.message || error.message || 'Erreur de connexion'

      dispatch({ type: 'SET_ERROR', payload: message })

      setTimeout(() => {
        const event = new CustomEvent('showNotification', {
          detail: { message, type: 'error' },
        })
        window.dispatchEvent(event)
      }, 100)

      throw error
    }
  }

  const register = async (userData: RegisterData) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      console.log('📝 Appel register...')
      
      // Vérifier si l'email essaye de créer un compte admin
      const adminEmails = ['admin@carnetsante.com', 'superadmin@carnetsante.com']
      if (adminEmails.includes(userData.email.toLowerCase())) {
        throw new Error('Cet email ne peut pas être utilisé pour créer un compte')
      }

      const result = await authService.register(userData)

      if (!result || !result.user) {
        throw new Error('Réponse invalide du serveur - pas de user')
      }

      const { user, token, message } = result

      console.log('✅ User reçu:', user)

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))

      dispatch({ type: 'SET_USER', payload: user })

      setTimeout(() => {
        const event = new CustomEvent('showNotification', {
          detail: {
            message: message || `Compte créé avec succès! Bienvenue ${user.firstName}`,
            type: 'success',
          },
        })
        window.dispatchEvent(event)
      }, 100)

    } catch (error: any) {
      console.error('❌ Erreur register:', error)

      const message =
        error.response?.data?.message || error.message || "Erreur lors de l'inscription"

      dispatch({ type: 'SET_ERROR', payload: message })

      setTimeout(() => {
        const event = new CustomEvent('showNotification', {
          detail: { message, type: 'error' },
        })
        window.dispatchEvent(event)
      }, 100)

      throw error
    }
  }

  const logout = () => {
    console.log('🚪 Logout...')
    
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    dispatch({ type: 'LOGOUT' })

    // Appeler l'API de déconnexion
    authService.logout().catch((error) => {
      console.warn('⚠️ Erreur logout API:', error)
    })

    setTimeout(() => {
      const event = new CustomEvent('showNotification', {
        detail: { message: 'Déconnexion réussie', type: 'info' },
      })
      window.dispatchEvent(event)
    }, 100)

    // Redirection automatique vers la page d'accueil
    setTimeout(() => {
      window.location.href = '/'
    }, 200)
  }

  const updateUser = (user: User) => {
    console.log('📝 Update user...')
    localStorage.setItem('user', JSON.stringify(user))
    dispatch({ type: 'SET_USER', payload: user })
  }

  // ✅ NOUVELLE FONCTION SPÉCIFIQUE POUR LA PHOTO DE PROFIL
  const updateProfilePicture = (pictureUrl: string, newToken?: string) => {
    console.log('📸 Mise à jour de la photo de profil:', pictureUrl)
    
    if (!state.user) {
      console.warn('⚠️ Aucun utilisateur connecté')
      return
    }

    // Mettre à jour le token si fourni
    if (newToken) {
      console.log('🔄 Mise à jour du token')
      localStorage.setItem('token', newToken)
    }

    // Mettre à jour l'utilisateur
    const updatedUser = { ...state.user, profilePicture: pictureUrl }
    
    // Mettre à jour localStorage
    localStorage.setItem('user', JSON.stringify(updatedUser))
    
    // Mettre à jour le state
    dispatch({ type: 'UPDATE_USER', payload: { profilePicture: pictureUrl } })

    // Notification optionnelle
    setTimeout(() => {
      const event = new CustomEvent('showNotification', {
        detail: {
          message: 'Photo de profil mise à jour',
          type: 'success',
        },
      })
      window.dispatchEvent(event)
    }, 100)

    console.log('✅ Photo de profil mise à jour avec succès')
  }

  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null })
  }

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    updateProfilePicture, // NOUVEAU
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider')
  }
  return context
}

export default AuthContext
