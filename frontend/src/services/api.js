/**
 * Central API Client for AI-Assisted RPL Platform
 */

const BASE_URL = '';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('rpl_token');
  const headers = {
    ...options.headers,
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If not FormData, default to application/json
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Clear token if expired or invalid
      // localStorage.removeItem('rpl_token');
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.detail || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  // Auth
  login: (email, password) =>
    apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  demoLogin: (role) =>
    apiRequest('/api/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role }),
    }),
  register: (payload) =>
    apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getMe: () => apiRequest('/api/auth/me'),

  // Qualifications
  getQualifications: (query, nsqf_level) => {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (nsqf_level) params.append('nsqf_level', nsqf_level);
    return apiRequest(`/api/qualifications?${params.toString()}`);
  },
  getQualificationById: (id) => apiRequest(`/api/qualifications/${id}`),

  // Declarations
  getMyDeclaration: () => apiRequest('/api/declarations/me'),
  saveDeclaration: (payload) =>
    apiRequest('/api/declarations', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  confirmQualification: (qp_code) =>
    apiRequest('/api/declarations/confirm-qualification', {
      method: 'POST',
      body: JSON.stringify({ qp_code }),
    }),

  // Matching
  evaluateMatching: (payload) =>
    apiRequest('/api/matching/evaluate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Assignments
  getAssignments: (status) => {
    const params = status ? `?status_filter=${status}` : '';
    return apiRequest(`/api/assignments${params}`);
  },
  getAssignmentById: (id) => apiRequest(`/api/assignments/${id}`),
  createAssignment: (payload) =>
    apiRequest('/api/assignments', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateAssignmentStatus: (id, status, reason) =>
    apiRequest(`/api/assignments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    }),

  // Assessments & Scoring
  getAssessment: (id) => apiRequest(`/api/assessments/${id}`),
  recordScore: (assessmentId, payload) =>
    apiRequest(`/api/assessments/${assessmentId}/score`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  submitAssessmentSummary: (assessmentId, payload) =>
    apiRequest(`/api/assessments/${assessmentId}/summary`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Evidence
  uploadEvidence: (formData) =>
    apiRequest('/api/evidence/upload', {
      method: 'POST',
      body: formData,
    }),
  reviewEvidence: (id, review_status, notes) =>
    apiRequest(`/api/evidence/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ review_status, notes }),
    }),

  // Reviews & Sign-Off
  submitSignOff: (payload) =>
    apiRequest('/api/reviews/sign-off', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Analytics & Audit
  getOverviewMetrics: () => apiRequest('/api/analytics/overview'),
  getConsistencyAnalytics: () => apiRequest('/api/analytics/consistency'),
  getAuditTrail: (limit = 50) => apiRequest(`/api/audit?limit=${limit}`),
};
