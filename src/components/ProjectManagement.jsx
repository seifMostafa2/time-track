import { useState, useEffect } from 'react';
import { FolderKanban, Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { styles } from '../styles/styles';
import { supabase } from '../supabaseClient';
import { useLanguage } from '../contexts/LanguageContext';

const ProjectManagement = ({ currentUser, onRefresh }) => {
  const { t } = useLanguage();

  const [projects, setProjects] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    color: '#667eea',
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('name');

      if (error) throw error;
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      alert(t.common?.errorLoading || 'Fehler beim Laden');
    }
  };

  const handleAddProject = async (e) => {
    e.preventDefault();

    if (!newProject.name) {
      alert(t.projects?.projectNameRequired || 'Bitte Projektnamen eingeben');
      return;
    }

    try {
      const { error } = await supabase.from('projects').insert([
        {
          name: newProject.name,
          description: newProject.description,
          color: newProject.color,
          created_by: currentUser.id,
        },
      ]);

      if (error) throw error;

      alert(t.projects?.projectCreated || 'Projekt erfolgreich erstellt!');
      setNewProject({ name: '', description: '', color: '#667eea' });
      setShowAddForm(false);

      await fetchProjects();
      await onRefresh?.();
    } catch (error) {
      console.error('Error creating project:', error);
      if (error.code === '23505') {
        alert(t.projects?.projectExists || 'Ein Projekt mit diesem Namen existiert bereits');
      } else {
        alert(t.common?.errorCreating || 'Fehler beim Erstellen');
      }
    }
  };

  const handleUpdateProject = async (projectId) => {
    if (!editingProject.name) {
      alert(t.projects?.projectNameRequired || 'Bitte Projektnamen eingeben');
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          name: editingProject.name,
          description: editingProject.description,
          color: editingProject.color,
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId);

      if (error) throw error;

      alert(t.projects?.projectUpdated || 'Projekt erfolgreich aktualisiert!');
      setEditingProject(null);
      await fetchProjects();
    } catch (error) {
      console.error('Error updating project:', error);
      alert(t.common?.errorUpdating || 'Fehler beim Aktualisieren');
    }
  };

  const handleDeleteProject = async (projectId, projectName) => {
    // Optional guard for the special "General/Allgemein" project
    const pn = (projectName || '').trim().toLowerCase();
    if (pn === 'general' || pn === 'allgemein') {
      alert(t.projects?.cannotDeleteGeneral || 'Das Projekt "Allgemein" kann nicht gelöscht werden');
      return;
    }

    const confirmMsg =
      (t.projects?.confirmDelete && `${t.projects.confirmDelete} "${projectName}"?`) ||
      `Sind Sie sicher, dass Sie das Projekt "${projectName}" löschen möchten?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const { error } = await supabase.from('projects').delete().eq('id', projectId);
      if (error) throw error;

      alert(t.projects?.projectDeleted || 'Projekt erfolgreich gelöscht!');
      await fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      alert(t.common?.errorDeleting || 'Fehler beim Löschen');
    }
  };

  const colorPresets = [
    '#667eea',
    '#764ba2',
    '#f093fb',
    '#4facfe',
    '#43e97b',
    '#fa709a',
    '#fee140',
    '#30cfd0',
    '#a8edea',
    '#fed6e3',
    '#c471ed',
    '#f64f59',
  ];

  const txt = {
    title: t.projects?.title || 'Projektverwaltung',
    addProject: t.projects?.addProject || 'Projekt hinzufügen',
    cancel: t.common?.cancel || 'Abbrechen',
    createProject: t.projects?.createProject || 'Projekt erstellen',
    editProject: t.projects?.editProject || 'Projekt bearbeiten',
    deleteProject: t.projects?.deleteProject || 'Projekt löschen',
    projectName: t.projects?.projectName || 'Projektname',
    projectNamePlaceholder: t.projects?.projectNamePlaceholder || 'z.B. SAP HANA Migration',
    description: t.projects?.description || 'Beschreibung',
    descriptionPlaceholder: t.projects?.descriptionPlaceholder || 'Projektbeschreibung',
    color: t.projects?.color || 'Farbe',
    noDescription: t.projects?.noDescription || 'Keine Beschreibung',
    noProjects: t.projects?.noProjects || 'Noch keine Projekte. Erstellen Sie Ihr erstes Projekt!',
  };

  return (
    <div style={styles.card}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}
      >
        <h2 style={styles.cardTitle}>
          <FolderKanban size={20} />
          {txt.title}
        </h2>
        <button onClick={() => setShowAddForm((s) => !s)} style={styles.button}>
          {showAddForm ? (
            txt.cancel
          ) : (
            <>
              <Plus size={18} /> {txt.addProject}
            </>
          )}
        </button>
      </div>

      {showAddForm && (
        <form
          onSubmit={handleAddProject}
          style={{ marginBottom: '24px', padding: '20px', background: '#f9fafb', borderRadius: '8px' }}
        >
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>{txt.projectName} *</label>
              <input
                type="text"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                placeholder={txt.projectNamePlaceholder}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>{txt.description}</label>
              <input
                type="text"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                placeholder={txt.descriptionPlaceholder}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>{txt.color}</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {colorPresets.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewProject({ ...newProject, color })}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      background: color,
                      border: newProject.color === color ? '3px solid #333' : '2px solid #ddd',
                      cursor: 'pointer',
                    }}
                    aria-label={color}
                    title={color}
                  />
                ))}
              </div>
              <input
                type="color"
                value={newProject.color}
                onChange={(e) => setNewProject({ ...newProject, color: e.target.value })}
                style={{ width: '100%', height: '40px', borderRadius: '6px', border: '1px solid #ddd' }}
              />
            </div>
          </div>

          <button type="submit" style={{ ...styles.button, width: '100%' }}>
            <Check size={18} /> {txt.createProject}
          </button>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
        {projects.map((project) =>
          editingProject?.id === project.id ? (
            <div
              key={project.id}
              style={{ background: '#eff6ff', padding: '16px', borderRadius: '8px', border: '2px solid #bfdbfe' }}
            >
              <input
                type="text"
                value={editingProject.name}
                onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                style={{ ...styles.input, padding: '8px', marginBottom: '8px' }}
              />
              <input
                type="text"
                value={editingProject.description}
                onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                placeholder={txt.description}
                style={{ ...styles.input, padding: '8px', marginBottom: '8px' }}
              />
              <input
                type="color"
                value={editingProject.color}
                onChange={(e) => setEditingProject({ ...editingProject, color: e.target.value })}
                style={{ width: '100%', height: '40px', borderRadius: '6px', marginBottom: '8px' }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleUpdateProject(project.id)} style={{ ...styles.button, flex: 1, padding: '8px' }}>
                  <Check size={16} />
                </button>
                <button
                  onClick={() => setEditingProject(null)}
                  style={{ ...styles.button, flex: 1, padding: '8px', background: '#ef4444' }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div
              key={project.id}
              style={{
                background: 'white',
                padding: '16px',
                borderRadius: '8px',
                border: `3px solid ${project.color}`,
                position: 'relative',
              }}
            >
              <div style={{ width: '100%', height: '8px', background: project.color, borderRadius: '4px', marginBottom: '12px' }} />
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>{project.name}</h3>
              <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#666' }}>
                {project.description || txt.noDescription}
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setEditingProject(project)}
                  style={{ ...styles.iconButton, flex: 1, justifyContent: 'center' }}
                  aria-label={t.projects?.editProject || 'Projekt bearbeiten'}
                  title={t.projects?.editProject || 'Projekt bearbeiten'}
                >
                  <Edit2 size={16} color="#667eea" />
                </button>
                <button
                  onClick={() => handleDeleteProject(project.id, project.name)}
                  style={{ ...styles.iconButton, flex: 1, justifyContent: 'center' }}
                  aria-label={t.projects?.deleteProject || 'Projekt löschen'}
                  title={t.projects?.deleteProject || 'Projekt löschen'}
                >
                  <Trash2 size={16} color="#ef4444" />
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {projects.length === 0 && <div style={styles.emptyState}>{txt.noProjects}</div>}
    </div>
  );
};

export default ProjectManagement;
