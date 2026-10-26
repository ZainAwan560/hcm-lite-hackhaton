/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const EmployeeDashboard = () => {
    const { user } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('overview');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    
    // Mobile menu toggle
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const [attendanceLogs, setAttendanceLogs] = useState([]);
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [payrolls, setPayrolls] = useState([]);
    
    const [todayStatus, setTodayStatus] = useState('Not Checked In');
    const [checkInTime, setCheckInTime] = useState('--:--');
    const [checkOutTime, setCheckOutTime] = useState('--:--');
    const [newLeave, setNewLeave] = useState({ type: 'Annual', startDate: '', endDate: '', reason: '' });

    const fetchMyData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const [attRes, leavesRes, payrollsRes] = await Promise.allSettled([
                axios.get('http://localhost:5000/api/attendance/me', { headers }),
                axios.get('http://localhost:5000/api/leaves/me', { headers }),
                axios.get('http://localhost:5000/api/payroll/me', { headers })
            ]);

            if (attRes.status === 'fulfilled') {
                const logs = attRes.value.data || [];
                setAttendanceLogs(logs);
                
                // Exactly matching the backend date format
                const td = new Date();
                const today = `${td.getFullYear()}-${String(td.getMonth() + 1).padStart(2, '0')}-${String(td.getDate()).padStart(2, '0')}`;
                
                const todayLog = logs.find(log => log.date === today);
                if (todayLog) {
                    setTodayStatus(todayLog.checkOutTime ? 'Checked Out' : 'Checked In');
                    if(todayLog.checkInTime) setCheckInTime(new Date(todayLog.checkInTime).toLocaleTimeString());
                    if(todayLog.checkOutTime) setCheckOutTime(new Date(todayLog.checkOutTime).toLocaleTimeString());
                } else {
                    setTodayStatus('Not Checked In');
                    setCheckInTime('--:--');
                    setCheckOutTime('--:--');
                }
            }
            if (leavesRes.status === 'fulfilled') setLeaveRequests(leavesRes.value.data || []);
            if (payrollsRes.status === 'fulfilled') {
                const approvedSlips = (payrollsRes.value.data || []).filter(p => p.status === 'Approved & Locked');
                setPayrolls(approvedSlips);
            }
        } catch (err) {
            console.error(err);
            setError("Live server se connect hone mein masla aa raha hai.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMyData(); }, []);

    const showMsg = (msg, isError = false) => {
        if (isError) setError(msg);
        else setMessage(msg);
        setTimeout(() => { setMessage(''); setError(''); }, 4500);
    };

    const handleAttendance = async (action) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`http://localhost:5000/api/attendance/${action}`, {}, { headers: { Authorization: `Bearer ${token}` } });
            showMsg(res.data.message);
            fetchMyData(); // Live refresh
        } catch (err) {
            showMsg(err.response?.data?.message || `Error: Attendance mark nahi ho saki.`, true);
        }
    };

    const submitLeaveRequest = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/leaves/apply', newLeave, { headers: { Authorization: `Bearer ${token}` } });
            showMsg('Leave application HR ko bhej di gayi hai.');
            setNewLeave({ type: 'Annual', startDate: '', endDate: '', reason: '' });
            fetchMyData();
        } catch (err) {
            console.error(err);
            showMsg('Leave submit karne mein error aaya.', true);
        }
    };

    const handleLogout = () => { localStorage.clear(); window.location.href = '/'; };
    const printPayslip = () => { window.print(); };

    // Function to handle tab click (closes mobile menu automatically)
    const handleMenuClick = (tabId) => {
        setActiveTab(tabId);
        setMobileMenuOpen(false);
    };

    return (
        <div className="dashboard-layout" style={{ backgroundColor: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>
            <style>
                {`
                    .dashboard-layout { display: flex; flex-direction: row; min-height: 100vh; width: 100vw; overflow-x: hidden; }
                    .sidebar { width: 280px; min-width: 280px; background: #020617; display: flex; flex-direction: column; justify-content: space-between; z-index: 20; box-shadow: 4px 0 15px rgba(0,0,0,0.05); }
                    .sidebar-btn { width: 100%; display: flex; align-items: center; gap: 14px; padding: 16px 24px; border: none; text-align: left; cursor: pointer; font-size: 15px; font-weight: 500; transition: all 0.2s; }
                    .main-content { flex: 1; overflow-y: auto; width: 100%; }
                    .header-area { display: flex; justify-content: space-between; align-items: center; }
                    .table-container { width: 100%; overflow-x: auto; background: white; border-radius: 16px; border: 1px solid #e2e8f0; }
                    .grid-container { display: grid; gap: 20px; }
                    .grid-2 { grid-template-columns: 1fr 1fr; }
                    .grid-4 { grid-template-columns: repeat(4, 1fr); }
                    .mobile-top-bar { display: none; }
                    .mobile-dropdown { display: none; }
                    .desktop-menu-items { display: flex; flex-direction: column; }
                    
                    @media (max-width: 992px) { .grid-4 { grid-template-columns: repeat(2, 1fr); } .grid-2 { grid-template-columns: 1fr; } }
                    @media (max-width: 768px) {
                        .dashboard-layout { flex-direction: column; }
                        .sidebar { display: none; } /* Hide default sidebar on mobile */
                        .mobile-top-bar { display: flex; justify-content: space-between; align-items: center; background: #020617; padding: 15px 20px; color: white; position: sticky; top: 0; z-index: 50; }
                        
                        /* Mobile Dropdown Menu */
                        .mobile-dropdown { display: ${mobileMenuOpen ? 'flex' : 'none'}; flex-direction: column; background: #0f172a; position: fixed; top: 60px; left: 0; right: 0; z-index: 40; border-bottom: 1px solid #1e293b; }
                        .mobile-dropdown button { padding: 15px 20px; color: #94a3b8; border: none; border-bottom: 1px solid #1e293b; background: transparent; text-align: left; font-size: 16px; font-weight: 500; }
                        .mobile-dropdown button.active { color: #38bdf8; background: #1e293b; border-left: 4px solid #38bdf8; }
                        
                        .header-area { flex-direction: column; align-items: flex-start; gap: 10px; }
                        .grid-4 { grid-template-columns: 1fr; }
                        .dashboard-padding { padding: 15px !important; }
                    }
                `}
            </style>

            {/* Mobile Top Navbar (Only visible on mobile) */}
            <div className="mobile-top-bar">
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}><span style={{ color: '#38bdf8' }}>HCM</span> Portal</h2>
                <div onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ cursor: 'pointer', padding: '5px' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                </div>
            </div>

            {/* Mobile Dropdown Menu Items */}
            <div className="mobile-dropdown">
                <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => handleMenuClick('overview')}>My Profile</button>
                <button className={activeTab === 'attendance' ? 'active' : ''} onClick={() => handleMenuClick('attendance')}>Attendance</button>
                <button className={activeTab === 'leaves' ? 'active' : ''} onClick={() => handleMenuClick('leaves')}>Leave Management</button>
                <button className={activeTab === 'payroll' ? 'active' : ''} onClick={() => handleMenuClick('payroll')}>My Payslips</button>
                <button onClick={handleLogout} style={{ color: '#ef4444' }}>Secure Logout</button>
            </div>

            {/* Desktop Sidebar */}
            <div className="sidebar">
                <div style={{ flexDirection: 'column' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid #1e293b', background: '#0f172a', textAlign: 'center' }}>
                        <h2 style={{ color: '#ffffff', margin: 0, fontSize: '20px', fontWeight: '800' }}><span style={{ color: '#38bdf8' }}>HCM</span> Portal</h2>
                    </div>
                    <div className="desktop-menu-items">
                        <button className="sidebar-btn" onClick={() => setActiveTab('overview')} style={{ background: activeTab === 'overview' ? '#1e293b' : 'transparent', color: activeTab === 'overview' ? '#38bdf8' : '#94a3b8', borderLeft: activeTab === 'overview' ? '4px solid #38bdf8' : '4px solid transparent' }}>My Profile</button>
                        <button className="sidebar-btn" onClick={() => setActiveTab('attendance')} style={{ background: activeTab === 'attendance' ? '#1e293b' : 'transparent', color: activeTab === 'attendance' ? '#38bdf8' : '#94a3b8', borderLeft: activeTab === 'attendance' ? '4px solid #38bdf8' : '4px solid transparent' }}>Attendance</button>
                        <button className="sidebar-btn" onClick={() => setActiveTab('leaves')} style={{ background: activeTab === 'leaves' ? '#1e293b' : 'transparent', color: activeTab === 'leaves' ? '#38bdf8' : '#94a3b8', borderLeft: activeTab === 'leaves' ? '4px solid #38bdf8' : '4px solid transparent' }}>Leave Management</button>
                        <button className="sidebar-btn" onClick={() => setActiveTab('payroll')} style={{ background: activeTab === 'payroll' ? '#1e293b' : 'transparent', color: activeTab === 'payroll' ? '#38bdf8' : '#94a3b8', borderLeft: activeTab === 'payroll' ? '4px solid #38bdf8' : '4px solid transparent' }}>My Payslips</button>
                    </div>
                </div>
                <div style={{ padding: '20px', background: '#0f172a' }}>
                    <button onClick={handleLogout} style={{ width: '100%', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Secure Logout</button>
                </div>
            </div>

            <div className="main-content">
                <div className="header-area dashboard-padding" style={{ background: 'white', padding: '20px 45px', borderBottom: '1px solid #e2e8f0' }}>
                    <div>
                        <h1 style={{ color: '#0f172a', margin: 0, fontSize: '24px', fontWeight: '700' }}>
                            {activeTab === 'overview' && 'Employee Dashboard'}
                            {activeTab === 'attendance' && 'Time & Attendance'}
                            {activeTab === 'leaves' && 'Leave Applications'}
                            {activeTab === 'payroll' && 'Salary Slips'}
                        </h1>
                    </div>
                    <div>
                        {message && <span style={{ background: '#dcfce7', color: '#166534', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}>{message}</span>}
                        {error && <span style={{ background: '#fef2f2', color: '#991b1b', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}>{error}</span>}
                    </div>
                </div>

                <div className="dashboard-padding" style={{ padding: '35px 45px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>Loading data...</div>
                    ) : (
                        <>
                            {activeTab === 'overview' && (
                                <div className="table-container" style={{ overflow: 'hidden' }}>
                                    <div style={{ height: '140px', background: 'linear-gradient(90deg, #1e293b 0%, #334155 100%)', position: 'relative' }}>
                                        <div style={{ position: 'absolute', bottom: '-40px', left: '30px', width: '90px', height: '90px', borderRadius: '50%', background: 'white', padding: '4px' }}>
                                            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'linear-gradient(135deg, #0ea5e9, #2563eb)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '32px', fontWeight: 'bold' }}>
                                                {user?.name?.charAt(0) || 'E'}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ padding: '60px 30px 30px 30px', borderBottom: '1px solid #e2e8f0' }}>
                                        <h2 style={{ margin: '0 0 5px 0', color: '#0f172a', fontSize: '24px', fontWeight: '800' }}>{user?.name}</h2>
                                        <p style={{ margin: 0, color: '#3b82f6', fontWeight: '600' }}>{user?.email}</p>
                                        <span style={{ display: 'inline-block', marginTop: '15px', background: '#ecfdf5', color: '#059669', padding: '6px 15px', borderRadius: '8px', fontWeight: '700', fontSize: '13px' }}>Active Employee</span>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'attendance' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                                    <div style={{ background: 'white', padding: '30px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                        <h3 style={{ margin: '0 0 20px 0', color: '#0f172a' }}>Time Clock (8:00 AM Office Time)</h3>
                                        <div className="grid-container grid-4" style={{ marginBottom: '20px' }}>
                                            <div>
                                                <p style={{ margin: '0 0 5px 0', color: '#64748b', fontSize: '13px' }}>Current Status</p>
                                                <h4 style={{ margin: 0, color: todayStatus === 'Checked In' ? '#10b981' : todayStatus === 'Checked Out' ? '#f59e0b' : '#ef4444', fontSize: '18px' }}>{todayStatus}</h4>
                                            </div>
                                            <div>
                                                <p style={{ margin: '0 0 5px 0', color: '#64748b', fontSize: '13px' }}>Check-In Time</p>
                                                <h4 style={{ margin: 0, color: '#0f172a', fontSize: '18px' }}>{checkInTime}</h4>
                                            </div>
                                            <div>
                                                <p style={{ margin: '0 0 5px 0', color: '#64748b', fontSize: '13px' }}>Check-Out Time</p>
                                                <h4 style={{ margin: 0, color: '#0f172a', fontSize: '18px' }}>{checkOutTime}</h4>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                                            <button onClick={() => handleAttendance('checkin')} disabled={todayStatus === 'Checked In' || todayStatus === 'Checked Out'} style={{ flex: 1, padding: '16px', background: todayStatus === 'Checked In' || todayStatus === 'Checked Out' ? '#cbd5e1' : '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: todayStatus === 'Checked In' || todayStatus === 'Checked Out' ? 'not-allowed' : 'pointer' }}>Mark Check In</button>
                                            <button onClick={() => handleAttendance('checkout')} disabled={todayStatus === 'Not Checked In' || todayStatus === 'Checked Out'} style={{ flex: 1, padding: '16px', background: todayStatus === 'Not Checked In' || todayStatus === 'Checked Out' ? '#cbd5e1' : '#f59e0b', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: todayStatus === 'Not Checked In' || todayStatus === 'Checked Out' ? 'not-allowed' : 'pointer' }}>Mark Check Out</button>
                                        </div>
                                    </div>

                                    <div className="table-container">
                                        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}><h3 style={{ margin: 0 }}>Attendance Log</h3></div>
                                        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '14px', minWidth: '500px' }}>
                                            <thead>
                                                <tr style={{ color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                                                    <th style={{ padding: '16px 20px' }}>Date</th>
                                                    <th style={{ padding: '16px 20px' }}>Check-In</th>
                                                    <th style={{ padding: '16px 20px' }}>Check-Out</th>
                                                    <th style={{ padding: '16px 20px' }}>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {attendanceLogs.map((log, i) => (
                                                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                        <td style={{ padding: '16px 20px', fontWeight: '600', color: '#334155' }}>{log.date}</td>
                                                        <td style={{ padding: '16px 20px' }}>{log.checkInTime ? new Date(log.checkInTime).toLocaleTimeString() : '--:--'}</td>
                                                        <td style={{ padding: '16px 20px' }}>{log.checkOutTime ? new Date(log.checkOutTime).toLocaleTimeString() : '--:--'}</td>
                                                        <td style={{ padding: '16px 20px' }}><span style={{ color: log.status === 'Late' ? '#ef4444' : '#10b981', fontWeight: '700' }}>{log.status}</span></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'leaves' && (
                                <div className="grid-container grid-2">
                                    <div style={{ background: 'white', padding: '30px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                        <h3 style={{ margin: '0 0 20px 0' }}>Request Leave</h3>
                                        <form onSubmit={submitLeaveRequest} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            <select required value={newLeave.type} onChange={(e) => setNewLeave({...newLeave, type: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                                                <option value="Annual">Annual Leave</option>
                                                <option value="Sick">Sick Leave</option>
                                                <option value="Casual">Casual Leave</option>
                                            </select>
                                            <input type="date" required value={newLeave.startDate} onChange={(e) => setNewLeave({...newLeave, startDate: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                                            <input type="date" required value={newLeave.endDate} onChange={(e) => setNewLeave({...newLeave, endDate: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                                            <textarea required rows="3" value={newLeave.reason} onChange={(e) => setNewLeave({...newLeave, reason: e.target.value})} placeholder="Reason..." style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}></textarea>
                                            <button type="submit" style={{ padding: '14px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700' }}>Submit Request</button>
                                        </form>
                                    </div>
                                    <div>
                                        {leaveRequests.map((req, i) => (
                                            <div key={i} style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
                                                <strong>{req.leaveType} Leave</strong> - <span style={{ color: req.status === 'Approved' ? '#166534' : '#d97706', fontWeight: '700' }}>{req.status}</span>
                                                <p style={{ margin: '10px 0 0 0', fontSize: '13px' }}>{new Date(req.startDate).toLocaleDateString()} to {new Date(req.endDate).toLocaleDateString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'payroll' && (
                                <div className="table-container">
                                    <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}><h3 style={{ margin: 0 }}>Approved Payslips</h3></div>
                                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '14px', minWidth: '500px' }}>
                                        <thead>
                                            <tr style={{ color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                                                <th style={{ padding: '16px 20px' }}>Month</th>
                                                <th style={{ padding: '16px 20px' }}>Net Pay</th>
                                                <th style={{ padding: '16px 20px' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {payrolls.map((p, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '16px 20px', fontWeight: '700' }}>{p.month}</td>
                                                    <td style={{ padding: '16px 20px', fontWeight: '800', color: '#10b981' }}>Rs {p.netPay || p.amount}</td>
                                                    <td style={{ padding: '16px 20px' }}><button onClick={printPayslip} style={{ padding: '8px 16px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}>Print PDF</button></td>
                                                </tr>
                                            ))}
                                            {payrolls.length === 0 && <tr><td colSpan="3" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>No approved payslips available.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
export default EmployeeDashboard;