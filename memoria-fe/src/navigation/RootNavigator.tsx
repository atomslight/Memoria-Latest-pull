import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../stores/authStore';
import { appConfig } from '../config/appConfig';

import LandingScreen from '../screens/LandingScreen';
import LoginEmailScreen from '../screens/auth/login-email';
import LoginPasswordScreen from '../screens/auth/login-password';
import SignupEmailScreen from '../screens/auth/signup-email';
import SignupPasswordScreen from '../screens/auth/signup-password';
import SignupNameScreen from '../screens/auth/signup-name';
import SignupBioScreen from '../screens/auth/signup-bio';
import SignupProfilePicScreen from '../screens/auth/signup-profile-pic';

import { AppTabs } from './TabsNavigator';
import MemoryScreen from '../screens/MemoryScreen';
import CircleDetailsScreen from '../screens/circle/CircleDetailsScreen';
import CircleMembersScreen from '../screens/circle/members';
import CircleCreateScreen from '../screens/circle/create';
import PostCaptureScreen from '../screens/camera/post-capture';
import SmartPanelScreen from '../screens/camera/smart-panel';

import ProfileEditScreen from '../screens/profile/edit';
import ProfileActiveDevicesScreen from '../screens/profile/active-devices';
import ProfileFaceTaggingScreen from '../screens/profile/face-tagging';
import ProfileLanguageScreen from '../screens/profile/language';
import ProfileSmartPlacesScreen from '../screens/profile/smart-places';
import FaceGroupScreen from '../screens/tabs/faceGroupScreen';

export type RootStackParamList = {
  Landing: undefined;
  AuthLoginEmail: undefined;
  AuthLoginPassword: { email: string };
  AuthSignupEmail: undefined;
  AuthSignupPassword: { email: string };
  AuthSignupName: { email: string; password: string };
  AuthSignupBio: { email: string; password: string; name: string };
  AuthSignupProfilePic: {
    email: string;
    password: string;
    name: string;
    bio?: string;
  };
  Tabs: undefined;
  Memory: { id?: string } | undefined;
  CircleDetails: { id: string };
  CircleMembers: { id: string };
  CircleCreate: undefined;
  CameraPostCapture: { uri: string };
  CameraSmartPanel: undefined;
  ProfileEdit: undefined;
  ProfileActiveDevices: undefined;
  ProfileFaceTagging: undefined;
  ProfileLanguage: undefined;
  ProfileSmartPlaces: undefined;
  FaceGroupScreen: { id: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const BYPASS_AUTH = !!appConfig.bypassAuth;

  if (isLoading) {
    // Screens already handle their own loading visuals; keep stack minimal here.
    return null;
  }

  if (BYPASS_AUTH) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={AppTabs} />
        <Stack.Screen name="Memory" component={MemoryScreen} />
        <Stack.Screen name="CircleDetails" component={CircleDetailsScreen} />
        <Stack.Screen name="CircleMembers" component={CircleMembersScreen} />
        <Stack.Screen name="CircleCreate" component={CircleCreateScreen} />
        <Stack.Screen name="CameraPostCapture" component={PostCaptureScreen} />
        <Stack.Screen name="CameraSmartPanel" component={SmartPanelScreen} />
        <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
        <Stack.Screen name="ProfileActiveDevices" component={ProfileActiveDevicesScreen} />
        <Stack.Screen name="ProfileFaceTagging" component={ProfileFaceTaggingScreen} />
        <Stack.Screen name="ProfileLanguage" component={ProfileLanguageScreen} />
        <Stack.Screen name="ProfileSmartPlaces" component={ProfileSmartPlacesScreen} />
        <Stack.Screen name="FaceGroupScreen" component={FaceGroupScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="AuthLoginEmail" component={LoginEmailScreen} />
          <Stack.Screen name="AuthLoginPassword" component={LoginPasswordScreen} />
          <Stack.Screen name="AuthSignupEmail" component={SignupEmailScreen} />
          <Stack.Screen name="AuthSignupPassword" component={SignupPasswordScreen} />
          <Stack.Screen name="AuthSignupName" component={SignupNameScreen} />
          <Stack.Screen name="AuthSignupBio" component={SignupBioScreen} />
          <Stack.Screen name="AuthSignupProfilePic" component={SignupProfilePicScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Tabs" component={AppTabs} />
          <Stack.Screen name="Memory" component={MemoryScreen} />
          <Stack.Screen name="CircleDetails" component={CircleDetailsScreen} />
          <Stack.Screen name="CircleMembers" component={CircleMembersScreen} />
          <Stack.Screen name="CircleCreate" component={CircleCreateScreen} />
          <Stack.Screen name="CameraPostCapture" component={PostCaptureScreen} />
          <Stack.Screen name="CameraSmartPanel" component={SmartPanelScreen} />
          <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
          <Stack.Screen name="ProfileActiveDevices" component={ProfileActiveDevicesScreen} />
          <Stack.Screen name="ProfileFaceTagging" component={ProfileFaceTaggingScreen} />
          <Stack.Screen name="ProfileLanguage" component={ProfileLanguageScreen} />
          <Stack.Screen name="ProfileSmartPlaces" component={ProfileSmartPlacesScreen} />
          <Stack.Screen name="FaceGroupScreen" component={FaceGroupScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

