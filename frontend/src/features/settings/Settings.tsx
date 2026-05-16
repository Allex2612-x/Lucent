import { ReactNode, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../components/ui/Modal';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Shield, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useAuthStore } from '../../store/useAuthStore';
import { sounds } from '../../utils/sounds';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  currency: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  currency?: string;
  avatarUrl?: string | null;
}

interface PasswordUpdateData {
  oldPassword: string;
  newPassword: string;
}

interface Preferences {
  darkTheme: boolean;
  euDateFormat: boolean;
  sounds: boolean;
}

type Tab = 'profile' | 'security' | 'preferences' | 'notifications' | 'data';

function SettingsSection({
  title,
  sub,
  children,
}: {
  title: string;
  sub: string;
  children: ReactNode;
}) {
  return (
    <div className="settings-section">
      <div>
        <div className="settings-section-title">{title}</div>
        <div className="settings-section-sub">{sub}</div>
      </div>
      <div className="settings-section-body">{children}</div>
    </div>
  );
}

function ToggleRow({
  label,
  sub,
  on,
  onChange,
  isLast,
}: {
  label: string;
  sub: string;
  on: boolean;
  onChange: () => void;
  isLast?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 0',
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{sub}</div>
      </div>
      <button
        type="button"
        className={`toggle${on ? ' on' : ''}`}
        onClick={onChange}
        aria-pressed={on}
        aria-label={label}
      />
    </div>
  );
}

function initials(first?: string, last?: string) {
  const a = first?.trim()?.[0] ?? '';
  const b = last?.trim()?.[0] ?? '';
  return (a + b).toUpperCase() || 'AS';
}

