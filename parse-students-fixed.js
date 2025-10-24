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

    // Parse table cells - each cell contains either an image, a name, or is empty
    const students = [];
    let currentHour = null;

    // Split into table cells
    const cells = html.split(/<\/?td>|<\/?th>/);

    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i].trim();

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

      // Check if cell contains an image
      const imgMatch = cell.match(/<img src="(data:image\/[^"]+)"/);

      // Check if cell contains a name (look in next cell after image)
      const textContent = cell.replace(/<[^>]+>/g, '').trim();
      const nameMatch = textContent.match(/^([A-Z][a-z]+(?:-[A-Z][a-z]+)?)\s+([A-Z][a-z]+(?:-[A-Z][a-z]+)?)$/);

      // If we found an image, look for the name in the next non-empty cell
      if (imgMatch) {
        const photo = imgMatch[1];

        // Search forward for the name
        for (let j = i + 1; j < Math.min(cells.length, i + 10); j++) {
          const nextCell = cells[j].trim();
          const nextText = nextCell.replace(/<[^>]+>/g, '').trim();
          const nextNameMatch = nextText.match(/^([A-Z][a-z]+(?:-[A-Z][a-z]+)?)\s+([A-Z][a-z]+(?:-[A-Z][a-z]+)?)$/);

          if (nextNameMatch) {
            const firstName = nextNameMatch[1];
            const lastName = nextNameMatch[2];
            const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@eoctech.org`;

            students.push({
              name: `${firstName} ${lastName}`,
              email: email,
              hour: currentHour,
              photo: photo
            });

            console.log(`Matched: ${firstName} ${lastName} in hour ${currentHour}`);
            break;
          }
        }
      }
    }

    // Save to JSON
    fs.writeFileSync(
      'public/students.json',
      JSON.stringify(students, null, 2)
    );

    console.log(`\nParsed ${students.length} students`);
    console.log('Students by hour:');
    console.log('1st Hour:', students.filter(s => s.hour === '1').length);
    console.log('2nd Hour:', students.filter(s => s.hour === '2').length);
    console.log('3rd Hour:', students.filter(s => s.hour === '3').length);
    console.log('4th Hour:', students.filter(s => s.hour === '4').length);

  } catch (error) {
    console.error('Error:', error);
  }
}

parseStudents();
