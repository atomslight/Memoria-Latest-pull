import React, { useEffect, useState } from 'react';
 import {
   View,
   Text,
   FlatList,
   Image,
   TouchableOpacity,
   StyleSheet,
   Alert,
   TextInput,
   Modal,
 } from 'react-native';
 import { SafeAreaView } from 'react-native-safe-area-context';
 import { useNavigation } from '@react-navigation/native';
 import { useAppTheme } from '../../theme/ThemeContext';
 import { api } from '../../utils/api';
 import { TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants';

 interface FaceGroup {
   id: string;
   name: string;
   label: string;
   faceCount: number;
   coverPhotoUrl: string | null;
 }

 export function FaceGroupsScreen() {
   const [groups, setGroups] = useState<FaceGroup[]>([]);
   const [loading, setLoading] = useState(true);
   const [editModal, setEditModal] = useState<{ visible: boolean; groupId: string | null; name: string }>({
     visible: false,
     groupId: null,
     name: ''
   });
   const c = useAppTheme();
   const navigation = useNavigation<any>();
   const styles = createStyles(c);

   useEffect(() => {
     fetchGroups();
   }, []);

   const fetchGroups = async () => {
     try {
       const response = await api.get('/face-groups');
       setGroups(response.data.groups);
     } catch (err) {
       console.error('Failed to fetch face groups', err);
     } finally {
       setLoading(false);
     }
   };

   const handleRename = async () => {
     if (!editModal.groupId) return;
     try {
       await api.patch(`/face-groups/${editModal.groupId}`, { name: editModal.name });
       setEditModal({ visible: false, groupId: null, name: '' });
       fetchGroups();
     } catch (err) {
       Alert.alert('Error', 'Failed to rename group');
     }
   };

   const renderGroup = ({ item }: { item: FaceGroup }) => (
     <TouchableOpacity
       style={styles.groupCard}
       onPress={() => navigation.navigate('FaceGroupPhotos', { groupId: item.id, name: item.name })}
       onLongPress={() => setEditModal({ visible: true, groupId: item.id, name: item.name })}
     >
       {item.coverPhotoUrl ? (
         <Image source={{ uri: item.coverPhotoUrl }} style={styles.coverImage} />
       ) : (
         <View style={[styles.coverImage, { backgroundColor: c.surface }]}>
           <Text style={{ color: c.textTertiary }}>No photo</Text>
         </View>
       )}
       <View style={styles.groupInfo}>
         <Text style={[styles.groupName, { color: c.textPrimary }]}>{item.name}</Text>
         <Text style={[styles.groupCount, { color: c.textSecondary }]}>{item.faceCount} photos</Text>
       </View>
     </TouchableOpacity>
   );

   return (
     <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
       <Text style={[styles.title, { color: c.textPrimary }]}>Faces</Text>
       <Text style={[styles.subtitle, { color: c.textSecondary }]}>
         Photos grouped by detected faces
       </Text>

       <FlatList
         data={groups}
         keyExtractor={(item) => item.id}
         renderItem={renderGroup}
         numColumns={2}
         contentContainerStyle={styles.list}
         onRefresh={fetchGroups}
         refreshing={loading}
       />

       <Modal visible={editModal.visible} transparent animationType="fade">
         <View style={styles.modalOverlay}>
           <View style={[styles.modalContent, { backgroundColor: c.surface }]}>
             <Text style={[styles.modalTitle, { color: c.textPrimary }]}>Rename Group</Text>
             <TextInput
               style={[styles.input, { color: c.textPrimary, borderColor: c.border }]}
               value={editModal.name}
               onChangeText={(text) => setEditModal({ ...editModal, name: text })}
               placeholder="Enter name"
               placeholderTextColor={c.textTertiary}
             />
             <View style={styles.modalButtons}>
               <TouchableOpacity onPress={() => setEditModal({ visible: false, groupId: null, name: '' })}>
                 <Text style={{ color: c.textSecondary }}>Cancel</Text>
               </TouchableOpacity>
               <TouchableOpacity onPress={handleRename}>
                 <Text style={{ color: c.brandYellow }}>Save</Text>
               </TouchableOpacity>
             </View>
           </View>
         </View>
       </Modal>
     </SafeAreaView>
   );
 }

 function createStyles(c: any) {
   return StyleSheet.create({
     container: { flex: 1 },
     title: { ...TYPOGRAPHY.h2, padding: SPACING.lg, paddingBottom: 0 },
     subtitle: { ...TYPOGRAPHY.body2, paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
     list: { padding: SPACING.sm },
     groupCard: {
       flex: 1,
       margin: SPACING.xs,
       borderRadius: BORDER_RADIUS.lg,
       overflow: 'hidden',
     },
     coverImage: { width: '100%', aspectRatio: 1, borderRadius: BORDER_RADIUS.md },
     groupInfo: { padding: SPACING.sm },
     groupName: { ...TYPOGRAPHY.body1 },
     groupCount: { ...TYPOGRAPHY.caption, marginTop: 2 },
     modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
     modalContent: { padding: SPACING.lg, borderRadius: BORDER_RADIUS.lg, width: '80%' },
     modalTitle: { ...TYPOGRAPHY.h3, marginBottom: SPACING.md },
     input: { borderWidth: 1, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md },
     modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: SPACING.md },
   });
 }