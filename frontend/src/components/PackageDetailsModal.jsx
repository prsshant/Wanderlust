import React from 'react';
import { X, MapPin, Calendar, Users, DollarSign, CheckCircle2, Clock } from 'lucide-react';

export default function PackageDetailsModal({ pkg, onClose, onBook }) {
  if (!pkg) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content wide"
        onClick={(e) => e.stopPropagation()}
        style={{ padding: '0' }}
      >
        <div style={{ position: 'relative', height: '260px' }}>
          <img
            src={pkg.imageUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80'}
            alt={pkg.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <button
            className="modal-close"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(0,0,0,0.6)',
              color: 'white'
            }}
          >
            <X size={20} />
          </button>
          <div
            style={{
              position: 'absolute',
              bottom: '1rem',
              left: '1.5rem',
              background: 'rgba(15, 23, 42, 0.85)',
              color: 'white',
              padding: '0.4rem 1rem',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <MapPin size={16} />
            <span>{pkg.destination}</span>
          </div>
        </div>

        <div style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>{pkg.title}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{pkg.destination}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--color-primary)' }}>
                ${pkg.price}
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>per traveler</span>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
              background: '#f8fafc',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.5rem',
              border: '1px solid var(--border-color)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} color="#0284c7" />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Departure & Return</div>
                <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                  {formatDate(pkg.startDate)} – {formatDate(pkg.endDate)}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} color="#10b981" />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Seat Availability</div>
                <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                  {pkg.availableSeats} spots left out of {pkg.capacity}
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '1.75rem' }}>
            <h4 style={{ marginBottom: '0.5rem' }}>Overview</h4>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>{pkg.description}</p>
          </div>

          {pkg.itinerary && pkg.itinerary.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={18} color="#0284c7" />
                <span>Day-by-Day Itinerary</span>
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {pkg.itinerary.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      gap: '0.85rem',
                      background: '#ffffff',
                      border: '1px solid var(--border-color)',
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-md)'
                    }}
                  >
                    <span
                      style={{
                        background: 'var(--color-primary-light)',
                        color: 'var(--color-primary)',
                        fontWeight: '700',
                        fontSize: '0.8rem',
                        padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--radius-sm)',
                        height: 'fit-content'
                      }}
                    >
                      Day {item.day}
                    </span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      {item.activity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                onClose();
                onBook(pkg);
              }}
              disabled={pkg.availableSeats <= 0}
            >
              {pkg.availableSeats > 0 ? `Book Now ($${pkg.price})` : 'Sold Out'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
