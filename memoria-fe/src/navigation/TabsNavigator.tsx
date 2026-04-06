import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CustomTabBar } from '../components/navigation/CustomTabBar';

import HomeScreen from '../screens/tabs/index';
import CirclesScreen from '../screens/tabs/circles';
import UploadScreen from '../screens/tabs/upload';
import ThreadsScreen from '../screens/tabs/threads';
import SettingsScreen from '../screens/tabs/settings';

export type TabsParamList = {
  index: undefined;
  circles: undefined;
  upload: undefined;
  threads: undefined;
  settings: undefined;
};

const Tab = createBottomTabNavigator<TabsParamList>();

export function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="index" component={HomeScreen} />
      <Tab.Screen name="circles" component={CirclesScreen} />
      <Tab.Screen name="upload" component={UploadScreen} />
      <Tab.Screen name="threads" component={ThreadsScreen} />
      <Tab.Screen name="settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

