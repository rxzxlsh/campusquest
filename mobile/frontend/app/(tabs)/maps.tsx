import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

const UOFT_LOCATIONS = [
  { id: 1, name: 'Robarts Library', latitude: 43.6648, longitude: -79.3994 },
  { id: 2, name: 'Bahen Centre', latitude: 43.6597, longitude: -79.3978 },
  { id: 3, name: 'Hart House', latitude: 43.6629, longitude: -79.3957 },
  { id: 4, name: 'Sidney Smith Hall', latitude: 43.6624, longitude: -79.3995 },
  { id: 5, name: 'Medical Sciences', latitude: 43.6606, longitude: -79.3939 },
];

export default function MapsScreen() {
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
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title={location.name}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});