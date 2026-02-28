import { StyleSheet, View, Text, TouchableOpacity, Modal } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useState } from 'react';
import { router } from 'expo-router';

const UOFT_LOCATIONS = [
  { 
    id: 1, 
    name: 'Robarts Library', 
    latitude: 43.6648, 
    longitude: -79.3994, 
    emoji: '🌱',
    club: 'Green Leading Club UofT',
    tag: 'Sustainability',
    description: 'Leads innovation through green campaigns and sustainability initiatives on campus.',
    challenge: 'Carpool Challenge - Find a carpool buddy on campus and reduce your carbon footprint!',
    xp: 50,
    coins: 100,
    challengeId: 'GREEN_001'
  },
  { 
    id: 2, 
    name: 'Bahen Centre', 
    latitude: 43.6597, 
    longitude: -79.3978, 
    emoji: '💻',
    club: 'Computer Science Student Community',
    tag: 'Technology',
    description: 'Coding club that hosts coding puzzles, hackathons and CS events.',
    challenge: 'Complete 3 small coding problems and attend a CS event to earn the Ready to Build badge!',
    xp: 75,
    coins: 150,
    challengeId: 'CODING_001'
  },
  { 
    id: 3, 
    name: 'Hart House', 
    latitude: 43.6629, 
    longitude: -79.3957, 
    emoji: '📸',
    club: 'Hart House Camera Club',
    tag: 'Creativity',
    description: 'An image board for sharing creative photography and visual art on campus.',
    challenge: 'Take a photo that captures the spirit of UofT and share it on the image board!',
    xp: 40,
    coins: 80,
    challengeId: 'PHOTO_001'
  },
  { 
    id: 4, 
    name: 'Athletic Centre', 
    latitude: 43.6624, 
    longitude: -79.3995, 
    emoji: '🏋️',
    club: 'Fitness for Noobs',
    tag: 'Wellness',
    description: 'Hosts beginner-friendly workouts and wellness events to boost community health.',
    challenge: 'Complete a 10 minute beginner workout and log your wellness activity!',
    xp: 60,
    coins: 120,
    challengeId: 'FIT_001'
  },
];

const TAG_COLORS: { [key: string]: string } = {
  'Sustainability': '#2d6a4f',
  'Technology': '#1d3557',
  'Creativity': '#9b2335',
  'Wellness': '#e07b39',
};

export default function MapsScreen() {
  const [selectedLocation, setSelectedLocation] = useState<typeof UOFT_LOCATIONS[0] | null>(null);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 43.6629,
          longitude: -79.3957,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {UOFT_LOCATIONS.map((location) => (
          <Marker
            key={location.id}
            coordinate={{ latitude: location.latitude, longitude: location.longitude }}
            onPress={() => setSelectedLocation(location)}
          >
            <View style={styles.markerContainer}>
              <Text style={styles.emoji}>{location.emoji}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      <Modal
        visible={!!selectedLocation}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedLocation(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.row}>
              <View style={[styles.tag, { backgroundColor: TAG_COLORS[selectedLocation?.tag ?? ''] }]}>
                <Text style={styles.tagText}>{selectedLocation?.tag}</Text>
              </View>
            </View>
            <Text style={styles.modalTitle}>{selectedLocation?.name}</Text>
            <Text style={styles.clubName}>{selectedLocation?.club}</Text>
            <Text style={styles.modalDescription}>{selectedLocation?.description}</Text>
            <View style={styles.challengeBox}>
              <Text style={styles.challengeTitle}>Active Challenge</Text>
              <Text style={styles.challengeText}>{selectedLocation?.challenge}</Text>
              <View style={styles.rewardsRow}>
                <Text style={styles.reward}>⚡ {selectedLocation?.xp} XP</Text>
                <Text style={styles.reward}>🪙 {selectedLocation?.coins} Coins</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => {
                setSelectedLocation(null);
                router.push('/(tabs)/challenge');
              }}
            >
              <Text style={styles.buttonText}>See Challenge</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedLocation(null)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  markerContainer: { borderRadius: 20, padding: 6, backgroundColor: '#fff', borderWidth: 2, borderColor: '#e0e0e0' },
  emoji: { fontSize: 22 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  row: { flexDirection: 'row', marginBottom: 8 },
  tag: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  tagText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 2 },
  clubName: { fontSize: 13, color: '#002A5C', fontWeight: '600', marginBottom: 8 },
  modalDescription: { fontSize: 14, color: '#555', marginBottom: 16 },
  challengeBox: { backgroundColor: '#f0f4ff', borderRadius: 10, padding: 16, marginBottom: 16 },
  challengeTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 6 },
  challengeText: { fontSize: 14, color: '#333', marginBottom: 12 },
  rewardsRow: { flexDirection: 'row', gap: 16 },
  reward: { fontSize: 14, fontWeight: '600', color: '#002A5C' },
  button: { backgroundColor: '#002A5C', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  closeButton: { padding: 10, alignItems: 'center' },
  closeText: { color: 'gray', fontSize: 14 },
});