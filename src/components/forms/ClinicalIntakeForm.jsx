import React, { useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Grid,
  TextField,
  Button,
  MenuItem,
  Typography,
  FormControlLabel,
  Divider,
  IconButton,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  // Paper,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import { Remove as RemoveIcon, CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import axios from 'axios';
import API_ENDPOINTS from '../../config/api';
import { useNavigate } from 'react-router-dom';

// Add Gemini API configuration
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
console.log('Environment Variables:', {
  NODE_ENV: process.env.NODE_ENV,
  hasGeminiKey: !!GEMINI_API_KEY,
  keyLength: GEMINI_API_KEY ? GEMINI_API_KEY.length : 0,
  allEnvVars: Object.keys(process.env).filter(key => key.startsWith('REACT_APP_'))
});
const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';

// Add background information prompts
const BACKGROUND_PROMPTS = {
  disease_epidemiology: (values) => `Reference Specific I/E for disease condition: ${values.study_overview?.disease_indication || 'Not specified'}, Overall primary disease condition: ${values.study_overview?.therapeutic_area || 'Not specified'}, Disease Background Documents: ${values.target_population?.conditions_related_to_primary_disease || 'Not specified'}, to create a brief outline of how and what background information could be used in protocol background section and do a web search to find relevant information online and list the information here with appropriate citations.`,
  
  current_standard_of_care: (values) => `Reference Specific I/E for disease condition: ${values.study_overview?.disease_indication || 'Not specified'}, Disease Background Documents: ${values.target_population?.conditions_related_to_primary_disease || 'Not specified'}, control arm description: ${values.study_treatments?.control_regimen || 'Not specified'}, Control Arm-Related Documents: ${values.study_overview?.control_method || 'Not specified'} to create a brief outline of current standard of care for proposed patient population that could be used in protocol background section and do a web search to find relevant information online and list the information here with appropriate citations`,
  
  outcomes_current_soc: (values) => `Reference Specific I/E for disease condition: ${values.study_overview?.disease_indication || 'Not specified'}, Disease Background Documents: ${values.target_population?.conditions_related_to_primary_disease || 'Not specified'}, control arm description: ${values.study_treatments?.control_regimen || 'Not specified'}, Control Arm-Related Documents: ${values.study_overview?.control_method || 'Not specified'} to create a brief outline of what are the outcomes with current standard of care for proposed patient population that could be used in protocol background section and do a web search to find relevant information online and list the information here with appropriate citations`,
  
  benefits_investigational: (values) => `Reference Primary Investigational Product (IP) Sources: ${values.study_treatments?.regimen_arm_1 || 'Not specified'}, Supporting Product Documents: ${values.study_overview?.therapeutic_area || 'Not specified'}, Specific I/E for disease condition: ${values.study_overview?.disease_indication || 'Not specified'}, Overall primary disease condition: ${values.study_overview?.therapeutic_area || 'Not specified'} to design a strategy to summarize benefits of the investigational benefits for the target patient population.`,
  
  risks_investigational: (values) => `Reference Primary Investigational Product (IP) Sources: ${values.study_treatments?.regimen_arm_1 || 'Not specified'}, Supporting Product Documents: ${values.study_overview?.therapeutic_area || 'Not specified'}, Specific I/E for disease condition: ${values.study_overview?.disease_indication || 'Not specified'}, Overall primary disease condition: ${values.study_overview?.therapeutic_area || 'Not specified'} to design a strategy to summarize benefits of the investigational benefits for the target patient population.`
};

// Add Gemini response component
const GeminiResponse = ({ prompt, onResponse, values }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchGeminiResponse = async () => {
    if (!GEMINI_API_KEY) {
      setError('Gemini API key is not configured');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        `${GEMINI_API_ENDPOINT}?key=${GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [{
              text: typeof prompt === 'function' ? prompt(values) : prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.data.candidates && response.data.candidates[0].content.parts[0].text) {
        onResponse(response.data.candidates[0].content.parts[0].text);
      } else {
        throw new Error('Invalid response format from Gemini API');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to fetch response from Gemini');
      console.error('Gemini API error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Button
        variant="outlined"
        onClick={fetchGeminiResponse}
        disabled={loading || !GEMINI_API_KEY}
        startIcon={loading ? <CircularProgress size={20} /> : null}
      >
        {loading ? 'Generating Response...' : 'Generate with Gemini'}
      </Button>
      {error && (
        <Typography color="error" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
      {!GEMINI_API_KEY && (
        <Typography color="warning" sx={{ mt: 1 }}>
          Gemini API key is not configured. Please add REACT_APP_GEMINI_API_KEY to your .env file.
        </Typography>
      )}
    </Box>
  );
};

// Validation Schema
const validationSchema = Yup.object({
  study_identification: Yup.object({
    protocol_number: Yup.string().required('Required'),
    alternate_study_identifiers: Yup.string(),
    version_number_date: Yup.string().required('Required'),
    ind_number: Yup.string(),
    eudract_number: Yup.string(),
    sponsor_name: Yup.string().required('Required'),
  }),
  study_overview: Yup.object({
    therapeutic_area: Yup.string().required('Required'),
    disease_indication: Yup.string().required('Required'),
    study_phase: Yup.string().required('Required'),
    study_type: Yup.string().required('Required'),
    trial_intervention_model: Yup.string().required('Required'),
    control_method: Yup.string().required('Required'),
    trial_type: Yup.string().required('Required'),
    randomization: Yup.string().required('Required'),
    blinding: Yup.string().required('Required'),
    number_of_study_parts: Yup.string(),
    stratification_factors: Yup.string(),
    study_periods: Yup.array().of(Yup.string()),
    participant_input_into_design: Yup.string(),
  }),
  endpoints_objectives: Yup.object({
    primary_objective_endpoints: Yup.string().required('Required'),
    key_secondary_objectives_endpoints: Yup.string(),
    secondary_objectives_endpoints: Yup.string(),
    exploratory_objectives_endpoints: Yup.string(),
  }),
  target_population: Yup.object({
    conditions_related_to_primary_disease: Yup.string().required('Required'),
    tissue_sample_procedure_compliance: Yup.string(),
    patient_performance_status: Yup.string(),
    life_expectancy: Yup.string(),
    organ_function_lab_parameters: Yup.string(),
    concomitant_meds_washout: Yup.string(),
    comorbidities_infections: Yup.string(),
    reproductive_status_contraception: Yup.string(),
    eligibility_criteria: Yup.string(),
  }),
  study_treatments: Yup.object({
    regimen_arm_1: Yup.string(),
    regimen_arm_2: Yup.string(),
    regimen_arm_3: Yup.string(),
    control_regimen: Yup.string(),
    concomitant_medications_allowed: Yup.string(),
    concomitant_medications_prohibited: Yup.string(),
    fda_pregnancy_risk_categories: Yup.string(),
  }),
  discontinuation_rules: Yup.object({
    trial_intervention_discontinuation: Yup.string(),
    participant_withdrawal: Yup.string(),
    lost_to_follow_up: Yup.string(),
    trial_stopping_rules: Yup.string(),
  }),
  study_assessments: Yup.object({
    screening_baseline: Yup.string(),
    efficacy_assessments: Yup.array().of(Yup.string()),
    safety_assessments: Yup.object({
      standard_procedures: Yup.string(),
      adverse_events_special_interest: Yup.string(),
      ae_sae_collection_period: Yup.string(),
      disease_related_events: Yup.string(),
    }),
    pharmacokinetics: Yup.string(),
    genetics: Yup.string(),
    biomarkers: Yup.string(),
    immunogenicity: Yup.string(),
    medical_resource_utilization: Yup.string(),
    survival_follow_up: Yup.string(),
  }),
  statistical_considerations: Yup.object({
    analysis_sets: Yup.string(),
    primary_objective_analysis: Yup.string(),
    secondary_objective_analysis: Yup.string(),
    exploratory_analysis: Yup.string(),
    safety_analysis: Yup.string(),
    other_analyses: Yup.string(),
    interim_analyses: Yup.string(),
    sample_size_determination: Yup.string(),
  }),
  regulatory_requirements: Yup.object({
    countries_for_submission: Yup.array().of(Yup.string()),
    committees: Yup.array().of(Yup.string()),
    informed_consent_process: Yup.string(),
    quality_tolerance_limits: Yup.string(),
    data_quality_assurance: Yup.string(),
    source_data: Yup.string(),
  }),
  appendices: Yup.array().of(Yup.string()),
  additional_comments: Yup.string(),
  document_uploads: Yup.object({
    primary_documents: Yup.object({
      investigator_brochure: Yup.boolean(),
      label: Yup.boolean(),
      additional_reports: Yup.boolean(),
    }),
    supporting_documents: Yup.object({
      pharmacy_manual: Yup.boolean(),
      risk_management_guidelines: Yup.boolean(),
      user_defined: Yup.boolean(),
    }),
    study_design_outline: Yup.boolean(),
    control_arm_documents: Yup.boolean(),
    disease_background_documents: Yup.boolean(),
    uploaded_files: Yup.object({
      investigator_brochure: Yup.array().of(Yup.object({
        name: Yup.string(),
        filename: Yup.string(),
        documentType: Yup.string(),
      })),
      label: Yup.array().of(Yup.object({
        name: Yup.string(),
        filename: Yup.string(),
        documentType: Yup.string(),
      })),
      additional_reports: Yup.array().of(Yup.object({
        name: Yup.string(),
        filename: Yup.string(),
        documentType: Yup.string(),
      })),
      pharmacy_manual: Yup.array().of(Yup.object({
        name: Yup.string(),
        filename: Yup.string(),
        documentType: Yup.string(),
      })),
      risk_management_guidelines: Yup.array().of(Yup.object({
        name: Yup.string(),
        filename: Yup.string(),
        documentType: Yup.string(),
      })),
      user_defined: Yup.array().of(Yup.object({
        name: Yup.string(),
        filename: Yup.string(),
        documentType: Yup.string(),
      })),
      study_design_outline: Yup.array().of(Yup.object({
        name: Yup.string(),
        filename: Yup.string(),
        documentType: Yup.string(),
      })),
      control_arm_documents: Yup.array().of(Yup.object({
        name: Yup.string(),
        filename: Yup.string(),
        documentType: Yup.string(),
      })),
      disease_background_documents: Yup.array().of(Yup.object({
        name: Yup.string(),
        filename: Yup.string(),
        documentType: Yup.string(),
      })),
    }),
  }),
  study_monitoring_logistics: Yup.object({
    data_collection_method: Yup.string().required('Required'),
    monitoring_frequency: Yup.string(),
    on_site_or_remote: Yup.string().required('Required'),
    key_contacts: Yup.object({
      sponsor_contact: Yup.string(),
      cro_contact: Yup.string()
    })
  }),
});

// Initial values setup
const getInitialValues = (initialData) => {
  const defaultValues = {
    study_identification: {
      protocol_number: '',
      alternate_study_identifiers: '',
      version_number_date: '',
      ind_number: '',
      eudract_number: '',
      sponsor_name: '',
    },
    study_overview: {
      therapeutic_area: '',
      disease_indication: '',
      study_phase: '',
      study_type: '',
      trial_intervention_model: '',
      control_method: '',
      trial_type: '',
      randomization: '',
      blinding: '',
      number_of_study_parts: '',
      stratification_factors: '',
      study_periods: [''],
      participant_input_into_design: '',
    },
    endpoints_objectives: {
      primary_objective_endpoints: '',
      key_secondary_objectives_endpoints: '',
      secondary_objectives_endpoints: '',
      exploratory_objectives_endpoints: '',
    },
    target_population: {
      conditions_related_to_primary_disease: '',
      tissue_sample_procedure_compliance: '',
      patient_performance_status: '',
      life_expectancy: '',
      organ_function_lab_parameters: '',
      concomitant_meds_washout: '',
      comorbidities_infections: '',
      reproductive_status_contraception: '',
      eligibility_criteria: '',
    },
    study_treatments: {
      regimen_arm_1: '',
      regimen_arm_2: '',
      regimen_arm_3: '',
      control_regimen: '',
      concomitant_medications_allowed: '',
      concomitant_medications_prohibited: '',
      fda_pregnancy_risk_categories: '',
    },
    discontinuation_rules: {
      trial_intervention_discontinuation: '',
      participant_withdrawal: '',
      lost_to_follow_up: '',
      trial_stopping_rules: '',
    },
    study_assessments: {
      screening_baseline: '',
      efficacy_assessments: [''],
      safety_assessments: {
        standard_procedures: '',
        adverse_events_special_interest: '',
        ae_sae_collection_period: '',
        disease_related_events: '',
      },
      pharmacokinetics: '',
      genetics: '',
      biomarkers: '',
      immunogenicity: '',
      medical_resource_utilization: '',
      survival_follow_up: '',
    },
    statistical_considerations: {
      analysis_sets: '',
      primary_objective_analysis: '',
      secondary_objective_analysis: '',
      exploratory_analysis: '',
      safety_analysis: '',
      other_analyses: '',
      interim_analyses: '',
      sample_size_determination: '',
    },
    regulatory_requirements: {
      countries_for_submission: [''],
      committees: [''],
      informed_consent_process: '',
      quality_tolerance_limits: '',
      data_quality_assurance: '',
      source_data: '',
    },
    appendices: [''],
    additional_comments: '',
    document_uploads: {
      primary_documents: {
        investigator_brochure: false,
        label: false,
        additional_reports: false,
      },
      supporting_documents: {
        pharmacy_manual: false,
        risk_management_guidelines: false,
        user_defined: false,
      },
      study_design_outline: false,
      control_arm_documents: false,
      disease_background_documents: false,
      uploaded_files: {
        investigator_brochure: [],
        label: [],
        additional_reports: [],
        pharmacy_manual: [],
        risk_management_guidelines: [],
        user_defined: [],
        study_design_outline: [],
        control_arm_documents: [],
        disease_background_documents: []
      }
    },
    study_monitoring_logistics: {
      data_collection_method: 'Electronic Data Capture (EDC)',
      monitoring_frequency: '',
      on_site_or_remote: 'On-Site',
      key_contacts: {
        sponsor_contact: '',
        cro_contact: ''
      }
    }
  };

  // Deep merge the default values with initialData
  const mergedValues = deepMerge(defaultValues, initialData || {});
  return mergedValues;
};

// Helper function for deep merging objects
const deepMerge = (target, source) => {
  const output = { ...target };
  if (source) {
    Object.keys(source).forEach(key => {
      if (source[key] instanceof Object && !Array.isArray(source[key])) {
        output[key] = deepMerge(target[key] || {}, source[key]);
      } else {
        output[key] = source[key];
      }
    });
  }
  return output;
};

// Update the API endpoint
const SUBMIT_FORM_ENDPOINT = API_ENDPOINTS.clinicalIntake.submit;

// Component function
const ClinicalIntakeForm = ({ onSubmit, initialData }) => {
  const [isParsing, setIsParsing] = useState(false);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  // const navigate = useNavigate();

  // Merge initialData with default values
  const startingValues = getInitialValues(initialData);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setIsSubmitting(true);
      console.log('Submitting to:', SUBMIT_FORM_ENDPOINT); // Debug log
      
      // First save to MongoDB
      const response = await axios.post(SUBMIT_FORM_ENDPOINT, values, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        // Show success alert
        setShowSuccessAlert(true);
        
        // Wait for 2 seconds to show the success message before navigating
        setTimeout(() => {
          // If save successful, then call onSubmit for navigation
          if (onSubmit) {
            onSubmit(values);
          }
        }, 2000);
      } else {
        setErrorMessage(response.data.message || 'Failed to save form data. Please try again.');
      }
    } catch (error) {
      console.error('Error saving form:', error);
      setErrorMessage(
        error.response?.data?.message || 
        error.message || 
        'Failed to save form data. Please check your connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (file, documentType, setFieldValue, values) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    formData.append('title', file.name);
    formData.append('zone', 'clinical');
    formData.append('section', 'protocol');
    formData.append('studyId', values.study_identification?.protocol_number || 'TEMP');

    try {
      const response = await axios.post(API_ENDPOINTS.documents.upload, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        // const fileInfo = {
        //   filename: response.data.file.filename,
        //   originalname: file.name,
        //   documentType: documentType
        // };
        
        // Update the form state with the new file
        const currentFiles = values.document_uploads?.uploaded_files?.[documentType] || [];
        const updatedFiles = [...currentFiles, {
          name: file.name,
          filename: response.data.file.filename,
          documentType: documentType
        }];
        
        setFieldValue(`document_uploads.uploaded_files.${documentType}`, updatedFiles);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(`Error uploading file: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDoneWithUploading = async (setFieldValue, values) => {
    if (values.document_uploads?.uploaded_files.study_design_outline.length === 0) {
      alert('Please upload a Study Design Outline document before proceeding.');
      return;
    }

    setIsParsing(true);
    try {
      // Format the files array to include only necessary information
      const formattedFiles = values.document_uploads.uploaded_files.study_design_outline.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        documentType: file.documentType
      }));

      console.log('Sending files for parsing:', formattedFiles);
      
      // Create form fields structure with all sections
      const formFields = {
        study_identification: Object.keys(values.study_identification),
        study_overview: Object.keys(values.study_overview),
        endpoints_objectives: Object.keys(values.endpoints_objectives),
        target_population: Object.keys(values.target_population),
        study_treatments: Object.keys(values.study_treatments),
        discontinuation_rules: Object.keys(values.discontinuation_rules),
        study_assessments: {
          ...Object.keys(values.study_assessments).filter(key => key !== 'safety_assessments'),
          safety_assessments: Object.keys(values.study_assessments.safety_assessments)
        },
        statistical_considerations: Object.keys(values.statistical_considerations),
        regulatory_requirements: {
          ...Object.keys(values.regulatory_requirements).filter(key => key !== 'countries_for_submission' && key !== 'committees'),
          countries_for_submission: [],
          committees: []
        },
        appendices: [],
        additional_comments: ''
      };
      
      console.log('Form fields structure:', formFields);

      const response = await axios.post(API_ENDPOINTS.ai.parseDocuments, {
        files: formattedFiles,
        formFields
      });

      if (response.data.success) {
        console.log('Received parsed data:', response.data.parsedData);
        
        // Update form values with parsed data
        const updateNestedFields = (section, fields) => {
          if (fields && typeof fields === 'object') {
            Object.entries(fields).forEach(([field, value]) => {
              if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                  // Handle arrays
                  value.forEach((item, index) => {
                    setFieldValue(`${section}.${field}[${index}]`, item);
                  });
                } else if (typeof value === 'object' && value !== null) {
                  // Handle nested objects
                  Object.entries(value).forEach(([nestedField, nestedValue]) => {
                    if (nestedValue !== undefined && nestedValue !== null) {
                      setFieldValue(`${section}.${field}.${nestedField}`, nestedValue);
                    }
                  });
                } else {
                  // Handle simple values
                  setFieldValue(`${section}.${field}`, value);
                }
              }
            });
          }
        };

        // Update all sections including additional_comments
        Object.entries(response.data.parsedData).forEach(([section, fields]) => {
          if (section === 'additional_comments') {
            setFieldValue('additional_comments', fields);
          } else {
            updateNestedFields(section, fields);
          }
        });
      }
    } catch (error) {
      console.error('Error parsing documents:', error);
      alert('Error parsing documents. Please fill the form manually.');
    } finally {
      setIsParsing(false);
    }
  };

  // JSX Component
  return (
    <>
      <Formik
        initialValues={startingValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting, setFieldValue }) => (
          <Form onSubmit={handleSubmit}>
            {/* Document Upload Section (PROFESSIONAL STRUCTURE) */}
            <Box mb={4}>
              <Typography variant="h6" gutterBottom>1. Document Upload Section</Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Please select the document types you wish to upload. For each, check the box, then upload the file(s). Uploaded files will be listed below each type. You may remove files if needed. You can also add comments for each document.
              </Typography>

              {/* Study Design Outline Document */}
              <Box mb={2}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={values.document_uploads?.study_design_outline || false}
                      onChange={handleChange}
                      name="document_uploads.study_design_outline"
                    />
                  }
                  label="1. Study Design Outline Document"
                />
                <Typography variant="body2" color="textSecondary" sx={{ ml: 4 }}>
                  (This can be a synopsis or a study design PPT, any format is welcome. If not available, provide a brief text or audio description.)
                </Typography>
                {values.document_uploads?.study_design_outline && (
                  <Box ml={4} mt={1}>
                    <input
                      type="file"
                      onChange={e => handleFileUpload(e.target.files[0], 'study_design_outline', setFieldValue, values)}
                      accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,.mp3,.wav,.m4a"
                    />
                    <List>
                      {(values.document_uploads?.uploaded_files?.study_design_outline || []).map((file, idx) => (
                        <ListItem key={idx}>
                          <ListItemText primary={file.name} />
                          <ListItemSecondaryAction>
                            <IconButton edge="end" aria-label="delete" onClick={() => {
                              const updated = (values.document_uploads.uploaded_files.study_design_outline || []).filter((_, i) => i !== idx);
                              setFieldValue('document_uploads.uploaded_files.study_design_outline', updated);
                            }}>
                              <RemoveIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                    <Field
                      as={TextField}
                      name="document_uploads.comments.study_design_outline"
                      label="Comments for Study Design Outline Document"
                      fullWidth
                      multiline
                      rows={2}
                      variant="outlined"
                      margin="normal"
                    />
                    <Field
                      as={TextField}
                      name="study_design_outline_description"
                      label="Description (if no document uploaded)"
                      fullWidth
                      multiline
                      rows={3}
                      variant="outlined"
                      margin="normal"
                    />
                  </Box>
                )}
              </Box>

              {/* Primary source of information for investigational agents/Regimens */}
              <Box mb={2}>
                <Typography variant="subtitle1">Primary source of information for investigational agents/Regimens</Typography>
                <Box ml={2}>
                  {/* Investigator Brochure */}
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={values.document_uploads?.primary_documents?.investigator_brochure || false}
                        onChange={handleChange}
                        name="document_uploads.primary_documents.investigator_brochure"
                      />
                    }
                    label="Investigator Brochure"
                  />
                  {values.document_uploads?.primary_documents?.investigator_brochure && (
                    <Box ml={4} mt={1}>
                      <input
                        type="file"
                        onChange={e => handleFileUpload(e.target.files[0], 'investigator_brochure', setFieldValue, values)}
                        accept=".pdf,.doc,.docx"
                      />
                      <List>
                        {(values.document_uploads?.uploaded_files?.investigator_brochure || []).map((file, idx) => (
                          <ListItem key={idx}>
                            <ListItemText primary={file.name} />
                            <ListItemSecondaryAction>
                              <IconButton edge="end" aria-label="delete" onClick={() => {
                                const updated = (values.document_uploads.uploaded_files.investigator_brochure || []).filter((_, i) => i !== idx);
                                setFieldValue('document_uploads.uploaded_files.investigator_brochure', updated);
                              }}>
                                <RemoveIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                      <Field
                        as={TextField}
                        name="document_uploads.comments.investigator_brochure"
                        label="Comments for Investigator Brochure"
                        fullWidth
                        multiline
                        rows={2}
                        variant="outlined"
                        margin="normal"
                      />
                    </Box>
                  )}
                  {/* Label */}
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={values.document_uploads?.primary_documents?.label || false}
                        onChange={handleChange}
                        name="document_uploads.primary_documents.label"
                      />
                    }
                    label="Label"
                  />
                  {values.document_uploads?.primary_documents?.label && (
                    <Box ml={4} mt={1}>
                      <input
                        type="file"
                        onChange={e => handleFileUpload(e.target.files[0], 'label', setFieldValue, values)}
                        accept=".pdf,.doc,.docx"
                      />
                      <List>
                        {(values.document_uploads?.uploaded_files?.label || []).map((file, idx) => (
                          <ListItem key={idx}>
                            <ListItemText primary={file.name} />
                            <ListItemSecondaryAction>
                              <IconButton edge="end" aria-label="delete" onClick={() => {
                                const updated = (values.document_uploads.uploaded_files.label || []).filter((_, i) => i !== idx);
                                setFieldValue('document_uploads.uploaded_files.label', updated);
                              }}>
                                <RemoveIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                      <Field
                        as={TextField}
                        name="document_uploads.comments.label"
                        label="Comments for Label"
                        fullWidth
                        multiline
                        rows={2}
                        variant="outlined"
                        margin="normal"
                      />
                    </Box>
                  )}
                  {/* Additional Safety/Efficacy Reports */}
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={values.document_uploads?.primary_documents?.additional_reports || false}
                        onChange={handleChange}
                        name="document_uploads.primary_documents.additional_reports"
                      />
                    }
                    label="Additional Safety/Efficacy Reports"
                  />
                  {values.document_uploads?.primary_documents?.additional_reports && (
                    <Box ml={4} mt={1}>
                      <input
                        type="file"
                        multiple
                        onChange={e => Array.from(e.target.files).forEach(file => handleFileUpload(file, 'additional_reports', setFieldValue, values))}
                        accept=".pdf,.doc,.docx"
                      />
                      <List>
                        {(values.document_uploads?.uploaded_files?.additional_reports || []).map((file, idx) => (
                          <ListItem key={idx}>
                            <ListItemText primary={file.name} />
                            <ListItemSecondaryAction>
                              <IconButton edge="end" aria-label="delete" onClick={() => {
                                const updated = (values.document_uploads.uploaded_files.additional_reports || []).filter((_, i) => i !== idx);
                                setFieldValue('document_uploads.uploaded_files.additional_reports', updated);
                              }}>
                                <RemoveIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                      <Field
                        as={TextField}
                        name="document_uploads.comments.additional_reports"
                        label="Comments for Additional Safety/Efficacy Reports"
                        fullWidth
                        multiline
                        rows={2}
                        variant="outlined"
                        margin="normal"
                      />
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Additional supporting documents for the investigational agent */}
              <Box mb={2}>
                <Typography variant="subtitle1">Additional supporting documents for the investigational agent</Typography>
                <Box ml={2}>
                  {/* Pharmacy Manual */}
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={values.document_uploads?.supporting_documents?.pharmacy_manual || false}
                        onChange={handleChange}
                        name="document_uploads.supporting_documents.pharmacy_manual"
                      />
                    }
                    label="Pharmacy Manual"
                  />
                  {values.document_uploads?.supporting_documents?.pharmacy_manual && (
                    <Box ml={4} mt={1}>
                      <input
                        type="file"
                        onChange={e => handleFileUpload(e.target.files[0], 'pharmacy_manual', setFieldValue, values)}
                        accept=".pdf,.doc,.docx"
                      />
                      <List>
                        {(values.document_uploads?.uploaded_files?.pharmacy_manual || []).map((file, idx) => (
                          <ListItem key={idx}>
                            <ListItemText primary={file.name} />
                            <ListItemSecondaryAction>
                              <IconButton edge="end" aria-label="delete" onClick={() => {
                                const updated = (values.document_uploads.uploaded_files.pharmacy_manual || []).filter((_, i) => i !== idx);
                                setFieldValue('document_uploads.uploaded_files.pharmacy_manual', updated);
                              }}>
                                <RemoveIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                      <Field
                        as={TextField}
                        name="document_uploads.comments.pharmacy_manual"
                        label="Comments for Pharmacy Manual"
                        fullWidth
                        multiline
                        rows={2}
                        variant="outlined"
                        margin="normal"
                      />
                    </Box>
                  )}
                  {/* Risk Management Guidelines */}
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={values.document_uploads?.supporting_documents?.risk_management_guidelines || false}
                        onChange={handleChange}
                        name="document_uploads.supporting_documents.risk_management_guidelines"
                      />
                    }
                    label="Risk Management Guidelines"
                  />
                  {values.document_uploads?.supporting_documents?.risk_management_guidelines && (
                    <Box ml={4} mt={1}>
                      <input
                        type="file"
                        onChange={e => handleFileUpload(e.target.files[0], 'risk_management_guidelines', setFieldValue, values)}
                        accept=".pdf,.doc,.docx"
                      />
                      <List>
                        {(values.document_uploads?.uploaded_files?.risk_management_guidelines || []).map((file, idx) => (
                          <ListItem key={idx}>
                            <ListItemText primary={file.name} />
                            <ListItemSecondaryAction>
                              <IconButton edge="end" aria-label="delete" onClick={() => {
                                const updated = (values.document_uploads.uploaded_files.risk_management_guidelines || []).filter((_, i) => i !== idx);
                                setFieldValue('document_uploads.uploaded_files.risk_management_guidelines', updated);
                              }}>
                                <RemoveIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                      <Field
                        as={TextField}
                        name="document_uploads.comments.risk_management_guidelines"
                        label="Comments for Risk Management Guidelines"
                        fullWidth
                        multiline
                        rows={2}
                        variant="outlined"
                        margin="normal"
                      />
                    </Box>
                  )}
                  {/* Additional (User Defined) */}
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={values.document_uploads?.supporting_documents?.user_defined || false}
                        onChange={handleChange}
                        name="document_uploads.supporting_documents.user_defined"
                      />
                    }
                    label="Additional (User Defined)"
                  />
                  {values.document_uploads?.supporting_documents?.user_defined && (
                    <Box ml={4} mt={1}>
                      <input
                        type="file"
                        multiple
                        onChange={e => Array.from(e.target.files).forEach(file => handleFileUpload(file, 'user_defined', setFieldValue, values))}
                        accept=".pdf,.doc,.docx"
                      />
                      <List>
                        {(values.document_uploads?.uploaded_files?.user_defined || []).map((file, idx) => (
                          <ListItem key={idx}>
                            <ListItemText primary={file.name} />
                            <ListItemSecondaryAction>
                              <IconButton edge="end" aria-label="delete" onClick={() => {
                                const updated = (values.document_uploads.uploaded_files.user_defined || []).filter((_, i) => i !== idx);
                                setFieldValue('document_uploads.uploaded_files.user_defined', updated);
                              }}>
                                <RemoveIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                      <Field
                        as={TextField}
                        name="document_uploads.comments.user_defined"
                        label="Comments for Additional (User Defined)"
                        fullWidth
                        multiline
                        rows={2}
                        variant="outlined"
                        margin="normal"
                      />
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Control Arm related documents */}
              <Box mb={2}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={values.document_uploads?.control_arm_documents || false}
                      onChange={handleChange}
                      name="document_uploads.control_arm_documents"
                    />
                  }
                  label="Control Arm related documents"
                />
                <Typography variant="body2" color="textSecondary" sx={{ ml: 4 }}>
                  (Optional: Upload documents like labels, primary studies leading to approval of regimens, any studies to be used to benchmark SOC outcomes, etc. If no document is uploaded, publicly available latest FDA labels or general scientific publications will be used.)
                </Typography>
                {values.document_uploads?.control_arm_documents && (
                  <Box ml={4} mt={1}>
                    <input
                      type="file"
                      multiple
                      onChange={e => Array.from(e.target.files).forEach(file => handleFileUpload(file, 'control_arm_documents', setFieldValue, values))}
                      accept=".pdf,.doc,.docx"
                    />
                    <List>
                      {(values.document_uploads?.uploaded_files?.control_arm_documents || []).map((file, idx) => (
                        <ListItem key={idx}>
                          <ListItemText primary={file.name} />
                          <ListItemSecondaryAction>
                            <IconButton edge="end" aria-label="delete" onClick={() => {
                              const updated = (values.document_uploads.uploaded_files.control_arm_documents || []).filter((_, i) => i !== idx);
                              setFieldValue('document_uploads.uploaded_files.control_arm_documents', updated);
                            }}>
                              <RemoveIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                    <Field
                      as={TextField}
                      name="document_uploads.comments.control_arm_documents"
                      label="Comments for Control Arm related documents"
                      fullWidth
                      multiline
                      rows={2}
                      variant="outlined"
                      margin="normal"
                    />
                  </Box>
                )}
              </Box>

              {/* Disease Background */}
              <Box mb={2}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={values.document_uploads?.disease_background_documents || false}
                      onChange={handleChange}
                      name="document_uploads.disease_background_documents"
                    />
                  }
                  label="Disease Background"
                />
                <Typography variant="body2" color="textSecondary" sx={{ ml: 4 }}>
                  (Optional: Upload or describe documents to be used to explain the disease background, epidemiology, unmet need, etc. If no document is uploaded, publicly available general scientific publications will be used.)
                </Typography>
                {values.document_uploads?.disease_background_documents && (
                  <Box ml={4} mt={1}>
                    <input
                      type="file"
                      multiple
                      onChange={e => Array.from(e.target.files).forEach(file => handleFileUpload(file, 'disease_background_documents', setFieldValue, values))}
                      accept=".pdf,.doc,.docx"
                    />
                    <Field
                      as={TextField}
                      name="disease_background_description"
                      label="Description (if no document uploaded)"
                      fullWidth
                      multiline
                      rows={3}
                      variant="outlined"
                      margin="normal"
                    />
                    <Field
                      as={TextField}
                      name="document_uploads.comments.disease_background_documents"
                      label="Comments for Disease Background"
                      fullWidth
                      multiline
                      rows={2}
                      variant="outlined"
                      margin="normal"
                    />
                    <List>
                      {(values.document_uploads?.uploaded_files?.disease_background_documents || []).map((file, idx) => (
                        <ListItem key={idx}>
                          <ListItemText primary={file.name} />
                          <ListItemSecondaryAction>
                            <IconButton edge="end" aria-label="delete" onClick={() => {
                              const updated = (values.document_uploads.uploaded_files.disease_background_documents || []).filter((_, i) => i !== idx);
                              setFieldValue('document_uploads.uploaded_files.disease_background_documents', updated);
                            }}>
                              <RemoveIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Box>

              {/* Done with Uploading Button */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleDoneWithUploading(setFieldValue, values)}
                  disabled={isParsing || values.document_uploads?.uploaded_files.study_design_outline.length === 0}
                  startIcon={<CloudUploadIcon />}
                >
                  {isParsing ? 'Parsing Documents...' : 'Done with Uploading'}
                </Button>
              </Box>
            </Box>

            {/* Background Information Section - Moved here */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                1.1 Background Information
              </Typography>
              
              {/* Disease Epidemiology */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  a) Disease Epidemiology
                </Typography>
                <GeminiResponse 
                  prompt={BACKGROUND_PROMPTS.disease_epidemiology}
                  onResponse={(response) => setFieldValue('background_information.disease_epidemiology', response)}
                  values={values}
                />
                <TextField
                  fullWidth
                  multiline
                  minRows={4}
                  maxRows={20}
                  name="background_information.disease_epidemiology"
                  label="Disease Epidemiology (Include prevalence, incidence, demographics, risk factors, and disease burden)"
                  value={values.background_information?.disease_epidemiology || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  helperText="Reference: Specific I/E for disease condition, Overall primary disease condition, Disease Background Documents"
                />
              </Box>

              {/* Current Standard of Care */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  b) Current Standard of Care
                </Typography>
                <GeminiResponse 
                  prompt={BACKGROUND_PROMPTS.current_standard_of_care}
                  onResponse={(response) => setFieldValue('background_information.current_standard_of_care', response)}
                  values={values}
                />
                <TextField
                  fullWidth
                  multiline
                  minRows={4}
                  maxRows={20}
                  name="background_information.current_standard_of_care"
                  label="Current Standard of Care (Include approved treatments, guidelines, and clinical practice)"
                  value={values.background_information?.current_standard_of_care || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  helperText="Reference: Specific I/E for disease condition, Disease Background Documents, Control Arm Description, Control Arm-Related Documents"
                />
              </Box>

              {/* Outcomes with Current Standard of Care */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  c) Outcomes with Current Standard of Care
                </Typography>
                <GeminiResponse 
                  prompt={BACKGROUND_PROMPTS.outcomes_current_soc}
                  onResponse={(response) => setFieldValue('background_information.outcomes_current_soc', response)}
                  values={values}
                />
                <TextField
                  fullWidth
                  multiline
                  minRows={4}
                  maxRows={20}
                  name="background_information.outcomes_current_soc"
                  label="Outcomes with Current Standard of Care (Include efficacy, safety, and quality of life outcomes)"
                  value={values.background_information?.outcomes_current_soc || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  helperText="Reference: Specific I/E for disease condition, Disease Background Documents, Control Arm Description, Control Arm-Related Documents"
                />
              </Box>

              {/* Benefits with Investigational Agent/Regimen */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  d) Benefits with the Investigational Agent/Regimen
                </Typography>
                <GeminiResponse 
                  prompt={BACKGROUND_PROMPTS.benefits_investigational}
                  onResponse={(response) => setFieldValue('background_information.benefits_investigational', response)}
                  values={values}
                />
                <TextField
                  fullWidth
                  multiline
                  minRows={4}
                  maxRows={20}
                  name="background_information.benefits_investigational"
                  label="Benefits with the Investigational Agent/Regimen (Include potential advantages, mechanism of action, and expected improvements)"
                  value={values.background_information?.benefits_investigational || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  helperText="Reference: Primary Investigational Product (IP) Sources, Supporting Product Documents, Specific I/E for disease condition, Overall primary disease condition"
                />
              </Box>

              {/* Risks with Investigational Agent/Regimen */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  e) Risks with the Investigational Agent/Regimen
                </Typography>
                <GeminiResponse 
                  prompt={BACKGROUND_PROMPTS.risks_investigational}
                  onResponse={(response) => setFieldValue('background_information.risks_investigational', response)}
                  values={values}
                />
                <TextField
                  fullWidth
                  multiline
                  minRows={4}
                  maxRows={20}
                  name="background_information.risks_investigational"
                  label="Risks with the Investigational Agent/Regimen (Include known safety concerns, potential adverse effects, and risk mitigation strategies)"
                  value={values.background_information?.risks_investigational || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  helperText="Reference: Primary Investigational Product (IP) Sources, Supporting Product Documents, Specific I/E for disease condition, Overall primary disease condition"
                />
              </Box>
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* Study Identification Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                2. Study Identification
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="study_identification.protocol_number"
                    label="Protocol Number"
                    value={values.study_identification.protocol_number}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.study_identification?.protocol_number && Boolean(errors.study_identification?.protocol_number)}
                    helperText={touched.study_identification?.protocol_number && errors.study_identification?.protocol_number}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="study_identification.alternate_study_identifiers"
                    label="Alternate Study Identifiers"
                    value={values.study_identification.alternate_study_identifiers}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="study_identification.version_number_date"
                    label="Version Number and Date"
                    value={values.study_identification.version_number_date}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.study_identification?.version_number_date && Boolean(errors.study_identification?.version_number_date)}
                    helperText={touched.study_identification?.version_number_date && errors.study_identification?.version_number_date}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="study_identification.ind_number"
                    label="IND Number"
                    value={values.study_identification.ind_number}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="study_identification.eudract_number"
                    label="EudraCT Number"
                    value={values.study_identification.eudract_number}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="study_identification.sponsor_name"
                    label="Sponsor Name"
                    value={values.study_identification.sponsor_name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.study_identification?.sponsor_name && Boolean(errors.study_identification?.sponsor_name)}
                    helperText={touched.study_identification?.sponsor_name && errors.study_identification?.sponsor_name}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* Study Overview Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                2. Study Overview and Design
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="study_overview.therapeutic_area"
                    label="Therapeutic Area"
                    value={values.study_overview.therapeutic_area}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.study_overview?.therapeutic_area && Boolean(errors.study_overview?.therapeutic_area)}
                    helperText={touched.study_overview?.therapeutic_area && errors.study_overview?.therapeutic_area}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="study_overview.disease_indication"
                    label="Disease Indication"
                    value={values.study_overview.disease_indication}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.study_overview?.disease_indication && Boolean(errors.study_overview?.disease_indication)}
                    helperText={touched.study_overview?.disease_indication && errors.study_overview?.disease_indication}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="study_overview.study_phase"
                    label="Study Phase"
                    value={values.study_overview.study_phase}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.study_overview?.study_phase && Boolean(errors.study_overview?.study_phase)}
                    helperText={touched.study_overview?.study_phase && errors.study_overview?.study_phase}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    name="study_overview.study_type"
                    label="Study Type"
                    value={values.study_overview.study_type}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.study_overview?.study_type && Boolean(errors.study_overview?.study_type)}
                    helperText={touched.study_overview?.study_type && errors.study_overview?.study_type}
                  >
                    {['Interventional', 'Observational', 'Expanded Access'].map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="study_overview.trial_intervention_model"
                    label="Trial Intervention Model"
                    value={values.study_overview.trial_intervention_model}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.study_overview?.trial_intervention_model && Boolean(errors.study_overview?.trial_intervention_model)}
                    helperText={touched.study_overview?.trial_intervention_model && errors.study_overview?.trial_intervention_model}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="study_overview.control_method"
                    label="Control Method"
                    value={values.study_overview.control_method}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.study_overview?.control_method && Boolean(errors.study_overview?.control_method)}
                    helperText={touched.study_overview?.control_method && errors.study_overview?.control_method}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="study_overview.trial_type"
                    label="Type of Trial"
                    value={values.study_overview.trial_type}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.study_overview?.trial_type && Boolean(errors.study_overview?.trial_type)}
                    helperText={touched.study_overview?.trial_type && errors.study_overview?.trial_type}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="study_overview.randomization"
                    label="Randomization"
                    value={values.study_overview.randomization}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.study_overview?.randomization && Boolean(errors.study_overview?.randomization)}
                    helperText={touched.study_overview?.randomization && errors.study_overview?.randomization}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="study_overview.blinding"
                    label="Blinding"
                    value={values.study_overview.blinding}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.study_overview?.blinding && Boolean(errors.study_overview?.blinding)}
                    helperText={touched.study_overview?.blinding && errors.study_overview?.blinding}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="study_overview.number_of_study_parts"
                    label="Number of Study Parts"
                    value={values.study_overview.number_of_study_parts}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="study_overview.stratification_factors"
                    label="Stratification Factors"
                    value={values.study_overview.stratification_factors}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    name="study_overview.participant_input_into_design"
                    label="Participant Input into Design"
                    value={values.study_overview.participant_input_into_design}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* Endpoints/Objectives Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                3. Endpoints/Objectives
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    name="endpoints_objectives.primary_objective_endpoints"
                    label="Primary Objective/Endpoints"
                    value={values.endpoints_objectives.primary_objective_endpoints}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.endpoints_objectives?.primary_objective_endpoints && Boolean(errors.endpoints_objectives?.primary_objective_endpoints)}
                    helperText={touched.endpoints_objectives?.primary_objective_endpoints && errors.endpoints_objectives?.primary_objective_endpoints}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    name="endpoints_objectives.key_secondary_objectives_endpoints"
                    label="Key Secondary Objectives/Endpoints"
                    value={values.endpoints_objectives.key_secondary_objectives_endpoints}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    name="endpoints_objectives.secondary_objectives_endpoints"
                    label="Secondary Objectives/Endpoints"
                    value={values.endpoints_objectives.secondary_objectives_endpoints}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    name="endpoints_objectives.exploratory_objectives_endpoints"
                    label="Exploratory Objectives/Endpoints"
                    value={values.endpoints_objectives.exploratory_objectives_endpoints}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* Target Population Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                4. Target Population
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="target_population.conditions_related_to_primary_disease"
                    label="Conditions related to primary disease (Including disease stage, biomarker status, prior therapies, CNS involvement)"
                    value={values.target_population?.conditions_related_to_primary_disease || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.target_population?.conditions_related_to_primary_disease && Boolean(errors.target_population?.conditions_related_to_primary_disease)}
                    helperText={touched.target_population?.conditions_related_to_primary_disease && errors.target_population?.conditions_related_to_primary_disease}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="target_population.tissue_sample_procedure_compliance"
                    label="Tissue sample or Procedure compliance requirements"
                    value={values.target_population?.tissue_sample_procedure_compliance || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="target_population.patient_performance_status"
                    label="Patient performance status, Life expectancy, organ function and/or Lab parameter status"
                    value={values.target_population?.patient_performance_status || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="target_population.concomitant_meds_washout"
                    label="Concomitant meds / wash-out for existing therapies"
                    value={values.target_population?.concomitant_meds_washout || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="target_population.comorbidities_infections"
                    label="Comorbidities & infections"
                    value={values.target_population?.comorbidities_infections || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="target_population.reproductive_status_contraception"
                    label="Reproductive status & contraception"
                    value={values.target_population?.reproductive_status_contraception || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="target_population.eligibility_criteria"
                    label="Eligibility criteria which make patient eligible for any of the treatments"
                    value={values.target_population?.eligibility_criteria || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* Study Treatments Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                5. Study Treatments/Arms
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="study_treatments.regimen_arm_1"
                    label="Investigational Regimen/Arm 1, List agents, doses, regimen details"
                    value={values.study_treatments?.regimen_arm_1 || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="study_treatments.regimen_arm_2"
                    label="Investigational Regimen/Arm 2 (if applicable) List agents, doses and regimen details"
                    value={values.study_treatments?.regimen_arm_2 || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="study_treatments.regimen_arm_3"
                    label="Investigational Regimen/Arm 3 (if applicable) List agents, doses and regimen details"
                    value={values.study_treatments?.regimen_arm_3 || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="study_treatments.control_regimen"
                    label="Control Regimen/Arm 3 (if applicable) List agents, doses and regimen details"
                    value={values.study_treatments?.control_regimen || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="study_treatments.concomitant_medications_allowed"
                    label="Concomitant Medications Allowed"
                    value={values.study_treatments?.concomitant_medications_allowed || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="study_treatments.concomitant_medications_prohibited"
                    label="Concomitant Medications Prohibited"
                    value={values.study_treatments?.concomitant_medications_prohibited || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="study_treatments.fda_pregnancy_risk_categories"
                    label="FDA pregnancy risk categories (A, B, C, D, and X) for all drugs in the study"
                    value={values.study_treatments?.fda_pregnancy_risk_categories || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* Discontinuation Rules Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                6. Discontinuation of Trial Intervention and Participant Withdrawal from Trial
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="discontinuation_rules.trial_intervention_discontinuation"
                    label="List decision points for Discontinuation of Trial Intervention (including permanent discontinuation, temporary discontinuation, rechallange)"
                    value={values.discontinuation_rules?.trial_intervention_discontinuation || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="discontinuation_rules.participant_withdrawal"
                    label="List if there are any specific requests regarding Participant Withdrawal from the Trial, Lost to Follow-Up, Trial Stopping Rules"
                    value={values.discontinuation_rules?.participant_withdrawal || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* Study Assessments and Procedures Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                7. Study Assessments and Procedures
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="study_assessments.screening_baseline"
                    label="Screening/Baseline Assessments and Procedures (List any assessments and procedures that are unique to screening/baseline)"
                    value={values.study_assessments?.screening_baseline || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="study_assessments.efficacy_assessments"
                    label="Efficacy Assessments and Procedures (List based on endpoints and standard expectation)"
                    value={values.study_assessments?.efficacy_assessments || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="study_assessments.safety_assessments.standard_procedures"
                    label="Safety Assessments and Procedures (List standard procedure and modify if there are specific instructions)"
                    value={values.study_assessments?.safety_assessments?.standard_procedures || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="study_assessments.safety_assessments.adverse_events_special_interest"
                    label="Adverse Events of Special Interest (AESI)"
                    value={values.study_assessments?.safety_assessments?.adverse_events_special_interest || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="study_assessments.safety_assessments.ae_sae_collection_period"
                    label="Time Period and Frequency for Collecting AE and SAE Information"
                    value={values.study_assessments?.safety_assessments?.ae_sae_collection_period || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="study_assessments.safety_assessments.disease_related_events"
                    label="Disease-related Events or Outcomes Not Qualifying as AEs or SAEs"
                    value={values.study_assessments?.safety_assessments?.disease_related_events || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="study_assessments.pharmacokinetics"
                    label="Pharmacokinetics (specify if PK samples will be collected and details about methodology)"
                    value={values.study_assessments?.pharmacokinetics || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="study_assessments.genetics"
                    label="Genetics (Include any specific assessments planned)"
                    value={values.study_assessments?.genetics || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="study_assessments.biomarkers"
                    label="Biomarkers (Include any specific assessments planned)"
                    value={values.study_assessments?.biomarkers || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="study_assessments.immunogenicity"
                    label="Immunogenicity (Include any specific assessments planned)"
                    value={values.study_assessments?.immunogenicity || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="study_assessments.medical_resource_utilization"
                    label="Medical Resource Utilisation and Health Economics (Include any specific assessments planned)"
                    value={values.study_assessments?.medical_resource_utilization || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="study_assessments.survival_follow_up"
                    label="Survival Follow Up (List duration, method and frequency of follow up)"
                    value={values.study_assessments?.survival_follow_up || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* Statistical Considerations Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                8. Statistical Considerations
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="statistical_considerations.analysis_sets"
                    label="Analysis Sets (Add details only if non standard definitions)"
                    value={values.statistical_considerations?.analysis_sets || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="statistical_considerations.primary_objective_analysis"
                    label="Analyses Supporting Primary Objective(s) (Statistical Model, Hypothesis, Method of Analysis, Handling of Intercurrent Events, Missing Data, Sensitivity Analysis)"
                    value={values.statistical_considerations?.primary_objective_analysis || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="statistical_considerations.secondary_objective_analysis"
                    label="Analysis Supporting Secondary Objective(s)"
                    value={values.statistical_considerations?.secondary_objective_analysis || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="statistical_considerations.exploratory_analysis"
                    label="Analysis of Exploratory Objective(s)"
                    value={values.statistical_considerations?.exploratory_analysis || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="statistical_considerations.safety_analysis"
                    label="Safety Analyses"
                    value={values.statistical_considerations?.safety_analysis || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="statistical_considerations.other_analyses"
                    label="Other Analyses"
                    value={values.statistical_considerations?.other_analyses || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="statistical_considerations.interim_analyses"
                    label="Interim Analyses (List if planned, analysis times and underlying factors)"
                    value={values.statistical_considerations?.interim_analyses || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="statistical_considerations.sample_size_determination"
                    label="Sample Size Determination (List sample size and assumptions)"
                    value={values.statistical_considerations?.sample_size_determination || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* Regulatory and Ethical Requirements Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                9. Regulatory and Ethical Requirements and Trial Oversight
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="regulatory_requirements.committees"
                    label="List committees to be used in the study (e.g. Dose Escalation Committee, Data Monitoring Committee, etc.)"
                    value={values.regulatory_requirements?.committees || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="regulatory_requirements.informed_consent_process"
                    label="Informed consent process (list if any unusual circumstances apply)"
                    value={values.regulatory_requirements?.informed_consent_process || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* Quality Assurance Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                10. General Considerations: Risk Management and Quality Assurance
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="regulatory_requirements.quality_tolerance_limits"
                    label="Quality tolerance limits"
                    value={values.regulatory_requirements?.quality_tolerance_limits || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="regulatory_requirements.data_quality_assurance"
                    label="Data quality assurance"
                    value={values.regulatory_requirements?.data_quality_assurance || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="regulatory_requirements.source_data"
                    label="Source data"
                    value={values.regulatory_requirements?.source_data || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* Appendices Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                11. List of Appendices
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="appendices"
                    label="List Potential appendices to be added (e.g. AE assessment, Country specific language, prior protocol amendments, Glossary of terms, References etc.)"
                    value={values.appendices || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* Additional Comments Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                12. Additional Comments
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="additional_comments"
                    label="List anything else the protocol writer should know"
                    value={values.additional_comments || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Submit Button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Submit'}
              </Button>
            </Box>
          </Form>
        )}
      </Formik>

      {/* Success Alert */}
      <Snackbar
        open={showSuccessAlert}
        autoHideDuration={2000}
        onClose={() => setShowSuccessAlert(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowSuccessAlert(false)} 
          severity="success"
          sx={{ width: '100%' }}
        >
          Form submitted successfully! Redirecting...
        </Alert>
      </Snackbar>

      {/* Error Alert */}
      <Snackbar
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={() => setErrorMessage('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setErrorMessage('')} 
          severity="error"
          sx={{ width: '100%' }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ClinicalIntakeForm;
