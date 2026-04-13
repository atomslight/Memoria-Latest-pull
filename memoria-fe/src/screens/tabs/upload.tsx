import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { useState, useRef, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants';

// expo-camera is not installed — using expo-image-picker fallback
// with a black viewfinder placeholder

const FILTERS = ['Original', 'Vivid', 'Dramatic', 'Mono', 'Noir'] as const;
type Filter = (typeof FILTERS)[number];
type FlashMode = 'off' | 'on' | 'auto';
type TimerMode = 'off' | '3s' | '10s';
type Facing = 'front' | 'back';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function CameraScreen() {
  const navigation = useNavigation<any>();

  // Camera permission state (using ImagePicker camera permission as proxy)
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  // Controls state
  const [flash, setFlash] = useState<FlashMode>('off');
  const [timer, setTimer] = useState<TimerMode>('off');
  const [gridVisible, setGridVisible] = useState(false);
  const [facing, setFacing] = useState<Facing>('back');
  const device = useCameraDevice(facing);
  const cameraRef = useRef<Camera>(null);
  const [activeFilter, setActiveFilter] = useState<Filter>('Original');

  // Countdown state
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    requestPermission();
    return () => {
      if (countdownRef.current) clearTimeout(countdownRef.current);
    };
  }, []);

  const requestPermission = async () => {
  const status = await Camera.requestCameraPermission();
  setPermissionGranted(status === 'granted');
};

  // Flash icon helper
  const flashIcon = (): string => {
    if (flash === 'off') return 'flash-off';
    if (flash === 'on') return 'flash';
    return 'flash-outline'; // auto
  };

  const cycleFlash = () => {
    setFlash((prev) => (prev === 'off' ? 'on' : prev === 'on' ? 'auto' : 'off'));
  };

  const cycleTimer = () => {
    setTimer((prev) => (prev === 'off' ? '3s' : prev === '3s' ? '10s' : 'off'));
  };

  const flipCamera = () => {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  // Shutter: since no real camera, open camera via ImagePicker
  const handleShutter = () => {
    const seconds = timer === '3s' ? 3 : timer === '10s' ? 10 : 0;
    if (seconds > 0) {
      runCountdown(seconds, takePicture);
    } else {
      takePicture();
    }
  };

  const runCountdown = (seconds: number, callback: () => void) => {
    setCountdown(seconds);
    let remaining = seconds;
    const tick = () => {
      remaining -= 1;
      if (remaining <= 0) {
        setCountdown(null);
        callback();
      } else {
        setCountdown(remaining);
        countdownRef.current = setTimeout(tick, 1000);
      }
    };
    countdownRef.current = setTimeout(tick, 1000);
  };

  const takePicture = async () => {
  try {
    const photo = await cameraRef.current?.takePhoto({
      flash: flash === 'auto' ? 'auto' : flash === 'on' ? 'on' : 'off',
    });
    if (photo?.path) {
      navigation.navigate('CameraPostCapture', { uri: 'file://' + photo.path });
    }
  } catch {
    // silently ignore
  }
};

  const handleGallery = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 1,
      });
      const asset = result.assets?.[0];
      if (asset?.uri) {
        navigation.navigate('CameraPostCapture', { uri: asset.uri });
      }
    } catch {
      // silently ignore
    }
  };

  // ── Permission denied screen ──────────────────────────────────────────────
  if (permissionGranted === false) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color={COLORS.textSecondary} />
        <Text style={styles.permissionText}>Camera access required</Text>
        <TouchableOpacity style={styles.settingsButton} onPress={() => Linking.openSettings()}>
          <Text style={styles.settingsButtonText}>Open Settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Loading (permission not yet determined) ───────────────────────────────
  if (permissionGranted === null) {
    return <View style={styles.loadingContainer} />;
  }

  // ── Main camera screen ────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      {/* Viewfinder — black placeholder (expo-camera not installed) */}
      <View style={StyleSheet.absoluteFillObject}>
        {device ? (
          <Camera
            ref={cameraRef}
            style={StyleSheet.absoluteFillObject}
            device={device}
            isActive={true}
            photo={true}
          />
        ) : (
          <View style={styles.viewfinder} />
        )}
      </View>

      {/* Grid overlay */}
      {gridVisible && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          {/* Vertical lines */}
          <View style={[styles.gridLine, styles.gridVertical1]} />
          <View style={[styles.gridLine, styles.gridVertical2]} />
          {/* Horizontal lines */}
          <View style={[styles.gridLine, styles.gridHorizontal1]} />
          <View style={[styles.gridLine, styles.gridHorizontal2]} />
        </View>
      )}

      {/* Countdown overlay */}
      {countdown !== null && (
        <View style={styles.countdownOverlay} pointerEvents="none">
          <Text style={styles.countdownText}>{countdown}</Text>
        </View>
      )}

      {/* ── Top controls bar ─────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="close" size={28} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.topBarRight}>
          {/* Flash */}
          <TouchableOpacity onPress={cycleFlash} style={styles.topBarButton} hitSlop={8}>
            <Ionicons name={flashIcon()} size={24} color={COLORS.white} />
          </TouchableOpacity>

          {/* Timer */}
          <TouchableOpacity onPress={cycleTimer} style={styles.topBarButton} hitSlop={8}>
            <Ionicons name="timer-outline" size={24} color={COLORS.white} />
            {timer !== 'off' && <Text style={styles.timerLabel}>{timer}</Text>}
          </TouchableOpacity>

          {/* Grid */}
          <TouchableOpacity onPress={() => setGridVisible((v) => !v)} style={styles.topBarButton} hitSlop={8}>
            <Ionicons name="grid-outline" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Bottom controls ───────────────────────────────────────────────── */}
      <View style={styles.bottomBar}>
        {/* Active filter label */}
        <Text style={styles.activeFilterLabel}>{activeFilter}</Text>

        {/* Filter strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterStrip}
          style={styles.filterScroll}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity key={f} onPress={() => setActiveFilter(f)} style={styles.filterChip}>
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Controls row */}
        <View style={styles.controlsRow}>
          {/* Gallery */}
          <TouchableOpacity style={styles.galleryButton} onPress={handleGallery}>
            <Ionicons name="images-outline" size={28} color={COLORS.white} />
          </TouchableOpacity>

          {/* Shutter */}
          <TouchableOpacity style={styles.shutterOuter} onPress={handleShutter}>
            <View style={styles.shutterInner} />
          </TouchableOpacity>

          {/* Flip */}
          <TouchableOpacity style={styles.flipButton} onPress={flipCamera}>
            <Ionicons name="camera-reverse-outline" size={28} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  viewfinder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },

  // Permission denied
  permissionContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  permissionText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.white,
    textAlign: 'center',
  },
  settingsButton: {
    backgroundColor: COLORS.brandYellow,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 4,
    borderRadius: 8,
    marginTop: SPACING.sm,
  },
  settingsButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.black,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },

  // Grid overlay
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  gridVertical1: {
    width: 1,
    top: 0,
    bottom: 0,
    left: SCREEN_WIDTH / 3,
  },
  gridVertical2: {
    width: 1,
    top: 0,
    bottom: 0,
    left: (SCREEN_WIDTH / 3) * 2,
  },
  gridHorizontal1: {
    height: 1,
    left: 0,
    right: 0,
    top: SCREEN_HEIGHT / 3,
  },
  gridHorizontal2: {
    height: 1,
    left: 0,
    right: 0,
    top: (SCREEN_HEIGHT / 3) * 2,
  },

  // Countdown
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownText: {
    fontSize: 96,
    fontWeight: '700',
    color: COLORS.white,
    opacity: 0.9,
  },

  // Top bar
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  topBarButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    position: 'absolute',
    bottom: -10,
    fontSize: 9,
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  activeFilterLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  filterScroll: {
    marginBottom: SPACING.md,
  },
  filterStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    gap: SPACING.lg,
  },
  filterChip: {
    paddingVertical: SPACING.xs,
  },
  filterText: {
    ...TYPOGRAPHY.body2,
    color: 'rgba(255,255,255,0.5)',
  },
  filterTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },

  // Controls row
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  galleryButton: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.white,
  },
  flipButton: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
