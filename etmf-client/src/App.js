import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import theme from './utils/theme';
import MainLayout from './components/layout/MainLayout';
import Login from './components/auth/Login';
import DocumentList from './components/documents/DocumentList';
import StudyFormStepper from './components/forms/StudyFormStepper';
import VersionHistory from './components/versions/VersionHistory';
import ClinicalIntakeForm from './components/forms/ClinicalIntakeForm';
import ClinicalIntakeHistory from './components/ClinicalIntakeHistory';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {
  const isAuthenticated = true; // Replace with actual auth logic

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastContainer />
      <MainLayout>
        <Routes>
          <Route path="/" element={<DocumentList />} />
          <Route path="/documents" element={<DocumentList />} />
          <Route path="/clinical-intake" element={<StudyFormStepper />} />
          <Route path="/section-history/:sectionId" element={<VersionHistory />} />
          <Route path="/new-form" element={<ClinicalIntakeForm />} />
          <Route path="/history" element={<ClinicalIntakeHistory />} />

          {/* Add more routes here */}
        </Routes>
      </MainLayout>
    </ThemeProvider>
  );
};

export default App; 