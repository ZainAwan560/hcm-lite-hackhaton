/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const HRDashboard = () => {
    const { user } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('overview');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    // Mobile menu toggle state
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const [stats, setStats] = useState({ totalEmployees: 0, presentToday: 0, absentToday: 0, pendingLeaves: 0, payrollStatus: 'Drafting Phase' });
    const [employees, setEmployees] = useState([]);
    const [attendanceLogs, setAttendanceLogs] = useState([]);
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [payrolls, setPayrolls] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const [showAddEmployee, setShowAddEmployee] = useState(false);
    const [newEmp, setNewEmp] = useState({ name: '', email: '', password: '', department: '', designation: '', basicSalary: '', joiningDate: '' });

    const [draftPayroll, setDraftPayroll] = useState({ userId: '', empName: '', month: '', basicSalary: '', deductions: 0 });

    const fetchAllHRData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const [usersRes, attRes, leavesRes, payrollsRes] = await Promise.allSettled([
                axios.get('http://localhost:5000/api/auth/users', { headers }),
                axios.get('http://localhost:5000/api/attendance/all', { headers }),
                axios.get('http://localhost:5000/api/leaves/all', { headers }),
                axios.get('http://localhost:5000/api/payroll/all', { headers })
            ]);

            let fetchedEmployees = [];
            let fetchedLeaves = [];

            if (usersRes.status === 'fulfilled') {
                fetchedEmployees = usersRes.value.data.filter(u => u.role === 'Employee') || [];
                setEmployees(fetchedEmployees);
            }
            if (attRes.status === 'fulfilled') setAttendanceLogs(attRes.value.data || []);
            if (leavesRes.status === 'fulfilled') {
                fetchedLeaves = leavesRes.value.data || [];
                setLeaveRequests(fetchedLeaves);
            }
            if (payrollsRes.status === 'fulfilled') setPayrolls(payrollsRes.value.data || []);

            const today = new Date().toLocaleDateString('en-CA');

            setStats({
                totalEmployees: fetchedEmployees.length,
                presentToday: attRes.status === 'fulfilled' ? attRes.value.data.filter(a => a.checkInTime && a.date === today).length : 0,
                absentToday: attRes.status === 'fulfilled' ? attRes.value.data.filter(a => !a.checkInTime && a.date === today).length : 0,
                pendingLeaves: fetchedLeaves.filter(l => l.status === 'Pending').length,
                payrollStatus: 'Pending Admin Approval'
            });

        } catch (err) {
            console.error(err);
            setError("Failed to load company data. Check backend connections.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllHRData();
    }, []);

    const showMsg = (msg, isError = false) => {
        if (isError) setError(msg);
        else setMessage(msg);
        setTimeout(() => { setMessage(''); setError(''); }, 4000);
    };

    const handleRegisterEmployee = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/employees/register', { ...newEmp, role: 'Employee' }, { headers: { Authorization: `Bearer ${token}` } });
            showMsg('New Employee Registered Successfully!');
            setShowAddEmployee(false);
            setNewEmp({ name: '', email: '', password: '', department: '', designation: '', basicSalary: '', joiningDate: '' });
            fetchAllHRData();
        } catch (err) {
            showMsg(err.response?.data?.message || 'Failed to register employee', true);
        }
    };

    const handleLeaveAction = async (id, action) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/leaves/${id}/status`, { status: action }, { headers: { Authorization: `Bearer ${token}` } });
            showMsg(`Leave request has been ${action}.`);
            fetchAllHRData();
        } catch (err) {
            console.error(err);
            showMsg(`Error updating leave on server.`, true);
        }
    };

    const handleGenerateDraft = async (e) => {
        e.preventDefault();
        if (!draftPayroll.userId) return showMsg("Please select an employee from the dropdown!", true);

        try {
            const token = localStorage.getItem('token');
            const netPay = Number(draftPayroll.basicSalary) - Number(draftPayroll.deductions);

            const payload = {
                userId: draftPayroll.userId,
                empName: draftPayroll.empName,
                month: draftPayroll.month,
                basicSalary: draftPayroll.basicSalary,
                deductions: draftPayroll.deductions,
                netPay: netPay,
                status: 'Pending Admin Approval'
            };

            await axios.post('http://localhost:5000/api/payroll/draft', payload, { headers: { Authorization: `Bearer ${token}` } });
            showMsg('Draft Payslip successfully generated and forwarded to Admin for approval.');
            setDraftPayroll({ userId: '', empName: '', month: '', basicSalary: '', deductions: 0 });
            fetchAllHRData();
        } catch (err) {
            console.error(err);
            showMsg('Backend Error: Failed to generate draft. Ensure backend is running.', true);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/';
    };

    // Mobile Menu handler
    const handleMenuClick = (tabId) => {
        setActiveTab(tabId);
        setMobileMenuOpen(false);
    };

    const filteredEmployees = employees.filter(emp => emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) || emp.email?.toLowerCase().includes(searchTerm.toLowerCase()));

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
                        .sidebar { display: none; } 
                        .mobile-top-bar { display: flex; justify-content: space-between; align-items: center; background: #020617; padding: 15px 20px; color: white; position: sticky; top: 0; z-index: 50; }
                        
                        .mobile-dropdown { display: ${mobileMenuOpen ? 'flex' : 'none'}; flex-direction: column; background: #0f172a; position: fixed; top: 60px; left: 0; right: 0; z-index: 40; border-bottom: 1px solid #1e293b; }
                        .mobile-dropdown button { padding: 15px 20px; color: #94a3b8; border: none; border-bottom: 1px solid #1e293b; background: transparent; text-align: left; font-size: 16px; font-weight: 500; }
                        .mobile-dropdown button.active { color: #38bdf8; background: #1e293b; border-left: 4px solid #38bdf8; }
                        
                        .header-area { flex-direction: column; align-items: flex-start; gap: 10px; }
                        .grid-4 { grid-template-columns: 1fr; }
                        .dashboard-padding { padding: 15px !important; }
                    }
                `}
            </style>

            {/* Mobile Top Navbar */}
            <div className="mobile-top-bar">
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}><span style={{ color: '#38bdf8' }}>HCM</span> HR Ops</h2>
                <div onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ cursor: 'pointer', padding: '5px' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                </div>
            </div>

            {/* Mobile Dropdown Menu */}
            <div className="mobile-dropdown">
                <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => handleMenuClick('overview')}>Dashboard</button>
                <button className={activeTab === 'employees' ? 'active' : ''} onClick={() => handleMenuClick('employees')}>Employee Directory</button>
                <button className={activeTab === 'attendance' ? 'active' : ''} onClick={() => handleMenuClick('attendance')}>Attendance Monitor</button>
                <button className={activeTab === 'leaves' ? 'active' : ''} onClick={() => handleMenuClick('leaves')}>Leave Approvals</button>
                <button className={activeTab === 'payroll' ? 'active' : ''} onClick={() => handleMenuClick('payroll')}>Payroll Processing</button>
                <button onClick={handleLogout} style={{ color: '#ef4444' }}>Secure Logout</button>
            </div>

            {/* Desktop Sidebar */}
            <div className="sidebar">
                <div style={{ flexDirection: 'column' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid #1e293b', background: '#0f172a', textAlign: 'center' }}>
                        <h2 style={{ color: '#ffffff', margin: 0, fontSize: '20px', fontWeight: '800' }}><span style={{ color: '#38bdf8' }}>HCM</span> HR Ops</h2>
                    </div>
                    <div className="desktop-menu-items">
                        <button className="sidebar-btn" onClick={() => setActiveTab('overview')} style={{ background: activeTab === 'overview' ? '#1e293b' : 'transparent', color: activeTab === 'overview' ? '#38bdf8' : '#94a3b8', borderLeft: activeTab === 'overview' ? '4px solid #38bdf8' : '4px solid transparent' }}>Dashboard</button>
                        <button className="sidebar-btn" onClick={() => setActiveTab('employees')} style={{ background: activeTab === 'employees' ? '#1e293b' : 'transparent', color: activeTab === 'employees' ? '#38bdf8' : '#94a3b8', borderLeft: activeTab === 'employees' ? '4px solid #38bdf8' : '4px solid transparent' }}>Employee Directory</button>
                        <button className="sidebar-btn" onClick={() => setActiveTab('attendance')} style={{ background: activeTab === 'attendance' ? '#1e293b' : 'transparent', color: activeTab === 'attendance' ? '#38bdf8' : '#94a3b8', borderLeft: activeTab === 'attendance' ? '4px solid #38bdf8' : '4px solid transparent' }}>Attendance Monitor</button>
                        <button className="sidebar-btn" onClick={() => setActiveTab('leaves')} style={{ background: activeTab === 'leaves' ? '#1e293b' : 'transparent', color: activeTab === 'leaves' ? '#38bdf8' : '#94a3b8', borderLeft: activeTab === 'leaves' ? '4px solid #38bdf8' : '4px solid transparent' }}>Leave Approvals</button>
                        <button className="sidebar-btn" onClick={() => setActiveTab('payroll')} style={{ background: activeTab === 'payroll' ? '#1e293b' : 'transparent', color: activeTab === 'payroll' ? '#38bdf8' : '#94a3b8', borderLeft: activeTab === 'payroll' ? '4px solid #38bdf8' : '4px solid transparent' }}>Payroll Processing</button>
                    </div>
                </div>
                <div style={{ padding: '20px', background: '#0f172a' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #8b5cf6, #4f46e5)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '16px' }}>
                            {user?.name?.charAt(0) || 'H'}
                        </div>
                        <div>
                            <p style={{ margin: 0, color: 'white', fontSize: '14px', fontWeight: '600' }}>{user?.name || 'HR Manager'}</p>
                            <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>Human Resources</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} style={{ width: '100%', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>Secure Logout</button>
                </div>
            </div>

            <div className="main-content">
                <div className="header-area dashboard-padding" style={{ background: 'white', padding: '20px 45px', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 5 }}>
                    <div>
                        <h1 style={{ color: '#0f172a', margin: 0, fontSize: '24px', fontWeight: '700' }}>
                            {activeTab === 'overview' && 'HR Operations Dashboard'}
                            {activeTab === 'employees' && 'Company Directory'}
                            {activeTab === 'attendance' && 'Company-wide Attendance Monitor'}
                            {activeTab === 'leaves' && 'Leave Applications Review'}
                            {activeTab === 'payroll' && 'Payroll Preparation & Drafting'}
                        </h1>
                        <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '14px' }}>{new Date().toLocaleDateString()}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        {activeTab === 'employees' && (
                            <button onClick={() => setShowAddEmployee(true)} style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }}>+ Register Employee</button>
                        )}
                        {message && <span style={{ background: '#dcfce7', color: '#166534', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}>{message}</span>}
                        {error && <span style={{ background: '#fef2f2', color: '#991b1b', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}>{error}</span>}
                    </div>
                </div>

                <div className="dashboard-padding" style={{ padding: '35px 45px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '50px', color: '#64748b', fontSize: '16px' }}>Syncing HR data from server...</div>
                    ) : (
                        <>
                            {activeTab === 'overview' && (
                                <div>
                                    <div className="grid-container grid-4" style={{ marginBottom: '30px' }}>
                                        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', borderBottom: '4px solid #3b82f6', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                                            <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', fontWeight: '600' }}>Total Workforce</p>
                                            <h3 style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: '#0f172a' }}>{stats.totalEmployees}</h3>
                                        </div>
                                        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', borderBottom: '4px solid #10b981', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                                            <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', fontWeight: '600' }}>Present Today</p>
                                            <h3 style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: '#0f172a' }}>{stats.presentToday}</h3>
                                        </div>
                                        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', borderBottom: '4px solid #f59e0b', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                                            <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', fontWeight: '600' }}>Pending Leaves</p>
                                            <h3 style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: '#0f172a' }}>{stats.pendingLeaves}</h3>
                                        </div>
                                        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', borderBottom: '4px solid #ef4444', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                                            <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', fontWeight: '600' }}>Absent / Late</p>
                                            <h3 style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: '#0f172a' }}>{stats.absentToday}</h3>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'employees' && (
                                <div className="table-container">
                                    <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                                        <input type="text" placeholder="Search by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', maxWidth: '300px' }} />
                                    </div>
                                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '14px', minWidth: '600px' }}>
                                        <thead>
                                            <tr style={{ color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                                                <th style={{ padding: '16px 20px' }}>Employee Details</th>
                                                <th style={{ padding: '16px 20px' }}>Role</th>
                                                <th style={{ padding: '16px 20px' }}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredEmployees.length > 0 ? filteredEmployees.map((emp, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '16px 20px' }}>
                                                        <div style={{ fontWeight: '700', color: '#0f172a' }}>{emp.name}</div>
                                                        <div style={{ color: '#64748b', fontSize: '12px' }}>{emp.email} | {emp._id?.substring(0, 8).toUpperCase()}</div>
                                                    </td>
                                                    <td style={{ padding: '16px 20px' }}>
                                                        <div style={{ color: '#334155', fontWeight: '600' }}>{emp.designation || 'Staff'}</div>
                                                    </td>
                                                    <td style={{ padding: '16px 20px' }}><span style={{ background: '#ecfdf5', color: '#10b981', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>Active</span></td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan="3" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No employees found.</td></tr>
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
                                                <th style={{ padding: '16px 20px' }}>Employee Name</th>
                                                <th style={{ padding: '16px 20px' }}>Date</th>
                                                <th style={{ padding: '16px 20px' }}>Check-In Time</th>
                                                <th style={{ padding: '16px 20px' }}>Check-Out Time</th>
                                                <th style={{ padding: '16px 20px' }}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {attendanceLogs.length > 0 ? attendanceLogs.map((log, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '16px 20px', fontWeight: '700', color: '#0f172a' }}>{log.employeeId?.name || log.employeeId || 'Employee'}</td>
                                                    <td style={{ padding: '16px 20px', color: '#475569' }}>{log.date}</td>
                                                    <td style={{ padding: '16px 20px', fontWeight: '600', color: '#334155' }}>{log.checkInTime ? new Date(log.checkInTime).toLocaleTimeString() : '--:--'}</td>
                                                    <td style={{ padding: '16px 20px', fontWeight: '600', color: '#334155' }}>{log.checkOutTime ? new Date(log.checkOutTime).toLocaleTimeString() : 'Active Shift'}</td>
                                                    <td style={{ padding: '16px 20px' }}>
                                                        <span style={{ color: log.status === 'Late' ? '#f59e0b' : '#10b981', fontWeight: '700' }}>{log.status || 'Present'}</span>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No attendance records found.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {activeTab === 'leaves' && (
                                <div className="grid-container grid-2">
                                    {leaveRequests.length > 0 ? leaveRequests.map((req, i) => (
                                        <div key={i} style={{ background: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                                <div>
                                                    <h4 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#0f172a' }}>{req.employeeId?.name || 'Employee Request'}</h4>
                                                    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>{req.leaveType} Leave</span>
                                                </div>
                                                <span style={{ background: req.status === 'Pending' ? '#fef3c7' : req.status === 'Approved' ? '#dcfce7' : '#fee2e2', color: req.status === 'Pending' ? '#d97706' : req.status === 'Approved' ? '#166534' : '#991b1b', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', height: 'fit-content' }}>
                                                    {req.status}
                                                </span>
                                            </div>
                                            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #f1f5f9' }}>
                                                <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#475569' }}><strong>Duration:</strong> {new Date(req.startDate).toLocaleDateString()} to {new Date(req.endDate).toLocaleDateString()}</p>
                                                <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontStyle: 'italic' }}>"{req.reason}"</p>
                                            </div>
                                            {req.status === 'Pending' && (
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button onClick={() => handleLeaveAction(req._id || req.id, 'Approved')} style={{ flex: 1, background: '#10b981', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Approve</button>
                                                    <button onClick={() => handleLeaveAction(req._id || req.id, 'Rejected')} style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Reject</button>
                                                </div>
                                            )}
                                        </div>
                                    )) : (
                                        <div style={{ gridColumn: '1 / -1', padding: '50px', textAlign: 'center', color: '#94a3b8', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0' }}>No leave requests pending.</div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'payroll' && (
                                <div className="grid-container grid-2" style={{ alignItems: 'flex-start' }}>
                                    <div style={{ background: 'white', padding: '30px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                                        <h3 style={{ margin: '0 0 5px 0', color: '#0f172a' }}>Prepare Salary Draft</h3>
                                        <p style={{ margin: '0 0 25px 0', color: '#64748b', fontSize: '13px' }}>Drafts will be forwarded to Admin for approval.</p>

                                        <form onSubmit={handleGenerateDraft} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>Select Employee</label>
                                                <select required value={draftPayroll.userId} onChange={e => {
                                                    const emp = employees.find(el => el._id === e.target.value);
                                                    if(emp) setDraftPayroll({...draftPayroll, userId: emp._id, empName: emp.name});
                                                }} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc' }}>
                                                    <option value="">-- Choose Employee --</option>
                                                    {employees.map(emp => (
                                                        <option key={emp._id} value={emp._id}>{emp.name} ({emp.email})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>Month & Year</label>
                                                <input type="text" placeholder="e.g. October 2026" required value={draftPayroll.month} onChange={e => setDraftPayroll({ ...draftPayroll, month: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                                            </div>
                                            <div style={{ display: 'flex', gap: '15px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>Basic Salary (Rs)</label>
                                                    <input type="number" required value={draftPayroll.basicSalary} onChange={e => setDraftPayroll({ ...draftPayroll, basicSalary: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>Deductions (Rs)</label>
                                                    <input type="number" required value={draftPayroll.deductions} onChange={e => setDraftPayroll({ ...draftPayroll, deductions: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                                                </div>
                                            </div>
                                            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontWeight: '600', color: '#475569' }}>Calculated Net Pay:</span>
                                                <span style={{ fontWeight: '800', fontSize: '18px', color: '#10b981' }}>Rs {Number(draftPayroll.basicSalary) - Number(draftPayroll.deductions) || 0}</span>
                                            </div>
                                            <button type="submit" style={{ padding: '14px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', marginTop: '10px' }}>
                                                Submit to Admin
                                            </button>
                                        </form>
                                    </div>

                                    <div className="table-container" style={{ alignSelf: 'stretch' }}>
                                        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                                            <h3 style={{ margin: 0, color: '#0f172a' }}>Payroll Records Overview</h3>
                                        </div>
                                        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '14px', minWidth: '400px' }}>
                                            <thead>
                                                <tr style={{ color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                                                    <th style={{ padding: '16px 20px' }}>Employee</th>
                                                    <th style={{ padding: '16px 20px' }}>Net Pay</th>
                                                    <th style={{ padding: '16px 20px' }}>Admin Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {payrolls.length > 0 ? payrolls.map((p, i) => (
                                                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                        <td style={{ padding: '16px 20px' }}>
                                                            <div style={{ fontWeight: '700', color: '#0f172a' }}>{p.empName || 'Employee'}</div>
                                                            <div style={{ fontSize: '12px', color: '#64748b' }}>{p.month}</div>
                                                        </td>
                                                        <td style={{ padding: '16px 20px', fontWeight: '700', color: '#10b981' }}>Rs {p.netPay || p.amount}</td>
                                                        <td style={{ padding: '16px 20px' }}>
                                                            <span style={{ color: p.status === 'Approved & Locked' ? '#10b981' : '#d97706', fontWeight: '700', fontSize: '13px' }}>
                                                                {p.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr><td colSpan="3" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No payroll data found.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* REGISTER EMPLOYEE MODAL */}
            {showAddEmployee && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: '20px' }}>
                    <div style={{ background: 'white', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '500px', overflowY: 'auto', maxHeight: '90vh' }}>
                        <h2 style={{ margin: '0 0 20px 0', color: '#0f172a' }}>Register Employee</h2>
                        <form onSubmit={handleRegisterEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <input type="text" required placeholder="Full Name" value={newEmp.name} onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                            <input type="email" required placeholder="Email Address" value={newEmp.email} onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                            <input type="text" required placeholder="Department" value={newEmp.department} onChange={(e) => setNewEmp({ ...newEmp, department: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                            <input type="text" required placeholder="Designation" value={newEmp.designation} onChange={(e) => setNewEmp({ ...newEmp, designation: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                            <input type="number" required placeholder="Basic Salary (Rs)" value={newEmp.basicSalary} onChange={(e) => setNewEmp({ ...newEmp, basicSalary: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                            <input type="password" required placeholder="Temporary Password" value={newEmp.password} onChange={(e) => setNewEmp({ ...newEmp, password: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                            
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={() => setShowAddEmployee(false)} style={{ flex: 1, padding: '14px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>Cancel</button>
                                <button type="submit" style={{ flex: 1, padding: '14px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>Register Account</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HRDashboard;