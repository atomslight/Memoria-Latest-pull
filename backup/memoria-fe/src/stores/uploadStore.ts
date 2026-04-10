import { create } from 'zustand';

export interface UploadItem {
  id: string;
  uri: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  progress: number;
  error?: string;
  memoryId?: string;
}

interface UploadState {
  uploads: UploadItem[];
  
  // Actions
  addUpload: (upload: Omit<UploadItem, 'id' | 'status' | 'progress'>) => string;
  updateProgress: (id: string, progress: number) => void;
  updateStatus: (id: string, status: UploadItem['status'], error?: string) => void;
  setMemoryId: (id: string, memoryId: string) => void;
  removeUpload: (id: string) => void;
  clearCompleted: () => void;
  clearAll: () => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  uploads: [],

  addUpload: (upload) => {
    const id = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newUpload: UploadItem = {
      ...upload,
      id,
      status: 'pending',
      progress: 0,
    };

    set((state) => ({
      uploads: [...state.uploads, newUpload],
    }));

    return id;
  },

  updateProgress: (id, progress) => {
    set((state) => ({
      uploads: state.uploads.map((upload) =>
        upload.id === id
          ? { ...upload, progress, status: 'uploading' as const }
          : upload
      ),
    }));
  },

  updateStatus: (id, status, error) => {
    set((state) => ({
      uploads: state.uploads.map((upload) =>
        upload.id === id ? { ...upload, status, error } : upload
      ),
    }));
  },

  setMemoryId: (id, memoryId) => {
    set((state) => ({
      uploads: state.uploads.map((upload) =>
        upload.id === id ? { ...upload, memoryId } : upload
      ),
    }));
  },

  removeUpload: (id) => {
    set((state) => ({
      uploads: state.uploads.filter((upload) => upload.id !== id),
    }));
  },

  clearCompleted: () => {
    set((state) => ({
      uploads: state.uploads.filter((upload) => upload.status !== 'completed'),
    }));
  },

  clearAll: () => {
    set({ uploads: [] });
  },
}));
