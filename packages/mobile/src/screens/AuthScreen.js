import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, Alert, ScrollView, StatusBar, Image } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const AuthScreen = ({ navigation, route }) => {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState(route.params?.initialEmail || '');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLogin, setIsLogin] = useState(true); // true for login, false for register

  const handleAuth = async () => {
    if (isLogin) {
      const result = await signIn(email, password);
      if (result.success) {
        // Login successful, navigation is handled by AuthProvider/RootNavigator
      } else {
        Alert.alert('Login Failed', result.error || 'An unknown error occurred.');
      }
    } else {
      if (!firstName || !lastName || !email || !password) {
        Alert.alert('Registration Failed', 'Please fill in all fields.');
        return;
      }
      const result = await signUp(email, password, firstName, lastName);
      if (result.success) {
        // Navigate to payment screen instead of showing success alert
        navigation.navigate('Payment', {
          user: result.user
        });
      } else {
        Alert.alert('Registration Failed', result.error || 'An unknown error occurred.');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>

          {!isLogin && (
            <>
              <TextInput
                style={styles.input}
                placeholder="First Name"
                placeholderTextColor="#888"
                autoCapitalize="words"
                value={firstName}
                onChangeText={setFirstName}
              />
              <TextInput
                style={styles.input}
                placeholder="Last Name"
                placeholderTextColor="#888"
                autoCapitalize="words"
                value={lastName}
                onChangeText={setLastName}
              />
            </>
          )}

          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor="#888"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#888"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity style={styles.button} onPress={handleAuth}>
            <Text style={styles.buttonText}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.toggleButton}>
            <Text style={styles.toggleButtonText}>
              {isLogin ? 'New to CADF? Sign up now.' : 'Already have an account? Sign in.'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3E5F5',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  content: {
    width: '100%',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6A0DAD',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 5,
    paddingHorizontal: 15,
    color: '#000',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E1BEE7',
  },
  button: {
    backgroundColor: '#6A0DAD',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 5,
    marginBottom: 15,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  toggleButton: {
    marginTop: 10,
  },
  toggleButtonText: {
    color: '#6A0DAD',
    fontSize: 16,
  },
});

export default AuthScreen; 