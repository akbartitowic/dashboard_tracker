import React, { useState, useMemo } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import { 
    ArrowLeft, 
    Search, 
    Plus, 
    List as ListIcon, 
    Layers, 
    Database, 
    CheckCircle2, 
    RefreshCw, 
    ExternalLink, 
    X,
    Filter,
    Users,
    ChevronDown,
    Activity
} from 'lucide-react';
import Navbar from '../../Components/Navbar';
import Breadcrumbs from '../../Components/Breadcrumbs';

const STATUS_COLORS = {
    'to do':         { bg: 'bg-secondary', text: 'text-muted-foreground', bar: '#94a3b8' },
    'todo':          { bg: 'bg-secondary', text: 'text-muted-foreground', bar: '#94a3b8' },
    'in progress':   { bg: 'bg-blue-500/10', text: 'text-blue-600', bar: '#3b82f6' },
    'inprogress':    { bg: 'bg-blue-500/10', text: 'text-blue-600', bar: '#3b82f6' },
    'done dev':      { bg: 'bg-indigo-500/10', text: 'text-indigo-600', bar: '#6366f1' },
    'ready to test': { bg: 'bg-cyan-500/10', text: 'text-cyan-600', bar: '#06b6d4' },
    're open':       { bg: 'bg-orange-500/10', text: 'text-orange-600', bar: '#f97316' },
    'done':          { bg: 'bg-emerald-500/10', text: 'text-emerald-600', bar: '#10b981' },
};

const getStatusStyle = (name) => STATUS_COLORS[name?.toLowerCase()] || { bg: 'bg-secondary', text: 'text-muted-foreground', bar: '#94a3b8' };

