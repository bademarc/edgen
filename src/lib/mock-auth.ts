// Mock authentication for development/demo purposes
// In production, this would be replaced with real OAuth

export interface MockUser {
  id: string
  name: string
  xUsername: string
  image?: string
  totalPoints: number
  rank?: number
}

export const mockUsers: MockUser[] = [
  {
    id: '1',
    name: 'Demo User',
    xUsername: 'demo_user',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    totalPoints: 1250,
    rank: 15,
  },
  {
    id: '2',
    name: 'Test User',
    xUsername: 'test_user',
    totalPoints: 850,
    rank: 25,
  },
]

let currentUser: MockUser | null = null

export const mockAuth = {
  signIn: (userId: string = '1') => {
    const user = mockUsers.find(u => u.id === userId) || mockUsers[0]
    currentUser = user
    if (typeof window !== 'undefined') {
      localStorage.setItem('mockUser', JSON.stringify(user))
    }
    return Promise.resolve(user)
  },

  signOut: () => {
    currentUser = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mockUser')
    }
    return Promise.resolve()
  },

  getSession: () => {
    if (currentUser) {
      return Promise.resolve({ user: currentUser })
    }
    
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('mockUser')
      if (stored) {
        currentUser = JSON.parse(stored)
        return Promise.resolve({ user: currentUser })
      }
    }
    
    return Promise.resolve(null)
  },

  getCurrentUser: () => currentUser,
}
