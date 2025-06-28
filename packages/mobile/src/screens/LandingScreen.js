import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ImageBackground, TouchableOpacity, TextInput, Image, ScrollView, Dimensions, SafeAreaView } from 'react-native';
import MovieCard from '../components/MovieCard'; // Import MovieCard
import { API_URL } from '../config';
import axios from 'axios';

const { width } = Dimensions.get('window');

const LandingScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [landingFeaturedMovies, setLandingFeaturedMovies] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLandingFeaturedMovies();
  }, []);

  const fetchLandingFeaturedMovies = async () => {
    try {
      setError(null);
      const response = await axios.get(`${API_URL}/api/movies`, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('LandingScreen - Featured movies API response:', response.data);

      if (response.data.success && response.data.featuredMovies) {
        setLandingFeaturedMovies(response.data.featuredMovies.slice(0, 6));
      } else {
        setError('No featured movies available');
      }
    } catch (error) {
      console.error('Error fetching featured movies for landing screen:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setError('Failed to load featured movies. Please try again.');
    }
  };

  const handleGetStarted = () => {
    navigation.navigate('Auth', { initialEmail: email });
  };

  return (
    <ImageBackground
      source={require('../../assets/images/background_mob.jpg')}
      style={styles.background}
    >
      <View style={styles.overlay} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Logo */}
          <Image
            source={require('../../assets/images/CADF_lg.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Lisha Kondoo Zangu</Text>
          <Text style={styles.subtitle}>
            Jifunze Neno la Mungu kupitia mafundisho ya Mwl. Christopher and Diana Mwakasege ya kuanzia 1990-2025
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor="#888"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleGetStarted}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
          
          {/* Error Message */}
          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}
          
          {/* Featured Thumbnails */}
          <View style={styles.featuredThumbnailsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {landingFeaturedMovies.map((movie) => (
                <MovieCard key={movie._id} movie={movie} onPress={() => {}} />
              ))}
            </ScrollView>
          </View>

          {/* Copyright */}
          <Text style={styles.copyrightText}>© Christopher & Diana Mwakasege Foundation (CADF)</Text>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 20,
  },
  logo: {
    width: 200,
    height: 60,
    marginTop: 40,
    marginBottom: 60,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 20,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 5,
    paddingHorizontal: 15,
    color: '#000',
    marginBottom: 15,
  },
  featuredThumbnailsContainer: {
    width: '100%',
    marginTop: 30, 
    marginBottom: 30, 
  },
  button: {
    backgroundColor: '#6A0DAD',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 5,
    marginBottom: 0, 
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  copyrightText: {
    color: '#aaa',
    fontSize: 13,
    marginTop: 'auto', 
    textAlign: 'center',
    paddingBottom: 20,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
});

export default LandingScreen; 