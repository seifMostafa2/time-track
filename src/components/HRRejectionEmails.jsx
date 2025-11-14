import { useEffect, useState } from 'react';
import { Upload, Mail, FileSpreadsheet, Send, Edit } from 'lucide-react';
import { styles } from '../styles/styles';
import { useLanguage } from '../contexts/LanguageContext';
import * as XLSX from 'xlsx';

const HRRejectionEmails = () => {
  const { t } = useLanguage();
  const [file, setFile] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [editingTemplate, setEditingTemplate] = useState(false);
  const [sentHistory, setSentHistory] = useState([]);
  const [emailTemplate, setEmailTemplate] = useState({
    subject: 'Ihre Bewerbung bei OSO',
    body: `{anrede} {name},

vielen Dank für Ihr Interesse an einer Position bei OSO und die Zeit, die Sie in Ihre Bewerbung investiert haben.

Nach sorgfältiger Prüfung aller Bewerbungen müssen wir Ihnen leider mitteilen, dass wir uns für andere Kandidaten entschieden haben, deren Profile besser zu den aktuellen Anforderungen passen.

Wir wünschen Ihnen für Ihren weiteren beruflichen Weg alles Gute und viel Erfolg.

Mit freundlichen Grüßen,
OSO HR Team`
  });

  // Load sent history on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('hr_email_sent_history');
    if (savedHistory) {
      try {
        setSentHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Error parsing saved history:', error);
      }
    }
  }, []);

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    const fileExtension = uploadedFile.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls'].includes(fileExtension)) {
      setMessage('❌ Fehler: Bitte laden Sie nur Excel-Dateien hoch (.xlsx oder .xls)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const workbook = XLSX.read(event.target.result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        if (!data || data.length === 0) {
          setMessage('❌ Fehler: Die Excel-Datei ist leer. Bitte fügen Sie Daten hinzu.');
          return;
        }

        const firstRow = data[0];
        const hasRequiredColumns = 
          (firstRow.Mailadresse || firstRow.mailadresse) &&
          (firstRow.Name || firstRow.name);

        if (!hasRequiredColumns) {
          setMessage('❌ Fehler: Die Excel-Datei muss die Spalten "Mailadresse" und "Name" enthalten.');
          return;
        }

        const formattedRecipients = data.map((row, index) => {
          const email = row.Mailadresse || row.mailadresse || '';
          const name = row.Name || row.name || '';

          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          const isValidEmail = emailRegex.test(email);
          const alreadySent = sentHistory.includes(email.toLowerCase());

          return {
            id: index + 1,
            email: email,
            language: row.Sprache || row.sprache || 'DE',
            salutation: row.Anrede || row.anrede || 'Sie',
            name: name,
            status: alreadySent ? 'alreadySent' : (isValidEmail && name ? 'pending' : 'failed'),
            error: alreadySent ? '⚠️ Bereits gesendet' : (!isValidEmail ? 'Ungültige E-Mail' : (!name ? 'Name fehlt' : ''))
          };
        });

        const validRecipients = formattedRecipients.filter(r => r.status === 'pending');
        const alreadySentCount = formattedRecipients.filter(r => r.status === 'alreadySent').length;
        
        if (validRecipients.length === 0 && alreadySentCount === 0) {
          setMessage('❌ Fehler: Keine gültigen Empfänger gefunden. Bitte überprüfen Sie die E-Mail-Adressen und Namen.');
          return;
        }

        setRecipients(formattedRecipients);
        setFile(uploadedFile);
        
        const invalidCount = formattedRecipients.length - validRecipients.length - alreadySentCount;
        let messageText = '';
        
        if (alreadySentCount > 0) {
          messageText += `⚠️ ${alreadySentCount} E-Mail(s) bereits gesendet (wird übersprungen). `;
        }
        if (validRecipients.length > 0) {
          messageText += `${validRecipients.length} neue Empfänger gefunden. `;
        }
        if (invalidCount > 0) {
          messageText += `${invalidCount} ungültige Zeile(n) übersprungen.`;
        }
        
        setMessage(messageText.trim() || `✅ Erfolg: ${validRecipients.length} Empfänger erfolgreich geladen.`);
      } catch (error) {
        console.error('Error reading file:', error);
        setMessage('❌ Fehler beim Lesen der Datei. Bitte stellen Sie sicher, dass es sich um eine gültige Excel-Datei handelt.');
      }
    };

    reader.onerror = () => {
      setMessage('❌ Fehler: Die Datei konnte nicht gelesen werden.');
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
      alert(t.hr?.noRecipients || 'Keine Empfänger zum Senden');
      return;
    }

    const pendingCount = recipients.filter(r => r.status === 'pending').length;
    
    if (pendingCount === 0) {
      alert('Keine neuen E-Mails zum Senden. Alle Empfänger wurden bereits kontaktiert oder sind ungültig.');
      return;
    }
    
    const confirmMsg = (t.hr?.confirmSend || 'Möchten Sie wirklich {count} E-Mails versenden?')
      .replace('{count}', pendingCount);
    const confirmed = window.confirm(confirmMsg);

    if (!confirmed) return;

    setLoading(true);
    const results = [];
    const newlySent = [];

    try {
      for (const recipient of recipients) {
        if (recipient.status === 'alreadySent' || recipient.status === 'failed') {
          results.push(recipient);
          continue;
        }

        if (!recipient.email) {
          results.push({ ...recipient, status: 'failed', error: 'Keine E-Mail-Adresse' });
          continue;
        }

        const personalizedBody = personalizeEmail(emailTemplate.body, recipient);
        const personalizedSubject = personalizeEmail(emailTemplate.subject, recipient);

        try {
          const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          
          if (isLocal) {
            console.log('📧 [LOCAL TEST] Would send email to:', recipient.email);
            console.log('Subject:', personalizedSubject);
            console.log('Body:', personalizedBody);
            
            await new Promise(resolve => setTimeout(resolve, 500));
            results.push({ ...recipient, status: 'success' });
            newlySent.push(recipient.email.toLowerCase());
          } else {
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
              newlySent.push(recipient.email.toLowerCase());
            } else {
              results.push({ ...recipient, status: 'failed', error: 'E-Mail-Versand fehlgeschlagen' });
            }
          }
        } catch (error) {
          results.push({ ...recipient, status: 'failed', error: error.message });
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      const updatedHistory = [...sentHistory, ...newlySent];
      setSentHistory(updatedHistory);
      localStorage.setItem('hr_email_sent_history', JSON.stringify(updatedHistory));

      setRecipients(results);
      const successCount = results.filter(r => r.status === 'success').length;
      const skippedCount = results.filter(r => r.status === 'alreadySent').length;

      let finalMessage = `Fertig! ${successCount} von ${results.length} E-Mails gesendet.`;
      if (skippedCount > 0) {
        finalMessage += ` ${skippedCount} bereits gesendete E-Mails wurden übersprungen.`;
      }
      setMessage(finalMessage);
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
      Status: r.status === 'success' ? 'Gesendet' : 
              r.status === 'alreadySent' ? 'Bereits gesendet' : 'Fehlgeschlagen',
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

  const clearHistory = () => {
    if (window.confirm('Möchten Sie den Verlauf der gesendeten E-Mails wirklich löschen?')) {
      setSentHistory([]);
      localStorage.removeItem('hr_email_sent_history');
      setMessage('✅ Verlauf gelöscht.');
    }
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
            {t.hr?.emailTemplate || 'E-Mail-Vorlage'}
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
            {editingTemplate ? (t.hr?.done || 'Fertig') : (t.hr?.edit || 'Bearbeiten')}
          </button>
        </div>

        {editingTemplate ? (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ ...styles.label, display: 'block', marginBottom: '8px' }}>
                {t.hr?.subject || 'Betreff'}
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
                {t.hr?.message || 'Nachricht'}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{...styles.cardTitle, marginBottom: 0}}>
            <Upload size={24} />
            Empfänger hochladen
          </h2>
          
          {sentHistory.length > 0 && (
            <button
              onClick={clearHistory}
              style={{
                ...styles.exportButton,
                fontSize: '13px',
                padding: '8px 12px'
              }}
            >
              🗑️ Verlauf löschen ({sentHistory.length})
            </button>
          )}
        </div>

        <div style={{
          border: '2px dashed #2596BE',
          borderRadius: '12px',
          padding: '32px',
          textAlign: 'center',
          marginBottom: '24px',
          background: 'rgba(37, 150, 190, 0.05)'
        }}>
          <Upload size={48} color="#2596BE" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>{t.hr?.uploadExcel || 'Excel-Datei hochladen'}</h3>
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
              {t.hr?.chooseFile || 'Datei auswählen'}
            </label>

            <button onClick={downloadTemplate} style={styles.exportButton}>
              <FileSpreadsheet size={20} />
              {t.hr?.DownloadTemplate || 'Vorlage herunterladen'}
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
            background: message.includes('Fehler') ? '#fee2e2' : message.includes('Warnung') ? '#fef3c7' : '#d1fae5',
            border: `1px solid ${message.includes('Fehler') ? '#fecaca' : message.includes('Warnung') ? '#fde68a' : '#a7f3d0'}`,
            borderRadius: '8px',
            color: message.includes('Fehler') ? '#991b1b' : message.includes('Warnung') ? '#92400e' : '#065f46',
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
                {loading
                  ? (t.hr?.sending || 'Sende E-Mails...')
                  : `${recipients.filter(r => r.status === 'pending').length} ${t.hr?.sendEmails || 'E-Mails senden'}`
                }
              </button>

              {recipients.some(r => r.status !== 'pending') && (
                <button onClick={downloadResults} style={styles.exportButton}>
                  <FileSpreadsheet size={18} />
                  {t.hr?.downloadResults || 'Ergebnisse herunterladen'}
                </button>
              )}

              <span style={{ marginLeft: 'auto', fontSize: '14px', color: '#666' }}>
                Gesamt: {recipients.length} |
                Ausstehend: {recipients.filter(r => r.status === 'pending').length} |
                Gesendet: {recipients.filter(r => r.status === 'success').length} |
                Bereits gesendet: {recipients.filter(r => r.status === 'alreadySent').length} |
                Fehler: {recipients.filter(r => r.status === 'failed').length}
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>{t.hr?.email || 'E-Mail'}</th>
                    <th style={styles.th}>{t.hr?.name || 'Name'}</th>
                    <th style={styles.th}>{t.hr?.salutation || 'Anrede'}</th>
                    <th style={styles.th}>{t.hr?.language || 'Sprache'}</th>
                    <th style={styles.th}>{t.hr?.status || 'Status'}</th>
                    <th style={styles.th}>{t.hr?.actions || 'Aktionen'}</th>
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
                              recipient.status === 'alreadySent' ? { background: '#fef3c7', color: '#92400e' } :
                              recipient.status === 'failed' ? styles.badgeRejected :
                              styles.badgePending)
                        }}>
                          {recipient.status === 'success' ? '✓ Gesendet' :
                           recipient.status === 'alreadySent' ? '⚠️ Bereits gesendet' :
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
          <h4 style={{ marginBottom: '8px', fontSize: '16px' }}>📝 {t.hr?.instructions || 'Anleitung:'}</h4>
          <ol style={{ margin: 0, paddingLeft: '20px', color: '#666', lineHeight: '1.8' }}>
            <li>{t.hr?.step1 || 'E-Mail-Vorlage bearbeiten und Variablen verwenden'}</li>
            <li>{t.hr?.step2 || 'Excel-Datei mit Spalten hochladen: Mailadresse, Sprache, Anrede, Name'}</li>
            <li>{t.hr?.step3 || 'Empfänger-Liste überprüfen und Vorschau ansehen'}</li>
            <li>{t.hr?.step4 || 'Auf "E-Mails senden" klicken'}</li>
            <li>{t.hr?.step5 || 'Ergebnisse als Excel herunterladen'}</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default HRRejectionEmails;