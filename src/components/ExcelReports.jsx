import { useState, useEffect } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import { supabase } from '../supabaseClient';
import * as XLSX from 'xlsx';

const StudentTimesheetDownload = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const { data } = await supabase
      .from('students')
      .select('id, name, email')
      .eq('role', 'student')
      .order('name');
    setStudents(data || []);
  };

  const calculateHours = (clockIn, clockOut) => {
    if (!clockIn || !clockOut) return 0;
    const hours = (new Date(clockOut) - new Date(clockIn)) / (1000 * 60 * 60);
    return hours.toFixed(2);
  };

  const formatDate = (date) => new Date(date).toLocaleDateString('en-US');
  const formatTime = (date) => new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const downloadTimesheet = async () => {
    if (!selectedStudent) {
      alert('Please select a student');
      return;
    }

    setLoading(true);

    try {
      let query = supabase
        .from('time_entries')
        .select('*')
        .eq('student_id', selectedStudent)
        .order('clock_in', { ascending: false });

      if (dateFrom) query = query.gte('clock_in', `${dateFrom}T00:00:00`);
      if (dateTo) query = query.lte('clock_in', `${dateTo}T23:59:59`);

      const { data, error } = await query;

      if (error) throw error;
      if (!data || data.length === 0) {
        alert('No timesheet data found');
        setLoading(false);
        return;
      }

      const student = students.find(s => s.id === selectedStudent);

      const excelData = data.map(entry => ({
        'Date': formatDate(entry.clock_in),
        'Sign In': formatTime(entry.clock_in),
        'Sign Out': entry.clock_out ? formatTime(entry.clock_out) : 'Still Working',
        'Total Hours': calculateHours(entry.clock_in, entry.clock_out)
      }));

      const totalHours = data.reduce((sum, entry) => 
        sum + parseFloat(calculateHours(entry.clock_in, entry.clock_out)), 0
      );

      const finalData = [
        { 'Date': 'Student:', 'Sign In': student.name },
        { 'Date': 'Email:', 'Sign In': student.email },
        {},
        ...excelData,
        {},
        { 'Date': 'TOTAL HOURS:', 'Total Hours': totalHours.toFixed(2) }
      ];

      const ws = XLSX.utils.json_to_sheet(finalData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Timesheet');

      XLSX.writeFile(wb, `${student.name.replace(' ', '_')}_Timesheet.xlsx`);
      setLoading(false);
    } catch (err) {
      alert(`Error: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'white',
      padding: '20px',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
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
            onChange={(e) => setSelectedStudent(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          >
            <option value="">-- Choose Student --</option>
            {students.map(student => (
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
  );
};

export default StudentTimesheetDownload;