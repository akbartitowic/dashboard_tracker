import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CheckCircle2, Circle, Clock, Layout, AlertCircle, TrendingUp, LayoutGrid, List as ListIcon, RefreshCw, ChevronRight, Folder, Table as TableIcon, BarChart3, Search, Activity, ExternalLink, Layers, Database, MousePointer2 } from 'lucide-react';
import Navbar from '../Components/Navbar';
import Breadcrumbs from '../Components/Breadcrumbs';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const STATUS_CONFIG = {
    'to do':         { color: '#94a3b8', bg: 'bg-secondary' },
    'todo':          { color: '#94a3b8', bg: 'bg-secondary' },
    'in progress':   { color: '#3b82f6', bg: 'bg-blue-500/10' },
    'inprogress':    { color: '#3b82f6', bg: 'bg-blue-500/10' },
    'done dev':      { color: '#6366f1', bg: 'bg-indigo-500/10' },
    'ready to test': { color: '#6366f1', bg: 'bg-indigo-500/10' },
    're open':       { color: '#f97316', bg: 'bg-orange-500/10' },
    'done':          { color: '#10b981', bg: 'bg-emerald-500/10' },
};

const getStatusColor = (name) => STATUS_CONFIG[name?.toLowerCase()]?.color || '#94a3b8';

// Inline SVG Donut Chart 
const DonutChart = ({ percent, size = 88, stroke = 10 }) => {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (percent / 100) * circ;
    const color = percent === 100 ? '#10b981' : percent >= 50 ? '#3b82f6' : percent >= 25 ? '#f59e0b' : '#94a3b8';
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth={stroke} />
            <circle
                cx={size/2} cy={size/2} r={r} fill="none"
                stroke={color} strokeWidth={stroke}
                strokeDasharray={circ} strokeDashoffset={offset}
                strokeLinecap="round"
                transform={`rotate(-90 ${size/2} ${size/2})`}
                style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }}
            />
            <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
                fill={color} fontSize={size * 0.18} fontWeight="900" fontFamily="inherit">
                {percent}%
            </text>
        </svg>
    );
};

const StatCard = ({ title, value, icon: Icon, trend }) => (
    <div className="glass-panel p-6 rounded-[2rem] border-white/40 shadow-xl shadow-primary/5 group relative overflow-hidden transition-all hover:-translate-y-1">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-125 transition-transform duration-500 text-primary">
            <Icon size={80} />
        </div>
        <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                <Icon size={18} />
            </div>
            {trend && (
                <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {trend}
                </span>
            )}
        </div>
        <div className="space-y-1">
            <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">{title}</span>
            <div className="text-3xl font-black text-foreground tracking-tight">{value}</div>
        </div>
    </div>
);

