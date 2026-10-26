/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const AdminDashboard = () => {
    const { user } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('overview');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const [stats, setStats] = useState({ totalUsers: 0, activeHRs: 0, presentToday: 0, pendingPayrolls: 0 });
    const [usersList, setUsersList] = useState([]);
    const [attendanceLogs, setAttendanceLogs] = useState([]);
    const [payrolls, setPayrolls] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const [showAddHR, setShowAddHR] = useState(false);
    const [newHR, setNewHR] = useState({ name: '', email: '', password: '' });

    const fetchAllAdminData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const [usersRes, attRes, payrollsRes] = await Promise.allSettled([
                axios.get('https://hcm-lite-hackhaton.vercel.app/api/auth/users', { headers }),
                axios.get('https://hcm-lite-hackhaton.vercel.app/api/attendance/all', { headers }),
                axios.get('https://hcm-lite-hackhaton.vercel.app/api/payroll/all', { headers })
            ]);

            let fetchedUsers = [];
            let fetchedPayrolls = [];

            if (usersRes.status === 'fulfilled') {
                fetchedUsers = usersRes.value.data || [];
                setUsersList(fetchedUsers);
            }
            if (attRes.status === 'fulfilled') setAttendanceLogs(attRes.value.data || []);
            if (payrollsRes.status === 'fulfilled') {
                fetchedPayrolls = payrollsRes.value.data || [];
                setPayrolls(fetchedPayrolls);
            }

            const today = new Date().toLocaleDateString('en-CA');
            
            setStats({
                totalUsers: fetchedUsers.length,
                activeHRs: fetchedUsers.filter(u => u.role === 'HR').length,
                presentToday: attRes.status === 'fulfilled' ? attRes.value.data.filter(a => a.checkInTime && a.date === today).length : 0,
                pendingPayrolls: fetchedPayrolls.filter(p => p.status === 'Pending Admin Approval').length
            });

        } catch (err) {
            console.error(err);
            setError("Failed to fetch live Admin data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllAdminData();
    }, []);

    const showMsg = (msg, isError = false) => {
        if (isError) setError(msg);
        else setMessage(msg);
        setTimeout(() => { setMessage(''); setError(''); }, 4000);
    };

    const handleRegisterHR = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('https://hcm-lite-hackhaton.vercel.app/api/auth/register', { ...newHR, role: 'HR' }, { headers: { Authorization: `Bearer ${token}` } });
            showMsg('HR Manager Account Created Successfully!');
            setShowAddHR(false);
            setNewHR({ name: '', email: '', password: '' });
            fetchAllAdminData(); 
        } catch (err) {
            showMsg(err.response?.data?.message || 'Failed to register HR', true);
        }
    };

    const toggleUserStatus = async (userId, currentStatus) => {
        try {
            const token = localStorage.getItem('token');
            const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
            await axios.put(`https://hcm-lite-hackhaton.vercel.app/api/auth/users/${userId}/status`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
            showMsg(`User account has been ${newStatus}.`);
            fetchAllAdminData(); 
        } catch (err) {
            console.error(err);
            showMsg("Failed to connect to Database for status update.", true);
        }
    };

    const handleApprovePayroll = async (id) => {
        if (!window.confirm("Approve & Lock this payroll? Employee will now see this slip.")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.put(`https://hcm-lite-hackhaton.vercel.app/api/payroll/${id}/finalize`, { status: 'Approved & Locked' }, { headers: { Authorization: `Bearer ${token}` } });
            showMsg('Payroll Approved & Locked successfully!');
            fetchAllAdminData();
        } catch (err) {
            console.error(err);
            showMsg('Backend Error: Failed to approve payroll. Check Server.', true);
        }
    };

    const handleRejectPayroll = async (id) => {
        const reason = window.prompt("Enter reason for rejection:");
        if (reason === null) return;
        try {
            const token = localStorage.getItem('token');
            await axios.put(`https://hcm-lite-hackhaton.vercel.app/api/payroll/${id}/reject`, { status: 'Rejected', reason }, { headers: { Authorization: `Bearer ${token}` } });
            showMsg('Payroll Rejected and sent back to HR.');
            fetchAllAdminData();
        } catch (err) {
            console.error(err);
            showMsg('Backend Error: Failed to reject payroll.', true);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/';
    };

    const handleMenuClick = (tabId) => {
        setActiveTab(tabId);
        setMobileMenuOpen(false);
    };

    const filteredUsers = usersList.filter(u => u.name?.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="dashboard-layout" style={{ backgroundColor: '#f1f5f9', fontFamily: "'Inter', sans-serif" }}>
            <style>
                {`
                    .dashboard-layout { display: flex; flex-direction: row; min-height: 100vh; width: 100vw; overflow-x: hidden; }
                    .sidebar { width: 280px; min-width: 280px; background: #020617; display: flex; flex-direction: column; justify-content: space-between; z-index: 20; box-shadow: 4px 0 15px rgba(0,0,0,0.05); }
                    .sidebar-btn { width: 100%; display: flex; align-items: center; gap: 14px; padding: 16px 24px; border: none; text-align: left; cursor: pointer; font-size: 15px; font-weight: 500; transition: all 0.2s; }
                    .main-content { flex: 1; overflow-y: auto; width: 100%; }
                    .header-area { display: flex; justify-content: space-between; align-items: center; }
                    .table-container { width: 100%; overflow-x: auto; background: white; border-radius: 12px; border: 1px solid #e2e8f0; }
                    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
                    .mobile-top-bar { display: none; }
                    .mobile-dropdown { display: none; }
                    .desktop-menu-items { display: flex; flex-direction: column; }
                    
                    @media (max-width: 992px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
                    @media (max-width: 768px) {
                        .dashboard-layout { flex-direction: column; }
                        .sidebar { display: none; } 
                        .mobile-top-bar { display: flex; justify-content: space-between; align-items: center; background: #020617; padding: 15px 20px; color: white; position: sticky; top: 0; z-index: 50; }
                        
                        .mobile-dropdown { display: ${mobileMenuOpen ? 'flex' : 'none'}; flex-direction: column; background: #0f172a; position: fixed; top: 60px; left: 0; right: 0; z-index: 40; border-bottom: 1px solid #1e293b; }
                        .mobile-dropdown button { padding: 15px 20px; color: #94a3b8; border: none; border-bottom: 1px solid #1e293b; background: transparent; text-align: left; font-size: 16px; font-weight: 500; }
                        .mobile-dropdown button.active { color: #38bdf8; background: #1e293b; border-left: 4px solid #38bdf8; }
                        
                        .header-area { flex-direction: column; align-items: flex-start; gap: 10px; }
                        .stats-grid { grid-template-columns: 1fr; }
                        .dashboard-padding { padding: 15px !important; }
                    }
                `}
            </style>

            {/* Mobile Top Navbar */}
            <div className="mobile-top-bar">
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}><span style={{ color: '#3b82f6' }}>HCM</span> Admin</h2>
                <div onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ cursor: 'pointer', padding: '5px' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                </div>
            </div>

            {/* Mobile Dropdown Menu */}
            <div className="mobile-dropdown">
                <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => handleMenuClick('overview')}>Control Center</button>
                <button className={activeTab === 'users' ? 'active' : ''} onClick={() => handleMenuClick('users')}>Access Control</button>
                <button className={activeTab === 'attendance' ? 'active' : ''} onClick={() => handleMenuClick('attendance')}>Attendance</button>
                <button className={activeTab === 'payroll' ? 'active' : ''} onClick={() => handleMenuClick('payroll')}>Payroll Approvals</button>
                <button onClick={handleLogout} style={{ color: '#ef4444' }}>Secure Logout</button>
            </div>

            {/* Desktop Sidebar */}
            <div className="sidebar">
                <div style={{ flexDirection: 'column' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid #1e293b', background: '#0f172a', textAlign: 'center' }}>
                        <h2 style={{ color: '#ffffff', margin: 0, fontSize: '20px', fontWeight: '800' }}><span style={{ color: '#3b82f6' }}>HCM</span> Admin</h2>
                    </div>
                    <div className="desktop-menu-items">
                        <button className="sidebar-btn" onClick={() => setActiveTab('overview')} style={{ background: activeTab === 'overview' ? 'rgba(37, 99, 235, 0.1)' : 'transparent', color: activeTab === 'overview' ? '#3b82f6' : '#94a3b8', borderLeft: activeTab === 'overview' ? '4px solid #3b82f6' : '4px solid transparent' }}>Control Center</button>
                        <button className="sidebar-btn" onClick={() => setActiveTab('users')} style={{ background: activeTab === 'users' ? 'rgba(37, 99, 235, 0.1)' : 'transparent', color: activeTab === 'users' ? '#3b82f6' : '#94a3b8', borderLeft: activeTab === 'users' ? '4px solid #3b82f6' : '4px solid transparent' }}>Access Control</button>
                        <button className="sidebar-btn" onClick={() => setActiveTab('attendance')} style={{ background: activeTab === 'attendance' ? 'rgba(37, 99, 235, 0.1)' : 'transparent', color: activeTab === 'attendance' ? '#3b82f6' : '#94a3b8', borderLeft: activeTab === 'attendance' ? '4px solid #3b82f6' : '4px solid transparent' }}>Attendance Audit</button>
                        <button className="sidebar-btn" onClick={() => setActiveTab('payroll')} style={{ background: activeTab === 'payroll' ? 'rgba(37, 99, 235, 0.1)' : 'transparent', color: activeTab === 'payroll' ? '#3b82f6' : '#94a3b8', borderLeft: activeTab === 'payroll' ? '4px solid #3b82f6' : '4px solid transparent' }}>Payroll Approvals</button>
                    </div>
                </div>
                <div style={{ padding: '20px', background: '#0f172a' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '16px' }}>
                            {user?.name?.charAt(0) || 'A'}
                        </div>
                        <div>
                            <p style={{ margin: 0, color: 'white', fontSize: '14px', fontWeight: '600' }}>{user?.name || 'Super Admin'}</p>
                            <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>System Administrator</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} style={{ width: '100%', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>Secure Logout</button>
                </div>
            </div>

            <div className="main-content">
                <div className="header-area dashboard-padding" style={{ background: 'white', padding: '20px 45px', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 5 }}>
                    <div>
                        <h1 style={{ color: '#0f172a', margin: 0, fontSize: '24px', fontWeight: '700' }}>
                            {activeTab === 'overview' && 'Company Command Center'}
                            {activeTab === 'users' && 'User Access & HR Management'}
                            {activeTab === 'attendance' && 'Company-wide Attendance'}
                            {activeTab === 'payroll' && 'Payroll Approvals & Locking'}
                        </h1>
                        <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '14px' }}>{new Date().toLocaleDateString()}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        {activeTab === 'users' && (
                            <button onClick={() => setShowAddHR(true)} style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)' }}>+ Add HR Manager</button>
                        )}
                        {message && <span style={{ background: '#dcfce7', color: '#166534', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}>{message}</span>}
                        {error && <span style={{ background: '#fef2f2', color: '#991b1b', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}>{error}</span>}
                    </div>
                </div>

                <div className="dashboard-padding" style={{ padding: '35px 45px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '50px', color: '#64748b', fontSize: '16px' }}>Fetching authoritative data...</div>
                    ) : (
                        <>
                            {activeTab === 'overview' && (
                                <div>
                                    <div className="stats-grid" style={{ marginBottom: '30px' }}>
                                        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', borderTop: '4px solid #3b82f6', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                                            <h3 style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '13px' }}>TOTAL USERS</h3>
                                            <p style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: '#0f172a' }}>{stats.totalUsers}</p>
                                        </div>
                                        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', borderTop: '4px solid #8b5cf6', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                                            <h3 style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '13px' }}>ACTIVE HR MANAGERS</h3>
                                            <p style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: '#0f172a' }}>{stats.activeHRs}</p>
                                        </div>
                                        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', borderTop: '4px solid #10b981', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                                            <h3 style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '13px' }}>STAFF PRESENT</h3>
                                            <p style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: '#0f172a' }}>{stats.presentToday}</p>
                                        </div>
                                        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', borderTop: '4px solid #f59e0b', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                                            <h3 style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '13px' }}>PENDING PAYROLLS</h3>
                                            <p style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: '#0f172a' }}>{stats.pendingPayrolls}</p>
                                        </div>
                                    </div>
                                    
                                    <div style={{ background: 'white', padding: '30px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <h3 style={{ marginTop: 0, color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' }}>System Audit & Security Alerts</h3>
                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#475569', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ color: '#10b981' }}>✔️</span> All core backend systems are operational and connected.</li>
                                            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ color: '#f59e0b' }}>⚠️</span> <strong>{stats.pendingPayrolls}</strong> payroll drafts submitted by HR require your immediate review.</li>
                                            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ color: '#3b82f6' }}>🔒</span> Strict data isolation is active.</li>
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'users' && (
                                <div className="table-container">
                                    <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                                        <input type="text" placeholder="Search accounts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', maxWidth: '300px', boxSizing: 'border-box' }} />
                                    </div>
                                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '14px', minWidth: '600px' }}>
                                        <thead>
                                            <tr style={{ background: '#f8fafc', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                                                <th style={{ padding: '16px 20px' }}>Name & Email</th>
                                                <th style={{ padding: '16px 20px' }}>System Role</th>
                                                <th style={{ padding: '16px 20px' }}>Account Status</th>
                                                <th style={{ padding: '16px 20px' }}>Admin Controls</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredUsers.length > 0 ? filteredUsers.map((usr, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '16px 20px' }}>
                                                        <div style={{ fontWeight: '700', color: '#0f172a' }}>{usr.name}</div>
                                                        <div style={{ color: '#64748b', fontSize: '12px' }}>{usr.email}</div>
                                                    </td>
                                                    <td style={{ padding: '16px 20px' }}>
                                                        <span style={{ background: usr.role === 'Admin' ? '#eff6ff' : usr.role === 'HR' ? '#f5f3ff' : '#f8fafc', color: usr.role === 'Admin' ? '#2563eb' : usr.role === 'HR' ? '#7c3aed' : '#475569', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                                                            {usr.role}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '16px 20px' }}>
                                                        <span style={{ color: (usr.status === 'Active' || !usr.status) ? '#10b981' : '#ef4444', fontWeight: '700' }}>
                                                            {usr.status || 'Active'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '16px 20px' }}>
                                                        {usr.role !== 'Admin' && (
                                                            <button onClick={() => toggleUserStatus(usr._id || usr.id, usr.status || 'Active')} style={{ background: (usr.status === 'Active' || !usr.status) ? '#fff1f2' : '#ecfdf5', border: `1px solid ${(usr.status === 'Active' || !usr.status) ? '#fecaca' : '#a7f3d0'}`, padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: (usr.status === 'Active' || !usr.status) ? '#e11d48' : '#059669' }}>
                                                                {(usr.status === 'Active' || !usr.status) ? 'Suspend Access' : 'Re-Activate'}
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No user records found.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {activeTab === 'attendance' && (
                                <div className="table-container">
                                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '14px', minWidth: '600px' }}>
                                        <thead>
                                            <tr style={{ background: '#f8fafc', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                                                <th style={{ padding: '16px 20px' }}>Employee ID</th>
                                                <th style={{ padding: '16px 20px' }}>Date</th>
                                                <th style={{ padding: '16px 20px' }}>Check In</th>
                                                <th style={{ padding: '16px 20px' }}>Check Out</th>
                                                <th style={{ padding: '16px 20px' }}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {attendanceLogs.length > 0 ? attendanceLogs.map((log, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '16px 20px', fontWeight: '700', color: '#0f172a' }}>{log.employeeId?.name || log.employeeId || 'Employee'}</td>
                                                    <td style={{ padding: '16px 20px', color: '#475569' }}>{log.date}</td>
                                                    <td style={{ padding: '16px 20px', fontWeight: '600', color: '#3b82f6' }}>{log.checkInTime ? new Date(log.checkInTime).toLocaleTimeString() : '--:--'}</td>
                                                    <td style={{ padding: '16px 20px', fontWeight: '600', color: '#3b82f6' }}>{log.checkOutTime ? new Date(log.checkOutTime).toLocaleTimeString() : '--:--'}</td>
                                                    <td style={{ padding: '16px 20px' }}><span style={{ color: log.status === 'Late' ? '#ef4444' : '#10b981', fontWeight: '700' }}>{log.status}</span></td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No attendance logs available.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {activeTab === 'payroll' && (
                                <div className="table-container">
                                    <div style={{ padding: '20px 25px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                                        <h3 style={{ margin: 0, color: '#0f172a' }}>Payroll Finalization</h3>
                                        <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '13px' }}>Drafts prepared by HR require your explicit approval.</p>
                                    </div>
                                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '14px', minWidth: '700px' }}>
                                        <thead>
                                            <tr style={{ color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                                                <th style={{ padding: '16px 20px' }}>Employee</th>
                                                <th style={{ padding: '16px 20px' }}>Period</th>
                                                <th style={{ padding: '16px 20px' }}>Net Salary</th>
                                                <th style={{ padding: '16px 20px' }}>Status</th>
                                                <th style={{ padding: '16px 20px' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {payrolls.length > 0 ? payrolls.map((p, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '16px 20px', fontWeight: '700', color: '#0f172a' }}>{p.empName || 'Employee'}</td>
                                                    <td style={{ padding: '16px 20px' }}>{p.month}</td>
                                                    <td style={{ padding: '16px 20px', fontWeight: '800', color: '#10b981', fontSize: '15px' }}>Rs {p.amount || p.netPay}</td>
                                                    <td style={{ padding: '16px 20px' }}>
                                                        <span style={{ color: p.status === 'Approved & Locked' ? '#10b981' : p.status === 'Rejected' ? '#ef4444' : '#d97706', fontWeight: '700', padding: '4px 10px', background: p.status === 'Approved & Locked' ? '#ecfdf5' : p.status === 'Rejected' ? '#fef2f2' : '#fffbeb', borderRadius: '20px', fontSize: '12px' }}>
                                                            {p.status === 'Approved & Locked' ? 'Approved & Locked' : p.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '16px 20px', display: 'flex', gap: '10px' }}>
                                                        {p.status === 'Pending Admin Approval' ? (
                                                            <>
                                                                <button onClick={() => handleApprovePayroll(p._id || p.id)} style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px', boxShadow: '0 2px 4px rgba(37,99,235,0.2)' }}>Approve & Lock</button>
                                                                <button onClick={() => handleRejectPayroll(p._id || p.id)} style={{ padding: '8px 16px', background: 'transparent', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}>Reject</button>
                                                            </>
                                                        ) : (
                                                            <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>Completed</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No payroll drafts awaiting approval.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* ADD HR MODAL */}
            {showAddHR && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: '20px' }}>
                    <div style={{ background: 'white', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '450px' }}>
                        <h2 style={{ margin: '0 0 20px 0', color: '#0f172a' }}>Authorize HR Manager</h2>
                        <form onSubmit={handleRegisterHR} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <input type="text" required placeholder="Full Name" value={newHR.name} onChange={(e) => setNewHR({...newHR, name: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                            <input type="email" required placeholder="Official Email Address" value={newHR.email} onChange={(e) => setNewHR({...newHR, email: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                            <input type="password" required placeholder="Initial Secure Password" value={newHR.password} onChange={(e) => setNewHR({...newHR, password: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                            
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={() => setShowAddHR(false)} style={{ flex: 1, padding: '14px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>Cancel</button>
                                <button type="submit" style={{ flex: 1, padding: '14px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>Authorize Account</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;