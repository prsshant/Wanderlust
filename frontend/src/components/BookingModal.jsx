import React, { useState } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle, Trash2, Calendar, ShieldCheck } from 'lucide-react';
import { apiRequest } from '../api';

export default function BookingModal({ pkg, onClose, onSuccess, user }) {
  if (!pkg) return null;

  // Default dates to package dates
  const defaultStart = pkg.startDate ? new Date(pkg.startDate).toISOString().split('T')[0] : '';
  const defaultEnd = pkg.endDate ? new Date(pkg.endDate).toISOString().split('T')[0] : '';

  const [travelStartDate, setTravelStartDate] = useState(defaultStart);
  const [travelEndDate, setTravelEndDate] = useState(defaultEnd);
  const [seatsBooked, setSeatsBooked] = useState(1);
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [specialRequests, setSpecialRequests] = useState('');
  const [files, setFiles] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [overlapData, setOverlapData] = useState(null);

  const totalAmount = pkg.price * seatsBooked;

  const handleFileChange = (e) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selected].slice(0, 5)); // max 5
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setOverlapData(null);

    if (files.length === 0) {
      setError('Please upload at least one identity document (Passport, ID Card, or Driver License) for travel verification.');
      return;
    }

    if (!travelStartDate || !travelEndDate) {
      setError('Please select both travel start and end dates.');
      return;
    }

    if (new Date(travelStartDate) > new Date(travelEndDate)) {
      setError('Travel end date must be on or after travel start date.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('tripPackageId', pkg._id);
      formData.append('travelStartDate', travelStartDate);
      formData.append('travelEndDate', travelEndDate);
      formData.append('seatsBooked', seatsBooked);
      formData.append('contactPhone', contactPhone);
      formData.append('specialRequests', specialRequests);

      // Append multiple files for Multer
      files.forEach((file) => {
        formData.append('documents', file);
      });

      const res = await apiRequest('/bookings', {
        method: 'POST',
        body: formData
      });

      onSuccess(res.data);
    } catch (err) {
      setError(err.message || 'Failed to complete booking.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Book Trip Package</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {pkg.title} ({pkg.destination})
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Booking Error:</strong>
              <div>{error}</div>
              {error.includes('Overlapping booking') && (
                <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: '#7f1d1d' }}>
                  ℹ️ System rule: A customer cannot book the same trip package twice for overlapping travel dates. Please modify your travel dates or view your active bookings.
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Travel Start Date</label>
              <input
                type="date"
                className="form-input"
                value={travelStartDate}
                onChange={(e) => setTravelStartDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Travel End Date</label>
              <input
                type="date"
                className="form-input"
                value={travelEndDate}
                onChange={(e) => setTravelEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Number of Travelers / Seats</label>
              <input
                type="number"
                min="1"
                max={pkg.availableSeats || 10}
                className="form-input"
                value={seatsBooked}
                onChange={(e) => setSeatsBooked(Math.max(1, parseInt(e.target.value) || 1))}
                required
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Max available: {pkg.availableSeats}
              </span>
            </div>
            <div className="form-group">
              <label className="form-label">Contact Phone</label>
              <input
                type="tel"
                className="form-input"
                placeholder="+1 555-0100"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Special Requests (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Vegetarian dietary needs, airport pick up"
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
            />
          </div>

          {/* Multiple Document Upload Zone via Multer */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={16} color="#0284c7" />
              <span>Identity Documents (Multer Multiple Upload) *</span>
            </label>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Upload valid travel documents (Passport, National ID, or Visa). PDF, PNG, JPG accepted (up to 5 files).
            </p>

            <label className="file-upload-zone" style={{ display: 'block' }}>
              <Upload size={28} color="#0284c7" style={{ margin: '0 auto 0.5rem' }} />
              <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                Click to browse or drop identity documents here
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Multiple files supported simultaneously
              </div>
              <input
                type="file"
                multiple
                accept=".pdf,image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>

            {files.length > 0 && (
              <div className="uploaded-file-list">
                {files.map((file, idx) => (
                  <div key={idx} className="file-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden' }}>
                      <FileText size={15} color="#0284c7" />
                      <span style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                        {file.name} ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      style={{ color: '#ef4444', padding: '0.2rem' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Price Summary */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid var(--border-color)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              margin: '1.25rem 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                ${pkg.price} × {seatsBooked} {seatsBooked === 1 ? 'seat' : 'seats'}
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                Total Payment Due
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-primary)' }}>
              ${totalAmount}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting & Uploading Documents...' : `Confirm Booking ($${totalAmount})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
