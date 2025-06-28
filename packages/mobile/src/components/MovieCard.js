import React from 'react';
import { StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.6;
const CARD_HEIGHT = CARD_WIDTH * 0.5625;

const MovieCard = ({ movie, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image
        source={{ uri: movie.thumbnailUrl }}
        style={styles.poster}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 5,
    borderRadius: 8,
    overflow: 'hidden',
  },
  poster: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#333',
  },
});

export default MovieCard; 