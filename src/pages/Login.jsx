import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

const Login = () => {
    const [isSignup, setIsSignup] = useState(false);

    const [name, setName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const resetForm = () => {
        setName(''); setCompanyName(''); setEmail('');
        setPassword(''); setError(''); setShowPassword(false);
    };

    const toggle = (toSignup) => {
        resetForm();
        setIsSignup(toSignup);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let response;

            if (isSignup) {
                response = await api.post('/auth/setup', {
                    companyName: companyName.trim(),
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                    password
                });
            } else {
                response = await api.post('/auth/login', {
                    email: email.trim().toLowerCase(),
                    password
                });
            }

            const { token, user } = response.data;
            login(user, token);

            if (user.role === 'Admin') navigate('/admin');
            else if (user.role === 'HR') navigate('/hr');
            else navigate('/employee');

        } catch (err) {
            const msg = err.response?.data?.message;
            if (msg) {
                setError(msg);
            } else if (!err.response) {
                setError('Unable to reach server. Check your connection.');
            } else {
                setError(`Error (${err.response.status}). Please try again.`);
            }
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f1f5f9',
            padding: '24px 16px',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        }}>
            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .auth-input {
                    border: none !important; outline: none !important;
                    padding: 0 10px !important; font-size: 14px !important;
                    color: #0f172a !important; width: 100% !important;
                    background: transparent !important; margin: 0 !important;
                    font-family: inherit !important;
                }
                .auth-input::placeholder { color: #94a3b8; }
                .input-wrap {
                    display: flex; align-items: center; background: #fff;
                    border: 1.5px solid #e2e8f0; border-radius: 8px;
                    padding: 0 14px; height: 46px;
                    transition: border-color 0.15s, box-shadow 0.15s;
                }
                .input-wrap:focus-within {
                    border-color: #2563eb;
                    box-shadow: 0 0 0 3px rgba(37,99,235,0.08);
                }
                .submit-btn {
                    width: 100%; height: 46px; background: #1d4ed8; color: #fff;
                    border: none; border-radius: 8px; font-size: 14px; font-weight: 600;
                    cursor: pointer; display: flex; align-items: center; justify-content: center;
                    gap: 8px; transition: background 0.15s; font-family: inherit;
                }
                .submit-btn:hover:not(:disabled) { background: #1e40af; }
                .submit-btn:disabled { opacity: 0.65; cursor: not-allowed; }
                .field-label {
                    display: block; font-size: 13px; font-weight: 600;
                    color: #334155; margin-bottom: 6px;
                }
                .toggle-link {
                    background: none; border: none; color: #2563eb;
                    font-weight: 700; cursor: pointer; font-size: 13px;
                    padding: 0; font-family: inherit; text-decoration: underline;
                    text-underline-offset: 2px;
                }
                .toggle-link:hover { color: #1d4ed8; }
            `}</style>

            <div style={{
                width: '100%',
                maxWidth: '420px',
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.09), 0 1px 4px rgba(0,0,0,0.04)',
                overflow: 'hidden'
            }}>

                {/* ── Brand Header ── */}
                <div style={{
                    backgroundColor: '#0f172a',
                    padding: '28px 32px 22px',
                    textAlign: 'center'
                }}>
                    <img
                        src="/favicon.svg.png"
                        alt="HCM Lite"
                        style={{ width: '72px', height: '72px', objectFit: 'contain', borderRadius: '10px' }}
                    />
                    <h1 style={{
                        color: '#f8fafc', fontSize: '20px', fontWeight: '700',
                        letterSpacing: '-0.02em', margin: '10px 0 2px'
                    }}>
                        HCM Lite
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>
                        Human Capital Management
                    </p>
                </div>

                {/* ── Form Body ── */}
                <div style={{ padding: '26px 32px 30px' }}>

                    {/* Heading */}
                    <div style={{ marginBottom: '20px' }}>
                        <h2 style={{
                            fontSize: '18px', fontWeight: '700', color: '#0f172a',
                            margin: '0 0 4px', letterSpacing: '-0.01em'
                        }}>
                            {isSignup ? 'Create Admin Account' : 'Sign In'}
                        </h2>
                        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                            {isSignup
                                ? 'Set up your company. You will add HR & employees after login.'
                                : 'Enter your credentials to access your portal.'}
                        </p>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div style={{
                            display: 'flex', alignItems: 'flex-start', gap: '9px',
                            background: '#fef2f2', border: '1px solid #fecaca',
                            borderRadius: '8px', padding: '11px 13px', marginBottom: '18px'
                        }}>
                            <AlertCircle size={16} color="#dc2626" style={{ marginTop: '2px', flexShrink: 0 }} />
                            <span style={{ fontSize: '13px', color: '#991b1b', lineHeight: '1.4' }}>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                        {/* Company Name — signup only */}
                        {isSignup && (
                            <div>
                                <label className="field-label">Company Name</label>
                                <div className="input-wrap">
                                    <input className="auth-input" type="text" value={companyName}
                                        onChange={e => setCompanyName(e.target.value)}
                                        placeholder="e.g. Saylani Welfare Trust" required />
                                </div>
                            </div>
                        )}

                        {/* Your Name — signup only */}
                        {isSignup && (
                            <div>
                                <label className="field-label">Your Name</label>
                                <div className="input-wrap">
                                    <input className="auth-input" type="text" value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="Full name" required />
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label className="field-label">Email Address</label>
                            <div className="input-wrap">
                                <input className="auth-input" type="email" value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="you@company.com"
                                    autoComplete="email" required />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="field-label">Password</label>
                            <div className="input-wrap">
                                <input className="auth-input"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    autoComplete={isSignup ? 'new-password' : 'current-password'}
                                    required />
                                <button type="button" onClick={() => setShowPassword(v => !v)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        padding: '4px', display: 'flex', alignItems: 'center',
                                        color: '#94a3b8', flexShrink: 0
                                    }}>
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button type="submit" className="submit-btn" disabled={loading} style={{ marginTop: '2px' }}>
                            {loading ? (
                                <>
                                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                    <span>{isSignup ? 'Creating account...' : 'Signing in...'}</span>
                                </>
                            ) : (
                                <span>{isSignup ? 'Create Admin Account' : 'Sign In'}</span>
                            )}
                        </button>
                    </form>

                    {/* ── Toggle Sign In / Sign Up ── */}
                    <div style={{
                        marginTop: '20px',
                        paddingTop: '16px',
                        borderTop: '1px solid #f1f5f9',
                        textAlign: 'center',
                        fontSize: '13px',
                        color: '#64748b'
                    }}>
                        {isSignup ? (
                            <>
                                Already have an account?{' '}
                                <button className="toggle-link" onClick={() => toggle(false)}>
                                    Sign in here
                                </button>
                            </>
                        ) : (
                            <>
                                First time?{' '}
                                <button className="toggle-link" onClick={() => toggle(true)}>
                                    Create Admin Account
                                </button>
                            </>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Login;
