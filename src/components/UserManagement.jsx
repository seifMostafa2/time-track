import { useState } from 'react';
import { UserPlus, Trash2, Key } from 'lucide-react';
import { styles } from '../styles/styles';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';


const UserManagement = ({ students, onRefresh }) => {
  const { t } = useLanguage();
  const { signUp, userProfile } = useAuth();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
  });

  const handleAddUser = async (e) => {
    e.preventDefault();

    if (!newUser.name || !newUser.email || !newUser.password) {
      alert(t.users?.fillAllFields || 'Bitte füllen Sie alle Felder aus');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      alert(t.users?.invalidEmail || 'Bitte geben Sie eine gültige E-Mail-Adresse ein');
      return;
    }

    if (newUser.password.length < 6) {
      alert(t.users?.passwordTooShort || 'Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    // Role-based permission check
    if (userProfile?.role === 'hr' && newUser.role !== 'student') {
      alert('HR users can only create Student accounts. Please contact an Administrator to create HR or Admin accounts.');
      return;
    }

    try {
      // Create user via Supabase Auth
      const { error } = await signUp(newUser.email, newUser.password, {
        name: newUser.name,
        role: newUser.role,
      });

      if (error) {
        console.error('Sign up error:', error);
        if (error.message.includes('already registered')) {
          alert(t.users?.emailExists || 'Diese E-Mail ist bereits registriert. Bitte verwenden Sie eine andere E-Mail.');
        } else {
          alert(`${t.common?.errorCreating || 'Fehler beim Erstellen'}: ${error.message}`);
        }
        return;
      }

      // Success message with placeholders
      const msgTemplate =
        t.users?.createdSuccess ||
        'Benutzer erfolgreich erstellt!\n\nName: {name}\nE-Mail: {email}\nTemporäres Passwort: {password}\n\n⚠️ Bitte teilen Sie diese Anmeldedaten sicher mit dem Benutzer.';
      alert(
        msgTemplate
          .replace('{name}', newUser.name)
          .replace('{email}', newUser.email)
          .replace('{password}', newUser.password)
      );

      setNewUser({ name: '', email: '', password: '', role: 'student' });
      setShowAddForm(false);
      await onRefresh?.();
    } catch (error) {
      console.error('Error creating user:', error);
      alert(t.common?.errorCreating || 'Fehler beim Erstellen');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    const confirmMsg =
      (t.users?.confirmDelete && `${t.users.confirmDelete} "${userName}"?\n\n${t.users?.deleteWarning || ''}`) ||
      `Sind Sie sicher, dass Sie den Benutzer "${userName}" löschen möchten?\n\nDadurch werden auch alle Zeiteinträge dauerhaft gelöscht.\n\nDiese Aktion kann nicht rückgängig gemacht werden.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const { error: entriesError } = await supabase.from('time_entries').delete().eq('student_id', userId);
      if (entriesError) {
        console.error('Error deleting time entries:', entriesError);
        alert((t.common?.errorDeleting || 'Fehler beim Löschen') + `: ${entriesError.message}`);
        return;
      }

      const { error: userError } = await supabase.from('students').delete().eq('id', userId);
      if (userError) {
        console.error('Error deleting user:', userError);
        alert((t.common?.errorDeleting || 'Fehler beim Löschen') + `: ${userError.message}`);
        return;
      }

      alert(t.users?.userDeleted || 'Benutzer erfolgreich gelöscht!');
      await onRefresh?.();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(t.common?.errorDeleting || 'Fehler beim Löschen');
    }
  };

  const generatePassword = () => {
    const length = 8;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setNewUser({ ...newUser, password });
  };

  const txt = {
    title: t.users?.title || 'Benutzerverwaltung',
    addUser: t.users?.addUser || 'Neuen Benutzer hinzufügen',
    createUser: t.users?.createUser || 'Benutzerkonto erstellen',
    fullName: t.users?.fullName || 'Vollständiger Name',
    fullNamePh: t.users?.fullNamePlaceholder || 'Max Mustermann',
    email: t.users?.email || 'E-Mail',
    emailPh: t.users?.emailPlaceholder || 'max@company.com',
    role: t.users?.role || 'Rolle',
    student: t.users?.student || 'Student',
    admin: t.users?.admin || 'Administrator',
    tempPw: t.users?.temporaryPassword || 'Temporäres Passwort',
    pwPh: t.users?.passwordPlaceholder || 'Passwort eingeben',
    genPw: t.users?.generatePassword || 'Zufälliges Passwort generieren',
    status: t.users?.status || 'Status',
    needsPwChange: t.users?.needsPasswordChange || 'Benötigt Passwortänderung',
    active: t.users?.active || 'Aktiv',
    created: t.users?.created || 'Erstellt',
    actions: t.users?.actions || 'Aktionen',
    noUsers: t.users?.noUsers || 'Noch keine Benutzer.',
    cancel: t.common?.cancel || 'Abbrechen',
  };

  return (
    <div style={styles.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={styles.cardTitle}>
          <UserPlus size={20} />
          {txt.title}
        </h2>
        <button onClick={() => setShowAddForm(!showAddForm)} style={styles.button}>
          {showAddForm ? txt.cancel : txt.addUser}
        </button>
      </div>

      {showAddForm && (
        <form
          onSubmit={handleAddUser}
          style={{ marginBottom: '24px', padding: '20px', background: '#f9fafb', borderRadius: '8px' }}
        >
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>{txt.fullName}</label>
              <input
                type="text"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                placeholder={txt.fullNamePh}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>{txt.email}</label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder={txt.emailPh}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>{txt.role}</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                style={styles.input}
              >
                <option value="student">{txt.student}</option>
                {/* HR can only create students, Admin can create all roles */}
                {userProfile?.role === 'admin' && (
                  <>
                    <option value="hr">HR</option>
                    <option value="admin">{txt.admin}</option>
                  </>
                )}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>{txt.tempPw}</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder={txt.pwPh}
                  required
                  style={{ ...styles.input, flex: 5, width: 200 }}
                />
                <button
                  type="button"
                  onClick={generatePassword}
                  style={{ ...styles.button, padding: '10px 16px' }}
                  title={txt.genPw}
                  aria-label={txt.genPw}
                >
                  <Key size={16} />
                </button>
              </div>
            </div>
          </div>

          <button type="submit" style={{ ...styles.button, width: '100%' }}>
            {txt.createUser}
          </button>
        </form>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>{txt.fullName}</th>
              <th style={styles.th}>{txt.email}</th>
              <th style={styles.th}>{txt.role}</th>
              <th style={styles.th}>{txt.status}</th>
              <th style={styles.th}>{txt.created}</th>
              <th style={styles.th}>{txt.actions}</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 && (
              <tr>
                <td style={styles.td} colSpan={6}>
                  {txt.noUsers}
                </td>
              </tr>
            )}

            {students.map((student) => (
              <tr key={student.id}>
                <td style={styles.td}>{student.name}</td>
                <td style={styles.td}>{student.email}</td>
                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.badge,
                      ...(student.role === 'admin'
                        ? { background: '#dbeafe', color: '#1e40af' }
                        : student.role === 'hr'
                        ? { background: '#fce7f3', color: '#9f1239' }
                        : styles.badgePending),
                    }}
                  >
                    {student.role === 'admin'
                      ? txt.admin
                      : student.role === 'hr'
                      ? 'HR'
                      : txt.student}
                  </span>
                </td>
                <td style={styles.td}>
                  {student.first_login ? (
                    <span style={{ ...styles.badge, background: '#fef3c7', color: '#92400e' }}>
                      {txt.needsPwChange}
                    </span>
                  ) : (
                    <span style={{ ...styles.badge, background: '#d1fae5', color: '#065f46' }}>{txt.active}</span>
                  )}
                </td>
                <td style={styles.td}>{new Date(student.created_at).toLocaleDateString()}</td>
                <td style={styles.td}>
                  {student.email !== 'admin@company.com' && (
                    <button
                      onClick={() => handleDeleteUser(student.id, student.name)}
                      style={{ ...styles.iconButton, color: '#ef4444' }}
                      aria-label={t.users?.deleteUser || 'Benutzer löschen'}
                      title={t.users?.deleteUser || 'Benutzer löschen'}
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
