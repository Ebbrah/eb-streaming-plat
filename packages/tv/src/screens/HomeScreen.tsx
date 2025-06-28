import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Movie, movieApi } from '@mana/shared';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await movieApi.getMovies();
        if (response.success) {
          setMovies(response.data);
          setFeaturedMovies(response.featuredMovies || []);
        } else {
          setError(response.message || 'Failed to fetch movies');
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to fetch movies');
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, []);

  const renderMovieItem = ({ item }: { item: Movie }) => (
    <TouchableOpacity 
      style={styles.movieCard}
      onPress={() => navigation.navigate('MovieDetails', { movieId: item._id })}
      hasTVPreferredFocus={true}
    >
      <Image
        source={{ uri: item.thumbnailUrl }}
        style={styles.thumbnail}
        resizeMode="cover"
      />
      <View style={styles.movieInfo}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        {item.genre && (
          <Text style={styles.genre}>{item.genre}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
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

  return (
    <View style={styles.container}>
      {featuredMovies.length > 0 && (
        <View style={styles.featuredSection}>
          <Text style={styles.sectionTitle}>Featured</Text>
          <FlatList
            data={featuredMovies}
            renderItem={renderMovieItem}
            keyExtractor={(item) => item._id}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}
      <View style={styles.allMoviesSection}>
        <Text style={styles.sectionTitle}>All Movies</Text>
        <FlatList
          data={movies}
          renderItem={renderMovieItem}
          keyExtractor={(item) => item._id}
          numColumns={4}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredSection: {
    marginBottom: 40,
  },
  allMoviesSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  movieCard: {
    width: 300,
    margin: 10,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: 450,
  },
  movieInfo: {
    padding: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  genre: {
    fontSize: 18,
    color: '#888',
  },
  errorText: {
    color: '#ff0000',
    fontSize: 24,
  },
}); 