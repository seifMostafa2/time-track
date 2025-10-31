export const calculateHours = (start, end) => {
  if (!start || !end) return 0;
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);
  const startInMin = startHour * 60 + startMin;
  const endInMin = endHour * 60 + endMin;
  return ((endInMin - startInMin) / 60).toFixed(2);
};


export const roundToNearestQuarter = (totalMinutes) => {
  const quarterHours = Math.round(totalMinutes / 15);
  return (quarterHours * 15) / 60; // Convert back to hours
};


export const calculateAndRoundHours = (start, end) => {
  if (!start || !end) return 0;
  
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);
  const startInMin = startHour * 60 + startMin;
  const endInMin = endHour * 60 + endMin;
  
  const totalMinutes = endInMin - startInMin;
  const roundedHours = roundToNearestQuarter(totalMinutes);
  
  return roundedHours.toFixed(2);
};

export const formatRoundedTime = (totalMinutes) => {
  const roundedMinutes = Math.round(totalMinutes / 15) * 15;
  const hours = Math.floor(roundedMinutes / 60);
  const minutes = roundedMinutes % 60;
  
  if (minutes === 0) {
    return `${hours} hrs`;
  }
  return `${hours} hrs ${minutes} min`;
};

export const getTotalHours = (entries) => {
  return entries.reduce((sum, entry) => sum + parseFloat(entry.total_hours), 0).toFixed(2);
};

export const exportToCSV = (timeEntries, students) => {
  const headers = ['Student', 'Date', 'Start Time', 'End Time', 'Total Hours', 'Project', 'Description', 'Status'];
  const rows = timeEntries.map(entry => {
    const student = students.find(s => s.id === entry.student_id);
    return [
      student?.name || '',
      entry.date,
      entry.start_time,
      entry.end_time,
      entry.total_hours,
      entry.project,
      entry.description,
      entry.status
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `timesheet_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
};