import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoggedInScreen({ navigation }) {
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      navigation.replace('Landing');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to Mana</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Featured Content</Text>
          <View style={styles.featuredContainer}>
            {/* Placeholder for featured content */}
            <View style={styles.featuredItem}>
              <Text style={styles.featuredText}>Featured Item 1</Text>
            </View>
            <View style={styles.featuredItem}>
              <Text style={styles.featuredText}>Featured Item 2</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Continue Watching</Text>
          <View style={styles.continueWatchingContainer}>
            {/* Placeholder for continue watching content */}
            <View style={styles.watchingItem}>
              <Text style={styles.watchingText}>Continue Watching Item 1</Text>
            </View>
            <View style={styles.watchingItem}>
              <Text style={styles.watchingText}>Continue Watching Item 2</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoutButton: {
    padding: 10,
  },
  logoutButtonText: {
    color: '#e50914',
    fontSize: 16,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  featuredContainer: {
    marginBottom: 30,
  },
  featuredItem: {
    height: 200,
    backgroundColor: '#333',
    borderRadius: 10,
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredText: {
    color: '#fff',
    fontSize: 18,
  },
  continueWatchingContainer: {
    marginBottom: 30,
  },
  watchingItem: {
    height: 150,
    backgroundColor: '#333',
    borderRadius: 10,
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  watchingText: {
    color: '#fff',
    fontSize: 16,
  },
}); 