import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Layout, Search, LogOut, Settings, ChevronDown, Users, MessageSquareCode, Send, ScrollText } from 'lucide-react';
import Dropdown from './Dropdown';

const Navbar = ({ user }) => {
    const { url } = usePage();

    const isActive = (path) => url === path || url.startsWith(path + '/');
    const isSettingActive = () => [
        route('users.index'),
        route('whatsapp-settings.index'),
        route('telegram-settings.index'),
        route('logs.index')
    ].some(path => url.startsWith(new URL(path).pathname));

    return (
        <nav className="sticky top-0 z-50 bg-background/60 backdrop-blur-xl border-b border-border/50 px-4 md:px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-8 md:gap-12">
                <Link href={route('boards.index')} className="flex items-center gap-2.5 group">
                    <div className="bg-primary p-2 rounded-xl group-hover:scale-105 group-hover:rotate-3 transition-all shadow-lg shadow-primary/20">
                        <Layout size={18} className="text-primary-foreground" />
                    </div>
                    <span className="text-lg font-bold tracking-tight text-foreground">
                        Tracker<span className="text-primary">.</span>
                    </span>
                </Link>

                <div className="hidden md:flex items-center gap-1.5 bg-secondary/30 p-1 rounded-xl border border-border/50">
                    <Link href={route('boards.index')} className={`px-4 py-1.5 rounded-lg transition-all text-xs font-semibold ${isActive('/') || url.includes('/boards') ? 'bg-background text-primary shadow-sm ring-1 ring-black/[0.02]' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}>
                        Board
                    </Link>
                    <Link href={route('dashboard')} className={`px-4 py-1.5 rounded-lg transition-all text-xs font-semibold ${isActive('/dashboard') ? 'bg-background text-primary shadow-sm ring-1 ring-black/[0.02]' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}>
                        Dashboard
                    </Link>
                    {user?.role === 'admin' && (
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button className={`flex items-center gap-2 px-4 py-1.5 rounded-lg transition-all text-xs font-semibold outline-none ${isSettingActive() ? 'bg-background text-primary shadow-sm ring-1 ring-black/[0.02]' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}>
                                    <Settings size={14} />
                                    Setting
                                    <ChevronDown size={12} className="opacity-50" />
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Content align="left" width="48" contentClasses="py-2 bg-popover border border-border/50 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-xl">
                                <Dropdown.Link href={route('users.index')} className="flex items-center gap-3 px-4 py-2.5 text-[11px] font-bold text-foreground hover:bg-primary/10 hover:text-primary transition-colors">
                                    <Users size={14} /> Team
                                </Dropdown.Link>
                                <Dropdown.Link href={route('whatsapp-settings.index')} className="flex items-center gap-3 px-4 py-2.5 text-[11px] font-bold text-foreground hover:bg-primary/10 hover:text-primary transition-colors">
                                    <MessageSquareCode size={14} /> WhatsApp
                                </Dropdown.Link>
                                <Dropdown.Link href={route('telegram-settings.index')} className="flex items-center gap-3 px-4 py-2.5 text-[11px] font-bold text-foreground hover:bg-primary/10 hover:text-primary transition-colors">
                                    <Send size={14} /> Telegram
                                </Dropdown.Link>
                                <div className="mx-2 h-px bg-border/20 my-1" />
                                <Dropdown.Link href={route('logs.index')} className="flex items-center gap-3 px-4 py-2.5 text-[11px] font-bold text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">
                                    <ScrollText size={14} /> Logs
                                </Dropdown.Link>
                            </Dropdown.Content>
                        </Dropdown>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4 md:gap-6">
                <div className="hidden lg:flex items-center relative group">
                    <Search className="absolute left-3 text-muted-foreground group-focus-within:text-primary transition-colors" size={14} />
                    <input
                        type="text"
                        placeholder="Search workspace..."
                        className="bg-secondary/40 border border-transparent rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-primary/30 focus:bg-background transition-all w-40 focus:w-64 text-foreground placeholder:text-muted-foreground/50 ring-1 ring-transparent focus:ring-primary/10 shadow-inner"
                    />
                </div>

                <div className="flex items-center gap-4 pl-6 md:border-l border-border/50">
                    <div className="hidden sm:flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-xs font-bold text-foreground leading-none">{user?.username || 'Guest'}</p>
                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-primary/10 text-primary">
                                {user?.role || 'user'}
                            </span>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/10">
                            {user?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                    </div>
                    <Link 
                        href={route('logout')} 
                        method="post" 
                        as="button"
                        className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all outline-none border border-transparent hover:border-destructive/20"
                    >
                        <LogOut size={18} />
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
