import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Activity } from '../store/useActivityStore';
import { formatDuration, formatDistance, calcPace } from '../utils/format';

export default function ActivityCard({ activity }: { activity: Activity }) {
  return (
    <View style={styles.card}>
      <Text style={styles.date}>{activity.date}</Text>
      <View style={styles.row}>
        <Stat label="Distance" value={formatDistance(activity.distance)} />
        <Stat label="Time" value={formatDuration(activity.duration)} />
        <Stat label="Pace" value={calcPace(activity.distance, activity.duration)} />
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  date: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 18, fontWeight: '700' },
  statLabel: { color: '#666', fontSize: 11, marginTop: 2 },
});