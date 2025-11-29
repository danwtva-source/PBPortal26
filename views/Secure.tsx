

import React, { useEffect, useState, useRef } from 'react';
import { Application, User, Score, AREAS, Area, Role, BudgetLine, PortalSettings } from '../types';
import { COMMITTEE_DOCS, SCORING_CRITERIA, ROLE_PERMISSIONS, MARMOT_PRINCIPLES, WFG_GOALS, ORG_TYPES } from '../constants';
import { api } from '../services/firebase';
import { Button, Card, Input, Modal, Select, Badge } from '../components/UI';

// Global Chart.js definition since we load it from CDN
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

// --- APPLICANT DASHBOARD ---
export const ApplicantDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [apps, setApps] = useState<Application[]>([]);
  const [creationMethod, setCreationMethod] = useState<'none' | 'selecting' | 'digital' | 'upload'>('none');
  const [stage2App, setStage2App] = useState<Application | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(user); // Local user state for profile updates

  // --- EOI (Stage 1) FORM STATE ---
  const [formData, setFormData] = useState<Partial<Application>>({
      area: 'Blaenavon',
      amountRequested: 0,
      totalCost: 0,
      formData: {
          positiveOutcomes: ['', '', ''],
          marmotPrinciples: [],
          wfgGoals: []
      }
  });

  // --- STAGE 2 FORM STATE ---
  const [stage2Data, setStage2Data] = useState<Partial<Application['formData']> & { summary?: string }>({
      checklist: [],
      declarationStatements: [],
      budgetBreakdown: [{ item: '', note: '', cost: 0 }],
      marmotExplanations: {},
      wfgExplanations: {},
      summary: ''
  });

  useEffect(() => {
    api.getApplications().then(res => setApps(res.filter(a => a.userId === user.uid)));
  }, [user.uid]);

  // Pre-fill stage 2 data when modal opens
  useEffect(() => {
      if (stage2App && stage2App.submissionMethod === 'digital') {
          // Initialize explanations for items ticked in Stage 1
          const initialMarmot: Record<string, string> = {};
          stage2App.formData?.marmotPrinciples?.forEach(p => initialMarmot[p] = '');
          
          const initialWfg: Record<string, string> = {};
          stage2App.formData?.wfgGoals?.forEach(g => initialWfg[g] = '');

          setStage2Data(prev => ({
              ...prev,
              marmotExplanations: initialMarmot,
              wfgExplanations: initialWfg,
              summary: stage2App.summary || ''
          }));
      }
  }, [stage2App]);

  const updateFormData = (field: string, value: any) => {
      setFormData(prev => ({
          ...prev,
          formData: { ...prev.formData, [field]: value }
      }));
  };

  const updateStage2Data = (field: string, value: any) => {
      setStage2Data(prev => ({ ...prev, [field]: value }));
  };
  
  const updateStage2Explanation = (type: 'marmotExplanations' | 'wfgExplanations', key: string, val: string) => {
      setStage2Data(prev => ({
          ...prev,
          [type]: { ...prev[type], [key]: val }
      }));
  };

  const handleEOISubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ROLE_PERMISSIONS.applicant.canSubmit) {
        alert("Submissions are currently closed.");
        return;
    }

    const isDigital = creationMethod === 'digital';
    const newApp: any = {
        userId: user.uid,
        applicantName: isDigital ? (formData.applicantName || user.displayName) : user.displayName, 
        orgName: formData.orgName || 'Unknown',
        projectTitle: formData.projectTitle || 'Untitled',
        area: formData.area || 'Blaenavon',
        summary: formData.summary || '',
        amountRequested: Number(formData.amountRequested),
        totalCost: Number(formData.totalCost),
        submissionMethod: creationMethod,
        formData: isDigital ? formData.formData : {},
        pdfUrl: !isDigital ? 'https://example.com/uploaded-eoi.pdf' : undefined
    };

    await api.createApplication(newApp);
    setCreationMethod('none');
    setFormData({ area: 'Blaenavon', amountRequested: 0, totalCost: 0, formData: { positiveOutcomes: ['', '', ''], marmotPrinciples: [], wfgGoals: [] } }); 
    const res = await api.getApplications();
    setApps(res.filter(a => a.userId === user.uid));
  };

  const handleStage2Submit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!stage2App) return;
      
      const isDigital = stage2App.submissionMethod === 'digital';
      const updates: Partial<Application> = { status: 'Submitted-Stage2' };

      if (isDigital) {
          const { summary, ...rest } = stage2Data;
          updates.formData = { ...stage2App.formData, ...rest };
          if (summary) updates.summary = summary;
      } else {
          updates.stage2PdfUrl = 'https://example.com/uploaded-full-app.pdf';
      }
      
      await api.updateApplication(stage2App.id, updates);
      setStage2App(null);
      const res = await api.getApplications();
      setApps(res.filter(a => a.userId === user.uid));
      alert("Full Application (Stage 2) Submitted successfully!");
  }

  const addBudgetRow = () => {
      const current = stage2Data.budgetBreakdown || [];
      updateStage2Data('budgetBreakdown', [...current, { item: '', note: '', cost: 0 }]);
  };

  const updateBudgetRow = (index: number, field: keyof BudgetLine, value: any) => {
      const rows = [...(stage2Data.budgetBreakdown || [])];
      rows[index] = { ...rows[index], [field]: value };
      updateStage2Data('budgetBreakdown', rows);
  };

  // --- RENDER: DASHBOARD LIST ---
  if ((creationMethod === 'none' || creationMethod === 'selecting') && !stage2App) {
      return (
        <div className="max-w-5xl mx-auto py-12 px-4">
            <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
                <div>
                    <h2 className="text-3xl font-bold font-dynapuff text-gray-800">My Applications</h2>
                    <p className="text-gray-500">Manage your funding requests and track progress.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setIsProfileOpen(true)}>Edit Profile</Button>
                    {ROLE_PERMISSIONS.applicant.canSubmit && (
                        <Button onClick={() => setCreationMethod('selecting')} className="shadow-xl">+ Start New Application</Button>
                    )}
                </div>
            </div>
            
            <div className="grid gap-6">
                {apps.length === 0 && (
                    <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                        <p className="text-gray-400 font-bold text-lg mb-4">You haven't submitted any applications yet.</p>
                    </div>
                )}
                {apps.map(app => (
                    <Card key={app.id} className="flex flex-col md:flex-row justify-between items-center group hover:border-purple-200 transition-colors">
                        <div className="flex gap-6 items-center w-full">
                            <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center text-brand-purple font-bold text-xl font-dynapuff shrink-0">
                                {app.amountRequested > 5000 ? '£££' : '££'}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-mono text-gray-400 font-bold">{app.ref}</span>
                                    <Badge>{app.status}</Badge>
                                </div>
                                <h3 className="font-bold text-xl text-gray-800 group-hover:text-brand-purple transition-colors">{app.projectTitle}</h3>
                                <p className="text-sm text-gray-500">{app.area} • {new Date(app.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="mt-4 md:mt-0 md:ml-auto shrink-0 flex flex-col items-end gap-2">
                            {app.status === 'Invited-Stage2' && (
                                <Button size="sm" onClick={() => setStage2App(app)} className="bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200">
                                    Complete Stage 2
                                </Button>
                            )}
                            <Button size="sm" variant="outline">View Details</Button>
                        </div>
                    </Card>
                ))}
            </div>

            {creationMethod === 'selecting' && (
                <Modal isOpen={true} onClose={() => setCreationMethod('none')} title="Start Application" size="lg">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div onClick={() => setCreationMethod('digital')} className="border-2 border-brand-purple bg-purple-50 p-6 rounded-2xl cursor-pointer hover:shadow-lg transition-all text-center">
                            <div className="text-4xl mb-4">💻</div>
                            <h3 className="font-bold font-dynapuff text-brand-purple text-xl mb-2">Digital Form</h3>
                            <p className="text-sm text-gray-600">Complete the integrated online form directly in the portal.</p>
                            <Button className="mt-4 w-full">Start Digital EOI</Button>
                        </div>
                        <div onClick={() => setCreationMethod('upload')} className="border-2 border-gray-200 hover:border-brand-teal hover:bg-teal-50 p-6 rounded-2xl cursor-pointer hover:shadow-lg transition-all text-center group">
                            <div className="text-4xl mb-4">📄</div>
                            <h3 className="font-bold font-dynapuff text-gray-700 group-hover:text-brand-teal text-xl mb-2">Upload PDF</h3>
                            <p className="text-sm text-gray-600">Download the PDF, fill it out, and upload the scanned copy.</p>
                            <Button variant="outline" className="mt-4 w-full">Upload PDF EOI</Button>
                        </div>
                    </div>
                </Modal>
            )}

            <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} user={currentUser} onSave={setCurrentUser} />
        </div>
      );
  }

  // --- RENDER: UPLOAD FORM ---
  if (creationMethod === 'upload') {
      return (
        <div className="max-w-2xl mx-auto py-12 px-4 animate-fade-in">
             <Button variant="ghost" onClick={() => setCreationMethod('none')} className="mb-4">&larr; Back</Button>
             <Card>
                 <h2 className="text-2xl font-bold font-dynapuff text-brand-teal mb-2">Upload EOI PDF</h2>
                 <p className="text-gray-600 mb-6">Please upload your completed Part 1 Expression of Interest PDF.</p>
                 <form onSubmit={handleEOISubmit} className="space-y-6">
                     <div className="grid md:grid-cols-2 gap-6">
                        <Input label="Project Title" value={formData.projectTitle} onChange={e => setFormData({...formData, projectTitle: e.target.value})} required />
                        <Input label="Organization Name" value={formData.orgName} onChange={e => setFormData({...formData, orgName: e.target.value})} required />
                     </div>
                     <div className="grid md:grid-cols-2 gap-6">
                        <div>
                             <label className="block text-sm font-bold text-gray-700 mb-2 font-dynapuff">Primary Area</label>
                             <select className="w-full px-4 py-3 rounded-xl border border-gray-200" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value as any})}>
                                 {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                             </select>
                        </div>
                        <Input label="Total Amount Requested (£)" type="number" value={formData.amountRequested} onChange={e => setFormData({...formData, amountRequested: Number(e.target.value)})} required />
                     </div>
                     <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                        <p className="font-bold text-gray-600">Click to Select PDF</p>
                     </div>
                     <div className="flex justify-end gap-3 pt-4 border-t">
                         <Button type="button" variant="ghost" onClick={() => setCreationMethod('none')}>Cancel</Button>
                         <Button type="submit" variant="secondary">Submit Application</Button>
                     </div>
                 </form>
             </Card>
        </div>
      );
  }

  // --- RENDER: DIGITAL EOI FORM ---
  if (creationMethod === 'digital') {
      return (
          <div className="max-w-4xl mx-auto py-8 px-4 animate-fade-in">
              <Button variant="ghost" onClick={() => setCreationMethod('none')} className="mb-4">&larr; Cancel</Button>
              <div className="bg-white rounded-3xl shadow-xl border border-purple-100 overflow-hidden">
                  <div className="bg-brand-purple p-6 text-white">
                      <h2 className="text-2xl font-bold font-dynapuff">Expression of Interest</h2>
                      <p className="opacity-90">Stage 1 Application Form (Digital)</p>
                  </div>
                  <form onSubmit={handleEOISubmit} className="p-8 space-y-10">
                      <section>
                          <h3 className="text-xl font-bold text-gray-800 font-dynapuff border-b pb-2 mb-4">1. Communities' Choice Area</h3>
                          <div className="grid md:grid-cols-3 gap-4 mb-4">
                              {AREAS.map(area => (
                                  <label key={area} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${formData.area === area ? 'bg-purple-50 border-brand-purple' : 'bg-white border-gray-200'}`}>
                                      <input type="radio" name="area" value={area} checked={formData.area === area} onChange={() => setFormData({...formData, area: area})} className="w-5 h-5 accent-brand-purple" />
                                      <span className="font-bold text-sm">{area}</span>
                                  </label>
                              ))}
                          </div>
                      </section>
                      <section>
                          <h3 className="text-xl font-bold text-gray-800 font-dynapuff border-b pb-2 mb-4">2. Applicant Information</h3>
                          <div className="grid md:grid-cols-2 gap-6 mb-4">
                              <Input label="Organisation Name" value={formData.orgName} onChange={e => setFormData({...formData, orgName: e.target.value})} />
                              <Input label="Position / Job Title" value={formData.formData?.contactPosition} onChange={e => updateFormData('contactPosition', e.target.value)} />
                              <Input label="Contact Name" value={formData.applicantName} onChange={e => setFormData({...formData, applicantName: e.target.value})} />
                              <Input label="Email" type="email" value={formData.formData?.contactEmail} onChange={e => updateFormData('contactEmail', e.target.value)} />
                          </div>
                      </section>
                      <section>
                          <h3 className="text-xl font-bold text-gray-800 font-dynapuff border-b pb-2 mb-4">5. Project Details</h3>
                          <Input label="5.1 Project Title" value={formData.projectTitle} onChange={e => setFormData({...formData, projectTitle: e.target.value})} />
                          <div className="mb-4">
                              <label className="block text-sm font-bold text-gray-700 mb-2 font-dynapuff">5.2 Project Summary</label>
                              <textarea className="w-full px-4 py-3 rounded-xl border border-gray-200 h-32" value={formData.summary} onChange={e => setFormData({...formData, summary: e.target.value})} />
                          </div>
                      </section>
                      <section>
                          <h3 className="text-xl font-bold text-gray-800 font-dynapuff border-b pb-2 mb-4">6. Budget</h3>
                          <div className="grid md:grid-cols-2 gap-6 mb-4">
                              <Input label="Total Project Cost (£)" type="number" value={formData.totalCost} onChange={e => setFormData({...formData, totalCost: Number(e.target.value)})} />
                              <Input label="Amount Applied For (£)" type="number" value={formData.amountRequested} onChange={e => setFormData({...formData, amountRequested: Number(e.target.value)})} />
                          </div>
                      </section>
                      <section>
                          <h3 className="text-xl font-bold text-gray-800 font-dynapuff border-b pb-2 mb-4">7. Alignment</h3>
                           <div className="mb-6">
                                <h4 className="font-bold text-gray-700 mb-2">Marmot Principles (Tick all that apply)</h4>
                                <div className="grid md:grid-cols-2 gap-2">
                                    {MARMOT_PRINCIPLES.map(p => (
                                        <label key={p} className="flex items-start gap-2 text-sm text-gray-600">
                                            <input type="checkbox" className="mt-1" checked={formData.formData?.marmotPrinciples?.includes(p)} onChange={(e) => {
                                                const current = formData.formData?.marmotPrinciples || [];
                                                const updated = e.target.checked ? [...current, p] : current.filter(x => x !== p);
                                                updateFormData('marmotPrinciples', updated);
                                            }} />
                                            {p}
                                        </label>
                                    ))}
                                </div>
                           </div>
                           <div className="mb-6">
                                <h4 className="font-bold text-gray-700 mb-2">WFG Goals (Tick all that apply)</h4>
                                <div className="grid md:grid-cols-2 gap-2">
                                    {WFG_GOALS.map(g => (
                                        <label key={g} className="flex items-start gap-2 text-sm text-gray-600">
                                            <input type="checkbox" className="mt-1" checked={formData.formData?.wfgGoals?.includes(g)} onChange={(e) => {
                                                const current = formData.formData?.wfgGoals || [];
                                                const updated = e.target.checked ? [...current, g] : current.filter(x => x !== g);
                                                updateFormData('wfgGoals', updated);
                                            }} />
                                            {g}
                                        </label>
                                    ))}
                                </div>
                           </div>
                      </section>
                      <section>
                          <h3 className="text-xl font-bold text-gray-800 font-dynapuff border-b pb-2 mb-4">8. Declarations</h3>
                          <div className="grid md:grid-cols-2 gap-6">
                              <Input label="Signed (Type Name)" value={formData.formData?.declarationName} onChange={e => updateFormData('declarationName', e.target.value)} required />
                              <Input label="Date" type="date" value={formData.formData?.declarationDate} onChange={e => updateFormData('declarationDate', e.target.value)} required />
                          </div>
                      </section>
                      <div className="flex justify-end pt-6 border-t">
                          <Button type="submit" size="lg" className="w-full md:w-auto shadow-xl">Submit Stage 1 Application</Button>
                      </div>
                  </form>
              </div>
          </div>
      );
  }

  // --- RENDER: STAGE 2 FORM (DIGITAL) ---
  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
        {stage2App && (
            <Modal isOpen={true} onClose={() => setStage2App(null)} title="Stage 2: Full Application" size="full">
                {stage2App.submissionMethod === 'upload' ? (
                     <div className="max-w-2xl mx-auto">
                         <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6">
                             <h4 className="font-bold text-blue-800">Upload PDF Submission</h4>
                             <p className="text-sm text-blue-600">You submitted your EOI via PDF upload. Please upload your Part 2 PDF here.</p>
                         </div>
                         <form onSubmit={handleStage2Submit} className="space-y-6">
                             <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                                <p className="font-bold text-gray-600">Click to Select Part 2 PDF</p>
                             </div>
                             <div className="flex justify-end gap-2">
                                <Button type="button" variant="ghost" onClick={() => setStage2App(null)}>Cancel</Button>
                                <Button type="submit">Submit Final Application</Button>
                             </div>
                         </form>
                     </div>
                ) : (
                    <form onSubmit={handleStage2Submit} className="space-y-8 p-4">
                        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-brand-purple">{stage2App.projectTitle}</h3>
                                <p className="text-sm text-gray-600">Ref: {stage2App.ref} | Org: {stage2App.orgName}</p>
                            </div>
                            <Badge variant="amber">Stage 2</Badge>
                        </div>
                        
                        {/* 1.3 Bank Details */}
                        <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-bold font-dynapuff mb-4 text-gray-800">1.3 Bank Account & Registration</h3>
                            <div className="grid md:grid-cols-3 gap-4 mb-4">
                                <Input label="Bank Account Name" value={stage2Data.bankAccountName} onChange={e => updateStage2Data('bankAccountName', e.target.value)} />
                                <Input label="Account Number" value={stage2Data.bankAccountNumber} onChange={e => updateStage2Data('bankAccountNumber', e.target.value)} />
                                <Input label="Sort Code" value={stage2Data.bankSortCode} onChange={e => updateStage2Data('bankSortCode', e.target.value)} />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <Input label="Charity Number (if applicable)" value={stage2Data.charityNumber} onChange={e => updateStage2Data('charityNumber', e.target.value)} />
                                <Input label="Companies House No (if applicable)" value={stage2Data.companyNumber} onChange={e => updateStage2Data('companyNumber', e.target.value)} />
                            </div>
                        </section>

                        {/* 2.2 Project Overview */}
                        <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-bold font-dynapuff mb-4 text-gray-800">2.2 Project Overview</h3>
                            <label className="block text-sm text-gray-600 mb-2">Describe your project, main purpose, beneficiaries, and SMART objectives. (150-200 words)</label>
                            <textarea className="w-full p-4 border rounded-xl" rows={4} value={stage2Data.summary} onChange={e => updateStage2Data('summary', e.target.value)}></textarea>
                        </section>

                        {/* 2.3 Activities */}
                        <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-bold font-dynapuff mb-4 text-gray-800">2.3 Activities & Delivery Plan</h3>
                            <label className="block text-sm text-gray-600 mb-2">Outline activities, key milestones, and who is responsible.</label>
                            <textarea className="w-full p-4 border rounded-xl" rows={4} value={stage2Data.activities} onChange={e => updateStage2Data('activities', e.target.value)}></textarea>
                        </section>

                        {/* 2.4 Community Benefit */}
                        <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                             <h3 className="text-lg font-bold font-dynapuff mb-4 text-gray-800">2.4 Community Benefit & Impact</h3>
                             <label className="block text-sm text-gray-600 mb-2">How does it respond to priorities? What are short/long-term impacts?</label>
                             <textarea className="w-full p-4 border rounded-xl" rows={4} value={stage2Data.communityBenefit} onChange={e => updateStage2Data('communityBenefit', e.target.value)}></textarea>
                        </section>

                         {/* 2.5 Collaborations & 2.6 Risks */}
                         <div className="grid md:grid-cols-2 gap-6">
                            <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <h3 className="text-lg font-bold font-dynapuff mb-4 text-gray-800">2.5 Collaborations</h3>
                                <textarea className="w-full p-4 border rounded-xl" rows={4} placeholder="Partners and their roles..." value={stage2Data.collaborations} onChange={e => updateStage2Data('collaborations', e.target.value)}></textarea>
                            </section>
                            <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <h3 className="text-lg font-bold font-dynapuff mb-4 text-gray-800">2.6 Risk Management</h3>
                                <textarea className="w-full p-4 border rounded-xl" rows={4} placeholder="Potential risks and mitigations..." value={stage2Data.risks} onChange={e => updateStage2Data('risks', e.target.value)}></textarea>
                            </section>
                         </div>

                         {/* 2.7 Marmot & 2.8 WFG Justification */}
                         <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                             <h3 className="text-lg font-bold font-dynapuff mb-4 text-gray-800">2.7 & 2.8 Alignment Justification</h3>
                             <p className="text-sm text-gray-500 mb-4">Please provide practical examples for the principles/goals you selected in Stage 1.</p>
                             
                             {stage2App.formData?.marmotPrinciples?.map(p => (
                                 <div key={p} className="mb-4">
                                     <label className="block text-sm font-bold text-purple-700 mb-1">{p}</label>
                                     <input className="w-full border rounded-lg p-2 text-sm" placeholder="Practical example..." value={stage2Data.marmotExplanations?.[p] || ''} onChange={e => updateStage2Explanation('marmotExplanations', p, e.target.value)} />
                                 </div>
                             ))}
                             {stage2App.formData?.wfgGoals?.map(g => (
                                 <div key={g} className="mb-4">
                                     <label className="block text-sm font-bold text-teal-700 mb-1">{g}</label>
                                     <input className="w-full border rounded-lg p-2 text-sm" placeholder="Specific activity or outcome..." value={stage2Data.wfgExplanations?.[g] || ''} onChange={e => updateStage2Explanation('wfgExplanations', g, e.target.value)} />
                                 </div>
                             ))}
                             {(!stage2App.formData?.marmotPrinciples?.length && !stage2App.formData?.wfgGoals?.length) && <p className="text-gray-400 italic">No principles selected in Stage 1.</p>}
                         </section>

                        {/* 4. Budget */}
                        <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                             <h3 className="text-lg font-bold font-dynapuff mb-4 text-gray-800">4. Budget Breakdown</h3>
                             <Button type="button" size="sm" onClick={addBudgetRow}>+ Add Item</Button>
                             <div className="space-y-2 mt-4">
                                {(stage2Data.budgetBreakdown || []).map((row, i) => (
                                    <div key={i} className="grid grid-cols-12 gap-2">
                                        <div className="col-span-8"><input className="w-full border rounded p-2 text-sm" placeholder="Expense Type / Note" value={row.item} onChange={e => updateBudgetRow(i, 'item', e.target.value)} /></div>
                                        <div className="col-span-4"><input className="w-full border rounded p-2 text-sm" type="number" placeholder="Cost (£)" value={row.cost} onChange={e => updateBudgetRow(i, 'cost', Number(e.target.value))} /></div>
                                    </div>
                                ))}
                                <div className="text-right font-bold pt-2 border-t">
                                    Total: £{(stage2Data.budgetBreakdown || []).reduce((a,b) => a + Number(b.cost), 0)}
                                </div>
                            </div>
                        </section>

                        <div className="flex justify-end pt-4 border-t">
                             <Button type="button" variant="ghost" onClick={() => setStage2App(null)}>Cancel</Button>
                             <Button type="submit" size="lg" className="ml-2">Submit Full Application</Button>
                        </div>
                    </form>
                )}
            </Modal>
        )}
    </div>
  );
};

// --- COMMITTEE DASHBOARD ---
interface CommitteeProps { 
    user: User; 
    onUpdateUser: (u: User) => void; 
    isAdmin?: boolean; 
    onReturnToAdmin?: () => void;
}

export const CommitteeDashboard: React.FC<CommitteeProps> = ({ user, onUpdateUser, isAdmin, onReturnToAdmin }) => {
    const [view, setView] = useState<'home' | 'score' | 'viewer' | 'docs'>('home');
    const [apps, setApps] = useState<Application[]>([]);
    const [activeApp, setActiveApp] = useState<Application | null>(null);
    const [scores, setScores] = useState<Record<string, number>>({});
    const [myScores, setMyScores] = useState<Score[]>([]);
    const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState<PortalSettings>({ stage1Visible: false, stage2Visible: false, votingOpen: false });
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    
    // Scoring Threshold State
    const [threshold, setThreshold] = useState(65);

    useEffect(() => {
        const fetchData = async () => {
            const portalSettings = await api.getPortalSettings();
            setSettings(portalSettings);
            const areaFilter = isAdmin ? 'All' : user.area;
            const appList = await api.getApplications(areaFilter);
            let visibleApps = appList;
            if (!isAdmin) {
                visibleApps = appList.filter(app => {
                    const isStage2 = app.status === 'Submitted-Stage2' || app.status === 'Finalist';
                    if (isStage2) return portalSettings.stage2Visible;
                    return portalSettings.stage1Visible;
                });
            }
            setApps(visibleApps);
            const allScoresData = await api.getScores();
            setMyScores(allScoresData.filter(s => s.scorerId === user.uid));
        };
        fetchData();
    }, [user.area, isAdmin, user.uid, view]);

    const handleStartScoring = (app: Application) => {
        setActiveApp(app);
        const existingScore = myScores.find(s => s.appId === app.id);
        setScores(existingScore ? existingScore.scores : {});
        setView('score');
    };

    const handleSaveScore = async (isFinal = false) => {
        if (!activeApp) return;
        setIsSaving(true);
        const total = Object.entries(scores).reduce((total, [criterionId, score]) => {
            const criterion = SCORING_CRITERIA.find(c => c.id === criterionId);
            return total + (score / 3) * (criterion?.weight || 0);
        }, 0);

        const scoreData: Score = {
            appId: activeApp.id,
            scorerId: user.uid,
            scorerName: user.displayName || user.email,
            scores: scores,
            notes: {},
            isFinal: isFinal,
            total: total,
            timestamp: Date.now()
        };
        await api.saveScore(scoreData);
        setIsSaving(false);
        if (isFinal) {
            alert("Final scores posted!");
            setActiveApp(null);
            setView('home');
        } else {
            alert("Draft saved successfully.");
        }
    };
    
    const downloadCSV = () => {
         // Generate CSV content
         const headers = ['Ref', 'Title', 'Area', 'My Score', 'Status'];
         const rows = apps.map(app => {
             const score = myScores.find(s => s.appId === app.id);
             return [
                 app.ref,
                 `"${app.projectTitle.replace(/"/g, '""')}"`,
                 app.area,
                 score ? Math.round(score.total) : 'N/A',
                 score?.isFinal ? 'Completed' : 'Pending'
             ].join(',');
         });
         const csvContent = [headers.join(','), ...rows].join('\n');
         const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
         const url = URL.createObjectURL(blob);
         const link = document.createElement('a');
         link.href = url;
         link.setAttribute('download', 'my_scores.csv');
         document.body.appendChild(link);
         link.click();
    };

    const pendingApps = apps.filter(app => {
        if (app.status !== 'Submitted-Stage2' && app.status !== 'Finalist') return false;
        const score = myScores.find(s => s.appId === app.id);
        return !score || !score.isFinal;
    });

    const renderDigitalApp = (app: Application) => (
         <div className="p-8 bg-white max-w-3xl mx-auto shadow-sm min-h-full">
            <h1 className="text-3xl font-bold font-dynapuff text-brand-purple mb-2">{app.projectTitle}</h1>
            <p className="text-gray-500 mb-8 border-b pb-4">{app.orgName} • {app.ref} • {app.area}</p>
            <div className="space-y-6">
                <section>
                    <h3 className="font-bold text-gray-800 uppercase tracking-widest text-xs border-b border-gray-100 pb-1 mb-3">Project Summary</h3>
                    <p className="text-gray-700 leading-relaxed">{app.summary}</p>
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
                        <div><strong>Requested:</strong> £{app.amountRequested}</div>
                        <div><strong>Total:</strong> £{app.totalCost}</div>
                    </div>
                </section>
                {(app.formData?.activities || app.formData?.communityBenefit) && (
                    <section>
                        <h3 className="font-bold text-gray-800 uppercase tracking-widest text-xs border-b border-gray-100 pb-1 mb-3">Stage 2 Details</h3>
                        <div className="space-y-4">
                            <div><h4 className="font-bold text-sm">Activities</h4><p className="text-sm">{app.formData.activities}</p></div>
                            <div><h4 className="font-bold text-sm">Community Benefit</h4><p className="text-sm">{app.formData.communityBenefit}</p></div>
                            <div><h4 className="font-bold text-sm">Risks</h4><p className="text-sm">{app.formData.risks}</p></div>
                        </div>
                    </section>
                )}
                <section>
                    <h3 className="font-bold text-gray-800 uppercase tracking-widest text-xs border-b border-gray-100 pb-1 mb-3">Alignment</h3>
                     <div className="text-sm">
                         {app.formData?.marmotExplanations && Object.entries(app.formData.marmotExplanations).map(([k,v]) => (
                             <div key={k} className="mb-2"><span className="font-bold text-purple-700">{k}:</span> {v}</div>
                         ))}
                     </div>
                </section>
            </div>
        </div>
    );

    if (view === 'home') {
        return (
            <div className="max-w-6xl mx-auto py-12 px-4 animate-fade-in relative">
                <div className="absolute top-0 right-4 mt-4 flex gap-2">
                    {isAdmin && (
                        <Button size="sm" variant="outline" onClick={onReturnToAdmin} className="border-red-200 text-red-600 hover:bg-red-50">Exit to Admin</Button>
                    )}
                    <button onClick={() => setIsProfileOpen(true)} className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100 hover:bg-purple-50 transition-colors">
                        {user.photoUrl && <img src={user.photoUrl} className="w-6 h-6 rounded-full object-cover" />}
                        <span className="text-sm font-bold text-brand-purple">Profile</span>
                    </button>
                </div>
                <div className="text-center mb-8 pt-8">
                    <h1 className="text-3xl md:text-4xl font-bold font-dynapuff text-brand-purple mb-2">
                        {isAdmin ? "Admin Scoring Oversight" : "People's Committee Portal"}
                    </h1>
                    <p className="max-w-2xl mx-auto text-gray-600">
                        {isAdmin ? `Viewing as: ${user.displayName} (${user.area})` : `Welcome, ${user.displayName}.`}
                    </p>
                </div>
                {!settings.stage1Visible && !settings.stage2Visible && !isAdmin && (
                    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-8 rounded-r">
                        <p className="font-bold text-amber-800">Applications are currently locked.</p>
                        <p className="text-sm text-amber-700">The administrator has not yet released applications for review.</p>
                    </div>
                )}
                <div className="grid md:grid-cols-3 gap-8 mb-12">
                    <div onClick={() => setView('score')} className="bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer text-center border border-purple-50 group">
                        <div className="w-20 h-20 bg-purple-100 text-brand-purple rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold font-dynapuff text-gray-800 mb-2">Scoring Matrix</h3>
                        <p className="text-gray-500 text-sm">{pendingApps.length} Pending Tasks</p>
                    </div>
                    <div onClick={() => setView('viewer')} className="bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer text-center border border-teal-50 group">
                        <div className="w-20 h-20 bg-teal-100 text-brand-teal rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110">
                             <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 21a4 4 0 01-4-4V5a4 4 0 014-4h6a4 4 0 014 4v12a4 4 0 01-4 4H7zM10 12h4"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold font-dynapuff text-gray-800 mb-2">App Viewer</h3>
                        <p className="text-gray-500 text-sm">View All ({apps.length})</p>
                    </div>
                    <div onClick={() => setView('docs')} className="bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer text-center border border-blue-50 group">
                         <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110">
                             <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                         </div>
                         <h3 className="text-xl font-bold font-dynapuff text-gray-800 mb-2">Documents</h3>
                         <p className="text-gray-500 text-sm">Guidance & Resources</p>
                    </div>
                </div>
                <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} user={user} onSave={onUpdateUser} />
            </div>
        );
    }

    if (view === 'docs') {
         return (
            <div className="max-w-5xl mx-auto py-12 px-4 animate-fade-in">
                <Button variant="ghost" onClick={() => setView('home')} className="mb-6">&larr; Back to Portal</Button>
                <h2 className="text-3xl font-bold font-dynapuff text-brand-purple mb-8 text-center">Committee Documents</h2>
                <div className="grid md:grid-cols-2 gap-6">
                    {COMMITTEE_DOCS.map((doc, i) => (
                        <a key={i} href={doc.url} target="_blank" rel="noreferrer" className="block bg-white p-6 rounded-xl shadow-lg border border-gray-100 group">
                            <h3 className="text-lg font-bold font-dynapuff text-gray-800 mb-2 group-hover:text-brand-purple">{doc.title}</h3>
                            <p className="text-gray-500 text-sm mb-4">{doc.desc}</p>
                            <span className="inline-flex items-center text-xs font-bold text-brand-purple bg-purple-50 px-3 py-1 rounded-full">Download PDF</span>
                        </a>
                    ))}
                </div>
            </div>
        );
    }

    if (view === 'viewer') {
        return (
             <div className="h-[calc(100vh-80px)] flex flex-col md:flex-row animate-fade-in">
                <div className="md:w-1/3 bg-white border-r border-gray-200 overflow-y-auto flex flex-col">
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <Button variant="ghost" size="sm" onClick={() => setView('home')} className="mb-2">&larr; Portal</Button>
                        <h3 className="font-bold font-dynapuff text-lg text-gray-800">All Applications</h3>
                    </div>
                    <div className="flex-1 p-2 space-y-2">
                        {apps.map(app => (
                            <div key={app.id} onClick={() => setActiveApp(app)} className={`p-4 rounded-xl cursor-pointer transition-all border ${activeApp?.id === app.id ? 'bg-purple-50 border-purple-200' : 'bg-white border-transparent hover:bg-gray-50'}`}>
                                <div className="flex justify-between items-start">
                                    <span className="font-bold text-gray-800 text-sm">{app.applicantName}</span>
                                    <span className="text-[10px] font-mono text-gray-400">{app.ref}</span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1 line-clamp-1">{app.projectTitle}</div>
                                <div className="mt-2"><Badge>{app.status}</Badge></div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="md:w-2/3 bg-gray-100 flex flex-col overflow-y-auto">
                    {activeApp ? (
                        activeApp.submissionMethod === 'digital' ? renderDigitalApp(activeApp) : (
                            <iframe src={activeApp.stage2PdfUrl || activeApp.pdfUrl} className="w-full h-full border-0" title="PDF" />
                        )
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400"><p>Select an application to view.</p></div>
                    )}
                </div>
            </div>
        );
    }

    if (view === 'score') {
        if (!activeApp) {
             return (
                <div className="max-w-6xl mx-auto py-12 px-4 animate-fade-in">
                    <Button variant="ghost" onClick={() => setView('home')}>&larr; Back</Button>
                    <div className="flex justify-between items-center mb-6 mt-4">
                        <h2 className="text-2xl font-bold font-dynapuff text-gray-800">Select Application to Score</h2>
                        {isAdmin && <Button variant="outline" size="sm" onClick={downloadCSV}>Export My Scores (CSV)</Button>}
                    </div>
                    
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden mb-12">
                        <div className="bg-gray-50 p-4 font-bold text-gray-700 border-b">Eligible for Scoring (Stage 2)</div>
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="p-5 text-gray-500 text-sm uppercase">Ref</th>
                                    <th className="p-5 text-gray-500 text-sm uppercase">Project</th>
                                    <th className="p-5 text-gray-500 text-sm uppercase text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {pendingApps.map(app => (
                                    <tr key={app.id} className="hover:bg-purple-50 transition-colors">
                                        <td className="p-5 font-mono text-sm text-gray-400 font-bold">{app.ref}</td>
                                        <td className="p-5 font-bold text-gray-800">{app.projectTitle}</td>
                                        <td className="p-5 text-right"><Button size="sm" onClick={() => handleStartScoring(app)}>Score</Button></td>
                                    </tr>
                                ))}
                                {pendingApps.length === 0 && (
                                    <tr><td colSpan={3} className="p-8 text-center text-gray-400">You have no outstanding scoring tasks!</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
             );
        }

        const totalScore = Math.round(Object.values(scores).reduce((a, b) => a + b, 0));
        // RAG Logic
        const scoreColor = totalScore < 50 ? 'bg-red-100 text-red-700' : (totalScore < threshold ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-700');

        return (
            <div className="h-[calc(100vh-80px)] flex flex-col md:flex-row overflow-hidden bg-gray-50 animate-fade-in fixed inset-0 top-20 z-0">
                <div className="md:w-7/12 h-full flex flex-col border-r border-gray-200 bg-white overflow-y-auto">
                    <div className="p-3 border-b flex items-center justify-between bg-white sticky top-0 z-10">
                        <Button variant="ghost" size="sm" onClick={() => setActiveApp(null)}>&larr; List</Button>
                        <div className="text-center">
                            <h2 className="font-bold text-gray-800 text-sm">{activeApp.projectTitle}</h2>
                            <p className="text-xs text-gray-500">{activeApp.ref}</p>
                        </div>
                        <div className="w-16"></div>
                    </div>
                    <div className="flex-1 bg-gray-100">
                        {activeApp.submissionMethod === 'digital' ? renderDigitalApp(activeApp) : (
                             <iframe src={activeApp.stage2PdfUrl || activeApp.pdfUrl} className="w-full h-full border-0" title="PDF" />
                        )}
                    </div>
                </div>
                <div className="md:w-5/12 h-full flex flex-col bg-slate-50 shadow-inner relative">
                    <div className="p-4 border-b bg-white flex justify-between items-center z-10 shadow-sm">
                        <h2 className="font-bold font-dynapuff text-brand-purple">Scoring Matrix</h2>
                        <span className={`px-4 py-1.5 rounded-full font-bold text-base border ${scoreColor}`}>{totalScore} / 100</span>
                    </div>
                    
                    {/* Threshold Control */}
                    <div className="bg-gray-100 px-6 py-3 border-b border-gray-200 flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-500 uppercase">Approval Threshold: {threshold}</span>
                        <input type="range" min="40" max="90" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="flex-1 accent-gray-500 h-1" />
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 scroller">
                        <div className="flex justify-end mb-4">
                             <button className="text-xs text-brand-purple font-bold hover:underline" onClick={() => window.open(COMMITTEE_DOCS[2].url, '_blank')}>View Guidance Notes</button>
                        </div>
                        {SCORING_CRITERIA.map(c => (
                            <div key={c.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:border-purple-300 transition-colors relative">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="pr-8">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-gray-800 text-sm">{c.name}</h4>
                                            <button className="text-gray-400 hover:text-brand-purple focus:outline-none" onClick={() => setActiveTooltip(activeTooltip === c.id ? null : c.id)} aria-label="Show guidance">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="w-8 h-8 rounded bg-gray-50 flex items-center justify-center font-bold text-brand-purple border border-gray-200 text-sm">{scores[c.id] || 0}</div>
                                    </div>
                                </div>
                                {activeTooltip === c.id && (
                                    <div className="bg-slate-800 text-white text-sm p-4 rounded-lg shadow-inner mb-4 animate-fade-in">
                                        <p className="font-bold text-brand-teal mb-2">Guidance:</p>
                                        <p className="mb-3 italic text-gray-200">{c.guidance}</p>
                                        <div className="border-t border-gray-600 pt-2 mt-2">
                                            <p className="font-bold text-brand-purple mb-1 text-xs uppercase tracking-wider">Scoring Rubric:</p>
                                            <div className="space-y-1 text-xs text-gray-300" dangerouslySetInnerHTML={{ __html: c.details }} />
                                        </div>
                                    </div>
                                )}
                                <input type="range" min="0" max="3" step="1" className="w-full accent-brand-purple h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" value={scores[c.id] || 0} onChange={(e) => setScores({...scores, [c.id]: Number(e.target.value)})} />
                            </div>
                        ))}
                    </div>
                    <div className="p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                         <div className="flex gap-3 mb-4">
                            <Button variant="outline" className="flex-1" onClick={() => handleSaveScore(false)}>Save Draft</Button>
                            <Button className="flex-1 shadow-lg py-3" onClick={() => handleSaveScore(true)} disabled={isSaving}>Post Final Score</Button>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 max-h-40 overflow-y-auto">
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">My Pending Tasks ({pendingApps.length})</h4>
                            <div className="space-y-1">
                                {pendingApps.map(app => (
                                    <div key={app.id} onClick={() => app.id !== activeApp?.id && handleStartScoring(app)} className={`text-sm p-2 rounded cursor-pointer flex justify-between ${app.id === activeApp?.id ? 'bg-purple-100 text-purple-700 font-bold' : 'bg-white hover:bg-gray-100'}`}>
                                        <span className="truncate max-w-[150px]">{app.projectTitle}</span>
                                        <span className="text-xs text-gray-400">{app.ref}</span>
                                    </div>
                                ))}
                                {pendingApps.length === 0 && <div className="text-xs text-green-600 font-bold">All caught up!</div>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

// --- ADMIN DASHBOARD ---
interface AdminProps {
    onNavigatePublic: (view: string) => void;
    onNavigateScoring: () => void;
}

export const AdminDashboard: React.FC<AdminProps> = ({ onNavigatePublic, onNavigateScoring }) => {
    const [allApps, setAllApps] = useState<Application[]>([]);
    const [allScores, setAllScores] = useState<Score[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'tracker' | 'controls' | 'applications'>('overview');
    const [portalSettings, setPortalSettings] = useState<PortalSettings>({ stage1Visible: true, stage2Visible: false, votingOpen: false });
    const [selectedCommitteeMember, setSelectedCommitteeMember] = useState<string>('All');
    const [allUsers, setAllUsers] = useState<User[]>([]);

    // Application Table State
    const [appSort, setAppSort] = useState<{key: keyof Application, dir: 'asc'|'desc'}>({key: 'createdAt', dir: 'desc'});
    const [appFilter, setAppFilter] = useState({ area: 'All', status: 'All', search: '' });

    const refreshData = async () => {
        const apps = await api.getApplications('All');
        const scores = await api.getScores();
        const settings = await api.getPortalSettings();
        const users = await api.getUsers();
        setAllApps(apps);
        setAllScores(scores);
        setPortalSettings(settings);
        setAllUsers(users);
    };

    useEffect(() => { refreshData(); }, []);

    const toggleSetting = async (key: keyof PortalSettings) => {
        const newSettings = { ...portalSettings, [key]: !portalSettings[key] };
        await api.updatePortalSettings(newSettings);
        setPortalSettings(newSettings);
    };

    const handleResetScore = async (scorerId: string, appId?: string) => {
        if (confirm("Are you sure you want to wipe these scores? This cannot be undone.")) {
            await api.resetUserScores(scorerId, appId);
            refreshData();
        }
    };

    const downloadFullCSV = () => {
        // Generate Admin CSV content with All Apps and Stats
        const headers = ['Ref', 'Title', 'Area', 'Applicant', 'Status', 'Requested', 'Total Cost', 'Avg Score', 'Num Scores'];
        const rows = allApps.map(app => {
            const appScores = allScores.filter(s => s.appId === app.id);
            const avg = appScores.length > 0 ? (appScores.reduce((a,b) => a + b.total, 0) / appScores.length).toFixed(1) : '0';
            return [
                app.ref,
                `"${app.projectTitle.replace(/"/g, '""')}"`,
                app.area,
                `"${app.applicantName}"`,
                app.status,
                app.amountRequested,
                app.totalCost,
                avg,
                appScores.length
            ].join(',');
        });
        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'admin_export.csv');
        document.body.appendChild(link);
        link.click();
   };
    
    // Sort & Filter Apps
    const getFilteredApps = () => {
        let result = [...allApps];
        if (appFilter.area !== 'All') result = result.filter(a => a.area === appFilter.area);
        if (appFilter.status !== 'All') result = result.filter(a => a.status === appFilter.status);
        if (appFilter.search) {
            const q = appFilter.search.toLowerCase();
            result = result.filter(a => a.projectTitle.toLowerCase().includes(q) || a.applicantName.toLowerCase().includes(q) || a.ref.toLowerCase().includes(q));
        }
        
        result.sort((a, b) => {
            const valA = a[appSort.key];
            const valB = b[appSort.key];
            if (valA === valB) return 0;
            const comp = valA > valB ? 1 : -1;
            return appSort.dir === 'asc' ? comp : -comp;
        });
        return result;
    };

    const handleSort = (key: keyof Application) => {
        setAppSort({ key, dir: appSort.key === key && appSort.dir === 'asc' ? 'desc' : 'asc' });
    };

    return (
        <div className="max-w-7xl mx-auto py-12 px-4">
             <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
                <div>
                    <h1 className="text-4xl font-bold font-dynapuff text-brand-purple">Admin Control Room</h1>
                    <div className="flex gap-3 mt-2">
                        <Button size="sm" variant="outline" onClick={() => onNavigatePublic('home')}>Public Site</Button>
                        <Button size="sm" variant="secondary" onClick={onNavigateScoring}>Super User View (Scoring)</Button>
                    </div>
                </div>
                <div className="bg-white p-1.5 rounded-xl border shadow-sm flex overflow-x-auto max-w-full">
                    {['overview', 'applications', 'tracker', 'controls'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all ${activeTab === tab ? 'bg-brand-purple text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>{tab}</button>
                    ))}
                </div>
            </div>

            {activeTab === 'applications' && (
                <div className="animate-fade-in">
                    <Card>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-700">Application Management</h3>
                            <Button size="sm" onClick={downloadFullCSV} className="bg-green-600 hover:bg-green-700 border-green-700">Download CSV Report</Button>
                        </div>
                        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100 items-end">
                            <div className="flex-1 min-w-[200px]">
                                <Input label="Search" placeholder="Title, Applicant or Ref..." value={appFilter.search} onChange={e => setAppFilter({...appFilter, search: e.target.value})} className="mb-0" />
                            </div>
                            <div className="w-48">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Filter Area</label>
                                <select className="w-full border rounded-lg px-3 py-3 text-sm" value={appFilter.area} onChange={e => setAppFilter({...appFilter, area: e.target.value})}>
                                    <option value="All">All Areas</option>
                                    {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </div>
                            <div className="w-48">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Filter Status</label>
                                <select className="w-full border rounded-lg px-3 py-3 text-sm" value={appFilter.status} onChange={e => setAppFilter({...appFilter, status: e.target.value})}>
                                    <option value="All">All Statuses</option>
                                    <option value="Submitted-Stage1">Stage 1</option>
                                    <option value="Submitted-Stage2">Stage 2</option>
                                    <option value="Invited-Stage2">Invited to Stage 2</option>
                                    <option value="Draft">Draft</option>
                                </select>
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-100 border-b text-gray-600">
                                    <tr>
                                        {[
                                            { key: 'ref', label: 'Reference' },
                                            { key: 'projectTitle', label: 'Project Title' },
                                            { key: 'orgName', label: 'Organization' },
                                            { key: 'area', label: 'Area' },
                                            { key: 'status', label: 'Status' },
                                            { key: 'amountRequested', label: 'Amount (£)' },
                                            { key: 'createdAt', label: 'Date Submitted' },
                                        ].map(h => (
                                            <th key={h.key} className="p-4 font-bold cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => handleSort(h.key as any)}>
                                                <div className="flex items-center gap-1">
                                                    {h.label}
                                                    {appSort.key === h.key && (appSort.dir === 'asc' ? ' ↑' : ' ↓')}
                                                </div>
                                            </th>
                                        ))}
                                        <th className="p-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {getFilteredApps().map(app => (
                                        <tr key={app.id} className="hover:bg-purple-50 transition-colors">
                                            <td className="p-4 font-mono text-xs text-gray-500">{app.ref}</td>
                                            <td className="p-4 font-bold text-gray-800">{app.projectTitle}</td>
                                            <td className="p-4">{app.orgName}</td>
                                            <td className="p-4 text-xs">{app.area}</td>
                                            <td className="p-4"><Badge>{app.status}</Badge></td>
                                            <td className="p-4 font-mono">£{app.amountRequested}</td>
                                            <td className="p-4 text-xs text-gray-500">{new Date(app.createdAt).toLocaleDateString()}</td>
                                            <td className="p-4">
                                                <Button size="sm" variant="ghost" onClick={() => {}}>Edit</Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {getFilteredApps().length === 0 && <tr><td colSpan={8} className="p-8 text-center text-gray-400">No applications match your filters.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === 'controls' && (
                <div className="animate-fade-in grid md:grid-cols-2 gap-8">
                    <Card>
                        <h3 className="text-xl font-bold font-dynapuff text-brand-purple mb-4">Phase Visibility Controls</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                                <div><h4 className="font-bold text-gray-800">Stage 1 (EOI) Visibility</h4><p className="text-xs text-gray-600">Allow committees to view Part 1 forms.</p></div>
                                <button onClick={() => toggleSetting('stage1Visible')} className={`w-12 h-6 rounded-full transition-colors relative ${portalSettings.stage1Visible ? 'bg-green-500' : 'bg-gray-300'}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${portalSettings.stage1Visible ? 'left-7' : 'left-1'}`}></div></button>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-purple-50 rounded-xl border border-purple-100">
                                <div><h4 className="font-bold text-gray-800">Stage 2 (Full App) Visibility</h4><p className="text-xs text-gray-600">Allow committees to view & score Part 2 forms.</p></div>
                                <button onClick={() => toggleSetting('stage2Visible')} className={`w-12 h-6 rounded-full transition-colors relative ${portalSettings.stage2Visible ? 'bg-green-500' : 'bg-gray-300'}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${portalSettings.stage2Visible ? 'left-7' : 'left-1'}`}></div></button>
                            </div>
                        </div>
                    </Card>
                    <Card>
                         <h3 className="text-xl font-bold font-dynapuff text-brand-purple mb-4">Data Management</h3>
                         <Button variant="danger" className="w-full mb-4" onClick={() => alert("Not implemented in demo")}>Delete All Test Data</Button>
                    </Card>
                </div>
            )}

            {activeTab === 'tracker' && (
                <div className="animate-fade-in space-y-6">
                    <Card>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-700">Committee Progress Tracker</h3>
                            <select className="border rounded-lg px-3 py-2 bg-gray-50" value={selectedCommitteeMember} onChange={e => setSelectedCommitteeMember(e.target.value)}>
                                <option value="All">All Members</option>
                                {allUsers.filter(u => u.role === 'committee').map(u => <option key={u.uid} value={u.uid}>{u.displayName} ({u.area})</option>)}
                            </select>
                        </div>
                        <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b"><tr><th className="p-4">Committee Member</th><th className="p-4">App Ref</th><th className="p-4">Score Status</th><th className="p-4 text-right">Admin Action</th></tr></thead>
                            <tbody className="divide-y">
                                {(selectedCommitteeMember === 'All' ? allScores : allScores.filter(s => s.scorerId === selectedCommitteeMember)).map((score, i) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                        <td className="p-4 font-bold">{score.scorerName}</td>
                                        <td className="p-4 font-mono text-gray-500">{allApps.find(a => a.id === score.appId)?.ref || 'Unknown'}</td>
                                        <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${score.isFinal ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{score.isFinal ? 'Completed' : 'Draft'}</span></td>
                                        <td className="p-4 text-right"><button onClick={() => handleResetScore(score.scorerId, score.appId)} className="text-red-600 hover:underline text-xs font-bold">Reset Score</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                    </Card>
                </div>
            )}
            
            {activeTab === 'overview' && (
                <div className="animate-fade-in">
                    <Card>
                        <h3 className="font-bold text-gray-700 mb-4">System Overview</h3>
                        <div className="grid grid-cols-4 gap-4 text-center">
                            <div className="p-4 bg-purple-50 rounded-xl"><div className="text-3xl font-bold text-brand-purple">{allApps.length}</div><div className="text-xs text-gray-500 uppercase">Total Apps</div></div>
                            <div className="p-4 bg-teal-50 rounded-xl"><div className="text-3xl font-bold text-brand-teal">{allScores.length}</div><div className="text-xs text-gray-500 uppercase">Total Scores</div></div>
                            <div className="p-4 bg-blue-50 rounded-xl"><div className="text-3xl font-bold text-blue-600">{allUsers.length}</div><div className="text-xs text-gray-500 uppercase">Users</div></div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};
