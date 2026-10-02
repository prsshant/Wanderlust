import React from 'react';
import { Compass, Calendar, ShieldCheck, User, LogOut, LogIn, PlusCircle } from 'lucide-react';

export default function Navbar({
  user,
  currentTab,
  setCurrentTab,
  onOpenAuth,
  onLogout,
  onOpenAddPackage
}) {
  return (
    <header className="navbar">
      <div className="nav-brand" onClick={() => setCurrentTab('packages')}>
        <Compass size={28} color="#0284c7" />
        <span>Wanderlust</span>
        <span className="brand-badge">Travel Platform</span>
      </div>

      <nav className="nav-links">
        <button
          className={`nav-btn ${currentTab === 'packages' ? 'active' : ''}`}
          onClick={() => setCurrentTab('packages')}
        >
          <Compass size={18} />
          <span>Explore Trips</span>
        </button>

        {user && user.role === 'customer' && (
          <button
            className={`nav-btn ${currentTab === 'my-bookings' ? 'active' : ''}`}
            onClick={() => setCurrentTab('my-bookings')}
          >
            <Calendar size={18} />
            <span>My Bookings</span>
          </button>
        )}

        {user && user.role === 'agent' && (
          <>
            <button
              className={`nav-btn ${currentTab === 'agent' ? 'active' : ''}`}
              onClick={() => setCurrentTab('agent')}
            >
              <ShieldCheck size={18} />
              <span>Agent Management</span>
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={onOpenAddPackage}
              style={{ marginLeft: '0.5rem' }}
            >
              <PlusCircle size={16} />
              <span>Create Package</span>
            </button>
          </>
        )}
      </nav>

      <div className="nav-user-panel">
        {user ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: '700' }}>{user.name}</span>
              <span className={`role-badge ${user.role}`}>
                {user.role === 'agent' ? 'Agent Access' : 'Traveler'}
              </span>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={onLogout}
              title="Logout"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </>
        ) : (
          <button className="btn btn-primary" onClick={onOpenAuth}>
            <LogIn size={18} />
            <span>Sign In / Register</span>
          </button>
        )}
      </div>
    </header>
  );
}
