
import React, { useEffect, useState, useMemo } from 'react';
import { Application, User, Score, AREAS, Area, Role, BudgetLine, PortalSettings } from '../types';
import { COMMITTEE_DOCS, SCORING_CRITERIA, ROLE_PERMISSIONS, MARMOT_PRINCIPLES, WFG_GOALS, ORG_TYPES } from '../constants';
import { api, seedDatabase, USE_DEMO_MODE } from '../services/firebase';
import { Button, Card, Input, Modal, Select, Badge } from '../components/UI';

// Global Chart.js definition
declare const Chart: any;

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
                    <div className="text-sm text-gray-500">Click image to upload new photo</div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <Input label="Display Name" value={data.displayName} onChange={e => setData({...data, displayName: e.target.value})} required />
                    <Input label="Role / Title" placeholder="e.g. Treasurer" value={data.roleDescription} onChange={e => setData({...data, roleDescription: e.target.value})} />
                </div>
                
                <Input label="Phone Number" value={data.phone} onChange={e => setData({...data, phone: e.target.value})} />
                
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 font-dynapuff">Contact Address</label>
                    <textarea 
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-purple focus:ring-4 focus:ring-purple-100 outline-none transition-all font-arial"
                        rows={3}
                        value={data.address}
                        onChange={e => setData({...data, address: e.target.value})}
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 font-dynapuff">Short Bio</label>
                    <textarea 
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-purple focus:ring-4 focus:ring-purple-100 outline-none transition-all font-arial"
                        rows={3}
                        value={data.bio}
                        onChange={e => setData({...data, bio: e.target.value})}
                    />
                </div>

                <Button type="submit" className="w-full shadow-lg">Save Profile Changes</Button>
            </form>
        </Modal>
    );
};

