// mobile/src/services/api.ts
// Single axios instance — same Django backend endpoints as frontend
// Replaces: whatever fetch/axios setup you had in frontend

import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { TOKEN_KEY } from "../store/authStore";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://api.seekhowithrua.com";

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request Interceptor ───────────────────────────────────────────────────
// Automatically attaches token to every request (replaces manual token headers)
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Token ${token}`;
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
    }
    return Promise.reject(error);
  }
);

// ─── Auth Endpoints ────────────────────────────────────────────────────────
export const authAPI = {
  login: (username: string, password: string) =>
    api.post("/api/auth/login/", { username, password }),

  signup: (data: {
    username: string;
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }) => api.post("/api/auth/register/", data),

  logout: () => api.post("/api/auth/logout/"),

  getProfile: () => api.get("/api/auth/user/"),
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

// ─── VCR Endpoints ─────────────────────────────────────────────────────────
export const vcrAPI = {
  getRooms: () => api.get("/api/vcr/rooms/"),
  createRoom: (data: object) => api.post("/api/vcr/rooms/", data),
  joinRoom: (roomId: string) => api.post(`/api/vcr/rooms/${roomId}/join/`),
  leaveRoom: (roomId: string) => api.post(`/api/vcr/rooms/${roomId}/leave/`),
  raiseHand: (roomId: string) => api.post(`/api/vcr/rooms/${roomId}/raise_hand/`),
  lowerHand: (roomId: string) => api.post(`/api/vcr/rooms/${roomId}/lower_hand/`),
  promotePeer: (roomId: string, peerId: string) => api.post(`/api/vcr/rooms/${roomId}/promote/${peerId}/`),
  kickPeer: (roomId: string, peerId: string) => api.post(`/api/vcr/rooms/${roomId}/kick/${peerId}/`),
  // Boost rank feature
  boostRank: (roomId: string) => api.post(`/api/vcr/rooms/${roomId}/boost_rank/`),
  getRankStatus: (roomId: string) => api.get(`/api/vcr/rooms/${roomId}/rank_status/`),
};

export default api;