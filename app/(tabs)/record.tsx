import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, Alert,
} from 'react-native';
import MapView, { Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { useActivityStore } from '../store/useActivityStore';
import { formatDuration, formatDistance, calcPace } from '../utils/format';

type Coord = { latitude: number; longitude: number };
type Status = 'idle' | 'recording' | 'done';

function getDistance(a: Coord, b: Coord): number {
  const R = 6371000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const c =
    sinLat * sinLat +
    Math.cos((a.latitude * Math.PI) / 180) *
      Math.cos((b.latitude * Math.PI) / 180) *
      sinLon * sinLon;
  return R * 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c));
}

export default function RecordScreen() {
  const [status, setStatus] = useState<Status>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [route, setRoute] = useState<Coord[]>([]);
  const [region, setRegion] = useState<any>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationSub = useRef<Location.LocationSubscription | null>(null);
  const routeRef = useRef<Coord[]>([]);
  const distanceRef = useRef(0);
  const addActivity = useActivityStore((s) => s.addActivity);

  useEffect(() => {
    (async () => {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') {
        Alert.alert('Permission denied', 'Location access is required to track your run.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    })();
    return () => stopTracking();
  }, []);

  async function startRecording() {
    routeRef.current = [];
    distanceRef.current = 0;
    setStatus('recording');
    setElapsed(0);
    setDistance(0);
    setRoute([]);

    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);

    locationSub.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 5 },
      (loc) => {
        const coord: Coord = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
        if (routeRef.current.length > 0) {
          distanceRef.current += getDistance(
            routeRef.current[routeRef.current.length - 1],
            coord
          );
          setDistance(distanceRef.current);
        }
        routeRef.current = [...routeRef.current, coord];
        setRoute([...routeRef.current]);
        setRegion({
          latitude: coord.latitude,
          longitude: coord.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
      }
    );
  }

  function stopTracking() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (locationSub.current) locationSub.current.remove();
  }

  function stopRecording() {
    stopTracking();
    setStatus('done');
    addActivity({
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }),
      duration: elapsed,
      distance: distanceRef.current,
      route: routeRef.current,
    });
  }

  function reset() {
    setStatus('idle');
    setElapsed(0);
    setDistance(0);
    setRoute([]);
    routeRef.current = [];
    distanceRef.current = 0;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>Record Activity</Text>

      {/* Map */}
      <View style={styles.mapContainer}>
        {region ? (
          <MapView
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            region={region}
            userInterfaceStyle="dark"
            showsUserLocation
          >
            {route.length > 1 && (
              <Polyline coordinates={route} strokeColor="#16a34a" strokeWidth={4} />
            )}
          </MapView>
        ) : (
          <View style={[styles.map, styles.mapPlaceholder]}>
            <Text style={styles.mapPlaceholderText}>Getting your location…</Text>
          </View>
        )}
      </View>

      {/* Timer */}
      <View style={styles.statsBox}>
        <Text style={styles.timer}>{formatDuration(elapsed)}</Text>
        <View style={styles.miniStats}>
          <MiniStat label="Distance" value={formatDistance(distance)} />
          <MiniStat label="Pace" value={calcPace(distance, elapsed)} />
        </View>
      </View>

      {/* Summary shown after stopping */}
      {status === 'done' && (
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Activity Saved ✅</Text>
          <View style={styles.summaryRow}>
            <SummaryStat label="Distance" value={formatDistance(distanceRef.current)} />
            <SummaryStat label="Time" value={formatDuration(elapsed)} />
            <SummaryStat label="Pace" value={calcPace(distanceRef.current, elapsed)} />
          </View>
        </View>
      )}

      {/* Action Button */}
      <View style={styles.btnArea}>
        {status === 'idle' && (
          <TouchableOpacity style={styles.btnGreen} onPress={startRecording}>
            <Text style={styles.btnText}>START</Text>
          </TouchableOpacity>
        )}
        {status === 'recording' && (
          <TouchableOpacity style={styles.btnRed} onPress={stopRecording}>
            <Text style={styles.btnText}>STOP</Text>
          </TouchableOpacity>
        )}
        {status === 'done' && (
          <TouchableOpacity style={styles.btnOutline} onPress={reset}>
            <Text style={styles.btnOutlineText}>Start Another Activity</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniValue}>{value}</Text>
      <Text style={styles.miniLabel}>{label}</Text>
    </View>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>{value}</Text>
      <Text style={{ color: '#555', fontSize: 11, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0a0a' },
  title: {
    color: '#fff', fontSize: 22, fontWeight: '800',
    paddingHorizontal: 24, paddingTop: 20, paddingBottom: 12,
  },
  mapContainer: {
    marginHorizontal: 16, borderRadius: 16,
    overflow: 'hidden', height: 260,
  },
  map: { flex: 1 },
  mapPlaceholder: {
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPlaceholderText: { color: '#555', fontSize: 14 },
  statsBox: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  timer: { color: '#fff', fontSize: 52, fontWeight: '800', letterSpacing: -1 },
  miniStats: { flexDirection: 'row', gap: 40, marginTop: 12 },
  miniStat: { alignItems: 'center' },
  miniValue: { color: '#16a34a', fontSize: 20, fontWeight: '700' },
  miniLabel: { color: '#555', fontSize: 11, marginTop: 2 },
  summary: {
    backgroundColor: '#111',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  summaryTitle: { color: '#16a34a', fontWeight: '700', fontSize: 14, marginBottom: 14 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  btnArea: { padding: 24, paddingBottom: 8 },
  btnGreen: {
    backgroundColor: '#16a34a', borderRadius: 50,
    paddingVertical: 18, alignItems: 'center',
  },
  btnRed: {
    backgroundColor: '#dc2626', borderRadius: 50,
    paddingVertical: 18, alignItems: 'center',
  },
  btnOutline: {
    borderWidth: 2, borderColor: '#16a34a', borderRadius: 50,
    paddingVertical: 18, alignItems: 'center',
  },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 1 },
  btnOutlineText: { color: '#16a34a', fontSize: 16, fontWeight: '700' },
});