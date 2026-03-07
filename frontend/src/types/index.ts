// --- API 공통 ---

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  code: string;
  message: string;
}

// --- User ---

export interface UserResponse {
  id: number;
  name: string;
  profileImageUrl: string | null;
  email?: string;
  /** /api/auth/me 응답에만 포함. 가족 그룹 내 역할. */
  role?: "PARENT" | "RELATIVE";
  familyGroupId?: number | null;
}

// --- Media ---

export interface MediaDto {
  id: number;
  url: string;
  thumbnailUrl: string | null;
  type: "PHOTO" | "VIDEO";
  displayOrder: number;
}

export interface ImagePaths {
  imageUrl: string;
  thumbnailUrl: string;
}

export interface MediaUploadResponse {
  images: ImagePaths[];
}

// --- Reaction ---

export interface ReactionResponse {
  id: number;
  userId: number;
  emoji: string;
  createdAt: string;
}

export interface ReactionRequest {
  emoji: string;
}

// --- Comment ---

export interface CommentResponse {
  id: number;
  authorId: number;
  nickname: string;
  content: string;
  createdAt: string;
}

export interface CommentRequest {
  content: string;
}

// --- DiaryPost ---

export interface DiaryPostResponse {
  id: number;
  babyId: number;
  authorId: number;
  authorNickname: string;
  authorProfileImageUrl?: string | null;
  content: string;
  milestoneTag: string | null;
  media: MediaDto[];
  commentCount: number;
  reactions: ReactionResponse[];
  createdAt: string;
}

export interface DiaryPostRequest {
  babyId: number;
  content: string;
  milestoneTag?: string;
  mediaUrls: string[];
  mediaThumbnailUrls: string[];
}

export interface DiaryPostPageResponse {
  items: DiaryPostResponse[];
  nextCursor: number | null;
  hasNext: boolean;
}

export interface DiaryPostPaginatedResponse {
  content: DiaryPostResponse[];
  totalElements: number;
  totalPages: number;
  currentPage: number; // 1-based
}

// --- Family ---

export interface FamilyMembershipResponse {
  membershipId: number;
  familyGroupId: number;
  familyGroupName: string;
  role: "PARENT" | "RELATIVE";
}

// --- Schedule ---

export interface ScheduleResponse {
  id: number;
  userId: number;
  userNickname: string;
  title: string;
  memo: string | null;
  eventDate: string; // "YYYY-MM-DD"
  isAllDay: boolean;
  placeName: string | null;
  placeAddress: string | null;
  createdAt: string;
}

export interface ScheduleRequest {
  title: string;
  memo?: string;
  eventDate: string; // "YYYY-MM-DD"
  isAllDay?: boolean;
  placeName?: string;
  placeAddress?: string;
}
