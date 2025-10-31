import { useState, useEffect } from 'react';
import { Briefcase, Plus, Edit2, Trash2, Check, X, AlertCircle, Users } from 'lucide-react';
import { styles } from '../styles/styles';
import { supabase } from '../supabaseClient';
import { useLanguage } from '../contexts/LanguageContext';

const TaskManagement = ({ currentUser, students, onRefresh }) => {
  const { t } = useLanguage();

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [taskAssignments, setTaskAssignments] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assigned_students: [],
    project_id: '',
    priority: 'medium',
    due_date: '',
  });

  useEffect(() => {
    fetchProjects();
    fetchTasks();
    fetchTaskAssignments();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase.from('projects').select('*').order('name');
      if (error) throw error;
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      alert(t.common?.errorLoading || 'Fehler beim Laden');
    }
  };

  const fetchTaskAssignments = async () => {
    try {
      const { data, error } = await supabase.from('task_assignments').select('*');
      if (error) throw error;
      setTaskAssignments(data);
    } catch (error) {
      console.error('Error fetching task assignments:', error);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();

    if (!newTask.title || !newTask.project_id || newTask.assigned_students.length === 0) {
      alert(t.tasks?.fillRequired || 'Bitte füllen Sie Titel aus, wählen Sie ein Projekt und weisen Sie mindestens einen Studenten zu');
      return;
    }

    try {
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .insert([
          {
            title: newTask.title,
            description: newTask.description,
            assigned_by: currentUser.id,
            project_id: parseInt(newTask.project_id),
            priority: newTask.priority,
            due_date: newTask.due_date || null,
            status: 'pending',
          },
        ])
        .select()
        .single();

      if (taskError) throw taskError;

      const assignments = newTask.assigned_students.map((studentId) => ({
        task_id: taskData.id,
        student_id: parseInt(studentId),
      }));

      const { error: assignError } = await supabase.from('task_assignments').insert(assignments);
      if (assignError) throw assignError;

      alert(t.tasks?.taskCreated || 'Aufgabe erfolgreich zugewiesen!');
      setNewTask({ title: '', description: '', assigned_students: [], project_id: '', priority: 'medium', due_date: '' });
      setShowAddForm(false);
      await fetchTasks();
      await fetchTaskAssignments();
      await onRefresh?.();
    } catch (error) {
      console.error('Error creating task:', error);
      alert(t.common?.errorCreating || 'Fehler beim Erstellen');
    }
  };

  const handleDeleteTask = async (taskId, taskTitle) => {
    const confirmMsg =
      (t.tasks?.confirmDelete && `${t.tasks.confirmDelete} "${taskTitle}"?`) ||
      `Sind Sie sicher, dass Sie die Aufgabe "${taskTitle}" löschen möchten?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;

      alert(t.tasks?.taskDeleted || 'Aufgabe erfolgreich gelöscht!');
      await fetchTasks();
      await fetchTaskAssignments();
    } catch (error) {
      console.error('Error deleting task:', error);
      alert(t.common?.errorDeleting || 'Fehler beim Löschen');
    }
  };

  const getAssignedStudents = (taskId) => {
    const assignments = taskAssignments.filter((a) => a.task_id === taskId);
    return assignments.map((a) => {
      const student = students.find((s) => s.id === a.student_id);
      return student ? student.name : (t.common?.unknown || 'Unbekannt');
    });
  };

  const getPriorityStyle = (priority) => {
    const priorityStyles = {
      low: { background: '#dbeafe', color: '#1e40af' },
      medium: { background: '#fef3c7', color: '#92400e' },
      high: { background: '#fed7aa', color: '#9a3412' },
      urgent: { background: '#fee2e2', color: '#991b1b' },
    };
    return priorityStyles[priority] || priorityStyles.medium;
  };

  const getStatusStyle = (status) => {
    const statusStyles = {
      pending: { background: '#fef3c7', color: '#92400e' },
      in_progress: { background: '#dbeafe', color: '#1e40af' },
      completed: { background: '#d1fae5', color: '#065f46' },
    };
    return statusStyles[status] || statusStyles.pending;
  };

  const formatDate = (dateString) => {
    if (!dateString) return t.tasks?.noDeadline || 'Keine Frist';
    const date = new Date(dateString);
    // Simple locale pick: de-DE for German, else en-US
    const locale = (t?.__lang === 'de' ? 'de-DE' : 'en-US');
    return date.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isOverdue = (dueDate, status) => {
    if (!dueDate || status === 'completed') return false;
    return new Date(dueDate) < new Date();
  };

  const toggleStudentSelection = (studentId) => {
    const currentSelection = newTask.assigned_students;
    if (currentSelection.includes(studentId)) {
      setNewTask({ ...newTask, assigned_students: currentSelection.filter((id) => id !== studentId) });
    } else {
      setNewTask({ ...newTask, assigned_students: [...currentSelection, studentId] });
    }
  };

  // Group tasks by project
  const tasksByProject = tasks.reduce((acc, task) => {
    const projectId = task.project_id;
    if (!acc[projectId]) acc[projectId] = [];
    acc[projectId].push(task);
    return acc;
  }, {});

  const txt = {
    title: t.tasks?.title || 'Aufgabenverwaltung',
    createTask: t.tasks?.createTask || 'Neue Aufgabe erstellen',
    editTask: t.tasks?.editTask || 'Aufgabe bearbeiten',
    deleteTask: t.tasks?.deleteTask || 'Aufgabe löschen',
    taskTitle: t.tasks?.taskTitle || 'Aufgabentitel',
    taskTitlePlaceholder: t.tasks?.taskTitlePlaceholder || 'z.B. Datenbankmigration Phase 1',
    description: t.tasks?.description || 'Beschreibung',
    descriptionPlaceholder: t.tasks?.descriptionPlaceholder || 'Aufgabendetails und Anforderungen...',
    assignToStudents: t.tasks?.assignToStudents || 'Studenten zuweisen',
    selectMultiple: t.tasks?.selectMultiple || '(Mehrfachauswahl)',
    project: t.tasks?.project || 'Projekt',
    selectProject: t.tasks?.selectProject || 'Projekt auswählen...',
    priority: t.tasks?.priority || 'Priorität',
    dueDate: t.tasks?.dueDate || 'Fälligkeitsdatum',
    status: t.tasks?.status || 'Status',
    assignedTo: t.tasks?.assignedTo || 'Zugewiesen an',
    noAssignments: t.tasks?.noAssignments || 'Keine Zuweisungen',
    noTasks: t.tasks?.noTasks || 'Noch keine Aufgaben. Erstellen Sie Ihre erste Aufgabenzuweisung!',
    studentsSelected: t.tasks?.studentsSelected || 'Student(en) ausgewählt',
    unknownProject: t.common?.unknown || 'Unbekannt',
    cancel: t.common?.cancel || 'Abbrechen',
    actions: t.timesheets?.actions || 'Aktionen',
    task: t.common?.task || 'Aufgabe',
  };

  const prioLabel = (p) => t.tasks?.priorities?.[p] || p;
  const statusLabel = (s) => t.tasks?.statuses?.[s] || s;

  return (
    <div style={styles.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={styles.cardTitle}>
          <Briefcase size={20} />
          {txt.title}
        </h2>
        <button onClick={() => setShowAddForm(!showAddForm)} style={styles.button}>
          {showAddForm ? txt.cancel : (<><Plus size={18} /> {txt.createTask}</>)}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddTask} style={{ marginBottom: '24px', padding: '20px', background: '#f9fafb', borderRadius: '8px' }}>
          <div style={styles.formGroup}>
            <label style={styles.label}>{txt.project} *</label>
            <select
              value={newTask.project_id}
              onChange={(e) => setNewTask({ ...newTask, project_id: e.target.value })}
              required
              style={styles.input}
            >
              <option value="">{txt.selectProject}</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>{txt.taskTitle} *</label>
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              placeholder={txt.taskTitlePlaceholder}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>{txt.description}</label>
            <textarea
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              placeholder={txt.descriptionPlaceholder}
              rows="3"
              style={styles.textarea}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              <Users size={16} style={{ display: 'inline', marginRight: '8px' }} />
              {txt.assignToStudents} * {txt.selectMultiple}
            </label>
            <div style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '12px', maxHeight: '200px', overflowY: 'auto', background: 'white' }}>
              {students.filter((s) => s.role === 'student').map((student) => {
                const idStr = String(student.id);
                const checked = newTask.assigned_students.includes(idStr);
                return (
                  <label
                    key={student.id}
                    style={{
                      display: 'block',
                      padding: '8px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      marginBottom: '4px',
                      background: checked ? '#eff6ff' : 'transparent',
                      border: checked ? '2px solid #667eea' : '2px solid transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleStudentSelection(idStr)}
                      style={{ marginRight: '8px' }}
                    />
                    {student.name} ({student.email})
                  </label>
                );
              })}
            </div>
            {newTask.assigned_students.length > 0 && (
              <div style={{ marginTop: '8px', fontSize: '14px', color: '#667eea', fontWeight: '500' }}>
                {newTask.assigned_students.length} {txt.studentsSelected}
              </div>
            )}
          </div>

          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>{txt.priority}</label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                style={styles.input}
              >
                <option value="low">{prioLabel('low')}</option>
                <option value="medium">{prioLabel('medium')}</option>
                <option value="high">{prioLabel('high')}</option>
                <option value="urgent">{prioLabel('urgent')}</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>{txt.dueDate}</label>
              <input
                type="date"
                value={newTask.due_date}
                onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                style={styles.input}
              />
            </div>
          </div>

          <button type="submit" style={{ ...styles.button, width: '100%' }}>
            <Check size={18} /> {txt.createTask}
          </button>
        </form>
      )}

      {/* Display tasks grouped by project */}
      {Object.keys(tasksByProject).map((projectId) => {
        const project = projects.find((p) => p.id === parseInt(projectId));
        const projectTasks = tasksByProject[projectId];

        return (
          <div key={projectId} style={{ marginBottom: '32px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
                padding: '12px',
                background: project ? project.color + '10' : '#f9fafb',
                borderLeft: `4px solid ${project ? project.color : '#999'}`,
                borderRadius: '6px',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                {project ? project.name : txt.unknownProject}
              </h3>
              <span style={{ fontSize: '14px', color: '#666' }}>
                ({projectTasks.length} {t.tasks?.tasksCount || 'Aufgabe(n)'})
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>{txt.task}</th>
                    <th style={styles.th}>{txt.assignedTo}</th>
                    <th style={styles.th}>{txt.priority}</th>
                    <th style={styles.th}>{txt.status}</th>
                    <th style={styles.th}>{txt.dueDate}</th>
                    <th style={styles.th}>{txt.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {projectTasks.map((task) => {
                    const assignedStudents = getAssignedStudents(task.id);
                    return (
                      <tr key={task.id} style={isOverdue(task.due_date, task.status) ? { background: '#fef2f2' } : {}}>
                        <td style={styles.td}>
                          <div style={{ fontWeight: '600', marginBottom: '4px' }}>{task.title}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>{task.description}</div>
                        </td>
                        <td style={styles.td}>
                          {assignedStudents.length > 0 ? (
                            <div>
                              {assignedStudents.map((name, index) => (
                                <div
                                  key={index}
                                  style={{
                                    fontSize: '12px',
                                    padding: '2px 8px',
                                    background: '#f3f4f6',
                                    borderRadius: '4px',
                                    marginBottom: '4px',
                                    display: 'inline-block',
                                    marginRight: '4px',
                                  }}
                                >
                                  {name}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: '#999' }}>{txt.noAssignments}</span>
                          )}
                        </td>
                        <td style={styles.td}>
                          <span style={{ ...styles.badge, ...getPriorityStyle(task.priority) }}>
                            {prioLabel(task.priority)}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <span style={{ ...styles.badge, ...getStatusStyle(task.status) }}>
                            {statusLabel(task.status).replace('_', ' ')}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {isOverdue(task.due_date, task.status) && <AlertCircle size={16} color="#dc2626" />}
                            <span style={isOverdue(task.due_date, task.status) ? { color: '#dc2626', fontWeight: '600' } : {}}>
                              {formatDate(task.due_date)}
                            </span>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <button onClick={() => handleDeleteTask(task.id, task.title)} style={styles.iconButton} aria-label={txt.deleteTask} title={txt.deleteTask}>
                            <Trash2 size={18} color="#ef4444" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {tasks.length === 0 && <div style={styles.emptyState}>{t.tasks?.noTasks || 'Noch keine Aufgaben. Erstellen Sie Ihre erste Aufgabenzuweisung!'}</div>}
    </div>
  );
};

export default TaskManagement;
