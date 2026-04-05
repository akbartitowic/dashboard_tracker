import React, { useState, useEffect } from 'react';
import { X, Layout, Users, Clock, Trash2, CheckCircle2, Circle, AlertCircle, ListPlus, Flag, ExternalLink, Move } from 'lucide-react';
import { router, Link } from '@inertiajs/react';
import MoveModal from './MoveModal';

const CardModal = ({ card, listId, onClose, onSave, onDelete, users, readOnly, permissions, auth, board }) => {
    const isAdmin = auth?.user?.role === 'admin';
    const canSubtaskManage = isAdmin || !!permissions?.subtask_manage;
    const canCardDelete = isAdmin || !!permissions?.card_delete;
    const [formData, setFormData] = useState({
        title: card?.title || '',
        description: card?.description || '',
        assigned_to: card?.assigned_to || '',
        due_date: card?.due_date ? new Date(card.due_date).toISOString().split('T')[0] : '',
        card_list_id: card?.card_list_id || listId,
        priority: card?.priority || 'medium',
        position: card?.position || 0
    });

    const lists = board?.card_lists || [];
    
    const [loading, setLoading] = useState(false);
    
    // Checklist State
    const [subtaskContent, setSubtaskContent] = useState('');
    const [subtaskPriority, setSubtaskPriority] = useState('medium');
    const [subtaskAssignedTo, setSubtaskAssignedTo] = useState('');
    const [subtaskLoading, setSubtaskLoading] = useState(false);

    const [movingSubtask, setMovingSubtask] = useState(null);

    const checklists = card?.checklists || [];

    const handleChange = (e) => {
        if (readOnly) return;
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (readOnly) return;
        setLoading(true);

        const payload = {
            ...formData,
            assigned_to: formData.assigned_to || null
        };

        if (card?.id) {
            router.put(route('cards.update', card.id), payload, {
                onSuccess: () => {
                    setLoading(false);
                    onSave();
                },
                onError: (err) => {
                    setLoading(false);
                    alert(Object.values(err).flat().join('\n'));
                }
            });
        } else {
            router.post(route('cards.store', payload.card_list_id), payload, {
                onSuccess: () => {
                    setLoading(false);
                    onSave();
                },
                onError: (err) => {
                    setLoading(false);
                    alert(Object.values(err).flat().join('\n'));
                }
            });
        }
    };

    const handleDelete = () => {
        if (readOnly) return;
        if (!window.confirm('Are you sure you want to delete this card?')) return;
        setLoading(true);
        router.delete(route('cards.destroy', card.id), {
            onSuccess: () => {
                setLoading(false);
                onDelete();
            },
            onError: () => setLoading(false)
        });
    };

    const handleAddSubtask = (e) => {
        if (!canSubtaskManage) return;
        if (e.key === 'Enter' || e.type === 'click') {
            e.preventDefault();
            if (!subtaskContent.trim() || !card?.id) return;
            setSubtaskLoading(true);
            router.post(route('checklists.store', card.id), { 
                content: subtaskContent, 
                priority: subtaskPriority,
                assigned_to: subtaskAssignedTo || null 
            }, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setSubtaskContent('');
                    setSubtaskPriority('medium');
                    setSubtaskAssignedTo('');
                    setSubtaskLoading(false);
                },
                onError: () => setSubtaskLoading(false)
            });
        }
    };

    const handleUpdateSubtaskStatus = (checklistId, newStatus) => {
        if (!canSubtaskManage) return;
        router.put(route('checklists.update', checklistId), { status: newStatus }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleDeleteSubtask = (checklistId) => {
        if (!canSubtaskManage) return;
        if (!window.confirm('Hapus subtask ini?')) return;
        router.delete(route('checklists.destroy', checklistId), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleMoveSubtask = (targetCardId, assignedToId) => {
        if (!canSubtaskManage) return;
        if (!movingSubtask) return;
        router.put(route('checklists.move', movingSubtask.id), { 
            card_id: targetCardId,
            assigned_to: assignedToId
        }, {
            onSuccess: () => {
                setMovingSubtask(null);
                onSave(); // Refresh data
            },
            onError: (err) => alert(err.assigned_to || err.card_id || 'Failed to move subtask')
        });
    };

    return (
        <div className="fixed inset-0 bg-background/20 backdrop-blur-md z-[100] flex items-center justify-center p-6 fade-in">
            <form 
                onSubmit={handleSubmit}
                className="glass-panel max-w-2xl w-full rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] scale-in border-white/40"
            >
                <header className="px-10 py-8 border-b border-border/50 flex items-center justify-between bg-background/20">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                            <Layout size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tight text-foreground">
                                {card ? 'Task Details' : 'New Task'}
                                {readOnly && <span className="ml-3 text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-lg border border-border">Read Only</span>}
                            </h2>
                            <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">
                                Workspace Infrastructure / Board
                            </p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="p-3 text-muted-foreground hover:text-foreground transition-all hover:bg-secondary rounded-2xl border border-transparent hover:border-border/50">
                        <X size={20} />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-thin">
                    <div className="space-y-2.5">
                        <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Title</label>
                        <input
                            required
                            name="title"
                            readOnly={readOnly}
                            className={`w-full bg-background/50 border border-border rounded-2xl px-5 py-4 text-base font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all shadow-sm ${readOnly ? 'cursor-default' : ''}`}
                            placeholder="e.g. Implement JWT Authentication"
                            value={formData.title}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="space-y-2.5">
                        <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Context & Details</label>
                        <textarea
                            name="description"
                            readOnly={readOnly}
                            className={`w-full bg-background/50 border border-border rounded-2xl px-5 py-4 text-sm font-medium min-h-[160px] focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all resize-none leading-relaxed shadow-sm ${readOnly ? 'cursor-default' : ''}`}
                            placeholder="Describe the objective and any requirements..."
                            value={formData.description}
                            onChange={handleChange}
                        ></textarea>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2.5">
                            <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Users size={14} className="text-primary" />
                                Assigned Member
                            </label>
                            <select
                                name="assigned_to"
                                disabled={readOnly}
                                className={`w-full bg-background/50 border border-border rounded-2xl px-5 py-3.5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all shadow-sm appearance-none ${readOnly ? 'cursor-default opacity-70' : 'cursor-pointer'}`}
                                value={formData.assigned_to || ''}
                                onChange={handleChange}
                            >
                                <option value="">Unassigned</option>
                                {users?.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                            </select>
                        </div>
                        {!card?.id && !readOnly && (
                            <div className="space-y-2.5">
                                <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <Layout size={14} className="text-primary" />
                                    Starting Status (Section)
                                </label>
                                <select
                                    name="card_list_id"
                                    className="w-full bg-background/50 border border-border rounded-2xl px-5 py-3.5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all shadow-sm appearance-none cursor-pointer"
                                    value={formData.card_list_id}
                                    onChange={handleChange}
                                >
                                    {lists.map(l => (
                                        <option key={l.id} value={l.id}>
                                            {l.name.charAt(0).toUpperCase() + l.name.slice(1).replace('-', ' ')}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="space-y-2.5">
                            <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Clock size={14} className="text-primary" />
                                Target Deadline
                            </label>
                            <input
                                type="date"
                                name="due_date"
                                readOnly={readOnly}
                                className={`w-full bg-background/50 border border-border rounded-2xl px-5 py-3.5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all shadow-sm ${readOnly ? 'cursor-default' : ''}`}
                                value={formData.due_date}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Priority Section for Task */}
                    <div className="space-y-2.5">
                        <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Flag size={14} className="text-primary" />
                            Priority Level
                        </label>
                        <div className="flex items-center gap-2">
                            {['low', 'medium', 'high', 'urgent'].map(level => (
                                <button
                                    key={level}
                                    type="button"
                                    onClick={() => !readOnly && setFormData(prev => ({ ...prev, priority: level }))}
                                    className={`flex-1 py-2 px-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all
                                        ${formData.priority === level
                                            ? level === 'urgent' ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/30'
                                            : level === 'high' ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/30'
                                            : level === 'medium' ? 'bg-yellow-500 text-white border-yellow-500 shadow-lg shadow-yellow-500/30'
                                            : 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/30'
                                            : 'bg-background/50 text-muted-foreground border-border hover:border-primary/40 hover:bg-primary/5'
                                        }
                                        ${readOnly && formData.priority !== level ? 'opacity-30' : ''}
                                        ${readOnly ? 'cursor-default' : ''}`
                                    }
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Subtasks Section */}
                    {card?.id && (
                        <div className="space-y-4 pt-4 border-t border-border/50">
                            <div className="flex items-center justify-between">
                                <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <CheckCircle2 size={14} className="text-primary" />
                                    Subtasks Tracker ({checklists.length})
                                </label>
                                {checklists.length > 0 && (() => {
                                    const STATUS_PCT = { 'to do': 0, 'in progress': 25, 'done dev': 50, 'ready to test': 75, 're open': 10, 'done': 100 };
                                    const overallPct = Math.round(
                                        checklists.reduce((sum, chk) => {
                                            const qas = chk.qa_details || [];
                                            if (qas.length === 0) return sum + (STATUS_PCT[chk.status] ?? 0);
                                            const subPct = qas.reduce((s, qa) => s + (STATUS_PCT[qa.status] ?? 0), 0) / qas.length;
                                            return sum + subPct;
                                        }, 0) / checklists.length
                                    );
                                    return (
                                        <div className="flex items-center gap-2">
                                            <div className="w-20 bg-secondary/60 rounded-full h-1.5 overflow-hidden">
                                                <div className={`h-1.5 rounded-full transition-all duration-500 ${overallPct === 100 ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${overallPct}%` }} />
                                            </div>
                                            <span className={`text-[10px] font-black ${overallPct === 100 ? 'text-emerald-500' : 'text-primary'}`}>{overallPct}%</span>
                                        </div>
                                    );
                                })()}
                            </div>
                            
                            <div className="space-y-2">
                                {checklists.map(chk => (
                                    <div key={chk.id} className="group flex flex-col md:flex-row md:items-center gap-3 p-3 rounded-2xl border border-border/50 bg-background/30 hover:bg-background/80 transition-all">
                                        <div className="flex flex-col gap-1.5 shrink-0">
                                            <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border
                                                ${chk.priority === 'urgent' ? 'bg-red-500/10 text-red-600 border-red-500/20' : 
                                                chk.priority === 'high' ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' : 
                                                chk.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' : 
                                                'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'}`}>
                                                {chk.priority || 'medium'}
                                            </span>
                                            {/* Subtask Assignee Initials */}
                                            {chk.assignee && (
                                                <div 
                                                    className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[7px] font-black border border-primary/20"
                                                    title={`Assigned to ${chk.assignee.username}`}
                                                >
                                                    {chk.assignee.username.substring(0, 2).toUpperCase()}
                                                </div>
                                            )}
                                            {/* Per-subtask progress bar based on QA details */}
                                            {(() => {
                                                const STATUS_PCT = { 'to do': 0, 'in progress': 25, 'done dev': 50, 'ready to test': 75, 're open': 10, 'done': 100 };
                                                const qas = chk.qa_details || [];
                                                const pct = qas.length === 0
                                                    ? (chk.status === 'done' ? 100 : 0)
                                                    : Math.round(qas.reduce((s, qa) => s + (STATUS_PCT[qa.status] ?? 0), 0) / qas.length);
                                                return (
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-14 bg-secondary/60 rounded-full h-1 overflow-hidden">
                                                            <div className={`h-1 rounded-full transition-all duration-500 ${pct === 100 ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
                                                        </div>
                                                        <span className={`text-[8px] font-black ${pct === 100 ? 'text-emerald-500' : 'text-primary'}`}>{pct}%</span>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <button
                                                type="button"
                                                onClick={() => router.visit(route('checklists.show', chk.id))}
                                                className={`text-left text-sm font-medium truncate block w-full hover:text-primary transition-colors ${chk.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                                            >
                                                {chk.content}
                                            </button>
                                            {(chk.expected_result || chk.steps_to_reproduce || chk.image_url || chk.error_url) && (
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    {chk.expected_result && <span className="text-[8px] bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded font-bold">Expected ✓</span>}
                                                    {chk.steps_to_reproduce && <span className="text-[8px] bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded font-bold">Steps ✓</span>}
                                                    {chk.image_url && <span className="text-[8px] bg-purple-500/10 text-purple-600 px-1.5 py-0.5 rounded font-bold">Image ✓</span>}
                                                    {chk.error_url && <span className="text-[8px] bg-orange-500/10 text-orange-600 px-1.5 py-0.5 rounded font-bold">URL ✓</span>}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <select 
                                                value={chk.status}
                                                disabled={!canSubtaskManage}
                                                onChange={(e) => handleUpdateSubtaskStatus(chk.id, e.target.value)}
                                                className={`text-[10px] font-black uppercase tracking-widest px-2 py-1.5 rounded-lg border appearance-none outline-none transition-colors
                                                    ${chk.status === 'done' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                                                    chk.status === 'ready to test' ? 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' : 
                                                    chk.status === 're open' ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' : 
                                                    chk.status === 'in progress' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : 
                                                    'bg-secondary text-muted-foreground border-border/50 hover:bg-secondary/80'}
                                                    ${!canSubtaskManage ? 'cursor-default' : 'cursor-pointer'}`}
                                            >
                                                <option value="to do">To Do</option>
                                                <option value="in progress">In Progress</option>
                                                <option value="ready to test">Ready to Test</option>
                                                <option value="re open">Re Open</option>
                                                <option value="done">Done</option>
                                            </select>
                                            {canSubtaskManage && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => setMovingSubtask(chk)}
                                                    className="p-1.5 text-muted-foreground/50 hover:text-orange-500 hover:bg-orange-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Move Subtask"
                                                >
                                                    <Move size={13} />
                                                </button>
                                            )}
                                            <button 
                                                type="button" 
                                                onClick={() => router.visit(route('checklists.show', chk.id))}
                                                className={`p-1.5 text-muted-foreground/50 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors ${readOnly ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                                title="Open QA Detail"
                                            >
                                                <ExternalLink size={13} />
                                            </button>
                                            {canSubtaskManage && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => handleDeleteSubtask(chk.id)}
                                                    className="p-1.5 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                
                                {!readOnly && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="flex items-center gap-1 shrink-0">
                                            {['low', 'medium', 'high', 'urgent'].map(level => (
                                                <button
                                                    key={level}
                                                    type="button"
                                                    onClick={() => setSubtaskPriority(level)}
                                                    className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border transition-all
                                                        ${subtaskPriority === level
                                                            ? level === 'urgent' ? 'bg-red-500 text-white border-red-500'
                                                            : level === 'high' ? 'bg-orange-500 text-white border-orange-500'
                                                            : level === 'medium' ? 'bg-yellow-500 text-white border-yellow-500'
                                                            : 'bg-emerald-500 text-white border-emerald-500'
                                                            : 'bg-transparent text-muted-foreground border-border/50 hover:border-primary/30'
                                                        }`
                                                    }
                                                >
                                                    {level.charAt(0)}
                                                </button>
                                            ))}
                                        </div>
                                        <select
                                            value={subtaskAssignedTo}
                                            onChange={(e) => setSubtaskAssignedTo(e.target.value)}
                                            disabled={subtaskLoading}
                                            className="text-[10px] bg-background/50 border border-border rounded-lg px-2 py-1.5 font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                                        >
                                            <option value="">User</option>
                                            {users?.map(u => <option key={u.id} value={u.id}>{u.username.substring(0, 8)}</option>)}
                                        </select>
                                        <input
                                            type="text"
                                            placeholder="Add subtask..."
                                            value={subtaskContent}
                                            onChange={(e) => setSubtaskContent(e.target.value)}
                                            onKeyDown={handleAddSubtask}
                                            disabled={subtaskLoading}
                                            className="flex-1 bg-transparent border-b border-border/50 px-2 py-2 text-sm focus:outline-none focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground/50"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddSubtask}
                                            disabled={!subtaskContent.trim() || subtaskLoading}
                                            className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-all disabled:opacity-50"
                                        >
                                            <ListPlus size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <footer className="px-10 py-8 bg-background/40 border-t border-border/50 flex items-center justify-between">
                    <div>
                        {card?.id && canCardDelete && (
                            <button 
                                type="button"
                                onClick={handleDelete}
                                className="flex items-center gap-2 text-[10px] font-black text-destructive hover:bg-destructive/10 px-5 py-2.5 rounded-xl transition-all uppercase tracking-widest border border-transparent hover:border-destructive/20"
                            >
                                <Trash2 size={14} />
                                Remove Task
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <button type="button" onClick={onClose} className="px-6 py-3 text-[11px] font-black text-muted-foreground hover:text-foreground transition-all uppercase tracking-widest">{readOnly ? 'Close' : 'Discard'}</button>
                        {!readOnly && (
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="btn btn-primary px-10 py-4 h-auto rounded-[1.25rem] text-[11px] font-black tracking-widest shadow-xl shadow-primary/20"
                            >
                                {loading ? (
                                    <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                ) : (
                                    card?.id ? 'UPDATE TASK' : 'CREATE TASK'
                                )}
                            </button>
                        )}
                    </div>
                </footer>
            </form>

            <MoveModal 
                isOpen={!!movingSubtask}
                onClose={() => setMovingSubtask(null)}
                onMove={handleMoveSubtask}
                currentData={movingSubtask}
                users={users}
                targetLevel="card"
                title="Move Subtask to Another Task"
            />
        </div>
    );
};

export default CardModal;
