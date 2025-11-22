import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://techquery-backend.onrender.com/api',
  headers: { 'Content-Type': 'application/json' }
});

// attach token automatically
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, err => Promise.reject(err));

export default api;


// Save questions set
export const saveQuestions = (title, questions) => {
  return api.post('/ai/save-questions', {
    title,
    questions
  });
};

// Fetch user's saved question sets
export const getMyQuestions = () => {
  return api.get('/ai/my-questions');
};

// Delete question set
export const deleteQuestions = (id) => {
  return api.delete(`/ai/questions/${id}`);
};

// Update title
export const updateTitle = (id, title) => {
  return api.patch(`/ai/questions/${id}`, { title });
};

// Generate answers
export const generateAnswers = (questions) => {
  return api.post('/ai/answer-questions', { questions });
};
