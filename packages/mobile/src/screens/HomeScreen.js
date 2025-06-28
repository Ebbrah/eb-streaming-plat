import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  ImageBackground,
} from 'react-native';
import { Video } from 'expo-av';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import LoggedInHeader from '../components/LoggedInHeader';
import { API_URL } from '../config';
import axios from 'axios';

const { width } = Dimensions.get('window');
const THUMBNAIL_WIDTH = width * 0.4;
const THUMBNAIL_HEIGHT = THUMBNAIL_WIDTH * 0.5625;

// Define the order of genres
const GENRE_ORDER = [
  'Semina 2020 - 2025',
  'Kongamano 2020 - 2025',
  'Semina 2015 - 2019',
  'Semina 2010 - 2014',
  'Semina 2005 - 2009',
  'Semina 2000 - 2004',
  'Semina 1995 - 1999',
  'Semina 1990 - 1994'
];

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [movies, setMovies] = useState([]);
  const [featuredMovie, setFeaturedMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [moviesByGenre, setMoviesByGenre] = useState({});
  const [showFeaturedOverlayText, setShowFeaturedOverlayText] = useState(true);

  useEffect(() => {
    fetchMovies();
  }, []);

  useEffect(() => {
    if (featuredMovie) {
      const timer = setTimeout(() => {
        setShowFeaturedOverlayText(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [featuredMovie]);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let allFetchedMovies = [];
      let currentPage = 1;
      let totalPages = 1;

      while (currentPage <= totalPages) {
        const response = await axios.get(`${API_URL}/api/movies`, {
          params: {
            page: currentPage,
            limit: 10
          },
          timeout: 15000, // 15 second timeout
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        const data = response.data;
        
        if (data.success) {
          // Only set featured movie once from the first page
          if (currentPage === 1) {
            const featuredMovies = data.featuredMovies || [];
            if (featuredMovies.length > 0) {
              setFeaturedMovie(featuredMovies[0]);
            }
          }
          
          allFetchedMovies = [...allFetchedMovies, ...(data.data || [])];
          totalPages = data.pagination.pages;
          currentPage++;
        } else {
          setError(data.message || 'Failed to fetch movies');
          break;
        }
      }

      setMovies(allFetchedMovies);

      // Restore genre grouping logic
      const preferredGenreCasing = {};
      GENRE_ORDER.forEach(genre => {
        preferredGenreCasing[genre.toLowerCase()] = genre;
      });

      const groupedMovies = allFetchedMovies.reduce((acc, movie) => {
        const genres = Array.isArray(movie.genre) ? movie.genre : [movie.genre];
        
        genres.forEach(genre => {
          const normalizedGenre = genre.toLowerCase();
          const displayGenre = preferredGenreCasing[normalizedGenre] || genre;

          if (!acc[displayGenre]) {
            acc[displayGenre] = [];
          }
          acc[displayGenre].push({
            ...movie,
            movieId: movie._id 
          });
        });
        
        return acc;
      }, {});
      setMoviesByGenre(groupedMovies);

    } catch (err) {
      console.error('Error fetching movies:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(err.response?.data?.message || 'Error connecting to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderGenreSection = (genre, movies, key) => {
    if (!movies || movies.length === 0) {
      return null;
    }

    return (
      <View key={key} style={styles.genreSection}>
        <Text style={styles.genreTitle}>{genre}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.genreScrollContent}
        >
          {movies.map((movie) => {
            return (
              <TouchableOpacity
                key={`${movie._id}-${movie.title}`}
                style={styles.thumbnailContainer}
                onPress={() => navigation.navigate('MovieDetails', { movieId: movie._id })}
              >
                <Image
                  source={{ uri: movie.thumbnailUrl }}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
                <Text style={styles.movieTitle} numberOfLines={2}>
                  {movie.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6A0DAD" />
      </View>
    );
  }

  if (error) {
    return (
      <ImageBackground
        source={require('../../assets/images/background_mob.jpg')}
        style={styles.background}
      >
        <View style={styles.overlay} />
        <View style={styles.container}>
          <LoggedInHeader />
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require('../../assets/images/background_mob.jpg')}
      style={styles.background}
    >
      <View style={styles.overlay} />
      <View style={styles.container}>
        <LoggedInHeader />
        <ScrollView style={styles.scrollView}>
          {featuredMovie && (
            <View style={styles.featuredContainer}>
              <Video
                source={{ uri: featuredMovie.trailerUrl }}
                style={styles.featuredVideo}
                resizeMode="cover"
                shouldPlay={true}
                isLooping={true}
                isMuted={true}
                useNativeControls
              />
              <View style={styles.featuredOverlay}>
                {showFeaturedOverlayText && (
                  <View>
                    <Text style={styles.featuredTitle}>{featuredMovie.title}</Text>
                    <Text style={styles.featuredDescription} numberOfLines={2}>
                      {featuredMovie.description}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {GENRE_ORDER.filter(genre => moviesByGenre[genre] && moviesByGenre[genre].length > 0)
            .map((genre, index) => 
              renderGenreSection(genre, moviesByGenre[genre], `genre-${index}`)
            )}
        </ScrollView>

        {/* Navigation Bar */}
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="home" size={24} color="#fff" />
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => navigation.navigate('Search')}
          >
            <Ionicons name="search" size={24} color="#888" />
            <Text style={[styles.navText, styles.navTextInactive]}>Search</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="download" size={24} color="#888" />
            <Text style={[styles.navText, styles.navTextInactive]}>Downloads</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  container: {
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
  },
  featuredContainer: {
    height: 250,
    width: '100%',
    position: 'relative',
  },
  featuredVideo: {
    width: '100%',
    height: '100%',
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  featuredTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  featuredDescription: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
  },
  scrollView: {
    flex: 1,
  },
  genreSection: {
    marginVertical: 10,
  },
  genreTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 15,
    marginBottom: 10,
  },
  genreScrollContent: {
    paddingHorizontal: 10,
  },
  thumbnailContainer: {
    width: THUMBNAIL_WIDTH,
    marginHorizontal: 5,
    backgroundColor: 'rgba(61, 11, 75, 0.6)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbnail: {
    width: THUMBNAIL_WIDTH,
    height: THUMBNAIL_HEIGHT,
  },
  movieTitle: {
    color: '#fff',
    fontSize: 14,
    padding: 8,
    textAlign: 'center',
    backgroundColor: 'rgba(68, 1, 93, 0.3)',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingVertical: 10,
    paddingBottom: 20,
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  navTextInactive: {
    color: '#888',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3E5F5',
  },
});

export default HomeScreen; 