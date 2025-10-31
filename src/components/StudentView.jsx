import { useState, useEffect } from 'react';
import { Clock, Calendar, Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { styles } from '../styles/styles';
import { supabase } from '../supabaseClient';
import LiveClock from './LiveClock';
import { calculateHours, getTotalHours, calculateAndRoundHours, formatRoundedTime } from '../utils/helpers';
import LanguageToggle from './LanguageToggle';


const StudentView = ({ currentUser, timeEntries, onLogout, onRefresh }) => {
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    project_id: '',
    task_id: '',
    description: ''
  });
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [availableTasks, setAvailableTasks] = useState([]);
  const [editingEntry, setEditingEntry] = useState(null);
  const [showOnlyToday, setShowOnlyToday] = useState(true);
  const [lockDateToToday, setLockDateToToday] = useState(false);


  const myEntries = timeEntries.filter(entry => entry.student_id === currentUser?.id);
  
  const displayedEntries = showOnlyToday 
    ? myEntries.filter(entry => entry.date === new Date().toISOString().split('T')[0])
    : myEntries;

  // Fetch assigned projects and tasks
  useEffect(() => {
    if (currentUser) {
      fetchAssignedProjects();
        fetchDateLockSetting();
      fetchTasks();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedProject) {
      const projectTasks = tasks.filter(t => t.project_id === parseInt(selectedProject));
      setAvailableTasks(projectTasks);
    } else {
      setAvailableTasks([]);
    }
  }, [selectedProject, tasks]);
   const fetchDateLockSetting = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'lock_date_to_today')
        .single();
      
      if (error) throw error;
      setLockDateToToday(data.setting_value === 'true');
    } catch (error) {
      console.error('Error fetching date lock setting:', error);
      setLockDateToToday(false); // Default to unlocked if error
    }
  };

