import { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const roleFromUrl = queryParams.get('role') || 'Employee';

    const [activeRole, setActiveRole] = useState(roleFromUrl);
    const [isSignup, setIsSignup] = useState(false);
    
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const allRoles = ['Employee', 'HR', 'Admin'];

    useEffect(() => { localStorage.clear(); }, []);

    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            let response;
            if (isSignup) {
                response = await axios.post('http://localhost:5000/api/auth/register', { name, email, password, role: activeRole });
            } else {
                response = await axios.post('http://localhost:5000/api/auth/login', { email, password });
                const userRoleFromDB = response.data.user.role;
                if (userRoleFromDB !== activeRole) {
                    setError(`Access Denied! Portal mismatch. You belong to ${userRoleFromDB}.`);
                    setLoading(false);
                    return; 
                }
            }

            const { token, user } = response.data;
            login(user, token); 
            localStorage.setItem('token', token);

            if (user.role === 'Admin') navigate('/admin');
            else if (user.role === 'HR') navigate('/hr');
            else navigate('/employee');
        } catch (err) {
            setError(err.response?.data?.message || (isSignup ? 'Registration failed.' : 'Invalid credentials.'));
            setLoading(false);
        }
    };

    return (
        <div className="login-container" style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
            <style>
                {`
                    @media (max-width: 900px) {
                        .login-container { flex-direction: column !important; }
                        .branding-panel { padding: 40px 20px !important; min-height: 250px !important; flex: none !important; }
                        .branding-title { fontSize: 32px !important; }
                        .form-panel { padding: 30px 20px !important; }
                    }
                `}
            </style>
            
            <div className="branding-panel" style={{ flex: 1.2, backgroundColor: '#0f172a', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px', position: 'relative', overflow: 'hidden', color: 'white' }}>
                <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, rgba(15,23,42,0) 70%)', borderRadius: '50%' }}></div>
                <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                        <div style={{ width: '45px', height: '45px', background: '#3b82f6', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <span style={{fontWeight: '900', fontSize: '20px'}}>HL</span>
                        </div>
                        <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0 }}>HCM Lite</h1>
                    </div>
                    <h2 className="branding-title" style={{ fontSize: '42px', fontWeight: '700', margin: '0 0 20px 0', lineHeight: '1.2' }}>
                        Simplifying People,<br /> <span style={{ color: '#38bdf8' }}>Powering Performance.</span>
                    </h2>
                </div>
            </div>

            <div className="form-panel" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px', backgroundColor: '#ffffff' }}>
                <div style={{ width: '100%', maxWidth: '400px' }}>
                    <div style={{ marginBottom: '25px', display: 'inline-flex', padding: '6px 14px', background: '#eff6ff', color: '#2563eb', borderRadius: '20px', fontWeight: '700', fontSize: '12px' }}>
                        {activeRole === 'Admin' ? '🛡️ ' : activeRole === 'HR' ? '👥 ' : '💼 '} {activeRole} Portal
                    </div>

                    <h2 style={{ color: '#0f172a', fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0' }}>{isSignup ? `Create Account` : `Sign In`}</h2>
                    <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '25px' }}>{isSignup ? 'Register official credentials.' : 'Enter work credentials.'}</p>
                    
                    {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', fontWeight: '600' }}>{error}</div>}
                    
                    <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {isSignup && <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Full Name" style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />}
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Work Email" style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                        <div style={{ position: 'relative' }}>
                            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Password" style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '15px', top: '15px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>{showPassword ? 'Hide' : 'Show'}</button>
                        </div>
                        
                        <button type="submit" disabled={loading} style={{ padding: '14px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer' }}>
                            {loading ? 'Processing...' : (isSignup ? 'Register' : 'Sign In')}
                        </button>
                    </form>

                    <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '13px' }}>
                        {activeRole === 'Employee' ? (
                            <button type="button" onClick={() => { setIsSignup(!isSignup); setError(''); }} style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '700', cursor: 'pointer' }}>
                                {isSignup ? 'Login instead' : 'Create an account'}
                            </button>
                        ) : (
                            <span style={{ color: '#64748b' }}>HR and Admin accounts are provisioned by an administrator.</span>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
                        {allRoles.filter(role => role !== activeRole).map(role => (
                            <button key={role} type="button" onClick={() => { setActiveRole(role); setError(''); setIsSignup(false); }} style={{ flex: 1, padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', background: 'transparent', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                                {role} Portal
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;