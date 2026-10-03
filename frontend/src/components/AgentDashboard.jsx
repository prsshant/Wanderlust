import React, { useState, useEffect } from 'react';
import {
  Package,
  Calendar,
  Users,
  DollarSign,
  FileText,
  PlusCircle,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  ShieldAlert
} from 'lucide-react';
import { apiRequest } from '../api';

export default function AgentDashboard({
  packages,
  onRefreshPackages,
  onOpenAddPackage,
  onEditPackage,
  onDeletePackage
}) {
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' or 'packages'
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [feedback, setFeedback] = useState(null);

  const fetchAgentBookings = async () => {
    setLoadingBookings(true);
    try {
      const endpoint = statusFilter ? `/bookings?status=${statusFilter}` : '/bookings';
      const res = await apiRequest(endpoint);
      setBookings(res.data || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    fetchAgentBookings();
  }, [statusFilter]);

  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      await apiRequest(`/bookings/${bookingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      setFeedback(`Booking successfully marked as ${newStatus}`);
      fetchAgentBookings();
      onRefreshPackages();
      setTimeout(() => setFeedback(null), 3500);
    } catch (err) {
      alert(err.message || 'Failed to update booking status');
    }
  };

  const totalRevenue = bookings
    .filter((b) => b.status === 'confirmed')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const totalSeatsSold = bookings
    .filter((b) => b.status === 'confirmed')
    .reduce((sum, b) => sum + (b.seatsBooked || 0), 0);

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
          <h2 className="section-title">Agent Control Center</h2>
          <p className="section-subtitle">
            Manage travel packages, review uploaded customer identity documents, and process bookings
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchAgentBookings}>
            <RefreshCw size={15} />
            <span>Sync</span>
          </button>
          <button className="btn btn-primary btn-sm" onClick={onOpenAddPackage}>
            <PlusCircle size={15} />
            <span>Create New Package</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="alert alert-success">
          <CheckCircle size={18} />
          <span>{feedback}</span>
        </div>
      )}

      {/* KPI Overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
            <Package size={24} />
          </div>
          <div>
            <div className="stat-val">{packages.length}</div>
            <div className="stat-label">Active Packages</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#d1fae5', color: '#059669' }}>
            <Calendar size={24} />
          </div>
          <div>
            <div className="stat-val">{bookings.length}</div>
            <div className="stat-label">Total Bookings</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
            <Users size={24} />
          </div>
          <div>
            <div className="stat-val">{totalSeatsSold}</div>
            <div className="stat-label">Confirmed Travelers</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ede9fe', color: '#7c3aed' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div className="stat-val">${totalRevenue.toLocaleString()}</div>
            <div className="stat-label">Gross Revenue</div>
          </div>
        </div>
      </div>

      {/* Subtabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button
          className={`btn ${activeTab === 'bookings' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('bookings')}
        >
          Customer Bookings & Documents ({bookings.length})
        </button>
        <button
          className={`btn ${activeTab === 'packages' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('packages')}
        >
          Manage Trip Packages ({packages.length})
        </button>
      </div>

      {activeTab === 'bookings' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem' }}>Customer Bookings & Uploaded Documents Review</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Filter status:</span>
              <select
                className="form-select"
                style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Customer Info</th>
                  <th>Trip Package</th>
                  <th>Travel Dates</th>
                  <th>Seats & Total</th>
                  <th>Uploaded Identity Docs</th>
                  <th>Status</th>
                  <th>Agent Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingBookings ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                      Loading bookings...
                    </td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No customer bookings found.
                    </td>
                  </tr>
                ) : (
                  bookings.map((b) => (
                    <tr key={b._id}>
                      <td>
                        <div style={{ fontWeight: '700' }}>{b.customer?.name || 'Customer'}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{b.customer?.email}</div>
                        {b.contactPhone && (
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Tel: {b.contactPhone}</div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: '600' }}>{b.tripPackage?.title || 'Unknown Package'}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{b.tripPackage?.destination}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>
                          {formatDate(b.travelStartDate)} – {formatDate(b.travelEndDate)}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: '700' }}>${b.totalAmount}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{b.seatsBooked} {b.seatsBooked === 1 ? 'seat' : 'seats'}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          {b.documentPaths && b.documentPaths.length > 0 ? (
                            b.documentPaths.map((docPath, i) => (
                              <a
                                key={i}
                                href={`/${docPath}`}
                                target="_blank"
                                rel="noreferrer"
                                className="doc-pill"
                                title="Click to view full identity document in new tab"
                              >
                                <FileText size={12} />
                                <span>Doc #{i + 1}</span>
                                <Eye size={12} />
                              </a>
                            ))
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: '#ef4444' }}>No documents</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${b.status}`}>
                          {b.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          {b.status !== 'confirmed' && (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleUpdateStatus(b._id, 'confirmed')}
                              title="Confirm Booking"
                            >
                              <CheckCircle size={13} />
                              <span>Confirm</span>
                            </button>
                          )}
                          {b.status !== 'rejected' && b.status !== 'cancelled' && (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleUpdateStatus(b._id, 'rejected')}
                              title="Reject Booking"
                            >
                              <XCircle size={13} />
                              <span>Reject</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'packages' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem' }}>Package Catalog & Inventory</h3>
            <button className="btn btn-primary btn-sm" onClick={onOpenAddPackage}>
              <PlusCircle size={15} />
              <span>Add Package</span>
            </button>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Package Title</th>
                  <th>Destination</th>
                  <th>Price</th>
                  <th>Date Range</th>
                  <th>Remaining / Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {packages.map((pkg) => (
                  <tr key={pkg._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img
                          src={pkg.imageUrl}
                          alt={pkg.title}
                          style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                        />
                        <div style={{ fontWeight: '700' }}>{pkg.title}</div>
                      </div>
                    </td>
                    <td>{pkg.destination}</td>
                    <td style={{ fontWeight: '700', color: 'var(--color-primary)' }}>${pkg.price}</td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {formatDate(pkg.startDate)} – {formatDate(pkg.endDate)}
                    </td>
                    <td>
                      <span style={{ fontWeight: '700' }}>{pkg.availableSeats}</span> / {pkg.capacity}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => onEditPackage(pkg)}
                          title="Edit Package"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => onDeletePackage(pkg._id)}
                          title="Delete Package"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
