import axios from 'axios';

const API_BASE_URL = 'https://localhost:7259';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json'
    // Do NOT set 'Content-Type' here; let Axios set it automatically for FormData
  }
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      console.error('Network Error:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

const api = {
  // Auth endpoints
  auth: {
    login: (credentials) => axiosInstance.post('/api/Auth/login', credentials),
    register: (userData) => axiosInstance.post('/api/Auth/register', userData)
  },

  // Course endpoints
  courses: {
    getAll: () => axiosInstance.get('/api/Courses'),
    getById: (id) => axiosInstance.get(`/api/Courses/${id}`),
    // For file upload, use multipart/form-data
    create: (data) => axiosInstance.post('/api/Courses', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    update: (id, data) => axiosInstance.put(`/api/Courses/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    delete: (id) => axiosInstance.delete(`/api/Courses/${id}`)
  },

  // Assessment endpoints
  assessments: {
    getAll: () => axiosInstance.get('/api/Assessments'),
    getById: (id) => axiosInstance.get(`/api/Assessments/${id}`),
    create: (data) => axiosInstance.post('/api/Assessments', data),
    update: (id, data) => axiosInstance.put(`/api/Assessments/${id}`, data),
    delete: (id) => axiosInstance.delete(`/api/Assessments/${id}`),
    getByCourse: (courseId) => axiosInstance.get(`/api/Courses/${courseId}/assessments`),
    getAllByInstructor: (instructorId) => axiosInstance.get(`/api/Assessments/instructor/${instructorId}`)
  },

  // Student endpoints
  students: {
    getCourses: (studentId) => axiosInstance.get(`/api/Enrollments/student/${studentId}/courses`)
  },

  // Enrollment endpoints
  enrollments: {
    enroll: (courseId, studentId) =>
      axiosInstance.post(`/api/Enrollments/${courseId}/enroll`, { studentId }),
    getStudentCourses: (studentId) =>
      axiosInstance.get(`/api/Enrollments/student/${studentId}/courses`),
    getCourseStudents: (courseId) =>
      axiosInstance.get(`/api/Enrollments/course/${courseId}/students`)
  },

  // Results endpoints
  results: {
    getResultsForAssessment: (assessmentId) =>
      axiosInstance.get(`/api/Results/assessment/${assessmentId}`),
    getResultsForUser: (userId) =>
      axiosInstance.get(`/api/Results/user/${userId}`),
    getResultById: (resultId) =>
      axiosInstance.get(`/api/Results/${resultId}`),
    createResult: (data) =>
      axiosInstance.post(`/api/Results`, data),
    publishResults: (assessmentId) =>
      axiosInstance.post(`/api/Results/publish/${assessmentId}`),
    unpublishResults: (assessmentId) =>
      axiosInstance.post(`/api/Results/unpublish/${assessmentId}`)
  },

  // Progress endpoints (for instructor dashboard)
  progress: {
    getCourseProgress: (courseId) =>
      axiosInstance.get(`/api/Courses/${courseId}/progress`)
  }
};

export default api;
