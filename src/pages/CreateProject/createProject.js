import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle,
  Trash2,
  Upload,
  Loader,
  ArrowLeft,
  FolderPlus
} from 'lucide-react';
import Swal from 'sweetalert2';
import './createProject.css';

// ==================== MOCK DATA ====================
const mockCompanies = [
  { id: 1, name: 'Palm Hills Developments' },
  { id: 2, name: 'Sodic' },
  { id: 3, name: 'Emaar Misr' }
];

const paymentFrequencyChoices = [
  { value: 'Monthly', label: 'Monthly' },
  { value: 'Quarterly', label: 'Quarterly' },
  { value: 'Semi-Annually', label: 'Semi-Annually' },
  { value: 'Annually', label: 'Annually' }
];

const paymentSchemeChoices = [
  { value: 'Flat', label: 'Flat' },
  { value: 'Flat Back Loaded', label: 'Flat Back Loaded' },
  { value: 'Bullet', label: 'Bullet' },
  { value: 'Bullet Back Loaded', label: 'Bullet Back Loaded' }
];

const schedulingChoices = [
  { value: 'at_delivery', label: 'At Delivery' },
  { value: 'before_delivery', label: 'Before Delivery' }
];

// ==================== MAIN COMPONENT ====================
export default function CreateProjectApp() {
  const [messages, setMessages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Form States
  const [projectData, setProjectData] = useState({
    company: '', name: '', description: ''
  });

  const [configData, setConfigData] = useState({
    interest_rate: '', default_scheme: 'Flat', base_dp: '', base_tenor_years: '',
    max_tenor_years: '', days_until_unblocking: '', variable_delivery_date: '',
    base_payment_frequency: 'Monthly', use_static_base_npv: false, maximum_requests_per_sales: ''
  });

  const [constraintsData, setConstraintsData] = useState({
    dp_min: '', dp_plus_first_pmt: '', dp_plus_first_plus_second_pmt: '',
    dp_plus_first_plus_second_plus_third_pmt: '', dp_plus_first_plus_second_plus_third_plus_forth_pmt: '',
    first_year_min: '', annual_min: '', max_discount: '', max_exception_discount: ''
  });

  const [baseNPVRows, setBaseNPVRows] = useState([{ term_period: '', npv_value: '', id: Date.now() }]);
  const [ctdRows, setCTDRows] = useState([{ term_period: '', npv_value: '', id: Date.now() }]);

  const [gasPolicyData, setGasPolicyData] = useState({
    is_applied: false, gas_num_pmts: '', scheduling: 'at_delivery'
  });
  const [gasPolicyFeesRows, setGasPolicyFeesRows] = useState([{ term_period: '', fee_amount: '', id: Date.now() }]);
  const [gasOffsetsRows, setGasOffsetsRows] = useState([{ term_period: '', offset_value: '', id: Date.now() }]);

  const [maintenancePolicyData, setMaintenancePolicyData] = useState({
    is_applied: false, split_two_one_on_delivery: false, maintenance_num_pmts: ''
  });
  const [maintenanceSchedulingRows, setMaintenanceSchedulingRows] = useState([{ term_period: '', scheduling: 'at_delivery', id: Date.now() }]);
  const [maintenanceOffsetsRows, setMaintenanceOffsetsRows] = useState([{ term_period: '', offset_value: '', id: Date.now() }]);

  const [masterplanFile, setMasterplanFile] = useState(null);
  const [masterplanFileName, setMasterplanFileName] = useState('');

  // Handlers
  const handleTableRowChange = (setter, index, field, value, rows) => {
    const newRows = [...rows];
    newRows[index][field] = value;
    setter(newRows);

    const lastRow = newRows[newRows.length - 1];
    const isLastRowFilled = Object.keys(lastRow).filter(key => key !== 'id').every(key => lastRow[key] !== '');

    if (isLastRowFilled) {
      setter([
        ...newRows,
        {
          ...Object.keys(lastRow).reduce((acc, key) => {
            acc[key] = key === 'id' ? Date.now() + Math.random() : (key === 'scheduling' ? 'at_delivery' : '');
            return acc;
          }, {})
        }
      ]);
    }
  };

  const handleDeleteRow = (setter, rows, index) => {
    if (rows.length > 1) {
      Swal.fire({
        title: 'Delete Row?',
        text: 'Are you sure you want to delete this row?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#f97316',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (result.isConfirmed) {
          setter(rows.filter((_, i) => i !== index));
          Swal.fire({
            title: 'Deleted!',
            text: 'Row has been deleted.',
            icon: 'success',
            confirmButtonColor: '#f97316',
            timer: 1500,
            showConfirmButton: false
          });
        }
      });
    }
  };

  const isDuplicateTerm = (rows, currentIndex, termValue) => {
    return rows.some((row, index) => index !== currentIndex && row.term_period === termValue && termValue !== '');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        Swal.fire({
          icon: 'error',
          title: 'File Too Large',
          text: 'Please upload a file smaller than 5MB',
          confirmButtonColor: '#f97316'
        });
        return;
      }
      if (!file.type.match('image.*')) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid File Type',
          text: 'Please upload an image file',
          confirmButtonColor: '#f97316'
        });
        return;
      }
      setMasterplanFile(file);
      setMasterplanFileName(file.name);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Clear previous messages
    setMessages([]);

    if (!projectData.company || !projectData.name) {
      setMessages([{ type: 'error', text: 'Company and Project Name are required fields' }]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Validate numeric fields
    const numericFields = [
      { value: configData.interest_rate, field: 'Interest Rate' },
      { value: configData.base_dp, field: 'Base DP' },
      { value: configData.base_tenor_years, field: 'Base Tenor Years' }
    ];

    for (const field of numericFields) {
      if (field.value && isNaN(parseFloat(field.value))) {
        setMessages([{ type: 'error', text: `${field.field} must be a valid number` }]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      const submissionData = {
        project: projectData,
        config: configData,
        constraints: constraintsData,
        baseNPV: baseNPVRows.filter(row => row.term_period && row.npv_value),
        ctd: ctdRows.filter(row => row.term_period && row.npv_value),
        gasPolicy: {
          ...gasPolicyData,
          fees: gasPolicyFeesRows.filter(row => row.term_period && row.fee_amount),
          offsets: gasOffsetsRows.filter(row => row.term_period && row.offset_value)
        },
        maintenancePolicy: {
          ...maintenancePolicyData,
          scheduling: maintenanceSchedulingRows.filter(row => row.term_period),
          offsets: maintenanceOffsetsRows.filter(row => row.term_period && row.offset_value)
        },
        masterplan: masterplanFile
      };

      console.log('Project Created:', submissionData);

      setMessages([{
        type: 'success',
        text: `Project "${projectData.name}" has been created successfully!`
      }]);

      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Show success message
      Swal.fire({
        title: 'Success!',
        text: `Project "${projectData.name}" has been created.`,
        icon: 'success',
        confirmButtonColor: '#f97316',
        confirmButtonText: 'Continue'
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen">
      <div className="create-project-container">

        {/* UPDATED TOP PART ONLY */}
        <div className="page-header-card">
          <div className="page-header-left">
            <div className="page-header-icon">
              <FolderPlus size={24} />
            </div>
            <h1 className="page-header-title">Create Project</h1>
          </div>

          <button
            type="button"
            className="page-back-btn"
            onClick={() => navigate('/manage-projects')}
          >
            <ArrowLeft size={18} />
            Back
          </button>
        </div>

        {/* Messages Display */}
        {messages.length > 0 && (
          <div className="messages">
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.type}`}>
                {message.type === 'success' ? (
                  <CheckCircle size={20} />
                ) : (
                  <AlertCircle size={20} />
                )}
                <span>{message.text}</span>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Project Details */}
          <section className="form-section">
            <h2>Project Details</h2>
            <div className="form-fields-horizontal">
              <div className="form-field-group">
                <label className="required">Company</label>
                <select
                  value={projectData.company}
                  onChange={(e) => setProjectData({ ...projectData, company: e.target.value })}
                  required
                >
                  <option value="">Select Company</option>
                  {mockCompanies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-field-group">
                <label className="required">Project Name</label>
                <input
                  type="text"
                  value={projectData.name}
                  onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
                  placeholder="Enter project name"
                  required
                />
              </div>

              <div className="form-field-group">
                <label>Description</label>
                <textarea
                  value={projectData.description}
                  onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
                  placeholder="Enter project description"
                  rows={3}
                />
                <small>Provide a brief description of the project</small>
              </div>
            </div>
          </section>

          {/* Project Configuration */}
          <section className="form-section">
            <h2>Project Configuration</h2>
            <div className="form-fields-horizontal">
              <div className="form-field-group">
                <label>Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.00001"
                  value={configData.interest_rate}
                  onChange={(e) => setConfigData({ ...configData, interest_rate: e.target.value })}
                  placeholder="0.00000"
                />
              </div>

              <div className="form-field-group">
                <label>Down Payment</label>
                <input
                  type="number"
                  step="0.00001"
                  value={configData.base_dp}
                  onChange={(e) => setConfigData({ ...configData, base_dp: e.target.value })}
                  placeholder="0.00000"
                />
              </div>

              <div className="form-field-group">
                <label>Base Tenor Years</label>
                <input
                  type="number"
                  value={configData.base_tenor_years}
                  onChange={(e) => setConfigData({ ...configData, base_tenor_years: e.target.value })}
                  placeholder="Enter years"
                />
              </div>

              <div className="form-field-group">
                <label>Max Tenor Years</label>
                <input
                  type="number"
                  value={configData.max_tenor_years}
                  onChange={(e) => setConfigData({ ...configData, max_tenor_years: e.target.value })}
                  placeholder="Enter years"
                />
              </div>

              <div className="form-field-group">
                <label>Months of Delivery After Reservation </label>
                <input
                  type="number"
                  value={configData.days_until_unblocking}
                  onChange={(e) => setConfigData({ ...configData, days_until_unblocking: e.target.value })}
                  placeholder="Enter days"
                />
              </div>

              <div className="form-field-group">
                <label>Max Requests per Sales</label>
                <input
                  type="number"
                  value={configData.maximum_requests_per_sales}
                  onChange={(e) => setConfigData({ ...configData, maximum_requests_per_sales: e.target.value })}
                  placeholder="Enter number"
                />
              </div>

              <div className="form-field-group">
                <label>Default Scheme</label>
                <select
                  className="default-scheme"
                  value={configData.default_scheme}
                  onChange={(e) => setConfigData({ ...configData, default_scheme: e.target.value })}
                >
                  {paymentSchemeChoices.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-field-group">
                <label>Payment Frequency</label>
                <select
                  className="payment-freq"
                  value={configData.base_payment_frequency}
                  onChange={(e) => setConfigData({ ...configData, base_payment_frequency: e.target.value })}
                >
                  {paymentFrequencyChoices.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-field-group special-form">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={configData.use_static_base_npv}
                    onChange={(e) => setConfigData({ ...configData, use_static_base_npv: e.target.checked })}
                  />
                  Use Static Base NPV
                </label>
                <small>Enable if you want to define custom base NPV values</small>
              </div>
            </div>
          </section>

          {/* Base NPV - Conditionally Rendered */}
          {configData.use_static_base_npv && (
            <section className="form-section">
              <h2>Base NPV Values</h2>
              <table className="dynamic-table">
                <thead>
                  <tr>
                    <th>YTD</th>
                    <th>NPV Value</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {baseNPVRows.map((row, i) => (
                    <tr key={row.id}>
                      <td>
                        <input
                          type="number"
                          step="0.0001"
                          value={row.term_period}
                          onChange={(e) => {
                            if (isDuplicateTerm(baseNPVRows, i, e.target.value)) {
                              Swal.fire({
                                icon: 'warning',
                                title: 'Duplicate Entry',
                                text: 'This Years till Delivery already exists.',
                                confirmButtonColor: '#f97316',
                                timer: 2000,
                                showConfirmButton: false
                              });
                              return;
                            }
                            handleTableRowChange(setBaseNPVRows, i, 'term_period', e.target.value, baseNPVRows);
                          }}
                          placeholder="YTD"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.0001"
                          value={row.npv_value}
                          onChange={(e) => handleTableRowChange(setBaseNPVRows, i, 'npv_value', e.target.value, baseNPVRows)}
                          placeholder="NPV Value"
                        />
                      </td>
                      <td>
                        {baseNPVRows.length > 1 && (
                          <button
                            type="button"
                            className="delete-row-btn"
                            onClick={() => handleDeleteRow(setBaseNPVRows, baseNPVRows, i)}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* Constraints */}
          <section className="form-section">
            <h2>Project Constraints</h2>
            <div className="form-fields-horizontal">
              <div className="form-field-group">
                <label>Minimum DP</label>
                <input
                  type="number"
                  step="0.00001"
                  value={constraintsData.dp_min}
                  onChange={(e) => setConstraintsData({ ...constraintsData, dp_min: e.target.value })}
                  placeholder="0.00000"
                />
              </div>

              <div className="form-field-group">
                <label>Max Discount (%)</label>
                <input
                  type="number"
                  step="0.00001"
                  value={constraintsData.max_discount}
                  onChange={(e) => setConstraintsData({ ...constraintsData, max_discount: e.target.value })}
                  placeholder="0.00000"
                />
              </div>

              <div className="form-field-group">
                <label>Max Exception Discount (%)</label>
                <input
                  type="number"
                  step="0.00001"
                  value={constraintsData.max_exception_discount}
                  onChange={(e) => setConstraintsData({ ...constraintsData, max_exception_discount: e.target.value })}
                  placeholder="0.00000"
                />
              </div>
            </div>
            <small>All constraint values are optional. Enter percentages as decimal values.</small>
          </section>

          {/* Masterplan */}
          <section className="form-section">
            <h2>Project Masterplan</h2>
            <div className="form-fields-horizontal">
              <div className="form-field-group">
                <label>Masterplan Layout</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ padding: '0.75rem 1rem' }}
                  />
                  {masterplanFileName && (
                    <div style={{
                      marginTop: '0.5rem',
                      padding: '0.5rem',
                      backgroundColor: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      color: '#374151'
                    }}>
                      <span style={{ fontWeight: 500 }}>Selected file:</span> {masterplanFileName}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <small>
              <Upload size={14} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
              Optional: Upload a masterplan image (JPG, PNG, GIF, max 5MB) to enable unit positioning
            </small>
          </section>

          {/* CTD */}
          <section className="form-section">
            <h2>CTD Values</h2>
            <table className="dynamic-table">
              <thead>
                <tr>
                  <th>YTD</th>
                  <th>CTD Value</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {ctdRows.map((row, i) => (
                  <tr key={row.id}>
                    <td>
                      <input
                        type="number"
                        step="0.0001"
                        value={row.term_period}
                        onChange={(e) => {
                          if (isDuplicateTerm(ctdRows, i, e.target.value)) {
                            Swal.fire({
                              icon: 'warning',
                              title: 'Duplicate Entry',
                              text: 'This Years till Delivery already exists.',
                              confirmButtonColor: '#f97316',
                              timer: 2000,
                              showConfirmButton: false
                            });
                            return;
                          }
                          handleTableRowChange(setCTDRows, i, 'term_period', e.target.value, ctdRows);
                        }}
                        placeholder="YTD"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.0001"
                        value={row.npv_value}
                        onChange={(e) => handleTableRowChange(setCTDRows, i, 'npv_value', e.target.value, ctdRows)}
                        placeholder="CTD Value"
                      />
                    </td>
                    <td>
                      {ctdRows.length > 1 && (
                        <button
                          type="button"
                          className="delete-row-btn"
                          onClick={() => handleDeleteRow(setCTDRows, ctdRows, i)}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <small>CTD (Cost to Deliver) values for different time periods</small>
          </section>

          {/* Gas Policy */}
          <section className="form-section">
            <h2>Gas Policy</h2>
            <div className="form-fields-horizontal">
              <div className="form-field-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={gasPolicyData.is_applied}
                    onChange={(e) => setGasPolicyData({ ...gasPolicyData, is_applied: e.target.checked })}
                  />
                  Apply Gas Policy
                </label>
              </div>

              <div className="form-field-group">
                <label>Number of Payments</label>
                <input
                  type="number"
                  value={gasPolicyData.gas_num_pmts}
                  onChange={(e) => setGasPolicyData({ ...gasPolicyData, gas_num_pmts: e.target.value })}
                  placeholder="Enter number"
                  disabled={!gasPolicyData.is_applied}
                />
                <small><em>In case of before_delivery scheduling</em></small>
              </div>

              <div className="form-field-group">
                <label>Scheduling</label>
                <select
                  value={gasPolicyData.scheduling}
                  onChange={(e) => setGasPolicyData({ ...gasPolicyData, scheduling: e.target.value })}
                  disabled={!gasPolicyData.is_applied}
                >
                  {schedulingChoices.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Gas Policy Fees - Conditionally Rendered */}
          {gasPolicyData.is_applied && (
            <>
              <section className="form-section">
                <h2>Gas Policy Fees</h2>
                <table className="dynamic-table">
                  <thead>
                    <tr>
                      <th>YTD</th>
                      <th>Fee Amount</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gasPolicyFeesRows.map((row, i) => (
                      <tr key={row.id}>
                        <td>
                          <input
                            type="number"
                            step="0.0001"
                            value={row.term_period}
                            onChange={(e) => {
                              if (isDuplicateTerm(gasPolicyFeesRows, i, e.target.value)) {
                                Swal.fire({
                                  icon: 'warning',
                                  title: 'Duplicate Entry',
                                  text: 'This Years till Delivery already exists.',
                                  confirmButtonColor: '#f97316',
                                  timer: 2000,
                                  showConfirmButton: false
                                });
                                return;
                              }
                              handleTableRowChange(setGasPolicyFeesRows, i, 'term_period', e.target.value, gasPolicyFeesRows);
                            }}
                            placeholder="YTD"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.0001"
                            value={row.fee_amount}
                            onChange={(e) => handleTableRowChange(setGasPolicyFeesRows, i, 'fee_amount', e.target.value, gasPolicyFeesRows)}
                            placeholder="Gas Fees"
                          />
                        </td>
                        <td>
                          {gasPolicyFeesRows.length > 1 && (
                            <button
                              type="button"
                              className="delete-row-btn"
                              onClick={() => handleDeleteRow(setGasPolicyFeesRows, gasPolicyFeesRows, i)}
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <section className="form-section">
                <h2>Gas Fees Offsets</h2>
                <table className="dynamic-table">
                  <thead>
                    <tr>
                      <th>YTD</th>
                      <th>Offsets</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gasOffsetsRows.map((row, i) => (
                      <tr key={row.id}>
                        <td>
                          <input
                            type="number"
                            step="0.0001"
                            value={row.term_period}
                            onChange={(e) => {
                              if (isDuplicateTerm(gasOffsetsRows, i, e.target.value)) {
                                Swal.fire({
                                  icon: 'warning',
                                  title: 'Duplicate Entry',
                                  text: 'This Years till Delivery already exists.',
                                  confirmButtonColor: '#f97316',
                                  timer: 2000,
                                  showConfirmButton: false
                                });
                                return;
                              }
                              handleTableRowChange(setGasOffsetsRows, i, 'term_period', e.target.value, gasOffsetsRows);
                            }}
                            placeholder="YTD"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.0001"
                            value={row.offset_value}
                            onChange={(e) => handleTableRowChange(setGasOffsetsRows, i, 'offset_value', e.target.value, gasOffsetsRows)}
                            placeholder="Offset"
                          />
                        </td>
                        <td>
                          {gasOffsetsRows.length > 1 && (
                            <button
                              type="button"
                              className="delete-row-btn"
                              onClick={() => handleDeleteRow(setGasOffsetsRows, gasOffsetsRows, i)}
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            </>
          )}

          {/* Maintenance Policy */}
          <section className="form-section">
            <h2>Maintenance Policy</h2>
            <div className="form-fields-horizontal">
              <div className="form-field-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={maintenancePolicyData.is_applied}
                    onChange={(e) => setMaintenancePolicyData({ ...maintenancePolicyData, is_applied: e.target.checked })}
                  />
                  Apply Maintenance Policy
                </label>
              </div>

              <div className="form-field-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={maintenancePolicyData.split_two_one_on_delivery}
                    onChange={(e) => setMaintenancePolicyData({ ...maintenancePolicyData, split_two_one_on_delivery: e.target.checked })}
                    disabled={!maintenancePolicyData.is_applied}
                  />
                  Split 2 Payments (Before & At Delivery)
                </label>
              </div>

              <div className="form-field-group">
                <label>Number of Payments</label>
                <input
                  type="number"
                  value={maintenancePolicyData.maintenance_num_pmts}
                  onChange={(e) => setMaintenancePolicyData({ ...maintenancePolicyData, maintenance_num_pmts: e.target.value })}
                  placeholder="Enter number"
                  disabled={!maintenancePolicyData.is_applied}
                />
              </div>
            </div>
          </section>

          {/* Maintenance Scheduling - Conditionally Rendered */}
          {maintenancePolicyData.is_applied && (
            <>
              <section className="form-section">
                <h2>Maintenance Policy Scheduling</h2>
                <table className="dynamic-table">
                  <thead>
                    <tr>
                      <th>YTD</th>
                      <th>Scheduling</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenanceSchedulingRows.map((row, i) => (
                      <tr key={row.id}>
                        <td>
                          <input
                            type="number"
                            step="0.0001"
                            value={row.term_period}
                            onChange={(e) => {
                              if (isDuplicateTerm(maintenanceSchedulingRows, i, e.target.value)) {
                                Swal.fire({
                                  icon: 'warning',
                                  title: 'Duplicate Entry',
                                  text: 'This Years till Delivery already exists.',
                                  confirmButtonColor: '#f97316',
                                  timer: 2000,
                                  showConfirmButton: false
                                });
                                return;
                              }
                              handleTableRowChange(setMaintenanceSchedulingRows, i, 'term_period', e.target.value, maintenanceSchedulingRows);
                            }}
                            placeholder="YTD"
                          />
                        </td>
                        <td>
                          <select
                            value={row.scheduling}
                            onChange={(e) => handleTableRowChange(setMaintenanceSchedulingRows, i, 'scheduling', e.target.value, maintenanceSchedulingRows)}
                          >
                            {schedulingChoices.map(s => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          {maintenanceSchedulingRows.length > 1 && (
                            <button
                              type="button"
                              className="delete-row-btn"
                              onClick={() => handleDeleteRow(setMaintenanceSchedulingRows, maintenanceSchedulingRows, i)}
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <section className="form-section">
                <h2>Maintenance Fees Offsets</h2>
                <table className="dynamic-table">
                  <thead>
                    <tr>
                      <th>YTD</th>
                      <th>Offsets</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenanceOffsetsRows.map((row, i) => (
                      <tr key={row.id}>
                        <td>
                          <input
                            type="number"
                            step="0.0001"
                            value={row.term_period}
                            onChange={(e) => {
                              if (isDuplicateTerm(maintenanceOffsetsRows, i, e.target.value)) {
                                Swal.fire({
                                  icon: 'warning',
                                  title: 'Duplicate Entry',
                                  text: 'This Years till Delivery already exists.',
                                  confirmButtonColor: '#f97316',
                                  timer: 2000,
                                  showConfirmButton: false
                                });
                                return;
                              }
                              handleTableRowChange(setMaintenanceOffsetsRows, i, 'term_period', e.target.value, maintenanceOffsetsRows);
                            }}
                            placeholder="YTD"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.0001"
                            value={row.offset_value}
                            onChange={(e) => handleTableRowChange(setMaintenanceOffsetsRows, i, 'offset_value', e.target.value, maintenanceOffsetsRows)}
                            placeholder="Offset"
                          />
                        </td>
                        <td>
                          {maintenanceOffsetsRows.length > 1 && (
                            <button
                              type="button"
                              className="delete-row-btn"
                              onClick={() => handleDeleteRow(setMaintenanceOffsetsRows, maintenanceOffsetsRows, i)}
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            </>
          )}

          {/* Submit Button & Actions */}
          <div className="form-actions">
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                type="submit"
                className="submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    Creating Project...
                  </>
                ) : (
                  'Create Project'
                )}
              </button>
            </div>
            <small style={{ marginTop: '1rem', color: '#6b7280' }}>
              * Required fields must be filled before submission
            </small>
          </div>
        </form>
      </div>
    </div>
  );
}