// --- USER FORM MODAL (ADMIN) ---
const UserFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    user: User | null; // null = create mode
    onSave: () => void;
}> = ({ isOpen, onClose, user, onSave }) => {
    const [formData, setFormData] = useState<Partial<User>>({
        email: '',
        username: '',
        displayName: '',
        role: 'applicant',
        area: undefined
    });
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({
                email: user.email,
                username: user.username || '',
                displayName: user.displayName,
                role: user.role,
                area: user.area
            });
            setPassword(''); // Don't show existing password
        } else {
            setFormData({
                email: '',
                username: '',
                displayName: '',
                role: 'applicant',
                area: undefined
            });
            setPassword('');
        }
        setError('');
    }, [user, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            if (user) {
                await api.updateUser({ ...user, ...formData } as User);
            } else {
                if (!password) throw new Error("Password is required for new users");
                await api.adminCreateUser(formData as User, password);
            }
            onSave();
            onClose();
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={user ? 'Edit User' : 'Create New User'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Display Name" value={formData.displayName} onChange={e => setFormData({...formData, displayName: e.target.value})} required />
                    <Input label="Username (Optional)" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                </div>
                
                <Input label="Email Address" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required disabled={!!user} />
                
                {!user && (
                    <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 font-dynapuff">Role</label>
                        <select 
                            className="w-full px-4 py-3 rounded-xl border border-gray-200" 
                            value={formData.role} 
                            onChange={e => setFormData({...formData, role: e.target.value as Role})}
                        >
                            <option value="applicant">Applicant</option>
                            <option value="committee">Committee Member</option>
                            <option value="admin">Administrator</option>
                        </select>
                    </div>
                    {formData.role === 'committee' && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 font-dynapuff">Area</label>
                            <select 
                                className="w-full px-4 py-3 rounded-xl border border-gray-200" 
                                value={formData.area || ''} 
                                onChange={e => setFormData({...formData, area: e.target.value as Area})}
                                required
                            >
                                <option value="">Select Area...</option>
                                {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </div>
                    )}
                </div>

                {error && <div className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</div>}
                
                <Button type="submit" className="w-full">{user ? 'Update User' : 'Create User'}</Button>
            </form>
        </Modal>
    );
};

// ... (Rest of Form Components omitted for brevity, logic remains identical) ...
// Note: To keep the XML return valid and not accidentally delete code, 
// I am including the full content of the dashboard components below, 
// ensuring the Admin Dashboard has the new button.

// Stage 1 (EOI) Component
export const DigitalStage1Form: React.FC<{
    data: Partial<Application>;
    onChange: (newData: Partial<Application>) => void;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    readOnly?: boolean;
}> = ({ data, onChange, onSubmit, onCancel, readOnly = false }) => {
    
    const updateFormData = (field: string, value: any) => {
        onChange({
            ...data,
            formData: { ...data.formData, [field]: value }
        });
    };

    const handleOutcomeChange = (index: number, value: string) => {
        const outcomes = data.formData?.positiveOutcomes ? [...data.formData.positiveOutcomes] : ['', '', ''];
        outcomes[index] = value;
        updateFormData('positiveOutcomes', outcomes);
    };

    return (
        <div className="bg-white rounded-3xl shadow-xl border border-purple-100 overflow-hidden max-w-5xl mx-auto">
            <div className="bg-brand-purple p-6 text-white flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold font-dynapuff">Expression of Interest</h2>
                    <p className="opacity-90">Stage 1 Application Form (Digital)</p>
                </div>
                {readOnly && <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold">Preview Mode</span>}
            </div>
            <form onSubmit={onSubmit} className="p-8 space-y-10">
                
                {/* 1. Area */}
                <section>
                    <h3 className="text-xl font-bold text-gray-800 font-dynapuff border-b pb-2 mb-4">1. Communities' Choice Area</h3>
                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                        {AREAS.map(area => (
                            <label key={area} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${data.area === area ? 'bg-purple-50 border-brand-purple' : 'bg-white border-gray-200'}`}>
                                <input type="radio" name="area" value={area} checked={data.area === area} onChange={() => onChange({...data, area: area})} className="w-5 h-5 accent-brand-purple" disabled={readOnly} />
                                <span className="font-bold text-sm">{area}</span>
                            </label>
                        ))}
                    </div>
                    <label className="flex items-center gap-2 mt-4 cursor-pointer">
                        <input type="checkbox" checked={data.formData?.applyMultiArea || false} onChange={e => updateFormData('applyMultiArea', e.target.checked)} disabled={readOnly} className="w-5 h-5 accent-brand-purple" />
                        <span className="text-gray-700">Do you intend to apply for funding in more than one area?</span>
                    </label>
                </section>

                {/* 2. Applicant Info */}
                <section>
                    <h3 className="text-xl font-bold text-gray-800 font-dynapuff border-b pb-2 mb-4">2. Applicant Information</h3>
                    <div className="grid md:grid-cols-2 gap-6 mb-4">
                        <Input label="Organisation Name" value={data.orgName} onChange={e => onChange({...data, orgName: e.target.value})} disabled={readOnly} />
                        <Input label="Position / Job Title" value={data.formData?.contactPosition || ''} onChange={e => updateFormData('contactPosition', e.target.value)} disabled={readOnly} />
                        <Input label="Contact Name" value={data.applicantName} onChange={e => onChange({...data, applicantName: e.target.value})} disabled={readOnly} />
                        <Input label="Email" type="email" value={data.formData?.contactEmail || ''} onChange={e => updateFormData('contactEmail', e.target.value)} disabled={readOnly} />
                        <Input label="Phone Number" value={data.formData?.contactPhone || ''} onChange={e => updateFormData('contactPhone', e.target.value)} disabled={readOnly} />
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <h4 className="font-bold text-gray-700 mb-3">Registered Address</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                            <Input label="No. / Street" value={data.formData?.addressStreet || ''} onChange={e => updateFormData('addressStreet', e.target.value)} disabled={readOnly} />
                            <Input label="Local Area" value={data.formData?.addressLocalArea || ''} onChange={e => updateFormData('addressLocalArea', e.target.value)} disabled={readOnly} />
                            <Input label="Town / City" value={data.formData?.addressTown || ''} onChange={e => updateFormData('addressTown', e.target.value)} disabled={readOnly} />
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="County" value={data.formData?.addressCounty || ''} onChange={e => updateFormData('addressCounty', e.target.value)} disabled={readOnly} />
                                <Input label="Postcode" value={data.formData?.addressPostcode || ''} onChange={e => updateFormData('addressPostcode', e.target.value)} disabled={readOnly} />
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. Organisation Type */}
                <section>
                    <h3 className="text-xl font-bold text-gray-800 font-dynapuff border-b pb-2 mb-4">3. Organisation Type</h3>
                    <div className="grid md:grid-cols-2 gap-3">
                        {ORG_TYPES.map(type => (
                            <label key={type} className="flex items-center gap-2 text-sm text-gray-700">
                                <input 
                                    type="radio" 
                                    name="orgType" 
                                    value={type} 
                                    checked={data.formData?.orgType === type} 
                                    onChange={e => updateFormData('orgType', e.target.value)} 
                                    disabled={readOnly}
                                    className="accent-brand-purple"
                                />
                                {type}
                            </label>
                        ))}
                    </div>
                    {data.formData?.orgType === 'Other' && (
                        <Input 
                            placeholder="Please describe..." 
                            className="mt-2"
                            value={data.formData?.orgTypeOther || ''} 
                            onChange={e => updateFormData('orgTypeOther', e.target.value)} 
                            disabled={readOnly}
                        />
                    )}
                </section>

                {/* 4. Priorities */}
                <section>
                    <h3 className="text-xl font-bold text-gray-800 font-dynapuff border-b pb-2 mb-4">4. Priorities</h3>
                    <div className="mb-6">
                        <Input label="4.1 Pick Your Main Project Theme" value={data.formData?.projectTheme || ''} onChange={e => updateFormData('projectTheme', e.target.value)} disabled={readOnly} placeholder="e.g. Health & Wellbeing, Youth Services..." />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-700 mb-2">4.2 Project Timeline</h4>
                        <div className="grid md:grid-cols-3 gap-4">
                            <Input label="Start Date" type="date" value={data.formData?.startDate || ''} onChange={e => updateFormData('startDate', e.target.value)} disabled={readOnly} />
                            <Input label="End Date" type="date" value={data.formData?.endDate || ''} onChange={e => updateFormData('endDate', e.target.value)} disabled={readOnly} />
                            <Input label="Duration" placeholder="e.g. 6 months" value={data.formData?.duration || ''} onChange={e => updateFormData('duration', e.target.value)} disabled={readOnly} />
                        </div>
                    </div>
                </section>

                {/* 5. Project Details */}
                <section>
                    <h3 className="text-xl font-bold text-gray-800 font-dynapuff border-b pb-2 mb-4">5. Project Details</h3>
                    <Input label="5.1 Project Title" value={data.projectTitle} onChange={e => onChange({...data, projectTitle: e.target.value})} disabled={readOnly} />
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2 font-dynapuff">5.2 Project Summary (Max 250 words)</label>
                        <textarea className="w-full px-4 py-3 rounded-xl border border-gray-200 h-32" value={data.summary} onChange={e => onChange({...data, summary: e.target.value})} disabled={readOnly} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 font-dynapuff">5.3 Positive Outcomes</label>
                        <div className="space-y-3">
                            {[0, 1, 2].map(i => (
                                <div key={i} className="flex gap-2 items-center">
                                    <span className="font-bold text-gray-400">{i+1}:</span>
                                    <input 
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-brand-purple outline-none" 
                                        value={data.formData?.positiveOutcomes?.[i] || ''} 
                                        onChange={e => handleOutcomeChange(i, e.target.value)}
                                        disabled={readOnly}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 6. Budget */}
                <section>
                    <h3 className="text-xl font-bold text-gray-800 font-dynapuff border-b pb-2 mb-4">6. Budget</h3>
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <Input label="a) Total Project Cost (£)" type="number" value={data.totalCost} onChange={e => onChange({...data, totalCost: Number(e.target.value)})} disabled={readOnly} />
                        <Input label="Amount Applied For (£)" type="number" value={data.amountRequested} onChange={e => onChange({...data, amountRequested: Number(e.target.value)})} disabled={readOnly} />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-bold text-gray-700 mb-2 font-dynapuff">b) Other Funding Sources</label>
                        <textarea 
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 h-20" 
                            placeholder="List grants, donations, in-kind contributions..."
                            value={data.formData?.otherFundingSources || ''}
                            onChange={e => updateFormData('otherFundingSources', e.target.value)}
                            disabled={readOnly}
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-bold text-gray-700 mb-2 font-dynapuff">c) Break Down for Cross-Area Applications</label>
                        <textarea 
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 h-20" 
                            placeholder="Details about project logistics and costs for each area..."
                            value={data.formData?.crossAreaBreakdown || ''}
                            onChange={e => updateFormData('crossAreaBreakdown', e.target.value)}
                            disabled={readOnly}
                        />
                    </div>
                </section>

                {/* 7. Alignment */}
                <section>
                    <h3 className="text-xl font-bold text-gray-800 font-dynapuff border-b pb-2 mb-4">7. Alignment with Priorities</h3>
                    
                    <div className="mb-6">
                        <h4 className="font-bold text-gray-700 mb-2">a) Alignment with the Marmot Principles</h4>
                        <div className="grid md:grid-cols-2 gap-2">
                            {MARMOT_PRINCIPLES.map(p => (
                                <label key={p} className="flex items-start gap-2 text-sm text-gray-600">
                                    <input type="checkbox" className="mt-1" checked={data.formData?.marmotPrinciples?.includes(p)} onChange={(e) => {
                                        if (readOnly) return;
                                        const current = data.formData?.marmotPrinciples || [];
                                        const updated = e.target.checked ? [...current, p] : current.filter(x => x !== p);
                                        updateFormData('marmotPrinciples', updated);
                                    }} disabled={readOnly} />
                                    {p}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="mb-6">
                        <h4 className="font-bold text-gray-700 mb-2">b) Well-being of Future Generations Goals</h4>
                        <div className="grid md:grid-cols-2 gap-2">
                            {WFG_GOALS.map(g => (
                                <label key={g} className="flex items-start gap-2 text-sm text-gray-600">
                                    <input type="checkbox" className="mt-1" checked={data.formData?.wfgGoals?.includes(g)} onChange={(e) => {
                                        if (readOnly) return;
                                        const current = data.formData?.wfgGoals || [];
                                        const updated = e.target.checked ? [...current, g] : current.filter(x => x !== g);
                                        updateFormData('wfgGoals', updated);
                                    }} disabled={readOnly} />
                                    {g}
                                </label>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 8. Declarations */}
                <section>
                    <h3 className="text-xl font-bold text-gray-800 font-dynapuff border-b pb-2 mb-4">8. Declarations & Consent</h3>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <label className="flex items-center gap-2 mb-4">
                            <input type="checkbox" checked={data.formData?.declarationSigned || false} onChange={e => updateFormData('declarationSigned', e.target.checked)} disabled={readOnly} className="w-5 h-5 accent-brand-purple" />
                            <span className="text-sm font-bold text-gray-700">I confirm that I have read, understood and consent to the GDPR Policy. I declare the information provided is true and correct.</span>
                        </label>
                        <div className="grid md:grid-cols-2 gap-6">
                             <Input label="Name (Signature)" value={data.formData?.declarationName || ''} onChange={e => updateFormData('declarationName', e.target.value)} disabled={readOnly} />
                             <Input label="Date" type="date" value={data.formData?.declarationDate || ''} onChange={e => updateFormData('declarationDate', e.target.value)} disabled={readOnly} />
                        </div>
                    </div>
                </section>

                <div className="flex gap-4 border-t pt-8">
                    {!readOnly && (
                        <>
                            <Button type="submit" size="lg" className="flex-1 shadow-xl">Submit Stage 1</Button>
                            <Button type="button" variant="ghost" onClick={onCancel}>Save Draft & Exit</Button>
                        </>
                    )}
                </div>
            </form>
        </div>
    );
};

// Stage 2 (Full Application) Component
export const DigitalStage2Form: React.FC<{
    data: Partial<Application>;
    onChange: (newData: Partial<Application>) => void;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    readOnly?: boolean;
}> = ({ data, onChange, onSubmit, onCancel, readOnly = false }) => {

    const updateFormData = (field: string, value: any) => {
        onChange({
            ...data,
            formData: { ...data.formData, [field]: value }
        });
    };

    const budgetLines: BudgetLine[] = data.formData?.budgetBreakdown || [];

    const handleBudgetChange = (idx: number, field: keyof BudgetLine, val: string | number) => {
        if (readOnly) return;
        const newLines = [...budgetLines];
        newLines[idx] = { ...newLines[idx], [field]: val };
        
        // Recalculate total
        const total = newLines.reduce((sum, line) => sum + (Number(line.cost) || 0), 0);
        
        onChange({
            ...data,
            totalCost: total,
            amountRequested: total, // Usually same in full app unless partial funding
            formData: { ...data.formData, budgetBreakdown: newLines }
        });
    };

    const addBudgetLine = () => {
        if (readOnly) return;
        updateFormData('budgetBreakdown', [...budgetLines, { item: '', note: '', cost: 0 }]);
    };

    const removeBudgetLine = (idx: number) => {
        if (readOnly) return;
        const newLines = budgetLines.filter((_, i) => i !== idx);
        // Recalc total
        const total = newLines.reduce((sum, line) => sum + (Number(line.cost) || 0), 0);
        onChange({
            ...data,
            totalCost: total,
            amountRequested: total,
            formData: { ...data.formData, budgetBreakdown: newLines }
        });
    };
    
    // Helpers for checklist toggle
    const toggleChecklist = (item: string) => {
        const current = data.formData?.checklist || [];
        const updated = current.includes(item) ? current.filter(i => i !== item) : [...current, item];
        updateFormData('checklist', updated);
    };

    const toggleDeclaration = (item: string) => {
        const current = data.formData?.declarationStatements || [];
        const updated = current.includes(item) ? current.filter(i => i !== item) : [...current, item];
        updateFormData('declarationStatements', updated);
    };

    return (
        <div className="bg-white rounded-3xl shadow-xl border border-teal-100 overflow-hidden max-w-5xl mx-auto">
            <div className="bg-brand-darkTeal p-6 text-white flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold font-dynapuff">Full Application</h2>
                    <p className="opacity-90">Stage 2 Submission (Digital)</p>
                </div>
                {readOnly && <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold">Preview Mode</span>}
            </div>
            <form onSubmit={onSubmit} className="p-8 space-y-10">
                
                {/* 1. Organisation Details */}
                <section>
                    <h3 className="text-xl font-bold text-gray-800 font-dynapuff border-b pb-2 mb-4">1. Applicant & Bank Information</h3>
                    <div className="grid md:grid-cols-2 gap-6 mb-4">
                        <Input label="Organisation Name" value={data.orgName} disabled />
                        <Input label="Charity Number (if applicable)" value={data.formData?.charityNumber || ''} onChange={e => updateFormData('charityNumber', e.target.value)} disabled={readOnly} />
                        <Input label="Companies House No. (if applicable)" value={data.formData?.companyNumber || ''} onChange={e => updateFormData('companyNumber', e.target.value)} disabled={readOnly} />
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <h4 className="font-bold text-gray-700 mb-3">Registered Address</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                            <Input label="No. / Street" value={data.formData?.addressStreet || ''} onChange={e => updateFormData('addressStreet', e.target.value)} disabled={readOnly} />
                            <Input label="Town / City" value={data.formData?.addressTown || ''} onChange={e => updateFormData('addressTown', e.target.value)} disabled={readOnly} />
                            <Input label="Postcode" value={data.formData?.addressPostcode || ''} onChange={e => updateFormData('addressPostcode', e.target.value)} disabled={readOnly} />
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mt-4">
                        <h4 className="font-bold text-gray-700 mb-3">1.3 Bank Account Details (For Funding)</h4>
                        <div className="grid md:grid-cols-2 gap-6">
                            <Input label="Account Name" placeholder="e.g. Blaenavon Blues FC" value={data.formData?.bankAccountName || ''} onChange={e => updateFormData('bankAccountName', e.target.value)} disabled={readOnly} />
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Sort Code" placeholder="XX-XX-XX" value={data.formData?.bankSortCode || ''} onChange={e => updateFormData('bankSortCode', e.target.value)} disabled={readOnly} />
                                <Input label="Account Number" placeholder="8 digits" value={data.formData?.bankAccountNumber || ''} onChange={e => updateFormData('bankAccountNumber', e.target.value)} disabled={readOnly} />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">These details will only be used if your application is successful.</p>
                    </div>
                </section>

                {/* 2. Detailed Proposal */}
                <section>
                    <h3 className="text-xl font-bold text-gray-800 font-dynapuff border-b pb-2 mb-4">2. Your Project in More Detail</h3>
                    <div className="space-y-6">
                        <Input label="2.1 Project Title" value={data.projectTitle} disabled />
                        
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 font-dynapuff">2.2 Project Overview</label>
                            <p className="text-xs text-gray-500 mb-2">Describe main purpose, target beneficiaries, and expected outcomes (SMART objectives). 150-200 words.</p>
                            <textarea className="w-full px-4 py-3 rounded-xl border border-gray-200 h-32" 
                                value={data.formData?.projectOverview || ''} onChange={e => updateFormData('projectOverview', e.target.value)} disabled={readOnly} />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 font-dynapuff">2.3 Project Activities and Delivery Plan</label>
                            <p className="text-xs text-gray-500 mb-2">Outline activities, services, events, key milestones, and responsibilities. 150-200 words.</p>
                            <textarea className="w-full px-4 py-3 rounded-xl border border-gray-200 h-32" 
                                value={data.formData?.activities || ''} onChange={e => updateFormData('activities', e.target.value)} disabled={readOnly} />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 font-dynapuff">2.4 Community Benefit and Impact</label>
                            <p className="text-xs text-gray-500 mb-2">How it responds to top priorities, short-term and long-term impacts. 150-200 words.</p>
                            <textarea className="w-full px-4 py-3 rounded-xl border border-gray-200 h-32" 
                                value={data.formData?.communityBenefit || ''} onChange={e => updateFormData('communityBenefit', e.target.value)} disabled={readOnly} />
                        </div>
                        
                         <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 font-dynapuff">2.5 Collaborations and Partnerships</label>
                            <p className="text-xs text-gray-500 mb-2">Identify partners and their roles. 75-100 words.</p>
                            <textarea className="w-full px-4 py-3 rounded-xl border border-gray-200 h-24" 
                                value={data.formData?.collaborations || ''} onChange={e => updateFormData('collaborations', e.target.value)} disabled={readOnly} />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 font-dynapuff">2.6 Risk Management and Feasibility</label>
                            <p className="text-xs text-gray-500 mb-2">Identify risks/challenges and how you will manage them. 50-75 words.</p>
                            <textarea className="w-full px-4 py-3 rounded-xl border border-gray-200 h-24" 
                                value={data.formData?.risks || ''} onChange={e => updateFormData('risks', e.target.value)} disabled={readOnly} />
                        </div>
                    </div>
                </section>
                
                {/* 2.7 & 2.8 Alignment Justification (Dynamic based on Part 1) */}
                <section>
                    <h3 className="text-xl font-bold text-gray-800 font-dynapuff border-b pb-2 mb-4">2.7 & 2.8 Alignment</h3>
                    
                    <div className="mb-6">
                        <h4 className="font-bold text-gray-700 mb-2">2.7 Alignment with Marmot Principles</h4>
                        <p className="text-xs text-gray-500 mb-4">Explain how your project supports the principles you selected in Part 1.</p>
                        
                        {!data.formData?.marmotPrinciples || data.formData.marmotPrinciples.length === 0 ? (
                            <div className="text-gray-400 italic">No Marmot Principles selected in Part 1.</div>
                        ) : (
                            <div className="space-y-4">
                                {data.formData.marmotPrinciples.map(principle => (
                                    <div key={principle} className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                                        <div className="font-bold text-brand-purple mb-2">{principle}</div>
                                        <textarea 
                                            className="w-full px-3 py-2 rounded border border-gray-200 text-sm"
                                            placeholder="Practical example of how your project contributes..."
                                            value={data.formData?.marmotExplanations?.[principle] || ''}
                                            onChange={e => {
                                                const newExplanations = { ...data.formData?.marmotExplanations, [principle]: e.target.value };
                                                updateFormData('marmotExplanations', newExplanations);
                                            }}
                                            disabled={readOnly}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <div>
                        <h4 className="font-bold text-gray-700 mb-2">2.8 Wellbeing of Future Generations (WFG) Goals</h4>
                         <p className="text-xs text-gray-500 mb-4">Justify only those you ticked in Part 1.</p>

                        {!data.formData?.wfgGoals || data.formData.wfgGoals.length === 0 ? (
                            <div className="text-gray-400 italic">No WFG Goals selected in Part 1.</div>
                        ) : (
                            <div className="space-y-4">
                                {data.formData.wfgGoals.map(goal => (
                                    <div key={goal} className="bg-teal-50 p-4 rounded-xl border border-teal-100">
                                        <div className="font-bold text-brand-teal mb-2">{goal}</div>
                                        <textarea 
                                            className="w-full px-3 py-2 rounded border border-gray-200 text-sm"
                                            placeholder="Specific activity or outcome..."
                                            value={data.formData?.wfgExplanations?.[goal] || ''}
                                            onChange={e => {
                                                const newExplanations = { ...data.formData?.wfgExplanations, [goal]: e.target.value };
                                                updateFormData('wfgExplanations', newExplanations);
                                            }}
                                            disabled={readOnly}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
                
                {/* 3. Project Timeline */}
                <section>
                    <h3 className="text-xl font-bold text-gray-800 font-dynapuff border-b pb-2 mb-4">3. Project Timeline</h3>
                    <p className="text-sm text-gray-600 mb-4">Provide definitive dates.</p>
                    <div className="grid md:grid-cols-3 gap-4">
                        <Input label="Start Date" type="date" value={data.formData?.startDate || ''} onChange={e => updateFormData('startDate', e.target.value)} disabled={readOnly} />
                        <Input label="End Date" type="date" value={data.formData?.endDate || ''} onChange={e => updateFormData('endDate', e.target.value)} disabled={readOnly} />
                        <Input label="Duration" placeholder="e.g. 6 months" value={data.formData?.duration || ''} onChange={e => updateFormData('duration', e.target.value)} disabled={readOnly} />
                    </div>
                </section>

                {/* 4. Detailed Budget */}
                <section>
                    <h3 className="text-xl font-bold text-gray-800 font-dynapuff border-b pb-2 mb-4">4. Budget and Cost Breakdown</h3>
                    <p className="text-sm text-gray-600 mb-4">Please list all costs associated with your project. You can add as many rows as needed.</p>
                    
                    <div className="space-y-2 mb-4">
                        {/* Header Row */}
                        <div className="hidden md:grid grid-cols-12 gap-2 font-bold text-gray-500 text-sm px-2">
                            <div className="col-span-5">Item Description</div>
                            <div className="col-span-4">Notes / Justification</div>
                            <div className="col-span-2">Cost (£)</div>
                            <div className="col-span-1"></div>
                        </div>

                        {budgetLines.map((line, idx) => (
                            <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start bg-gray-50 p-2 rounded-lg">
                                <div className="md:col-span-5">
                                    <input className="w-full px-3 py-2 rounded border border-gray-300" placeholder="Item" value={line.item} onChange={e => handleBudgetChange(idx, 'item', e.target.value)} disabled={readOnly} />
                                </div>
                                <div className="md:col-span-4">
                                    <input className="w-full px-3 py-2 rounded border border-gray-300" placeholder="Note" value={line.note} onChange={e => handleBudgetChange(idx, 'note', e.target.value)} disabled={readOnly} />
                                </div>
                                <div className="md:col-span-2">
                                    <input className="w-full px-3 py-2 rounded border border-gray-300" type="number" placeholder="0.00" value={line.cost} onChange={e => handleBudgetChange(idx, 'cost', e.target.value)} disabled={readOnly} />
                                </div>
                                <div className="md:col-span-1 flex justify-end">
                                    {!readOnly && (
                                        <button type="button" onClick={() => removeBudgetLine(idx)} className="text-red-500 hover:bg-red-100 p-2 rounded">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {!readOnly && (
                        <Button type="button" variant="secondary" onClick={addBudgetLine} size="sm" className="mb-6">
                            + Add Budget Item
                        </Button>
                    )}

                    <div className="flex justify-end items-center gap-4 bg-teal-50 p-4 rounded-xl border border-teal-200 mb-6">
                        <span className="font-bold text-teal-800 text-lg">Total Project Cost:</span>
                        <span className="font-bold text-2xl text-teal-900">£{data.totalCost?.toFixed(2) || '0.00'}</span>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 font-dynapuff">4.1 Area-Specific Costs / 4.2 Additional Budget Information</label>
                        <p className="text-xs text-gray-500 mb-2">Include in-kind contributions, match funding, or cross-area breakdowns. 100-150 words.</p>
                        <textarea className="w-full px-4 py-3 rounded-xl border border-gray-200 h-24" 
                            value={data.formData?.additionalBudgetInfo || ''} onChange={e => updateFormData('additionalBudgetInfo', e.target.value)} disabled={readOnly} />
                    </div>
                </section>

                {/* Declarations & Checklists */}
                <section>
                    <h3 className="text-xl font-bold text-gray-800 font-dynapuff border-b pb-2 mb-4">Declarations & Attachments</h3>
                    
                    <div className="mb-6">
                        <h4 className="font-bold text-gray-700 mb-3">4.4 Attachments Checklist</h4>
                        <div className="grid md:grid-cols-2 gap-2">
                            {[
                                "Constitution / Governing Document",
                                "Equality & Inclusion Policy",
                                "Safeguarding Policy",
                                "Data Protection / GDPR Policy",
                                "Recent Bank Statement",
                                "Insurance, DBS, Qualification Certs",
                                "Public Liability Insurance"
                            ].map(item => (
                                <label key={item} className="flex items-center gap-2 text-sm text-gray-700 p-2 border rounded-lg hover:bg-gray-50">
                                    <input 
                                        type="checkbox" 
                                        checked={data.formData?.checklist?.includes(item) || false} 
                                        onChange={() => toggleChecklist(item)} 
                                        disabled={readOnly} 
                                        className="accent-brand-darkTeal"
                                    />
                                    {item}
                                </label>
                            ))}
                        </div>
                    </div>
                    
                    <div className="mb-6">
                         <h4 className="font-bold text-gray-700 mb-3">4.5 Declaration Statements</h4>
                         <div className="space-y-2">
                            {[
                                "I consent to the Communities' Choice team withdrawing this application at its discretion.",
                                "The information in this application is true and accurate.",
                                "I agree to the GDPR policy and consent to scrutiny/scoring/monitoring.",
                                "Image/Logo provided for promotion.",
                                "I confirm other funding sources declared.",
                                "I acknowledge obligation to attend and present at the Community Voting Event."
                            ].map((stmt, idx) => (
                                <label key={idx} className="flex items-start gap-2 text-sm text-gray-700 p-2 border rounded-lg hover:bg-gray-50">
                                    <input 
                                        type="checkbox" 
                                        checked={data.formData?.declarationStatements?.includes(stmt) || false} 
                                        onChange={() => toggleDeclaration(stmt)} 
                                        disabled={readOnly} 
                                        className="mt-1 accent-brand-darkTeal"
                                    />
                                    {stmt}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <div className="grid md:grid-cols-2 gap-6">
                             <Input label="Name (Signature)" value={data.formData?.declarationName2 || ''} onChange={e => updateFormData('declarationName2', e.target.value)} disabled={readOnly} />
                             <Input label="Date" type="date" value={data.formData?.declarationDate2 || ''} onChange={e => updateFormData('declarationDate2', e.target.value)} disabled={readOnly} />
                        </div>
                    </div>
                </section>

                <div className="flex gap-4 border-t pt-8">
                    {!readOnly && (
                        <>
                            <Button type="submit" size="lg" className="flex-1 shadow-xl bg-brand-darkTeal hover:bg-teal-800">Submit Full Application</Button>
                            <Button type="button" variant="ghost" onClick={onCancel}>Save Draft & Exit</Button>
                        </>
                    )}
                </div>
            </form>
        </div>
    );
};

// --- SCORE MODAL (COMMITTEE) ---
const ScoreModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    app: Application;
    existingScore?: Score;
    onSubmit: (s: Score) => void;
    readOnly?: boolean;
}> = ({ isOpen, onClose, app, existingScore, onSubmit, readOnly }) => {
    const user = JSON.parse(localStorage.getItem('users') || '[]').find((u:User) => u.email.includes('committee')) || { uid: 'guest', displayName: 'Guest' }; // Fallback for dev

    const [scores, setScores] = useState<Record<string, number>>(existingScore?.scores || {});
    const [notes, setNotes] = useState<Record<string, string>>(existingScore?.notes || {});

    // Live Calculation
    const { rawTotal, weightedTotalPercent } = useMemo(() => {
        let rTotal = 0;
        let wTotal = 0;
        
        SCORING_CRITERIA.forEach(c => {
            const val = scores[c.id] || 0;
            rTotal += val;
            wTotal += (val / 3) * c.weight; // (Score / Max) * Weight
        });

        return { rawTotal: rTotal, weightedTotalPercent: Math.round(wTotal) };
    }, [scores]);

    const handleSubmit = () => {
        const scoreData: Score = {
            appId: app.id,
            scorerId: existingScore?.scorerId || user.uid,
            scorerName: existingScore?.scorerName || user.displayName || 'Committee Member',
            scores,
            notes,
            isFinal: true,
            total: rawTotal,
            timestamp: Date.now()
        };
        onSubmit(scoreData);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Score: ${app.projectTitle}`} size="xl">
            <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                    {SCORING_CRITERIA.map((criterion) => (
                        <div key={criterion.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                             <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="font-bold text-gray-800">{criterion.name} <span className="text-xs text-gray-500 font-normal">({criterion.weight}%)</span></h4>
                                    <p className="text-sm text-gray-600 mb-2">{criterion.guidance}</p>
                                </div>
                                <div className="flex gap-1 bg-white p-1 rounded-lg border border-gray-300">
                                    {[0, 1, 2, 3].map(val => (
                                        <button
                                            key={val}
                                            onClick={() => !readOnly && setScores(prev => ({ ...prev, [criterion.id]: val }))}
                                            className={`w-8 h-8 rounded-md font-bold transition-all ${
                                                scores[criterion.id] === val 
                                                ? 'bg-brand-purple text-white shadow-md transform scale-110' 
                                                : 'text-gray-400 hover:bg-gray-100'
                                            }`}
                                            disabled={readOnly}
                                        >
                                            {val}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <details className="text-xs text-gray-500 mb-3 cursor-pointer">
                                <summary>View Scoring Matrix Guidance</summary>
                                <div className="mt-2 p-2 bg-white rounded border border-gray-100" dangerouslySetInnerHTML={{ __html: criterion.details }} />
                            </details>

                            <input 
                                className="w-full text-sm p-2 rounded border border-gray-200" 
                                placeholder="Add comments/justification..." 
                                value={notes[criterion.id] || ''}
                                onChange={e => setNotes(prev => ({ ...prev, [criterion.id]: e.target.value }))}
                                disabled={readOnly}
                            />
                        </div>
                    ))}
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center bg-white sticky bottom-0">
                     <div className="flex gap-4">
                        <div className="bg-purple-50 px-4 py-2 rounded-lg border border-purple-100">
                            <span className="block text-xs text-purple-600 font-bold uppercase">Raw Score</span>
                            <span className="text-xl font-bold text-purple-800">{rawTotal} / 30</span>
                        </div>
                        <div className={`px-4 py-2 rounded-lg border flex flex-col items-center ${
                            weightedTotalPercent >= 50 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
                        }`}>
                            <span className={`block text-xs font-bold uppercase ${weightedTotalPercent >= 50 ? 'text-green-600' : 'text-red-600'}`}>Weighted %</span>
                            <span className={`text-xl font-bold ${weightedTotalPercent >= 50 ? 'text-green-800' : 'text-red-800'}`}>{weightedTotalPercent}%</span>
                        </div>
                    </div>
                    
                    {!readOnly && (
                        <div className="flex gap-2">
                             <Button variant="ghost" onClick={onClose}>Cancel</Button>
                             <Button onClick={handleSubmit}>Submit Scores</Button>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};


// --- DASHBOARDS ---

export const ApplicantDashboard: React.FC<{ user: User }> = ({ user }) => {
    const [apps, setApps] = useState<Application[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'stage1' | 'stage2'>('list');
    const [activeApp, setActiveApp] = useState<Partial<Application>>({});
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [currUser, setCurrUser] = useState(user);

    useEffect(() => {
        api.getApplications().then(all => setApps(all.filter(a => a.userId === user.uid)));
    }, [user.uid, viewMode]);

    const startStage1 = () => {
        setActiveApp({ 
            userId: user.uid, 
            status: 'Draft', 
            submissionMethod: 'digital',
            formData: {
                budgetBreakdown: []
            }
        });
        setViewMode('stage1');
    };

    const startStage2 = (app: Application) => {
        setActiveApp({ ...app, status: 'Draft' }); // Preserves ID and Stage 1 data
        setViewMode('stage2');
    };

    const handleSubmitStage1 = async (e: React.FormEvent) => {
        e.preventDefault();
        if (activeApp.id) {
             await api.updateApplication(activeApp.id, { ...activeApp, status: 'Submitted-Stage1' });
        } else {
             await api.createApplication({ ...activeApp, status: 'Submitted-Stage1' } as any);
        }
        setViewMode('list');
    };
    
    const handleSubmitStage2 = async (e: React.FormEvent) => {
        e.preventDefault();
        if (activeApp.id) {
             await api.updateApplication(activeApp.id, { ...activeApp, status: 'Submitted-Stage2' });
        }
        setViewMode('list');
    };

    if (viewMode === 'stage1') return <DigitalStage1Form data={activeApp} onChange={setActiveApp} onSubmit={handleSubmitStage1} onCancel={() => setViewMode('list')} />;
    if (viewMode === 'stage2') return <DigitalStage2Form data={activeApp} onChange={setActiveApp} onSubmit={handleSubmitStage2} onCancel={() => setViewMode('list')} />;

    return (
        <div className="container mx-auto px-4 py-8 animate-fade-in">
             <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold font-dynapuff text-brand-purple">Welcome, {currUser.displayName}!</h1>
                    <p className="text-gray-600">Manage your applications and profile.</p>
                </div>
                <Button variant="outline" onClick={() => setIsProfileOpen(true)}>Edit Profile</Button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold font-dynapuff text-gray-800">My Applications</h2>
                            <Button onClick={startStage1}>+ New EOI</Button>
                        </div>
                        
                        {apps.length === 0 ? (
                            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                <p className="text-gray-500 mb-4">You haven't submitted any applications yet.</p>
                                <Button variant="secondary" onClick={startStage1}>Start Stage 1 (EOI)</Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {apps.map(app => (
                                    <div key={app.id} className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-lg text-brand-purple">{app.projectTitle}</h3>
                                                <Badge>{app.status}</Badge>
                                            </div>
                                            <p className="text-sm text-gray-500">Ref: {app.ref} • {new Date(app.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            {app.status === 'Draft' && <Button size="sm" onClick={() => { setActiveApp(app); setViewMode('stage1'); }}>Edit</Button>}
                                            {app.status === 'Invited-Stage2' && <Button size="sm" variant="secondary" onClick={() => startStage2(app)}>Start Stage 2</Button>}
                                            {app.status === 'Submitted-Stage1' && <span className="text-sm text-gray-400 italic px-2">Under Review</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>

                <div>
                    <Card className="bg-gradient-to-br from-purple-50 to-white">
                        <h3 className="font-bold font-dynapuff text-brand-purple mb-4">Quick Guide</h3>
                        <ul className="space-y-3 text-sm text-gray-600">
                            <li className="flex gap-2"><span className="font-bold text-brand-teal">1.</span> Submit Stage 1 Expression of Interest (EOI).</li>
                            <li className="flex gap-2"><span className="font-bold text-brand-teal">2.</span> Committee reviews EOI against priorities.</li>
                            <li className="flex gap-2"><span className="font-bold text-brand-teal">3.</span> Successful projects invited to Stage 2.</li>
                            <li className="flex gap-2"><span className="font-bold text-brand-teal">4.</span> Submit detailed Full Application.</li>
                            <li className="flex gap-2"><span className="font-bold text-brand-teal">5.</span> Public vote decides the winners!</li>
                        </ul>
                    </Card>
                </div>
            </div>
            
            <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} user={currUser} onSave={setCurrUser} />
        </div>
    );
};

export const CommitteeDashboard: React.FC<{ user: User, onUpdateUser: (u:User)=>void, isAdmin?: boolean, onReturnToAdmin?: ()=>void }> = ({ user, onUpdateUser, isAdmin, onReturnToAdmin }) => {
    const [apps, setApps] = useState<Application[]>([]);
    const [scores, setScores] = useState<Score[]>([]);
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    useEffect(() => {
        const load = async () => {
             const allApps = await api.getApplications(isAdmin ? 'All' : user.area);
             // Filter for only those ready for review
             setApps(allApps.filter(a => ['Submitted-Stage1', 'Invited-Stage2', 'Submitted-Stage2', 'Finalist'].includes(a.status)));
             
             const allScores = await api.getScores();
             setScores(allScores.filter(s => s.scorerId === user.uid));
        };
        load();
    }, [user.area, user.uid, isAdmin]);

    const handleSaveScore = async (score: Score) => {
        await api.saveScore(score);
        const allScores = await api.getScores();
        setScores(allScores.filter(s => s.scorerId === user.uid));
    };

    return (
        <div className="container mx-auto px-4 py-8 animate-fade-in">
             <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold font-dynapuff text-brand-purple flex items-center gap-2">
                        {isAdmin && <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded border border-red-200">ADMIN MODE</span>}
                        Committee Dashboard
                    </h1>
                    <p className="text-gray-600">Review and score applications for {user.area || 'All Areas'}.</p>
                </div>
                <div className="flex gap-2">
                    {isAdmin && <Button variant="ghost" onClick={onReturnToAdmin}>Exit Scoring View</Button>}
                    <Button variant="outline" onClick={() => setIsProfileOpen(true)}>My Profile</Button>
                </div>
            </div>
            
            {/* Stats/Docs Row */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
                <Card className="md:col-span-3">
                     <h3 className="font-bold font-dynapuff text-gray-800 mb-4">Reference Documents</h3>
                     <div className="grid md:grid-cols-3 gap-4">
                        {COMMITTEE_DOCS.map((doc, i) => (
                            <a key={i} href={doc.url} target="_blank" rel="noreferrer" className="block p-4 rounded-xl border border-gray-200 hover:border-brand-purple hover:bg-purple-50 transition-all group">
                                <div className="font-bold text-brand-purple group-hover:underline truncate">{doc.title}</div>
                                <div className="text-xs text-gray-500 mt-1 line-clamp-2">{doc.desc}</div>
                            </a>
                        ))}
                     </div>
                </Card>
                <Card className="bg-brand-purple text-white flex flex-col justify-center items-center text-center">
                    <div className="text-4xl font-bold font-dynapuff mb-2">{scores.length} / {apps.length}</div>
                    <div className="opacity-90 text-sm">Applications Scored</div>
                </Card>
            </div>

            <div className="grid md:grid-cols-1 gap-6">
                {apps.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 font-bold text-xl">No applications available for review yet.</div>
                ) : (
                    apps.map(app => {
                        const myScore = scores.find(s => s.appId === app.id);
                        return (
                            <div key={app.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <Badge>{app.ref}</Badge>
                                            <Badge variant={null}>{app.status}</Badge>
                                            {myScore && <span className="text-green-600 font-bold text-sm flex items-center gap-1">✓ Scored ({myScore.total}/30)</span>}
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-800">{app.projectTitle}</h3>
                                        <p className="text-brand-purple font-bold">{app.orgName}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {app.pdfUrl && <a href={app.pdfUrl} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 font-bold text-sm flex items-center gap-2">View PDF ↗</a>}
                                        <Button onClick={() => setSelectedApp(app)}>
                                            {myScore ? 'Update Score' : 'Evaluate Project'}
                                        </Button>
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-700 leading-relaxed border border-gray-100">
                                    <span className="font-bold block text-gray-500 text-xs uppercase mb-1">Project Summary</span>
                                    {app.summary}
                                </div>
                                <div className="mt-4 flex gap-6 text-sm text-gray-500">
                                    <div><strong>Cost:</strong> £{app.totalCost}</div>
                                    <div><strong>Requested:</strong> £{app.amountRequested}</div>
                                    <div><strong>Priority:</strong> {app.priority || 'Not specified'}</div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {selectedApp && (
                <ScoreModal 
                    isOpen={!!selectedApp} 
                    onClose={() => setSelectedApp(null)} 
                    app={selectedApp} 
                    existingScore={scores.find(s => s.appId === selectedApp.id)}
                    onSubmit={handleSaveScore}
                />
            )}
            
            <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} user={user} onSave={onUpdateUser} />
        </div>
    );
};

export const AdminDashboard: React.FC<{ onNavigatePublic: (view:string)=>void, onNavigateScoring: ()=>void }> = ({ onNavigatePublic, onNavigateScoring }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [users, setUsers] = useState<User[]>([]);
    const [apps, setApps] = useState<Application[]>([]);
    const [settings, setSettings] = useState<PortalSettings>({ stage1Visible: true, stage2Visible: false, votingOpen: false });
    const [isSeeding, setIsSeeding] = useState(false);
    
    // Admin editing states
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);

    // Super View States
    const [previewMode, setPreviewMode] = useState<'stage1' | 'stage2' | null>(null);

    const refreshData = async () => {
        setUsers(await api.getUsers());
        setApps(await api.getApplications());
        setSettings(await api.getPortalSettings());
    };

    useEffect(() => { refreshData(); }, []);

    const toggleSetting = async (key: keyof PortalSettings) => {
        const newSettings = { ...settings, [key]: !settings[key] };
        await api.updatePortalSettings(newSettings);
        setSettings(newSettings);
    };

    const handleDeleteUser = async (uid: string) => {
        if (confirm('Are you sure you want to delete this user?')) {
            await api.deleteUser(uid);
            refreshData();
        }
    };
    
    const handleResetScores = async (uid: string) => {
        if (confirm('Reset all scores for this committee member?')) {
            await api.resetUserScores(uid);
            alert('Scores wiped.');
        }
    };

    const handleSeedDatabase = async () => {
        if (confirm("WARNING: This will overwrite specific IDs in your Firestore database with the default Demo Data. Continue?")) {
            setIsSeeding(true);
            try {
                await seedDatabase();
                alert("Database Seeded Successfully! Refreshing data...");
                await refreshData();
            } catch (e: any) {
                alert("Error: " + e.message);
            } finally {
                setIsSeeding(false);
            }
        }
    };

    // Dummy app for preview
    const dummyApp: Partial<Application> = {
        applicantName: 'Development Preview',
        orgName: 'Test Organisation',
        projectTitle: 'Development Test Project',
        area: 'Blaenavon',
        summary: 'This is a test summary for the Super User view to validate form logic.',
        totalCost: 1500,
        amountRequested: 1000,
        formData: {
            budgetBreakdown: [
                { item: 'Test Item 1', note: 'Essential equipment', cost: 500 },
                { item: 'Test Item 2', note: 'Labor costs', cost: 1000 }
            ],
            bankAccountName: 'Test Bank Account',
            bankSortCode: '12-34-56',
            bankAccountNumber: '12345678',
            marmotPrinciples: [
                "Give every child the best start in life",
                "Create fair employment and good work for all"
            ],
            wfgGoals: [
                "A prosperous Wales",
                "A resilient Wales"
            ]
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 animate-fade-in">
             <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold font-dynapuff text-brand-purple">System Administration</h1>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => onNavigatePublic('home')}>View Public Site</Button>
                    <Button onClick={onNavigateScoring}>Enter Scoring Mode</Button>
                </div>
            </div>

            <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
                {['overview', 'users', 'applications', 'settings', 'super-view'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === tab ? 'bg-brand-purple text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                    >
                        {tab === 'super-view' ? 'Super View (Dev)' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
                <div className="grid md:grid-cols-3 gap-6">
                    <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-none">
                        <h3 className="text-xl font-bold font-dynapuff opacity-90">Total Users</h3>
                        <div className="text-5xl font-bold my-4">{users.length}</div>
                        <div className="text-sm opacity-75">{users.filter(u => u.role === 'committee').length} Committee Members</div>
                    </Card>
                    <Card className="bg-gradient-to-br from-teal-400 to-emerald-600 text-white border-none">
                        <h3 className="text-xl font-bold font-dynapuff opacity-90">Applications</h3>
                        <div className="text-5xl font-bold my-4">{apps.length}</div>
                        <div className="text-sm opacity-75">{apps.filter(a => a.status.includes('Submitted')).length} Submitted</div>
                    </Card>
                    <Card className="bg-gradient-to-br from-pink-500 to-rose-500 text-white border-none">
                         <h3 className="text-xl font-bold font-dynapuff opacity-90">Portal Status</h3>
                         <div className="mt-4 space-y-2">
                            <div className="flex justify-between items-center">
                                <span>Stage 1 (EOI):</span>
                                <span className={`font-bold ${settings.stage1Visible ? 'text-white' : 'text-white/50'}`}>{settings.stage1Visible ? 'Active' : 'Hidden'}</span>
                            </div>
                             <div className="flex justify-between items-center">
                                <span>Stage 2 (Full):</span>
                                <span className={`font-bold ${settings.stage2Visible ? 'text-white' : 'text-white/50'}`}>{settings.stage2Visible ? 'Active' : 'Hidden'}</span>
                            </div>
                         </div>
                    </Card>
                </div>
            )}

            {/* USERS TAB */}
            {activeTab === 'users' && (
                <Card>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold font-dynapuff">User Management</h3>
                        <Button size="sm" onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }}>+ Create User</Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 text-gray-500 text-sm">
                                    <th className="p-3">Name</th>
                                    <th className="p-3">Role</th>
                                    <th className="p-3">Area</th>
                                    <th className="p-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.uid} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="p-3">
                                            <div className="font-bold text-gray-800">{u.displayName}</div>
                                            <div className="text-xs text-gray-400">{u.email}</div>
                                        </td>
                                        <td className="p-3"><Badge variant={u.role === 'admin' ? 'purple' : u.role === 'committee' ? 'teal' : 'gray'}>{u.role}</Badge></td>
                                        <td className="p-3 text-sm">{u.area || '-'}</td>
                                        <td className="p-3 text-right flex justify-end gap-2">
                                            <button onClick={() => { setEditingUser(u); setIsUserModalOpen(true); }} className="text-blue-500 hover:underline text-sm font-bold">Edit</button>
                                            {u.role === 'committee' && <button onClick={() => handleResetScores(u.uid)} className="text-orange-500 hover:underline text-sm font-bold">Wipe Scores</button>}
                                            <button onClick={() => handleDeleteUser(u.uid)} className="text-red-500 hover:underline text-sm font-bold">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <UserFormModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} user={editingUser} onSave={refreshData} />
                </Card>
            )}

            {/* APPLICATIONS TAB */}
            {activeTab === 'applications' && (
                <Card>
                    <h3 className="text-xl font-bold font-dynapuff mb-6">All Applications</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 text-gray-500 text-sm">
                                    <th className="p-3">Ref</th>
                                    <th className="p-3">Project Title</th>
                                    <th className="p-3">Organisation</th>
                                    <th className="p-3">Area</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {apps.map(a => (
                                    <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="p-3 text-sm font-mono">{a.ref}</td>
                                        <td className="p-3 font-bold">{a.projectTitle}</td>
                                        <td className="p-3 text-sm">{a.orgName}</td>
                                        <td className="p-3 text-sm">{a.area}</td>
                                        <td className="p-3"><Badge>{a.status}</Badge></td>
                                        <td className="p-3 text-right">
                                            <button 
                                                onClick={async () => {
                                                    if(confirm('Delete application?')) {
                                                        await api.deleteApplication(a.id);
                                                        refreshData();
                                                    }
                                                }} 
                                                className="text-red-500 hover:underline text-sm font-bold"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* SETTINGS TAB */}
            {activeTab === 'settings' && (
                <Card>
                    <h3 className="text-xl font-bold font-dynapuff mb-6">Global Portal Settings</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <div>
                                <h4 className="font-bold text-gray-800">Stage 1 Visibility</h4>
                                <p className="text-sm text-gray-500">Allow committee members to see Stage 1 (EOI) applications.</p>
                            </div>
                            <div 
                                onClick={() => toggleSetting('stage1Visible')}
                                className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-colors ${settings.stage1Visible ? 'bg-brand-purple' : 'bg-gray-300'}`}
                            >
                                <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${settings.stage1Visible ? 'translate-x-6' : 'translate-x-0'}`} />
                            </div>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <div>
                                <h4 className="font-bold text-gray-800">Stage 2 Visibility</h4>
                                <p className="text-sm text-gray-500">Allow committee members to see and score Full Applications.</p>
                            </div>
                            <div 
                                onClick={() => toggleSetting('stage2Visible')}
                                className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-colors ${settings.stage2Visible ? 'bg-brand-purple' : 'bg-gray-300'}`}
                            >
                                <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${settings.stage2Visible ? 'translate-x-6' : 'translate-x-0'}`} />
                            </div>
                        </div>

                         {/* DATABASE SEEDER (ONLY VISIBLE IF NOT IN DEMO MODE TO AVOID CONFUSION, OR ALWAYS VISIBLE IF YOU WANT TO FORCE UPLOAD) */}
                        {!USE_DEMO_MODE ? (
                            <div className="mt-8 pt-8 border-t border-gray-200">
                                <h4 className="font-bold text-gray-800 mb-2">Data Management</h4>
                                <p className="text-sm text-gray-500 mb-4">
                                    Use this to populate your Firestore database with the initial Committee members, demo applications, and default settings. 
                                    <br/><span className="text-red-500 font-bold">Note: This does not create Auth accounts (passwords), only the Firestore data profiles.</span>
                                </p>
                                <Button onClick={handleSeedDatabase} disabled={isSeeding} variant="secondary">
                                    {isSeeding ? 'Uploading...' : 'Seed Database from Demo Data'}
                                </Button>
                            </div>
                        ) : (
                             <div className="mt-8 pt-8 border-t border-gray-200 opacity-50">
                                <h4 className="font-bold text-gray-800 mb-2">Data Management</h4>
                                <p className="text-sm text-gray-500">
                                    Database seeding is disabled in Demo Mode. Connect real Firebase keys in services/firebase.ts to enable this feature.
                                </p>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* SUPER VIEW TAB (DEV PREVIEW) */}
            {activeTab === 'super-view' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-xl">
                        <h3 className="font-bold text-yellow-800">Super User Development Mode</h3>
                        <p className="text-sm text-yellow-700">These tools allow you to preview the application forms exactly as applicants see them, regardless of the current portal settings. Use this to verify logic and layout updates.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <Card 
                            onClick={() => setPreviewMode('stage1')}
                            className="cursor-pointer hover:border-brand-purple hover:ring-2 hover:ring-purple-100 transition-all group"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl">1</div>
                                <div>
                                    <h3 className="text-xl font-bold font-dynapuff text-gray-800 group-hover:text-brand-purple">Preview Stage 1 (EOI)</h3>
                                    <p className="text-sm text-gray-500">Expression of Interest Form</p>
                                </div>
                            </div>
                            <p className="text-gray-600 text-sm">
                                Launch the interactive Stage 1 form with dummy data. Checks validation, layout, and mobile responsiveness.
                            </p>
                        </Card>

                        <Card 
                            onClick={() => setPreviewMode('stage2')}
                            className="cursor-pointer hover:border-brand-teal hover:ring-2 hover:ring-teal-100 transition-all group"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center font-bold text-xl">2</div>
                                <div>
                                    <h3 className="text-xl font-bold font-dynapuff text-gray-800 group-hover:text-brand-teal">Preview Stage 2 (Full)</h3>
                                    <p className="text-sm text-gray-500">Full Application Form</p>
                                </div>
                            </div>
                            <p className="text-gray-600 text-sm">
                                Launch the Stage 2 form including the new <strong>Budget Builder</strong> and <strong>Bank Details</strong> sections.
                            </p>
                        </Card>
                    </div>
                </div>
            )}
            
            {/* PREVIEW MODAL */}
            {previewMode && (
                <Modal 
                    isOpen={!!previewMode} 
                    onClose={() => setPreviewMode(null)} 
                    title={`Development Preview: ${previewMode === 'stage1' ? 'Stage 1 EOI' : 'Stage 2 Full App'}`}
                    size="xl"
                >
                    <div className="bg-gray-100 p-4 rounded-xl mb-4 text-center text-sm font-bold text-gray-500 border border-gray-200 border-dashed">
                        INTERACTIVE PREVIEW MODE — DATA WILL NOT BE SAVED
                    </div>
                    {previewMode === 'stage1' ? (
                        <DigitalStage1Form 
                            data={dummyApp} 
                            onChange={() => {}} 
                            onSubmit={(e) => { e.preventDefault(); alert('Submission Simulated - Form Valid'); }} 
                            onCancel={() => setPreviewMode(null)} 
                        />
                    ) : (
                        <DigitalStage2Form 
                            data={dummyApp} 
                            onChange={() => {}} 
                            onSubmit={(e) => { e.preventDefault(); alert('Submission Simulated - Form Valid'); }} 
                            onCancel={() => setPreviewMode(null)} 
                        />
                    )}
                </Modal>
            )}
        </div>
    );
};
