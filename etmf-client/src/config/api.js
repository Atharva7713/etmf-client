const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

export default {
  documents: {
    upload: `${API_BASE_URL}/documents/upload`,
    download: (filename) => `${API_BASE_URL}/documents/download/${filename}`,
    files: `${API_BASE_URL}/api/documents/files`
  },
  ai: {
    parseDocuments: `${API_BASE_URL}/ai/parse-documents`,
  },
  // ... other endpoints ...
}; 