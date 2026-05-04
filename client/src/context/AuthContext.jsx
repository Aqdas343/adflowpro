import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { getMeApi } from '../api/auth';
import { getToken, setToken, removeToken } from '../utils/storage';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  token: getToken(),
  loading: true,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      setToken(action.payload.token);
      return { ...state, user: action.payload.user, token: action.payload.token, loading: false };
    case 'LOGOUT':
      removeToken();
      return { ...state, user: null, token: null, loading: false };
    case 'SET_USER':
      return { ...state, user: action.payload, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const verify = async () => {
      if (!state.token) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }
      try {
        const { data } = await getMeApi();
        dispatch({ type: 'SET_USER', payload: data.user });
      } catch {
        dispatch({ type: 'LOGOUT' });
      }
    };
    verify();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = (token, user) => dispatch({ type: 'LOGIN', payload: { token, user } });
  const logout = () => dispatch({ type: 'LOGOUT' });

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
