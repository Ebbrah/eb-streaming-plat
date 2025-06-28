import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Video } from 'expo-av';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import LoggedInHeader from '../components/LoggedInHeader';

const { width } = Dimensions.get('window');
const VIDEO_HEIGHT = width * 0.5625; // 16:9 aspect ratio

const MovieDetailsScreen = ({ route, navigation }) => {
  const { movieId } = route.params;
  const { user } = useAuth();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    fetchMovieDetails();
  }, [movieId]);

  const fetchMovieDetails = async () => {
    try {
      const response = await fetch(`http://172.20.10.10:3000/api/movies/${movieId}`);
      const data = await response.json();
      
      if (data.success) {
        setMovie(data.data);
      } else {
        setError(data.message || 'Failed to fetch movie details');
      }
    } catch (err) {
      setError('Error connecting to the server');
      console.error('Error fetching movie details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#e50914" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!movie) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Movie not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LoggedInHeader />
      <SafeAreaView style={styles.safeAreaBack}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>
      <ScrollView style={styles.scrollView}>
        {/* Video Player */}
        <View style={styles.videoContainer}>
          <Video
            source={{ uri: movie.videoUrl }}
            style={styles.video}
            useNativeControls
            resizeMode="contain"
            isLooping={false}
            shouldPlay={isPlaying}
            onPlaybackStatusUpdate={(status) => {
              setIsPlaying(status.isPlaying);
            }}
          />
        </View>

        {/* Movie Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.title}>{movie.title}</Text>
          <Text style={styles.description}>{movie.description}</Text>
          
          <View style={styles.metaContainer}>
            <Text style={styles.metaText}>Genre: {movie.genre}</Text>
            <Text style={styles.metaText}>Year: {movie.releaseYear}</Text>
            <Text style={styles.metaText}>Rating: {movie.rating}/10</Text>
          </View>

          {/* Play Button */}
          <TouchableOpacity
            style={styles.playButton}
            onPress={() => setIsPlaying(!isPlaying)}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={24}
              color="#fff"
            />
            <Text style={styles.playButtonText}>
              {isPlaying ? 'Pause' : 'Play'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  videoContainer: {
    width: '100%',
    height: VIDEO_HEIGHT,
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 20,
    lineHeight: 24,
  },
  metaContainer: {
    marginBottom: 20,
  },
  metaText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 5,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6A0DAD',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 5,
    marginTop: 20,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  safeAreaBack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10, 
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 11, 
    padding: 10,
  },
});

export default MovieDetailsScreen; 