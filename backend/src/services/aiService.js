const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const AI_SERVICE_SECRET = process.env.AI_SERVICE_SECRET || 'smartattend_ai_secret_key_2026';

const aiClient = axios.create({
  baseURL: AI_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-AI-Secret': AI_SERVICE_SECRET
  },
  timeout: 15000
});

/**
 * Enrolls student face image by sending image to FastAPI service.
 * Returns { success, embedding, modelName, modelVersion, message }
 */
const enrollFace = async (imageBase64) => {
  try {
    const formData = new URLSearchParams();
    formData.append('image', imageBase64);

    const response = await aiClient.post('/v1/enroll', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-AI-Secret': AI_SERVICE_SECRET
      }
    });
    return response.data;
  } catch (error) {
    console.error('[AI Service Enroll Error]:', error.response?.data || error.message);
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Python AI Service is offline. Please start FastAPI on port 8000.');
    }
    throw new Error(error.response?.data?.detail || error.message || 'AI service error during enrollment');
  }
};

/**
 * Recognizes a face frame against candidate student embeddings.
 * candidates: array of { studentId, embedding }
 * Returns { success, matchedStudentId, confidence, status, message }
 */
const recognizeFace = async (imageBase64, candidates) => {
  try {
    const payload = {
      image: imageBase64,
      candidates: candidates.map(c => ({
        studentId: c.studentId.toString(),
        embedding: c.embedding
      }))
    };

    const response = await aiClient.post('/v1/recognize', payload);
    return response.data;
  } catch (error) {
    console.error('[AI Service Recognize Error]:', error.response?.data || error.message);
    if (error.code === 'ECONNREFUSED') {
      return {
        success: false,
        status: 'error',
        message: 'AI Service offline (port 8000)'
      };
    }
    return {
      success: false,
      status: 'error',
      message: error.response?.data?.message || 'AI service recognition failure'
    };
  }
};

module.exports = {
  enrollFace,
  recognizeFace
};
