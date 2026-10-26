import { useNavigate } from 'react-router-dom';

const Landing = () => {
    const navigate = useNavigate();

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ textAlign: 'center', marginBottom: '50px', padding: '0 15px' }}>
                <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', color: '#0f172a', marginBottom: '10px', fontWeight: '800', letterSpacing: '-1.5px' }}>HCM Lite</h1>
                <p style={{ color: '#64748b', fontSize: 'clamp(1rem, 3vw, 1.2rem)', fontWeight: '500' }}>Enterprise Human Capital Management System</p>
                <p style={{ color: '#2563eb', fontWeight: '700', marginTop: '15px' }}>Select your portal to continue</p>
            </div>

            <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '1000px', width: '100%' }}>
                
                <div onClick={() => navigate('/login?role=Admin')} 
                     style={{ cursor: 'pointer', background: 'white', padding: '40px 30px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', textAlign: 'center', flex: '1 1 280px', maxWidth: '300px', borderTop: '4px solid #3b82f6', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
                     onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}}
                     onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)'}}>
                    <div style={{ fontSize: '40px', marginBottom: '15px' }}>🛡️</div>
                    <h2 style={{ color: '#0f172a', marginBottom: '10px', fontSize: '20px', fontWeight: '700' }}>Admin Portal</h2>
                    <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>System configuration, company settings & security</p>
                </div>

                <div onClick={() => navigate('/login?role=HR')} 
                     style={{ cursor: 'pointer', background: 'white', padding: '40px 30px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', textAlign: 'center', flex: '1 1 280px', maxWidth: '300px', borderTop: '4px solid #8b5cf6', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
                     onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}}
                     onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)'}}>
                    <div style={{ fontSize: '40px', marginBottom: '15px' }}>👥</div>
                    <h2 style={{ color: '#0f172a', marginBottom: '10px', fontSize: '20px', fontWeight: '700' }}>HR Portal</h2>
                    <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>Manage departments, staff & leave approvals</p>
                </div>

                <div onClick={() => navigate('/login?role=Employee')} 
                     style={{ cursor: 'pointer', background: 'white', padding: '40px 30px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', textAlign: 'center', flex: '1 1 280px', maxWidth: '300px', borderTop: '4px solid #10b981', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
                     onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}}
                     onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)'}}>
                    <div style={{ fontSize: '40px', marginBottom: '15px' }}>💼</div>
                    <h2 style={{ color: '#0f172a', marginBottom: '10px', fontSize: '20px', fontWeight: '700' }}>Employee Portal</h2>
                    <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>Daily attendance, leave requests & profile tracking</p>
                </div>

            </div>
        </div>
    );
};

export default Landing;