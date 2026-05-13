import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { User, Lock } from 'lucide-react';
import { tokens } from '../../styles/colors';

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

export function Settings() {
  const queryClient = useQueryClient();

  // Profile form state
  const [profileData, setProfileData] = useState<ProfileUpdateData>({
    firstName: '',
    lastName: '',
    currency: 'RON',
  });

  // Password form state
  const [passwordData, setPasswordData] = useState<PasswordUpdateData>({
    oldPassword: '',
    newPassword: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Fetch user profile
  const { data: userResponse, isLoading } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => api.get<{ success: boolean; data: UserProfile }>('/users/me'),
  });

  const user = userResponse?.data?.data;

  // Update form when user data is loaded
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        currency: user.currency || 'RON',
      });
    }
  }, [user]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileUpdateData) => api.patch('/users/me', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      setProfileSuccess('Profilul a fost actualizat cu succes!');
      setTimeout(() => setProfileSuccess(''), 3000);
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: (data: PasswordUpdateData) => api.patch('/users/me/password', data),
    onSuccess: () => {
      setPasswordData({ oldPassword: '', newPassword: '' });
      setConfirmPassword('');
      setPasswordError('');
      setPasswordSuccess('Parola a fost schimbată cu succes!');
      setTimeout(() => setPasswordSuccess(''), 3000);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Eroare la schimbarea parolei';
      setPasswordError(message);
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    updateProfileMutation.mutate(profileData);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Client-side validation
    if (passwordData.newPassword !== confirmPassword) {
      setPasswordError('Parolele nu coincid');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('Parola nouă trebuie să aibă cel puțin 6 caractere');
      return;
    }

    updatePasswordMutation.mutate(passwordData);
  };

  if (isLoading) {
    return (
      <div className="settings-container">
        <div className="page-header">
          <div>
            <h1>Setări</h1>
            <p>Gestionează-ți profilul și preferințele contului.</p>
          </div>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
          Se încarcă...
        </div>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div className="page-header">
        <div>
          <h1>Setări</h1>
          <p>Gestionează-ți profilul și preferințele contului.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1.5rem', maxWidth: '800px' }}>
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={20} style={{ color: tokens['accent-primary'] }} />
              <h3>Informații Profil</h3>
            </div>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleProfileSubmit}>
              <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
                <Input
                  label="Prenume"
                  placeholder="Prenume"
                  value={profileData.firstName}
                  onChange={(e) =>
                    setProfileData({ ...profileData, firstName: e.target.value })
                  }
                  required
                />
                <Input
                  label="Nume"
                  placeholder="Nume"
                  value={profileData.lastName}
                  onChange={(e) =>
                    setProfileData({ ...profileData, lastName: e.target.value })
                  }
                  required
                />
                <div style={{ gridColumn: '1 / -1' }}>
                  <Input
                    label="Email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', cursor: 'not-allowed' }}
                  />
                </div>
                <Select
                  label="Monedă Preferată"
                  value={profileData.currency}
                  onChange={(e) =>
                    setProfileData({ ...profileData, currency: e.target.value })
                  }
                  options={[
                    { value: 'RON', label: 'RON - Leu Românesc' },
                    { value: 'EUR', label: 'EUR - Euro' },
                    { value: 'USD', label: 'USD - Dolar American' },
                  ]}
                />
              </div>

              {profileSuccess && (
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    color: '#10b981',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                >
                  {profileSuccess}
                </div>
              )}

              {updateProfileMutation.isError && (
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                  }}
                >
                  Eroare la actualizarea profilului. Încearcă din nou.
                </div>
              )}

              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? 'Se salvează...' : 'Salvează Modificările'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        {/* Change Password Section */}
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={20} style={{ color: tokens['accent-primary'] }} />
              <h3>Schimbă Parola</h3>
            </div>
          </CardHeader>
          <CardBody>
            <form onSubmit={handlePasswordSubmit}>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <Input
                  label="Parola Curentă"
                  type="password"
                  placeholder="Introdu parola curentă"
                  value={passwordData.oldPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, oldPassword: e.target.value })
                  }
                  required
                />
                <Input
                  label="Parola Nouă"
                  type="password"
                  placeholder="Minim 6 caractere"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                  required
                />
                <Input
                  label="Confirmă Parola Nouă"
                  type="password"
                  placeholder="Re-introdu parola nouă"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {passwordError && (
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                  }}
                >
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    color: '#10b981',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                >
                  {passwordSuccess}
                </div>
              )}

              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={updatePasswordMutation.isPending}
                >
                  {updatePasswordMutation.isPending ? 'Se schimbă...' : 'Schimbă Parola'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
