import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config';

const AuthContext = createContext(null);

// Create an Axios instance for non-authenticated requests
const publicApi = axios.create({
  baseURL: `${API_URL}`,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  validateStatus: function (status) {
    return status >= 200 && status < 500;
  },
  timeout: 30000 // 30 second timeout
});

// Add response interceptor for debugging
publicApi.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      url: response.config.url,
      method: response.config.method,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.config?.headers
    });
    return Promise.reject(error);
  }
);

// Create an Axios instance for authenticated requests
const api = axios.create({
  baseURL: `${API_URL}`,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 30000 // 30 second timeout
});

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      url: response.config.url,
      method: response.config.method,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.config?.headers
    });
    return Promise.reject(error);
  }
);

// Add request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingRegistration, setPendingRegistration] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  const checkSubscriptionStatus = async (token) => {
    try {
      const response = await api.get('/subscriptions/status');
      if (response.data.success) {
        const subscription = response.data.data;
        setSubscriptionStatus(subscription);
        return subscription && subscription.status === 'active';
      }
      setSubscriptionStatus(null);
      return false;
    } catch (error) {
      setSubscriptionStatus(null);
      console.log('Subscription check failed:', error.response?.data || error.message);
      return false;
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        if (storedToken) {
          const response = await api.get('/users/profile');
          if (response.data.success) {
            const backendUser = response.data.data;
            const userObj = {
              id: backendUser.id,
              email: backendUser.email,
              firstName: backendUser.name.split(' ')[0],
              lastName: backendUser.name.split(' ').slice(1).join(' '),
              isAdmin: backendUser.role === 'admin',
              isSuperAdmin: backendUser.isSuperAdmin || false,
              token: storedToken
            };
            setUser(userObj);
            await checkSubscriptionStatus(storedToken);
          } else {
            await AsyncStorage.removeItem('authToken');
            setUser(null);
            setSubscriptionStatus(null);
          }
        } else {
          setUser(null);
          setSubscriptionStatus(null);
        }
      } catch (error) {
        console.error('Auth check error:', error.response?.data || error.message);
        setError(error.message);
        await AsyncStorage.removeItem('authToken');
        setUser(null);
        setSubscriptionStatus(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const signIn = async (email, password) => {
    try {
      setError(null);
      const response = await publicApi.post('/users/login', {
        email,
        password,
      });

      if (response.data.success) {
        const { token, user: backendUser } = response.data.data;
        await AsyncStorage.setItem('authToken', token);
        const userObj = {
          id: backendUser.id,
          email: backendUser.email,
          firstName: backendUser.name.split(' ')[0],
          lastName: backendUser.name.split(' ').slice(1).join(' '),
          isAdmin: backendUser.role === 'admin',
          isSuperAdmin: backendUser.isSuperAdmin || false,
          token
        };
        setUser(userObj);
        await checkSubscriptionStatus(token);
        
        return { success: true, user: backendUser };
      } else {
        setError(response.data.message || 'Login failed.');
        setSubscriptionStatus(null);
        return { success: false, error: response.data.message || 'Login failed.' };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'An unexpected error occurred during login.';
      setError(errorMessage);
      setSubscriptionStatus(null);
      return { success: false, error: errorMessage };
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      setUser(null);
      setError(null);
      setPendingRegistration(null);
      setSubscriptionStatus(null);
    } catch (error) {
      console.error('Error during logout:', error);
      setError(error.message);
    }
  };

  const signUp = async (email, password, firstName, lastName) => {
    try {
      const fullName = `${firstName} ${lastName}`.trim();
      const requestData = {
        name: fullName,
        email,
        password,
      };
      
      console.log('Registration request details:', {
        url: `${API_URL}/users/register`,
        method: 'POST',
        headers: publicApi.defaults.headers,
        data: { ...requestData, password: '[REDACTED]' }
      });

      const response = await publicApi.post('/users/register', requestData);

      console.log('Registration response:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data
      });

      if (response.data.success) {
        const { token, user: backendUser } = response.data.data;
        
        // Store registration data with token but don't log in yet
        const pendingUser = {
          id: backendUser.id,
          email: backendUser.email,
          firstName: backendUser.name.split(' ')[0],
          lastName: backendUser.name.split(' ').slice(1).join(' '),
          isAdmin: backendUser.role === 'admin',
          isSuperAdmin: backendUser.isSuperAdmin || false,
          token // Store the token for payment processing
        };
        
        console.log('Setting pendingRegistration:', pendingUser);
        setPendingRegistration(pendingUser);
        
        return { success: true, user: backendUser, token };
      } else {
        console.error('Registration failed:', response.data);
        return { success: false, error: response.data.message || 'Registration failed.' };
      }
    } catch (error) {
      console.error('Registration error details:', {
        response: error.response?.data,
        message: error.message,
        status: error.response?.status,
        url: `${API_URL}/users/register`,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      return { 
        success: false, 
        error: error.response?.data?.message || 'An unexpected error occurred during registration.' 
      };
    }
  };

  const completeRegistration = async () => {
    console.log('completeRegistration called with pendingRegistration:', pendingRegistration);
    if (pendingRegistration) {
      console.log('Setting user from pendingRegistration');
      setUser(pendingRegistration);
      setPendingRegistration(null);
      await AsyncStorage.setItem('authToken', pendingRegistration.token);
      console.log('Registration completed, user logged in');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      error, 
      signIn, 
      signOut, 
      signUp, 
      pendingRegistration,
      completeRegistration,
      subscriptionStatus,
      checkSubscriptionStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 