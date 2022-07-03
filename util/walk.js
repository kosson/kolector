const fs = require('fs');
const path = require('path');

module.exports = async function walk(dir) {
    let files = await fs.promises.readdir(dir);
    files = await Promise.all(files.map(async file => {
        const filePath = path.join(dir, file);
        const stats = await fs.promises.stat(filePath);
        if (stats.isDirectory()) return walk(filePath);
        else if(stats.isFile()) return filePath;
    }));
    return files.reduce((all, folderContents) => all.concat(folderContents), []);
}