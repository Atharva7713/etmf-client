import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Divider
} from '@mui/material';
import { Visibility, Download } from '@mui/icons-material';
import axios from 'axios';
//import API_ENDPOINTS from '../config/api';
import { jsPDF } from 'jspdf';

const ClinicalIntakeHistory = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  
  // eslint-disable-next-line
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5000/api/clinical-intake?page=${page + 1}&limit=${rowsPerPage}`);
        setSubmissions(response.data.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch submissions');
        console.error('Error fetching submissions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, [page, rowsPerPage]);

  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewSubmission = (submission) => {
    setSelectedSubmission(submission);
    setViewDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setViewDialogOpen(false);
    setSelectedSubmission(null);
  };

  const generatePDF = (submission) => {
    const doc = new jsPDF();
    
    // Set up text styling
    const fontSize = 12;
    const lineHeight = 7;
    const PAGE_HEIGHT = 297; // A4 page height in mm
    const TOP_MARGIN = 20;
    const BOTTOM_MARGIN = 20;
    let y = TOP_MARGIN; // Start from top of page

    // Helper to clean markdown
    const cleanText = (text) =>
      typeof text === 'string' ? text.replace(/[*_#`]/g, '') : text;

    // Helper function to add text with wrapping and page break
    const addText = (text, x, isBold = false) => {
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(cleanText(text), 170);
      lines.forEach(line => {
        if (y > PAGE_HEIGHT - BOTTOM_MARGIN) {
          doc.addPage();
          y = TOP_MARGIN;
        }
        doc.text(line, x, y);
        y += lineHeight;
      });
    };

    // Helper function to add section
    const addSection = (title, data, indent = 30) => {
      addText(title, 20, true);
      Object.entries(data || {}).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          const formattedKey = key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
          if (Array.isArray(value)) {
            addText(`${formattedKey}: ${value.map(cleanText).join(', ')}`, indent);
          } else if (typeof value === 'object') {
            addText(formattedKey + ':', indent);
            Object.entries(value).forEach(([subKey, subValue]) => {
              const formattedSubKey = subKey.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
              addText(`${formattedSubKey}: ${cleanText(subValue) || 'N/A'}`, indent + 10);
            });
          } else {
            addText(`${formattedKey}: ${cleanText(value) || 'N/A'}`, indent);
          }
        }
      });
      y += lineHeight;
    };

    // Add content
    addText('Clinical Intake Form', 20, true);
    y += lineHeight;

    // Study Identification
    addSection('Study Identification', submission.study_identification);

    // Study Overview
    addSection('Study Overview', submission.study_overview);

    // Endpoints and Objectives
    addSection('Endpoints and Objectives', submission.endpoints_objectives);

    // Background Information
    addSection('Background Information', submission.background_information);

    // Target Population
    addSection('Target Population', submission.target_population);

    // Study Treatments
    addSection('Study Treatments', submission.study_treatments);

    // Discontinuation Rules
    addSection('Discontinuation Rules', submission.discontinuation_rules);

    // Study Assessments
    addSection('Study Assessments', submission.study_assessments);

    // Statistical Considerations
    addSection('Statistical Considerations', submission.statistical_considerations);

    // Regulatory Requirements
    addSection('Regulatory Requirements', submission.regulatory_requirements);

    // Appendices
    if (submission.appendices && submission.appendices.length > 0) {
      addText('Appendices', 20, true);
      submission.appendices.forEach(appendix => {
        addText(cleanText(appendix), 30);
      });
      y += lineHeight;
    }

    // Additional Comments
    if (submission.additional_comments) {
      addText('Additional Comments', 20, true);
      addText(cleanText(submission.additional_comments), 30);
      y += lineHeight;
    }

    // Study Monitoring and Logistics
    addSection('Study Monitoring and Logistics', submission.study_monitoring_logistics);

    // Metadata
    addText('Metadata', 20, true);
    addText(`Submitted At: ${new Date(submission.submittedAt).toLocaleString()}`, 30);
    addText(`Status: ${submission.status}`, 30);
    addText(`Version: ${submission.version}`, 30);

    // Save the PDF
    return doc.output('arraybuffer');
  };

  const handleDownload = async (submission) => {
    try {
      // Download JSON
      const submissionData = {
        study_identification: submission.study_identification,
        study_overview: submission.study_overview,
        endpoints_objectives: submission.endpoints_objectives,
        background_information: submission.background_information,
        target_population: submission.target_population,
        study_treatments: submission.study_treatments,
        discontinuation_rules: submission.discontinuation_rules,
        study_assessments: submission.study_assessments,
        statistical_considerations: submission.statistical_considerations,
        regulatory_requirements: submission.regulatory_requirements,
        appendices: submission.appendices,
        additional_comments: submission.additional_comments,
        study_monitoring_logistics: submission.study_monitoring_logistics,
        metadata: {
          submittedAt: submission.submittedAt,
          status: submission.status,
          version: submission.version
        }
      };

      // Download JSON
      const jsonString = JSON.stringify(submissionData, null, 2);
      const jsonBlob = new Blob([jsonString], { type: 'application/json' });
      const jsonUrl = window.URL.createObjectURL(jsonBlob);
      const jsonLink = document.createElement('a');
      jsonLink.href = jsonUrl;
      jsonLink.setAttribute('download', `clinical_intake_${submission.study_identification?.protocol_number || 'form'}_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(jsonLink);
      jsonLink.click();
      document.body.removeChild(jsonLink);
      window.URL.revokeObjectURL(jsonUrl);

      // Download PDF
      const pdfBytes = generatePDF(submission);
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      const pdfUrl = window.URL.createObjectURL(pdfBlob);
      const pdfLink = document.createElement('a');
      pdfLink.href = pdfUrl;
      pdfLink.setAttribute('download', `clinical_intake_${submission.study_identification?.protocol_number || 'form'}_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(pdfLink);
      pdfLink.click();
      document.body.removeChild(pdfLink);
      window.URL.revokeObjectURL(pdfUrl);

    } catch (error) {
      console.error('Error downloading form data:', error);
      alert('Error downloading form data. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted':
        return 'primary';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Clinical Intake Form History
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Protocol Number</TableCell>
              <TableCell>Sponsor Name</TableCell>
              <TableCell>Submitted At</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {submissions.map((submission) => (
              <TableRow key={submission._id}>
                <TableCell>{submission.study_identification?.protocol_number || 'N/A'}</TableCell>
                <TableCell>{submission.study_identification?.sponsor_name || 'N/A'}</TableCell>
                <TableCell>{formatDate(submission.submittedAt)}</TableCell>
                <TableCell>
                  <Chip
                    label={submission.status}
                    color={getStatusColor(submission.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleViewSubmission(submission)}
                    size="small"
                  >
                    <Visibility />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDownload(submission)}
                    size="small"
                  >
                    <Download />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={submissions.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* View Submission Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>View Submission</DialogTitle>
        <DialogContent>
          {selectedSubmission && (
            <Box p={2}>
              {/* Study Identification */}
              <Typography variant="h6" gutterBottom>Study Identification</Typography>
              <Typography>Protocol Number: {selectedSubmission.study_identification?.protocol_number || 'N/A'}</Typography>
              <Typography>Sponsor Name: {selectedSubmission.study_identification?.sponsor_name || 'N/A'}</Typography>
              <Typography>Version: {selectedSubmission.study_identification?.version_number_date || 'N/A'}</Typography>
              <Typography>IND Number: {selectedSubmission.study_identification?.ind_number || 'N/A'}</Typography>
              <Typography>EudraCT Number: {selectedSubmission.study_identification?.eudract_number || 'N/A'}</Typography>
              <Typography>Alternate Study Identifiers: {selectedSubmission.study_identification?.alternate_study_identifiers || 'N/A'}</Typography>
              <Divider sx={{ my: 2 }} />

              {/* Study Overview */}
              <Typography variant="h6" gutterBottom>Study Overview</Typography>
              <Typography>Therapeutic Area: {selectedSubmission.study_overview?.therapeutic_area || 'N/A'}</Typography>
              <Typography>Disease Indication: {selectedSubmission.study_overview?.disease_indication || 'N/A'}</Typography>
              <Typography>Study Phase: {selectedSubmission.study_overview?.study_phase || 'N/A'}</Typography>
              <Typography>Study Type: {selectedSubmission.study_overview?.study_type || 'N/A'}</Typography>
              <Typography>Trial Intervention Model: {selectedSubmission.study_overview?.trial_intervention_model || 'N/A'}</Typography>
              <Typography>Control Method: {selectedSubmission.study_overview?.control_method || 'N/A'}</Typography>
              <Typography>Trial Type: {selectedSubmission.study_overview?.trial_type || 'N/A'}</Typography>
              <Typography>Randomization: {selectedSubmission.study_overview?.randomization || 'N/A'}</Typography>
              <Typography>Blinding: {selectedSubmission.study_overview?.blinding || 'N/A'}</Typography>
              <Typography>Number of Study Parts: {selectedSubmission.study_overview?.number_of_study_parts || 'N/A'}</Typography>
              <Typography>Stratification Factors: {selectedSubmission.study_overview?.stratification_factors || 'N/A'}</Typography>
              <Typography>Study Periods: {(selectedSubmission.study_overview?.study_periods || []).join(', ') || 'N/A'}</Typography>
              <Typography>Participant Input Into Design: {selectedSubmission.study_overview?.participant_input_into_design || 'N/A'}</Typography>
              <Divider sx={{ my: 2 }} />

              {/* Endpoints and Objectives */}
              <Typography variant="h6" gutterBottom>Endpoints and Objectives</Typography>
              <Typography>Primary Objective & Endpoints: {selectedSubmission.endpoints_objectives?.primary_objective_endpoints || 'N/A'}</Typography>
              <Typography>Key Secondary Objectives & Endpoints: {selectedSubmission.endpoints_objectives?.key_secondary_objectives_endpoints || 'N/A'}</Typography>
              <Typography>Secondary Objectives & Endpoints: {selectedSubmission.endpoints_objectives?.secondary_objectives_endpoints || 'N/A'}</Typography>
              <Typography>Exploratory Objectives & Endpoints: {selectedSubmission.endpoints_objectives?.exploratory_objectives_endpoints || 'N/A'}</Typography>
              <Divider sx={{ my: 2 }} />

              {/* Background Information */}
              <Typography variant="h6" gutterBottom>Background Information</Typography>
              <Typography>Disease Epidemiology: {selectedSubmission.background_information?.disease_epidemiology || 'N/A'}</Typography>
              <Typography>Current Standard of Care: {selectedSubmission.background_information?.current_standard_of_care || 'N/A'}</Typography>
              <Typography>Outcomes with Current SOC: {selectedSubmission.background_information?.outcomes_current_soc || 'N/A'}</Typography>
              <Typography>Benefits with Investigational: {selectedSubmission.background_information?.benefits_investigational || 'N/A'}</Typography>
              <Typography>Risks with Investigational: {selectedSubmission.background_information?.risks_investigational || 'N/A'}</Typography>
              <Divider sx={{ my: 2 }} />

              {/* Target Population */}
              <Typography variant="h6" gutterBottom>Target Population</Typography>
              <Typography>Conditions Related to Primary Disease: {selectedSubmission.target_population?.conditions_related_to_primary_disease || 'N/A'}</Typography>
              <Typography>Tissue Sample Procedure Compliance: {selectedSubmission.target_population?.tissue_sample_procedure_compliance || 'N/A'}</Typography>
              <Typography>Patient Performance Status: {selectedSubmission.target_population?.patient_performance_status || 'N/A'}</Typography>
              <Typography>Life Expectancy: {selectedSubmission.target_population?.life_expectancy || 'N/A'}</Typography>
              <Typography>Organ Function Lab Parameters: {selectedSubmission.target_population?.organ_function_lab_parameters || 'N/A'}</Typography>
              <Typography>Concomitant Meds Washout: {selectedSubmission.target_population?.concomitant_meds_washout || 'N/A'}</Typography>
              <Typography>Comorbidities/Infections: {selectedSubmission.target_population?.comorbidities_infections || 'N/A'}</Typography>
              <Typography>Reproductive Status/Contraception: {selectedSubmission.target_population?.reproductive_status_contraception || 'N/A'}</Typography>
              <Typography>Eligibility Criteria: {selectedSubmission.target_population?.eligibility_criteria || 'N/A'}</Typography>
              <Divider sx={{ my: 2 }} />

              {/* Study Treatments */}
              <Typography variant="h6" gutterBottom>Study Treatments</Typography>
              <Typography>Regimen Arm 1: {selectedSubmission.study_treatments?.regimen_arm_1 || 'N/A'}</Typography>
              <Typography>Regimen Arm 2: {selectedSubmission.study_treatments?.regimen_arm_2 || 'N/A'}</Typography>
              <Typography>Regimen Arm 3: {selectedSubmission.study_treatments?.regimen_arm_3 || 'N/A'}</Typography>
              <Typography>Control Regimen: {selectedSubmission.study_treatments?.control_regimen || 'N/A'}</Typography>
              <Typography>Concomitant Medications Allowed: {selectedSubmission.study_treatments?.concomitant_medications_allowed || 'N/A'}</Typography>
              <Typography>Concomitant Medications Prohibited: {selectedSubmission.study_treatments?.concomitant_medications_prohibited || 'N/A'}</Typography>
              <Typography>FDA Pregnancy Risk Categories: {selectedSubmission.study_treatments?.fda_pregnancy_risk_categories || 'N/A'}</Typography>
              <Divider sx={{ my: 2 }} />

              {/* Discontinuation Rules */}
              <Typography variant="h6" gutterBottom>Discontinuation Rules</Typography>
              <Typography>Trial Intervention Discontinuation: {selectedSubmission.discontinuation_rules?.trial_intervention_discontinuation || 'N/A'}</Typography>
              <Typography>Participant Withdrawal: {selectedSubmission.discontinuation_rules?.participant_withdrawal || 'N/A'}</Typography>
              <Typography>Lost to Follow Up: {selectedSubmission.discontinuation_rules?.lost_to_follow_up || 'N/A'}</Typography>
              <Typography>Trial Stopping Rules: {selectedSubmission.discontinuation_rules?.trial_stopping_rules || 'N/A'}</Typography>
              <Divider sx={{ my: 2 }} />

              {/* Study Assessments */}
              <Typography variant="h6" gutterBottom>Study Assessments</Typography>
              <Typography>Screening Baseline: {selectedSubmission.study_assessments?.screening_baseline || 'N/A'}</Typography>
              <Typography>Efficacy Assessments: {(selectedSubmission.study_assessments?.efficacy_assessments || []).join(', ') || 'N/A'}</Typography>
              <Typography>Safety Assessments: {selectedSubmission.study_assessments?.safety_assessments?.standard_procedures || 'N/A'}</Typography>
              <Typography>Adverse Events Special Interest: {selectedSubmission.study_assessments?.safety_assessments?.adverse_events_special_interest || 'N/A'}</Typography>
              <Typography>AE/SAE Collection Period: {selectedSubmission.study_assessments?.safety_assessments?.ae_sae_collection_period || 'N/A'}</Typography>
              <Typography>Disease Related Events: {selectedSubmission.study_assessments?.safety_assessments?.disease_related_events || 'N/A'}</Typography>
              <Typography>Pharmacokinetics: {selectedSubmission.study_assessments?.pharmacokinetics || 'N/A'}</Typography>
              <Typography>Genetics: {selectedSubmission.study_assessments?.genetics || 'N/A'}</Typography>
              <Typography>Biomarkers: {selectedSubmission.study_assessments?.biomarkers || 'N/A'}</Typography>
              <Typography>Immunogenicity: {selectedSubmission.study_assessments?.immunogenicity || 'N/A'}</Typography>
              <Typography>Medical Resource Utilization: {selectedSubmission.study_assessments?.medical_resource_utilization || 'N/A'}</Typography>
              <Typography>Survival Follow Up: {selectedSubmission.study_assessments?.survival_follow_up || 'N/A'}</Typography>
              <Divider sx={{ my: 2 }} />

              {/* Statistical Considerations */}
              <Typography variant="h6" gutterBottom>Statistical Considerations</Typography>
              <Typography>Analysis Sets: {selectedSubmission.statistical_considerations?.analysis_sets || 'N/A'}</Typography>
              <Typography>Primary Objective Analysis: {selectedSubmission.statistical_considerations?.primary_objective_analysis || 'N/A'}</Typography>
              <Typography>Secondary Objective Analysis: {selectedSubmission.statistical_considerations?.secondary_objective_analysis || 'N/A'}</Typography>
              <Typography>Exploratory Analysis: {selectedSubmission.statistical_considerations?.exploratory_analysis || 'N/A'}</Typography>
              <Typography>Safety Analysis: {selectedSubmission.statistical_considerations?.safety_analysis || 'N/A'}</Typography>
              <Typography>Other Analyses: {selectedSubmission.statistical_considerations?.other_analyses || 'N/A'}</Typography>
              <Typography>Interim Analyses: {selectedSubmission.statistical_considerations?.interim_analyses || 'N/A'}</Typography>
              <Typography>Sample Size Determination: {selectedSubmission.statistical_considerations?.sample_size_determination || 'N/A'}</Typography>
              <Divider sx={{ my: 2 }} />

              {/* Regulatory Requirements */}
              <Typography variant="h6" gutterBottom>Regulatory Requirements</Typography>
              <Typography>Countries for Submission: {(selectedSubmission.regulatory_requirements?.countries_for_submission || []).join(', ') || 'N/A'}</Typography>
              <Typography>Committees: {(selectedSubmission.regulatory_requirements?.committees || []).join(', ') || 'N/A'}</Typography>
              <Typography>Informed Consent Process: {selectedSubmission.regulatory_requirements?.informed_consent_process || 'N/A'}</Typography>
              <Typography>Quality Tolerance Limits: {selectedSubmission.regulatory_requirements?.quality_tolerance_limits || 'N/A'}</Typography>
              <Typography>Data Quality Assurance: {selectedSubmission.regulatory_requirements?.data_quality_assurance || 'N/A'}</Typography>
              <Typography>Source Data: {selectedSubmission.regulatory_requirements?.source_data || 'N/A'}</Typography>
              <Divider sx={{ my: 2 }} />

              {/* Appendices */}
              <Typography variant="h6" gutterBottom>Appendices</Typography>
              <Typography>{(selectedSubmission.appendices || []).join(', ') || 'N/A'}</Typography>
              <Divider sx={{ my: 2 }} />

              {/* Additional Comments */}
              <Typography variant="h6" gutterBottom>Additional Comments</Typography>
              <Typography>{selectedSubmission.additional_comments || 'N/A'}</Typography>
              <Divider sx={{ my: 2 }} />

              {/* Document Uploads */}
              <Typography variant="h6" gutterBottom>Document Uploads</Typography>
              <Typography>Primary Documents: {JSON.stringify(selectedSubmission.document_uploads?.primary_documents) || 'N/A'}</Typography>
              <Typography>Supporting Documents: {JSON.stringify(selectedSubmission.document_uploads?.supporting_documents) || 'N/A'}</Typography>
              <Typography>Study Design Outline: {selectedSubmission.document_uploads?.study_design_outline ? 'Yes' : 'No'}</Typography>
              <Typography>Control Arm Documents: {selectedSubmission.document_uploads?.control_arm_documents ? 'Yes' : 'No'}</Typography>
              <Typography>Disease Background Documents: {selectedSubmission.document_uploads?.disease_background_documents ? 'Yes' : 'No'}</Typography>
              <Typography>Uploaded Files: {JSON.stringify(selectedSubmission.document_uploads?.uploaded_files) || 'N/A'}</Typography>
              <Divider sx={{ my: 2 }} />

              {/* Study Monitoring and Logistics */}
              <Typography variant="h6" gutterBottom>Study Monitoring and Logistics</Typography>
              <Typography>Data Collection Method: {selectedSubmission.study_monitoring_logistics?.data_collection_method || 'N/A'}</Typography>
              <Typography>Monitoring Frequency: {selectedSubmission.study_monitoring_logistics?.monitoring_frequency || 'N/A'}</Typography>
              <Typography>On Site or Remote: {selectedSubmission.study_monitoring_logistics?.on_site_or_remote || 'N/A'}</Typography>
              <Typography>Sponsor Contact: {selectedSubmission.study_monitoring_logistics?.key_contacts?.sponsor_contact || 'N/A'}</Typography>
              <Typography>CRO Contact: {selectedSubmission.study_monitoring_logistics?.key_contacts?.cro_contact || 'N/A'}</Typography>
              <Divider sx={{ my: 2 }} />

              {/* Metadata */}
              <Typography variant="h6" gutterBottom>Metadata</Typography>
              <Typography>Submitted At: {selectedSubmission.submittedAt ? new Date(selectedSubmission.submittedAt).toLocaleString() : 'N/A'}</Typography>
              <Typography>Status: {selectedSubmission.status || 'N/A'}</Typography>
              <Typography>Version: {selectedSubmission.version || 'N/A'}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClinicalIntakeHistory; 