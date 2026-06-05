import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell, YAxis as BarYAxis } from 'recharts';
import { BarChart3, TrendingUp, PieChart as PieIcon, ShieldAlert, Activity, Users } from 'lucide-react';

export default function AnalyticsPanel({ data }) {
  
  // Calculate Buzzword Frequencies based on active database data
  const getBuzzwordData = () => {
    const counts = {
      'Offset': 0,
      'Natural': 0,
      'Eco-Safe': 0,
      'Pure': 0,
      'Green': 0,
      'Net-Zero': 0
    };
    
    data.forEach(item => {
      const text = (item.text_content || '').toLowerCase();
      if (text.includes('offset')) counts['Offset']++;
      if (text.includes('natural') || text.includes('organic')) counts['Natural']++;
      if (text.includes('eco') || text.includes('biodegradable')) counts['Eco-Safe']++;
      if (text.includes('pure') || text.includes('botanical')) counts['Pure']++;
      if (text.includes('green') || text.includes('sustainable')) counts['Green']++;
      if (text.includes('net-zero') || text.includes('carbon-neutral')) counts['Net-Zero']++;
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  // Calculate top offenders
  const getOffenderData = () => {
    const counts = {};
    data.forEach(item => {
      const corp = item.parentCorporation || 'Independent';
      counts[corp] = (counts[corp] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };

  // Calculate Average Score
  const getAverageScore = () => {
    if (data.length === 0) return 0;
    const total = data.reduce((acc, curr) => acc + (curr.skepticScore || 0), 0);
    return Math.round(total / data.length);
  };

  const avgScore = getAverageScore();
  const verifiedCount = data.filter(d => d.status === 'Verified').length;
  const criticalCount = data.filter(d => d.severity === 'Critical').length;
  const criticalPercent = data.length > 0 ? Math.round((criticalCount / data.length) * 100) : 0;

  // Mock submission timeline over 7 days
  const timelineData = [
    { date: '05-30', Scans: 12, Verified: 8 },
    { date: '05-31', Scans: 19, Verified: 12 },
    { date: '06-01', Scans: 15, Verified: 10 },
    { date: '06-02', Scans: 22, Verified: 15 },
    { date: '06-03', Scans: 27, Verified: 18 },
    { date: '06-04', Scans: 35, Verified: 24 },
    { date: '06-05', Scans: data.length, Verified: verifiedCount }
  ];

  const buzzwords = getBuzzwordData();
  const offenders = getOffenderData();

  // SVG Dashboard Circle calculation
  const circleCircumference = 2 * Math.PI * 48; // 301.59
  const circleOffset = circleCircumference - (avgScore / 100) * circleCircumference;

  return (
    <div className="space-y-6">
      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0D1713] p-4 rounded-lg whisper-border-effect">
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-[10px] text-outline">Total Tracked</span>
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <div className="mt-2 font-metric-lg text-2xl font-bold text-text-ivory">{data.length}</div>
        </div>
        <div className="bg-[#0D1713] p-4 rounded-lg whisper-border-effect">
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-[10px] text-outline">Verified Flags</span>
            <ShieldAlert className="w-4 h-4 text-warning-orange" />
          </div>
          <div className="mt-2 font-metric-lg text-2xl font-bold text-warning-orange">{verifiedCount}</div>
        </div>
        <div className="bg-[#0D1713] p-4 rounded-lg whisper-border-effect">
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-[10px] text-outline">Critical Severity</span>
            <div className="w-2 h-2 rounded-full bg-alert-crimson animate-pulse"></div>
          </div>
          <div className="mt-2 font-metric-lg text-2xl font-bold text-alert-crimson">{criticalPercent}%</div>
        </div>
        <div className="bg-[#0D1713] p-4 rounded-lg whisper-border-effect">
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-[10px] text-outline">Avg Score</span>
            <PieIcon className="w-4 h-4 text-secondary" />
          </div>
          <div className="mt-2 font-metric-lg text-2xl font-bold text-secondary">{avgScore}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Visual Dial / Skeptic Summary */}
        <div className="bg-[#0D1713] rounded-lg whisper-border-effect p-6 flex flex-col justify-between col-span-1 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <span className="font-label-caps text-[10px] text-outline">Risk Telemetry</span>
            <PieIcon className="w-4 h-4 text-alert-crimson" />
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-center py-2">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle className="text-[#11231c]" cx="56" cy="56" fill="transparent" r="48" stroke="currentColor" strokeWidth="8"></circle>
                <circle 
                  className={`${avgScore > 75 ? 'text-alert-crimson' : avgScore > 40 ? 'text-warning-orange' : 'text-primary'} transition-all duration-1000`} 
                  cx="56" 
                  cy="56" 
                  fill="transparent" 
                  r="48" 
                  stroke="currentColor" 
                  strokeDasharray={circleCircumference} 
                  strokeDashoffset={circleOffset} 
                  strokeWidth="8"
                  strokeLinecap="round"
                ></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`font-metric-lg text-3xl leading-none ${avgScore > 75 ? 'text-alert-crimson' : avgScore > 40 ? 'text-warning-orange' : 'text-primary'}`}>{avgScore}</span>
                <span className="font-label-caps text-[9px] text-outline mt-1">Skeptic Avg</span>
              </div>
            </div>
            <div className="mt-4 text-xs font-medium text-text-ivory">
              Platform-wide Severity: {avgScore > 75 ? 'Critical' : avgScore > 40 ? 'Moderate' : 'Low'}
            </div>
          </div>
        </div>

        {/* Submissions vs Verifications Area Chart */}
        <div className="bg-[#0D1713] rounded-lg whisper-border-effect p-6 flex flex-col justify-between col-span-1 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <span className="font-label-caps text-[10px] text-outline">Submission Velocity</span>
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorVerified" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#11231c" />
                <XAxis dataKey="date" stroke="#6b7f76" fontSize={8} tickLine={false} />
                <YAxis stroke="#6b7f76" fontSize={8} tickLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#0d1713', borderColor: 'rgba(16,185,129,0.12)', color: '#ECFDF5', fontSize: '10px' }}
                />
                <Area type="monotone" dataKey="Scans" stroke="#10b981" fillOpacity={1} fill="url(#colorScans)" strokeWidth={1.5} />
                <Area type="monotone" dataKey="Verified" stroke="#ef4444" fillOpacity={1} fill="url(#colorVerified)" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Buzzwords Frequencies Bar Chart */}
        <div className="bg-[#0D1713] rounded-lg whisper-border-effect p-6 flex flex-col justify-between col-span-1 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <span className="font-label-caps text-[10px] text-outline">Claim Fallacy Density</span>
            <BarChart3 className="w-4 h-4 text-warning-orange" />
          </div>
          <div className="flex-1 h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={buzzwords} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#11231c" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7f76" fontSize={8} tickLine={false} />
                <YAxis stroke="#6b7f76" fontSize={8} tickLine={false} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#0d1713', borderColor: 'rgba(16,185,129,0.12)', color: '#ECFDF5', fontSize: '10px' }}
                  cursor={{fill: '#11231c'}}
                />
                <Bar dataKey="value" fill="#10b981" radius={[2, 2, 0, 0]}>
                  {buzzwords.map((entry, index) => {
                    const colors = ['#EF4444', '#F97316', '#10B981', '#98F5D2', '#6b7f76', '#7cd8b6'];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Offenders Chart */}
        <div className="bg-[#0D1713] rounded-lg whisper-border-effect p-6 flex flex-col justify-between col-span-1 md:col-span-2 lg:col-span-4">
          <div className="flex items-center justify-between mb-4">
            <span className="font-label-caps text-[10px] text-outline">Top Offending Parent Corporations</span>
            <Users className="w-4 h-4 text-alert-crimson" />
          </div>
          <div className="flex-1 h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={offenders} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#11231c" horizontal={false} />
                <XAxis type="number" stroke="#6b7f76" fontSize={8} tickLine={false} />
                <BarYAxis dataKey="name" type="category" stroke="#ECFDF5" fontSize={10} tickLine={false} width={100} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#0d1713', borderColor: 'rgba(16,185,129,0.12)', color: '#ECFDF5', fontSize: '10px' }}
                  cursor={{fill: '#11231c'}}
                />
                <Bar dataKey="value" fill="#EF4444" radius={[0, 4, 4, 0]} barSize={16}>
                  {offenders.map((entry, index) => {
                    const opacity = 1 - (index * 0.15);
                    return <Cell key={`offender-cell-${index}`} fill={`rgba(239, 68, 68, ${opacity})`} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
