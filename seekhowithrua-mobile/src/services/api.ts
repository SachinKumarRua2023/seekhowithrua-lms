// mobile/src/services/api.ts
// JWT Auth from app.seekhowithrua.com
// Replaces: Django token auth with JWT

import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { TOKEN_KEY } from "../store/authStore";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://app.seekhowithrua.com/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request Interceptor ───────────────────────────────────────────────────
// Automatically attaches JWT to every request
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────
// Handles 401 globally — token expired or invalid
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear stored auth — user will be redirected by navigation guard
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync("seekho_user");
    }
    return Promise.reject(error);
  }
);

// ─── Auth Endpoints ────────────────────────────────────────────────────────
export const authAPI = {
  // Login via deep link callback - token received from web
  verifyToken: (token: string) =>
    api.get("/auth/verify/", { headers: { Authorization: `Bearer ${token}` } }),

  refreshToken: (refreshToken: string) =>
    api.post("/auth/refresh/", { refresh: refreshToken }),

  logout: () =>
    api.post("/auth/logout/"),
};

// ─── Blockchain / SEEKHO Token Endpoints ────────────────────────────────────
export const blockchainAPI = {
  // Get user's SEEKHO token balance
  getTokenBalance: () =>
    api.get("/blockchain/balance/"),

  // Get wallet connection status
  getWalletStatus: () =>
    api.get("/blockchain/wallet/"),

  // Connect Solana wallet
  connectWallet: (walletAddress: string, signature: string) =>
    api.post("/blockchain/wallet/connect/", { wallet_address: walletAddress, signature }),

  // Withdraw tokens to wallet
  withdrawTokens: (amount: number, walletAddress: string) =>
    api.post("/blockchain/withdraw/", { amount, wallet_address: walletAddress }),

  // Get earning history
  getEarningHistory: () =>
    api.get("/blockchain/earnings/"),
};

// ─── Voice Room / VCR Endpoints ───────────────────────────────────────────
export const vcrAPI = {
  // Get all active panels
  getPanels: () =>
    api.get("/vcr/panels/"),

  // Create new panel
  createPanel: (title: string, description: string) =>
    api.post("/vcr/panels/", { title, description }),

  // Join panel
  joinPanel: (panelId: number) =>
    api.post(`/vcr/panels/${panelId}/join/`),

  // Leave panel
  leavePanel: (panelId: number) =>
    api.post(`/vcr/panels/${panelId}/leave/`),

  // Raise hand to speak
  raiseHand: (panelId: number) =>
    api.post(`/vcr/panels/${panelId}/raise-hand/`),

  // Lower hand
  lowerHand: (panelId: number) =>
    api.post(`/vcr/panels/${panelId}/lower-hand/`),

  // Invite AI co-host
  inviteAI: (panelId: number) =>
    api.post(`/vcr/panels/${panelId}/ai-join/`),

  // Mute/unmute self
  toggleMute: (panelId: number, muted: boolean) =>
    api.post(`/vcr/panels/${panelId}/mute/`, { muted }),

  // Send message
  sendMessage: (panelId: number, text: string) =>
    api.post(`/vcr/panels/${panelId}/messages/`, { text }),

  // End panel (host only)
  endPanel: (panelId: number) =>
    api.post(`/vcr/panels/${panelId}/end/`),
};

// ─── Legacy Auth Endpoints (for compatibility) ─────────────────────────────
export const legacyAuthAPI = {
  login: (username: string, password: string) =>
    api.post("/auth/login/", { username, password }),

  signup: (data: {
    username: string;
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }) => api.post("/auth/register/", data),

  logout: () => api.post("/auth/logout/"),

  getProfile: () => api.get("/auth/user/"),
};

// ─── ML / CV Endpoints ─────────────────────────────────────────────────────
export const mlAPI = {
  predict: (formData: FormData) =>
    api.post("/api/ml/predict/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

// ─── Employees Endpoints ───────────────────────────────────────────────────
export const employeesAPI = {
  getAll: () => api.get("/api/employees/"),
  getOne: (id: number) => api.get(`/api/employees/${id}/`),
  create: (data: object) => api.post("/api/employees/", data),
  update: (id: number, data: object) => api.put(`/api/employees/${id}/`, data),
  delete: (id: number) => api.delete(`/api/employees/${id}/`),
};

// ─── Syllabus Endpoints ────────────────────────────────────────────────────
export const syllabusAPI = {
  getAll: () => api.get("/api/syllabus/"),
};

// ─── Trainer KPI Endpoints ─────────────────────────────────────────────────
export const trainerAPI = {
  getKPIs: () => api.get("/api/trainer/kpi/"),
};

// ─── Mnemonic Endpoints ────────────────────────────────────────────────────
export const mnemonicAPI = {
  generate: (topic: string) => api.post("/api/mnemonic/generate/", { topic }),
};

// ─── LMS Endpoints ─────────────────────────────────────────────────────────
export const lmsAPI = {
  // Courses
  getCourses: () => api.get("/api/lms/courses/"),
  getCourse: (id: number) => api.get(`/api/lms/courses/${id}/`),
  enrollCourse: (courseId: number) => api.post(`/api/lms/courses/${courseId}/enroll/`),
  getCourseSessions: (courseId: number) => api.get(`/api/lms/courses/${courseId}/sessions/`),
  
  // Student Dashboard
  getStudentDashboard: () => api.get("/api/lms/dashboard/student/"),
  getStudentProfile: () => api.get("/api/lms/students/me/"),
  
  // Attendance
  getAttendance: () => api.get("/api/lms/attendance/"),
  markAttendance: (sessionId: number, status: string) => 
    api.post(`/api/lms/sessions/${sessionId}/mark_attendance/`, { status }),
  
  // Payments
  getPayments: () => api.get("/api/lms/payments/my_payments/"),
  createPayment: (data: object) => api.post("/api/lms/payments/", data),
  
  // Referrals
  getReferrals: () => api.get("/api/lms/referrals/"),
  getReferralStats: () => api.get("/api/lms/referrals/stats/"),
  applyReferralCode: (code: string) => api.post("/api/lms/referrals/apply_code/", { referral_code: code }),
  
  // Quizzes
  getQuizzes: () => api.get("/api/lms/quizzes/"),
  startQuiz: (quizId: number) => api.post(`/api/lms/quizzes/${quizId}/start_attempt/`),
  submitQuiz: (quizId: number, answers: object, timeTaken: number) => 
    api.post(`/api/lms/quizzes/${quizId}/submit_attempt/`, { answers, time_taken_seconds: timeTaken }),
};

export default api;