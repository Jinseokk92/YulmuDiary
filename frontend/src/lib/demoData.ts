import type {
  UserResponse,
  DiaryPostResponse,
  DiaryPostPageResponse,
  DiaryPostPaginatedResponse,
  CommentResponse,
  ReactionResponse,
  ScheduleResponse,
  NotificationResponse,
  NotificationPageResponse,
  UserStatsResponse,
  NotificationSettingsResponse,
  ScheduleRequest,
  MyReactionResponse,
  MyReactionPageResponse,
  MyCommentResponse,
  MyCommentPageResponse,
  AlbumPhotoResponse,
  AlbumPhotoPageResponse,
  AlbumPhotoFavoriteResponse,
  AlbumPhotoRequest,
  MediaUploadResponse,
  MilestoneResponse,
} from "@/types";

// ─── 상수 ────────────────────────────────────────────────────────────────────

export const DEMO_USER: UserResponse = {
  id: -1,
  name: "체험판 사용자",
  profileImageUrl: null,
  email: "demo@yulmudiary.app",
  role: "PARENT",
  familyGroupId: 99999,
  bio: "율무일기를 체험 중이에요 🌱",
};

const STORAGE_KEYS = {
  posts: "demo_diary_posts",
  comments: "demo_comments",
  schedules: "demo_schedules",
  notifications: "demo_notifications",
  notificationSettings: "demo_notification_settings",
  nextId: "demo_next_id",
  demoMode: "demoMode",
  albumPhotos: "demo_album_photos",
  albumFavorites: "demo_album_favorites",
  milestones: "demo_milestones",
} as const;

// ─── 날짜 헬퍼 ───────────────────────────────────────────────────────────────

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function isoNow(offsetMs = 0): string {
  return new Date(Date.now() + offsetMs).toISOString();
}

// ─── 초기 목 데이터 ──────────────────────────────────────────────────────────

function buildInitialPosts(): DiaryPostResponse[] {
  return [
    {
      id: 9002,
      babyId: 1,
      authorId: -1,
      authorNickname: "체험판 사용자",
      authorProfileImageUrl: null,
      content: "오늘 율무가 처음으로 뒤집기에 성공했어요! 작은 것 같지만 정말 큰 발전이죠 🎉 앞으로 어떻게 자랄지 너무 기대돼요.",
      milestoneTag: "첫 뒤집기",
      media: [],
      commentCount: 1,
      reactions: [
        { id: 8001, userId: -2, emoji: "😍", createdAt: isoNow(-3600000) },
        { id: 8002, userId: -3, emoji: "👏", createdAt: isoNow(-1800000) },
      ],
      createdAt: isoNow(-7200000),
    },
    {
      id: 9001,
      babyId: 1,
      authorId: -1,
      authorNickname: "체험판 사용자",
      authorProfileImageUrl: null,
      content: "율무 D+30일 기념 사진이에요. 벌써 한 달이 지났다니 믿기지 않아요. 매일매일 새로운 표정을 보여주는 율무 덕분에 행복한 나날입니다 ❤️",
      milestoneTag: "D+30",
      media: [],
      commentCount: 2,
      reactions: [
        { id: 8003, userId: -2, emoji: "❤️", createdAt: isoNow(-86400000) },
      ],
      createdAt: isoNow(-86400000),
    },
  ];
}

function buildInitialComments(): Record<string, CommentResponse[]> {
  return {
    "9002": [
      {
        id: 7001,
        authorId: -2,
        nickname: "율무 할머니",
        content: "우리 율무 최고! 뒤집기도 하고 정말 대단해요 💕",
        createdAt: isoNow(-3000000),
      },
    ],
    "9001": [
      {
        id: 7002,
        authorId: -2,
        nickname: "율무 할머니",
        content: "벌써 한 달이나 됐네요. 쑥쑥 자라렴 🌱",
        createdAt: isoNow(-80000000),
      },
      {
        id: 7003,
        authorId: -3,
        nickname: "율무 이모",
        content: "너무 귀여워요! 빨리 보고 싶다 ☺️",
        createdAt: isoNow(-75000000),
      },
    ],
  };
}

function buildInitialSchedules(): ScheduleResponse[] {
  return [
    {
      id: 6001,
      userId: -1,
      userNickname: "체험판 사용자",
      title: "소아과 정기 검진",
      memo: "예방접종 확인 필요",
      eventDate: daysFromNow(7),
      isAllDay: false,
      startTime: "10:00",
      endTime: "11:00",
      placeName: "율무 소아과",
      placeAddress: "서울시 강남구 테헤란로 123",
      createdAt: isoNow(-172800000),
    },
    {
      id: 6002,
      userId: -1,
      userNickname: "체험판 사용자",
      title: "출산 예정일",
      memo: "D-day",
      eventDate: daysFromNow(105),
      isAllDay: true,
      startTime: null,
      endTime: null,
      placeName: null,
      placeAddress: null,
      createdAt: isoNow(-259200000),
    },
  ];
}

