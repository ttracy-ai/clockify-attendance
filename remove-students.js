const fs = require('fs');

// List of student emails to remove
const studentsToRemove = [
  'madelen.burns@eoctech.org',
  // Add more emails here as needed
];

// Read current students
const students = JSON.parse(fs.readFileSync('public/students.json'));

// Filter out the students to remove
const filteredStudents = students.filter(s =>
  !studentsToRemove.includes(s.email.toLowerCase())
);

// Save back to file
fs.writeFileSync(
  'public/students.json',
  JSON.stringify(filteredStudents, null, 2)
);

console.log(`Removed ${students.length - filteredStudents.length} students`);
console.log('Remaining students:', filteredStudents.length);
console.log('\nRemoved:');
studentsToRemove.forEach(email => {
  const student = students.find(s => s.email.toLowerCase() === email.toLowerCase());
  if (student) {
    console.log(`- ${student.name} (${student.email}) - Hour ${student.hour}`);
  }
});
