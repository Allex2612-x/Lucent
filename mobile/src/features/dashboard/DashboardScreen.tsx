import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function DashboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sumar Financiar</Text>
      <View style={styles.card}>
        <Text style={styles.cardText}>Date în curs de încărcare...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardText: {
    color: '#94a3b8',
  }
});
