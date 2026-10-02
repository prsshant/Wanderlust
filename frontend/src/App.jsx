import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import PackageCard from './components/PackageCard';
import PackageDetailsModal from './components/PackageDetailsModal';
import BookingModal from './components/BookingModal';
import PackageFormModal from './components/PackageFormModal';
import AuthModal from './components/AuthModal';
import AgentDashboard from './components/AgentDashboard';
import MyBookings from './components/MyBookings';
import {
  apiRequest,
  getAuthToken,
  setAuthToken,
  getStoredUser,
  setStoredUser
} from './api';
import {
  Search,
  MapPin,
  DollarSign,
  Compass,
  CheckCircle,
  AlertCircle,
  Filter,
  Sparkles
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(getStoredUser());
  const [currentTab, setCurrentTab] = useState('packages'); // 'packages' | 'my-bookings' | 'agent'
  const [packages, setPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [destinationFilter, setDestinationFilter] = useState('');
  const [maxPriceFilter, setMaxPriceFilter] = useState('');

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [detailsPackage, setDetailsPackage] = useState(null);
  const [bookingPackage, setBookingPackage] = useState(null);
  const [packageToEdit, setPackageToEdit] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Notification Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Verify current user session on mount
  useEffect(() => {
    const checkUser = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          const res = await apiRequest('/auth/me');
          setUser(res.user);
          setStoredUser(res.user);
        } catch (err) {
          // Token expired or invalid
          setAuthToken(null);
          setStoredUser(null);
          setUser(null);
        }
      }
    };
    checkUser();
  }, []);

  // Fetch Packages
  const fetchPackages = async () => {
    setLoadingPackages(true);
    try {
      let queryParams = [];
      if (searchQuery) queryParams.push(`search=${encodeURIComponent(searchQuery)}`);
      if (destinationFilter) queryParams.push(`destination=${encodeURIComponent(destinationFilter)}`);
      if (maxPriceFilter) queryParams.push(`maxPrice=${encodeURIComponent(maxPriceFilter)}`);

      const queryStr = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      const res = await apiRequest(`/packages${queryStr}`);
      setPackages(res.data || []);
    } catch (err) {
      console.error('Error fetching packages:', err);
    } finally {
      setLoadingPackages(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, [searchQuery, destinationFilter, maxPriceFilter]);

  const handleLogout = () => {
    setAuthToken(null);
    setStoredUser(null);
    setUser(null);
    setCurrentTab('packages');
    showToast('You have been logged out successfully.', 'success');
  };

  const handleBookTrigger = (pkg) => {
    if (!user) {
      showToast('Please sign in to book trip packages and upload identity documents.', 'warning');
      setIsAuthOpen(true);
      return;
    }
    setBookingPackage(pkg);
  };

  const handleBookingSuccess = (newBooking) => {
    setBookingPackage(null);
    showToast(`🎉 Booking confirmed for "${newBooking.tripPackage?.title || 'Trip'}"! Documents uploaded successfully.`, 'success');
    fetchPackages(); // refresh available seats
    if (user?.role === 'customer') {
      setCurrentTab('my-bookings');
    }
  };

  const handleDeletePackage = async (packageId) => {
    if (!window.confirm('Are you sure you want to delete this trip package?')) {
      return;
    }
    try {
      await apiRequest(`/packages/${packageId}`, {
        method: 'DELETE'
      });
      showToast('Package deleted successfully', 'success');
      fetchPackages();
    } catch (err) {
      alert(err.message || 'Failed to delete package');
    }
  };

  const handleOpenEdit = (pkg) => {
    setPackageToEdit(pkg);
    setIsFormOpen(true);
  };

  const handleOpenAdd = () => {
    setPackageToEdit(null);
    setIsFormOpen(true);
  };

  return (
    <div className="app-container">
      <Navbar
        user={user}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onOpenAddPackage={handleOpenAdd}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            zIndex: 110,
            maxWidth: '420px',
            animation: 'modalFadeIn 0.3s ease-out'
          }}
        >
          <div
            className={`alert ${toast.type === 'success' ? 'alert-success' : toast.type === 'warning' ? 'alert-warning' : 'alert-danger'}`}
            style={{ boxShadow: 'var(--shadow-xl)', margin: 0 }}
          >
            {toast.type === 'success' ? (
              <CheckCircle size={20} style={{ flexShrink: 0 }} />
            ) : (
              <AlertCircle size={20} style={{ flexShrink: 0 }} />
            )}
            <div>{toast.message}</div>
          </div>
        </div>
      )}

      {currentTab === 'packages' && (
        <>
          {/* Hero Section */}
          <section className="hero">
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '9999px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(8px)',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                  color: '#bae6fd'
                }}
              >
                <Sparkles size={15} color="#38bdf8" />
                <span>Seamless Travel Planning & Verification</span>
              </div>
              <h1 className="hero-title">Discover Your Next Extraordinary Adventure</h1>
              <p className="hero-subtitle">
                Browse curated travel packages, securely upload required identity documents with Multer, and prevent overlapping dates automatically.
              </p>

              {/* Live Search and Filters */}
              <div className="search-box-wrapper">
                <div className="search-input-group">
                  <Search size={18} color="#0284c7" />
                  <input
                    type="text"
                    placeholder="Search trips (e.g. Alps, Bali, Japan)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="search-input-group">
                  <MapPin size={18} color="#0284c7" />
                  <input
                    type="text"
                    placeholder="Filter by country or city..."
                    value={destinationFilter}
                    onChange={(e) => setDestinationFilter(e.target.value)}
                  />
                </div>

                <div className="search-input-group" style={{ flex: '0 1 180px' }}>
                  <DollarSign size={18} color="#10b981" />
                  <input
                    type="number"
                    placeholder="Max price ($)"
                    value={maxPriceFilter}
                    onChange={(e) => setMaxPriceFilter(e.target.value)}
                  />
                </div>

                {(searchQuery || destinationFilter || maxPriceFilter) && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setSearchQuery('');
                      setDestinationFilter('');
                      setMaxPriceFilter('');
                    }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Main Content: Packages */}
          <main className="main-content">
            <div className="section-header">
              <div>
                <h2 className="section-title">Available Trip Packages</h2>
                <p className="section-subtitle">
                  Showing {packages.length} curated destinations ready for booking
                </p>
              </div>

              {user?.role === 'agent' && (
                <button className="btn btn-primary" onClick={handleOpenAdd}>
                  + Add Package
                </button>
              )}
            </div>

            {loadingPackages ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                Loading available packages...
              </div>
            ) : packages.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '4rem 2rem',
                  background: 'white',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <Compass size={48} color="#94a3b8" style={{ margin: '0 auto 1rem' }} />
                <h3>No Packages Found</h3>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Try adjusting your search query or price filters.
                </p>
              </div>
            ) : (
              <div className="package-grid">
                {packages.map((pkg) => (
                  <PackageCard
                    key={pkg._id}
                    pkg={pkg}
                    isAgent={user?.role === 'agent'}
                    onViewDetails={(p) => setDetailsPackage(p)}
                    onBook={handleBookTrigger}
                    onEdit={handleOpenEdit}
                    onDelete={handleDeletePackage}
                  />
                ))}
              </div>
            )}
          </main>
        </>
      )}

      {currentTab === 'my-bookings' && (
        <main className="main-content">
          <MyBookings />
        </main>
      )}

      {currentTab === 'agent' && (
        <main className="main-content">
          <AgentDashboard
            packages={packages}
            onRefreshPackages={fetchPackages}
            onOpenAddPackage={handleOpenAdd}
            onEditPackage={handleOpenEdit}
            onDeletePackage={handleDeletePackage}
          />
        </main>
      )}

      {/* Modals */}
      {isAuthOpen && (
        <AuthModal
          onClose={() => setIsAuthOpen(false)}
          onAuthSuccess={(authenticatedUser) => {
            setUser(authenticatedUser);
            showToast(`Welcome back, ${authenticatedUser.name}!`, 'success');
            if (authenticatedUser.role === 'agent') {
              setCurrentTab('agent');
            }
          }}
        />
      )}

      {detailsPackage && (
        <PackageDetailsModal
          pkg={detailsPackage}
          onClose={() => setDetailsPackage(null)}
          onBook={(p) => {
            setDetailsPackage(null);
            handleBookTrigger(p);
          }}
        />
      )}

      {bookingPackage && (
        <BookingModal
          pkg={bookingPackage}
          user={user}
          onClose={() => setBookingPackage(null)}
          onSuccess={handleBookingSuccess}
        />
      )}

      {isFormOpen && (
        <PackageFormModal
          pkgToEdit={packageToEdit}
          onClose={() => {
            setIsFormOpen(false);
            setPackageToEdit(null);
          }}
          onSuccess={() => {
            setIsFormOpen(false);
            setPackageToEdit(null);
            showToast('Package saved successfully!', 'success');
            fetchPackages();
          }}
        />
      )}
    </div>
  );
}
