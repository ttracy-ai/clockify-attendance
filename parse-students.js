const mammoth = require('mammoth');
const fs = require('fs');

async function parseStudents() {
  try {
    const docPath = 'D:/temp/2025.EXP.Fall.Student Photos.docx';

    // Get HTML with images
    const htmlResult = await mammoth.convertToHtml(
      { path: docPath },
      {
        convertImage: mammoth.images.imgElement(function(image) {
          return image.read("base64").then(function(imageBuffer) {
            return {
              src: "data:" + image.contentType + ";base64," + imageBuffer
            };
          });
        })
      }
    );

    const html = htmlResult.value;
    const students = [];
    let currentHour = null;

    // Split by table cells (th or td)
    const cells = html.split(/<\/?th>|<\/?td>/);

    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i].trim();

      // Skip empty cells
      if (!cell || cell === '<p></p>') continue;

      // Check for hour headers
      if (cell.includes('1st Hour')) {
        currentHour = '1';
        console.log('Found 1st Hour');
        continue;
      } else if (cell.includes('2nd Hour')) {
        currentHour = '2';
        console.log('Found 2nd Hour');
        continue;
      } else if (cell.includes('3rd Hour')) {
        currentHour = '3';
        console.log('Found 3rd Hour');
        continue;
      } else if (cell.includes('4th Hour')) {
        currentHour = '4';
        console.log('Found 4th Hour');
        continue;
      }

      if (!currentHour) continue;

      // Extract text content (name)
      const textContent = cell.replace(/<img[^>]*>/g, '').replace(/<[^>]+>/g, '').trim();

      // Extract image if present
      const imgMatch = cell.match(/<img src="(data:image\/[^"]+)"/);
      const photo = imgMatch ? imgMatch[1] : null;

      // Check if we have a valid name
      const nameMatch = textContent.match(/^([A-Z][a-z]+(?:-[A-Z][a-z]+)?)\s+([A-Z][a-z]+(?:-[A-Z][a-z]+)?)$/);

      if (nameMatch) {
        const firstName = nameMatch[1];
        const lastName = nameMatch[2];
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@eoctech.org`;

        students.push({
          name: `${firstName} ${lastName}`,
          email: email,
          hour: currentHour,
          photo: photo
        });

        console.log(`Added: ${firstName} ${lastName} (Hour ${currentHour}) - Photo: ${photo ? 'Yes' : 'No'}`);
      }
    }

    // Save to JSON
    fs.writeFileSync(
      'public/students.json',
      JSON.stringify(students, null, 2)
    );

    console.log(`Parsed ${students.length} students`);
    console.log('Students by hour:');
    console.log('1st Hour:', students.filter(s => s.hour === '1').length);
    console.log('2nd Hour:', students.filter(s => s.hour === '2').length);
    console.log('3rd Hour:', students.filter(s => s.hour === '3').length);
    console.log('4th Hour:', students.filter(s => s.hour === '4').length);

    // Print first few students as sample
    console.log('\nSample students:');
    students.slice(0, 5).forEach(s => {
      console.log(`${s.name} (${s.email}) - Hour ${s.hour} - Photo: ${s.photo ? 'Yes' : 'No'}`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

parseStudents();