const Dashboard = ({ auth, taskStats, subTaskStats, detailStats, userStats, completion, projects, totalExcellence }) => {
    const [projectView, setProjectView] = useState('grid');
    const [chartView, setChartView] = useState('graph'); // 'graph' or 'table'
    const [analysisLevel, setAnalysisLevel] = useState('task'); // 'task', 'subtask', 'detail'
    const [activeStatusIndex, setActiveStatusIndex] = useState(0);
    const [taskSearch, setTaskSearch] = useState('');

    const getStats = () => {
        switch(analysisLevel) {
            case 'subtask': return subTaskStats || [];
            case 'detail': return detailStats || [];
            default: return taskStats || [];
        }
    };

    const currentStats = getStats();
    
    if (!currentStats || !completion) return (
        <>
            <Head title="Dashboard" />
            <Navbar user={auth.user} />
            <div className="min-h-[80vh] flex flex-col items-center justify-center mesh-gradient">
                <div className="bg-secondary/50 p-6 rounded-3xl border border-border/50 text-center">
                    <AlertCircle size={48} className="text-muted-foreground mx-auto mb-4 opacity-20" />
                    <h3 className="text-lg font-bold">No Data Yet</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">Create boards and tasks to populate your dashboard.</p>
                </div>
            </div>
        </>
    );

    const taskDistribution = currentStats.map(s => ({ 
        name: s.status || s.name || 'Unknown', 
        value: parseInt(s.count),
        color: getStatusColor(s.status || s.name)
    }));
    
    const activeStatus = currentStats[activeStatusIndex] || currentStats[0];
    const filteredTasks = activeStatus?.tasks?.filter(t => 
        t.title.toLowerCase().includes(taskSearch.toLowerCase()) ||
        t.board_name.toLowerCase().includes(taskSearch.toLowerCase())
    ) || [];

    const completionRate = Math.round((completion.done / (parseInt(completion.done) + parseInt(completion.not_done))) * 100) || 0;

    return (
        <>
            <Head title="Dashboard" />
            <div className="min-h-screen mesh-gradient flex flex-col overflow-x-hidden">
                <Navbar user={auth.user} />
                <div className="flex-1 p-6 md:p-10 pb-20 overflow-auto">
                    <div className="max-w-[1400px] mx-auto scale-in">
                        <Breadcrumbs items={[{ label: 'Dashboard Analysis' }]} />
                        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div>
                                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full border border-primary/20 mb-4 uppercase tracking-widest">
                                    <TrendingUp size={12} />
                                    Real-time Metrics
                                </div>
                                <h1 className="text-4xl font-black tracking-tighter text-foreground">Dashboard</h1>
                                <p className="text-muted-foreground mt-2 text-sm font-medium">Enterprise Analytics Ecosystem</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="bg-background/50 border border-border/50 rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-sm">
                                    <Clock size={16} className="text-primary" />
                                    <span className="text-sm font-bold text-foreground">Live Sync Active</span>
                                </div>
                            </div>
                        </header>

                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-10">
                            <StatCard title="Active Clusters" value={projects?.length || 0} icon={Folder} trend="+1" />
                            <StatCard title="Total Tasks" value={totalExcellence?.tasks || 0} icon={Layout} />
                            <StatCard title="Total Subtasks" value={totalExcellence?.subtasks || 0} icon={Layers} />
                            <StatCard title="Total Details" value={totalExcellence?.details || 0} icon={Database} />
                            {/* <StatCard title="Resolved Units" value={completion.done} icon={CheckCircle2} /> */}
                            <StatCard title="Health Index" value={`${completionRate}%`} icon={TrendingUp} />
                        </div>

                        {/* Projects Section */}
                        <div className="mb-12">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight text-foreground">Workspace Nodes</h2>
                                    <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Distributed Project Clusters</p>
                                </div>
                                <div className="flex items-center bg-secondary/40 p-1.5 rounded-2xl border border-border/50 gap-1.5">
                                    <button onClick={() => setProjectView('grid')}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${projectView === 'grid' ? 'bg-background shadow-lg text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                                        <LayoutGrid size={14} /> GRID
                                    </button>
                                    <button onClick={() => setProjectView('list')}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${projectView === 'list' ? 'bg-background shadow-lg text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                                        <ListIcon size={14} /> LIST
                                    </button>
                                </div>
                            </div>

                            {/* Grid View */}
                            {projectView === 'grid' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {(projects || []).map(project => (
                                        <button key={project.id}
                                            onClick={() => router.visit(route('dashboard.project', project.id))}
                                            className="glass-panel group relative rounded-[2.5rem] border-white/40 p-6 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all text-left">
                                            <div className="absolute top-4 right-4 text-muted-foreground/30 group-hover:text-primary transition-colors">
                                                <ChevronRight size={24} />
                                            </div>
                                            <div className="flex flex-col h-full">
                                                <div className="mb-6">
                                                    <DonutChart percent={project.progress} size={80} stroke={10} />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-black text-foreground group-hover:text-primary transition-colors leading-tight mb-1">{project.name}</h3>
                                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Load: {project.total_tasks} Units</p>
                                                </div>

                                                <div className="mt-6 flex flex-wrap gap-1.5">
                                                    {Object.entries(project.status_breakdown || {}).slice(0, 3).map(([name, count]) => (
                                                        <span key={name} className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-secondary/80 text-muted-foreground border border-border/10">
                                                            {name}: {count}
                                                        </span>
                                                    ))}
                                                </div>
                                                
                                                {project.total_reopens > 0 && (
                                                    <div className="mt-4 flex items-center gap-2 text-[9px] font-black text-rose-600 bg-rose-500/10 w-fit px-2 py-1 rounded-lg border border-rose-500/20">
                                                        <RefreshCw size={10} className="animate-spin-slow" />
                                                        {project.total_reopens} REOPENS
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* List View */}
                            {projectView === 'list' && (
                                <div className="glass-panel rounded-[2.5rem] border-white/40 shadow-xl overflow-hidden">
                                    <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-4 bg-muted/20 border-b border-border/30 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        <div className="col-span-4">Node Identity</div>
                                        <div className="col-span-2 text-center">Payload</div>
                                        <div className="col-span-3">Velocity Index</div>
                                        <div className="col-span-2 text-center">Instability</div>
                                        <div className="col-span-1"></div>
                                    </div>
                                    {(projects || []).map((project, i) => (
                                        <button key={project.id}
                                            onClick={() => router.visit(route('dashboard.project', project.id))}
                                            className={`w-full grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-8 py-5 hover:bg-primary/[0.03] transition-colors text-left group border-b border-border/10 last:border-0`}>
                                            <div className="col-span-4 flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-secondary/50 flex items-center justify-center text-[11px] font-black text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                                    {i+1}
                                                </div>
                                                <div>
                                                    <p className="text-base font-black text-foreground group-hover:text-primary transition-colors">{project.name}</p>
                                                    <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">Status: {project.dominant_status}</p>
                                                </div>
                                            </div>
                                            <div className="col-span-2 flex items-center justify-center">
                                                <span className="text-xl font-black text-foreground tracking-tighter">{project.total_tasks}</span>
                                            </div>
                                            <div className="col-span-3 flex items-center gap-4">
                                                <div className="flex-1 bg-secondary/50 h-3 rounded-full overflow-hidden p-0.5 shadow-inner">
                                                    <div className={`h-full rounded-full transition-all duration-1000 ${project.progress === 100 ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-primary shadow-lg shadow-primary/20'}`}
                                                        style={{ width: `${project.progress}%` }} />
                                                </div>
                                                <span className={`text-[11px] font-black w-10 shrink-0 text-right ${project.progress === 100 ? 'text-emerald-500' : 'text-primary'}`}>
                                                    {project.progress}%
                                                </span>
                                            </div>
                                            <div className="col-span-2 flex items-center justify-center">
                                                {project.total_reopens > 0 ? (
                                                    <span className="flex items-center gap-1.5 text-[9px] font-black bg-rose-500/10 text-rose-600 px-3 py-1.5 rounded-xl border border-rose-500/20">
                                                        <RefreshCw size={10} className="animate-spin-slow" />{project.total_reopens} REOPENS
                                                    </span>
                                                ) : <span className="text-[9px] text-muted-foreground font-black opacity-30">—</span>}
                                            </div>
                                            <div className="col-span-1 flex items-center justify-end">
                                                <div className="w-8 h-8 rounded-full bg-secondary/30 flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all">
                                                    <ChevronRight size={18} />
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Analysis Level Toggle */}
                        <div className="flex flex-wrap items-center gap-2 mb-6 p-2 bg-secondary/20 rounded-3xl w-fit border border-white/5">
                            {[
                                { id: 'task', label: 'TASKS', icon: Layout },
                                { id: 'subtask', label: 'SUB TASKS', icon: Layers },
                                { id: 'detail', label: 'DETAIL SUBTASKS', icon: Database },
                            ].map(level => (
                                <button
                                    key={level.id}
                                    onClick={() => {
                                        setAnalysisLevel(level.id);
                                        setActiveStatusIndex(0);
                                    }}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${analysisLevel === level.id ? 'bg-primary text-white shadow-lg shadow-primary/30 active-scale-95' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
                                >
                                    <level.icon size={14} />
                                    {level.label}
                                </button>
                            ))}
                        </div>

                        {/* Global Status Distribution Explorer */}
                        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-black tracking-tight text-foreground capitalize">{analysisLevel === 'task' ? 'Global Lifecycle Explorer' : `${analysisLevel.replace('task', ' task')} Distribution`}</h2>
                                <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Ecosystem density • Click bars to inspect specifics</p>
                            </div>
                            <div className="flex items-center bg-secondary/40 p-1.5 rounded-2xl border border-border/50 gap-1.5 text-primary self-start">
                                <button onClick={() => setChartView('graph')}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${chartView === 'graph' ? 'bg-background shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}>
                                    <BarChart3 size={14} /> GRAPH
                                </button>
                                <button onClick={() => setChartView('table')}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${chartView === 'table' ? 'bg-background shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}>
                                    <TableIcon size={14} /> TABLE
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
                            {/* Left Side: Distribution */}
                            <div className="lg:col-span-8 glass-panel border-white/40 p-8 rounded-[3rem] shadow-2xl">
                                {chartView === 'graph' ? (
                                    <div className="h-[400px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={taskDistribution} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                                                <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="hsl(var(--border))" opacity={0.2} />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false}
                                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 900 }} dy={15} />
                                                <YAxis axisLine={false} tickLine={false}
                                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 900 }} />
                                                <Tooltip cursor={{ fill: 'hsl(var(--primary))', opacity: 0.05 }}
                                                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)',
                                                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '12px 16px',
                                                        boxShadow: '0 10px 30px rgba(0,0,0,0.2)', color: '#fff' }} />
                                                <Bar 
                                                    dataKey="value" 
                                                    radius={[10,10,4,4]} 
                                                    barSize={55}
                                                    onClick={(data, index) => setActiveStatusIndex(index)}
                                                    className="cursor-pointer"
                                                >
                                                    {taskDistribution.map((entry, index) => (
                                                        <Cell 
                                                            key={`cell-${index}`} 
                                                            fill={entry.color} 
                                                            opacity={activeStatusIndex === index ? 1 : 0.3}
                                                            stroke={activeStatusIndex === index ? 'white' : 'transparent'}
                                                            strokeWidth={2}
                                                        />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-4 px-4 py-2 bg-muted/30 rounded-xl text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-4">
                                            <div>State</div>
                                            <div className="text-center">Units</div>
                                            <div className="col-span-2">Density</div>
                                        </div>
                                        {taskDistribution.length === 0 ? (
                                            <div className="py-12 text-center text-muted-foreground font-bold uppercase tracking-widest opacity-30">No data found at this level</div>
                                        ) : taskDistribution.map((t, idx) => {
                                            const isActive = activeStatusIndex === idx;
                                            return (
                                                <button 
                                                    key={t.name} 
                                                    onClick={() => setActiveStatusIndex(idx)}
                                                    className={`w-full grid grid-cols-4 px-4 py-4 items-center border rounded-2xl transition-all ${isActive ? 'bg-primary/5 border-primary/20 shadow-inner' : 'border-transparent hover:bg-white/5'}`}
                                                >
                                                    <div className="text-sm font-black text-foreground text-left flex items-center gap-2">
                                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                                                        {t.name}
                                                    </div>
                                                    <div className="text-center text-lg font-black text-foreground">{t.value}</div>
                                                    <div className="col-span-2 px-2 relative h-2">
                                                        <div className="w-full bg-secondary/50 h-full rounded-full overflow-hidden">
                                                            <div className="h-full rounded-full transition-all duration-1000" 
                                                                style={{ width: `${(t.value / (taskDistribution.reduce((a,b) => a+b.value, 0) || 1)) * 100}%`, backgroundColor: t.color }} />
                                                        </div>
                                                        {isActive && <div className="absolute inset-0 bg-white/10 animate-pulse rounded-full" />}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Right Side: Task Ledger */}
                            <div className="lg:col-span-4 flex flex-col min-h-[400px]">
                                <div className="glass-panel border-white/40 rounded-[2.5rem] flex-1 flex flex-col overflow-hidden shadow-2xl">
                                    <div className="px-6 py-5 border-b border-border/30 flex items-center justify-between bg-muted/10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getStatusColor(activeStatus?.status || activeStatus?.name) }} />
                                            <h3 className="text-sm font-black text-foreground uppercase tracking-widest leading-none">
                                                {analysisLevel === 'task' ? 'Global' : analysisLevel === 'subtask' ? 'Sub' : 'Detail'}: {activeStatus?.status || activeStatus?.name || 'Empty'}
                                            </h3>
                                        </div>
                                        <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full ring-1 ring-primary/20">
                                            {activeStatus?.count || 0} Records
                                        </span>
                                    </div>

                                    <div className="p-4 border-b border-border/10 bg-black/5">
                                        <div className="relative group">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={14} />
                                            <input 
                                                type="text"
                                                placeholder={`Search inside ${analysisLevel}...`}
                                                value={taskSearch}
                                                onChange={(e) => setTaskSearch(e.target.value)}
                                                className="w-full bg-secondary/50 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground/30"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto max-h-[450px] divide-y divide-border/10">
                                        {filteredTasks.length > 0 ? (
                                            filteredTasks.map(task => (
                                                <button 
                                                    key={task.id}
                                                    onClick={() => router.visit(route('boards.show', task.board_id))}
                                                    className="w-full px-6 py-4 flex flex-col hover:bg-white/5 transition-colors text-left group"
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-[8px] font-black text-primary/50 uppercase tracking-widest">{task.board_name}</span>
                                                        <ExternalLink size={10} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                    <p className="text-xs font-black text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">{task.title}</p>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-30">
                                                <Activity size={32} className="text-muted-foreground mb-3" />
                                                <p className="text-xs font-bold uppercase tracking-widest">No matching records</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="p-4 bg-primary/[0.02] border-t border-border/10">
                                        <div className="flex items-center gap-2 text-[9px] font-black text-muted-foreground uppercase tracking-tighter">
                                            <MousePointer2 size={10} />
                                            Selected: {analysisLevel.toUpperCase()} LEVEL
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Resource and Pulse Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                            <div className="glass-panel border-white/40 p-10 rounded-[3rem] shadow-2xl flex flex-col">
                                <h2 className="text-xl font-black text-foreground tracking-tight mb-1">Resource Matrix</h2>
                                <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest mb-8">Unit allocation per node</p>
                                
                                <div className="h-[220px] mb-8">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={userStats.map(u => ({ name: u.username, value: parseInt(u.count) }))}
                                                cx="50%" cy="50%" innerRadius={60} outerRadius={85}
                                                paddingAngle={8} dataKey="value"
                                                stroke="rgba(255,255,255,0.2)" strokeWidth={4}>
                                                {userStats.map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)',
                                                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {userStats.slice(0, 4).map((u, i) => (
                                        <div key={u.username} className="flex items-center justify-between p-3 bg-secondary/20 rounded-2xl border border-white/5 hover:border-primary/20 transition-all cursor-default group">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                                <span className="text-[10px] font-black text-foreground/70 uppercase truncate tracking-widest">{u.username}</span>
                                            </div>
                                            <span className="text-xs font-black text-foreground">{u.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="glass-panel border-primary/20 bg-primary/[0.03] p-10 rounded-[3rem] shadow-2xl flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xl font-black text-foreground uppercase tracking-widest">Aggregate Resolution</h3>
                                        <span className="text-4xl font-black text-primary tracking-tighter">{completionRate}%</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground font-semibold max-w-md">Global ecosystem health based on calculated task completion across all distributed nodes.</p>
                                </div>
                                
                                <div className="mt-12">
                                    <div className="w-full bg-primary/10 h-6 rounded-full overflow-hidden p-1 shadow-inner ring-1 ring-primary/20">
                                        <div className="bg-gradient-to-r from-primary via-blue-600 to-indigo-600 h-full rounded-full transition-all duration-[2s] cubic-bezier(0.16, 1, 0.3, 1) shadow-lg"
                                            style={{ width: `${completionRate}%` }} />
                                    </div>
                                    <div className="flex justify-between mt-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-muted-foreground uppercase opacity-50">Resolved</span>
                                            <span className="text-lg font-black text-emerald-500">{completion.done} Units</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-black text-muted-foreground uppercase opacity-50">Pending</span>
                                            <span className="text-lg font-black text-primary">{completion.not_done} Units</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Dashboard;
