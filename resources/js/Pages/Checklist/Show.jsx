import React, { useState, useCallback } from 'react';
import { router, Head } from '@inertiajs/react';
import { ArrowLeft, Plus, Trash2, CheckCircle2, RefreshCw, Circle, AlertCircle, Clock, ChevronRight, Upload, X, User as UserIcon, ListPlus, ExternalLink } from 'lucide-react';
import Navbar from '../../Components/Navbar';
import Breadcrumbs from '../../Components/Breadcrumbs';

const STATUS_LIST = [
    { value: 'to do',       label: 'To Do',       pct: 0,   color: 'bg-secondary text-muted-foreground border-border/50', icon: Circle },
    { value: 'in progress', label: 'In Progress',  pct: 25,  color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',    icon: RefreshCw },
    { value: 'done dev',    label: 'Done Dev',     pct: 50,  color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20', icon: Clock },
    { value: 're open',     label: 'Re Open',      pct: 10,  color: 'bg-orange-500/10 text-orange-600 border-orange-500/20', icon: AlertCircle },
    { value: 'done',        label: 'Done',         pct: 100, color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: CheckCircle2 },
];
const STATUS_MAP = Object.fromEntries(STATUS_LIST.map(s => [s.value, s]));

const PRIORITY_MAP = {
    low:    'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    high:   'bg-orange-500/10 text-orange-600 border-orange-500/20',
    urgent: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const calcOverallProgress = (items) => {
    if (!items || items.length === 0) return 0;
    const total = items.reduce((sum, qa) => sum + (STATUS_MAP[qa.status]?.pct ?? 0), 0);
    return Math.round(total / items.length);
};

const ChecklistShow = ({ checklist, users, auth }) => {
    const boardUrl = route('boards.show', checklist.card?.card_list?.board?.id);

    // Local state so progress updates instantly when status changes
    const [qaList, setQaList] = useState(checklist.qa_details || []);
    const [newTitle, setNewTitle] = useState('');
    const [newPriority, setNewPriority] = useState('medium');
    const [newAssignedTo, setNewAssignedTo] = useState('');
    const [adding, setAdding] = useState(false);
    const [showForm, setShowForm] = useState(false);
    
    // Import state
    const [showImport, setShowImport] = useState(false);
    const [importing, setImporting] = useState(false);

    // Live overall progress based on local state
    const overallProgress = calcOverallProgress(qaList);

    const handleStatusChange = useCallback((qaId, newStatus) => {
        // Immediately update local state → progress bar updates instantly
        setQaList(prev => prev.map(qa => qa.id === qaId ? { ...qa, status: newStatus } : qa));

        // Persist to backend
        router.put(route('qa-details.update', qaId), { status: newStatus }, {
            preserveScroll: true,
            preserveState: true,
        });
    }, []);

    const handleAdd = (e) => {
        if ((e.key === 'Enter' || e.type === 'click') && newTitle.trim()) {
            e.preventDefault();
            setAdding(true);
            router.post(route('qa-details.store', checklist.id), { 
                title: newTitle, 
                priority: newPriority,
                assigned_to: newAssignedTo
            }, {
                preserveScroll: true,
                onSuccess: (page) => {
                    // Reload the page data to get the new item with id
                    setNewTitle(''); setNewPriority('medium'); setNewAssignedTo(''); setAdding(false); setShowForm(false);
                },
                onError: () => setAdding(false),
            });
        } else if (e.key === 'Escape') {
            setShowForm(false); setNewTitle('');
        }
    };

    const handleImportExcel = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImporting(true);
        const formData = new FormData();
        formData.append('file', file);

        router.post(route('import.details', checklist.id), formData, {
            onSuccess: () => {
                alert('QA Details imported successfully!');
                setShowImport(false);
                setImporting(false);
            },
            onError: (err) => {
                alert('Import Failed: ' + (err.file || 'Check format'));
                setImporting(false);
            }
        });
    };

    const handleDelete = (qaId) => {
        if (window.confirm('Hapus QA detail ini?')) {
            setQaList(prev => prev.filter(qa => qa.id !== qaId));
            router.delete(route('qa-details.destroy', qaId), { preserveScroll: true });
        }
    };

    return (
        <>
            <Head title={`QA Subtask — ${checklist.content}`} />
            <div className="min-h-screen flex flex-col">
                <Navbar user={auth?.user} />
                <div className="flex-1 mesh-gradient">
                    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">

                        <div className="flex items-center justify-between mb-6">
                            <Breadcrumbs 
                                items={[
                                    { label: checklist.card?.card_list?.board?.name, href: route('dashboard.project', checklist.card?.card_list?.board?.id) },
                                    { label: 'Kanban', href: route('boards.show', checklist.card?.card_list?.board?.id) },
                                    { label: checklist.content }
                                ]} 
                            />
                            <button 
                                onClick={() => setShowImport(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-background/50 border border-border/50 rounded-xl text-[10px] font-black text-muted-foreground hover:text-primary hover:border-primary/20 transition-all shadow-sm"
                            >
                                <Upload size={14} />
                                IMPORT QA DETAILS
                            </button>
                        </div>

                        {/* Header with Live Progress */}
                        <div className="glass-panel rounded-[2rem] border-white/40 shadow-2xl overflow-hidden mb-6">
                            <div className="px-8 py-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h1 className="text-2xl font-black tracking-tight text-foreground">{checklist.content}</h1>
                                </div>

                                <div className="mt-4 pt-4 border-t border-border/20">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Overall QA Progress</span>
                                        <span className={`text-xl font-black transition-all duration-300 ${overallProgress === 100 ? 'text-emerald-500' : 'text-primary'}`}>
                                            {overallProgress}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-secondary/60 rounded-full h-3 overflow-hidden">
                                        <div
                                            className={`h-3 rounded-full transition-all duration-500 ${overallProgress === 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                                            style={{ width: `${overallProgress}%` }}
                                        />
                                    </div>
                                    <p className="text-[9px] text-muted-foreground mt-1.5">{qaList.length} QA detail(s) — ubah status langsung di bawah untuk update progress</p>
                                </div>
                            </div>
                        </div>

                        {showImport && (
                            <div className="fixed inset-0 bg-background/40 backdrop-blur-sm z-[110] flex items-center justify-center p-6 fade-in">
                                <div className="bg-card border border-border max-w-md w-full p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
                                    <button onClick={() => setShowImport(false)} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
                                        <X size={18} />
                                    </button>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                            <Upload size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black tracking-tight">Import QA Details</h3>
                                            <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Excel mapping for subtask items</p>
                                        </div>
                                    </div>

                                    <div className="glass-panel p-5 rounded-2xl border-white/20 hover:border-primary/30 transition-all mb-6">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">QA Template</h4>
                                        <p className="text-[10px] text-muted-foreground font-medium mb-3 leading-relaxed">Download specific template for QA details.</p>
                                        <a href={route('import.detail.template')} target="_blank" className="inline-flex items-center gap-2 text-[10px] font-black text-foreground hover:text-primary transition-colors bg-secondary/50 px-3 py-1.5 rounded-lg border border-border/50">
                                            DOWNLOAD QA TEMPLATE
                                        </a>
                                    </div>

                                    <label className="relative border-2 border-dashed border-border/50 rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/[0.02] transition-all group overflow-hidden">
                                        <Upload size={24} className="text-muted-foreground mb-3 group-hover:-translate-y-1 transition-transform" />
                                        <span className="text-xs font-black text-foreground mb-1 tracking-tight">Deploy QA File</span>
                                        <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImportExcel} className="hidden" disabled={importing} />
                                        {importing && <div className="absolute inset-0 bg-background/50 flex items-center justify-center"><RefreshCw size={20} className="animate-spin text-primary" /></div>}
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* QA Detail List */}
                        <div className="space-y-3 mb-5">
                            {qaList.length === 0 && (
                                <div className="glass-panel rounded-[1.5rem] p-8 text-center text-muted-foreground text-sm">
                                    Belum ada QA detail. Klik &quot;+ New QA Detail&quot; untuk menambahkan.
                                </div>
                            )}
                            {qaList.map(qa => {
                                const st = STATUS_MAP[qa.status] || STATUS_MAP['to do'];
                                return (
                                    <div key={qa.id} className="glass-panel rounded-[1.5rem] border-white/40 shadow-lg overflow-hidden">
                                        {/* Row Header */}
                                        <div className="flex items-center gap-4 px-6 py-4 border-b border-border/20">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-bold text-foreground">{qa.title}</h3>
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${PRIORITY_MAP[qa.priority] || PRIORITY_MAP.medium}`}>
                                                        {qa.priority}
                                                    </span>
                                                </div>
                                            </div>
                                            {/* Mini progress & Assignee */}
                                            <div className="hidden md:flex items-center gap-4 w-44">
                                                <div className="flex-1 flex items-center gap-2">
                                                    <div className="flex-1 bg-secondary/60 rounded-full h-1.5 overflow-hidden">
                                                        <div
                                                            className={`h-1.5 rounded-full transition-all duration-400 ${st.pct === 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                                                            style={{ width: `${st.pct}%` }}
                                                        />
                                                    </div>
                                                    <span className={`text-[10px] font-black w-8 shrink-0 transition-colors ${st.pct === 100 ? 'text-emerald-500' : 'text-primary'}`}>{st.pct}%</span>
                                                </div>
                                                {qa.assignee ? (
                                                    <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-[9px] font-black text-primary uppercase ring-1 ring-primary/20 shrink-0" title={`Assigned to ${qa.assignee.username}`}>
                                                        {qa.assignee.username.charAt(0)}
                                                    </div>
                                                ) : (
                                                    <div className="w-6 h-6 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground/30 ring-1 ring-border shrink-0" title="Unassigned">
                                                        <UserIcon size={10} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button onClick={() => router.visit(route('qa-details.show', qa.id))}
                                                    className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all" title="Open Detail">
                                                    <ChevronRight size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(qa.id)}
                                                    className="p-2 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all">
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Inline Status Selector — updates progress live */}
                                        <div className="px-6 py-3 flex items-center gap-1.5 flex-wrap bg-background/20">
                                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mr-1 shrink-0">Status:</span>
                                            {STATUS_LIST.map(s => {
                                                const Icon = s.icon;
                                                const isActive = qa.status === s.value;
                                                return (
                                                    <button
                                                        key={s.value}
                                                        onClick={() => handleStatusChange(qa.id, s.value)}
                                                        className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-xl border transition-all
                                                            ${isActive ? s.color + ' shadow-sm' : 'bg-transparent text-muted-foreground border-border/30 hover:border-primary/30'}`}
                                                    >
                                                        <Icon size={9} />
                                                        {s.label}
                                                        <span className={`font-black ml-0.5 ${isActive ? 'opacity-80' : 'opacity-50'}`}>{s.pct}%</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Add New */}
                        {showForm ? (
                            <div className="glass-panel rounded-[1.5rem] border-white/40 shadow-lg p-6 space-y-3">
                                <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={handleAdd}
                                    placeholder="Judul QA detail baru..."
                                    className="w-full bg-background/50 border border-border rounded-2xl px-5 py-3.5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground/40"
                                />
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest shrink-0">Priority:</span>
                                    {['low', 'medium', 'high', 'urgent'].map(p => (
                                        <button key={p} type="button" onClick={() => setNewPriority(p)}
                                            className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-xl border transition-all
                                                ${newPriority === p
                                                    ? p === 'urgent' ? 'bg-red-500 text-white border-red-500'
                                                    : p === 'high' ? 'bg-orange-500 text-white border-orange-500'
                                                    : p === 'medium' ? 'bg-yellow-500 text-white border-yellow-500'
                                                    : 'bg-emerald-500 text-white border-emerald-500'
                                                    : 'bg-transparent text-muted-foreground border-border/50 hover:border-primary/30'}`}>
                                            {p}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest shrink-0">Assign To:</span>
                                    <select 
                                        value={newAssignedTo} 
                                        onChange={e => setNewAssignedTo(e.target.value)}
                                        className="flex-1 bg-background/50 border border-border rounded-xl px-3 py-2 text-[10px] font-bold focus:outline-none focus:border-primary transition-all text-foreground"
                                    >
                                        <option value="">Unassigned</option>
                                        {users?.map(u => (
                                            <option key={u.id} value={u.id}>{u.username}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleAdd} disabled={adding || !newTitle.trim()}
                                        className="btn btn-primary flex-1 text-[11px] font-black py-2.5 h-auto rounded-2xl">
                                        {adding ? 'Adding...' : '+ ADD QA DETAIL'}
                                    </button>
                                    <button onClick={() => { setShowForm(false); setNewTitle(''); }}
                                        className="px-4 py-2.5 rounded-2xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-all text-[11px] font-black border border-border/50">
                                        CANCEL
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button onClick={() => setShowForm(true)}
                                className="w-full py-4 border-2 border-dashed border-border/50 rounded-2xl flex items-center justify-center gap-2 text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-background/50 transition-all text-[11px] font-black uppercase tracking-widest">
                                <Plus size={16} />
                                New QA Detail
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default ChecklistShow;
