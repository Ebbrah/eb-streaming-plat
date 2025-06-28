import React from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Text, SafeAreaView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const LoggedInHeader = () => {
  const { user, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Image
          source={require('../../assets/images/CADF_logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.rightSection}>
          <Text style={styles.welcomeText}>Welcome, {user?.firstName || 'User'}</Text>
          <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#000',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    height: 60,
    backgroundColor: '#000',
  },
  logo: {
    width: 90,
    height: 30,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeText: {
    color: '#fff',
    fontSize: 14,
    marginRight: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6A0DAD',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 4,
  },
});

export default LoggedInHeader; 