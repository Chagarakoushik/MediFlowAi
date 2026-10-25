import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import type { Appointment, AppointmentCreateInput } from '../../types';
import {
  Search,
  Sparkles,
  Edit,
  Trash2,
  Phone,
  Mail,
  Plus,
  X,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

export const AppointmentsView: React.FC = () => {
  const { openStudioForAppointment, showToast, refreshStats, isCreateModalOpen, setIsCreateModalOpen } = useApp();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter states
  const [search, setSearch] = useState<string>('');
  const [department, setDepartment] = useState<string>('All');
  const [status, setStatus] = useState<string>('All');
  const [followUpStatus, setFollowUpStatus] = useState<string>('All');
  const [riskLevel, setRiskLevel] = useState<string>('All');

  // Edit modal
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  // New Appointment Form state
  const [newFormData, setNewFormData] = useState<AppointmentCreateInput>({
    patient_name: '',
    patient_phone: '',
    patient_email: '',
    patient_age: 45,
    gender: 'Female',
    appointment_date: new Date(Date.now() + 86400000 * 2).toISOString().substring(0, 10),
    appointment_time: '10:00 AM',
    department: 'Cardiology',
    doctor_name: 'Dr. Marcus Chen, MD',
    appointment_type: 'Post-Op Follow-up',
    status: 'Scheduled',
    follow_up_status: 'Pending Review',
    clinical_notes: '',
    discharge_instructions: '',
    risk_level: 'Medium',
    language_preference: 'English',
    reminder_channel: 'SMS',
  });

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = await api.getAppointments({
        search,
        department,
        status,
        follow_up_status: followUpStatus,
        risk_level: riskLevel,
      });
      setAppointments(data);
    } catch (err: any) {
      showToast('Failed to load appointments: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [search, department, status, followUpStatus, riskLevel]);

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to remove appointment for ${name}?`)) return;
    try {
      await api.deleteAppointment(id);
      showToast(`Appointment for ${name} removed`, 'success');
      loadAppointments();
      refreshStats();
    } catch (err: any) {
      showToast('Failed to delete: ' + err.message, 'error');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormData.patient_name || !newFormData.patient_phone) {
      showToast('Patient name and phone are required', 'error');
      return;
    }
    try {
      await api.createAppointment(newFormData);
      showToast(`Appointment created for ${newFormData.patient_name}`, 'success');
      setIsCreateModalOpen(false);
      loadAppointments();
      refreshStats();
    } catch (err: any) {
      showToast('Error creating appointment: ' + err.message, 'error');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppointment) return;
    try {
      await api.updateAppointment(editingAppointment.id, editingAppointment);
      showToast('Appointment updated successfully', 'success');
      setEditingAppointment(null);
      loadAppointments();
      refreshStats();
    } catch (err: any) {
      showToast('Update failed: ' + err.message, 'error');
    }
  };

  return (
    <div>
      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="form-control search-input"
            placeholder="Search patient, physician, phone, or clinical notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-control"
          style={{ width: 'auto' }}
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        >
          <option value="All">All Specialties</option>
          <option value="Cardiology">Cardiology</option>
          <option value="Endocrinology">Endocrinology</option>
          <option value="Orthopedics">Orthopedics</option>
          <option value="Pediatrics">Pediatrics</option>
          <option value="Neurology">Neurology</option>
          <option value="Pulmonology">Pulmonology</option>
          <option value="General Surgery">General Surgery</option>
          <option value="Dermatology">Dermatology</option>
        </select>

        <select
          className="form-control"
          style={{ width: 'auto' }}
          value={followUpStatus}
          onChange={(e) => setFollowUpStatus(e.target.value)}
        >
          <option value="All">All Review Statuses</option>
          <option value="Pending Review">Pending Review</option>
          <option value="Approved">Approved</option>
          <option value="Sent">Sent</option>
          <option value="Flagged">Flagged</option>
        </select>

        <select
          className="form-control"
          style={{ width: 'auto' }}
          value={riskLevel}
          onChange={(e) => setRiskLevel(e.target.value)}
        >
          <option value="All">All Risk Levels</option>
          <option value="High">High Risk</option>
          <option value="Medium">Medium Risk</option>
          <option value="Low">Low Risk</option>
        </select>

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => {
            setSearch('');
            setDepartment('All');
            setStatus('All');
            setFollowUpStatus('All');
            setRiskLevel('All');
          }}
          title="Reset Filters"
        >
          Reset Filters
        </button>
      </div>

      {/* Appointments Data Table */}
      <div className="table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Contact Details</th>
              <th>Specialty & Physician</th>
              <th>Appointment Slot</th>
              <th>Risk Level</th>
              <th>Channel</th>
              <th>Follow-up Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                  Loading patient appointments...
                </td>
              </tr>
            ) : appointments.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  <AlertCircle size={32} style={{ margin: '0 auto 8px', color: '#94a3b8' }} />
                  <div style={{ fontWeight: 600 }}>No Appointments Found</div>
                  <div style={{ fontSize: '0.8rem' }}>Try clearing filters or create a new appointment.</div>
                </td>
              </tr>
            ) : (
              appointments.map((appt) => (
                <tr key={appt.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                        }}
                      >
                        {appt.patient_name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{appt.patient_name}</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                          {appt.patient_age} yrs &bull; {appt.gender}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.78rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Phone size={12} style={{ color: '#64748b' }} />
                      <span>{appt.patient_phone}</span>
                    </div>
                    {appt.patient_email && (
                      <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Mail size={12} />
                        <span>{appt.patient_email}</span>
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{appt.department}</div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{appt.doctor_name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#2563eb' }}>{appt.appointment_type}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{appt.appointment_date}</div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{appt.appointment_time}</div>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        appt.risk_level === 'High'
                          ? 'badge-risk-high'
                          : appt.risk_level === 'Medium'
                          ? 'badge-risk-med'
                          : 'badge-risk-low'
                      }`}
                    >
                      {appt.risk_level}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>
                      {appt.reminder_channel}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        appt.follow_up_status === 'Approved'
                          ? 'badge-approved'
                          : appt.follow_up_status === 'Sent'
                          ? 'badge-sent'
                          : appt.follow_up_status === 'Flagged'
                          ? 'badge-flagged'
                          : 'badge-pending'
                      }`}
                    >
                      {appt.follow_up_status === 'Approved' && <CheckCircle size={11} />}
                      {appt.follow_up_status === 'Pending Review' && <Clock size={11} />}
                      {appt.follow_up_status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ padding: '5px 10px' }}
                        title="Open in AI Reminder Studio"
                        onClick={() => openStudioForAppointment(appt.id)}
                      >
                        <Sparkles size={13} />
                        <span>Studio</span>
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '6px' }}
                        title="Edit Details"
                        onClick={() => setEditingAppointment(appt)}
                      >
                        <Edit size={13} />
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '6px', color: '#e11d48' }}
                        title="Delete"
                        onClick={() => handleDelete(appt.id, appt.patient_name)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Appointment Modal */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="card-title">
                <Plus size={18} style={{ color: '#1d4ed8' }} />
                <span>Create New Patient Appointment</span>
              </div>
              <button
                className="btn btn-secondary btn-sm btn-icon"
                onClick={() => setIsCreateModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Patient Full Name *</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      placeholder="e.g. Eleanor Vance"
                      value={newFormData.patient_name}
                      onChange={(e) => setNewFormData({ ...newFormData, patient_name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number *</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      placeholder="+1 (555) 000-0000"
                      value={newFormData.patient_phone}
                      onChange={(e) => setNewFormData({ ...newFormData, patient_phone: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="patient@example.com"
                      value={newFormData.patient_email}
                      onChange={(e) => setNewFormData({ ...newFormData, patient_email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Age</label>
                    <input
                      type="number"
                      min={0}
                      max={120}
                      className="form-control"
                      value={newFormData.patient_age}
                      onChange={(e) => setNewFormData({ ...newFormData, patient_age: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select
                      className="form-control"
                      value={newFormData.gender}
                      onChange={(e) => setNewFormData({ ...newFormData, gender: e.target.value })}
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Non-binary">Non-binary</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Specialty Department *</label>
                    <select
                      className="form-control"
                      value={newFormData.department}
                      onChange={(e) => setNewFormData({ ...newFormData, department: e.target.value })}
                    >
                      <option value="Cardiology">Cardiology</option>
                      <option value="Endocrinology">Endocrinology</option>
                      <option value="Orthopedics">Orthopedics</option>
                      <option value="Pediatrics">Pediatrics</option>
                      <option value="Neurology">Neurology</option>
                      <option value="Pulmonology">Pulmonology</option>
                      <option value="General Surgery">General Surgery</option>
                      <option value="Dermatology">Dermatology</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Attending Physician *</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      placeholder="e.g. Dr. Marcus Chen, MD"
                      value={newFormData.doctor_name}
                      onChange={(e) => setNewFormData({ ...newFormData, doctor_name: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Date *</label>
                    <input
                      type="date"
                      required
                      className="form-control"
                      value={newFormData.appointment_date}
                      onChange={(e) => setNewFormData({ ...newFormData, appointment_date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Time</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newFormData.appointment_time}
                      onChange={(e) => setNewFormData({ ...newFormData, appointment_time: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Clinical Risk Level</label>
                    <select
                      className="form-control"
                      value={newFormData.risk_level}
                      onChange={(e) => setNewFormData({ ...newFormData, risk_level: e.target.value as any })}
                    >
                      <option value="Low">Low Risk</option>
                      <option value="Medium">Medium Risk</option>
                      <option value="High">High Risk</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Delivery Channel</label>
                    <select
                      className="form-control"
                      value={newFormData.reminder_channel}
                      onChange={(e) => setNewFormData({ ...newFormData, reminder_channel: e.target.value as any })}
                    >
                      <option value="SMS">SMS</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Email">Email</option>
                      <option value="Phone Script">Phone Script</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Language Preference</label>
                    <select
                      className="form-control"
                      value={newFormData.language_preference}
                      onChange={(e) => setNewFormData({ ...newFormData, language_preference: e.target.value })}
                    >
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="Hindi">Hindi</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Discharge / Preparation Instructions</label>
                  <textarea
                    className="form-control"
                    placeholder="e.g. Fast 8 hours prior to lab work. Bring blood pressure log book."
                    value={newFormData.discharge_instructions}
                    onChange={(e) => setNewFormData({ ...newFormData, discharge_instructions: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Appointment Modal */}
      {editingAppointment && (
        <div className="modal-overlay" onClick={() => setEditingAppointment(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="card-title">
                <Edit size={18} style={{ color: '#1d4ed8' }} />
                <span>Edit Appointment — {editingAppointment.patient_name}</span>
              </div>
              <button
                className="btn btn-secondary btn-sm btn-icon"
                onClick={() => setEditingAppointment(null)}
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Patient Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editingAppointment.patient_name}
                      onChange={(e) => setEditingAppointment({ ...editingAppointment, patient_name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editingAppointment.patient_phone}
                      onChange={(e) => setEditingAppointment({ ...editingAppointment, patient_phone: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={editingAppointment.appointment_date}
                      onChange={(e) => setEditingAppointment({ ...editingAppointment, appointment_date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Time</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editingAppointment.appointment_time}
                      onChange={(e) => setEditingAppointment({ ...editingAppointment, appointment_time: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Follow-up Status</label>
                    <select
                      className="form-control"
                      value={editingAppointment.follow_up_status}
                      onChange={(e) => setEditingAppointment({ ...editingAppointment, follow_up_status: e.target.value as any })}
                    >
                      <option value="Pending Review">Pending Review</option>
                      <option value="Approved">Approved</option>
                      <option value="Sent">Sent</option>
                      <option value="Flagged">Flagged</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Risk Level</label>
                    <select
                      className="form-control"
                      value={editingAppointment.risk_level}
                      onChange={(e) => setEditingAppointment({ ...editingAppointment, risk_level: e.target.value as any })}
                    >
                      <option value="Low">Low Risk</option>
                      <option value="Medium">Medium Risk</option>
                      <option value="High">High Risk</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Staff Notes / Audit Log</label>
                  <textarea
                    className="form-control"
                    value={editingAppointment.staff_notes || ''}
                    onChange={(e) => setEditingAppointment({ ...editingAppointment, staff_notes: e.target.value })}
                    placeholder="Enter staff review remarks or triage updates..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingAppointment(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