function buildInitialNotifications(): NotificationResponse[] {
  return [
    {
      id: 5001,
      senderId: -2,
      senderNickname: "율무 할머니",
      senderProfileImageUrl: null,
      diaryPostId: 9002,
      diaryThumbnailUrl: null,
      diaryContentSnippet: "오늘 율무가 처음으로 뒤집기에...",
      type: "COMMENT",
      message: "율무 할머니님이 댓글을 남겼어요.",
      commentPreview: "우리 율무 최고! 뒤집기도 하고 정말 대단해요 💕",
      reactionEmoji: null,
      isRead: false,
      createdAt: isoNow(-3000000),
    },
    {
      id: 5002,
      senderId: -3,
      senderNickname: "율무 이모",
      senderProfileImageUrl: null,
      diaryPostId: 9001,
      diaryThumbnailUrl: null,
      diaryContentSnippet: "율무 D+30일 기념 사진이에요...",
      type: "REACTION",
      message: "율무 이모님이 반응을 남겼어요.",
      commentPreview: null,
      reactionEmoji: "❤️",
      isRead: true,
      createdAt: isoNow(-86400000),
    },
  ];
}

function buildInitialNotificationSettings(): NotificationSettingsResponse {
  return {
    commentNotificationEnabled: true,
    reactionNotificationEnabled: true,
  };
}

function buildInitialMilestones(): MilestoneResponse[] {
  return [
    { id: 7001, milestoneKey: "BORN",           title: "세상에 태어난 날",    description: "우리 가족이 된 첫 순간",                  expectedMonth: "0개월",      photoUrls: [], achievedDate: daysFromNow(-90), memo: "드디어 율무가 왔어요!",         displayOrder: 1,  achieved: true  },
    { id: 7002, milestoneKey: "FIRST_HOME",     title: "처음 집에 온 날",     description: "드디어 우리 집에 온 날",                  expectedMonth: "0개월",      photoUrls: [], achievedDate: daysFromNow(-88), memo: null,                             displayOrder: 2,  achieved: true  },
    { id: 7003, milestoneKey: "SOCIAL_SMILE",   title: "사회적 미소",         description: "엄마, 아빠를 보며 방긋 웃는 순간",        expectedMonth: "2개월",      photoUrls: [], achievedDate: daysFromNow(-30), memo: "너무 귀여워서 심장이 녹았어요",  displayOrder: 3,  achieved: true  },
    { id: 7004, milestoneKey: "BABBLING",       title: "옹알이",              description: "아우, 우, 구 처음 소리를 내기 시작한 날", expectedMonth: "3개월",      photoUrls: [], achievedDate: null,            memo: null,                             displayOrder: 4,  achieved: false },
    { id: 7005, milestoneKey: "HEAD_CONTROL",   title: "목 가누기",           description: "안았을 때 머리를 안정적으로 드는 순간",   expectedMonth: "4개월",      photoUrls: [], achievedDate: null,            memo: null,                             displayOrder: 5,  achieved: false },
    { id: 7006, milestoneKey: "ROLLING",        title: "뒤집기",              description: "스스로 뒤집은 그 감동의 순간",            expectedMonth: "5~6개월",    photoUrls: [], achievedDate: null,            memo: null,                             displayOrder: 6,  achieved: false },
    { id: 7007, milestoneKey: "SITTING",        title: "혼자 앉기",           description: "혼자 앉아있는 모습에 감동",               expectedMonth: "6~7개월",    photoUrls: [], achievedDate: null,            memo: null,                             displayOrder: 7,  achieved: false },
    { id: 7008, milestoneKey: "COMMANDO_CRAWL", title: "배밀이",              description: "세상을 향해 움직이기 시작한 날",          expectedMonth: "7~9개월",    photoUrls: [], achievedDate: null,            memo: null,                             displayOrder: 8,  achieved: false },
    { id: 7009, milestoneKey: "CRAWLING",       title: "기어다니기",          description: "활동 반경이 확 넓어진 순간",              expectedMonth: "7~9개월",    photoUrls: [], achievedDate: null,            memo: null,                             displayOrder: 9,  achieved: false },
    { id: 7010, milestoneKey: "PULLING_UP",     title: "붙잡고 서기",         description: "걸음마 직전, 두 다리로 선 날",            expectedMonth: "9~11개월",   photoUrls: [], achievedDate: null,            memo: null,                             displayOrder: 10, achieved: false },
    { id: 7011, milestoneKey: "FIRST_TOOTH",    title: "첫니",                description: "작은 이가 반짝, 큰 변화",                 expectedMonth: "10~12개월",  photoUrls: [], achievedDate: null,            memo: null,                             displayOrder: 11, achieved: false },
    { id: 7012, milestoneKey: "CLAPPING",       title: "짝짜꿍/빠이빠이",     description: "가족 모두가 환호한 순간",                 expectedMonth: "10~12개월",  photoUrls: [], achievedDate: null,            memo: null,                             displayOrder: 12, achieved: false },
    { id: 7013, milestoneKey: "FIRST_STEPS",    title: "첫 걸음마",           description: "두세 걸음이라도 떼면 대형 이벤트",        expectedMonth: "12개월",     photoUrls: [], achievedDate: null,            memo: null,                             displayOrder: 13, achieved: false },
    { id: 7014, milestoneKey: "FIRST_WORD",     title: "첫말",                description: "엄마, 아빠 첫 의미 있는 말",              expectedMonth: "12개월",     photoUrls: [], achievedDate: null,            memo: null,                             displayOrder: 14, achieved: false },
  ];
}

// ─── sessionStorage 헬퍼 ─────────────────────────────────────────────────────

function ssGet<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function ssSet<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("[Demo] sessionStorage 저장 실패 (용량 초과?):", key, e);
  }
}

