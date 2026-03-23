import { Head, Link, useForm } from '@inertiajs/react';
import { Mail, User, Send, ArrowLeft } from 'lucide-react';
import GuestLayout from '@/Layouts/GuestLayout';
import { __ } from '@/translations';

export default function Register() {
    const { data, setData, post, processing, errors } = useForm({
        username: '',
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('register'));
    };

    return (
        <GuestLayout>
            <Head title={__('Register')} />
            
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary text-primary-foreground mb-4 shadow-lg shadow-primary/20">
                    <User size={24} />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{__('Create Account')}</h1>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                    {__("Join Project Tracker to start managing your workspace. We'll send a verification link to your email.")}
                </p>
            </div>

            <form onSubmit={submit} className="space-y-6">
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">{__('Username')}</label>
                    <div className="relative group">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
                        <input
                            required
                            className="w-full bg-background/50 border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                            placeholder="johndoe"
                            value={data.username}
                            onChange={(e) => setData('username', e.target.value)}
                            autoComplete="username"
                        />
                    </div>
                    {errors.username && <p className="text-destructive text-[10px] ml-1 mt-1 font-bold">{errors.username}</p>}
                </div>

                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">{__('Email Address')}</label>
                    <div className="relative group">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
                        <input
                            required
                            type="email"
                            className="w-full bg-background/50 border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                            placeholder="name@company.com"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            autoComplete="email"
                        />
                    </div>
                    {errors.email && <p className="text-destructive text-[10px] ml-1 mt-1 font-bold">{errors.email}</p>}
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className="btn btn-primary w-full py-3.5 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group transition-all active:scale-95"
                    >
                        {processing ? (
                            <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>{__('Sign Up')}</span>
                                <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </>
                        )}
                    </button>
                </div>
            </form>

            <div className="mt-8 pt-6 border-t border-border/50 text-center">
                <Link
                    href={route('login')}
                    className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary font-bold transition-colors"
                >
                    <ArrowLeft size={14} />
                    {__('Already have an account? Log in')}
                </Link>
            </div>
        </GuestLayout>
    );
}