const ProjectItems = ({ auth, board, type, items, users }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showAddForm, setShowAddForm] = useState(false);
    
    // Add Form States
    const [newTitle, setNewTitle] = useState('');
    const [newParentId, setNewParentId] = useState(''); // card_list_id for task, card_id for subtask, checklist_id for detail
    const [newGrandParentId, setNewGrandParentId] = useState(''); // card_id for detail
    const [newAssignedTo, setNewAssignedTo] = useState('');
    const [newPriority, setNewPriority] = useState('medium');
    const [submitting, setSubmitting] = useState(false);

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch = (item.title || item.content || '').toLowerCase().includes(searchTerm.toLowerCase());
            const itemStatus = (item.status || item.root_status || '').toLowerCase();
            const matchesStatus = filterStatus === 'all' || itemStatus === filterStatus;
            return matchesSearch && matchesStatus;
        });
    }, [items, searchTerm, filterStatus]);

    const titleMap = {
        tasks: 'Project Tasks',
        subtasks: 'Project Subtasks',
        details: 'Project QA Details',
        resolved: 'Resolved Tasks',
        instability: 'Instability (Reopens)'
    };

    const iconMap = {
        tasks: ListIcon,
        subtasks: Layers,
        details: Database,
        resolved: CheckCircle2,
        instability: RefreshCw
    };

    const Icon = iconMap[type] || ListIcon;

    const handleAdd = (e) => {
        e.preventDefault();
        if (!newTitle.trim() || !newParentId) return;

        setSubmitting(true);
        
        let url = '';
        let payload = {};

        if (type === 'tasks' || type === 'resolved' || type === 'instability') {
            url = route('cards.store', newParentId);
            payload = { title: newTitle, assigned_to: newAssignedTo, priority: newPriority };
        } else if (type === 'subtasks') {
            url = route('checklists.store', newParentId);
            payload = { content: newTitle, assigned_to: newAssignedTo, priority: newPriority };
        } else if (type === 'details') {
            url = route('qa-details.store', newParentId);
            payload = { title: newTitle, assigned_to: newAssignedTo, priority: newPriority };
        }

        router.post(url, payload, {
            onSuccess: () => {
                setNewTitle('');
                setNewParentId('');
                setNewGrandParentId('');
                setNewAssignedTo('');
                setShowAddForm(false);
                setSubmitting(false);
            },
            onError: () => setSubmitting(false)
        });
    };

    const parentOptions = useMemo(() => {
        if (type === 'tasks' || type === 'resolved' || type === 'instability') {
            return board.card_lists || [];
        } else if (type === 'subtasks') {
            return board.card_lists?.flatMap(l => l.cards || []) || [];
        } else if (type === 'details') {
            // For details, we first need card, then checklist.
            if (newGrandParentId) {
                const card = board.card_lists?.flatMap(l => l.cards || []).find(c => c.id == newGrandParentId);
                return card?.checklists || [];
            }
            return board.card_lists?.flatMap(l => l.cards || []) || [];
        }
        return [];
    }, [type, board, newGrandParentId]);

    return (
        <>
            <Head title={`${titleMap[type]} — ${board.name}`} />
            <div className="min-h-screen flex flex-col">
                <Navbar user={auth?.user} />
                <div className="flex-1 mesh-gradient overflow-x-hidden">
                    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
                        <Breadcrumbs 
                            items={[
                                { label: board.name, href: route('dashboard.project', board.id) },
                                { label: titleMap[type] }
                            ]} 
                        />

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 mt-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                                    <Icon size={28} />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black tracking-tight text-foreground">{titleMap[type]}</h1>
                                    <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">
                                        Exploration & Management • {items.length} records
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <div className="relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" size={16} />
                                    <input 
                                        type="text"
                                        placeholder="Search records..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="bg-background/50 border border-border/50 rounded-xl pl-10 pr-4 py-2 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-64 shadow-sm"
                                    />
                                </div>
                                <div className="flex items-center gap-1.5 bg-background shadow-sm border border-border/50 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                                    <Filter size={14} className="text-muted-foreground" />
                                    <select
                                        className="bg-transparent text-[11px] font-bold text-muted-foreground focus:outline-none cursor-pointer pr-1"
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                    >
                                        <option value="all">All States</option>
                                        {Object.keys(STATUS_COLORS).filter(k => !['todo', 'inprogress'].includes(k)).map(s => (
                                            <option key={s} value={s}>{s.toUpperCase()}</option>
                                        ))}
                                    </select>
                                </div>
                                <button 
                                    onClick={() => setShowAddForm(true)}
                                    className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-black text-[12px] tracking-tight shadow-lg shadow-primary/20 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all"
                                >
                                    <Plus size={16} />
                                    ADD NEW
                                </button>
                            </div>
                        </div>

                        {showAddForm && (
                            <div className="glass-panel rounded-[2rem] border-primary/30 shadow-2xl p-8 mb-8 fade-in relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
                                        <Plus size={20} className="text-primary" />
                                        Input New {type.slice(0, -1)}
                                    </h3>
                                    <button onClick={() => setShowAddForm(false)} className="p-2 hover:bg-secondary rounded-lg transition-colors">
                                        <X size={20} className="text-muted-foreground" />
                                    </button>
                                </div>
                                <form onSubmit={handleAdd} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Title / Content</label>
                                            <input 
                                                required
                                                value={newTitle}
                                                onChange={e => setNewTitle(e.target.value)}
                                                placeholder={`Enter ${type.slice(0, -1)} title...`}
                                                className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary/5 transition-all"
                                            />
                                        </div>
                                        
                                        {type === 'details' ? (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Parent Task</label>
                                                    <select 
                                                        required
                                                        value={newGrandParentId}
                                                        onChange={e => {setNewGrandParentId(e.target.value); setNewParentId('');}}
                                                        className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary/5 transition-all"
                                                    >
                                                        <option value="">Select Task</option>
                                                        {board.card_lists?.flatMap(l => l.cards || []).map(c => (
                                                            <option key={c.id} value={c.id}>{c.title}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Parent Subtask</label>
                                                    <select 
                                                        required
                                                        disabled={!newGrandParentId}
                                                        value={newParentId}
                                                        onChange={e => setNewParentId(e.target.value)}
                                                        className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary/5 transition-all"
                                                    >
                                                        <option value="">Select Subtask</option>
                                                        {parentOptions.map(p => (
                                                            <option key={p.id} value={p.id}>{p.content}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                                                    {type === 'subtasks' ? 'Parent Task' : 'Parent Section'}
                                                </label>
                                                <select 
                                                    required
                                                    value={newParentId}
                                                    onChange={e => setNewParentId(e.target.value)}
                                                    className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary/5 transition-all"
                                                >
                                                    <option value="">Select Parent</option>
                                                    {parentOptions.map(p => (
                                                        <option key={p.id} value={p.id}>{p.name || p.title}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Assign User</label>
                                            <div className="relative">
                                                <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                                <select 
                                                    value={newAssignedTo}
                                                    onChange={e => setNewAssignedTo(e.target.value)}
                                                    className="w-full bg-background/50 border border-border rounded-xl pl-10 pr-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary/5 transition-all appearance-none"
                                                >
                                                    <option value="">Unassigned</option>
                                                    {users.map(u => (
                                                        <option key={u.id} value={u.id}>{u.username}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Priority</label>
                                            <div className="flex gap-2">
                                                {['low', 'medium', 'high', 'urgent'].map(p => (
                                                    <button 
                                                        key={p}
                                                        type="button"
                                                        onClick={() => setNewPriority(p)}
                                                        className={`flex-1 py-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${newPriority === p ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-background hover:bg-secondary border-border'}`}
                                                    >
                                                        {p}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-end gap-3 pt-4">
                                        <button type="button" onClick={() => setShowAddForm(false)} className="px-6 py-3 text-[11px] font-black text-muted-foreground hover:text-foreground transition-all">DISCARD</button>
                                        <button 
                                            disabled={submitting}
                                            className="bg-primary text-white px-10 py-3 rounded-xl font-black text-[11px] tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            {submitting ? 'PROCESS...' : 'SUBMIT DATA'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div className="glass-panel rounded-[2.5rem] border-white/40 shadow-2xl overflow-hidden mb-8">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-muted/10 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-white/5">
                                            <th className="px-8 py-5">UID</th>
                                            <th className="px-8 py-5">{type.includes('detail') ? 'QA Title' : 'Item Name'}</th>
                                            <th className="px-8 py-5">Hierarchy / Parent</th>
                                            <th className="px-8 py-5">Status</th>
                                            <th className="px-8 py-5">PIC / Assignee</th>
                                            <th className="px-8 py-5 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredItems.length > 0 ? filteredItems.map(item => {
                                            const st = getStatusStyle(item.status || item.root_status || 'todo');
                                            return (
                                                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                                                    <td className="px-8 py-6">
                                                        <span className="text-[10px] font-black text-muted-foreground/50">#{item.id}</span>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <p className="text-sm font-black text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                                            {item.title || item.content}
                                                        </p>
                                                        {item.reopen_count > 0 && (
                                                            <div className="flex items-center gap-1 text-rose-500 mt-1">
                                                                <RefreshCw size={10} />
                                                                <span className="text-[8px] font-black uppercase tracking-tighter">{item.reopen_count} reopens</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="text-[10px] font-bold text-muted-foreground line-clamp-1 max-w-[200px]">
                                                                {item.card_title || board.name}
                                                            </span>
                                                            {item.checklist_title && (
                                                                <span className="text-[9px] font-medium text-muted-foreground/60 italic line-clamp-1 max-w-[180px]">
                                                                    ↳ Subtask: {item.checklist_title}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className={`inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/5 ${st.bg} ${st.text}`}>
                                                            {item.status || item.root_status || 'UNKNOWN'}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        {item.assignee_name || item.pic_name ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary uppercase border border-primary/20">
                                                                    {(item.assignee_name || item.pic_name)[0]}
                                                                </div>
                                                                <span className="text-xs font-bold text-foreground/80">{item.assignee_name || item.pic_name}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground/30 italic">Unassigned</span>
                                                        )}
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <button 
                                                            onClick={() => {
                                                                if (type === 'details') router.visit(route('qa-details.show', item.id));
                                                                else if (type === 'subtasks') router.visit(route('checklists.show', item.id));
                                                                else router.visit(route('boards.show', board.id));
                                                            }}
                                                            className="p-2.5 bg-secondary/50 rounded-xl text-muted-foreground hover:bg-primary hover:text-white transition-all shadow-sm"
                                                        >
                                                            <ExternalLink size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        }) : (
                                            <tr>
                                                <td colSpan="6" className="px-8 py-20 text-center">
                                                    <div className="flex flex-col items-center justify-center opacity-30">
                                                        <Activity size={48} className="text-muted-foreground mb-4" />
                                                        <p className="text-sm font-black uppercase tracking-widest">No matching records found</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProjectItems;