const fetchAssignedProjects = async () => {
    try {
      // Get tasks assigned to student
      const { data: taskAssignments, error: taskAssignError } = await supabase
        .from('task_assignments')
        .select('task_id')
        .eq('student_id', currentUser.id);

      if (taskAssignError) throw taskAssignError;

      const taskIds = taskAssignments.map(a => a.task_id);

      // Get tasks with their project info
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('project_id')
        .in('id', taskIds);

      if (taskError) throw taskError;

      // Get unique project IDs
      const projectIds = [...new Set(taskData.map(t => t.project_id).filter(id => id !== null))];

      // Fetch project details
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .in('id', projectIds)
        .order('name');

      if (projectError) throw projectError;
      setProjects(projectData);
    } catch (error) {
      console.error('Error fetching assigned projects:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const { data: assignments, error: assignError } = await supabase
        .from('task_assignments')
        .select('task_id')
        .eq('student_id', currentUser.id);

      if (assignError) throw assignError;

      const taskIds = assignments.map(a => a.task_id);

      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .in('id', taskIds);

      if (taskError) throw taskError;
      setTasks(taskData);
    } catch (error) {
      console.error('Error fetching assigned tasks:', error);
    }
  };

  const handleAddEntry = async () => {
    const today = new Date().toISOString().split('T')[0];
    // Only validate date if lock is enabled
    if (lockDateToToday && newEntry.date !== today) {
      alert('You can only log hours for today. Date has been reset to today.');
      setNewEntry({ ...newEntry, date: today });
      return;
    }

    if (!newEntry.startTime || !newEntry.endTime || !newEntry.project_id || !newEntry.task_id) {
      alert('Please fill in all required fields including project and task');
      return;
    }

    // Prevent negative hours
    if (newEntry.endTime <= newEntry.startTime) {
      alert('End time must be after start time. Please check your time entries.');
      return;
    }

    const totalHours = parseFloat(calculateAndRoundHours(newEntry.startTime, newEntry.endTime));
    
    if (totalHours <= 0) {
      alert('Invalid time range. End time must be after start time.');
      return;
    }

    // Warn if working hours seem unusually long (more than 16 hours)
    if (totalHours > 16) {
      if (!window.confirm(`You're logging ${totalHours} hours. This seems like a very long work day. Are you sure this is correct?`)) {
        return;
      }
    }

    try {
      const { error } = await supabase
        .from('time_entries')
        .insert([
          {
            student_id: currentUser.id,
            date: newEntry.date,
            start_time: newEntry.startTime,
            end_time: newEntry.endTime,
            total_hours: totalHours,
            project_id: parseInt(newEntry.project_id),
            task_id: parseInt(newEntry.task_id),
            description: newEntry.description,
            status: 'pending'
          }
        ]);

      if (error) throw error;

      await onRefresh();
      
      setNewEntry({
        date: new Date().toISOString().split('T')[0],
        startTime: '',
        endTime: '',
        project_id: '',
        task_id: '',
        description: ''
      });
      setSelectedProject('');

      alert('Time entry added successfully!');
    } catch (error) {
      console.error('Error adding entry:', error);
      alert(`Error adding time entry: ${error.message || 'Unknown error'}`);
    }
  };

  const handleUpdateEntry = async (id) => {
    if (!editingEntry.start_time || !editingEntry.end_time) {
      alert('Please fill in all required fields');
      return;
    }

    const totalHours = parseFloat(calculateAndRoundHours(editingEntry.start_time, editingEntry.end_time));
    
    if (totalHours <= 0) {
      alert('End time must be after start time');
      return;
    }

    try {
      const { error } = await supabase
        .from('time_entries')
        .update({
          date: editingEntry.date,
          start_time: editingEntry.start_time,
          end_time: editingEntry.end_time,
          total_hours: totalHours,
          description: editingEntry.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      await onRefresh();
      setEditingEntry(null);
      alert('Time entry updated successfully!');
    } catch (error) {
      console.error('Error updating entry:', error);
      alert('Error updating time entry');
    }
  };

  const handleDeleteEntry = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;

    try {
      const { error } = await supabase
        .from('time_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await onRefresh();
      alert('Time entry deleted successfully!');
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Error deleting time entry');
    }
  };

  return (
    <div style={styles.app}>
      <nav style={styles.navbar}>
        <div style={styles.navContent}>
          <div style={styles.navLeft}>
            <Clock size={32} style={{marginRight: '12px'}} />
            <div>
              <h1 style={styles.navTitle}>Time Tracker</h1>
              <p style={styles.navSubtitle}>Welcome, {currentUser?.name}</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>

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
        
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>
            <Plus size={20} />
            Log Today's Hours - {new Date().toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            })}
          </h2>
          
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Date</label>
              <input
                type="date"
                value={newEntry.date}
                onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                readOnly={lockDateToToday}
                disabled={lockDateToToday}
                max={new Date().toISOString().split('T')[0]}
                style={{
                  ...styles.input,
                  background: lockDateToToday ? '#f9fafb' : 'white',
                  color: lockDateToToday ? '#666' : '#333',
                  cursor: lockDateToToday ? 'not-allowed' : 'pointer'
                }}
              />
              <div style={{fontSize: '12px', color: '#666', marginTop: '4px'}}>
                {lockDateToToday ? '✓ Locked to today\'s date' : '📅 You can select any date'}
              </div>
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Project *</label>
              <select
                value={newEntry.project_id}
                onChange={(e) => {
                  setNewEntry({ ...newEntry, project_id: e.target.value, task_id: '' });
                  setSelectedProject(e.target.value);
                }}
                required
                style={styles.input}
              >
                <option value="">Select project...</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
              {projects.length === 0 && (
                <div style={{fontSize: '12px', color: '#ef4444', marginTop: '4px'}}>
                  No projects assigned. Contact your administrator.
                </div>
              )}
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Task *</label>
              <select
                value={newEntry.task_id}
                onChange={(e) => setNewEntry({ ...newEntry, task_id: e.target.value })}
                required
                disabled={!selectedProject}
                style={{
                  ...styles.input,
                  background: !selectedProject ? '#f9fafb' : 'white',
                  cursor: !selectedProject ? 'not-allowed' : 'pointer'
                }}
              >
                <option value="">
                  {!selectedProject ? 'Select project first...' : 'Select task...'}
                </option>
                {availableTasks.map(task => (
                  <option key={task.id} value={task.id}>{task.title}</option>
                ))}
              </select>
              {selectedProject && availableTasks.length === 0 && (
                <div style={{fontSize: '12px', color: '#f59e0b', marginTop: '4px'}}>
                  No tasks available for this project.
                </div>
              )}
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Start Time</label>
              <input
                type="time"
                value={newEntry.startTime}
                onChange={(e) => setNewEntry({ ...newEntry, startTime: e.target.value })}
                min={newEntry.startTime}
                style={styles.input}
              />
              { newEntry.startTime && newEntry.endTime && newEntry.endTime <= newEntry.startTime && (
                <div style={{
                  fondSize : '12px',
                  color: '#ef4444',
                  marginTop: '4px',
                  fontWeight: '500'
                }}>
                    ENd thime must be after start time
          
                </div>
              )}
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>End Time</label>
              <input
                type="time"
                value={newEntry.endTime}
                onChange={(e) => setNewEntry({ ...newEntry, endTime: e.target.value })}
                style={styles.input}
              />
            </div>
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <textarea
              placeholder="What did you work on today?"
              value={newEntry.description}
              onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
              rows="3"
              style={styles.textarea}
            />
          </div>
          
          {newEntry.startTime && newEntry.endTime && (
            <div>
              {newEntry.endTime > newEntry.startTime ? (
                <>
                  <div style={{
                    background: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '12px',
                    color: '#0c4a6e',
                    fontSize: '14px'
                  }}>
                    <strong>Actual Time:</strong> {calculateHours(newEntry.startTime, newEntry.endTime)} hours ({(() => {
                      const [startHour, startMin] = newEntry.startTime.split(':').map(Number);
                      const [endHour, endMin] = newEntry.endTime.split(':').map(Number);
                      const totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
                      const hours = Math.floor(totalMinutes / 60);
                      const minutes = totalMinutes % 60;
                      return minutes === 0 ? `${hours} hrs` : `${hours} hrs ${minutes} min`;
                    })()})
                  </div>
                  <div style={styles.infoBox}>
                    <strong>Rounded Time (billed):</strong> {calculateAndRoundHours(newEntry.startTime, newEntry.endTime)} hours ({(() => {
                      const [startHour, startMin] = newEntry.startTime.split(':').map(Number);
                      const [endHour, endMin] = newEntry.endTime.split(':').map(Number);
                      const totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
                      return formatRoundedTime(totalMinutes);
                    })()})
                  </div>
                </>
              ) : (
                <div style={{
                  background: '#fee2e2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '12px',
                  color: '#991b1b',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  ⚠️ Invalid time range! End time must be after start time.
                </div>
              )}
            </div>
          )}
          
          <button 
            onClick={handleAddEntry} 
            disabled={newEntry.startTime && newEntry.endTime && newEntry.endTime <= newEntry.startTime}
            style={{
              ...styles.button, 
              width: '100%',
              opacity: (newEntry.startTime && newEntry.endTime && newEntry.endTime <= newEntry.startTime) ? 0.5 : 1,
              cursor: (newEntry.startTime && newEntry.endTime && newEntry.endTime <= newEntry.startTime) ? 'not-allowed' : 'pointer'
            }}
          >
            Add Time Entry to Database
          </button>
        </div>

        <div style={styles.card}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
            <h2 style={{...styles.cardTitle, marginBottom: 0}}>
              <Calendar size={20} />
              My Time Entries
            </h2>
            <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
              <label style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer'}}>
                <input
                  type="checkbox"
                  checked={showOnlyToday}
                  onChange={(e) => setShowOnlyToday(e.target.checked)}
                />
                Show only today's entries
              </label>
              <div style={{fontSize: '18px', fontWeight: 'bold', color: '#667eea'}}>
                Total: {getTotalHours(displayedEntries)} hours
              </div>
            </div>
          </div>
          
          <div style={{overflowX: 'auto'}}>
            <table style={styles.table}>
              <thead>
                <tr>
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
                {displayedEntries.map(entry => (
                  editingEntry?.id === entry.id ? (
                    <tr key={entry.id} style={{background: '#eff6ff'}}>
                      <td style={styles.td}>
                        <input
                          type="date"
                          value={editingEntry.date}
                          readOnly
                          disabled
                          style={{
                            ...styles.input,
                            padding: '6px',
                            background: '#f9fafb',
                            cursor: 'not-allowed'
                          }}
                        />
                      </td>
                      <td style={styles.td}>
                        <input
                          type="time"
                          value={editingEntry.start_time}
                          onChange={(e) => setEditingEntry({ ...editingEntry, start_time: e.target.value })}
                          style={{...styles.input, width: '80px', padding: '6px', marginRight: '4px'}}
                        />
                        <input
                          type="time"
                          value={editingEntry.end_time}
                          onChange={(e) => setEditingEntry({ ...editingEntry, end_time: e.target.value })}
                          style={{...styles.input, width: '80px', padding: '6px'}}
                        />
                      </td>
                      <td style={styles.td}>
                        {calculateAndRoundHours(editingEntry.start_time, editingEntry.end_time)}h
                      </td>
                      <td style={styles.td} colSpan="2">
                        <span style={{fontSize: '12px', color: '#666'}}>Cannot edit project/task</span>
                      </td>
                      <td style={styles.td}>
                        <input
                          type="text"
                          value={editingEntry.description}
                          onChange={(e) => setEditingEntry({ ...editingEntry, description: e.target.value })}
                          style={{...styles.input, padding: '6px'}}
                        />
                      </td>
                      <td style={styles.td}>
                        <span style={{...styles.badge, ...styles.badgePending}}>
                          {entry.status}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <button
                          onClick={() => handleUpdateEntry(entry.id)}
                          style={styles.iconButton}
                        >
                          <Check size={18} color="#10b981" />
                        </button>
                        <button
                          onClick={() => setEditingEntry(null)}
                          style={styles.iconButton}
                        >
                          <X size={18} color="#ef4444" />
                        </button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={entry.id}>
                      <td style={styles.td}>{entry.date}</td>
                      <td style={styles.td}>{entry.start_time} - {entry.end_time}</td>
                      <td style={{...styles.td, fontWeight: '600'}}>{entry.total_hours}h</td>
                      <td style={styles.td}>
                        {projects.find(p => p.id === entry.project_id)?.name || 'Unknown'}
                      </td>
                      <td style={styles.td}>
                        {tasks.find(t => t.id === entry.task_id)?.title || 'Unknown'}
                      </td>
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
                          <>
                            <button
                              onClick={() => setEditingEntry(entry)}
                              style={styles.iconButton}
                            >
                              <Edit2 size={18} color="#667eea" />
                            </button>
                            <button
                              onClick={() => handleDeleteEntry(entry.id)}
                              style={styles.iconButton}
                            >
                              <Trash2 size={18} color="#ef4444" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
            
            {displayedEntries.length === 0 && (
              <div style={styles.emptyState}>
                No time entries yet. Add your first entry above!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentView;