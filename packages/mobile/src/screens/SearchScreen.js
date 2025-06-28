import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import LoggedInHeader from '../components/LoggedInHeader';

const SearchScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [movieId, setMovieId] = useState('');
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchMovie = async () => {
    if (!movieId.trim()) {
      setError('Please enter a movie ID');
      return;
    }

    setLoading(true);
    setError(null);
    setMovie(null);

    try {
      const response = await fetch(`http://172.20.10.10:3000/api/movies/${movieId.trim()}`);
      const data = await response.json();
      
      if (data.success) {
        setMovie(data.data);
      } else {
        setError(data.message || 'Movie not found');
      }
    } catch (err) {
      setError('Error connecting to the server');
      console.error('Error searching movie:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LoggedInHeader />
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter Movie ID"
          placeholderTextColor="#888"
          value={movieId}
          onChangeText={setMovieId}
          keyboardType="default"
          autoCapitalize="none"
        />
        
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={searchMovie}
          disabled={loading}
        >
          <Ionicons name="search" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#e50914" />
        </View>
      )}

      {error && (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {movie && (
        <ScrollView style={styles.resultsContainer}>
          <TouchableOpacity
            style={styles.movieCard}
            onPress={() => navigation.navigate('MovieDetails', { movieId: movie._id })}
          >
            <Image
              source={{ uri: movie.thumbnailUrl }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
            <View style={styles.movieInfo}>
              <Text style={styles.movieTitle}>{movie.title}</Text>
              <Text style={styles.movieGenre}>{movie.genre}</Text>
              <Text style={styles.movieDescription} numberOfLines={3}>
                {movie.description}
              </Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 50,
    backgroundColor: '#333',
    borderRadius: 5,
    paddingHorizontal: 15,
    color: '#fff',
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: '#6A0DAD',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 5,
    marginTop: 10,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  resultsContainer: {
    flex: 1,
    padding: 15,
  },
  movieCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 15,
  },
  thumbnail: {
    width: '100%',
    height: 200,
  },
  movieInfo: {
    padding: 15,
  },
  movieTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  movieGenre: {
    color: '#888',
    fontSize: 14,
    marginBottom: 10,
  },
  movieDescription: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default SearchScreen; 