const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

async function extractStudentData() {
  try {
    const docPath = 'D:\\temp\\2025.EXP.Fall.Student Photos.docx';

    // Extract text and images
    const result = await mammoth.convertToHtml(
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

    console.log('HTML Content:');
    console.log(result.value);

    console.log('\n\nMessages:');
    console.log(result.messages);

    // Also extract raw text
    const textResult = await mammoth.extractRawText({ path: docPath });
    console.log('\n\nRaw Text:');
    console.log(textResult.value);

  } catch (error) {
    console.error('Error:', error);
  }
}

extractStudentData();
