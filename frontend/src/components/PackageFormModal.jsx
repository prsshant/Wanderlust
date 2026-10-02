import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertCircle } from 'lucide-react';
import { apiRequest } from '../api';

export default function PackageFormModal({ pkgToEdit, onClose, onSuccess }) {
  const isEditing = Boolean(pkgToEdit);

  const [title, setTitle] = useState(pkgToEdit?.title || '');
  const [destination, setDestination] = useState(pkgToEdit?.destination || '');
  const [description, setDescription] = useState(pkgToEdit?.description || '');
  const [price, setPrice] = useState(pkgToEdit?.price || '');
  const [startDate, setStartDate] = useState(
    pkgToEdit?.startDate ? new Date(pkgToEdit.startDate).toISOString().split('T')[0] : ''
  );
  const [endDate, setEndDate] = useState(
    pkgToEdit?.endDate ? new Date(pkgToEdit.endDate).toISOString().split('T')[0] : ''
  );
  const [capacity, setCapacity] = useState(pkgToEdit?.capacity || 20);
  const [imageUrl, setImageUrl] = useState(
    pkgToEdit?.imageUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1000&q=80'
  );
  const [itinerary, setItinerary] = useState(
    pkgToEdit?.itinerary?.length > 0
      ? pkgToEdit.itinerary
      : [
          { day: 1, activity: 'Arrival & Welcome Dinner' },
          { day: 2, activity: 'Guided City & Landmark Tour' }
        ]
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addItineraryDay = () => {
    setItinerary([...itinerary, { day: itinerary.length + 1, activity: '' }]);
  };

  const updateItineraryDay = (index, activity) => {
    const updated = [...itinerary];
    updated[index].activity = activity;
    setItinerary(updated);
  };

  const removeItineraryDay = (index) => {
    const updated = itinerary
      .filter((_, i) => i !== index)
      .map((item, i) => ({ ...item, day: i + 1 }));
    setItinerary(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (new Date(startDate) > new Date(endDate)) {
      setError('Package end date must be on or after start date.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title,
        destination,
        description,
        price: Number(price),
        startDate,
        endDate,
        capacity: Number(capacity),
        imageUrl,
        itinerary: itinerary.filter((item) => item.activity.trim() !== '')
      };

      let res;
      if (isEditing) {
        res = await apiRequest(`/packages/${pkgToEdit._id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        res = await apiRequest('/packages', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      onSuccess(res.data);
    } catch (err) {
      setError(err.message || 'Error saving package');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content wide"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">
            {isEditing ? 'Update Trip Package' : 'Create New Trip Package (Agent)'}
          </h3>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Package Title *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Majestic Swiss Alps & Lakes Tour"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Destination Location *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Interlaken, Switzerland"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Full Description *</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Highlight key experiences, accommodation, views, and cultural experiences..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Price Per Traveler ($ USD) *</label>
              <input
                type="number"
                min="0"
                className="form-input"
                placeholder="1450"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Max Capacity / Spots *</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Date *</label>
              <input
                type="date"
                className="form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Date *</label>
              <input
                type="date"
                className="form-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Cover Image URL</label>
            <input
              type="url"
              className="form-input"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>

          {/* Dynamic Day-by-Day Itinerary */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ margin: 0 }}>Day-by-Day Itinerary</label>
              <button type="button" className="btn btn-secondary btn-sm" onClick={addItineraryDay}>
                <Plus size={14} />
                <span>Add Day</span>
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {itinerary.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontWeight: '700', fontSize: '0.85rem', width: '55px' }}>
                    Day {item.day}:
                  </span>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={`Activities for Day ${item.day}`}
                    value={item.activity}
                    onChange={(e) => updateItineraryDay(idx, e.target.value)}
                  />
                  {itinerary.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItineraryDay(idx)}
                      style={{ color: '#ef4444', padding: '0.4rem' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEditing ? 'Update Package' : 'Create Package'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
