
import React, { useState, useEffect } from 'react';
import { Landing, PostcodeChecker, Timeline, Priorities } from './views/Public';
import { ApplicantDashboard, CommitteeDashboard, AdminDashboard } from './views/Secure';
import { Button, Input, Modal, Card } from './components/UI';
import { api } from './services/firebase';
import { User } from './types';

function App() {
  // State for Navigation & Auth
  const [currentPage, setCurrentPage] = useState('home');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Auth Modal State
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
        let user;
        if (authMode === 'login') {
            user = await api.login(emailOrUsername, password);
        } else {
            user = await api.register(emailOrUsername, password, displayName);
        }
        setCurrentUser(user);
        setIsAuthOpen(false);
        
        // Redirect logic
        if (user.role === 'admin') setCurrentPage('admin-dashboard');
        else if (user.role === 'committee') setCurrentPage('committee-dashboard');
        else setCurrentPage('applicant-dashboard');
    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentPage('home');
    setEmailOrUsername('');
    setPassword('');
  };

  // --- LOGO SELECTION ---
  // Using specific logos for public vs private portals
  const publicLogo = "images/PB English Transparent.png";
  const privateLogo = "images/Peoples’ Committee Portal logo 2.png";
  
  const currentLogo = currentUser ? privateLogo : publicLogo;

  // --- VIEW ROUTER ---
  const renderView = () => {
    if (!currentUser) {
        // Public Views
        switch(currentPage) {
            case 'timeline': return <Timeline />;
            case 'check-postcode': return <PostcodeChecker />;
            case 'priorities': return <Priorities />;
            default: return <Landing onNavigate={(page) => {
                if (page === 'register') { setAuthMode('register'); setIsAuthOpen(true); }
                else setCurrentPage(page);
            }} />;
        }
    } else {
        // Secure Views
        if (currentUser.role === 'admin') {
            if (currentPage === 'committee-dashboard') {
                // Admin masquerading as committee for scoring access
                return <CommitteeDashboard 
                    user={currentUser} 
                    onUpdateUser={setCurrentUser} 
                    isAdmin={true} 
                    onReturnToAdmin={() => setCurrentPage('admin-dashboard')} 
                />;
            }
            // Allow admin to view public pages if requested
            if (['home', 'timeline', 'check-postcode', 'priorities'].includes(currentPage)) {
                 switch(currentPage) {
                    case 'timeline': return <><div className="fixed bottom-4 right-4 z-50"><Button onClick={() => setCurrentPage('admin-dashboard')}>Return to Admin</Button></div><Timeline /></>;
                    case 'check-postcode': return <><div className="fixed bottom-4 right-4 z-50"><Button onClick={() => setCurrentPage('admin-dashboard')}>Return to Admin</Button></div><PostcodeChecker /></>;
                    case 'priorities': return <><div className="fixed bottom-4 right-4 z-50"><Button onClick={() => setCurrentPage('admin-dashboard')}>Return to Admin</Button></div><Priorities /></>;
                    default: return <><div className="fixed bottom-4 right-4 z-50"><Button onClick={() => setCurrentPage('admin-dashboard')}>Return to Admin</Button></div><Landing onNavigate={setCurrentPage}/></>;
                }
            }
            return <AdminDashboard 
                onNavigatePublic={(view) => setCurrentPage(view)} 
                onNavigateScoring={() => setCurrentPage('committee-dashboard')} 
            />;
        }
        
        if (currentUser.role === 'committee') return <CommitteeDashboard user={currentUser} onUpdateUser={setCurrentUser} />;
        return <ApplicantDashboard user={currentUser} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-arial">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-purple-100 shadow-md transition-all">
        <div className="container mx-auto px-4 h-20 flex justify-between items-center">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setCurrentPage('home')}>
                <img 
                    src={currentLogo} 
                    onError={(e) => {
                        // Fallback if image fails to load
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                    alt="Portal Logo" 
                    className="h-12 md:h-14 w-auto object-contain transition-all duration-300"
                />
                {/* Fallback Text Logo if Image Missing */}
                <div className="hidden">
                    <span className="font-dynapuff text-brand-purple font-bold text-xl block leading-none">
                        {currentUser ? "Committee Portal" : "Communities' Choice"}
                    </span>
                </div>
            </div>

            <div className="flex gap-4 items-center">
                {!currentUser ? (
                    <>
                        <button onClick={() => setCurrentPage('check-postcode')} className="text-brand-purple hover:bg-purple-50 px-3 py-2 rounded-lg font-bold transition-colors font-dynapuff">Vote</button>
                        <button onClick={() => setCurrentPage('landing')} className="text-brand-purple hover:bg-purple-50 px-3 py-2 rounded-lg font-bold transition-colors font-dynapuff hidden sm:block">Browse Areas</button>
                        <button onClick={() => setCurrentPage('priorities')} className="text-brand-purple hover:bg-purple-50 px-3 py-2 rounded-lg font-bold transition-colors font-dynapuff hidden md:block">Our Priorities</button>
                        <button onClick={() => setCurrentPage('timeline')} className="text-brand-purple hover:bg-purple-50 px-3 py-2 rounded-lg font-bold transition-colors font-dynapuff hidden md:block">Timeline</button>
                        <Button 
                            size="sm" 
                            onClick={() => { setAuthMode('login'); setIsAuthOpen(true); }}
                            className="bg-purple-100 text-purple-800 hover:bg-purple-200 border border-purple-300"
                        >
                            Committee Portal
                        </Button>
                    </>
                ) : (
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{currentUser.role}</div>
                            <div className="text-sm font-bold text-gray-800">{currentUser.displayName || currentUser.email.split('@')[0]}</div>
                        </div>
                        {currentUser.photoUrl ? (
                            <img src={currentUser.photoUrl} alt="Profile" className="w-10 h-10 rounded-full border-2 border-brand-purple object-cover" />
                        ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold">
                                {currentUser.displayName?.charAt(0) || currentUser.email.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <Button variant="danger" size="sm" onClick={handleLogout}>Log Out</Button>
                    </div>
                )}
            </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="flex-grow relative">
        {renderView()}
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-200 py-12 mt-12">
        <div className="container mx-auto px-4 text-center">
            <div className="w-12 h-12 bg-purple-50 text-brand-purple rounded-full flex items-center justify-center mx-auto mb-6 font-bold text-xl font-dynapuff">CC</div>
            <p className="font-dynapuff text-gray-800 font-bold text-lg mb-2">Communities' Choice PB Initiative</p>
            <p className="text-gray-500 text-sm mb-8">Empowering Torfaen residents to decide on local funding.</p>
            <div className="text-xs text-gray-400 uppercase tracking-widest">
                &copy; 2026 Torfaen County Borough Council & TVA
            </div>
        </div>
      </footer>

      {/* AUTH MODAL */}
      <Modal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} title={authMode === 'login' ? 'Portal Access' : 'Join the Community'}>
        <div className="text-center mb-6">
            <img 
                src="images/Peoples’ Committee Portal logo 2.png" 
                alt="Committee Logo" 
                className="w-24 mx-auto mb-4"
                onError={(e) => e.currentTarget.src = 'https://placehold.co/100x100/9333ea/ffffff?text=Logo'} 
            />
            <p className="text-gray-600 text-sm">Please enter your credentials to proceed.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
            {authMode === 'register' && (
                <Input label="Full Name" value={displayName} onChange={e => setDisplayName(e.target.value)} required placeholder="Jane Doe" />
            )}
            <Input 
                label={authMode === 'login' ? "Email Address or Username" : "Email Address"} 
                type="text" 
                value={emailOrUsername} 
                onChange={e => setEmailOrUsername(e.target.value)} 
                required 
                placeholder={authMode === 'login' ? "e.g. louise.white" : "user@email.com"} 
            />
            <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••" />
            
            {error && <div className="text-red-600 text-sm font-bold bg-red-50 p-4 rounded-xl border border-red-100 animate-slide-up">{error}</div>}
            
            <Button type="submit" className="w-full text-lg shadow-xl" disabled={isLoading}>
                {isLoading ? 'Processing...' : (authMode === 'login' ? 'Log In' : 'Create Account')}
            </Button>
            
            <div className="text-center text-sm text-gray-500 mt-4">
                {authMode === 'login' ? 'Applicant?' : 'Already have an account?'} 
                <button type="button" onClick={() => { setError(''); setAuthMode(authMode === 'login' ? 'register' : 'login'); }} className="text-brand-purple font-bold ml-1 hover:underline">
                    {authMode === 'login' ? 'Register here' : 'Login here'}
                </button>
            </div>
        </form>
      </Modal>
    </div>
  );
}

export default App;
