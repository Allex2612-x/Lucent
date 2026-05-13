import { ReactNode, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Shield, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useAuthStore } from '../../store/useAuthStore';

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
}

interface PasswordUpdateData {
  oldPassword: string;
  newPassword: string;
}

interface Preferences {
  darkTheme: boolean;
  euDateFormat: boolean;
  compact: boolean;
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

  const [tab, setTab] = useState<Tab>('profile');

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
  const [preferences, setPreferences] = useState<Preferences>({
    darkTheme: false,
    euDateFormat: true,
    compact: false,
    sounds: true,
  });

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

  const togglePref = (key: keyof Preferences) =>
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));

  const tabs: { id: Tab; label: string }[] = [
    { id: 'profile', label: 'Profil' },
    { id: 'security', label: 'Securitate' },
    { id: 'preferences', label: 'Preferințe' },
    { id: 'notifications', label: 'Notificări' },
    { id: 'data', label: 'Date & Export' },
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
              <div
                className="sb-avatar"
                style={{ width: 64, height: 64, fontSize: 22, borderRadius: 16 }}
              >
                {initials(profileData.firstName, profileData.lastName)}
              </div>
              <div>
                <Button type="button" variant="secondary" disabled>
                  Încarcă fotografie
                </Button>
                <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 6 }}>
                  PNG sau JPG, max. 2 MB
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
          sub="Personalizează cum arată Sasha pentru tine."
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
            label="Mod compact"
            sub="Listă mai densă în tabele, fără pierderi de info"
            on={preferences.compact}
            onChange={() => togglePref('compact')}
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
          title="Date & Export"
          sub="Exportă-ți datele sau șterge contul definitiv."
        >
          <div
            style={{
              padding: 18,
              border: '1px solid var(--border)',
              borderRadius: 12,
              background: 'var(--bg-subtle)',
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600 }}>Exportă toate datele</div>
            <div
              style={{
                fontSize: 12.5,
                color: 'var(--text-2)',
                marginTop: 4,
                marginBottom: 12,
                lineHeight: 1.5,
              }}
            >
              Descarcă toate tranzacțiile, bugetele și categoriile într-un fișier JSON sau Excel.
            </div>
            <Button variant="secondary">Descarcă export</Button>
          </div>

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
              style={{
                color: 'var(--expense)',
                borderColor: 'var(--expense)',
              }}
            >
              <Trash2 size={12} /> Șterge contul Sasha
            </Button>
          </div>
        </SettingsSection>
      )}
    </>
  );
}
