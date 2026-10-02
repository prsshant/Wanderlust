import React from 'react';
import { MapPin, Calendar, Users, DollarSign, ArrowRight, Edit, Trash2 } from 'lucide-react';

export default function PackageCard({
  pkg,
  onViewDetails,
  onBook,
  isAgent,
  onEdit,
  onDelete
}) {
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="package-card">
      <div className="card-img-container">
        <img
          src={pkg.imageUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80'}
          alt={pkg.title}
          loading="lazy"
        />
        <div className="card-destination-tag">
          <MapPin size={13} />
          <span>{pkg.destination}</span>
        </div>
        <div className="card-price-tag">
          ${pkg.price}
        </div>
      </div>

      <div className="card-body">
        <h3 className="card-title">{pkg.title}</h3>
        <p className="card-desc">{pkg.description}</p>

        <div className="card-meta">
          <div className="meta-item">
            <Calendar size={14} color="#0284c7" />
            <span>
              {formatDate(pkg.startDate)} – {formatDate(pkg.endDate)}
            </span>
          </div>
          <div className="meta-item">
            <Users size={14} color="#10b981" />
            <span>
              <strong>{pkg.availableSeats}</strong> / {pkg.capacity} seats left
            </span>
          </div>
        </div>

        <div className="card-actions">
          <button
            className="btn btn-secondary"
            style={{ flex: 1 }}
            onClick={() => onViewDetails(pkg)}
          >
            Details
          </button>
          
          <button
            className="btn btn-primary"
            style={{ flex: 1.2 }}
            onClick={() => onBook(pkg)}
            disabled={pkg.availableSeats <= 0}
          >
            <span>{pkg.availableSeats > 0 ? 'Book Trip' : 'Sold Out'}</span>
            <ArrowRight size={16} />
          </button>

          {isAgent && (
            <>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onEdit(pkg)}
                title="Edit Package"
              >
                <Edit size={16} />
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => onDelete(pkg._id)}
                title="Delete Package"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
