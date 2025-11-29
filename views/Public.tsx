
import React, { useState, useRef, useEffect } from 'react';
import { Button, Card, Input } from '../components/UI';
import { POSTCODES, PRIORITY_DATA } from '../constants';
import { Area } from '../types';

// Custom hook for Carousel Swipe logic
const AreaCarousel: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    
    const slides = [
        { 
            name: 'Blaenavon', 
            img: 'images/Blaenavon map.png', 
            desc: 'See projects in Blaenavon and vote for your favourite three!',
            color: 'text-purple-700'
        },
        { 
            name: 'Thornhill & Upper Cwmbran', 
            img: 'images/Thornhill & Upper Cwmbran map.png', 
            desc: 'See projects in Thornhill & Upper Cwmbran and vote!',
            color: 'text-teal-700' 
        },
        { 
            name: 'Trevethin, Penygarn & St. Cadocs', 
            img: 'images/Trevethin Penygarn & St Cadocs map.png', 
            desc: 'See projects in this area and vote for your favourite three!',
            color: 'text-pink-700' 
        }
    ];

    const nextSlide = () => setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    const prevSlide = () => setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));

    return (
        <div className="relative w-full max-w-3xl mx-auto">
            <div className="overflow-hidden rounded-3xl shadow-2xl bg-white border border-gray-100 relative h-[520px]">
                <div 
                    className="flex transition-transform duration-500 ease-in-out h-full" 
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                    {slides.map((slide, index) => (
                        <div key={index} className="min-w-full h-full flex flex-col items-center justify-center p-8 bg-gray-50">
                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 w-full max-w-md flex items-center justify-center h-64">
                                <img 
                                    src={slide.img} 
                                    alt={`${slide.name} Map`} 
                                    className="max-h-full w-auto object-contain"
                                    onError={(e) => e.currentTarget.src = `https://placehold.co/400x300/EEE/31343C?text=${slide.name}`}
                                />
                            </div>
                            <h3 className={`text-3xl font-bold font-dynapuff mb-3 text-center ${slide.color}`}>{slide.name}</h3>
                            <p className="text-gray-600 font-arial mb-6 text-center max-w-md">{slide.desc}</p>
                            <Button onClick={() => onNavigate('check-postcode')} className="shadow-lg transform hover:scale-105 transition-transform">
                                View & Vote
                            </Button>
                        </div>
                    ))}
                </div>
                
                {/* Navigation Buttons */}
                <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-brand-purple p-3 rounded-full shadow-lg backdrop-blur-sm transition-all z-10">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                </button>
                <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-brand-purple p-3 rounded-full shadow-lg backdrop-blur-sm transition-all z-10">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                </button>

                {/* Pagination Dots */}
                <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
                    {slides.map((_, i) => (
                        <button 
                            key={i}
                            onClick={() => setCurrentIndex(i)}
                            className={`w-3 h-3 rounded-full transition-all ${i === currentIndex ? 'bg-brand-purple w-8' : 'bg-gray-300 hover:bg-gray-400'}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export const Landing: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  return (
    <div className="animate-fade-in bg-gradient-to-br from-purple-100 via-purple-200 to-teal-100 min-h-[calc(100vh-80px)]">
      {/* Hero Text */}
      <section className="pt-12 pb-8 text-center px-4">
        <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-purple to-brand-teal mb-4 font-dynapuff drop-shadow-sm">
          You Decide. You Benefit.
        </h1>
        <p className="text-xl text-gray-700 max-w-2xl mx-auto font-arial leading-relaxed">
          Welcome to the Round 2 Application Cycle (2026). <br/>
          Apply for funding or join a committee to shape the future of Torfaen.
        </p>
        <div className="mt-8 flex justify-center gap-4">
             <Button size="lg" onClick={() => onNavigate('register')} className="shadow-xl shadow-purple-200/50 transform hover:-translate-y-1">
                Apply for Funding
            </Button>
            <Button size="lg" variant="outline" onClick={() => onNavigate('timeline')} className="bg-white/80 backdrop-blur-sm">
                View Timeline
            </Button>
        </div>
      </section>

      {/* Carousel Section */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <AreaCarousel onNavigate={onNavigate} />
      </section>

      {/* Info Section */}
      <section className="max-w-4xl mx-auto px-4 pb-20 text-center">
          <h3 className="text-2xl font-bold font-dynapuff text-brand-purple mb-4">What is Participatory Budgeting?</h3>
          <p className="text-gray-700 font-arial text-lg leading-relaxed">
            Participatory Budgeting (PB) puts decision-making power in the hands of residents. 
            You can help choose which local projects receive funding by voting for your favourites. 
            Every vote counts!
          </p>
      </section>
    </div>
  );
};

export const Priorities: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'blaenavon' | 'thornhill' | 'trevethin'>('blaenavon');
    const data = PRIORITY_DATA[activeTab];

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 via-purple-200 to-teal-100 py-12 px-4 animate-fade-in">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold font-dynapuff text-brand-purple mb-4">Our Community Priorities</h1>
                    <p className="text-gray-700 max-w-3xl mx-auto font-arial text-lg">
                        The 'Have Your Say!' campaign ran from January to May 2025 to identify the top funding priorities for our communities. With <strong>1,062 responses</strong>, your voices have shaped the future of this initiative.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex justify-center mb-8 border-b-2 border-gray-200/50">
                    {[
                        { id: 'blaenavon', label: 'Blaenavon' },
                        { id: 'thornhill', label: 'Thornhill & Upper Cwmbran' },
                        { id: 'trevethin', label: 'Trevethin, Penygarn & St. Cadocs' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 md:px-8 py-4 font-bold font-dynapuff transition-all text-sm md:text-base ${
                                activeTab === tab.id 
                                ? 'bg-white/80 backdrop-blur text-brand-purple border-b-4 border-brand-purple rounded-t-xl shadow-sm' 
                                : 'text-gray-600 hover:bg-white/40 rounded-t-xl'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-xl">
                    <div className="grid md:grid-cols-12 gap-12">
                        {/* Left: Stats */}
                        <div className="md:col-span-5">
                            <h3 className="text-2xl font-bold font-dynapuff text-brand-purple mb-4 capitalize">{activeTab.replace('_', ' ')}</h3>
                            <p className="text-gray-700 font-arial mb-6">
                                A total of <strong className="text-brand-darkTeal">{data.total} responses</strong> were gathered from this area, highlighting the key concerns and hopes of the community.
                            </p>
                            {/* Simple Chart Viz */}
                            <div className="h-64 w-full bg-gray-50 rounded-xl border border-gray-100 flex items-end justify-around p-4">
                                {data.data.map((item, i) => (
                                    <div key={i} className="w-8 bg-brand-purple/80 rounded-t-md relative group hover:bg-brand-teal transition-colors" style={{ height: `${(item.value / 150) * 100}%` }}>
                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 text-xs font-bold bg-gray-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                            {item.label}: {item.value}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right: Cards */}
                        <div className="md:col-span-7">
                            <div className="grid gap-4">
                                {data.data.map((item, i) => (
                                    <div key={i} className="bg-gradient-to-r from-white to-gray-50 border border-purple-100 p-4 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex items-center">
                                        <span className="text-2xl font-bold font-dynapuff text-brand-purple mr-4">#{i+1}</span>
                                        <div>
                                            <h4 className="font-bold text-gray-800 font-dynapuff">{item.label}</h4>
                                            <p className="text-sm text-gray-500 font-arial">Identified by community consensus.</p>
                                        </div>
                                        <div className="ml-auto text-xl font-bold text-gray-300">{item.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const PostcodeChecker: React.FC = () => {
    const [code, setCode] = useState('');
    const [result, setResult] = useState<{valid: boolean, area?: string} | null>(null);

    const check = () => {
        const norm = code.toUpperCase().replace(/\s/g, '');
        let found = false;
        for (const [area, codes] of Object.entries(POSTCODES)) {
            const flatCodes = codes.map(c => c.replace(/\s/g, ''));
            if (flatCodes.includes(norm)) {
                setResult({ valid: true, area });
                found = true;
                break;
            }
        }
        if (!found) setResult({ valid: false });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 via-purple-200 to-teal-100 py-16 px-4 animate-fade-in flex items-center justify-center">
            <Card className="max-w-lg w-full text-center border-t-8 border-t-brand-purple shadow-2xl p-8">
                <h1 className="text-3xl font-bold font-dynapuff text-brand-purple mb-2">Communities' Choice</h1>
                <h2 className="text-xl text-brand-darkPurple font-dynapuff mb-6">Torfaen Participatory Budgeting</h2>
                
                <p className="text-gray-600 font-arial mb-8">
                    To vote, please enter your postcode to verify you are a resident.
                </p>
                
                <div className="space-y-4 mb-6">
                    <select className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-brand-purple outline-none bg-white font-arial">
                        <option>-- Select your area --</option>
                        <option>Blaenavon</option>
                        <option>Thornhill & Upper Cwmbran</option>
                        <option>Trevethin, Penygarn & St. Cadocs</option>
                    </select>
                    
                    <div className="flex gap-2">
                        <Input 
                            placeholder="e.g. NP4 9AA" 
                            value={code} 
                            onChange={e => setCode(e.target.value)}
                            className="mb-0 text-center uppercase tracking-widest font-bold"
                        />
                    </div>
                    
                    <Button onClick={check} size="lg" className="w-full shadow-lg">Check & Proceed</Button>
                </div>

                {result && (
                    <div className={`p-4 rounded-xl font-bold border animate-fade-in ${result.valid ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                        {result.valid 
                            ? <div>✅ Verified! Redirecting to voting...</div>
                            : '❌ Postcode not recognized for this round.'}
                    </div>
                )}
            </Card>
        </div>
    );
};

export const Timeline: React.FC = () => {
    const events = [
        { date: 'Jan - May', title: 'Have Your Say!', desc: 'Community priorities identified via survey.', status: 'done' },
        { date: 'June 20', title: 'Applications Open', desc: 'Round 2 EOI submissions begin.', status: 'active' },
        { date: 'Aug 01', title: 'EOI Deadline', desc: 'Midnight deadline for Part 1 forms.', status: 'future' },
        { date: 'Sept 10', title: 'Full Application', desc: 'Part 2 detailed submission deadline.', status: 'future' },
        { date: 'Nov', title: 'Public Vote', desc: 'Community voting events take place.', status: 'future' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 via-purple-200 to-teal-100 py-16 px-4 animate-fade-in">
            <div className="max-w-5xl mx-auto bg-white/90 backdrop-blur rounded-3xl shadow-2xl p-8 md:p-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold font-dynapuff text-brand-purple mb-2">PB Initiative Timeline</h1>
                    <h2 className="text-xl text-brand-darkTeal font-dynapuff">Interactive Timeline of Main Events</h2>
                </div>
                
                <div className="relative">
                    <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-2 h-full bg-gradient-to-b from-brand-purple to-brand-teal rounded-full opacity-20"></div>
                    <div className="space-y-12">
                        {events.map((e, i) => (
                            <div key={i} className={`flex flex-col md:flex-row items-center ${i % 2 === 0 ? 'md:flex-row-reverse' : ''} group`}>
                                <div className="flex-1 md:w-1/2 p-4"></div>
                                
                                <div className={`z-10 flex items-center justify-center w-14 h-14 border-4 rounded-full shadow-xl shrink-0 transition-transform group-hover:scale-110 ${e.status === 'done' ? 'bg-brand-purple border-brand-purple text-white' : e.status === 'active' ? 'bg-white border-brand-teal text-brand-teal' : 'bg-white border-gray-300 text-gray-300'}`}>
                                    {e.status === 'done' ? '✓' : i + 1}
                                </div>
                                
                                <div className="flex-1 md:w-1/2 p-4 text-center md:text-left">
                                    <div className={`bg-white p-6 rounded-2xl shadow-lg border-b-4 hover:shadow-xl transition-all ${i % 2 === 0 ? 'md:text-right border-brand-purple' : 'border-brand-teal'}`}>
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 uppercase tracking-wider ${e.status === 'active' ? 'bg-brand-teal text-white' : 'bg-gray-100 text-gray-500'}`}>
                                            {e.date}
                                        </span>
                                        <h3 className="text-xl font-bold text-gray-800 font-dynapuff mb-1">{e.title}</h3>
                                        <p className="text-gray-600 text-sm font-arial">{e.desc}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
