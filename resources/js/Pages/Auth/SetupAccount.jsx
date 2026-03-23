import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { Lock, Mail, Key, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';
import { __ } from '@/translations';

export default function SetupAccount({ id, hash, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        id: id,
        hash: hash,
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('account.setup.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title={__('Setup Your Account')} />

            <div className="mb-8 text-center sm:text-left">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 mb-4 shadow-lg shadow-emerald-500/10">
                    <UserCheck size={24} />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{__('Welcome!')}</h1>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    {__('Account verified. Please set a secure password to complete your registration.')}
                </p>
            </div>

            <form onSubmit={submit} className="space-y-5">
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 mb-2 block">
                        {__('Email Address')}
                    </label>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50">
                            <Mail size={18} />
                        </div>
                        <input
                            type="email"
                            value={email}
                            className="w-full bg-secondary/10 border border-border rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium opacity-60 cursor-not-allowed"
                            readOnly
                        />
                    </div>
                </div>

                <div className="space-y-5 pt-2">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 mb-2 block">
                            {__('Create Password')}
                        </label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                <Lock size={18} />
                            </div>
                            <input
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                className="w-full bg-secondary/30 border border-border rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                autoComplete="new-password"
                                autoFocus
                                placeholder="••••••••"
                                onChange={(e) => setData('password', e.target.value)}
                            />
                        </div>
                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 mb-2 block">
                            {__('Confirm Password')}
                        </label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                <ShieldCheck size={18} />
                            </div>
                            <input
                                id="password_confirmation"
                                type="password"
                                name="password_confirmation"
                                value={data.password_confirmation}
                                className="w-full bg-secondary/30 border border-border rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                autoComplete="new-password"
                                placeholder="••••••••"
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                            />
                        </div>
                        <InputError message={errors.password_confirmation} className="mt-2" />
                    </div>
                </div>

                <div className="pt-6">
                    <button 
                        type="submit" 
                        disabled={processing}
                        className="btn btn-primary w-full py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-primary/20 group transition-all active:scale-95"
                    >
                        <span>{__('Complete Setup')}</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    
                    <div className="mt-6 flex items-center justify-center gap-2 p-3 bg-secondary/20 rounded-xl border border-border/50">
                        <Key size={12} className="text-primary" />
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                            {__('Password must be at least 8 characters.')}
                        </p>
                    </div>
                </div>
            </form>
        </GuestLayout>
    );
}
