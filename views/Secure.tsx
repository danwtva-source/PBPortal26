
import React, { useEffect, useState, useMemo } from 'react';
import { Application, User, Score, AREAS, Area, Role, BudgetLine, PortalSettings } from '../types';
import { COMMITTEE_DOCS, SCORING_CRITERIA, MARMOT_PRINCIPLES, WFG_GOALS, ORG_TYPES } from '../constants';
import { api, seedDatabase, USE_DEMO_MODE } from '../services/firebase';
import { Button, Card, Input, Modal, Badge } from '../components/UI';

// --- SHARED PROFILE MODAL ---
const ProfileModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    user: User; 
    onSave: (u: User) => void; 
}> = ({ isOpen, onClose, user, onSave }) => {
    const [data, setData] = useState({ 
        displayName: user.displayName || '', 
        bio: user.bio || '', 
        phone: user.phone || '',
        address: user.address || '',
        roleDescription: user.roleDescription || '',
        photoUrl: user.photoUrl || ''
    });

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setData(prev => ({ ...prev, photoUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const updated = await api.updateUserProfile(user.uid, data);
        onSave(updated);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden border-4 border-purple-100 relative group">
                        {data.photoUrl ? (
                            <img src={data.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-2xl">
                                {data.displayName?.charAt(0) || '?'}
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                            <span className="text-white text-xs font-bold">Change</span>
                        </div>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <Input label="Display Name" value={data.displayName} onChange={e => setData({...data, displayName: e.target.value})} required />
                    <Input label="Role / Title" placeholder="e.g. Treasurer" value={data.roleDescription} onChange={e => setData({...data, roleDescription: e.target.value})} />
                </div>
                <Input label="Phone Number" value={data.phone} onChange={e => setData({...data, phone: e.target.value})} />
                <Button type="submit" className="w-full shadow-lg">Save Profile Changes</Button>
            </form>
        </Modal>
    );
};

// --- USER FORM MODAL (ADMIN) ---
const UserFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    user: User | null; 
    onSave: () => void;
}> = ({ isOpen, onClose, user, onSave }) => {
    const [formData, setFormData] = useState<Partial<User>>({
        email: '', username: '', displayName: '', role: 'applicant', area: undefined
    });
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({ email: user.email, username: user.username || '', displayName: user.displayName, role: user.role, area: user.area });
        } else {
            setFormData({ email: '', username: '', displayName: '', role: 'applicant', area: undefined });
        }
        setPassword('');
        setError('');
    }, [user, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (user) await api.updateUser({ ...user, ...formData } as User);
            else await api.adminCreateUser(formData as User, password);
            onSave();
            onClose();
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={user ? 'Edit User' : 'Create New User'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Display Name" value={formData.displayName} onChange={e => setFormData({...formData, displayName: e.target.value})} required />
                <Input label="Email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required disabled={!!user} />
                {!user && <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />}
                <div className="grid grid-cols-2 gap-4">
                     <select className="px-4 py-3 rounded-xl border" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as Role})}>
                        <option value="applicant">Applicant</option>
                        <option value="committee">Committee</option>
                        <option value="admin">Admin</option>
                    </select>
                    {formData.role === 'committee' && (
                        <select className="px-4 py-3 rounded-xl border" value={formData.area || ''} onChange={e => setFormData({...formData, area: e.target.value as Area})}>
                            <option value="">Select Area...</option>
                            {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    )}
                </div>
                {error && <div className="text-red-600 text-sm">{error}</div>}
                <Button type="submit" className="w-full">{user ? 'Update' : 'Create'}</Button>
            </form>
        </Modal>
    );
};

// --- STAGE 1 FORM ---
export const DigitalStage1Form: React.FC<{
    data: Partial<Application>;
    onChange: (newData: Partial<Application>) => void;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    readOnly?: boolean;
}> = ({ data, onChange, onSubmit, onCancel, readOnly = false }) => {
    
    const updateFormData = (field: string, value: any) => {
        onChange({ ...data, formData: { ...data.formData, [field]: value } });
    };

    return (
        <div className="bg-white rounded-3xl shadow-xl border border-purple-100 overflow-hidden max-w-5xl mx-auto">
            <div className="bg-brand-purple p-6 text-white flex justify-between items-center">
                <h2 className="text-2xl font-bold font-dynapuff">Expression of Interest (Stage 1)</h2>
                {readOnly && <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold">Preview</span>}
            </div>
            <form onSubmit={onSubmit} className="p-8 space-y-8">
                <section>
                    <h3 className="font-bold text-xl mb-4 border-b pb-2">1. Area & Applicant</h3>
                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                        {AREAS.map(area => (
                            <label key={area} className={`flex items-center gap-2 p-3 rounded border cursor-pointer ${data.area === area ? 'bg-purple-50 border-purple-500' : ''}`}>
                                <input type="radio" name="area" value={area} checked={data.area === area} onChange={() => onChange({...data, area})} disabled={readOnly} />
                                <span className="text-sm font-bold">{area}</span>
                            </label>
                        ))}
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <Input label="Project Title" value={data.projectTitle} onChange={e => onChange({...data, projectTitle: e.target.value})} disabled={readOnly} />
                        <Input label="Organisation Name" value={data.orgName} onChange={e => onChange({...data, orgName: e.target.value})} disabled={readOnly} />
                        <Input label="Contact Name" value={data.applicantName} onChange={e => onChange({...data, applicantName: e.target.value})} disabled={readOnly} />
                        <Input label="Email" value={data.formData?.contactEmail || ''} onChange={e => updateFormData('contactEmail', e.target.value)} disabled={readOnly} />
                    </div>
                </section>

                <section>
                    <h3 className="font-bold text-xl mb-4 border-b pb-2">2. Project Details</h3>
                    <div className="mb-4">
                        <label className="block text-sm font-bold mb-2">Summary (Max 250 words)</label>
                        <textarea className="w-full p-3 border rounded-xl h-32" value={data.summary} onChange={e => onChange({...data, summary: e.target.value})} disabled={readOnly} />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <Input label="Total Cost (£)" type="number" value={data.totalCost} onChange={e => onChange({...data, totalCost: Number(e.target.value)})} disabled={readOnly} />
                        <Input label="Amount Requested (£)" type="number" value={data.amountRequested} onChange={e => onChange({...data, amountRequested: Number(e.target.value)})} disabled={readOnly} />
                    </div>
                </section>
                
                <section>
                     <h3 className="font-bold text-xl mb-4 border-b pb-2">3. Priorities & Alignment</h3>
                     <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-bold text-gray-700 mb-2">Marmot Principles</h4>
                            {MARMOT_PRINCIPLES.map(p => (
                                <label key={p} className="flex gap-2 text-sm mb-1">
                                    <input type="checkbox" checked={data.formData?.marmotPrinciples?.includes(p)} 
                                        onChange={e => {
                                            if (readOnly) return;
                                            const cur = data.formData?.marmotPrinciples || [];
                                            updateFormData('marmotPrinciples', e.target.checked ? [...cur, p] : cur.filter(x => x !== p));
                                        }} disabled={readOnly} 
                                    />
                                    {p}
                                </label>
                            ))}
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-700 mb-2">WFG Goals</h4>
                             {WFG_GOALS.map(g => (
                                <label key={g} className="flex gap-2 text-sm mb-1">
                                    <input type="checkbox" checked={data.formData?.wfgGoals?.includes(g)} 
                                        onChange={e => {
                                            if (readOnly) return;
                                            const cur = data.formData?.wfgGoals || [];
                                            updateFormData('wfgGoals', e.target.checked ? [...cur, g] : cur.filter(x => x !== g));
                                        }} disabled={readOnly} 
                                    />
                                    {g}
                                </label>
                            ))}
                        </div>
                     </div>
                </section>

                <div className="flex gap-4 border-t pt-6">
                    {!readOnly && (
                        <>
                            <Button type="submit" className="flex-1">Submit EOI</Button>
                            <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                        </>
                    )}
                </div>
            </form>
        </div>
    );
};

// --- STAGE 2 FORM ---
export const DigitalStage2Form: React.FC<{
    data: Partial<Application>;
    onChange: (newData: Partial<Application>) => void;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    readOnly?: boolean;
}> = ({ data, onChange, onSubmit, onCancel, readOnly = false }) => {
    
    const updateFormData = (field: string, value: any) => {
        onChange({ ...data, formData: { ...data.formData, [field]: value } });
    };

    const budgetLines: BudgetLine[] = data.formData?.budgetBreakdown || [];

    const handleBudgetChange = (idx: number, field: keyof BudgetLine, val: any) => {
        if(readOnly) return;
        const newLines = [...budgetLines];
        newLines[idx] = { ...newLines[idx], [field]: val };
        const total = newLines.reduce((sum, line) => sum + (Number(line.cost) || 0), 0);
        onChange({ ...data, totalCost: total, amountRequested: total, formData: { ...data.formData, budgetBreakdown: newLines } });
    };

    return (
        <div className="bg-white rounded-3xl shadow-xl border border-teal-100 overflow-hidden max-w-5xl mx-auto">
             <div className="bg-brand-darkTeal p-6 text-white flex justify-between items-center">
                <h2 className="text-2xl font-bold font-dynapuff">Full Application (Stage 2)</h2>
                {readOnly && <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold">Preview</span>}
            </div>
            <form onSubmit={onSubmit} className="p-8 space-y-8">
                <section>
                    <h3 className="font-bold text-xl mb-4 border-b pb-2">1. Organisation & Bank Details</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <Input label="Organisation" value={data.orgName} disabled />
                        <Input label="Charity/Company No." value={data.formData?.charityNumber || ''} onChange={e => updateFormData('charityNumber', e.target.value)} disabled={readOnly} />
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border mt-4">
                        <h4 className="font-bold mb-2">Bank Details</h4>
                        <div className="grid md:grid-cols-3 gap-4">
                            <Input label="Account Name" value={data.formData?.bankAccountName || ''} onChange={e => updateFormData('bankAccountName', e.target.value)} disabled={readOnly} />
                            <Input label="Sort Code" value={data.formData?.bankSortCode || ''} onChange={e => updateFormData('bankSortCode', e.target.value)} disabled={readOnly} />
                            <Input label="Account No." value={data.formData?.bankAccountNumber || ''} onChange={e => updateFormData('bankAccountNumber', e.target.value)} disabled={readOnly} />
                        </div>
                    </div>
                </section>

                <section>
                    <h3 className="font-bold text-xl mb-4 border-b pb-2">2. Detailed Budget</h3>
                    <div className="space-y-2 mb-4">
                         {budgetLines.map((line, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                                <input className="flex-1 p-2 border rounded" placeholder="Item" value={line.item} onChange={e => handleBudgetChange(idx, 'item', e.target.value)} disabled={readOnly} />
                                <input className="flex-1 p-2 border rounded" placeholder="Note" value={line.note} onChange={e => handleBudgetChange(idx, 'note', e.target.value)} disabled={readOnly} />
                                <input className="w-24 p-2 border rounded" type="number" placeholder="Cost" value={line.cost} onChange={e => handleBudgetChange(idx, 'cost', e.target.value)} disabled={readOnly} />
                                {!readOnly && <button type="button" onClick={() => {
                                    const nl = budgetLines.filter((_, i) => i !== idx);
                                    onChange({ ...data, formData: { ...data.formData, budgetBreakdown: nl } });
                                }} className="text-red-500 font-bold px-2">X</button>}
                            </div>
                         ))}
                    </div>
                    {!readOnly && <Button type="button" variant="secondary" size="sm" onClick={() => updateFormData('budgetBreakdown', [...budgetLines, { item: '', note: '', cost: 0 }])}>+ Add Item</Button>}
                    <div className="mt-4 text-right font-bold text-xl">Total: £{data.totalCost || 0}</div>
                </section>

                <div className="flex gap-4 border-t pt-6">
                    {!readOnly && (
                        <>
                            <Button type="submit" className="flex-1 bg-brand-darkTeal">Submit Full App</Button>
                            <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                        </>
                    )}
                </div>
            </form>
        </div>
    );
};


// --- SCORE MODAL ---
const ScoreModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    app: Application;
    currentUser: User; // Passed explicitly to avoid storage errors
    existingScore?: Score;
    onSubmit: (s: Score) => void;
    readOnly?: boolean;
}> = ({ isOpen, onClose, app, currentUser, existingScore, onSubmit, readOnly }) => {
    const [scores, setScores] = useState<Record<string, number>>(existingScore?.scores || {});
    const [notes, setNotes] = useState<Record<string, string>>(existingScore?.notes || {});

    const { rawTotal, weightedTotalPercent } = useMemo(() => {
        let rTotal = 0;
        let wTotal = 0;
        SCORING_CRITERIA.forEach(c => {
            const val = scores[c.id] || 0;
            rTotal += val;
            wTotal += (val / 3) * c.weight;
        });
        return { rawTotal: rTotal, weightedTotalPercent: Math.round(wTotal) };
    }, [scores]);

    const handleSubmit = () => {
        onSubmit({
            appId: app.id,
            scorerId: currentUser.uid,
            scorerName: currentUser.displayName || 'Member',
            scores, notes, isFinal: true, total: rawTotal, timestamp: Date.now()
        });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Score: ${app.projectTitle}`} size="xl">
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                {SCORING_CRITERIA.map((c) => (
                    <div key={c.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-bold">{c.name} ({c.weight}%)</h4>
                            <div className="flex gap-1">
                                {[0, 1, 2, 3].map(val => (
                                    <button key={val} onClick={() => !readOnly && setScores(prev => ({...prev, [c.id]: val}))}
                                        className={`w-8 h-8 rounded ${scores[c.id] === val ? 'bg-brand-purple text-white' : 'bg-white border'}`} disabled={readOnly}>
                                        {val}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{c.guidance}</p>
                        <input className="w-full p-2 border rounded text-sm" placeholder="Comments..." value={notes[c.id]||''} onChange={e=>setNotes(p=>({...p, [c.id]:e.target.value}))} disabled={readOnly}/>
                    </div>
                ))}
            </div>
            <div className="mt-4 pt-4 border-t flex justify-between items-center bg-white sticky bottom-0">
                <div className="flex gap-4">
                     <div className="bg-purple-100 px-3 py-1 rounded text-purple-800 font-bold">Raw: {rawTotal}/30</div>
                     <div className={`px-3 py-1 rounded font-bold ${weightedTotalPercent >= 50 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {weightedTotalPercent}%
                     </div>
                </div>
                {!readOnly && <Button onClick={handleSubmit}>Submit</Button>}
            </div>
        </Modal>
    );
};

// --- DASHBOARDS ---

export const ApplicantDashboard: React.FC<{ user: User }> = ({ user }) => {
    const [apps, setApps] = useState<Application[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'stage1' | 'stage2'>('list');
    const [activeApp, setActiveApp] = useState<Partial<Application>>({});
    const [currUser, setCurrUser] = useState(user);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    useEffect(() => { api.getApplications().then(all => setApps(all.filter(a => a.userId === user.uid))); }, [user.uid, viewMode]);

    const handleSubmit = async (e: React.FormEvent, stage: string) => {
        e.preventDefault();
        const status = stage === '1' ? 'Submitted-Stage1' : 'Submitted-Stage2';
        if (activeApp.id) await api.updateApplication(activeApp.id, { ...activeApp, status } as any);
        else await api.createApplication({ ...activeApp, status } as any);
        setViewMode('list');
    };

    if (viewMode === 'stage1') return <DigitalStage1Form data={activeApp} onChange={setActiveApp} onSubmit={e => handleSubmit(e, '1')} onCancel={() => setViewMode('list')} />;
    if (viewMode === 'stage2') return <DigitalStage2Form data={activeApp} onChange={setActiveApp} onSubmit={e => handleSubmit(e, '2')} onCancel={() => setViewMode('list')} />;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold font-dynapuff">My Dashboard</h1>
                <Button onClick={() => setIsProfileOpen(true)} variant="outline">Profile</Button>
            </div>
            <Card>
                <div className="flex justify-between mb-4">
                    <h2 className="font-bold text-xl">Applications</h2>
                    <Button onClick={() => { setActiveApp({ userId: user.uid, status: 'Draft', formData: { budgetBreakdown: [] } }); setViewMode('stage1'); }}>New Application</Button>
                </div>
                {apps.map(app => (
                    <div key={app.id} className="border p-4 rounded-xl mb-4 flex justify-between items-center">
                        <div>
                            <div className="font-bold text-lg">{app.projectTitle}</div>
                            <Badge>{app.status}</Badge>
                        </div>
                        <div className="flex gap-2">
                             {app.status === 'Draft' && <Button size="sm" onClick={() => { setActiveApp(app); setViewMode('stage1'); }}>Edit</Button>}
                             {app.status === 'Invited-Stage2' && <Button size="sm" variant="secondary" onClick={() => { setActiveApp(app); setViewMode('stage2'); }}>Start Stage 2</Button>}
                        </div>
                    </div>
                ))}
            </Card>
            <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} user={currUser} onSave={setCurrUser} />
        </div>
    );
};

export const CommitteeDashboard: React.FC<{ user: User, onUpdateUser: (u:User)=>void, isAdmin?: boolean, onReturnToAdmin?: ()=>void }> = ({ user, onUpdateUser, isAdmin, onReturnToAdmin }) => {
    const [apps, setApps] = useState<Application[]>([]);
    const [scores, setScores] = useState<Score[]>([]);
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);

    useEffect(() => {
        const load = async () => {
             const allApps = await api.getApplications(isAdmin ? 'All' : user.area);
             setApps(allApps.filter(a => ['Submitted-Stage1', 'Invited-Stage2', 'Submitted-Stage2', 'Finalist'].includes(a.status)));
             setScores((await api.getScores()).filter(s => s.scorerId === user.uid));
        };
        load();
    }, [user.area, user.uid, isAdmin]);

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                 <h1 className="text-3xl font-bold font-dynapuff">Committee Dashboard {isAdmin && '(Admin View)'}</h1>
                 {isAdmin && <Button onClick={onReturnToAdmin}>Return to Admin</Button>}
            </div>
            <div className="grid gap-4">
                {apps.map(app => {
                    const sc = scores.find(s => s.appId === app.id);
                    return (
                        <Card key={app.id}>
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-xl">{app.projectTitle}</h3>
                                    <p className="text-sm text-gray-500">{app.orgName}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    {sc && <span className="text-green-600 font-bold">Scored: {sc.total}/30</span>}
                                    <Button onClick={() => setSelectedApp(app)}>{sc ? 'Update' : 'Score'}</Button>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
            {selectedApp && (
                <ScoreModal 
                    isOpen={!!selectedApp} 
                    onClose={() => setSelectedApp(null)} 
                    app={selectedApp} 
                    currentUser={user} // PASSED CORRECTLY
                    existingScore={scores.find(s => s.appId === selectedApp.id)}
                    onSubmit={async (s) => {
                        await api.saveScore(s);
                        const newScores = await api.getScores();
                        setScores(newScores.filter(sc => sc.scorerId === user.uid));
                    }}
                />
            )}
        </div>
    );
};

export const AdminDashboard: React.FC<{ onNavigatePublic: (v:string)=>void, onNavigateScoring: ()=>void }> = ({ onNavigatePublic, onNavigateScoring }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [isSeeding, setIsSeeding] = useState(false);
    const [previewMode, setPreviewMode] = useState<'stage1' | 'stage2' | null>(null);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const refresh = async () => { setUsers(await api.getUsers()); };
    useEffect(() => { refresh(); }, []);

    const handleSeed = async () => {
        if(!confirm("Overwrite DB with Demo Data?")) return;
        setIsSeeding(true);
        try { await seedDatabase(); refresh(); alert("Done"); }
        catch(e:any) { alert(e.message); }
        finally { setIsSeeding(false); }
    };

    const dummyApp: Partial<Application> = {
        projectTitle: 'Dev Preview',
        formData: { budgetBreakdown: [{item:'Test', note:'Test note', cost:100}], marmotPrinciples: [MARMOT_PRINCIPLES[0]] }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold font-dynapuff text-brand-purple">Admin</h1>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => onNavigatePublic('home')}>Public Site</Button>
                    <Button onClick={onNavigateScoring}>Scoring Mode</Button>
                </div>
            </div>

            <div className="flex gap-4 mb-6">
                {['overview', 'users', 'super-view'].map(t => (
                    <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 rounded font-bold ${activeTab === t ? 'bg-brand-purple text-white' : 'bg-white'}`}>{t}</button>
                ))}
            </div>

            {activeTab === 'users' && (
                <Card>
                    <div className="flex justify-between mb-4">
                        <h3 className="font-bold">Users</h3>
                        <Button size="sm" onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }}>+ User</Button>
                    </div>
                    <table className="w-full text-left">
                        <thead><tr className="border-b"><th className="p-2">Name</th><th className="p-2">Role</th><th className="p-2">Actions</th></tr></thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.uid} className="border-b">
                                    <td className="p-2">{u.displayName}</td>
                                    <td className="p-2"><Badge>{u.role}</Badge></td>
                                    <td className="p-2">
                                        <button onClick={() => { setEditingUser(u); setIsUserModalOpen(true); }} className="text-blue-600 font-bold mr-2">Edit</button>
                                        <button onClick={async () => { if(confirm('Delete?')) { await api.deleteUser(u.uid); refresh(); }}} className="text-red-600 font-bold">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <UserFormModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} user={editingUser} onSave={refresh} />
                </Card>
            )}

            {activeTab === 'super-view' && (
                <div className="grid md:grid-cols-2 gap-6">
                    <Card onClick={() => setPreviewMode('stage1')} className="cursor-pointer hover:border-purple-500">
                        <h3 className="font-bold text-xl text-purple-600">Preview Stage 1 (EOI)</h3>
                        <p className="text-sm text-gray-500">Test the EOI form logic.</p>
                    </Card>
                    <Card onClick={() => setPreviewMode('stage2')} className="cursor-pointer hover:border-teal-500">
                        <h3 className="font-bold text-xl text-teal-600">Preview Stage 2 (Full)</h3>
                        <p className="text-sm text-gray-500">Test the Full Application form logic.</p>
                    </Card>
                     <div className="md:col-span-2 mt-4 p-4 border rounded bg-gray-50">
                        <h4 className="font-bold">Database Tools</h4>
                        <Button onClick={handleSeed} disabled={isSeeding} className="mt-2">{isSeeding ? 'Seeding...' : 'Seed Database (Reset)'}</Button>
                    </div>
                </div>
            )}

            {previewMode && (
                <Modal isOpen={!!previewMode} onClose={() => setPreviewMode(null)} title="Form Preview" size="xl">
                    {previewMode === 'stage1' 
                        ? <DigitalStage1Form data={dummyApp} onChange={() => {}} onSubmit={e => {e.preventDefault(); alert('Valid');}} onCancel={() => setPreviewMode(null)} />
                        : <DigitalStage2Form data={dummyApp} onChange={() => {}} onSubmit={e => {e.preventDefault(); alert('Valid');}} onCancel={() => setPreviewMode(null)} />
                    }
                </Modal>
            )}
        </div>
    );
};
