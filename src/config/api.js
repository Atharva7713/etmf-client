const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

const apiconfig = {
  documents: {
    upload: `${API_BASE_URL}/documents/upload`,
    download: (filename) => `${API_BASE_URL}/documents/download/${filename}`,
    files: `${API_BASE_URL}/documents`
  },
  ai: {
    parseDocuments: `${API_BASE_URL}/ai/parse-documents`,
  },
  clinicalIntake: {
    submit: `${API_BASE_URL}/clinical-intake/submit`,
    get: (id) => `${API_BASE_URL}/clinical-intake/${id}`,
    list: `${API_BASE_URL}/clinical-intake`
  },
  // ... other endpoints ...
}; 

export default apiconfig;