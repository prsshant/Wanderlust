import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, FileText, CheckCircle, AlertTriangle, XCircle, RefreshCw, Eye } from 'lucide-react';
import { apiRequest } from '../api';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest('/bookings/my');
      setBookings(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? The reserved seats will be released.')) {
      return;
    }

    try {
      await apiRequest(`/bookings/${bookingId}/cancel`, {
        method: 'PATCH'
      });
      setActionMessage('Booking successfully cancelled.');
      fetchBookings();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err) {
      alert(err.message || 'Failed to cancel booking');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">My Travel Bookings</h2>
          <p className="section-subtitle">
            View your confirmed trips, scheduled dates, and uploaded identity documents
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchBookings}>
          <RefreshCw size={15} />
          <span>Refresh</span>
        </button>
      </div>

      {actionMessage && (
        <div className="alert alert-success">
          <CheckCircle size={18} />
          <span>{actionMessage}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading your travel itineraries...
        </div>
      ) : bookings.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem',
            background: 'white',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)'
          }}
        >
          <Calendar size={48} color="#94a3b8" style={{ margin: '0 auto 1rem' }} />
          <h3>No Bookings Yet</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            You haven't booked any trip packages yet. Browse our destinations to start your journey!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {bookings.map((b) => (
            <div
              key={b._id}
              style={{
                background: 'white',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.25rem',
                alignItems: 'center'
              }}
            >
              <div>
                <span className={`status-badge ${b.status}`} style={{ marginBottom: '0.5rem' }}>
                  {b.status.toUpperCase()}
                </span>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>
                  {b.tripPackage?.title || 'Trip Package'}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <MapPin size={14} color="#0284c7" />
                  <span>{b.tripPackage?.destination}</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Travel Dates</div>
                <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                  {formatDate(b.travelStartDate)} – {formatDate(b.travelEndDate)}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Seats: <strong>{b.seatsBooked}</strong> | Total Paid: <strong>${b.totalAmount}</strong>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Uploaded Identity Documents ({b.documentPaths?.length || 0})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {b.documentPaths && b.documentPaths.length > 0 ? (
                    b.documentPaths.map((docPath, i) => (
                      <a
                        key={i}
                        href={`http://localhost:5001/${docPath}`}
                        target="_blank"
                        rel="noreferrer"
                        className="doc-pill"
                      >
                        <FileText size={12} />
                        <span>Document #{i + 1}</span>
                        <Eye size={11} />
                      </a>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>None uploaded</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                {b.status !== 'cancelled' && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleCancelBooking(b._id)}
                  >
                    <XCircle size={14} />
                    <span>Cancel Booking</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
