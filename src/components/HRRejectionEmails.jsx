import { useState } from 'react';
import { Upload, Mail, FileSpreadsheet, Send, Edit } from 'lucide-react';
import { styles } from '../styles/styles';
import * as XLSX from 'xlsx';

const HRRejectionEmails = () => {
  const [file, setFile] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [editingTemplate, setEditingTemplate] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState({
    subject: 'Ihre Bewerbung bei OSO',
    body: `{anrede} {name},

vielen Dank für Ihr Interesse an einer Position bei OSO und die Zeit, die Sie in Ihre Bewerbung investiert haben.

Nach sorgfältiger Prüfung aller Bewerbungen müssen wir Ihnen leider mitteilen, dass wir uns für andere Kandidaten entschieden haben, deren Profile besser zu den aktuellen Anforderungen passen.

Wir wünschen Ihnen für Ihren weiteren beruflichen Weg alles Gute und viel Erfolg.

Mit freundlichen Grüßen,
OSO HR Team`
  });

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const workbook = XLSX.read(event.target.result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        // Map columns: Mailadresse, Sprache, Anrede, Name
        const formattedRecipients = data.map((row, index) => ({
          id: index + 1,
          email: row.Mailadresse || row.mailadresse || '',
          language: row.Sprache || row.sprache || 'DE',
          salutation: row.Anrede || row.anrede || 'Sie',
          name: row.Name || row.name || '',
          status: 'pending'
        }));

        setRecipients(formattedRecipients);
        setFile(uploadedFile);
        setMessage('');
      } catch (error) {
        setMessage('Fehler beim Lesen der Datei. Bitte überprüfe das Format.');
        console.error(error);
      }
    };
    reader.readAsBinaryString(uploadedFile);
  };

  const personalizeEmail = (template, recipient) => {
    return template
      .replace(/{anrede}/gi, recipient.salutation)
      .replace(/{name}/gi, recipient.name)
      .replace(/{sprache}/gi, recipient.language);
  };

  const handleSendEmails = async () => {
    if (recipients.length === 0) {
      alert('Keine Empfänger zum Senden');
      return;
    }

    const confirmed = window.confirm(
      `Möchten Sie wirklich ${recipients.filter(r => r.status === 'pending').length} E-Mails versenden?`
    );

    if (!confirmed) return;

    setLoading(true);
    const results = [];

    try {
      for (const recipient of recipients) {
        if (!recipient.email) {
          results.push({ ...recipient, status: 'failed', error: 'Keine E-Mail-Adresse' });
          continue;
        }

        // Personalize template
        const personalizedBody = personalizeEmail(emailTemplate.body, recipient);
        const personalizedSubject = personalizeEmail(emailTemplate.subject, recipient);

        try {
          // Call email API endpoint
          const response = await fetch('/api/send-rejection-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: recipient.email,
              subject: personalizedSubject,
              body: personalizedBody,
              language: recipient.language
            })
          });

          if (response.ok) {
            results.push({ ...recipient, status: 'success' });
          } else {
            results.push({ ...recipient, status: 'failed', error: 'E-Mail-Versand fehlgeschlagen' });
          }
        } catch (error) {
          results.push({ ...recipient, status: 'failed', error: error.message });
        }

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setRecipients(results);
      const successCount = results.filter(r => r.status === 'success').length;
      setMessage(`Fertig! ${successCount} von ${results.length} E-Mails gesendet.`);
    } catch (error) {
      setMessage('Fehler beim Senden der E-Mails');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const downloadResults = () => {
    const resultsData = recipients.map(r => ({
      Mailadresse: r.email,
      Name: r.name,
      Anrede: r.salutation,
      Sprache: r.language,
      Status: r.status === 'success' ? 'Gesendet' : 'Fehlgeschlagen',
      Fehler: r.error || ''
    }));

    const ws = XLSX.utils.json_to_sheet(resultsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ergebnisse');
    XLSX.writeFile(wb, `rejection_emails_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const downloadTemplate = () => {
    const templateData = [
      { Mailadresse: 'max@example.com', Sprache: 'DE', Anrede: 'Du', Name: 'Max' },
      { Mailadresse: 'anna@example.com', Sprache: 'EN', Anrede: 'Sie', Name: 'Frau Schmidt' },
      { Mailadresse: 'tom@example.com', Sprache: 'FR', Anrede: 'Du', Name: 'Tom' }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Vorlage');
    XLSX.writeFile(wb, 'rejection_email_template.xlsx');
  };

  const previewEmail = (recipient) => {
    const preview = personalizeEmail(emailTemplate.body, recipient);
    alert(`E-Mail-Vorschau für ${recipient.name}:\n\n${preview}`);
  };

  return (
    <div>
      {/* Email Template Editor */}
      <div style={{
        ...styles.card,
        marginBottom: '24px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ ...styles.cardTitle, marginBottom: 0 }}>
            <Mail size={24} />
            E-Mail-Vorlage
          </h2>
          <button
            onClick={() => setEditingTemplate(!editingTemplate)}
            style={{
              ...styles.button,
              padding: '8px 16px',
              fontSize: '14px'
            }}
          >
            <Edit size={16} />
            {editingTemplate ? 'Fertig' : 'Bearbeiten'}
          </button>
        </div>

        {editingTemplate ? (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ ...styles.label, display: 'block', marginBottom: '8px' }}>
                Betreff
              </label>
              <input
                type="text"
                value={emailTemplate.subject}
                onChange={(e) => setEmailTemplate({...emailTemplate, subject: e.target.value})}
                style={{
                  ...styles.input,
                  width: '100%'
                }}
              />
            </div>

            <div>
              <label style={{ ...styles.label, display: 'block', marginBottom: '8px' }}>
                Nachricht
              </label>
              <textarea
                value={emailTemplate.body}
                onChange={(e) => setEmailTemplate({...emailTemplate, body: e.target.value})}
                rows={14}
                style={{
                  ...styles.input,
                  width: '100%',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  lineHeight: '1.6'
                }}
              />
            </div>
            
            <div style={{
              marginTop: '12px',
              padding: '12px',
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#0369a1'
            }}>
              <strong>💡 Verfügbare Variablen:</strong>
              <div style={{ marginTop: '8px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                <code style={{ background: 'white', padding: '4px 8px', borderRadius: '4px' }}>
                  {'{anrede}'} → Anrede (Du/Sie)
                </code>
                <code style={{ background: 'white', padding: '4px 8px', borderRadius: '4px' }}>
                  {'{name}'} → Name der Person
                </code>
                <code style={{ background: 'white', padding: '4px 8px', borderRadius: '4px' }}>
                  {'{sprache}'} → Sprache (DE/EN/FR)
                </code>
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            background: '#f9fafb',
            padding: '20px',
            borderRadius: '8px',
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
            fontSize: '14px',
            lineHeight: '1.6'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '12px', color: '#374151' }}>
              Betreff: {emailTemplate.subject}
            </div>
            <div style={{ color: '#6b7280' }}>
              {emailTemplate.body}
            </div>
          </div>
        )}
      </div>

      {/* File Upload */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>
          <Upload size={24} />
          Empfänger hochladen
        </h2>

        <div style={{
          border: '2px dashed #2596BE',
          borderRadius: '12px',
          padding: '32px',
          textAlign: 'center',
          marginBottom: '24px',
          background: 'rgba(37, 150, 190, 0.05)'
        }}>
          <Upload size={48} color="#2596BE" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Excel-Datei hochladen</h3>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
            Spalten: <strong>Mailadresse, Sprache, Anrede, Name</strong>
          </p>
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              id="file-upload"
            />
            <label htmlFor="file-upload" style={{
              ...styles.button,
              display: 'inline-flex',
              cursor: 'pointer'
            }}>
              <FileSpreadsheet size={20} />
              Datei auswählen
            </label>

            <button onClick={downloadTemplate} style={styles.exportButton}>
              <FileSpreadsheet size={20} />
              Vorlage herunterladen
            </button>
          </div>

          {file && (
            <p style={{ marginTop: '12px', color: '#2596BE', fontSize: '14px', fontWeight: '500' }}>
              ✓ {file.name} ({recipients.length} Empfänger)
            </p>
          )}
        </div>

        {/* Message */}
        {message && (
          <div style={{
            padding: '12px',
            background: message.includes('Fehler') ? '#fee2e2' : '#d1fae5',
            border: `1px solid ${message.includes('Fehler') ? '#fecaca' : '#a7f3d0'}`,
            borderRadius: '8px',
            color: message.includes('Fehler') ? '#991b1b' : '#065f46',
            marginBottom: '16px',
            fontWeight: '500'
          }}>
            {message}
          </div>
        )}

        {/* Recipients Table */}
        {recipients.length > 0 && (
          <>
            <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                onClick={handleSendEmails}
                disabled={loading}
                style={{
                  ...styles.button,
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                <Send size={18} />
                {loading ? 'Sende E-Mails...' : `${recipients.filter(r => r.status === 'pending').length} E-Mails senden`}
              </button>
              
              {recipients.some(r => r.status !== 'pending') && (
                <button onClick={downloadResults} style={styles.exportButton}>
                  <FileSpreadsheet size={18} />
                  Ergebnisse herunterladen
                </button>
              )}

              <span style={{ marginLeft: 'auto', fontSize: '14px', color: '#666' }}>
                Gesamt: {recipients.length} | 
                Ausstehend: {recipients.filter(r => r.status === 'pending').length} | 
                Gesendet: {recipients.filter(r => r.status === 'success').length} |
                Fehler: {recipients.filter(r => r.status === 'failed').length}
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>E-Mail</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Anrede</th>
                    <th style={styles.th}>Sprache</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {recipients.map((recipient) => (
                    <tr key={recipient.id}>
                      <td style={styles.td}>{recipient.email}</td>
                      <td style={{...styles.td, fontWeight: '500'}}>{recipient.name}</td>
                      <td style={styles.td}>{recipient.salutation}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          background: '#e0e7ff',
                          color: '#3730a3'
                        }}>
                          {recipient.language}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          ...(recipient.status === 'success' ? styles.badgeApproved :
                              recipient.status === 'failed' ? styles.badgeRejected :
                              styles.badgePending)
                        }}>
                          {recipient.status === 'success' ? '✓ Gesendet' :
                           recipient.status === 'failed' ? `✗ ${recipient.error}` :
                           '⏳ Ausstehend'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <button
                          onClick={() => previewEmail(recipient)}
                          style={{
                            padding: '6px 12px',
                            background: '#f3f4f6',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          👁 Vorschau
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Instructions */}
        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: '#f9fafb',
          borderRadius: '8px',
          fontSize: '14px'
        }}>
          <h4 style={{ marginBottom: '8px', fontSize: '16px' }}>📝 Anleitung:</h4>
          <ol style={{ margin: 0, paddingLeft: '20px', color: '#666', lineHeight: '1.8' }}>
            <li>E-Mail-Vorlage bearbeiten und Variablen verwenden</li>
            <li>Excel-Datei mit Spalten hochladen: <strong>Mailadresse, Sprache, Anrede, Name</strong></li>
            <li>Empfänger-Liste überprüfen und Vorschau ansehen</li>
            <li>Auf "E-Mails senden" klicken</li>
            <li>Ergebnisse als Excel herunterladen</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default HRRejectionEmails;