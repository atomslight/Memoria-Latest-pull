import { create } from 'zustand';
import api from '../utils/api';

export interface FaceGroup {
  id: string;
  user_id: string;
  name: string;
  cover_face_id: string | null;
  _count?: {
    faces: number;
  };
  faces?: { photoId: string; id: string }[];
}

export interface FaceGroupDetail extends FaceGroup {
  faces: {
    id: string;
    photoId: string;
    photo: {
      storagePath: string;
    };
  }[];
}

interface FaceGroupState {
  groups: FaceGroup[];
  isLoading: boolean;
  error: string | null;
  fetchGroups: () => Promise<void>;
  updateGroup: (id: string, name: string) => Promise<void>;
}

export const useFaceGroupStore = create<FaceGroupState>((set) => ({
  groups: [],
  isLoading: false,
  error: null,
  fetchGroups: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get('/face-groups');
      set({ groups: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch face groups', isLoading: false });
    }
  },
  updateGroup: async (id: string, name: string) => {
    try {
      await api.patch(`/face-groups/${id}`, { name });
      set((state) => ({
        groups: state.groups.map(g => g.id === id ? { ...g, name } : g)
      }));
    } catch (err: any) {
      console.error('Failed to update group name:', err);
      throw err;
    }
  }
}));
