const fs = require('fs');
const https = require('https');

const download = (url, destination) => new Promise((resolve, reject) => {
    console.log(`Saving: ${destination}`);
    const file = fs.createWriteStream(destination);
  
    https.get(url, response => {
      response.pipe(file);
  
      file.on('finish', () => {
        file.close(resolve(true));
      });
    }).on('error', error => {
      console.log(`Error saving: ${destination}`);
      fs.unlink(destination);
      reject(error.message);
      
    });
});

const uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

const get_url_extension = ( url ) => {
    if (url.includes(".webp")){
        return ".webp";
    }
    return url.split(/[#?]/)[0].split('.').pop().trim();
}

const sleep = (sec) => {
  return new Promise((resolve) => {
    setTimeout(resolve, sec*1000);
  });
} 

module.exports = { download, uuidv4, get_url_extension, sleep };
