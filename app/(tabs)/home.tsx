import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useActivityStore } from '../store/useActivityStore';
import { formatDuration, formatDistance, calcPace } from '../utils/format';

export default function HomeScreen() {
  const { activities } = useActivityStore();

  const totalDistance = activities.reduce((s, a) => s + a.distance, 0);
  const totalDuration = activities.reduce((s, a) => s + a.duration, 0);
  const avgPace = calcPace(totalDistance, totalDuration);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.greeting}>Welcome back 👋</Text>
        <Text style={styles.heading}>RunTrack Lite</Text>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Total Distance</Text>
          <Text style={styles.heroValue}>{formatDistance(totalDistance)}</Text>
          <Text style={styles.heroSub}>{activities.length} activities logged</Text>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="Total Time" value={formatDuration(totalDuration)} />
          <StatCard label="Avg Pace" value={avgPace} />
        </View>

        {activities.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏃</Text>
            <Text style={styles.emptyText}>No activities yet</Text>
            <Text style={styles.emptySub}>Head to Record to start your first run!</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 24 },
  greeting: { color: '#666', fontSize: 14, marginBottom: 4 },
  heading: { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 24 },
  heroCard: {
    backgroundColor: '#16a34a',
    borderRadius: 20,
    padding: 28,
    marginBottom: 16,
  },
  heroLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginBottom: 6 },
  heroValue: { color: '#fff', fontSize: 48, fontWeight: '800', letterSpacing: -1 },
  heroSub: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  statValue: { color: '#fff', fontSize: 22, fontWeight: '700' },
  statLabel: { color: '#666', fontSize: 12, marginTop: 4 },
  empty: { alignItems: 'center', marginTop: 48 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  emptySub: { color: '#555', fontSize: 14, marginTop: 6, textAlign: 'center' },
});