export function Settings() {
  const queryClient = useQueryClient();
  const setAuthUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('profile');
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const [profileData, setProfileData] = useState<ProfileUpdateData>({
    firstName: '',
    lastName: '',
    currency: 'RON',
  });
  const [passwordData, setPasswordData] = useState<PasswordUpdateData>({
    oldPassword: '',
    newPassword: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [preferences, setPreferences] = useState<Preferences>(() => {
    try {
      const raw = localStorage.getItem('faro-preferences');
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          darkTheme: !!parsed.darkTheme,
          euDateFormat: parsed.euDateFormat !== false,
          sounds: parsed.sounds !== false,
        };
      }
    } catch {}
    return { darkTheme: false, euDateFormat: true, sounds: true };
  });

  // Persist preferences + apply dark theme to document root
  useEffect(() => {
    try {
      localStorage.setItem('faro-preferences', JSON.stringify(preferences));
    } catch {}
    document.documentElement.dataset.theme = preferences.darkTheme ? 'dark' : 'light';
    window.dispatchEvent(new CustomEvent('faro-preferences-changed', { detail: preferences }));
  }, [preferences]);

  const { data: userResponse, isLoading } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => api.get<{ success: boolean; data: UserProfile }>('/users/me'),
  });
  const user = userResponse?.data?.data;

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        currency: user.currency || 'RON',
      });
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileUpdateData) => api.patch('/users/me', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      const updated = res.data?.data;
      if (updated && setAuthUser) {
        setAuthUser(updated);
      }
      toast.success('Profilul a fost actualizat cu succes!');
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message || 'Eroare la actualizarea profilului.'),
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (data: PasswordUpdateData) => api.patch('/users/me/password', data),
    onSuccess: () => {
      setPasswordData({ oldPassword: '', newPassword: '' });
      setConfirmPassword('');
      toast.success('Parola a fost schimbată cu succes!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Eroare la schimbarea parolei';
      toast.error(message);
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: () => api.delete('/users/me'),
    onSuccess: () => {
      toast.success('Contul a fost șters.');
      logout();
      navigate('/login', { replace: true });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Eroare la ștergerea contului.');
    },
  });

  /**
   * Reads an image File, downscales to max 512px on the long edge using a
   * canvas, then JSON-PATCHes the user with a base64 data URL.
   */
  const handleAvatarFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Te rugăm să alegi o imagine.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imaginea trebuie să aibă maxim 2 MB.');
      return;
    }
    setAvatarUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const max = 512;
          const ratio = Math.min(1, max / Math.max(img.width, img.height));
          const w = Math.round(img.width * ratio);
          const h = Math.round(img.height * ratio);
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Canvas indisponibil'));
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => reject(new Error('Imaginea nu poate fi citită'));
        const reader = new FileReader();
        reader.onload = () => (img.src = reader.result as string);
        reader.onerror = () => reject(new Error('Imaginea nu poate fi citită'));
        reader.readAsDataURL(file);
      });
      const res = await api.patch('/users/me', { avatarUrl: dataUrl });
      const updated = res.data?.data;
      if (updated && setAuthUser) setAuthUser(updated);
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      toast.success('Fotografie actualizată.');
    } catch (err: any) {
      toast.error(err?.message || 'Eroare la încărcare.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleAvatarRemove = async () => {
    setAvatarUploading(true);
    try {
      const res = await api.patch('/users/me', { avatarUrl: null });
      const updated = res.data?.data;
      if (updated && setAuthUser) setAuthUser(updated);
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      toast.success('Fotografie eliminată.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Eroare la eliminare.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((profileData.firstName ?? '').trim().length < 2) {
      toast.error('Prenumele trebuie să aibă cel puțin 2 caractere.');
      return;
    }
    if ((profileData.lastName ?? '').trim().length < 2) {
      toast.error('Numele trebuie să aibă cel puțin 2 caractere.');
      return;
    }
    updateProfileMutation.mutate({
      firstName: profileData.firstName?.trim(),
      lastName: profileData.lastName?.trim(),
      currency: profileData.currency,
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== confirmPassword) {
      toast.error('Parolele nu coincid');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Parola nouă trebuie să aibă cel puțin 6 caractere');
      return;
    }
    updatePasswordMutation.mutate(passwordData);
  };

  const togglePref = (key: keyof Preferences) => {
    setPreferences((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      // play after state update so sounds.click() respects the new flag
      setTimeout(() => sounds.click(), 0);
      return next;
    });
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'profile', label: 'Profil' },
    { id: 'security', label: 'Securitate' },
    { id: 'preferences', label: 'Preferințe' },
    { id: 'notifications', label: 'Notificări' },
    { id: 'data', label: 'Date' },
  ];

  if (isLoading) {
    return (
      <>
        <div className="page-head">
          <div>
            <div className="page-title">Setări</div>
            <div className="page-sub">Gestionează profilul, securitatea și preferințele.</div>
          </div>
        </div>
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)' }}>Se încarcă...</div>
      </>
    );
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Setări</div>
          <div className="page-sub">
            Gestionează profilul, securitatea și preferințele aplicației.
          </div>
        </div>
      </div>

      <div className="settings-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`settings-tab${t.id === tab ? ' on' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <SettingsSection
          title="Profil"
          sub="Cum apari în aplicație și pe rapoartele tale exportate."
        >
          <form onSubmit={handleProfileSubmit}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22 }}>
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="Fotografie profil"
                  style={{ width: 64, height: 64, borderRadius: 16, objectFit: 'cover' }}
                />
              ) : (
                <div
                  className="sb-avatar"
                  style={{ width: 64, height: 64, fontSize: 22, borderRadius: 16 }}
                >
                  {initials(profileData.firstName, profileData.lastName)}
                </div>
              )}
              <div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => avatarFileRef.current?.click()}
                    disabled={avatarUploading}
                  >
                    {avatarUploading ? 'Se încarcă...' : user?.avatarUrl ? 'Schimbă' : 'Încarcă fotografie'}
                  </Button>
                  {user?.avatarUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleAvatarRemove}
                      disabled={avatarUploading}
                    >
                      Elimină
                    </Button>
                  )}
                </div>
                <input
                  ref={avatarFileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAvatarFile(file);
                    e.target.value = '';
                  }}
                />
                <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 6 }}>
                  PNG sau JPG, max. 2 MB. Se redimensionează automat la 512px.
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Input
                label="Prenume"
                value={profileData.firstName}
                onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                required
              />
              <Input
                label="Nume"
                value={profileData.lastName}
                onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                required
              />
              <div style={{ gridColumn: 'span 2' }}>
                <Input label="Email" type="email" value={user?.email || ''} disabled />
              </div>
              <Select
                label="Monedă preferată"
                value={profileData.currency}
                onChange={(e) => setProfileData({ ...profileData, currency: e.target.value })}
                options={[
                  { value: 'RON', label: 'RON — Leu românesc' },
                  { value: 'EUR', label: 'EUR — Euro' },
                  { value: 'USD', label: 'USD — Dolar american' },
                ]}
              />
              <Select
                label="Fus orar"
                value="Europe/Bucharest"
                onChange={() => undefined}
                options={[{ value: 'Europe/Bucharest', label: 'Europe/Bucharest (UTC+3)' }]}
                disabled
              />
            </div>

            <div style={{ marginTop: 18, display: 'flex', gap: 8 }}>
              <Button type="submit" variant="primary" disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? 'Se salvează...' : 'Salvează modificările'}
              </Button>
              <Button type="button" variant="ghost">
                Anulează
              </Button>
            </div>
          </form>
        </SettingsSection>
      )}

      {tab === 'security' && (
        <SettingsSection
          title="Securitate"
          sub="Parolă și sesiuni active. Recomandăm o parolă unică, generată."
        >
          <div
            style={{
              display: 'flex',
              gap: 14,
              padding: 16,
              background: 'var(--bg-subtle)',
              borderRadius: 12,
              alignItems: 'center',
              marginBottom: 16,
              border: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                background: 'var(--income-soft)',
                color: 'var(--income)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Shield size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Contul tău este protejat</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                Sesiune securizată cu JWT (access 15m + refresh 7d)
              </div>
            </div>
            <span
              className="chip"
              style={{
                background: 'var(--income-soft)',
                color: 'var(--income)',
                border: 'none',
                fontWeight: 600,
              }}
            >
              Activ
            </span>
          </div>

          <form onSubmit={handlePasswordSubmit}>
            <div style={{ display: 'grid', gap: 14 }}>
              <Input
                label="Parolă curentă"
                type="password"
                value={passwordData.oldPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, oldPassword: e.target.value })
                }
                required
              />
              <Input
                label="Parolă nouă"
                type="password"
                placeholder="Min. 6 caractere"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, newPassword: e.target.value })
                }
                required
              />
              <Input
                label="Confirmă parola"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <div style={{ marginTop: 18, display: 'flex', gap: 8 }}>
              <Button type="submit" variant="primary" disabled={updatePasswordMutation.isPending}>
                {updatePasswordMutation.isPending ? 'Se schimbă...' : 'Schimbă parola'}
              </Button>
            </div>
          </form>

          <div style={{ marginTop: 28 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Sesiuni active</div>
            {[
              { dev: 'Acest browser', loc: 'Sesiunea curentă', current: true },
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  marginBottom: 8,
                  background: '#fff',
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    background: 'var(--bg-inset)',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  💻
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>
                    {s.dev}{' '}
                    {s.current && (
                      <span
                        className="chip"
                        style={{
                          background: 'var(--accent-soft)',
                          color: 'var(--accent-ink)',
                          border: 'none',
                          marginLeft: 6,
                        }}
                      >
                        Curent
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{s.loc}</div>
                </div>
              </div>
            ))}
          </div>
        </SettingsSection>
      )}

      {tab === 'preferences' && (
        <SettingsSection
          title="Preferințe"
          sub="Personalizează cum arată FARO pentru tine."
        >
          <ToggleRow
            label="Temă întunecată"
            sub="Comută între temă luminoasă și întunecată"
            on={preferences.darkTheme}
            onChange={() => togglePref('darkTheme')}
          />
          <ToggleRow
            label="Format dată european"
            sub="dd/MM/yyyy (recomandat pentru România)"
            on={preferences.euDateFormat}
            onChange={() => togglePref('euDateFormat')}
          />
          <ToggleRow
            label="Sunete în aplicație"
            sub="Mici feedback-uri sonore la acțiuni-cheie"
            on={preferences.sounds}
            onChange={() => togglePref('sounds')}
            isLast
          />
        </SettingsSection>
      )}

      {tab === 'notifications' && (
        <SettingsSection
          title="Notificări"
          sub="Alege ce tip de notificări vrei să primești în aplicație."
        >
          <ToggleRow
            label="Avertizări depășire buget"
            sub="Te notificăm când o categorie depășește limita"
            on
            onChange={() => undefined}
          />
          <ToggleRow
            label="Avertizări aproape de limită"
            sub="Te notificăm la 80% din limita unei categorii"
            on
            onChange={() => undefined}
          />
          <ToggleRow
            label="Confirmări tranzacții recurente"
            sub="Anunț la fiecare tranzacție programată recurent"
            on={false}
            onChange={() => undefined}
            isLast
          />
        </SettingsSection>
      )}

      {tab === 'data' && (
        <SettingsSection
          title="Date"
          sub="Acțiuni ireversibile asupra contului tău."
        >
          <div
            style={{
              padding: 18,
              border: '1px solid var(--expense-soft)',
              borderRadius: 12,
              background: 'rgba(245,85,110,0.04)',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--expense)' }}>
              Șterge contul
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: 'var(--text-2)',
                marginTop: 4,
                marginBottom: 12,
                lineHeight: 1.5,
              }}
            >
              Toate tranzacțiile, bugetele, categoriile personalizate și rapoartele se vor șterge
              definitiv. Această acțiune nu poate fi anulată.
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                setDeleteConfirmText('');
                setIsDeleteOpen(true);
              }}
              style={{
                color: 'var(--expense)',
                borderColor: 'var(--expense)',
              }}
            >
              <Trash2 size={12} /> Șterge contul FARO
            </Button>
          </div>
        </SettingsSection>
      )}

      {/* Delete account confirmation */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Confirmare ștergere cont"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsDeleteOpen(false)}>
              Anulează
            </Button>
            <Button
              variant="danger"
              disabled={deleteConfirmText !== 'STERGE' || deleteAccountMutation.isPending}
              onClick={() => deleteAccountMutation.mutate()}
            >
              {deleteAccountMutation.isPending ? 'Se șterge...' : 'Șterge definitiv'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div
            style={{
              padding: 14,
              border: '1px solid var(--expense-soft)',
              borderRadius: 12,
              background: 'rgba(245,85,110,0.04)',
              fontSize: 13,
              lineHeight: 1.5,
              color: 'var(--text-2)',
            }}
          >
            Vei pierde definitiv toate tranzacțiile, bugetele, categoriile personalizate și
            insight-urile generate pentru contul <b style={{ color: 'var(--text-1)' }}>{user?.email}</b>. Această
            acțiune nu poate fi anulată.
          </div>
          <div className="field">
            <label>
              Scrie <b style={{ color: 'var(--expense)' }}>STERGE</b> ca să confirmi:
            </label>
            <input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="STERGE"
              autoFocus
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
