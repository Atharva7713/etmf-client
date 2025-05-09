import React, { useState } from 'react';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Grid,
  TextField,
  Button,
  MenuItem,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  IconButton,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  //ListItemSecondaryAction,
} from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon, CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import axios from 'axios';
import API_ENDPOINTS from '../../config/api';

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
    randomization: Yup.boolean().required('Required'),
    blinding: Yup.string().required('Required'),
    number_of_study_parts: Yup.string(),
    stratification_factors: Yup.string(),
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
    concomitant_meds_washout: Yup.string(),
    comorbidities_infections: Yup.string(),
    reproductive_status_contraception: Yup.string(),
    eligibility_criteria: Yup.string(),
  }),
  study_treatments: Yup.object({
    regimen_arm_1: Yup.string(),
    regimen_arm_2: Yup.string(),
    regimen_arm_3: Yup.string(),
    concomitant_medications_allowed: Yup.string(),
    concomitant_medications_prohibited: Yup.string(),
  }),
  study_endpoints: Yup.object({
    primary_endpoints: Yup.array().of(Yup.string()),
    secondary_endpoints: Yup.array().of(Yup.string()),
    exploratory_endpoints: Yup.array().of(Yup.string()),
  }),
  study_design_details: Yup.object({
    number_of_arms: Yup.string(),
    stratification_factors: Yup.string(),
    study_duration: Yup.object({
      screening_period: Yup.string(),
      treatment_period: Yup.string(),
      follow_up_period: Yup.string(),
    }),
    sample_size: Yup.string(),
    number_of_sites: Yup.string(),
  }),
  study_assessments: Yup.object({
    efficacy_assessments: Yup.array().of(Yup.string()),
    safety_assessments: Yup.object({
      adverse_event_monitoring: Yup.string(),
      laboratory_tests: Yup.string(),
      vital_signs: Yup.string(),
    }),
    survival_analysis: Yup.object({
      overall_survival: Yup.string(),
      progression_free_survival: Yup.string(),
    }),
  }),
  statistical_considerations: Yup.object({
    statistical_hypothesis: Yup.string(),
    sample_size_justification: Yup.string(),
    interim_analysis_planned: Yup.boolean(),
    handling_of_missing_data: Yup.string(),
  }),
  regulatory_requirements: Yup.object({
    countries_for_submission: Yup.array().of(Yup.string()),
    planned_start_date: Yup.string(),
    irb_approvals_required: Yup.boolean(),
    informed_consent_required: Yup.boolean(),
  }),
  study_monitoring: Yup.object({
    data_collection_method: Yup.string(),
    monitoring_frequency: Yup.string(),
    monitoring_type: Yup.string(),
    key_contacts: Yup.object({
      sponsor_contact: Yup.string(),
      cro_contact: Yup.string(),
    }),
  }),
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
      randomization: false,
      blinding: '',
      number_of_study_parts: '',
      stratification_factors: '',
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
      concomitant_meds_washout: '',
      comorbidities_infections: '',
      reproductive_status_contraception: '',
      eligibility_criteria: '',
    },
    study_treatments: {
      regimen_arm_1: '',
      regimen_arm_2: '',
      regimen_arm_3: '',
      concomitant_medications_allowed: '',
      concomitant_medications_prohibited: '',
    },
    study_endpoints: {
      primary_endpoints: [''],
      secondary_endpoints: [''],
      exploratory_endpoints: [''],
    },
    study_design_details: {
      number_of_arms: '',
      stratification_factors: '',
      study_duration: {
        screening_period: '',
        treatment_period: '',
        follow_up_period: '',
      },
      sample_size: '',
      number_of_sites: '',
    },
    study_assessments: {
      efficacy_assessments: [''],
      safety_assessments: {
        adverse_event_monitoring: '',
        laboratory_tests: '',
        vital_signs: '',
      },
      survival_analysis: {
        overall_survival: '',
        progression_free_survival: '',
      },
    },
    statistical_considerations: {
      statistical_hypothesis: '',
      sample_size_justification: '',
      interim_analysis_planned: false,
      handling_of_missing_data: '',
    },
    regulatory_requirements: {
      countries_for_submission: [''],
      planned_start_date: '',
      irb_approvals_required: true,
      informed_consent_required: true,
    },
    study_monitoring: {
      data_collection_method: 'Electronic Data Capture (EDC)',
      monitoring_frequency: '',
      monitoring_type: 'On-Site',
      key_contacts: {
        sponsor_contact: '',
        cro_contact: '',
      },
    },
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
      uploaded_files: {
        investigator_brochure: [],
        label: [],
        additional_reports: [],
        pharmacy_manual: [],
        risk_management_guidelines: [],
        user_defined: [],
        study_design_outline: [],
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

// Component function
const ClinicalIntakeForm = ({ onSubmit, initialData }) => {
 // const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isParsing, setIsParsing] = useState(false);

  // Merge initialData with default values
  const startingValues = getInitialValues(initialData);

  const handleSubmit = (values, { setSubmitting }) => {
    console.log('Submitting form with values:', values); // Debug log
    onSubmit(values);
    setSubmitting(false);
  };

  const handleFileUpload = async (file, documentType, setFieldValue, values) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);

    try {
      const response = await axios.post(API_ENDPOINTS.documents.upload, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        const fileInfo = {
          filename: response.data.file.filename,
          originalname: file.name,
          documentType: documentType
        };
        setUploadedFiles(prev => [...prev, fileInfo]);
        const updatedFiles = [...values.document_uploads.uploaded_files[documentType], response.data.file];
        setFieldValue(`document_uploads.uploaded_files.${documentType}`, updatedFiles);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(`Error uploading file: ${error.response?.data?.details || error.message}`);
    }
  };

  const handleDoneWithUploading = async (setFieldValue, values) => {
    if (uploadedFiles.length === 0) {
      alert('Please upload at least one document before proceeding.');
      return;
    }

    setIsParsing(true);
    try {
      // Format the files array to include only necessary information
      const formattedFiles = uploadedFiles.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        documentType: file.documentType
      }));

      console.log('Sending files for parsing:', formattedFiles);
      
      // Create form fields structure
      const formFields = {
        study_identification: Object.keys(values.study_identification),
        study_overview: Object.keys(values.study_overview),
        endpoints_objectives: Object.keys(values.endpoints_objectives),
        target_population: Object.keys(values.target_population),
        study_treatments: Object.keys(values.study_treatments)
      };
      
      console.log('Form fields structure:', formFields);

      const response = await axios.post(API_ENDPOINTS.ai.parseDocuments, {
        files: formattedFiles,
        formFields
      });

      if (response.data.success) {
        // Update form values with parsed data
        Object.entries(response.data.parsedData).forEach(([section, fields]) => {
          Object.entries(fields).forEach(([field, value]) => {
            setFieldValue(`${section}.${field}`, value || 'Not Provided');
          });
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
    <Formik
      initialValues={startingValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting, setFieldValue }) => (
        <Form onSubmit={handleSubmit}>
          {/* Document Upload Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Document Upload Section
            </Typography>
            
            {/* Primary Documents */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                1. Primary Documents
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="document_uploads.primary_documents.investigator_brochure"
                        checked={values.document_uploads.primary_documents.investigator_brochure}
                        onChange={handleChange}
                      />
                    }
                    label="Investigator Brochure"
                  />
                  {values.document_uploads.primary_documents.investigator_brochure && (
                    <Box sx={{ ml: 4 }}>
                      <input
                        type="file"
                        multiple
                        onChange={(e) => {
                          Array.from(e.target.files).forEach(file => {
                            handleFileUpload(file, 'investigator_brochure', setFieldValue, values);
                          });
                        }}
                        style={{ display: 'none' }}
                        id="investigator-brochure-upload"
                      />
                      <label htmlFor="investigator-brochure-upload">
                        <Button
                          variant="outlined"
                          component="span"
                          startIcon={<CloudUploadIcon />}
                        >
                          Upload Files
                        </Button>
                      </label>
                      <List>
                        {values.document_uploads.uploaded_files.investigator_brochure.map((file, index) => (
                          <ListItem key={index}>
                            <ListItemText primary={file.name} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="document_uploads.primary_documents.label"
                        checked={values.document_uploads.primary_documents.label}
                        onChange={handleChange}
                      />
                    }
                    label="Label"
                  />
                  {values.document_uploads.primary_documents.label && (
                    <Box sx={{ ml: 4 }}>
                      <input
                        type="file"
                        multiple
                        onChange={(e) => {
                          Array.from(e.target.files).forEach(file => {
                            handleFileUpload(file, 'label', setFieldValue, values);
                          });
                        }}
                        style={{ display: 'none' }}
                        id="label-upload"
                      />
                      <label htmlFor="label-upload">
                        <Button
                          variant="outlined"
                          component="span"
                          startIcon={<CloudUploadIcon />}
                        >
                          Upload Files
                        </Button>
                      </label>
                      <List>
                        {values.document_uploads.uploaded_files.label.map((file, index) => (
                          <ListItem key={index}>
                            <ListItemText primary={file.name} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="document_uploads.primary_documents.additional_reports"
                        checked={values.document_uploads.primary_documents.additional_reports}
                        onChange={handleChange}
                      />
                    }
                    label="Additional Safety/Efficacy Reports"
                  />
                  {values.document_uploads.primary_documents.additional_reports && (
                    <Box sx={{ ml: 4 }}>
                      <input
                        type="file"
                        multiple
                        onChange={(e) => {
                          Array.from(e.target.files).forEach(file => {
                            handleFileUpload(file, 'additional_reports', setFieldValue, values);
                          });
                        }}
                        style={{ display: 'none' }}
                        id="additional-reports-upload"
                      />
                      <label htmlFor="additional-reports-upload">
                        <Button
                          variant="outlined"
                          component="span"
                          startIcon={<CloudUploadIcon />}
                        >
                          Upload Files
                        </Button>
                      </label>
                      <List>
                        {values.document_uploads.uploaded_files.additional_reports.map((file, index) => (
                          <ListItem key={index}>
                            <ListItemText primary={file.name} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Box>

            {/* Supporting Documents */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                2. Supporting Documents
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="document_uploads.supporting_documents.pharmacy_manual"
                        checked={values.document_uploads.supporting_documents.pharmacy_manual}
                        onChange={handleChange}
                      />
                    }
                    label="Pharmacy Manual"
                  />
                  {values.document_uploads.supporting_documents.pharmacy_manual && (
                    <Box sx={{ ml: 4 }}>
                      <input
                        type="file"
                        multiple
                        onChange={(e) => {
                          Array.from(e.target.files).forEach(file => {
                            handleFileUpload(file, 'pharmacy_manual', setFieldValue, values);
                          });
                        }}
                        style={{ display: 'none' }}
                        id="pharmacy-manual-upload"
                      />
                      <label htmlFor="pharmacy-manual-upload">
                        <Button
                          variant="outlined"
                          component="span"
                          startIcon={<CloudUploadIcon />}
                        >
                          Upload Files
                        </Button>
                      </label>
                      <List>
                        {values.document_uploads.uploaded_files.pharmacy_manual.map((file, index) => (
                          <ListItem key={index}>
                            <ListItemText primary={file.name} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="document_uploads.supporting_documents.risk_management_guidelines"
                        checked={values.document_uploads.supporting_documents.risk_management_guidelines}
                        onChange={handleChange}
                      />
                    }
                    label="Risk Management Guidelines"
                  />
                  {values.document_uploads.supporting_documents.risk_management_guidelines && (
                    <Box sx={{ ml: 4 }}>
                      <input
                        type="file"
                        multiple
                        onChange={(e) => {
                          Array.from(e.target.files).forEach(file => {
                            handleFileUpload(file, 'risk_management_guidelines', setFieldValue, values);
                          });
                        }}
                        style={{ display: 'none' }}
                        id="risk-management-upload"
                      />
                      <label htmlFor="risk-management-upload">
                        <Button
                          variant="outlined"
                          component="span"
                          startIcon={<CloudUploadIcon />}
                        >
                          Upload Files
                        </Button>
                      </label>
                      <List>
                        {values.document_uploads.uploaded_files.risk_management_guidelines.map((file, index) => (
                          <ListItem key={index}>
                            <ListItemText primary={file.name} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="document_uploads.supporting_documents.user_defined"
                        checked={values.document_uploads.supporting_documents.user_defined}
                        onChange={handleChange}
                      />
                    }
                    label="User Defined"
                  />
                  {values.document_uploads.supporting_documents.user_defined && (
                    <Box sx={{ ml: 4 }}>
                      <input
                        type="file"
                        multiple
                        onChange={(e) => {
                          Array.from(e.target.files).forEach(file => {
                            handleFileUpload(file, 'user_defined', setFieldValue, values);
                          });
                        }}
                        style={{ display: 'none' }}
                        id="user-defined-upload"
                      />
                      <label htmlFor="user-defined-upload">
                        <Button
                          variant="outlined"
                          component="span"
                          startIcon={<CloudUploadIcon />}
                        >
                          Upload Files
                        </Button>
                      </label>
                      <List>
                        {values.document_uploads.uploaded_files.user_defined.map((file, index) => (
                          <ListItem key={index}>
                            <ListItemText primary={file.name} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Box>

            {/* Study Design Outline */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                3. Study Design Outline
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="document_uploads.study_design_outline"
                        checked={values.document_uploads.study_design_outline}
                        onChange={handleChange}
                      />
                    }
                    label="Study Design Outline Document"
                  />
                  {values.document_uploads.study_design_outline && (
                    <Box sx={{ ml: 4 }}>
                      <input
                        type="file"
                        multiple
                        onChange={(e) => {
                          Array.from(e.target.files).forEach(file => {
                            handleFileUpload(file, 'study_design_outline', setFieldValue, values);
                          });
                        }}
                        style={{ display: 'none' }}
                        id="study-design-upload"
                      />
                      <label htmlFor="study-design-upload">
                        <Button
                          variant="outlined"
                          component="span"
                          startIcon={<CloudUploadIcon />}
                        >
                          Upload Files
                        </Button>
                      </label>
                      <List>
                        {values.document_uploads.uploaded_files.study_design_outline.map((file, index) => (
                          <ListItem key={index}>
                            <ListItemText primary={file.name} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Box>

            {uploadedFiles.length > 0 && (
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleDoneWithUploading(setFieldValue, values)}
                  disabled={isParsing}
                >
                  {isParsing ? 'Parsing Documents...' : 'Done with Uploading'}
                </Button>
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Study Identification Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              1. Study Identification
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
                >
                  
                </TextField>
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
                <FormControlLabel
                  control={
                    <Switch
                      name="study_overview.randomization"
                      checked={values.study_overview.randomization}
                      onChange={handleChange}
                    />
                  }
                  label="Randomization"
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
                >
                  
                </TextField>
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
                  rows={3}
                  name="target_population.conditions_related_to_primary_disease"
                  label="Conditions related to primary disease"
                  value={values.target_population.conditions_related_to_primary_disease}
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
                  rows={3}
                  name="target_population.tissue_sample_procedure_compliance"
                  label="Tissue sample or Procedure compliance requirements"
                  value={values.target_population.tissue_sample_procedure_compliance}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  name="target_population.patient_performance_status"
                  label="Patient performance status, Life expectancy, organ function and/or Lab parameter status"
                  value={values.target_population.patient_performance_status}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  name="target_population.concomitant_meds_washout"
                  label="Concomitant meds / wash-out for existing therapies"
                  value={values.target_population.concomitant_meds_washout}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  name="target_population.comorbidities_infections"
                  label="Comorbidities & infections"
                  value={values.target_population.comorbidities_infections}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  name="target_population.reproductive_status_contraception"
                  label="Reproductive status & contraception"
                  value={values.target_population.reproductive_status_contraception}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  name="target_population.eligibility_criteria"
                  label="Eligibility criteria which make patient eligible for any of the treatments"
                  value={values.target_population.eligibility_criteria}
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
                  rows={3}
                  name="study_treatments.regimen_arm_1"
                  label="Regimen/Arm 1"
                  value={values.study_treatments.regimen_arm_1}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  name="study_treatments.regimen_arm_2"
                  label="Regimen/Arm 2"
                  value={values.study_treatments.regimen_arm_2}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  name="study_treatments.regimen_arm_3"
                  label="Regimen/Arm 3"
                  value={values.study_treatments.regimen_arm_3}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  name="study_treatments.concomitant_medications_allowed"
                  label="Concomitant Medications Allowed"
                  value={values.study_treatments.concomitant_medications_allowed}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  name="study_treatments.concomitant_medications_prohibited"
                  label="Concomitant Medications Prohibited"
                  value={values.study_treatments.concomitant_medications_prohibited}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Study Endpoints Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              6. Study Endpoints
            </Typography>
            <Grid container spacing={3}>
              {/* Primary Endpoints */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Primary Endpoint(s)
                </Typography>
                <FieldArray name="study_endpoints.primary_endpoints">
                  {({ push, remove }) => (
                    <Box>
                      {values.study_endpoints.primary_endpoints.map((_, index) => (
                        <Box key={index} sx={{ display: 'flex', mb: 1 }}>
                          <TextField
                            fullWidth
                            name={`study_endpoints.primary_endpoints.${index}`}
                            label={`Endpoint ${index + 1}`}
                            value={values.study_endpoints.primary_endpoints[index]}
                            onChange={handleChange}
                            onBlur={handleBlur}
                          />
                          <IconButton onClick={() => remove(index)}>
                            <RemoveIcon />
                          </IconButton>
                        </Box>
                      ))}
                      <Button
                        startIcon={<AddIcon />}
                        onClick={() => push('')}
                      >
                        Add Primary Endpoint
                      </Button>
                    </Box>
                  )}
                </FieldArray>
              </Grid>
              
              {/* Secondary Endpoints */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Secondary Endpoint(s)
                </Typography>
                <FieldArray name="study_endpoints.secondary_endpoints">
                  {({ push, remove }) => (
                    <Box>
                      {values.study_endpoints.secondary_endpoints.map((_, index) => (
                        <Box key={index} sx={{ display: 'flex', mb: 1 }}>
                          <TextField
                            fullWidth
                            name={`study_endpoints.secondary_endpoints.${index}`}
                            label={`Endpoint ${index + 1}`}
                            value={values.study_endpoints.secondary_endpoints[index]}
                            onChange={handleChange}
                            onBlur={handleBlur}
                          />
                          <IconButton onClick={() => remove(index)}>
                            <RemoveIcon />
                          </IconButton>
                        </Box>
                      ))}
                      <Button
                        startIcon={<AddIcon />}
                        onClick={() => push('')}
                      >
                        Add Secondary Endpoint
                      </Button>
                    </Box>
                  )}
                </FieldArray>
              </Grid>
              
              {/* Exploratory Endpoints */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Exploratory Endpoint(s) (if applicable)
                </Typography>
                <FieldArray name="study_endpoints.exploratory_endpoints">
                  {({ push, remove }) => (
                    <Box>
                      {values.study_endpoints.exploratory_endpoints.map((_, index) => (
                        <Box key={index} sx={{ display: 'flex', mb: 1 }}>
                          <TextField
                            fullWidth
                            name={`study_endpoints.exploratory_endpoints.${index}`}
                            label={`Endpoint ${index + 1}`}
                            value={values.study_endpoints.exploratory_endpoints[index]}
                            onChange={handleChange}
                            onBlur={handleBlur}
                          />
                          <IconButton onClick={() => remove(index)}>
                            <RemoveIcon />
                          </IconButton>
                        </Box>
                      ))}
                      <Button
                        startIcon={<AddIcon />}
                        onClick={() => push('')}
                      >
                        Add Exploratory Endpoint
                      </Button>
                    </Box>
                  )}
                </FieldArray>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Study Design Details Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              7. Study Design Details
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="study_design_details.number_of_arms"
                  label="Number of Arms"
                  value={values.study_design_details.number_of_arms}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="study_design_details.stratification_factors"
                  label="Stratification Factors"
                  value={values.study_design_details.stratification_factors}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Study Duration
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  name="study_design_details.study_duration.screening_period"
                  label="Screening Period"
                  value={values.study_design_details.study_duration.screening_period}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  name="study_design_details.study_duration.treatment_period"
                  label="Treatment Period"
                  value={values.study_design_details.study_duration.treatment_period}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  name="study_design_details.study_duration.follow_up_period"
                  label="Follow-Up Period"
                  value={values.study_design_details.study_duration.follow_up_period}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="study_design_details.sample_size"
                  label="Sample Size (Total)"
                  value={values.study_design_details.sample_size}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="study_design_details.number_of_sites"
                  label="Number of Sites (Planned)"
                  value={values.study_design_details.number_of_sites}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Study Assessments Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              8. Study Assessments
            </Typography>
            <Grid container spacing={3}>
              {/* Efficacy Assessments */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Efficacy Assessments (e.g., imaging, biomarkers)
                </Typography>
                <FieldArray name="study_assessments.efficacy_assessments">
                  {({ push, remove }) => (
                    <Box>
                      {values.study_assessments.efficacy_assessments.map((_, index) => (
                        <Box key={index} sx={{ display: 'flex', mb: 1 }}>
                          <TextField
                            fullWidth
                            name={`study_assessments.efficacy_assessments.${index}`}
                            label={`Assessment ${index + 1}`}
                            value={values.study_assessments.efficacy_assessments[index]}
                            onChange={handleChange}
                            onBlur={handleBlur}
                          />
                          <IconButton onClick={() => remove(index)}>
                            <RemoveIcon />
                          </IconButton>
                        </Box>
                      ))}
                      <Button
                        startIcon={<AddIcon />}
                        onClick={() => push('')}
                      >
                        Add Efficacy Assessment
                      </Button>
                    </Box>
                  )}
                </FieldArray>
              </Grid>
              
              {/* Safety Assessments */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Safety Assessments
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="study_assessments.safety_assessments.adverse_event_monitoring"
                      label="Adverse Event Monitoring"
                      value={values.study_assessments.safety_assessments.adverse_event_monitoring}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      name="study_assessments.safety_assessments.laboratory_tests"
                      label="Laboratory Tests"
                      value={values.study_assessments.safety_assessments.laboratory_tests}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      name="study_assessments.safety_assessments.vital_signs"
                      label="Vital Signs"
                      value={values.study_assessments.safety_assessments.vital_signs}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </Grid>
                </Grid>
              </Grid>
              
              {/* Survival Analysis */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Survival Analysis (if applicable)
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      name="study_assessments.survival_analysis.overall_survival"
                      label="Overall Survival"
                      value={values.study_assessments.survival_analysis.overall_survival}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      name="study_assessments.survival_analysis.progression_free_survival"
                      label="Progression-Free Survival"
                      value={values.study_assessments.survival_analysis.progression_free_survival}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Statistical Considerations Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              9. Statistical Considerations
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  name="statistical_considerations.statistical_hypothesis"
                  label="Statistical Hypothesis"
                  value={values.statistical_considerations.statistical_hypothesis}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  name="statistical_considerations.sample_size_justification"
                  label="Sample Size Justification"
                  value={values.statistical_considerations.sample_size_justification}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      name="statistical_considerations.interim_analysis_planned"
                      checked={values.statistical_considerations.interim_analysis_planned}
                      onChange={handleChange}
                    />
                  }
                  label="Interim Analysis Planned"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="statistical_considerations.handling_of_missing_data"
                  label="Handling of Missing Data"
                  value={values.statistical_considerations.handling_of_missing_data}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Regulatory Requirements Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              10. Regulatory Requirements
            </Typography>
            <Grid container spacing={3}>
              {/* Countries for Submission */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Countries for Submission
                </Typography>
                <FieldArray name="regulatory_requirements.countries_for_submission">
                  {({ push, remove }) => (
                    <Box>
                      {values.regulatory_requirements.countries_for_submission.map((_, index) => (
                        <Box key={index} sx={{ display: 'flex', mb: 1 }}>
                          <TextField
                            fullWidth
                            name={`regulatory_requirements.countries_for_submission.${index}`}
                            label={`Country ${index + 1}`}
                            value={values.regulatory_requirements.countries_for_submission[index]}
                            onChange={handleChange}
                            onBlur={handleBlur}
                          />
                          <IconButton onClick={() => remove(index)}>
                            <RemoveIcon />
                          </IconButton>
                        </Box>
                      ))}
                      <Button
                        startIcon={<AddIcon />}
                        onClick={() => push('')}
                      >
                        Add Country
                      </Button>
                    </Box>
                  )}
                </FieldArray>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="regulatory_requirements.planned_start_date"
                  label="Planned Start Date"
                  value={values.regulatory_requirements.planned_start_date}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </Grid>
              <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <FormControlLabel
                  control={
                    <Switch
                      name="regulatory_requirements.irb_approvals_required"
                      checked={values.regulatory_requirements.irb_approvals_required}
                      onChange={handleChange}
                    />
                  }
                  label="IRB Approvals Required"
                />
                <FormControlLabel
                  control={
                    <Switch
                      name="regulatory_requirements.informed_consent_required"
                      checked={values.regulatory_requirements.informed_consent_required}
                      onChange={handleChange}
                    />
                  }
                  label="Informed Consent Required"
                />
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Study Monitoring Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              11. Study Monitoring
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  name="study_monitoring.data_collection_method"
                  label="Data Collection Method"
                  value={values.study_monitoring.data_collection_method}
                  onChange={handleChange}
                  onBlur={handleBlur}
                >
                  {['Electronic Data Capture (EDC)', 'Paper-Based CRF'].map((method) => (
                    <MenuItem key={method} value={method}>
                      {method}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="study_monitoring.monitoring_frequency"
                  label="Monitoring Frequency"
                  value={values.study_monitoring.monitoring_frequency}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  name="study_monitoring.monitoring_type"
                  label="Monitoring Type"
                  value={values.study_monitoring.monitoring_type}
                  onChange={handleChange}
                  onBlur={handleBlur}
                >
                  {['On-Site', 'Remote'].map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="study_monitoring.key_contacts.sponsor_contact"
                  label="Sponsor Contact"
                  value={values.study_monitoring.key_contacts.sponsor_contact}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="study_monitoring.key_contacts.cro_contact"
                  label="CRO Contact"
                  value={values.study_monitoring.key_contacts.cro_contact}
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
                  label="Additional Comments"
                  value={values.additional_comments}
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
              Submit
            </Button>
          </Box>
        </Form>
      )}
    </Formik>
  );
};

export default ClinicalIntakeForm;
