import { Head, Link, useForm } from '@inertiajs/react';
import { Lock, Mail } from 'lucide-react';
import { __ } from '@/translations';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title={__('Log in')} />
            <div className="min-h-screen flex items-center justify-center p-6 mesh-gradient">
                <div className="w-full max-w-[400px] scale-in">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary text-primary-foreground mb-4 shadow-lg shadow-primary/20">
                            <Lock size={24} />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Tracker BPKP</h1>
                        <p className="text-muted-foreground mt-2 text-sm">{__('Welcome back to your workspace')}</p>
                    </div>

                    <div className="glass-panel p-8 rounded-[2rem] shadow-2xl shadow-primary/5 border-white/40">
                        {status && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 p-3 rounded-xl mb-6 text-xs font-semibold text-center">
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-semibold text-muted-foreground ml-1">{__('Email')}</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                    <input
                                        required
                                        type="email"
                                        className="w-full bg-background/50 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        placeholder="name@company.com"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        autoComplete="username"
                                    />
                                </div>
                                {errors.email && <p className="text-destructive text-[10px] ml-1 mt-1 font-bold">{errors.email}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-semibold text-muted-foreground ml-1">{__('Password')}</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                    <input
                                        required
                                        type="password"
                                        className="w-full bg-background/50 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        placeholder="••••••••"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        autoComplete="current-password"
                                    />
                                </div>
                                {errors.password && <p className="text-destructive text-[10px] ml-1 mt-1 font-bold">{errors.password}</p>}
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="rounded border-border text-primary focus:ring-primary/20 bg-background/50"
                                    />
                                    <span className="text-[11px] font-medium text-muted-foreground">{__('Remember me')}</span>
                                </label>

                                {canResetPassword && (
                                    <Link
                                        href={route('password.request')}
                                        className="text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
                                    >
                                        {__('Forgot password?')}
                                    </Link>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="btn btn-primary w-full mt-2 py-3 rounded-xl shadow-lg shadow-primary/20"
                            >
                                {processing ? (
                                    <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mx-auto" />
                                ) : (
                                    __('Sign In')
                                )}
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-border/50 text-center">
                            <Link
                                href={route('register')}
                                className="text-sm text-muted-foreground hover:text-primary font-medium transition-colors"
                            >
                                {__("Don't have an account? Sign up")}
                            </Link>
                        </div>
                    </div>

                    <p className="mt-8 text-center text-[11px] text-muted-foreground font-medium opacity-60">
                        {__('Secure Enterprise Portal')} &copy; 2026
                    </p>
                </div>
            </div>
        </>
    );
}
