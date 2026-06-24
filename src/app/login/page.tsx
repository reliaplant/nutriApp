'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/app/shared/firebase';
import { useTranslation } from '@/app/shared/useTranslation';
import { SUPPORTED_LANGS, type Lang } from '@/app/shared/i18n';
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  Lock,
  User,
  Sparkles,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe,
} from 'lucide-react';

type ResetState = { sent: boolean };

// Solo permitir autenticación con Google. El login/registro con email+contraseña
// queda en el código pero oculto. Cambiar a false para reactivarlo.
const GOOGLE_ONLY = true;

export default function LoginPage() {
  const { t, lang, setLang } = useTranslation();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [showResetForm, setShowResetForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [reset, setReset] = useState<ResetState>({ sent: false });
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return setError(t('login.errEmpty'));

    try {
      setLoading(true);
      setError('');
      const credential = await authService.login(email, password);
      const userData = await authService.getUserData(credential.user.uid);
      if (!userData) throw new Error('No user data');
      const token = await credential.user.getIdToken(true);
      document.cookie = `session=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;
      router.replace(userData.onboardingCompletedAt ? '/pacientes' : '/onboarding');
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError(t('login.errCreds'));
      } else if (err.code === 'auth/too-many-requests') {
        setError(t('login.errRate'));
      } else {
        setError(err.message || t('login.errCreds'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword || !displayName) return setError(t('login.errEmpty'));
    if (password !== confirmPassword) return setError(t('login.errMismatch'));
    if (password.length < 6) return setError(t('login.errShort'));

    try {
      setLoading(true);
      setError('');
      await authService.register(email, password, displayName);
      const credential = await authService.login(email, password);
      const userData = await authService.getUserData(credential.user.uid);
      const token = await credential.user.getIdToken(true);
      document.cookie = `session=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;
      router.replace(userData?.onboardingCompletedAt ? '/pacientes' : '/onboarding');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') setError(t('login.errExists'));
      else setError(err.message || t('login.errEmpty'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      const credential = await authService.loginWithGoogle();
      const userData = await authService.getUserData(credential.user.uid);
      const token = await credential.user.getIdToken(true);
      document.cookie = `session=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;
      router.replace(userData?.onboardingCompletedAt ? '/pacientes' : '/onboarding');
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') return;
      setError(err.message || 'Error al iniciar sesión con Google');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return setError(t('login.errEmpty'));
    try {
      setLoading(true);
      setError('');
      await authService.resetPassword(email);
      setReset({ sent: true });
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') setError(t('login.errNotFound'));
      else setError(err.message || '');
    } finally {
      setLoading(false);
    }
  };

  // Foods floating in the right panel
  const foods = [
    { src: 'aguacate', top: '12%', left: '8%', size: 44, rot: -10, delay: '0s' },
    { src: 'fresa', top: '18%', right: '14%', size: 36, rot: 15, delay: '0.5s' },
    { src: 'brocoli', bottom: '22%', left: '12%', size: 48, rot: 8, delay: '1.1s' },
    { src: 'manzana', top: '55%', left: '6%', size: 32, rot: -16, delay: '0.3s' },
    { src: 'zanahoria', bottom: '14%', right: '10%', size: 40, rot: 22, delay: '0.9s' },
    { src: 'salmon', top: '60%', right: '8%', size: 42, rot: -8, delay: '0.6s' },
    { src: 'huevo', top: '36%', right: '32%', size: 28, rot: 5, delay: '1.4s' },
    { src: 'naranja', bottom: '36%', right: '24%', size: 30, rot: 12, delay: '0.2s' },
  ];

  return (
    <div className="bg-cream-pattern min-h-screen flex">
      {/* ── Form panel (izquierda) ── */}
      <div className="w-full lg:w-[480px] flex flex-col">
        {/* Top bar */}
        <header className="px-6 py-4 flex items-center justify-between flex-shrink-0">
          <Link href="/" className="flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            {t('common.backToHome')}
          </Link>

          {/* Language picker */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(o => !o)}
              onBlur={() => setTimeout(() => setLangMenuOpen(false), 150)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[12px] text-gray-600 hover:text-gray-900 transition-colors"
              style={{ border: '1px solid #E8E5DE' }}
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="uppercase font-semibold tabular-nums">{lang}</span>
            </button>
            {langMenuOpen && (
              <div
                className="absolute right-0 top-full mt-1 bg-white rounded-md py-1 z-10 min-w-[140px]"
                style={{ border: '1px solid #E8E5DE', boxShadow: '0 8px 24px -8px rgba(0,0,0,0.12)' }}
              >
                {SUPPORTED_LANGS.map(l => (
                  <button
                    key={l.code}
                    onMouseDown={(e) => { e.preventDefault(); setLang(l.code as Lang); setLangMenuOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 text-[12px] flex items-center gap-2 hover:bg-[#FAF9F7] transition-colors ${
                      lang === l.code ? 'text-emerald-700 font-semibold' : 'text-gray-700'
                    }`}
                  >
                    <span>{l.flag}</span>
                    {l.label}
                    {lang === l.code && <CheckCircle2 className="w-3 h-3 ml-auto" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-8 py-6">
          <div className="w-full max-w-sm">
            {/* Brand */}
            <Link href="/" className="flex items-center gap-2 mb-10 group">
              <img src="/icons/refeit-logo.svg?v=2" alt="" className="h-8 w-8 transition-transform group-hover:scale-105" />
              <span
                className="text-[19px] text-gray-900 lowercase"
                style={{ fontFamily: "'Sora', ui-sans-serif, system-ui, sans-serif", fontWeight: 600, letterSpacing: '-0.03em' }}
              >
                refeit
              </span>
            </Link>

            {/* Heading */}
            <div className="mb-7">
              <h1
                className="text-2xl font-semibold tracking-tight text-gray-900 mb-1.5"
                style={{ letterSpacing: '-0.02em' }}
              >
                {showResetForm
                  ? t('login.resetTitle')
                  : activeTab === 'login'
                    ? t('login.title')
                    : t('login.registerTitle')}
              </h1>
              <p className="text-[13px] text-gray-500">
                {showResetForm
                  ? t('login.resetSubtitle')
                  : activeTab === 'login'
                    ? t('login.subtitle')
                    : t('login.registerSubtitle')}
              </p>
            </div>

            {/* Tabs */}
            {!showResetForm && !GOOGLE_ONLY && (
              <div className="flex gap-1 p-1 mb-5 rounded-md" style={{ backgroundColor: '#F0EDE8', border: '1px solid #E8E5DE' }}>
                {[
                  { id: 'login', label: t('login.tabLogin') },
                  { id: 'register', label: t('login.tabRegister') },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id as any); setError(''); }}
                    className={`flex-1 py-1.5 text-[12px] font-semibold rounded transition-all ${
                      activeTab === tab.id
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            {/* Errors / success */}
            {error && (
              <div className="mb-4 p-2.5 bg-red-50 text-red-700 text-[12px] rounded border border-red-200 flex items-start gap-2">
                <span className="text-red-500 mt-0.5">●</span>
                {error}
              </div>
            )}
            {reset.sent && (
              <div className="mb-4 p-2.5 bg-emerald-50 text-emerald-800 text-[12px] rounded border border-emerald-200 flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                {t('login.resetSuccess')}
              </div>
            )}

            {/* Solo Google */}
            {GOOGLE_ONLY && !showResetForm && (
              <div className="space-y-3">
                <GoogleButton loading={loading} onClick={handleGoogleLogin} />
              </div>
            )}

            {/* Login */}
            {!GOOGLE_ONLY && activeTab === 'login' && !showResetForm && (
              <form onSubmit={handleLogin} className="space-y-3">
                <FieldEmail value={email} onChange={setEmail} disabled={loading} label={t('login.email')} />
                <FieldPassword
                  value={password}
                  onChange={setPassword}
                  disabled={loading}
                  label={t('login.password')}
                  visible={showPassword}
                  onToggleVisibility={() => setShowPassword(v => !v)}
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => { setShowResetForm(true); setError(''); }}
                    className="text-[11px] text-gray-500 hover:text-emerald-700 transition-colors"
                  >
                    {t('login.forgotPassword')}
                  </button>
                </div>
                <SubmitButton loading={loading} label={t('login.submitLogin')} loadingLabel={t('login.loadingLogin')} />
                <div className="relative flex items-center my-1">
                  <div className="flex-1 border-t" style={{ borderColor: '#E8E5DE' }} />
                  <span className="px-3 text-[11px] text-gray-400">o</span>
                  <div className="flex-1 border-t" style={{ borderColor: '#E8E5DE' }} />
                </div>
                <GoogleButton loading={loading} onClick={handleGoogleLogin} />
              </form>
            )}

            {/* Register */}
            {!GOOGLE_ONLY && activeTab === 'register' && !showResetForm && (
              <form onSubmit={handleRegister} className="space-y-3">
                <Field
                  icon={<User className="w-3.5 h-3.5" />}
                  type="text"
                  value={displayName}
                  onChange={setDisplayName}
                  disabled={loading}
                  label={t('login.name')}
                  placeholder={t('login.nameExample')}
                />
                <FieldEmail value={email} onChange={setEmail} disabled={loading} label={t('login.email')} />
                <FieldPassword
                  value={password}
                  onChange={setPassword}
                  disabled={loading}
                  label={t('login.password')}
                  visible={showPassword}
                  onToggleVisibility={() => setShowPassword(v => !v)}
                  placeholder="••••••"
                />
                <FieldPassword
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  disabled={loading}
                  label={t('login.confirmPassword')}
                  visible={showPassword}
                  onToggleVisibility={() => setShowPassword(v => !v)}
                  placeholder="••••••"
                />
                <SubmitButton loading={loading} label={t('login.submitRegister')} loadingLabel={t('login.loadingRegister')} />
                <div className="relative flex items-center my-1">
                  <div className="flex-1 border-t" style={{ borderColor: '#E8E5DE' }} />
                  <span className="px-3 text-[11px] text-gray-400">o</span>
                  <div className="flex-1 border-t" style={{ borderColor: '#E8E5DE' }} />
                </div>
                <GoogleButton loading={loading} onClick={handleGoogleLogin} />
              </form>
            )}

            {/* Reset */}
            {showResetForm && (
              <form onSubmit={handleResetPassword} className="space-y-3">
                <FieldEmail value={email} onChange={setEmail} disabled={loading || reset.sent} label={t('login.email')} />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowResetForm(false); setReset({ sent: false }); setError(''); }}
                    className="px-3 py-2 text-[12px] font-medium text-gray-700 bg-white rounded-md hover:bg-gray-50 transition-colors"
                    style={{ border: '1px solid #E8E5DE' }}
                    disabled={loading}
                  >
                    {t('common.back')}
                  </button>
                  <button
                    type="submit"
                    disabled={loading || reset.sent}
                    className={`flex-1 py-2 px-3 rounded-md text-white text-[12px] font-semibold transition-colors ${
                      loading || reset.sent ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {loading ? t('common.loading') : reset.sent ? t('login.resetSent') : t('login.resetSubmit')}
                  </button>
                </div>
              </form>
            )}

            {/* Legal */}
            <p className="mt-7 text-[11px] text-gray-500 leading-relaxed text-center">
              {t('login.legalAccept')}{' '}
              <Link href="/terminos" className="text-gray-700 hover:text-emerald-700 underline underline-offset-2">
                {t('login.legalTerms')}
              </Link>{' '}
              {t('login.legalAnd')}{' '}
              <Link href="/politica-privacidad" className="text-gray-700 hover:text-emerald-700 underline underline-offset-2">
                {t('login.legalPrivacy')}
              </Link>
              .
            </p>
          </div>
        </div>
      </div>

      {/* ── Hero panel (derecha) ── */}
      <aside
        className="hidden lg:flex flex-1 relative overflow-hidden flex-col justify-end p-12"
        style={{
          background: 'linear-gradient(135deg, #047857 0%, #059669 50%, #10B981 100%)',
        }}
      >
        {/* Floaters */}
        <div className="absolute inset-0 pointer-events-none">
          {foods.map((f, i) => (
            <img
              key={i}
              src={`/icons/${f.src}.svg`}
              alt=""
              className="absolute opacity-50 animate-float-login"
              style={{
                top: f.top as any,
                left: f.left as any,
                right: f.right as any,
                bottom: f.bottom as any,
                width: f.size,
                height: f.size,
                transform: `rotate(${f.rot}deg)`,
                animationDelay: f.delay,
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))',
              }}
            />
          ))}
        </div>

        {/* Decorative gradient blobs */}
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-40 -left-20 w-[28rem] h-[28rem] rounded-full opacity-15 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%)' }}
        />

        <style>{`
          @keyframes float-login {
            0%, 100% { transform: translateY(0px) rotate(var(--r, 0deg)); }
            50%      { transform: translateY(-12px) rotate(var(--r, 0deg)); }
          }
          .animate-float-login { animation: float-login 6s ease-in-out infinite; }
        `}</style>

        <div className="relative max-w-md text-white">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider mb-5 bg-white/15 backdrop-blur-sm">
            <Sparkles className="w-3 h-3" />
            {t('login.heroBadge')}
          </div>
          <h2
            className="text-3xl lg:text-4xl font-semibold leading-tight mb-4"
            style={{ letterSpacing: '-0.02em' }}
          >
            {t('login.heroTitle')}
          </h2>
          <p className="text-[14px] text-emerald-50/90 leading-relaxed mb-6">
            {t('login.heroSubtitle')}
          </p>

          {/* Mini stats */}
          <div className="flex items-center gap-6 pt-5 border-t border-white/15">
            {[
              { v: '200+', l: 'Nutricionistas' },
              { v: '12k', l: 'Pacientes' },
              { v: '98%', l: 'Recomiendan' },
            ].map((s, i) => (
              <div key={i}>
                <div className="text-xl font-semibold tabular-nums" style={{ letterSpacing: '-0.02em' }}>
                  {s.v}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-emerald-50/70">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

/* ─── Field components ─────────────────────────────────────────────────── */
function Field({
  icon, type, value, onChange, disabled, label, placeholder,
}: {
  icon: React.ReactNode;
  type: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  label: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2.5 text-[13px] bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all placeholder:text-gray-400 disabled:bg-gray-50"
          required
        />
      </div>
    </div>
  );
}

function FieldEmail(props: { value: string; onChange: (v: string) => void; disabled?: boolean; label: string }) {
  return <Field icon={<Mail className="w-3.5 h-3.5" />} type="email" placeholder="tu@email.com" {...props} />;
}

function FieldPassword({
  value, onChange, disabled, label, visible, onToggleVisibility, placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  label: string;
  visible: boolean;
  onToggleVisibility: () => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">{label}</label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder || '••••••••'}
          className="w-full pl-9 pr-9 py-2.5 text-[13px] bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all placeholder:text-gray-400 disabled:bg-gray-50"
          required
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          tabIndex={-1}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1 transition-colors"
        >
          {visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}

function SubmitButton({ loading, label, loadingLabel }: { loading: boolean; label: string; loadingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className={`w-full mt-1 py-2.5 px-4 rounded-md text-white text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-colors ${
        loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-gray-800'
      }`}
    >
      {loading ? (
        <>
          <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          {loadingLabel}
        </>
      ) : (
        <>
          {label}
          <ArrowRight className="w-3.5 h-3.5" />
        </>
      )}
    </button>
  );
}

function GoogleButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className={`w-full py-2.5 px-4 rounded-md text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors bg-white hover:bg-gray-50 text-gray-700 ${
        loading ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      style={{ border: '1px solid #E8E5DE' }}
    >
      <svg width="16" height="16" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      </svg>
      Continuar con Google
    </button>
  );
}
