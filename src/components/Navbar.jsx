import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();

    const getInitials = (name) => name ? name.charAt(0).toUpperCase() : 'U';

    const handleLogout = () => {
        logout();
        setMenuOpen(false);
        navigate('/');
    };

    return (
        <nav style={{ background: '#ffffff', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigate('/')}>
                <div style={{ background: '#2563eb', color: 'white', padding: '6px 10px', borderRadius: '6px', fontWeight: '900', fontSize: '16px' }}>HL</div>
                <h2 style={{ margin: 0, color: '#0f172a', fontWeight: '800', fontSize: '18px' }}>HCM Lite</h2>
            </div>

            {/* Desktop Navigation */}
            <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                {!user ? (
                    <button onClick={() => navigate('/login')} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Login to Portal</button>
                ) : (
                    <>
                        <div style={{ background: '#f8fafc', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>
                            {user.role} Access
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#2563eb', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '14px' }}>{getInitials(user.name)}</div>
                            <span style={{ fontWeight: '600', color: '#334155', fontSize: '14px' }}>{user.name}</span>
                        </div>
                        <button onClick={handleLogout} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>Logout</button>
                    </>
                )}
            </div>

            {/* Mobile Hamburger Toggle */}
            <div className="mobile-hamburger" style={{ display: 'none', cursor: 'pointer' }} onClick={() => setMenuOpen(!menuOpen)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {menuOpen ? (
                        <><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></>
                    ) : (
                        <><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></>
                    )}
                </svg>
            </div>

            {/* Mobile Dropdown Options */}
            {menuOpen && (
                <div className="mobile-menu" style={{ position: 'absolute', top: '65px', left: 0, right: 0, background: 'white', padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '15px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    {!user ? (
                        <button onClick={() => { setMenuOpen(false); navigate('/login'); }} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', width: '100%' }}>Login</button>
                    ) : (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '15px', borderBottom: '1px solid #f1f5f9' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#2563eb', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' }}>{getInitials(user.name)}</div>
                                <div>
                                    <span style={{ fontWeight: '700', color: '#0f172a', display: 'block' }}>{user.name}</span>
                                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{user.role} Portal</span>
                                </div>
                            </div>
                            
                            {/* Dashboard Navigation Links */}
                            {user.role === 'Employee' && <Link to="/employee" onClick={() => setMenuOpen(false)} style={{ color: '#334155', textDecoration: 'none', fontWeight: '600', padding: '5px 0' }}>Dashboard</Link>}
                            {user.role === 'HR' && <Link to="/hr" onClick={() => setMenuOpen(false)} style={{ color: '#334155', textDecoration: 'none', fontWeight: '600', padding: '5px 0' }}>HR Workspace</Link>}
                            {user.role === 'Admin' && <Link to="/admin" onClick={() => setMenuOpen(false)} style={{ color: '#334155', textDecoration: 'none', fontWeight: '600', padding: '5px 0' }}>Control Center</Link>}

                            <button onClick={handleLogout} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', width: '100%', marginTop: '10px' }}>Logout Securely</button>
                        </>
                    )}
                </div>
            )}

            <style>
                {`
                    @media (max-width: 768px) {
                        .desktop-nav { display: none !important; }
                        .mobile-hamburger { display: block !important; }
                    }
                `}
            </style>
        </nav>
    );
};

export default Navbar;