function getNextId(): number {
  const current = ssGet<number>(STORAGE_KEYS.nextId) ?? 9100;
  ssSet(STORAGE_KEYS.nextId, current + 1);
  return current;
}

// ─── 초기화 ──────────────────────────────────────────────────────────────────

export function ensureDemoDataInitialized(): void {
  if (typeof window === "undefined") return;

  if (!sessionStorage.getItem(STORAGE_KEYS.posts)) {
    ssSet(STORAGE_KEYS.posts, buildInitialPosts());
  }
  if (!sessionStorage.getItem(STORAGE_KEYS.comments)) {
    ssSet(STORAGE_KEYS.comments, buildInitialComments());
  }
  if (!sessionStorage.getItem(STORAGE_KEYS.schedules)) {
    ssSet(STORAGE_KEYS.schedules, buildInitialSchedules());
  }
  if (!sessionStorage.getItem(STORAGE_KEYS.notifications)) {
    ssSet(STORAGE_KEYS.notifications, buildInitialNotifications());
  }
  if (!sessionStorage.getItem(STORAGE_KEYS.notificationSettings)) {
    ssSet(STORAGE_KEYS.notificationSettings, buildInitialNotificationSettings());
  }
  if (!sessionStorage.getItem(STORAGE_KEYS.nextId)) {
    ssSet(STORAGE_KEYS.nextId, 9100);
  }
  if (!sessionStorage.getItem(STORAGE_KEYS.albumPhotos)) {
    ssSet(STORAGE_KEYS.albumPhotos, []);
  }
  if (!sessionStorage.getItem(STORAGE_KEYS.albumFavorites)) {
    ssSet(STORAGE_KEYS.albumFavorites, [] as number[]);
  }
  if (!sessionStorage.getItem(STORAGE_KEYS.milestones)) {
    ssSet(STORAGE_KEYS.milestones, buildInitialMilestones());
  }
}

/** 체험판 데이터를 모두 지우고 초기 mock 데이터로 되돌린다. */
export function resetDemoData(): void {
  if (typeof window === "undefined") return;
  // STORAGE_KEYS에 정의된 모든 키 삭제
  (Object.values(STORAGE_KEYS) as string[]).forEach((key) => sessionStorage.removeItem(key));
  // 초기 데이터로 재세팅
  ensureDemoDataInitialized();
}

// ─── URL 파싱 헬퍼 ───────────────────────────────────────────────────────────

function parseQuery(endpoint: string): Record<string, string> {
  const idx = endpoint.indexOf("?");
  if (idx === -1) return {};
  const params = new URLSearchParams(endpoint.slice(idx + 1));
  const result: Record<string, string> = {};
  params.forEach((v, k) => { result[k] = v; });
  return result;
}

function pathOnly(endpoint: string): string {
  const idx = endpoint.indexOf("?");
  return idx === -1 ? endpoint : endpoint.slice(0, idx);
}

// ─── 메인 핸들러 ─────────────────────────────────────────────────────────────

