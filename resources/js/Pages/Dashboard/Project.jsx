import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, RefreshCw, List as ListIcon, Target, AlertCircle, PieChart as PieIcon, BarChart as BarIcon, Table as TableIcon, ChevronRight, Activity, Search, Layers, Database, MousePointer2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import Navbar from '../../Components/Navbar';
import Breadcrumbs from '../../Components/Breadcrumbs';

const STATUS_COLORS = {
    'to do':         { bg: 'bg-secondary', text: 'text-muted-foreground', bar: '#94a3b8' },
    'todo':          { bg: 'bg-secondary', text: 'text-muted-foreground', bar: '#94a3b8' },
    'in progress':   { bg: 'bg-blue-500/10', text: 'text-blue-600', bar: '#3b82f6' },
    'inprogress':    { bg: 'bg-blue-500/10', text: 'text-blue-600', bar: '#3b82f6' },
    'done dev':      { bg: 'bg-indigo-500/10', text: 'text-indigo-600', bar: '#6366f1' },
    'ready to test': { bg: 'bg-indigo-500/10', text: 'text-indigo-600', bar: '#6366f1' },
    're open':       { bg: 'bg-orange-500/10', text: 'text-orange-600', bar: '#f97316' },
    'done':          { bg: 'bg-emerald-500/10', text: 'text-emerald-600', bar: '#10b981' },
};

const getStatusStyle = (name) => STATUS_COLORS[name?.toLowerCase()] || { bg: 'bg-secondary', text: 'text-muted-foreground', bar: '#94a3b8' };

