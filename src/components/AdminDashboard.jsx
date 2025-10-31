import { FolderKanban, Briefcase, Users, Clock, FileText } from 'lucide-react';
import { styles } from '../styles/styles';
import { getTotalHours } from '../utils/helpers';
import { useLanguage } from '../contexts/LanguageContext';
import ExcelReports from './ExcelReports';


const AdminDashboard = ({ students, projects, tasks, timeEntries, onNavigate }) => {
  const { t } = useLanguage();

  // Map raw enum → translated label (fallback to raw if missing)
  const statusText = (s) => (t.status?.[s] ?? s).replace('_', ' ');

  return (
    <div>
      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div>
            <p style={styles.statLabel}>{t.dashboard.totalStudents}</p>
            <p style={styles.statValue}>{students.filter(s => s.role === 'student').length}</p>
          </div>
          <Users size={48} color="#667eea" />
        </div>
        
        <div style={styles.statCard}>
          <div>
            <p style={styles.statLabel}>{t.dashboard.activeProjects}</p>
            <p style={styles.statValue}>{projects.length}</p>
          </div>
          <FolderKanban size={48} color="#7c3aed" />
        </div>

        <div style={styles.statCard}>
          <div>
            <p style={styles.statLabel}>{t.dashboard.totalTasks}</p>
            <p style={styles.statValue}>{tasks.length}</p>
          </div>
          <Briefcase size={48} color="#2563eb" />
        </div>
        
        <div style={styles.statCard}>
          <div>
            <p style={styles.statLabel}>{t.dashboard.totalHours}</p>
            <p style={styles.statValue}>{getTotalHours(timeEntries)}</p>
          </div>
          <Clock size={48} color="#10b981" />
        </div>
        
        <div style={styles.statCard}>
          <div>
            <p style={styles.statLabel}>{t.dashboard.pendingApprovals}</p>
            <p style={styles.statValue}>
              {timeEntries.filter(e => e.status === 'pending').length}
            </p>
          </div>
          <FileText size={48} color="#f59e0b" />
        </div>

        <div style={styles.statCard}>
          <div>
            <p style={styles.statLabel}>{t.dashboard.pendingTasks}</p>
            <p style={styles.statValue}>
              {tasks.filter(tk => tk.status === 'pending').length}
            </p>
          </div>
          <Briefcase size={48} color="#ef4444" />
        </div>
      </div>

      {/* Quick Actions */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>{t.dashboard.quickActions}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <button
            onClick={() => onNavigate('projects')}
            style={{ ...styles.button, padding: '20px', flexDirection: 'column', alignItems: 'center', gap: '12px', fontSize: '16px' }}
          >
            <FolderKanban size={32} />
            {t.dashboard.manageProjects}
          </button>

          <button
            onClick={() => onNavigate('tasks')}
            style={{ ...styles.button, padding: '20px', flexDirection: 'column', alignItems: 'center', gap: '12px', fontSize: '16px', background: '#7c3aed' }}
          >
            <Briefcase size={32} />
            {t.dashboard.manageTasks}
          </button>

          <button
            onClick={() => onNavigate('users')}
            style={{ ...styles.button, padding: '20px', flexDirection: 'column', alignItems: 'center', gap: '12px', fontSize: '16px', background: '#2563eb' }}
          >
            <Users size={32} />
            {t.dashboard.manageUsers}
          </button>

        </div>
      </div>

      {/* Recent Activity Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginTop: '24px' }}>
        {/* Recent Projects */}
        <div style={styles.card}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
            {t.dashboard.recentProjects}
          </h3>
          {projects.slice(0, 5).map(project => (
            <div key={project.id} style={{ padding: '8px', marginBottom: '8px', borderLeft: `4px solid ${project.color}`, background: '#f9fafb', borderRadius: '4px' }}>
              <div style={{ fontWeight: '500', fontSize: '14px' }}>{project.name}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>{project.description}</div>
            </div>
          ))}
        </div>

        {/* Recent Tasks */}
        <div style={styles.card}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
            {t.dashboard.recentTasks}
          </h3>
          {tasks.slice(0, 5).map(task => (
            <div key={task.id} style={{ padding: '8px', marginBottom: '8px', background: '#f9fafb', borderRadius: '4px' }}>
              <div style={{ fontWeight: '500', fontSize: '14px' }}>{task.title}</div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                <span
                  style={{
                    ...styles.badge,
                    ...(task.status === 'completed'
                      ? styles.badgeApproved
                      : task.status === 'in_progress'
                      ? { background: '#dbeafe', color: '#1e40af' }
                      : styles.badgePending),
                  }}
                >
                  {statusText(task.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
