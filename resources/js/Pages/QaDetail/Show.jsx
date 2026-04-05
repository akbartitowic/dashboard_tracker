import React, { useState } from 'react';
import { router, Head } from '@inertiajs/react';
import { ArrowLeft, Save, CheckCircle2, RefreshCw, Circle, AlertCircle, Clock, ExternalLink, Image, FileText, ListChecks, Move, Users as UserIcon, CheckSquare } from 'lucide-react';
import Navbar from '../../Components/Navbar';
import Breadcrumbs from '../../Components/Breadcrumbs';
import MoveModal from '../../Components/MoveModal';

const STATUSES = [
    { value: 'to do',       label: 'To Do',         pct: 0,   color: 'bg-secondary text-muted-foreground border-border/50', icon: Circle },
    { value: 'in progress', label: 'In Progress',   pct: 25,  color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',    icon: RefreshCw },
    { value: 'done dev',    label: 'Done Dev',      pct: 50,  color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20', icon: Clock },
    { value: 'ready to test', label: 'Ready to Test', pct: 75, color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20', icon: CheckSquare },
    { value: 're open',     label: 'Re Open',       pct: 10,  color: 'bg-orange-500/10 text-orange-600 border-orange-500/20', icon: AlertCircle },
    { value: 'done',        label: 'Done',          pct: 100, color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: CheckCircle2 },
];

const PRIORITIES = [
    { value: 'low',    label: 'Low',    color: 'bg-emerald-500 text-white border-emerald-500' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-500 text-white border-yellow-500' },
    { value: 'high',   label: 'High',   color: 'bg-orange-500 text-white border-orange-500' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-500 text-white border-red-500' },
];

const getFieldProgress = (form) => {
    const st = STATUSES.find(s => s.value === form.status) || STATUSES[0];
    const fields = [form.expected_result, form.steps_to_reproduce, form.image_url, form.error_url];
    const filled = fields.filter(f => f && f.trim() !== '').length;
    if (form.status === 'done') return 100;
    // status value contributes up to 60%, fields contribute up to 40%
    return Math.min(100, Math.round(st.pct * 0.6 + (filled / 4) * 40));
};

const QaDetailShow = ({ qaDetail, users, auth }) => {
    const [form, setForm] = useState({
        title: qaDetail.title || '',
        status: qaDetail.status || 'to do',
        priority: qaDetail.priority || 'medium',
        assigned_to: qaDetail.assigned_to || '',
        expected_result: qaDetail.expected_result || '',
        steps_to_reproduce: qaDetail.steps_to_reproduce || '',
        image_url: qaDetail.image_url || '',
        error_url: qaDetail.error_url || '',
    });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showMoveModal, setShowMoveModal] = useState(false);

    const checklistUrl = route('checklists.show', qaDetail.checklist_id);
    const progress = getFieldProgress(form);
    const currentStatus = STATUSES.find(s => s.value === form.status) || STATUSES[0];

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setSaved(false);
    };

    const handleSave = (e) => {
        e.preventDefault();
        setSaving(true);
        router.put(route('qa-details.update', qaDetail.id), form, {
            preserveScroll: true,
            onSuccess: () => { setSaving(false); setSaved(true); },
            onError: () => setSaving(false),
        });
    };

    const handleMove = (targetChecklistId, assignedToId) => {
        router.put(route('qa-details.move', qaDetail.id), { 
            checklist_id: targetChecklistId,
            assigned_to: assignedToId
        }, {
            onSuccess: () => {
                alert('Detail Subtask moved successfully!');
                setShowMoveModal(false);
            },
            onError: (err) => alert(err.assigned_to || err.checklist_id || 'Failed to move detail subtask')
        });
    };

    return (
        <>
            <Head title={`QA — ${form.title}`} />
            <div className="min-h-screen flex flex-col">
                <Navbar user={auth?.user} />
                <div className="flex-1 mesh-gradient">
                    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">

                        {/* Breadcrumb & Actions */}
                        <div className="flex items-center justify-between mb-6">
                            <Breadcrumbs 
                                items={[
                                    { label: qaDetail.checklist?.card?.card_list?.board?.name, href: route('dashboard.project', qaDetail.checklist?.card?.card_list?.board?.id) },
                                    { label: 'Kanban', href: route('boards.show', qaDetail.checklist?.card?.card_list?.board?.id) },
                                    { label: qaDetail.checklist?.content, href: route('checklists.show', qaDetail.checklist_id) },
                                    { label: form.title }
                                ]} 
                            />

                            <button 
                                onClick={() => setShowMoveModal(true)}
                                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-orange-500/10 text-orange-600 border border-orange-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-orange-500/20 transition-all"
                            >
                                <Move size={12} />
                                Move Subtask
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-6">
                            {/* Header */}
                            <div className="glass-panel rounded-[2rem] border-white/40 shadow-2xl overflow-hidden">
                                <div className="px-8 py-6 border-b border-border/30 bg-background/30">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">
                                        {qaDetail.checklist?.card?.card_list?.board?.name} / {qaDetail.checklist?.card?.title} / {qaDetail.checklist?.content}
                                    </p>
                                    <input
                                        name="title"
                                        value={form.title}
                                        onChange={handleChange}
                                        placeholder="QA Detail title..."
                                        className="w-full text-2xl font-black tracking-tight bg-transparent border-none focus:outline-none text-foreground placeholder:text-muted-foreground/40"
                                    />

                                    {/* Priority */}
                                    <div className="flex items-center gap-2 mt-4 flex-wrap">
                                        {PRIORITIES.map(p => (
                                            <button key={p.value} type="button"
                                                onClick={() => { setForm(prev => ({...prev, priority: p.value})); setSaved(false); }}
                                                className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border transition-all ${form.priority === p.value ? p.color : 'bg-transparent text-muted-foreground border-border/50 hover:border-primary/30'}`}>
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Status */}
                                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                                        {STATUSES.map(s => {
                                            const Icon = s.icon;
                                            return (
                                                <button key={s.value} type="button"
                                                    onClick={() => { setForm(prev => ({...prev, status: s.value})); setSaved(false); }}
                                                    className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border transition-all ${form.status === s.value ? s.color + ' ring-2 ring-offset-1 ring-current/20' : 'bg-transparent text-muted-foreground border-border/50 hover:border-primary/30'}`}>
                                                    <Icon size={11} />
                                                    {s.label}
                                                    <span className="ml-1 font-black opacity-70">{s.pct}%</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Assignee Section */}
                                <div className="px-8 py-5 border-b border-border/20 bg-background/20">
                                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                                        <div className="flex-1 space-y-2">
                                            <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
                                                <UserIcon size={14} className="text-primary" />
                                                Assigned Member
                                            </label>
                                            <select
                                                name="assigned_to"
                                                className="w-full bg-background/50 border border-border rounded-2xl px-5 py-3.5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all cursor-pointer shadow-sm appearance-none"
                                                value={form.assigned_to || ''}
                                                onChange={handleChange}
                                            >
                                                <option value="">Unassigned</option>
                                                {users?.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                                            </select>
                                        </div>
                                        <div className="flex-1">
                                            {/* Spacer / Additional fields if needed later */}
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="px-8 py-4 bg-background/10 border-b border-border/20">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                            <ListChecks size={12} />
                                            QA Completion Progress
                                        </span>
                                        <span className={`text-[11px] font-black ${progress === 100 ? 'text-emerald-500' : 'text-primary'}`}>{progress}%</span>
                                    </div>
                                    <div className="w-full bg-secondary/60 rounded-full h-2 overflow-hidden">
                                        <div className={`h-2 rounded-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${progress}%` }} />
                                    </div>
                                    <p className="text-[9px] text-muted-foreground mt-1.5">
                                        Status <span className="font-bold">{currentStatus.label}</span> kontribusi {currentStatus.pct}% + kelengkapan field
                                    </p>
                                </div>
                            </div>

                            {/* QA Fields */}
                            <div className="grid grid-cols-1 gap-5">
                                {/* Expected Result */}
                                <div className="glass-panel rounded-[1.5rem] border-white/40 p-6 shadow-lg">
                                    <label className="flex items-center gap-2 text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-3">
                                        <CheckCircle2 size={14} className="text-emerald-500" />
                                        Expected Result
                                    </label>
                                    <textarea name="expected_result" value={form.expected_result} onChange={handleChange}
                                        placeholder="Deskripsikan hasil yang diharapkan dari test case ini..."
                                        rows={4}
                                        className="w-full bg-background/50 border border-border rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all resize-none leading-relaxed text-foreground placeholder:text-muted-foreground/40"
                                    />
                                </div>

                                {/* Steps to Reproduce */}
                                <div className="glass-panel rounded-[1.5rem] border-white/40 p-6 shadow-lg">
                                    <label className="flex items-center gap-2 text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-3">
                                        <FileText size={14} className="text-blue-500" />
                                        Steps to Reproduce
                                    </label>
                                    <textarea name="steps_to_reproduce" value={form.steps_to_reproduce} onChange={handleChange}
                                        placeholder={"1. Buka halaman...\n2. Klik tombol...\n3. Perhatikan bahwa..."}
                                        rows={6}
                                        className="w-full bg-background/50 border border-border rounded-2xl px-5 py-4 text-sm font-mono font-medium focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all resize-none leading-relaxed text-foreground placeholder:text-muted-foreground/40"
                                    />
                                </div>

                                {/* Evidence Links */}
                                <div className="glass-panel rounded-[1.5rem] border-white/40 p-6 shadow-lg">
                                    <label className="flex items-center gap-2 text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-4">
                                        <Image size={14} className="text-purple-500" />
                                        Evidence & Links
                                    </label>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-muted-foreground/70 uppercase tracking-widest ml-1">📸 Screenshot / Image URL</label>
                                            <div className="flex items-center gap-2">
                                                <input name="image_url" value={form.image_url} onChange={handleChange}
                                                    placeholder="https://drive.google.com/... atau https://imgur.com/..."
                                                    className="flex-1 bg-background/50 border border-border rounded-2xl px-5 py-3.5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground/40"
                                                />
                                                {form.image_url && (
                                                    <a href={form.image_url} target="_blank" rel="noreferrer" className="p-3 rounded-2xl bg-primary/10 text-primary hover:bg-primary/20 transition-all shrink-0">
                                                        <ExternalLink size={14} />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-muted-foreground/70 uppercase tracking-widest ml-1">🔗 Error Page URL</label>
                                            <div className="flex items-center gap-2">
                                                <input name="error_url" value={form.error_url} onChange={handleChange}
                                                    placeholder="https://app.example.com/page-with-error"
                                                    className="flex-1 bg-background/50 border border-border rounded-2xl px-5 py-3.5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground/40"
                                                />
                                                {form.error_url && (
                                                    <a href={form.error_url} target="_blank" rel="noreferrer" className="p-3 rounded-2xl bg-primary/10 text-primary hover:bg-primary/20 transition-all shrink-0">
                                                        <ExternalLink size={14} />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between py-4">
                                <button type="button" onClick={() => router.visit(checklistUrl)} className="btn btn-ghost border border-border/50 text-muted-foreground hover:text-foreground gap-2">
                                    <ArrowLeft size={14} />
                                    Back to List
                                </button>
                                <button type="submit" disabled={saving}
                                    className="btn btn-primary gap-2 px-8 py-3 h-auto rounded-2xl text-[11px] font-black tracking-widest shadow-xl shadow-primary/20">
                                    {saving ? (
                                        <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                    ) : saved ? (
                                        <><CheckCircle2 size={14} /> SAVED!</>
                                    ) : (
                                        <><Save size={14} /> SAVE CHANGES</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <MoveModal 
                    isOpen={showMoveModal} 
                    onClose={() => setShowMoveModal(false)}
                    onMove={handleMove}
                    users={users}
                    currentData={qaDetail}
                />
            </div>
        </>
    );
};

export default QaDetailShow;
