import { useState, useEffect } from 'react';
import { Plus, X, Upload, Filter, User as UserIcon, Calendar, MessageSquare, MoreHorizontal, Trash2, LayoutGrid, List as ListIcon, CheckCircle2, RefreshCw, CheckSquare, Clock } from 'lucide-react';
import { DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { router, Head } from '@inertiajs/react';

import { arrayMove } from '@dnd-kit/sortable';
import CardModal from '../../Components/CardModal';
import ReassignModal from '../../Components/ReassignModal';
import Navbar from '../../Components/Navbar';
import Breadcrumbs from '../../Components/Breadcrumbs';

const SortableColumn = ({ list, children }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `col-${list.id}` });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 200 : 1,
    };
    return (
        <div ref={setNodeRef} style={style} className="kanban-column flex flex-col h-full fade-in">
            {children({ dragHandleProps: { ...attributes, ...listeners } })}
        </div>
    );
};

const SortableCard = ({ card, onClick }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });
    const style = { 
        transform: CSS.Transform.toString(transform), 
        transition, 
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 100 : 1
    };

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            {...attributes} 
            {...listeners} 
            onClick={() => onClick(card)} 
            className="card-item group"
        >
            <h4 className="text-[13px] font-bold tracking-tight mb-2 text-foreground group-hover:text-primary transition-colors leading-snug">{card.title}</h4>
            {card.description && (
                <p className="text-[11px] text-muted-foreground line-clamp-2 mb-3 leading-relaxed opacity-80">{card.description}</p>
            )}
            <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/10">
                <div className="flex items-center gap-2">
                    {card.assignee ? (
                        <div className="w-5 h-5 rounded-lg bg-primary/10 flex items-center justify-center text-[9px] font-black text-primary uppercase ring-1 ring-primary/20">
                            {card.assignee.username.charAt(0)}
                        </div>
                    ) : (
                        <div className="w-5 h-5 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground ring-1 ring-border">
                            <UserIcon size={10} />
                        </div>
                    )}
                    {card.due_date && (
                        <div className="text-[9px] font-bold text-muted-foreground flex items-center gap-1 bg-secondary/50 px-1.5 py-0.5 rounded-md transition-all group-hover:bg-primary/5 group-hover:text-primary/70">
                            <Calendar size={10} />
                            {new Date(card.due_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <div className="flex items-center gap-2">
                        {card.reopen_count > 0 && (
                            <div className="flex items-center gap-1 text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded-md text-[9px] font-bold">
                                <RefreshCw size={10} />
                                <span>{card.reopen_count} Reopens</span>
                            </div>
                        )}
                        {card.checklists?.length > 0 && (() => {
                            const STATUS_PCT = { 'to do': 0, 'in progress': 25, 'done dev': 50, 're open': 10, 'done': 100 };
                            const cardProgress = Math.round(
                                card.checklists.reduce((sum, chk) => {
                                    const qas = chk.qa_details || [];
                                    if (qas.length === 0) return sum + (STATUS_PCT[chk.status] ?? 0);
                                    const subtaskPct = qas.reduce((s, qa) => s + (STATUS_PCT[qa.status] ?? 0), 0) / qas.length;
                                    return sum + subtaskPct;
                                }, 0) / card.checklists.length
                            );
                            return (
                                <div className="flex items-center gap-2">
                                    <div className="w-12 bg-secondary/60 rounded-full h-1 overflow-hidden hidden md:block">
                                        <div className={`h-1 rounded-full transition-all duration-500 ${cardProgress === 100 ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${cardProgress}%` }} />
                                    </div>
                                    <div className="flex items-center gap-1 text-primary bg-primary/10 px-1.5 py-0.5 rounded-md text-[9px] font-bold">
                                        <CheckSquare size={10} />
                                        <span>{cardProgress}%</span>
                                    </div>
                                </div>
                            );
                        })()}
                        {(!card.checklists || card.checklists.length === 0) && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                                <MessageSquare size={10} />
                                <span className="text-[9px] font-bold">0</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const Board = ({ auth, board, users, permissions }) => {
    const isAdmin = auth?.user?.role === 'admin';
    const canProjectEdit = isAdmin || !!permissions?.project_edit;
    const canProjectDelete = isAdmin || !!permissions?.project_delete;
    const canSectionManage = isAdmin || !!permissions?.section_manage;
    const canCardCreate = isAdmin || !!permissions?.card_create;
    const canCardEdit = isAdmin || !!permissions?.card_edit;
    const canCardDelete = isAdmin || !!permissions?.card_delete;
    const canCardMove = isAdmin || !!permissions?.card_move;
    const canDataImport = isAdmin || !!permissions?.data_import;

    const lists = board?.card_lists || [];
    const [showImport, setShowImport] = useState(false);
    
    // Reset Data State
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetPassword, setResetPassword] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [resetError, setResetError] = useState('');

    const [filterAssignee, setFilterAssignee] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

    const getCardStatus = (card) => {
        if (!card.checklists || card.checklists.length === 0) return 'to do';
        
        const STATUS_PCT = { 'to do': 0, 'in progress': 25, 'done dev': 50, 're open': 10, 'done': 100 };
        
        let hasReopen = false;
        const totalPct = card.checklists.reduce((sum, chk) => {
            const qas = chk.qa_details || [];
            if (qas.some(qa => qa.status === 're open')) hasReopen = true;
            if (chk.status === 're open') hasReopen = true;

            if (qas.length === 0) return sum + (STATUS_PCT[chk.status] ?? 0);
            const subtaskPct = qas.reduce((s, qa) => s + (STATUS_PCT[qa.status] ?? 0), 0) / qas.length;
            return sum + subtaskPct;
        }, 0);

        const cardProgress = Math.round(totalPct / card.checklists.length);

        if (hasReopen) return 're open';
        if (cardProgress === 100) return 'done';
        if (cardProgress >= 50) return 'done dev';
        if (cardProgress > 0) return 'in progress';
        return 'to do';
    };

    const filteredCards = (listCards) => {
        let result = listCards;
        if (filterAssignee !== 'all') {
            result = result.filter(c => c.assigned_to === parseInt(filterAssignee));
        }
        if (filterStatus !== 'all') {
            result = result.filter(c => getCardStatus(c) === filterStatus);
        }
        return result;
    };
    const [showCardModal, setShowCardModal] = useState(false);
    const [editingCard, setEditingCard] = useState(null);
    const [activeListId, setActiveListId] = useState(null);
    const [dropdownListId, setDropdownListId] = useState(null);
    const [showAddSection, setShowAddSection] = useState(false);
    const [newSectionName, setNewSectionName] = useState('');

    const [reassignData, setReassignData] = useState(null);

    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editingTitle, setEditingTitle] = useState(board?.name || '');

    // Improved Import Flow States
    const [importType, setImportType] = useState('task'); // 'task', 'subtask', 'detail'
    const [selectedCardId, setSelectedCardId] = useState('');
    const [selectedChecklistId, setSelectedChecklistId] = useState('');
    const [cardChecklists, setCardChecklists] = useState([]);
    const [importLoading, setImportLoading] = useState(false);

    // Fetch Checklists when Card is selected for Detail Import
    useEffect(() => {
        if (selectedCardId && importType === 'detail') {
            fetch(route('api.card-checklists', selectedCardId))
                .then(res => res.json())
                .then(data => {
                    setCardChecklists(data);
                    setSelectedChecklistId('');
                })
                .catch(err => console.error('Failed to load checklists', err));
        }
    }, [selectedCardId, importType]);

    // Keep editing card updated when board prop changes (from Inertia visits)
    useEffect(() => {
        if (editingCard) {
            const updatedCard = board?.card_lists?.flatMap(l => l.cards).find(c => c.id === editingCard.id);
            if (updatedCard) {
                setEditingCard(updatedCard);
            }
        }
    }, [board]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleResetData = (e) => {
        e.preventDefault();
        setResetLoading(true);
        setResetError('');
        router.post(route('admin.reset'), { password: resetPassword }, {
            onSuccess: () => {
                setShowResetModal(false);
                setResetPassword('');
                alert('Data reset successfully.');
                setResetLoading(false);
            },
            onError: (err) => {
                setResetError(err.password || 'Verification failed');
                setResetLoading(false);
            }
        });
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target.result);
                router.post(route('import.trello'), json, {
                    onSuccess: () => {
                        alert('Import successful!');
                        setShowImport(false);
                    },
                    onError: () => alert('Failed to import Trello JSON')
                });
            } catch (err) {
                alert('Invalid JSON file format.');
            }
        };
        reader.readAsText(file);
    };

    const openCreateModal = (listId) => {
        setEditingCard(null);
        setActiveListId(listId);
        setShowCardModal(true);
    };

    const openEditModal = (card) => {
        setEditingCard(card);
        setActiveListId(card.card_list_id);
        setShowCardModal(true);
    };

    const handleModalSave = () => {
        setShowCardModal(false);
    };

    const findContainer = (id) => {
        if (lists.some(l => `col-${l.id}` === id)) return id;
        return lists.find(l => l.cards?.some(c => c.id === id)) ? `col-${lists.find(l => l.cards?.some(c => c.id === id)).id}` : null;
    };

    const handleDragOver = (event) => {
        const { active, over } = event;
        if (!over) return;
        
        const activeId = active.id;
        const overId = over.id;
        
        if (String(activeId).startsWith('col-')) return;

        const activeContainer = findContainer(activeId);
        const overContainer = findContainer(overId);

        if (!activeContainer || !overContainer || activeContainer === overContainer) return;
        
        // We don't necessarily need to update local state here if handleDragEnd handles it,
        // but for smooth visual multi-column sorting, we usually do.
        // For now, let's let dnd-kit handle the visuals while we save on DragEnd.
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // 1. Handle Column (List) Reorder
        if (String(activeId).startsWith('col-')) {
            if (!canSectionManage) return;
            if (activeId === overId) return;
            const oldIndex = lists.findIndex(l => `col-${l.id}` === activeId);
            const newIndex = lists.findIndex(l => `col-${l.id}` === overId);
            const reordered = arrayMove(lists, oldIndex, newIndex);
            router.post(route('card-lists.reorder', board.id), { order: reordered.map(l => l.id) }, { preserveScroll: true });
            return;
        }

        // 2. Handle Card Move/Reorder
        if (!String(activeId).startsWith('col-')) {
            if (!canCardMove) return;
            const activeContainer = findContainer(activeId);
            const overContainer = findContainer(overId);

            if (!activeContainer || !overContainer) return;

            const activeListId = parseInt(activeContainer.replace('col-', ''));
            const overListId = parseInt(overContainer.replace('col-', ''));

            const activeList = lists.find(l => l.id === activeListId);
            const overList = lists.find(l => l.id === overListId);

            if (!activeList || !overList) return;

            const activeCardIndex = activeList.cards.findIndex(c => c.id === activeId);
            
            // If dropping on a card, find its index. If dropping on a column, append to end.
            let newIndex;
            if (String(overId).startsWith('col-')) {
                newIndex = overList.cards.length;
            } else {
                newIndex = overList.cards.findIndex(c => c.id === overId);
            }

            // Persistence
            // If moving to a different list or changing position in the same list
            if (activeListId !== overListId || activeCardIndex !== newIndex) {
                const newCardsState = [...overList.cards];
                const movingCard = activeList.cards[activeCardIndex];
                
                if (activeListId === overListId) {
                    const reordered = arrayMove(newCardsState, activeCardIndex, newIndex);
                    router.post(route('cards.reorder', overListId), { 
                        cards: reordered.map((c, i) => ({ id: c.id, position: i })) 
                    }, { preserveScroll: true });
                } else {
                    // DIFFERENT LIST: Intercept for mandatory reassignment
                    setReassignData({
                        activeListId,
                        overListId,
                        activeCardIndex,
                        newIndex,
                        movingCard,
                        newCardsState
                    });
                }
            }
        }
    };

    const confirmReassign = (userId) => {
        if (!reassignData) return;
        const { overListId, newIndex, movingCard, newCardsState } = reassignData;
        
        const finalCards = [...newCardsState];
        finalCards.splice(newIndex, 0, movingCard);

        router.post(route('cards.reorder', overListId), { 
            cards: finalCards.map((c, i) => ({ 
                id: c.id, 
                position: i,
                assigned_to: c.id === movingCard.id ? userId : undefined
            }))
        }, { 
            preserveScroll: true,
            onSuccess: () => setReassignData(null)
        });
    };

    const handleRenameBoard = (e) => {
        if ((e.key === 'Enter' || e.type === 'blur') && editingTitle.trim() && editingTitle !== board.name) {
            router.put(route('boards.update', board.id), { name: editingTitle }, {
                preserveScroll: true,
                onSuccess: () => setIsEditingTitle(false),
            });
        } else if (e.key === 'Escape') {
            setEditingTitle(board.name);
            setIsEditingTitle(false);
        } else if (e.type === 'blur') {
            setEditingTitle(board.name);
            setIsEditingTitle(false);
        }
    };

    const handleAddSection = (e) => {
        if (!canSectionManage) return;
        if ((e.key === 'Enter' || e.type === 'click') && newSectionName.trim()) {
            e.preventDefault();
            router.post(route('card-lists.store', board.id), { name: newSectionName }, {
                preserveScroll: true,
                onSuccess: () => { setNewSectionName(''); setShowAddSection(false); }
            });
        } else if (e.key === 'Escape') {
            setShowAddSection(false);
            setNewSectionName('');
        }
    };

    const handleDeleteList = (listId) => {
        if (!canSectionManage) return;
        if (!window.confirm('Hapus section ini beserta semua tasksnya? Aksi ini tidak bisa dibatalkan.')) return;
        router.delete(route('card-lists.destroy', listId), {
            preserveScroll: true,
        });
    };


    return (
        <>
            <Head title={board?.name || 'Board'} />
            <div className="min-h-screen flex flex-col">
                <Navbar user={auth.user} />
                <div className="flex-1 flex flex-col mesh-gradient overflow-hidden">
                    <div className="px-6 md:px-10 pt-6 -mb-4">
                        <Breadcrumbs items={[{ label: board.name, href: route('dashboard.project', board.id) }, { label: 'Kanban Board' }]} />
                    </div>
                    <header className="px-6 md:px-10 py-5 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div>
                                {isEditingTitle && canProjectEdit ? (
                                    <input
                                        autoFocus
                                        className="text-xl font-black tracking-tight text-foreground bg-background/50 border border-primary/30 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        value={editingTitle}
                                        onChange={(e) => setEditingTitle(e.target.value)}
                                        onKeyDown={handleRenameBoard}
                                        onBlur={handleRenameBoard}
                                    />
                                ) : (
                                    <h1 
                                        onClick={() => canProjectEdit && setIsEditingTitle(true)}
                                        className={`text-xl font-black tracking-tight text-foreground flex items-center gap-2 transition-colors ${canProjectEdit ? 'cursor-pointer group/title hover:text-primary' : ''}`}
                                    >
                                        {board?.name || 'Workflow Board'}
                                        <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-lg border border-primary/20">Active</span>
                                        {canProjectEdit && <span className="opacity-0 group-hover/title:opacity-100 text-[10px] font-bold text-muted-foreground/50 transition-all ml-1 underline decoration-dotted">Rename</span>}
                                    </h1>
                                )}
                                <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{board?.description || 'Manage tasks and team progress in real-time'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 bg-background shadow-sm border border-border/50 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                                <Clock size={12} className="text-muted-foreground" />
                                <select
                                    className="bg-transparent text-[11px] font-bold text-muted-foreground focus:outline-none cursor-pointer pr-1"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                >
                                    <option value="all">All States</option>
                                    <option value="to do">To Do</option>
                                    <option value="in progress">In Progress</option>
                                    <option value="done dev">Done Dev</option>
                                    <option value="re open">Re Open</option>
                                    <option value="done">Done</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-1.5 bg-background shadow-sm border border-border/50 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                                <Filter size={12} className="text-muted-foreground" />
                                <select
                                    className="bg-transparent text-[11px] font-bold text-muted-foreground focus:outline-none cursor-pointer pr-1"
                                    value={filterAssignee}
                                    onChange={(e) => setFilterAssignee(e.target.value)}
                                >
                                    <option value="all">All Members</option>
                                    {users?.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                                </select>
                            </div>
                            {auth.user?.role === 'admin' && (
                                <button 
                                    onClick={() => setShowResetModal(true)} 
                                    className="btn btn-ghost text-destructive hover:bg-destructive/10 border border-destructive/20 gap-2"
                                >
                                    <Trash2 size={14} />
                                    Reset System
                                </button>
                            )}
                            <div className="flex items-center gap-1.5 bg-background shadow-sm border border-border/50 rounded-xl p-1 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                                <button 
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-secondary text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'}`}
                                    title="Kanban View"
                                >
                                    <LayoutGrid size={14} />
                                </button>
                                <button 
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-secondary text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'}`}
                                    title="List View"
                                >
                                    <ListIcon size={14} />
                                </button>
                            </div>
                            {canDataImport && (
                                <button onClick={() => setShowImport(true)} className="btn btn-ghost bg-background border border-border/50 shadow-sm gap-2 hidden md:flex">
                                    <Upload size={14} />
                                    Import
                                </button>
                            )}
                            {canCardCreate && (
                                <button onClick={() => openCreateModal(lists[0]?.id)} className="btn btn-primary gap-2">
                                    <Plus size={14} />
                                    New Task
                                </button>
                            )}
                        </div>
                    </header>

                    <main className="flex-1 overflow-x-auto px-6 md:px-10 pb-8">
                        {viewMode === 'grid' ? (
                            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
                            <div className="flex gap-6 h-full items-start">
                                <SortableContext items={lists.map(l => `col-${l.id}`)}>  
                                {lists.map(list => (
                                    <SortableColumn key={list.id} list={list}>
                                        {({ dragHandleProps }) => (<>
                                        <div className="flex items-center justify-between mb-4 px-1">
                                            <div className="flex items-center gap-2.5 cursor-grab active:cursor-grabbing" {...dragHandleProps}>
                                                <h3 className="text-[12px] font-black text-foreground/80 uppercase tracking-widest leading-none">{list.name}</h3>
                                                <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                                                    {filteredCards(list.cards || []).length}
                                                </span>
                                            </div>
                                            {canSectionManage && (
                                                <div className="relative">
                                                    <button 
                                                        onPointerDown={(e) => { e.stopPropagation(); }}
                                                        onClick={(e) => { e.stopPropagation(); setDropdownListId(dropdownListId === list.id ? null : list.id); }}
                                                        className="p-1 rounded-lg hover:bg-background/80 text-muted-foreground hover:text-foreground transition-all"
                                                        title="Section Options"
                                                    >
                                                        <MoreHorizontal size={14} />
                                                    </button>
                                                    {dropdownListId === list.id && (
                                                        <div className="absolute right-0 top-8 z-50 bg-background border border-border rounded-xl shadow-xl py-1 min-w-[140px] fade-in">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setDropdownListId(null); handleDeleteList(list.id); }}
                                                                className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-destructive hover:bg-destructive/10 transition-colors"
                                                            >
                                                                <Trash2 size={13} />
                                                                Delete Section
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin min-h-[100px]">
                                            <SortableContext items={(list.cards || []).map(c => c.id)}>
                                                {filteredCards(list.cards || []).map(card => (
                                                    <SortableCard key={card.id} card={card} onClick={openEditModal} />
                                                ))}
                                            </SortableContext>
                                        </div>
                                        
                                        {canCardCreate && (
                                            <button 
                                                onClick={() => openCreateModal(list.id)}
                                                className="mt-4 w-full py-2.5 flex items-center justify-center gap-2 text-[11px] font-bold text-muted-foreground hover:text-primary hover:bg-background rounded-xl border border-transparent hover:border-border/50 hover:shadow-sm transition-all"
                                            >
                                                <Plus size={14} />
                                                ADD TASK
                                            </button>
                                        )}
                                        </>)}
                                    </SortableColumn>
                                ))}
                                </SortableContext>

                                {/* Add Section */}
                                {canSectionManage ? (
                                    showAddSection ? (
                                        <div className="min-w-[300px] shrink-0">
                                            <input
                                                autoFocus
                                                value={newSectionName}
                                                onChange={e => setNewSectionName(e.target.value)}
                                                onKeyDown={handleAddSection}
                                                placeholder="Section name..."
                                                className="w-full bg-background border border-primary rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                                            />
                                            <div className="flex gap-2 mt-2">
                                                <button onClick={handleAddSection} className="flex-1 btn btn-primary text-[11px] py-2 h-auto rounded-xl font-black">ADD</button>
                                                <button onClick={() => { setShowAddSection(false); setNewSectionName(''); }} className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all"><X size={14} /></button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button onClick={() => setShowAddSection(true)} className="min-w-[300px] h-14 border-2 border-dashed border-border/50 rounded-2xl flex items-center justify-center gap-2 text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-background/50 transition-all text-[11px] font-black uppercase tracking-widest shrink-0">
                                            <Plus size={16} />
                                            Add Section
                                        </button>
                                    )
                                ) : null}
                            </div>
                            </DndContext>
                        ) : (
                            <div className="glass-panel rounded-[2rem] border-white/40 shadow-xl shadow-primary/5 overflow-hidden fade-in max-w-5xl">
                                <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-border/30 bg-muted/20 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                                    <div className="col-span-6 pl-4">Task Name</div>
                                    <div className="col-span-2">Stage</div>
                                    <div className="col-span-2">Assignee</div>
                                    <div className="col-span-2 text-right pr-4">Due Date</div>
                                </div>
                                <div className="divide-y divide-border/20">
                                    {lists.map(list => 
                                        filteredCards(list.cards || []).map(card => (
                                            <div 
                                                key={card.id} 
                                                onClick={() => openEditModal(card)}
                                                className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center hover:bg-secondary/40 transition-colors cursor-pointer group"
                                            >
                                                <div className="col-span-1 md:col-span-6 flex items-center gap-3 pl-2 md:pl-4">
                                                    <button className="text-muted-foreground hover:text-primary transition-colors focus:outline-none shrink-0">
                                                        <CheckCircle2 size={18} className={list.name.toLowerCase() === 'done' ? 'text-emerald-500 fill-emerald-500/20' : ''} />
                                                    </button>
                                                    <div className="min-w-0">
                                                        <h4 className={`text-sm font-bold tracking-tight truncate ${list.name.toLowerCase() === 'done' ? 'text-muted-foreground line-through decoration-muted-foreground/50' : 'text-foreground group-hover:text-primary'}`}>{card.title}</h4>
                                                    </div>
                                                </div>
                                                <div className="col-span-1 md:col-span-2 flex items-center">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${list.name.toLowerCase() === 'done' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-secondary text-muted-foreground border-border/50'}`}>
                                                        {list.name}
                                                    </span>
                                                </div>
                                                <div className="col-span-1 md:col-span-2 flex items-center">
                                                    {card.assignee ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary uppercase ring-1 ring-primary/20 shrink-0">
                                                                {card.assignee.username.charAt(0)}
                                                            </div>
                                                            <span className="text-xs font-semibold text-muted-foreground truncate">{card.assignee.username}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground/50 italic flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                                                                <UserIcon size={12} />
                                                            </div>
                                                            Unassigned
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="col-span-1 md:col-span-2 flex items-center justify-end gap-2 pr-2 md:pr-4">
                                                    {card.reopen_count > 0 && (
                                                        <div className="flex items-center gap-1 text-orange-500 bg-orange-500/10 px-2 py-1 rounded-md text-[10px] font-bold" title="Reopen Count">
                                                            <RefreshCw size={12} />
                                                            {card.reopen_count}
                                                        </div>
                                                    )}
                                                    {card.checklists?.length > 0 && (
                                                        <div className="flex items-center gap-1 text-primary bg-primary/10 px-2 py-1 rounded-md text-[10px] font-bold" title="Subtasks Progress">
                                                            <CheckSquare size={12} />
                                                            {Math.round((card.checklists.filter(c => c.status === 'done').length / card.checklists.length) * 100)}%
                                                        </div>
                                                    )}
                                                    {card.due_date ? (
                                                        <div className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5 bg-secondary/30 px-2 py-1 rounded-md">
                                                            <Calendar size={12} />
                                                            {new Date(card.due_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground/30 px-2">-</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    {lists.every(list => filteredCards(list.cards || []).length === 0) && (
                                        <div className="p-12 text-center flex flex-col items-center justify-center text-muted-foreground">
                                            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                                                <LayoutGrid size={24} className="opacity-50" />
                                            </div>
                                            <p className="text-sm font-semibold">No tasks found matching your filters.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </main>

                    {showCardModal && (
                        <CardModal 
                            card={editingCard}
                            listId={activeListId}
                            users={users}
                            onClose={() => setShowCardModal(false)}
                            onSave={handleModalSave}
                            onDelete={handleModalSave}
                            readOnly={!canCardEdit}
                            permissions={permissions}
                            auth={auth}
                        />
                    )}

                    {showImport && (
                        <div className="fixed inset-0 bg-background/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6 fade-in">
                            <div className="bg-card border border-border max-w-xl w-full p-8 rounded-2xl shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-primary/10 transition-colors" />
                                
                                <button onClick={() => setShowImport(false)} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors">
                                    <X size={20} />
                                </button>
                                
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                        <Upload size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black tracking-tight text-foreground">Targeted Data Import</h3>
                                        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Select import target level</p>
                                    </div>
                                </div>

                                {/* Step 1: Select Type */}
                                <div className="flex gap-2 p-1 bg-secondary/30 rounded-xl mb-6">
                                    {['task', 'subtask', 'detail'].map(type => (
                                        <button 
                                            key={type}
                                            onClick={() => setImportType(type)}
                                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest px-2 transition-all ${importType === type ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <div className="glass-panel p-4 rounded-xl border-white/20 h-full flex flex-col">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Instructions</h4>
                                        <p className="text-[9px] text-muted-foreground font-medium flex-1">
                                            {importType === 'task' && "Import new cards directly into the current board sections."}
                                            {importType === 'subtask' && "Target a specific main task to populate it with new checklists."}
                                            {importType === 'detail' && "Target a specific subtask to populate it with fine-grained QA details."}
                                        </p>
                                    </div>
                                    <div className="md:col-span-2 space-y-4">
                                        {/* Target Selection */}
                                        {importType === 'subtask' && (
                                            <div>
                                                <label className="block text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 pl-1">Target Task (Required)</label>
                                                <select 
                                                    className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-[11px] font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                    value={selectedCardId}
                                                    onChange={e => setSelectedCardId(e.target.value)}
                                                >
                                                    <option value="">-- Choose Target Task --</option>
                                                    {board.card_lists?.flatMap(l => l.cards || []).map(card => (
                                                        <option key={card.id} value={card.id}>{card.title}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {importType === 'detail' && (
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 pl-1">Target Task</label>
                                                    <select 
                                                        className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-[11px] font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                        value={selectedCardId}
                                                        onChange={e => setSelectedCardId(e.target.value)}
                                                    >
                                                        <option value="">-- Choose Task --</option>
                                                        {board.card_lists?.flatMap(l => l.cards || []).map(card => (
                                                            <option key={card.id} value={card.id}>{card.title}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 pl-1">Target Subtask (Required)</label>
                                                    <select 
                                                        className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-[11px] font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                        value={selectedChecklistId}
                                                        onChange={e => setSelectedChecklistId(e.target.value)}
                                                        disabled={!selectedCardId}
                                                    >
                                                        <option value="">-- Choose Subtask --</option>
                                                        {cardChecklists.map(chk => (
                                                            <option key={chk.id} value={chk.id}>{chk.content}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <a 
                                                href={route(`import.${importType}.template`)} 
                                                className="btn btn-ghost text-[10px] gap-2 font-black border border-border/50 shadow-sm w-full uppercase"
                                            >
                                                <ListIcon size={12} />
                                                DOWNLOAD {importType} TEMPLATE
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                <label className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all group overflow-hidden ${importLoading ? 'opacity-50 pointer-events-none' : 'border-border/50 hover:border-primary/50 hover:bg-primary/[0.02]'}`}>
                                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <Upload size={24} className="text-muted-foreground mb-3 group-hover:-translate-y-1 transition-transform" />
                                    <span className="text-xs font-black text-foreground mb-1 tracking-tight">
                                        {importLoading ? 'UPLOADING...' : 'Upload File to Deploy'}
                                    </span>
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-50">supports .xlsx, .xls, .csv</span>
                                    <input 
                                        type="file" 
                                        accept=".xlsx,.xls,.csv" 
                                        disabled={importLoading}
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (!file) return;

                                            // Validation
                                            if (importType === 'subtask' && !selectedCardId) return alert('Select target task first');
                                            if (importType === 'detail' && !selectedChecklistId) return alert('Select target subtask first');

                                            const formData = new FormData();
                                            formData.append('file', file);
                                            setImportLoading(true);

                                            let url = '';
                                            if (importType === 'task') url = route('import.tasks', board.id);
                                            if (importType === 'subtask') url = route('import.subtasks', selectedCardId);
                                            if (importType === 'detail') url = route('import.details', selectedChecklistId);
                                            
                                            router.post(url, formData, {
                                                onSuccess: () => {
                                                    alert(`${importType.charAt(0).toUpperCase() + importType.slice(1)} Import Successful!`);
                                                    setShowImport(false);
                                                    setImportLoading(false);
                                                },
                                                onError: (err) => {
                                                    alert('Import Failed: ' + (err.file || 'Unknown error'));
                                                    setImportLoading(false);
                                                }
                                            });
                                        }} 
                                        className="hidden" 
                                    />
                                </label>
                            </div>
                        </div>
                    )}

                    {showResetModal && (
                        <div className="fixed inset-0 bg-background/60 backdrop-blur-md z-[110] flex items-center justify-center p-6 fade-in">
                            <div className="bg-card border border-destructive/20 max-w-md w-full p-8 rounded-2xl shadow-2xl relative">
                                <button onClick={() => setShowResetModal(false)} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
                                    <X size={18} />
                                </button>
                                
                                <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center text-destructive mb-6">
                                    <Trash2 size={24} />
                                </div>

                                <h3 className="text-xl font-bold tracking-tight mb-2">Nuclear Reset</h3>
                                <p className="text-muted-foreground text-xs mb-6 leading-relaxed">
                                    This action will <span className="text-destructive font-bold">permanently delete</span> all boards, tasks, and historical data. This cannot be undone.
                                </p>

                                <form onSubmit={handleResetData} className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Confirm Identity (Password)</label>
                                        <input 
                                            type="password"
                                            required
                                            value={resetPassword}
                                            onChange={(e) => setResetPassword(e.target.value)}
                                            className="w-full bg-secondary/30 border border-border focus:border-primary rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                                            placeholder="Enter admin password..."
                                        />
                                        {resetError && <p className="text-destructive text-[10px] mt-2 font-bold uppercase">{resetError}</p>}
                                    </div>

                                    <button 
                                        type="submit" 
                                        disabled={resetLoading}
                                        className="w-full btn btn-primary bg-destructive hover:bg-destructive/90 transition-all py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-destructive/20 h-auto"
                                    >
                                        {resetLoading ? 'WIPING DATA...' : 'PERMANENTLY WIPE SYSTEM'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    <ReassignModal 
                        isOpen={!!reassignData}
                        onClose={() => setReassignData(null)}
                        onConfirm={confirmReassign}
                        users={users}
                        title="Move Task"
                    />
                </div>
            </div>
        </>
    );
};

export default Board;
