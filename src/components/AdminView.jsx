import { useState, useEffect } from 'react';
import { Users, Clock, FileText, LayoutDashboard, Download, FileSpreadsheet } from 'lucide-react';
import { styles } from '../styles/styles';
import { exportToCSV } from '../utils/helpers';
import { supabase } from '../supabaseClient';
import LiveClock from './LiveClock';
import TabNavigation from './TabNavigation';
import AdminDashboard from './AdminDashboard';
import ProjectManagement from './ProjectManagement';
import TaskManagement from './TaskManagement';
import UserManagement from './UserManagement';
import SettingsManagement from './SettingsManagement';
import LanguageToggle from './LanguageToggle';
import { useLanguage } from '../contexts/LanguageContext';
import * as XLSX from 'xlsx';

const AdminView = ({ currentUser, students, timeEntries, onLogout, onRefresh }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchTasks();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleRefreshAll = async () => {
    await onRefresh();
    await fetchProjects();
    await fetchTasks();
  };

  const handleStatusChange = async (id, status) => {
    try {
      const { error } = await supabase
        .from('time_entries')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      await onRefresh();
      alert(`Time entry ${status} successfully!`);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    }
  };

const downloadTimesheet = async () => {
  if (!selectedStudent) {
    alert('Please select a student');
    return;
  }

  setLoading(true);

  try {
    const studentId = parseInt(selectedStudent);
    const student = students.find(s => s.id === studentId || s.id === selectedStudent);
    
    if (!student) {
      alert('Student not found');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('student_id', studentId);

    if (error) throw error;
    
    if (!data || data.length === 0) {
      alert('No timesheet data found for this student');
      setLoading(false);
      return;
    }

    // Filter by date if provided
    let filteredData = data;
    if (dateFrom || dateTo) {
      filteredData = data.filter(entry => {
        const entryDate = entry.date;
        if (dateFrom && entryDate < dateFrom) return false;
        if (dateTo && entryDate > dateTo) return false;
        return true;
      });
    }

    if (filteredData.length === 0) {
      alert('No timesheet data found for selected date range');
      setLoading(false);
      return;
    }

    const excelData = filteredData.map(entry => ({
      'Date': entry.date,
      'Start Time': entry.start_time,
      'End Time': entry.end_time,
      'Total Hours': entry.total_hours
    }));

    const totalHours = filteredData.reduce((sum, entry) => 
      sum + parseFloat(entry.total_hours || 0), 0
    );

    const finalData = [
      { 'Date': 'Student:', 'Start Time': student.name },
      { 'Date': 'Email:', 'Start Time': student.email },
      {},
      ...excelData,
      {},
      { 'Date': 'TOTAL HOURS:', 'Total Hours': totalHours.toFixed(2) }
    ];

    const ws = XLSX.utils.json_to_sheet(finalData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Timesheet');

    XLSX.writeFile(wb, `${student.name.replace(/\s/g, '_')}_Timesheet.xlsx`);
    setLoading(false);
    alert('Timesheet downloaded successfully!');
  } catch (err) {
    alert(`Error: ${err.message}`);
    setLoading(false);
  }
};

  const tabs = [
    { id: 'dashboard', label: t.nav.dashboard, icon: <LayoutDashboard size={18} />
     ,   color : '#ffffff' 
 },
    { id: 'projects', label: t.nav.projects , icon: null },
    { id: 'tasks', label: t.nav.tasks, icon: null },
    { id: 'users', label: t.nav.users, icon: null },
    { id: 'timesheets', label: t.nav.timesheets, icon: null },
    { id: 'settings', label: t.nav.settings, icon: null }  
  ];

  return (
    <div style={styles.app}>
      <nav style={styles.navbar}>
        <div style={styles.navContent}>
          <div style={styles.navLeft}>
            <Users size={32} style={{marginRight: '12px'}} />
            <div>
              <h1 style={styles.navTitle}>Admin Dashboard</h1>
              <p style={styles.navSubtitle}>Time Management System</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {activeTab === 'timesheets' && (
              <button onClick={() => exportToCSV(timeEntries, students)} style={styles.exportButton}>
                <FileText size={18} />
                Export CSV
              </button>
            )}
            <LanguageToggle />
            <button
              onClick={onLogout}
              style={{...styles.button, background: '#5568d3'}}
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div style={styles.container}>
        <LiveClock />

        <TabNavigation 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={tabs}
        />

        {activeTab === 'dashboard' && (
          <AdminDashboard
            students={students}
            projects={projects}
            tasks={tasks}
            timeEntries={timeEntries}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectManagement 
            currentUser={currentUser}
            students={students}
            onRefresh={handleRefreshAll}
          />
        )}

        {activeTab === 'tasks' && (
          <TaskManagement 
            currentUser={currentUser}
            students={students}
            onRefresh={handleRefreshAll}
          />
        )}

        {activeTab === 'users' && (
          <UserManagement 
            students={students}
            onRefresh={handleRefreshAll}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsManagement currentUser={currentUser} />
        )}

        {activeTab === 'timesheets' && (
          <div>
            {/* Download Student Timesheet */}
            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              marginBottom: '24px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <FileSpreadsheet size={20} />
                Download Student Timesheet
              </h3>

              <div style={{ display: 'grid', gap: '12px' }}>
                {/* Student Dropdown */}
                <div>
                  <label style={{ display: 'block', fontSize: '14px', marginBottom: '6px', fontWeight: '500' }}>
                    Select Student
                  </label>
                  <select
                    value={selectedStudent}
                    onChange={(e) => {
                      console.log('Dropdown changed to:', e.target.value);
                      setSelectedStudent(e.target.value);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">-- Choose Student --</option>
                    {students.filter(s => s.role === 'student').map(student => (
                      <option key={student.id} value={student.id}>
                        {student.name} ({student.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Range */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', marginBottom: '6px', fontWeight: '500' }}>
                      From Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', marginBottom: '6px', fontWeight: '500' }}>
                      To Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>

                {/* Download Button */}
                <button
                  onClick={downloadTimesheet}
                  disabled={loading || !selectedStudent}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px',
                    background: loading || !selectedStudent ? '#9ca3af' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: '500',
                    cursor: loading || !selectedStudent ? 'not-allowed' : 'pointer',
                    marginTop: '8px'
                  }}
                >
                  <Download size={18} />
                  {loading ? 'Generating...' : 'Download Timesheet'}
                </button>
              </div>
            </div>

            {/* All Time Entries Table */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>All Time Entries</h2>
              
              <div style={{overflowX: 'auto'}}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Student</th>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Time</th>
                      <th style={styles.th}>Hours</th>
                      <th style={styles.th}>Project</th>
                      <th style={styles.th}>Task</th>
                      <th style={styles.th}>Description</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timeEntries.map(entry => {
                      const student = students.find(s => s.id === entry.student_id);
                      const project = projects.find(p => p.id === entry.project_id);
                      const task = tasks.find(t => t.id === entry.task_id);
                      
                      return (
                        <tr key={entry.id} style={entry.status === 'pending' ? {background: '#fef3c7'} : {}}>
                          <td style={{...styles.td, fontWeight: '600'}}>{student?.name}</td>
                          <td style={styles.td}>{entry.date}</td>
                          <td style={styles.td}>{entry.start_time} - {entry.end_time}</td>
                          <td style={{...styles.td, fontWeight: '600'}}>{entry.total_hours}h</td>
                          <td style={styles.td}>
                            {project ? (
                              <span style={{
                                ...styles.badge,
                                background: project.color + '20',
                                color: project.color,
                                border: `2px solid ${project.color}`
                              }}>
                                {project.name}
                              </span>
                            ) : 'Unknown'}
                          </td>
                          <td style={styles.td}>{task?.title || 'Unknown'}</td>
                          <td style={{...styles.td, color: '#666'}}>{entry.description}</td>
                          <td style={styles.td}>
                            <span style={{
                              ...styles.badge,
                              ...(entry.status === 'approved' ? styles.badgeApproved :
                                  entry.status === 'rejected' ? styles.badgeRejected :
                                  styles.badgePending)
                            }}>
                              {entry.status}
                            </span>
                          </td>
                          <td style={styles.td}>
                            {entry.status === 'pending' && (
                              <div style={styles.buttonGroup}>
                                <button
                                  onClick={() => handleStatusChange(entry.id, 'approved')}
                                  style={styles.approveButton}
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleStatusChange(entry.id, 'rejected')}
                                  style={styles.rejectButton}
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                
                {timeEntries.length === 0 && (
                  <div style={styles.emptyState}>
                    No time entries to display
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminView;