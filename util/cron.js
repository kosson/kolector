const CronJob = require('cron').CronJob;
const Cron = require('./backupMongo.js');

// backup-ul automat se va realiza în fiecare săptămână la 00:00 duminică
let job1 = new CronJob(
  // '* * * * *',
  '0 0 *  * 0',
  function() {
    Cron.dbAutoBackUp();
  },
  null,
  true,
  'Europe/Bucharest'
); // https://crontab.guru/
job1.start();