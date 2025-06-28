import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import MovieCard from './MovieCard';

const MovieRow = ({ title, movies, onMoviePress }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {movies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            onPress={() => onMoviePress(movie)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
    marginBottom: 10,
  },
  scrollContent: {
    paddingHorizontal: 5,
  },
});

export default MovieRow; 