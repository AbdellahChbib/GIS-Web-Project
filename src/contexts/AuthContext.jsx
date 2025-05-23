import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté (via localStorage par exemple)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      // Ici, vous implementerez l'appel à votre API d'authentification
      // Pour l'exemple, nous simulons une réponse
      const response = {
        user: {
          id: 1,
          email,
          role: email.includes('admin') ? 'admin' : 
                email.includes('teacher') ? 'teacher' : 'student',
          name: 'Utilisateur Test'
        },
        token: 'fake-jwt-token'
      };

      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('token', response.token);
      setUser(response.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      // Ici, vous implementerez l'appel à votre API d'inscription
      // Pour l'exemple, nous simulons une réponse
      const response = {
        user: {
          id: Date.now(),
          email: userData.email,
          role: userData.role,
          name: userData.name
        },
        token: 'fake-jwt-token'
      };

      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('token', response.token);
      setUser(response.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
}; 