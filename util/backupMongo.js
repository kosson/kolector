
const fs = require('fs-extra');
const { exec } = require('child_process');
const path = require('path');
const logger = require('./logger');

// setează calea pe care se va face backup-ul
const backupDirPath = path.join(__dirname, '../', 'backup/');
// const backupDirPath = path.resolve(__dirname, '../', 'backup/');

// returnează un obiect Date dintr-un string ce reprezintă o dată calendaristică
exports.stringToDate = (dateString) => {
    return new Date(dateString);
};

// Verifică dacă variabila este goală sau nu
exports.empty = (mixedVar) => {
    let key, i, len;
    const emptyValues = [undefined, null, false, 0, '', '0'];

    // dacă parametrul pasat `mixedVar` are una din valorile nule, returnează true
    for (i = 0, len = emptyValues.length; i < len; i++) {
        if (mixedVar === emptyValues[i]) {
            return true;
        }
    }
    // dacă e un obiect
    if (typeof mixedVar === 'object') {
        // și are membri, returnează false
        for (key in mixedVar) {
            return false;
        }
        // dacă este un obiect gol, returnează true
        return true;
    }
    // dacă parametrul are o valoare sau este un obiect cu membri, returnează false
    return false;
};

const dbOptions = {
    user: process.env.MONGO_USER,
    pass: process.env.MONGO_PASSWD,
    host: 'localhost',
    port: 27017,
    database: process.env.MONGO_DB,
    autoBackup: true,
    removeOldBackup: true,
    keepLastDaysBackup: 1,
    autoBackupPath: backupDirPath
};
// Funcția de backup automat
exports.dbAutoBackUp = () => {
    // verifică dacă backup-ul automat este activat sau nu
    if (dbOptions.autoBackup == true) {
        let beforeDate, oldBackupDir, oldBackupPath, 
            // oldBackupDirMIN, oldBackupPathMIN, 
            date          = new Date(),             
            currentDate   = this.stringToDate(date), 
            date4path     = currentDate.getFullYear() + '-' + (currentDate.getMonth() + 1) + '-' + currentDate.getDate(),
            newBackupPath = dbOptions.autoBackupPath + 'mongodump-' + date4path;

            // [TEST] LA MINUT
            //date4pathMIN  = currentDate.getFullYear() + '-' + (currentDate.getMonth() + 1) + '-' + currentDate.getDate() + '-' + currentDate.getHours() + '-' + currentDate.getMinutes(),
            //newBkpPathMIN = dbOptions.autoBackupPath + 'mongodump-' + date4pathMIN;
            
            // console.log('directorul de backup este ', date4path, ' iar calea este ', newBackupPath);

        // Dacă ai activată opțiunea de ștergere a directorului vechi, creează toate coordonatele necesare
        if (dbOptions.removeOldBackup == true) {
            beforeDate = new Date(+currentDate); // clonează obiectul dată pentru a crea referința din care scazi
            // Scade numărul de zile menționat în `dbOptions` pentru a ține backup-ul nou și pentru a-l șterge pe cel vechi
            
            beforeDate.setDate(beforeDate.getDate() - dbOptions.keepLastDaysBackup);// setează data scazand din data curentă numărul de zile setat   
            oldBackupDir = beforeDate.getFullYear() + '-' + (beforeDate.getMonth() + 1) + '-' + beforeDate.getDate();
            oldBackupPath = dbOptions.autoBackupPath + 'mongodump-' + oldBackupDir;

            // [TEST] LA MINUT (https://stackoverflow.com/questions/674721/how-do-i-subtract-minutes-from-a-date-in-javascript)
            //beforeDate.setMinutes(beforeDate.getMinutes() - dbOptions.keepLastDaysBackup);
            //console.log('Data backupului anterior este setata la ', beforeDate.getMinutes());
            //oldBackupDirMIN = beforeDate.getFullYear() + '-' + (beforeDate.getMonth() + 1) + '-' + beforeDate.getDate() + '-' + currentDate.getHours() + '-' + (currentDate.getMinutes() - 1);
            //oldBackupPathMIN = dbOptions.autoBackupPath + 'mongodump-' + oldBackupDirMIN;
            // NOTE: [TEST] LA MINUT -> Nu știe la trecerea de la 59 la 0.

            // console.log('Directorul vechiului backup este: ', oldBackupDirMIN, 'Calea vechiului backup este ',oldBackupPathMIN);
            // https://www.javascriptcookbook.com/article/perform-date-manipulations-based-on-adding-or-subtracting-time/
        }
        
        // Command for mongodb dump process
        let cmd =
            'mongodump' + 
            // ' --host ' + dbOptions.host +
            // ' --port ' + dbOptions.port +
            // ' --db ' + dbOptions.database +
            // ' --username ' + dbOptions.user +
            // ' --password ' + dbOptions.pass +
            ' --uri ' + process.env.MONGO_LOCAL_CONN + 
            // ' --gzip ',
            ' --out ' + newBackupPath;            
            // ' --out ' + newBkpPathMIN;

        exec(cmd, (error, stdout, stderr) => {
            // dacă nu au apărut erori, procedează la ștergere
            // if (this.empty(error)) {
                if (dbOptions.removeOldBackup == true) {
                    /* === ȘTERGE SUBDIRECTOR === */
                    // fs.stat(oldBackupPathMIN).then(function clbkFsStat (response) {
                    fs.stat(oldBackupPath).then(function clbkFsStat (response) {
                        // dacă directorul există, șterge-l!!!
                        if (response.isDirectory() === true) {
                            // fs.remove(oldBackupPathMIN, function clbkRemoveDir (error) {
                            fs.remove(oldBackupPath, function clbkRemoveDir (error) {
                                if (error) {
                                    console.error("[/util::backupMongo] În timpul ștergerii subdirectorului, a apărut eroarea: ", error);
                                    logger.error(`[/util::backupMongo] În timpul  ștergerii subdirectorului, a apărut eroarea: ${error}`);
                                }
                            });
                        }
                    }).catch((err) => {
                        if (err.code === 'ENOENT') {
                            return;
                        }
                        console.log("[/util::backupMongo] În timpul verificării existentei subdirectorului resursei șterse, a apărut eroarea: ", err);
                        logger.error(`[/util::backupMongo] În timpul verificării existentei subdirectorului resursei șterse, a apărut eroarea ${err}`);
                    });
                }

                // console.log(`stdout: ${stdout}`);
                // console.error(`stderr: ${stderr}`);
            // }
        });
    }
};