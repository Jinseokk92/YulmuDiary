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
}

// /api/auth/me 응답 전용 타입
export interface AuthMeResponse {
  id: number;
  email: string;
  name: string;
  profileImageUrl: string | null;
  role: string;
  familyGroupId: number | null;
}

// --- Baby ---

export interface BabyResponse {
  id: number;
  name: string;
  dueDate: string;        // YYYY-MM-DD
  dDayCount: number;      // 양수=D-N(남은 일수), 0=D-Day, 음수=D+N(지난 일수)
  pregnancyWeeks: number; // 임신 주차
  pregnancyDays: number;  // 주차 내 나머지 일수
  gender: "MALE" | "FEMALE";
  profileImageUrl: string | null;
}

// --- Family ---

export interface FamilyJoinRequest {
  inviteCode: string;
}

export interface FamilyJoinResponse {
  familyGroupId: number;
  familyGroupName: string;
  role: string;
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
  address: string | null;
  addressDetail: string | null;
  createdAt: string;
}

export interface ScheduleRequest {
  title: string;
  memo?: string;
  eventDate: string; // "YYYY-MM-DD"
  isAllDay?: boolean;
  placeName?: string;
  address?: string;
  addressDetail?: string;
}
