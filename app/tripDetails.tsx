import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Alert,
  Animated,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

const TripDetailsPage = () => {
  const { trip } = useLocalSearchParams();
  const [tripData, setTripData] = useState<any>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedPhotoForPreview, setSelectedPhotoForPreview] = useState<string | null>(null);
  const [isMakingPolaroid, setIsMakingPolaroid] = useState(false);
  const [hasPermission, requestPermission] = MediaLibrary.usePermissions();
  const polaroidRef = useRef(null);

  useEffect(() => {
    if (trip) {
      const parsed = JSON.parse(trip as string);
      setTripData(parsed);

      const uris =
        typeof parsed.photoUris === 'string'
          ? JSON.parse(parsed.photoUris)
          : Array.isArray(parsed.photoUris)
          ? parsed.photoUris
          : [];

      setPhotos(uris);
    }
  }, [trip]);

  const handleSave = async () => {
    if (!hasPermission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) return Alert.alert('Permission needed to save the image');
    }

    try {
      const uri = await captureRef(polaroidRef, {
        format: 'png',
        quality: 1,
      });
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Saved to device gallery!');
    } catch (e) {
      Alert.alert('Error saving image:', (e as Error).message);
    }
  };

  const handleShare = async () => {
    try {
      const uri = await captureRef(polaroidRef, {
        format: 'png',
        quality: 1,
      });
      await Sharing.shareAsync(uri);
    } catch (e) {
      Alert.alert('Error sharing image:', (e as Error).message);
    }
  };

  if (!tripData) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading trip details...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{tripData.name}</Text>
      <Text style={styles.detail}>📍 {tripData.destination}</Text>
      <Text style={styles.detail}>🗓️ {tripData.startDate} ➔ {tripData.endDate}</Text>

      <Text style={styles.photosTitle}>Tap a photo to view it:</Text>
      <View style={styles.photosWrapper}>
        {photos.map((uri: string, idx: number) => (
          <TouchableOpacity
            key={idx}
            onPress={() => {
              if (isMakingPolaroid) {
                setSelectedImage(uri);
                setIsMakingPolaroid(false);
              } else {
                setSelectedPhotoForPreview(uri);
              }
            }}
            activeOpacity={0.8}
            style={styles.thumbnailWrapper}
          >
            <Image source={{ uri }} style={styles.photoThumbnail} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.actionButton, { alignSelf: 'center', marginTop: 20 }]}
        onPress={() => {
          setIsMakingPolaroid(true);
          Alert.alert('Polaroid Mode', 'Tap a photo to turn it into a Polaroid');
        }}
      >
        <Text style={styles.actionButtonText}>📸 Make a Polaroid</Text>
      </TouchableOpacity>

      {/* Preview Modal */}
      <Modal visible={!!selectedPhotoForPreview} transparent onRequestClose={() => setSelectedPhotoForPreview(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalCloseArea} onPress={() => setSelectedPhotoForPreview(null)} />
          <Image source={{ uri: selectedPhotoForPreview || '' }} style={styles.fullImage} resizeMode="contain" />
        </View>
      </Modal>

      {/* Polaroid Modal */}
      <Modal visible={!!selectedImage} transparent onRequestClose={() => setSelectedImage(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalCloseArea} onPress={() => setSelectedImage(null)} />
          <View style={styles.polaroidContainer}>
            <View style={styles.polaroid} ref={polaroidRef}>
              <Image source={{ uri: selectedImage || '' }} style={styles.polaroidImage} resizeMode="cover" />
              <View style={styles.polaroidTextContainer}>
                <Text style={styles.polaroidTripName}>{tripData.name}</Text>
                <Text style={styles.polaroidDestination}>📍 {tripData.destination}</Text>
                <Text style={styles.polaroidDate}>🗓️ {tripData.startDate} ➔ {tripData.endDate}</Text>
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                <Text style={styles.actionButtonText}>📤 Share</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
                <Text style={styles.actionButtonText}>💾 Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#000',
    flexGrow: 1,
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF8C00',
    marginBottom: 12,
  },
  detail: {
    fontSize: 18,
    color: '#ccc',
    marginBottom: 6,
  },
  photosTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FF8C00',
    marginTop: 24,
    marginBottom: 12,
  },
  photosWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  thumbnailWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  photoThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  modalCloseArea: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
    padding: 10,
  },
  fullImage: {
    width: screenWidth * 0.9,
    height: screenWidth * 0.9,
    borderRadius: 12,
  },
  polaroidContainer: {
    alignItems: 'center',
  },
  polaroid: {
    width: screenWidth * 0.8,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  polaroidImage: {
    width: '100%',
    height: screenWidth * 0.8,
  },
  polaroidTextContainer: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    width: '100%',
    alignItems: 'center',
  },
  polaroidTripName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  polaroidDestination: {
    fontSize: 16,
    color: '#666',
  },
  polaroidDate: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 16,
    justifyContent: 'center',
  },
  actionButton: {
    backgroundColor: '#FF8C00',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 10,
    marginHorizontal: 6,
    elevation: 3,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TripDetailsPage;
