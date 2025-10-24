const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '..', '2025.EXP.Fall.Student Photos.docx');
const outputPath = path.join(__dirname, 'student-photos-converted.html');

mammoth.convertToHtml({path: inputPath})
  .then(result => {
    fs.writeFileSync(outputPath, result.value);
    console.log('Converted successfully!');
    console.log('Output saved to:', outputPath);

    // Show first 2000 characters to understand structure
    console.log('\nFirst 2000 characters:');
    console.log(result.value.substring(0, 2000));
  })
  .catch(err => {
    console.error('Error:', err);
  });
