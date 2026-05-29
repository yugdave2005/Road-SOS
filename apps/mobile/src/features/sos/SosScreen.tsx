import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, Alert, ActivityIndicator } from 'react-native';
import { SosButton } from './SosButton';
import { useSos, PoiResult } from './useSos';
import { useLocation } from '@shared/hooks/useLocation';
import { theme } from '@shared/theme/theme';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import MapView, { Marker } from 'react-native-maps';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { VoiceActivation } from '@core/ai/VoiceActivation';
import { GroqClient } from '@core/ai/GroqClient';
import { SmsFallback } from '@core/ai/SmsFallback';

function PulsingDot({ color }: { color: string }) {
  const opacity = useSharedValue(0.3);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0.3, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.dot, { backgroundColor: color }, animatedStyle]} />
  );
}

export function SosScreen({ navigation }: any) {
  const { location, errorMsg: locationError } = useLocation();
  const { activateSos, results, contactedFacilities, isSearching, searchRadius, errorMsg: sosError } = useSos(location);
  const [isRecording, setIsRecording] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);

  const snapPoints = useMemo(() => ['15%', '40%'], []);

  useEffect(() => {
    VoiceActivation.initialise();
  }, []);

  const handleVoiceResult = async (transcript: string) => {
    setAiProcessing(true);
    try {
      const response = await GroqClient.ask(transcript);
      Alert.alert('AI Advice', response, [
        { text: 'OK' },
        { text: 'Chat More', onPress: () => navigation.navigate('AI Help') }
      ]);
    } catch (err: any) {
      Alert.alert('AI Error', err.message || 'Failed to get AI advice.', [
        { text: 'SMS Fallback', onPress: () => SmsFallback.triggerSmsFallback(transcript, location) },
        { text: 'Cancel', style: 'cancel' }
      ]);
    } finally {
      setAiProcessing(false);
    }
  };

  const handleVoiceError = (err: string) => {
    setIsRecording(false);
    Alert.alert('Voice Error', err);
  };

  const startVoice = () => {
    setIsRecording(true);
    VoiceActivation.startRecording(handleVoiceResult, handleVoiceError);
  };

  const stopVoice = () => {
    setIsRecording(false);
    VoiceActivation.stopRecording();
  };

  const openMap = (lat: number, lon: number, name: string) => {
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${lat},${lon}`;
    const url = Platform.select({
      ios: `${scheme}${name}@${latLng}`,
      android: `${scheme}${latLng}(${name})`
    });
    if (url) Linking.openURL(url);
  };

  const renderItem = ({ item }: { item: PoiResult }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.poiName} numberOfLines={1}>{item.poi.name}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.poi.category.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.poiMeta}>Distance: {item.distanceKm.toFixed(1)} km</Text>
      
      <View style={styles.actions}>
        {item.poi.phone ? (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => Linking.openURL(`tel:${item.poi.phone}`)}
          >
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity 
          style={[styles.actionButton, styles.navButton]}
          onPress={() => openMap(item.poi.lat, item.poi.lon, item.poi.name)}
        >
          <Text style={styles.actionText}>Nav</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ROADSOS</Text>
        
        <View style={styles.gpsRow}>
          <PulsingDot color={locationError || sosError ? theme.colors.sosRed : location ? theme.colors.ambulanceGreen : theme.colors.towingOrange} />
          <Text style={styles.locationText}>
            {locationError || sosError 
              ? (locationError || sosError) 
              : location 
                ? `Location Active (±${Math.round(location.accuracy)}m)` 
                : 'Acquiring GPS...'}
          </Text>
        </View>
      </View>

      {location && (
        <View style={styles.miniMapContainer}>
          <MapView
            style={styles.miniMap}
            initialRegion={{
              latitude: location.lat,
              longitude: location.lon,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
            mapType="standard"
          >
            <Marker coordinate={{ latitude: location.lat, longitude: location.lon }} />
          </MapView>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <SosButton 
          onActivate={activateSos} 
          disabled={isSearching} 
          gpsUnavailable={!location && !!locationError} 
        />
      </View>

      <TouchableOpacity 
        style={[styles.floatingVoiceBtn, isRecording && styles.floatingVoiceBtnActive]}
        onPressIn={startVoice}
        onPressOut={stopVoice}
        disabled={aiProcessing}
      >
        {aiProcessing ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.floatingVoiceText}>{isRecording ? 'Listening...' : 'Hold for AI'}</Text>
        )}
      </TouchableOpacity>

      <BottomSheet
        index={results.length > 0 ? 1 : 0}
        snapPoints={snapPoints}
        backgroundStyle={{ backgroundColor: theme.colors.surfaceElevated }}
        handleIndicatorStyle={{ backgroundColor: theme.colors.text.disabled }}
      >
        <View style={styles.resultsHeaderContainer}>
          <Text style={styles.resultsHeader}>
            {results.length > 0 ? `Nearest Help (${searchRadius}km radius)` : 'No recent searches'}
          </Text>
        </View>
        <BottomSheetFlatList
          data={results}
          keyExtractor={(item) => item.poi.osmId.toString()}
          renderItem={renderItem}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      </BottomSheet>

      {/* Non-dismissable contacted facilities overlay */}
      {contactedFacilities.length > 0 && (
        <View style={styles.overlay}>
          <Text style={styles.overlayTitle}>EMERGENCY CONTACTED</Text>
          {contactedFacilities.map(cf => (
            <View key={cf.poi.osmId} style={styles.contactedCard}>
              <Text style={styles.contactedName}>{cf.poi.name}</Text>
              <Text style={styles.contactedType}>{cf.poi.category.toUpperCase()} - {cf.distanceKm.toFixed(1)}km</Text>
              <Text style={styles.contactedPhone}>{cf.poi.phone || 'No phone'}</Text>
            </View>
          ))}
          <Text style={styles.overlayFooter}>Help is on the way. Stay calm.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    zIndex: 10,
  },
  title: {
    ...theme.typography.screenTitle,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  locationText: {
    ...theme.typography.poiMeta,
    color: theme.colors.text.secondary,
  },
  miniMapContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  miniMap: {
    width: 280,
    height: 200,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  resultsHeaderContainer: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  resultsHeader: {
    ...theme.typography.poiMeta,
    color: theme.colors.text.secondary,
  },
  listContent: {
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    width: 260,
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  poiName: {
    ...theme.typography.poiName,
    color: theme.colors.text.primary,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  badge: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.text.secondary,
  },
  poiMeta: {
    ...theme.typography.poiMeta,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  navButton: {
    backgroundColor: theme.colors.policeBlue,
    borderColor: theme.colors.policeBlue,
  },
  actionText: {
    color: theme.colors.text.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    zIndex: 9999,
  },
  overlayTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.sosRed,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    letterSpacing: 1,
  },
  contactedCard: {
    backgroundColor: '#222',
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.sosRed,
  },
  contactedName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  contactedType: {
    fontSize: 14,
    color: '#CCC',
    marginBottom: 4,
  },
  contactedPhone: {
    fontSize: 16,
    color: '#66B2FF',
    fontWeight: '600',
  },
  overlayFooter: {
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
    marginTop: theme.spacing.xl,
    fontWeight: '600',
  },
  floatingVoiceBtn: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 100,
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  floatingVoiceBtnActive: {
    backgroundColor: theme.colors.policeBlue,
  },
  floatingVoiceText: {
    color: '#000',
    fontWeight: '700',
  }
});