const ProjectDashboard = ({ auth, board, totalTasks, totalSubtasks, totalDetails, doneTasks, overallProgress, statusBreakdown, subTaskStats, detailStats, reopenedTasks, totalReopens }) => {
    const [viewMode, setViewMode] = useState('chart'); // 'chart' or 'table'
    const [analysisLevel, setAnalysisLevel] = useState('task'); // 'task', 'subtask', 'detail'
    const [activeStatusIndex, setActiveStatusIndex] = useState(0);
    const [taskSearch, setTaskSearch] = useState('');
    
    const dashboardUrl = route('dashboard');
    const boardUrl = route('boards.show', board.id);

    const getStats = () => {
        switch(analysisLevel) {
            case 'subtask': return subTaskStats || [];
            case 'detail': return detailStats || [];
            default: return statusBreakdown || [];
        }
    };

    const currentStats = getStats();
    const activeStatus = currentStats[activeStatusIndex] || currentStats[0];

    const chartData = currentStats.map(s => ({
        name: s.name || s.status,
        value: s.count,
        percent: s.percent || 0,
        color: getStatusStyle(s.name || s.status).bar
    }));

    const filteredTasks = activeStatus?.tasks?.filter(t => 
        t.title.toLowerCase().includes(taskSearch.toLowerCase())
    ) || [];

    return (
        <>
            <Head title={`${board.name} — Dashboard`} />
            <div className="min-h-screen flex flex-col">
                <Navbar user={auth?.user} />
                <div className="flex-1 mesh-gradient overflow-x-hidden">
                    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">

                        {/* Back */}
                        <Breadcrumbs items={[{ label: board.name }]} />

                        {/* Header Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                            <div className="lg:col-span-2 glass-panel rounded-[2.5rem] border-white/40 shadow-2xl p-8 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                            <Target size={16} />
                                        </div>
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Active Project</p>
                                    </div>
                                    <h1 className="text-4xl font-black tracking-tighter text-foreground mb-2">{board.name}</h1>
                                    {board.description && <p className="text-muted-foreground text-sm font-medium line-clamp-2">{board.description}</p>}
                                </div>
                                
                                <div className="mt-8">
                                    <div className="flex items-center justify-between mb-3 text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                                        <span>Project Velocity</span>
                                        <span className={overallProgress === 100 ? 'text-emerald-500' : 'text-primary'}>{overallProgress}%</span>
                                    </div>
                                    <div className="w-full bg-secondary/40 h-5 rounded-2xl overflow-hidden p-1 shadow-inner ring-1 ring-white/20">
                                        <div 
                                            className={`h-full rounded-xl transition-all duration-[1.5s] cubic-bezier(0.16, 1, 0.3, 1) ${overallProgress === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-primary to-blue-500 shadow-lg shadow-primary/20'}`}
                                            style={{ width: `${overallProgress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="glass-panel rounded-[2.5rem] border-white/40 shadow-2xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Action Center</p>
                                    <button onClick={() => router.visit(boardUrl)}
                                        className="group flex items-center gap-3 bg-primary text-white px-8 py-4 rounded-[1.5rem] font-black text-sm tracking-tight shadow-xl shadow-primary/30 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all">
                                        GO TO BOARD
                                        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                    <p className="text-[10px] text-muted-foreground mt-4 font-bold">Open interactive board view</p>
                                </div>
                            </div>
                        </div>

                        {/* KPI Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
                            {[
                                { label: 'Total Tasks', value: totalTasks, icon: ListIcon, color: 'text-primary', bg: 'bg-primary/10' },
                                { label: 'Total Subtasks', value: totalSubtasks, icon: Layers, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                                { label: 'Total Details', value: totalDetails, icon: Database, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                                { label: 'Resolved (Done)', value: doneTasks, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                                { label: 'Instability', value: totalReopens, icon: RefreshCw, color: 'text-rose-500', bg: 'bg-rose-500/10' },
                            ].map(({ label, value, icon: Icon, color, bg }) => (
                                <div key={label} className="glass-panel rounded-[2rem] border-white/40 shadow-xl p-6 transition-all hover:-translate-y-1">
                                    <div className={`w-12 h-12 rounded-2xl ${bg} ${color} flex items-center justify-center mb-4 shadow-sm`}>
                                        <Icon size={20} />
                                    </div>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
                                    <div className="text-3xl font-black text-foreground tracking-tighter">{value}</div>
                                </div>
                            ))}
                        </div>

                        {/* Analysis Level Toggle */}
                        <div className="flex flex-wrap items-center gap-2 mb-6 p-2 bg-secondary/20 rounded-3xl w-fit border border-white/10">
                            {[
                                { id: 'task', label: 'TASKS', icon: ListIcon },
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
                                    {level.icon && <level.icon size={14} />}
                                    {level.label}
                                </button>
                            ))}
                        </div>

                        {/* Status Distribution Explorer */}
                        <div className="glass-panel rounded-[3rem] border-white/40 shadow-2xl p-8 mb-8">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-foreground tracking-tight capitalize">{analysisLevel === 'task' ? 'Status Distribution' : `${analysisLevel.replace('task', ' task')} Distribution`}</h2>
                                    <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Lifecycle segmentation index • Click status to see specifics</p>
                                </div>
                                <div className="flex items-center bg-secondary/30 p-1.5 rounded-2xl border border-border/50 gap-1.5 self-start">
                                    <button 
                                        onClick={() => setViewMode('chart')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'chart' ? 'bg-primary text-white shadow-lg' : 'text-muted-foreground hover:bg-white/10'}`}
                                    >
                                        <BarIcon size={14} /> GRAPH
                                    </button>
                                    <button 
                                        onClick={() => setViewMode('table')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'table' ? 'bg-primary text-white shadow-lg' : 'text-muted-foreground hover:bg-white/10'}`}
                                    >
                                        <TableIcon size={14} /> TABLE
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                {/* Left Side: The Selection/Chart */}
                                <div className="lg:col-span-7">
                                    {viewMode === 'chart' ? (
                                        <div className="h-[350px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                                                    <XAxis 
                                                        dataKey="name" 
                                                        axisLine={false} 
                                                        tickLine={false} 
                                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 900 }}
                                                        dy={10} 
                                                    />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 900 }} />
                                                    <Tooltip 
                                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                        contentStyle={{ 
                                                            backgroundColor: 'rgba(0,0,0,0.8)', 
                                                            borderColor: 'rgba(255,255,255,0.1)',
                                                            borderRadius: '16px',
                                                            backdropFilter: 'blur(10px)',
                                                            color: '#fff',
                                                            fontSize: '11px',
                                                            fontWeight: 900
                                                        }}
                                                    />
                                                    <Bar 
                                                        dataKey="value" 
                                                        radius={[10, 10, 4, 4]} 
                                                        barSize={40} 
                                                        onClick={(data, index) => setActiveStatusIndex(index)}
                                                        className="cursor-pointer"
                                                    >
                                                        {chartData.map((entry, index) => (
                                                            <Cell 
                                                                key={`cell-${index}`} 
                                                                fill={entry.color} 
                                                                opacity={activeStatusIndex === index ? 1 : 0.4}
                                                                stroke={activeStatusIndex === index ? 'white' : 'transparent'}
                                                                strokeWidth={2}
                                                            />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {currentStats.length === 0 ? (
                                                <div className="py-12 text-center text-muted-foreground font-bold uppercase tracking-widest opacity-30">No records at this level</div>
                                            ) : currentStats.map((s, index) => {
                                                const statusName = s.name || s.status;
                                                const st = getStatusStyle(statusName);
                                                const isActive = activeStatusIndex === index;
                                                const percent = s.percent || (totalTasks > 0 ? Math.round((s.count / totalTasks) * 100) : 0);
                                                return (
                                                    <button 
                                                        key={statusName} 
                                                        onClick={() => setActiveStatusIndex(index)}
                                                        className={`w-full group flex items-center gap-6 p-3 rounded-[1.5rem] transition-all border ${isActive ? 'bg-primary/5 border-primary/20 shadow-inner' : 'border-transparent hover:bg-white/5'}`}
                                                    >
                                                        <div className="w-32 shrink-0 text-right">
                                                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-2xl ${st.bg} ${st.text} border border-white/10 group-hover:scale-105 transition-transform inline-block`}>
                                                                {statusName}
                                                            </span>
                                                        </div>
                                                        <div className="flex-1 bg-secondary/30 rounded-2xl h-4 overflow-hidden p-0.5 shadow-inner relative">
                                                            <div className="h-full rounded-xl transition-all duration-1000 shadow-sm"
                                                                style={{ width: `${percent}%`, backgroundColor: st.bar }} />
                                                            {isActive && (
                                                                <div className="absolute inset-0 bg-white/10 animate-pulse" />
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 w-28 shrink-0">
                                                            <span className="text-xl font-black text-foreground w-10 text-right tracking-tighter">{s.count}</span>
                                                            <div className="flex flex-col text-left">
                                                                <span className="text-[8px] font-black text-muted-foreground uppercase opacity-50">Units</span>
                                                                <span className={`text-[11px] font-black ${st.text}`}>{percent}%</span>
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Right Side: The Task List Detail */}
                                <div className="lg:col-span-5 flex flex-col min-h-[400px]">
                                    <div className="bg-secondary/20 rounded-[2rem] border border-white/10 flex-1 flex flex-col overflow-hidden shadow-inner">
                                        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: getStatusStyle(activeStatus?.name || activeStatus?.status).bar }} />
                                                <h3 className="text-sm font-black text-foreground uppercase tracking-widest leading-none">
                                                    {analysisLevel === 'task' ? 'Tasks' : analysisLevel === 'subtask' ? 'Sub' : 'Detail'} in {activeStatus?.name || activeStatus?.status}
                                                </h3>
                                            </div>
                                            <span className="bg-white/10 text-white text-[10px] font-black px-2 py-0.5 rounded-full ring-1 ring-white/5">
                                                {activeStatus?.count || 0}
                                            </span>
                                        </div>

                                        <div className="p-4 border-b border-white/5 bg-black/5">
                                            <div className="relative group">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" size={12} />
                                                <input 
                                                    type="text"
                                                    placeholder="Filter specifics..."
                                                    value={taskSearch}
                                                    onChange={(e) => setTaskSearch(e.target.value)}
                                                    className="w-full bg-secondary/30 border border-white/5 rounded-xl pl-8 pr-4 py-2 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/50"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex-1 overflow-y-auto max-h-[350px] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                            {filteredTasks.length > 0 ? (
                                                <div className="divide-y divide-white/5">
                                                    {filteredTasks.map(task => (
                                                        <button 
                                                            key={task.id}
                                                            onClick={() => router.visit(route('boards.show', board.id))}
                                                            className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors text-left group"
                                                        >
                                                            <div className="flex-1 pr-4">
                                                                <div className="text-[8px] font-black text-muted-foreground/50 uppercase tracking-tighter mb-0.5">UID: #{task.id}</div>
                                                                <p className="text-xs font-black text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-1">{task.title}</p>
                                                            </div>
                                                            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                                                                <ArrowLeft size={14} className="rotate-180" />
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 opacity-50">
                                                        <Activity size={24} className="text-muted-foreground" />
                                                    </div>
                                                    <p className="text-xs font-bold text-muted-foreground opacity-30">No records found or level is empty.</p>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="p-4 bg-primary/[0.02] border-t border-white/5">
                                            <div className="flex items-center gap-2 text-[9px] font-black text-muted-foreground uppercase tracking-tighter">
                                                <MousePointer2 size={10} />
                                                Selected: {analysisLevel.toUpperCase()} LEVEL
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Reopen Table - Critical Analysis */}
                        <div className="glass-panel rounded-[3rem] border-white/40 shadow-2xl overflow-hidden relative group">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
                            
                            <div className="px-10 py-8 border-b border-border/30 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-[1.25rem] bg-rose-500/10 flex items-center justify-center shadow-inner group-hover:rotate-12 transition-transform duration-500">
                                        <RefreshCw size={20} className="text-rose-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-foreground tracking-tight">Recurrent Volatility</h2>
                                        <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Tasks requiring rework (Reopen &gt; 1)</p>
                                    </div>
                                </div>
                                <div className="bg-rose-500/10 text-rose-600 px-4 py-2 rounded-2xl border border-rose-500/20 flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest">Total Cumulative Rework:</span>
                                    <span className="text-lg font-black">{totalReopens}</span>
                                </div>
                            </div>

                            {reopenedTasks.length === 0 ? (
                                <div className="px-10 py-16 text-center">
                                    <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/10">
                                        <CheckCircle2 size={40} />
                                    </div>
                                    <h3 className="text-xl font-black text-foreground">Zero High Volatility Detected</h3>
                                    <p className="text-muted-foreground text-sm font-medium mt-2 max-w-sm mx-auto">No recurring logic failures or sub-optimal task cycles found in this workspace node.</p>
                                </div>
                            ) : (
                                <div className="relative z-10 overflow-x-auto">
                                    <div className="min-w-[800px]">
                                        <div className="grid grid-cols-12 gap-4 px-10 py-4 bg-muted/10 text-[10px] font-black uppercase tracking-widest text-muted-foreground font-sans border-b border-border/20">
                                            <div className="col-span-5">Task Identifier</div>
                                            <div className="col-span-2">Controller</div>
                                            <div className="col-span-2 text-center">Current State</div>
                                            <div className="col-span-2 text-center">Rework Frequency</div>
                                            <div className="col-span-1"></div>
                                        </div>
                                        {reopenedTasks.map(task => {
                                            const st = getStatusStyle(task.status);
                                            return (
                                                <button key={task.id}
                                                    onClick={() => router.visit(route('boards.show', board.id))}
                                                    className="w-full grid grid-cols-12 gap-4 px-10 py-6 hover:bg-white/[0.03] transition-all text-left group border-b border-border/10 last:border-0 relative">
                                                    <div className="col-span-5">
                                                        <div className="bg-primary/5 w-fit px-2 py-0.5 rounded text-[8px] font-black text-primary mb-1 uppercase tracking-tighter self-start">Task UID: #{task.id}</div>
                                                        <p className="text-base font-black text-foreground group-hover:text-primary transition-colors line-clamp-1 leading-tight">{task.title}</p>
                                                    </div>
                                                    <div className="col-span-2 flex items-center">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-[10px] font-black text-muted-foreground shadow-sm">
                                                                {task.assignee ? task.assignee[0].toUpperCase() : '?'}
                                                            </div>
                                                            <span className="text-xs font-bold text-muted-foreground">{task.assignee || 'Unassigned'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="col-span-2 flex items-center justify-center">
                                                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl ${st.bg} ${st.text} border border-white/5`}>
                                                            {task.status}
                                                        </span>
                                                    </div>
                                                    <div className="col-span-2 flex items-center justify-center">
                                                        <div className="flex flex-col items-center">
                                                            <div className="flex items-center gap-2 text-rose-600 bg-rose-500/10 px-4 py-2 rounded-2xl border border-rose-500/20 shadow-sm animate-pulse-slow">
                                                                <RefreshCw size={12} className="opacity-70" />
                                                                <span className="text-lg font-black tracking-tighter">{task.reopen_count}×</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-span-1 flex items-center justify-end">
                                                        <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                                                            <ChevronRight size={18} />
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProjectDashboard;