export function handleDemoRequest<T>(
  endpoint: string,
  method: string,
  body?: unknown
): T {
  const path = pathOnly(endpoint);
  const query = parseQuery(endpoint);

  // ── GET /api/auth/me ──────────────────────────────────────────────────────
  if (method === "GET" && path === "/api/auth/me") {
    return DEMO_USER as unknown as T;
  }

  // ── GET /api/users/me/stats ───────────────────────────────────────────────
  if (method === "GET" && path === "/api/users/me/stats") {
    const posts = ssGet<DiaryPostResponse[]>(STORAGE_KEYS.posts) ?? [];
    const stats: UserStatsResponse = {
      postCount: posts.length,
      photoCount: posts.reduce((acc, p) => acc + p.media.length, 0),
      reactionCount: posts.reduce((acc, p) => acc + p.reactions.filter(r => r.userId === -1).length, 0),
    };
    return stats as unknown as T;
  }

  // ── GET /api/users/notification-settings ─────────────────────────────────
  if (method === "GET" && path === "/api/users/notification-settings") {
    const settings = ssGet<NotificationSettingsResponse>(STORAGE_KEYS.notificationSettings)
      ?? buildInitialNotificationSettings();
    return settings as unknown as T;
  }

  // ── PATCH /api/users/notification-settings ────────────────────────────────
  if (method === "PATCH" && path === "/api/users/notification-settings") {
    const current = ssGet<NotificationSettingsResponse>(STORAGE_KEYS.notificationSettings)
      ?? buildInitialNotificationSettings();
    const updated = { ...current, ...(body as Partial<NotificationSettingsResponse>) };
    ssSet(STORAGE_KEYS.notificationSettings, updated);
    return updated as unknown as T;
  }

  // ── GET /api/notifications/unread-count ──────────────────────────────────
  if (method === "GET" && path === "/api/notifications/unread-count") {
    const notifications = ssGet<NotificationResponse[]>(STORAGE_KEYS.notifications) ?? [];
    const count = notifications.filter(n => !n.isRead).length;
    return { count } as unknown as T;
  }

  // ── PATCH /api/notifications/read-all ────────────────────────────────────
  if (method === "PATCH" && path === "/api/notifications/read-all") {
    const notifications = ssGet<NotificationResponse[]>(STORAGE_KEYS.notifications) ?? [];
    ssSet(STORAGE_KEYS.notifications, notifications.map(n => ({ ...n, isRead: true })));
    return null as unknown as T;
  }

  // ── GET /api/notifications ────────────────────────────────────────────────
  if (method === "GET" && path === "/api/notifications") {
    const all = ssGet<NotificationResponse[]>(STORAGE_KEYS.notifications) ?? [];
    const cursor = query.cursor ? Number(query.cursor) : null;
    const size = query.size ? Number(query.size) : 20;
    const sorted = [...all].sort((a, b) => b.id - a.id);
    const startIdx = cursor ? sorted.findIndex(n => n.id < cursor) : 0;
    const slice = startIdx === -1 ? [] : sorted.slice(startIdx, startIdx + size + 1);
    const hasNext = slice.length > size;
    const items = slice.slice(0, size);
    const result: NotificationPageResponse = {
      items,
      nextCursor: hasNext ? items[items.length - 1]?.id ?? null : null,
      hasNext,
    };
    return result as unknown as T;
  }

  // ── PATCH /api/notifications/:id/read ────────────────────────────────────
  const notifReadMatch = path.match(/^\/api\/notifications\/(\d+)\/read$/);
  if (method === "PATCH" && notifReadMatch) {
    const nid = Number(notifReadMatch[1]);
    const notifications = ssGet<NotificationResponse[]>(STORAGE_KEYS.notifications) ?? [];
    ssSet(STORAGE_KEYS.notifications, notifications.map(n => n.id === nid ? { ...n, isRead: true } : n));
    return null as unknown as T;
  }

  // ── GET /api/diary-posts/my ───────────────────────────────────────────────
  if (method === "GET" && path === "/api/diary-posts/my") {
    const all = ssGet<DiaryPostResponse[]>(STORAGE_KEYS.posts) ?? [];
    const myPosts = all.filter((p) => p.authorId === -1);
    const cursor = query.cursor ? Number(query.cursor) : null;
    const size = query.size ? Number(query.size) : 30;
    const sorted = [...myPosts].sort((a, b) => b.id - a.id);
    const startIdx = cursor ? sorted.findIndex((p) => p.id < cursor) : 0;
    const slice = startIdx === -1 ? [] : sorted.slice(startIdx, startIdx + size + 1);
    const hasNext = slice.length > size;
    const items = slice.slice(0, size);
    const result: DiaryPostPageResponse = {
      items,
      nextCursor: hasNext ? (items[items.length - 1]?.id ?? null) : null,
      hasNext,
    };
    return result as unknown as T;
  }

  // ── GET /api/diary-posts/pages ────────────────────────────────────────────
  if (method === "GET" && path === "/api/diary-posts/pages") {
    const all = ssGet<DiaryPostResponse[]>(STORAGE_KEYS.posts) ?? [];
    const page = query.page ? Number(query.page) : 1;
    const size = query.size ? Number(query.size) : 5;
    const sorted = [...all].sort((a, b) => b.id - a.id);
    const startIdx = (page - 1) * size;
    const content = sorted.slice(startIdx, startIdx + size);
    const result: DiaryPostPaginatedResponse = {
      content,
      totalElements: sorted.length,
      totalPages: Math.max(1, Math.ceil(sorted.length / size)),
      currentPage: page,
    };
    console.log("[Demo] GET /api/diary-posts/pages → 전체:", all.length, "/ page:", page, "/ 반환:", content.length);
    return result as unknown as T;
  }

  // ── GET /api/diary-posts ──────────────────────────────────────────────────
  if (method === "GET" && path === "/api/diary-posts") {
    const all = ssGet<DiaryPostResponse[]>(STORAGE_KEYS.posts) ?? [];
    const cursor = query.cursor ? Number(query.cursor) : null;
    const size = query.size ? Number(query.size) : 10;
    const sorted = [...all].sort((a, b) => b.id - a.id);
    const startIdx = cursor ? sorted.findIndex(p => p.id < cursor) : 0;
    const slice = startIdx === -1 ? [] : sorted.slice(startIdx, startIdx + size + 1);
    const hasNext = slice.length > size;
    const items = slice.slice(0, size);
    const result: DiaryPostPageResponse = {
      items,
      nextCursor: hasNext ? items[items.length - 1]?.id ?? null : null,
      hasNext,
    };
    return result as unknown as T;
  }

  // ── POST /api/diary-posts ─────────────────────────────────────────────────
  if (method === "POST" && path === "/api/diary-posts") {
    const req = body as { content: string; milestoneTag?: string; mediaUrls?: string[]; mediaThumbnailUrls?: string[] };
    const newId = getNextId();
    const newPost: DiaryPostResponse = {
      id: newId,
      babyId: 1,
      authorId: -1,
      authorNickname: DEMO_USER.name,
      authorProfileImageUrl: DEMO_USER.profileImageUrl,
      content: req.content ?? "",
      milestoneTag: req.milestoneTag ?? null,
      media: (req.mediaUrls ?? []).map((url, i) => ({
        id: getNextId(),
        url,
        thumbnailUrl: (req.mediaThumbnailUrls ?? [])[i] ?? null,
        type: "PHOTO" as const,
        displayOrder: i,
      })),
      commentCount: 0,
      reactions: [],
      createdAt: isoNow(),
    };
    const posts = ssGet<DiaryPostResponse[]>(STORAGE_KEYS.posts) ?? [];
    const next = [newPost, ...posts];
    ssSet(STORAGE_KEYS.posts, next);
    const saved = ssGet<DiaryPostResponse[]>(STORAGE_KEYS.posts);
    console.log("[Demo] POST /api/diary-posts → 저장 후 총 게시글 수:", saved?.length, "/ 새 글 id:", newId);
    return newPost as unknown as T;
  }

  // ── GET /api/diary-posts/:id ─────────────────────────────────────────────
  const singlePostMatch = path.match(/^\/api\/diary-posts\/(\d+)$/);
  if (method === "GET" && singlePostMatch) {
    const pid = Number(singlePostMatch[1]);
    const all = ssGet<DiaryPostResponse[]>(STORAGE_KEYS.posts) ?? [];
    const post = all.find((p) => p.id === pid) ?? null;
    if (!post) throw new Error("게시글을 찾을 수 없습니다.");
    return post as unknown as T;
  }

  // ── DELETE /api/diary-posts/:id ───────────────────────────────────────────
  const postDeleteMatch = path.match(/^\/api\/diary-posts\/(\d+)$/);
  if (method === "DELETE" && postDeleteMatch) {
    const pid = Number(postDeleteMatch[1]);
    const posts = ssGet<DiaryPostResponse[]>(STORAGE_KEYS.posts) ?? [];
    ssSet(STORAGE_KEYS.posts, posts.filter(p => p.id !== pid));
    const comments = ssGet<Record<string, CommentResponse[]>>(STORAGE_KEYS.comments) ?? {};
    delete comments[String(pid)];
    ssSet(STORAGE_KEYS.comments, comments);
    return null as unknown as T;
  }

  // ── GET /api/diary-posts/:id/comments ────────────────────────────────────
  const commentsGetMatch = path.match(/^\/api\/diary-posts\/(\d+)\/comments$/);
  if (method === "GET" && commentsGetMatch) {
    const pid = commentsGetMatch[1];
    const all = ssGet<Record<string, CommentResponse[]>>(STORAGE_KEYS.comments) ?? {};
    return (all[pid] ?? []) as unknown as T;
  }

  // ── POST /api/diary-posts/:id/comments ───────────────────────────────────
  const commentsPostMatch = path.match(/^\/api\/diary-posts\/(\d+)\/comments$/);
  if (method === "POST" && commentsPostMatch) {
    const pid = commentsPostMatch[1];
    const req = body as { content: string };
    const newComment: CommentResponse = {
      id: getNextId(),
      authorId: -1,
      nickname: DEMO_USER.name,
      content: req.content ?? "",
      createdAt: isoNow(),
    };
    const all = ssGet<Record<string, CommentResponse[]>>(STORAGE_KEYS.comments) ?? {};
    all[pid] = [...(all[pid] ?? []), newComment];
    ssSet(STORAGE_KEYS.comments, all);
    // update commentCount on the post
    const posts = ssGet<DiaryPostResponse[]>(STORAGE_KEYS.posts) ?? [];
    ssSet(STORAGE_KEYS.posts, posts.map(p => p.id === Number(pid) ? { ...p, commentCount: p.commentCount + 1 } : p));
    return newComment as unknown as T;
  }

  // ── DELETE /api/diary-posts/:id/comments/:cid ────────────────────────────
  const commentDeleteMatch = path.match(/^\/api\/diary-posts\/(\d+)\/comments\/(\d+)$/);
  if (method === "DELETE" && commentDeleteMatch) {
    const pid = commentDeleteMatch[1];
    const cid = Number(commentDeleteMatch[2]);
    const all = ssGet<Record<string, CommentResponse[]>>(STORAGE_KEYS.comments) ?? {};
    const before = all[pid] ?? [];
    all[pid] = before.filter(c => c.id !== cid);
    ssSet(STORAGE_KEYS.comments, all);
    // update commentCount on the post
    const posts = ssGet<DiaryPostResponse[]>(STORAGE_KEYS.posts) ?? [];
    ssSet(STORAGE_KEYS.posts, posts.map(p => p.id === Number(pid) ? { ...p, commentCount: Math.max(0, p.commentCount - 1) } : p));
    return null as unknown as T;
  }

  // ── POST /api/diary-posts/:id/reactions ──────────────────────────────────
  const reactionMatch = path.match(/^\/api\/diary-posts\/(\d+)\/reactions$/);
  if (method === "POST" && reactionMatch) {
    const pid = Number(reactionMatch[1]);
    const req = body as { emoji: string };
    const posts = ssGet<DiaryPostResponse[]>(STORAGE_KEYS.posts) ?? [];
    let result: ReactionResponse | null = null;
    const updated = posts.map(p => {
      if (p.id !== pid) return p;
      const existing = p.reactions.find(r => r.userId === -1 && r.emoji === req.emoji);
      if (existing) {
        // toggle off
        return { ...p, reactions: p.reactions.filter(r => !(r.userId === -1 && r.emoji === req.emoji)) };
      } else {
        // toggle on
        const newReaction: ReactionResponse = {
          id: getNextId(),
          userId: -1,
          emoji: req.emoji,
          createdAt: isoNow(),
        };
        result = newReaction;
        return { ...p, reactions: [...p.reactions, newReaction] };
      }
    });
    ssSet(STORAGE_KEYS.posts, updated);
    return result as unknown as T;
  }

  // ── GET /api/schedules ────────────────────────────────────────────────────
  if (method === "GET" && path === "/api/schedules") {
    const all = ssGet<ScheduleResponse[]>(STORAGE_KEYS.schedules) ?? [];
    const year = query.year ? Number(query.year) : null;
    const month = query.month ? Number(query.month) : null;
    if (year && month) {
      const pad = (n: number) => String(n).padStart(2, "0");
      const prefix = `${year}-${pad(month)}`;
      return all.filter(s => s.eventDate.startsWith(prefix)) as unknown as T;
    }
    return all as unknown as T;
  }

  // ── POST /api/schedules ───────────────────────────────────────────────────
  if (method === "POST" && path === "/api/schedules") {
    const req = body as ScheduleRequest;
    const newSchedule: ScheduleResponse = {
      id: getNextId(),
      userId: -1,
      userNickname: DEMO_USER.name,
      title: req.title,
      memo: req.memo ?? null,
      eventDate: req.eventDate,
      isAllDay: req.isAllDay ?? true,
      startTime: req.startTime ?? null,
      endTime: req.endTime ?? null,
      placeName: req.placeName ?? null,
      placeAddress: req.placeAddress ?? null,
      createdAt: isoNow(),
    };
    const all = ssGet<ScheduleResponse[]>(STORAGE_KEYS.schedules) ?? [];
    ssSet(STORAGE_KEYS.schedules, [...all, newSchedule]);
    return newSchedule as unknown as T;
  }

  // ── PUT /api/schedules/:id ────────────────────────────────────────────────
  const schedulePutMatch = path.match(/^\/api\/schedules\/(\d+)$/);
  if (method === "PUT" && schedulePutMatch) {
    const sid = Number(schedulePutMatch[1]);
    const req = body as ScheduleRequest;
    const all = ssGet<ScheduleResponse[]>(STORAGE_KEYS.schedules) ?? [];
    let updated: ScheduleResponse | null = null;
    ssSet(STORAGE_KEYS.schedules, all.map(s => {
      if (s.id !== sid) return s;
      updated = {
        ...s,
        title: req.title ?? s.title,
        memo: req.memo ?? s.memo,
        eventDate: req.eventDate ?? s.eventDate,
        isAllDay: req.isAllDay ?? s.isAllDay,
        startTime: req.startTime ?? s.startTime,
        endTime: req.endTime ?? s.endTime,
        placeName: req.placeName ?? s.placeName,
        placeAddress: req.placeAddress ?? s.placeAddress,
      };
      return updated;
    }));
    return updated as unknown as T;
  }

  // ── DELETE /api/schedules/:id ─────────────────────────────────────────────
  const scheduleDeleteMatch = path.match(/^\/api\/schedules\/(\d+)$/);
  if (method === "DELETE" && scheduleDeleteMatch) {
    const sid = Number(scheduleDeleteMatch[1]);
    const all = ssGet<ScheduleResponse[]>(STORAGE_KEYS.schedules) ?? [];
    ssSet(STORAGE_KEYS.schedules, all.filter(s => s.id !== sid));
    return null as unknown as T;
  }

  // ── GET /api/users/me/reactions ──────────────────────────────────────────
  if (method === "GET" && path === "/api/users/me/reactions") {
    const allPosts = ssGet<DiaryPostResponse[]>(STORAGE_KEYS.posts) ?? [];
    const reactions: MyReactionResponse[] = [];
    for (const post of allPosts) {
      for (const r of post.reactions) {
        if (r.userId === -1) {
          reactions.push({
            id: r.id,
            emoji: r.emoji,
            createdAt: r.createdAt,
            postId: post.id,
            postContent: post.content || null,
            postThumbnailUrl: post.media[0]?.thumbnailUrl ?? post.media[0]?.url ?? null,
          });
        }
      }
    }
    const cursor = query.cursor ? Number(query.cursor) : null;
    const size = query.size ? Number(query.size) : 30;
    const sorted = [...reactions].sort((a, b) => b.id - a.id);
    const startIdx = cursor ? sorted.findIndex((r) => r.id < cursor) : 0;
    const slice = startIdx === -1 ? [] : sorted.slice(startIdx, startIdx + size + 1);
    const hasNext = slice.length > size;
    const items = slice.slice(0, size);
    const result: MyReactionPageResponse = {
      items,
      nextCursor: hasNext ? (items[items.length - 1]?.id ?? null) : null,
      hasNext,
    };
    return result as unknown as T;
  }

  // ── GET /api/users/me/comments ────────────────────────────────────────────
  if (method === "GET" && path === "/api/users/me/comments") {
    const allPosts = ssGet<DiaryPostResponse[]>(STORAGE_KEYS.posts) ?? [];
    const allCommentsMap = ssGet<Record<string, CommentResponse[]>>(STORAGE_KEYS.comments) ?? {};
    const postMap = new Map(allPosts.map((p) => [String(p.id), p]));
    const myComments: MyCommentResponse[] = [];
    for (const [postId, comments] of Object.entries(allCommentsMap)) {
      const post = postMap.get(postId);
      for (const c of comments) {
        if (c.authorId === -1) {
          myComments.push({
            id: c.id,
            content: c.content,
            createdAt: c.createdAt,
            postId: Number(postId),
            postContent: post?.content ?? null,
            postThumbnailUrl: post?.media[0]?.thumbnailUrl ?? post?.media[0]?.url ?? null,
          });
        }
      }
    }
    const cursor = query.cursor ? Number(query.cursor) : null;
    const size = query.size ? Number(query.size) : 20;
    const sorted = [...myComments].sort((a, b) => b.id - a.id);
    const startIdx = cursor ? sorted.findIndex((c) => c.id < cursor) : 0;
    const slice = startIdx === -1 ? [] : sorted.slice(startIdx, startIdx + size + 1);
    const hasNext = slice.length > size;
    const items = slice.slice(0, size);
    const result: MyCommentPageResponse = {
      items,
      nextCursor: hasNext ? (items[items.length - 1]?.id ?? null) : null,
      hasNext,
    };
    return result as unknown as T;
  }

  // ── GET /api/album-photos ─────────────────────────────────────────────────
  if (method === "GET" && path === "/api/album-photos") {
    const all = ssGet<AlbumPhotoResponse[]>(STORAGE_KEYS.albumPhotos) ?? [];
    const cursor = query.cursor ? Number(query.cursor) : null;
    const size = query.size ? Number(query.size) : 20;
    const growthPhaseType = query.growthPhaseType ?? null;
    const growthIndex = query.growthIndex ? Number(query.growthIndex) : null;
    const fromIndex = query.fromIndex ? Number(query.fromIndex) : null;
    const toIndex = query.toIndex ? Number(query.toIndex) : null;

    let filtered = all;
    if (growthPhaseType) {
      filtered = filtered.filter((p) => p.growthPhaseType === growthPhaseType);
      if (growthIndex !== null) {
        filtered = filtered.filter((p) => p.growthIndex === growthIndex);
      } else if (fromIndex !== null && toIndex !== null) {
        filtered = filtered.filter((p) => p.growthIndex >= fromIndex && p.growthIndex <= toIndex);
      }
    }

    const sorted = [...filtered].sort((a, b) => b.id - a.id);
    const startIdx = cursor ? sorted.findIndex((p) => p.id < cursor) : 0;
    const slice = startIdx === -1 ? [] : sorted.slice(startIdx, startIdx + size + 1);
    const hasNext = slice.length > size;
    const items = slice.slice(0, size);
    const result: AlbumPhotoPageResponse = {
      items,
      nextCursor: hasNext ? (items[items.length - 1]?.id ?? null) : null,
      hasNext,
    };
    console.log("[Demo] GET /api/album-photos → 전체:", all.length, "/ 필터 후:", filtered.length, "/ 반환:", items.length);
    return result as unknown as T;
  }

  // ── GET /api/album-photos/me/favorites ────────────────────────────────────
  if (method === "GET" && path === "/api/album-photos/me/favorites") {
    const all = ssGet<AlbumPhotoResponse[]>(STORAGE_KEYS.albumPhotos) ?? [];
    const favorites = ssGet<number[]>(STORAGE_KEYS.albumFavorites) ?? [];
    const cursor = query.cursor ? Number(query.cursor) : null;
    const size = query.size ? Number(query.size) : 30;
    const filtered = all.filter((p) => favorites.includes(p.id));
    const sorted = [...filtered].sort((a, b) => b.id - a.id);
    const startIdx = cursor ? sorted.findIndex((p) => p.id < cursor) : 0;
    const slice = startIdx === -1 ? [] : sorted.slice(startIdx, startIdx + size + 1);
    const hasNext = slice.length > size;
    const items = slice.slice(0, size);
    const result: AlbumPhotoPageResponse = {
      items,
      nextCursor: hasNext ? (items[items.length - 1]?.id ?? null) : null,
      hasNext,
    };
    return result as unknown as T;
  }

  // ── GET /api/album-photos/:id/favorite ────────────────────────────────────
  const albumFavoriteMatch = path.match(/^\/api\/album-photos\/(\d+)\/favorite$/);
  if (method === "GET" && albumFavoriteMatch) {
    const pid = Number(albumFavoriteMatch[1]);
    const favorites = ssGet<number[]>(STORAGE_KEYS.albumFavorites) ?? [];
    const result: AlbumPhotoFavoriteResponse = { favorited: favorites.includes(pid) };
    return result as unknown as T;
  }

  // ── POST /api/album-photos/:id/favorite ───────────────────────────────────
  if (method === "POST" && albumFavoriteMatch) {
    const pid = Number(albumFavoriteMatch[1]);
    const favorites = ssGet<number[]>(STORAGE_KEYS.albumFavorites) ?? [];
    let favorited: boolean;
    if (favorites.includes(pid)) {
      ssSet(STORAGE_KEYS.albumFavorites, favorites.filter((id) => id !== pid));
      favorited = false;
    } else {
      ssSet(STORAGE_KEYS.albumFavorites, [...favorites, pid]);
      favorited = true;
    }
    const result: AlbumPhotoFavoriteResponse = { favorited };
    return result as unknown as T;
  }

  // ── GET /api/album-photos/:id ─────────────────────────────────────────────
  const albumPhotoMatch = path.match(/^\/api\/album-photos\/(\d+)$/);
  if (method === "GET" && albumPhotoMatch) {
    const pid = Number(albumPhotoMatch[1]);
    const all = ssGet<AlbumPhotoResponse[]>(STORAGE_KEYS.albumPhotos) ?? [];
    const photo = all.find((p) => p.id === pid) ?? null;
    if (!photo) throw new Error("사진을 찾을 수 없습니다.");
    return photo as unknown as T;
  }

  // ── DELETE /api/album-photos/:id ──────────────────────────────────────────
  if (method === "DELETE" && albumPhotoMatch) {
    const pid = Number(albumPhotoMatch[1]);
    const all = ssGet<AlbumPhotoResponse[]>(STORAGE_KEYS.albumPhotos) ?? [];
    ssSet(STORAGE_KEYS.albumPhotos, all.filter((p) => p.id !== pid));
    const favorites = ssGet<number[]>(STORAGE_KEYS.albumFavorites) ?? [];
    ssSet(STORAGE_KEYS.albumFavorites, favorites.filter((id) => id !== pid));
    return null as unknown as T;
  }

  // ── POST /api/album-photos ────────────────────────────────────────────────
  if (method === "POST" && path === "/api/album-photos") {
    const req = body as AlbumPhotoRequest;
    const newId = getNextId();
    const today = new Date().toISOString().split("T")[0];
    const newPhoto: AlbumPhotoResponse = {
      id: newId,
      babyId: req.babyId ?? 1,
      uploaderId: -1,
      uploaderNickname: DEMO_USER.name,
      uploaderProfileImageUrl: null,
      url: req.url,
      thumbnailUrl: req.thumbnailUrl ?? req.url,
      growthPhaseType: req.growthPhaseType,
      growthIndex: req.growthIndex,
      caption: req.caption ?? null,
      takenAt: req.takenAt ?? today,
      createdAt: isoNow(),
    };
    const photos = ssGet<AlbumPhotoResponse[]>(STORAGE_KEYS.albumPhotos) ?? [];
    const next = [newPhoto, ...photos];
    ssSet(STORAGE_KEYS.albumPhotos, next);
    const saved = ssGet<AlbumPhotoResponse[]>(STORAGE_KEYS.albumPhotos);
    console.log("[Demo] POST /api/album-photos → 저장 후 총 사진 수:", saved?.length, "/ 새 사진 id:", newId);
    return newPhoto as unknown as T;
  }

  // ── GET /api/milestones ──────────────────────────────────────────────────
  if (method === "GET" && path === "/api/milestones") {
    const all = ssGet<MilestoneResponse[]>(STORAGE_KEYS.milestones) ?? buildInitialMilestones();
    return all as unknown as T;
  }

  // ── PATCH /api/milestones/:id/achieve ─────────────────────────────────────
  const milestoneAchieveMatch = path.match(/^\/api\/milestones\/(\d+)\/achieve$/);
  if (method === "PATCH" && milestoneAchieveMatch) {
    const mid = Number(milestoneAchieveMatch[1]);
    const req = body as { achievedDate?: string; memo?: string; keepImageUrls?: string | string[]; photos?: File | File[] } | undefined;
    const all = ssGet<MilestoneResponse[]>(STORAGE_KEYS.milestones) ?? buildInitialMilestones();
    let result: MilestoneResponse | null = null;

    // keepImageUrls: string 또는 string[] 모두 처리
    const keepRaw = req?.keepImageUrls;
    const keepUrls: string[] = !keepRaw ? [] : Array.isArray(keepRaw) ? keepRaw : [keepRaw];

    // photos: File 또는 File[] 모두 처리
    const photosRaw = req?.photos;
    const photoFiles: File[] = !photosRaw ? [] : Array.isArray(photosRaw) ? photosRaw : [photosRaw];
    const newPhotoUrls = photoFiles
      .filter(f => f instanceof File)
      .map(f => URL.createObjectURL(f));

    ssSet(STORAGE_KEYS.milestones, all.map(m => {
      if (m.id !== mid) return m;
      result = {
        ...m,
        achieved: true,
        achievedDate: req?.achievedDate ?? new Date().toISOString().slice(0, 10),
        memo: req?.memo ?? null,
        photoUrls: [...keepUrls, ...newPhotoUrls],
      };
      return result;
    }));
    return result as unknown as T;
  }

  // ── DELETE /api/milestones/:id/achieve ────────────────────────────────────
  const milestoneAchieveDeleteMatch = path.match(/^\/api\/milestones\/(\d+)\/achieve$/);
  if (method === "DELETE" && milestoneAchieveDeleteMatch) {
    const mid = Number(milestoneAchieveDeleteMatch[1]);
    const all = ssGet<MilestoneResponse[]>(STORAGE_KEYS.milestones) ?? buildInitialMilestones();
    ssSet(STORAGE_KEYS.milestones, all.map(m =>
      m.id !== mid ? m : { ...m, achieved: false, achievedDate: null, memo: null, photoUrls: [] }
    ));
    return null as unknown as T;
  }

  // ── POST /api/media/upload ────────────────────────────────────────────────
  if (method === "POST" && path === "/api/media/upload") {
    // new/page.tsx 체험판 분기에서 data URL로 처리되므로 여기까지 오지 않음.
    // 혹시 직접 호출된 경우 빈 응답 반환 (에러 방지)
    const result: MediaUploadResponse = { images: [] };
    return result as unknown as T;
  }

  // ── fallback ──────────────────────────────────────────────────────────────
  console.warn(`[Demo] ⚠️ 매칭되는 핸들러 없음: ${method} ${endpoint}`);
  return null as unknown as T;
}
