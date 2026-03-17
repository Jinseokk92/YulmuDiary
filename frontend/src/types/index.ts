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
  /** 한 줄 소개 — PUT /api/users/me 구현 후 백엔드 연결 */
  bio?: string | null;
  /** 관리자 여부 */
  isAdmin?: boolean;
}

// --- Admin ---

export interface AdminInviteCodesResponse {
  relativeCode: string;
  parentCode: string | null;
}

export interface AdminMemberResponse {
  userId: number;
  name: string;
  email: string;
  profileImageUrl: string | null;
  role: "PARENT" | "RELATIVE";
  joinedAt: string;
}

export interface AdminAppSettingsResponse {
  babyId: number;
  babyName: string;
  dueDate: string; // "YYYY-MM-DD"
}

// --- Baby ---

export interface BabyResponse {
  id: number;
  name: string;
  dueDate: string;       // "YYYY-MM-DD"
  dDayCount: number;     // 양수=D-N(미래), 0=D-Day, 음수=D+N(과거)
  pregnancyWeeks: number;
  pregnancyDays: number;
  gender: string;
  profileImageUrl: string | null;
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

export interface ReactionUserResponse {
  userId: number;
  nickname: string;
  profileImageUrl: string | null;
  emoji: string;
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

// --- UserStats ---

export interface UserStatsResponse {
  postCount: number;
  photoCount: number;
  reactionCount: number;
}

// --- MyReaction ---

export interface MyReactionResponse {
  id: number;
  emoji: string;
  createdAt: string;
  postId: number;
  postContent: string | null;
  postThumbnailUrl: string | null;
}

export interface MyReactionPageResponse {
  items: MyReactionResponse[];
  nextCursor: number | null;
  hasNext: boolean;
}

// --- MyComment ---

export interface MyCommentResponse {
  id: number;
  content: string;
  createdAt: string;
  postId: number;
  postContent: string | null;
  postThumbnailUrl: string | null;
}

export interface MyCommentPageResponse {
  items: MyCommentResponse[];
  nextCursor: number | null;
  hasNext: boolean;
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

// --- Album ---

export type GrowthPhaseType = "PREGNANCY" | "BABY";

export interface AlbumPhotoResponse {
  id: number;
  babyId: number;
  uploaderId: number;
  uploaderNickname: string;
  uploaderProfileImageUrl: string | null;
  url: string;
  thumbnailUrl: string | null;
  growthPhaseType: GrowthPhaseType;
  growthIndex: number;
  caption: string | null;
  takenAt: string | null; // "YYYY-MM-DD"
  createdAt: string;
}

export interface AlbumPhotoPageResponse {
  items: AlbumPhotoResponse[];
  nextCursor: number | null;
  hasNext: boolean;
}

export interface AlbumPhotoFavoriteResponse {
  favorited: boolean;
}

export interface AlbumPhotoRequest {
  babyId: number;
  url: string;
  thumbnailUrl?: string;
  growthPhaseType: GrowthPhaseType;
  growthIndex: number;
  caption?: string;
  takenAt?: string; // "YYYY-MM-DD"
}

// --- Notification ---

export type NotificationType = "COMMENT" | "REACTION";

export interface NotificationResponse {
  id: number;
  senderId: number;
  senderNickname: string;
  senderProfileImageUrl: string | null;
  diaryPostId: number;
  diaryThumbnailUrl: string | null;
  diaryContentSnippet: string | null;
  type: NotificationType;
  message: string;
  /** COMMENT 알림일 때만 포함. 댓글 내용 미리보기 (최대 30자). */
  commentPreview: string | null;
  /** REACTION 알림일 때만 포함. 실제 이모지 문자열 (예: "😍"). */
  reactionEmoji: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationPageResponse {
  items: NotificationResponse[];
  nextCursor: number | null;
  hasNext: boolean;
}

// --- NotificationSettings ---

export interface NotificationSettingsResponse {
  commentNotificationEnabled: boolean;
  reactionNotificationEnabled: boolean;
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
  startTime: string | null; // "HH:mm"
  endTime: string | null;   // "HH:mm"
  placeName: string | null;
  placeAddress: string | null;
  createdAt: string;
}

export interface ScheduleRequest {
  title: string;
  memo?: string;
  eventDate: string; // "YYYY-MM-DD"
  isAllDay?: boolean;
  startTime?: string; // "HH:mm"
  endTime?: string;   // "HH:mm"
  placeName?: string;
  placeAddress?: string;
}
