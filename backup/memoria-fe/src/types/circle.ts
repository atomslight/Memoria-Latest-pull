export interface Circle {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  createdAt: string;
}

export interface CircleListItem extends Circle {
  memberCount: number;
  myRole: 'admin' | 'member';
}

export interface CircleMemberInfo {
  id: string;
  userId: string;
  name: string | null;
  email: string;
  role: 'admin' | 'member';
  joinedAt: string;
}

export interface CircleDetail extends Circle {
  members: CircleMemberInfo[];
  myRole: 'admin' | 'member';
}

export interface CirclePhotoItem {
  id: string;
  photoId: string;
  uploadedBy: string;
  uploaderName: string | null;
  uploadedAt: string;
  thumbnailUrl: string;
  caption: string | null;
}

export interface CirclePhotosResponse {
  photos: CirclePhotoItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface UserSearchResult {
  id: string;
  name: string | null;
  email: string;
}
