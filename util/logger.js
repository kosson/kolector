const winston = require('winston');
const { combine, colorize, timestamp, align, printf, json, errors, cli } = winston.format;
require('winston-daily-rotate-file');

/* CONFIGURARE WINSTON ROTATE */
let config = {
  "port": 3001,
  "logConfig": {
      "logFolder": ".//logs//"
  }
};
var env = process.env.NODE_ENV;

/**
 * nivelurile de logging respectă nivelurile de severitate specificate prin RFC5424
 * severitatea este indicată numeric și descrescător de la cel mai sever la cel mai puțin
 * nivelurile npm: { error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5 }
 */
let levels = {
  error: 0,
  warn: 1,
  info: 2,
  verbose: 3,
  debug: 4,
  silly: 5
};

let colors = {
  product: 'magenta',
  error:   'red',
  warning: 'yellow',
  info:    'green',
  debug:   'blue',
};
winston.addColors(colors);

/* 
* FORMATAREA LOGURILOR
* adaugi mai multe formatări pe care le particularizezi în funcție de necesitate
*/
const logFormat = combine(
  // errorFilter(),
  colorize({ all: true }),
  timestamp({
    format: 'YYYY-MM-DD hh:mm:ss.SSS A'
  }),
  align(),
  printf(info => `[${info.timestamp}] [${info.level}]: ${info.message}`)
);

/**
 * FILTRE DE FORMATARE A LOG-urilor
 */
const errorFilter = winston.format((info, opts) => {
  return info.level === 'error' ? info : false;
});

const infoFilter = winston.format((info, opts) => {
  return info.level === 'info' ? info : false;
});

/* 
* CONFIGURAREA TRANSPORTULUI PENTru ROTAȚIE
* un transport este un dispozitiv de stocare pentru log-uri
* o instanță winston poate avea mai multe transporturi configurate pe diferite niveluri
*/
const rotatedtransport = new winston.transports.DailyRotateFile({
  name:          "Error logs",
  filename:      config.logConfig.logFolder + "error-%DATE%.log",
  label:         "ERROR",
  datePattern:   "YYYY-MM-DD-HH",
  zippedArchive: true,
  maxSize:       "20m",
  maxFiles:      "14d",
  prepend:       true,
  level:         "error"
});

/* 
* Nivelurile pentru winston.config.syslog.levels
{
  emerg: 0,
  alert: 1,
  crit: 2,
  error: 3,
  warning: 4,
  notice: 5,
  info: 6,
  debug: 7
}
EX:
winston.emerg("Emergency");
winston.crit("Critical");
winston.warning("Warning");
*/
const logger = winston.createLogger({
  format: logFormat,
  transports: [
    rotatedtransport,
    new (winston.transports.Console)({
      level: 'http',
      showLevel: true,
      colorize: true,
      showLevel: true,
      format: combine(
        timestamp({
          format: 'YYYY-MM-DD hh:mm:ss.SSS A',
        }),
        json()
      )
    }),
    new (winston.transports.Console)({
      level: "error",
      levels: levels,
      colorize: true,
      handleExceptions: true,
      humanReadableUnhandledException: true,
      showLevel: true,
      format: combine(errors({ stack: true }), timestamp()),
      exitOnError: false
    }),
    new (winston.transports.Console)({
      level: "warn",
      levels: levels,
      format: logFormat,
      colorize: true,
      handleExceptions: true,
      humanReadableUnhandledException: true,
      showLevel: true
    }),
    new (winston.transports.Console)({
      level: "info",
      levels: levels,
      format: logFormat,
      colorize: true,
      showLevel: true
    }),
    new (winston.transports.Console)({
      level: "verbose",
      levels: levels,
      format: logFormat,
      colorize: true,
      showLevel: true
    }),
    new (winston.transports.Console)({
      level: "silly",
      levels: levels,
      format: logFormat,
      colorize: true,
      showLevel: true
    }),
    new (winston.transports.Console)({
      levels: winston.config.syslog.levels,
      format: combine(winston.format.cli()),
      colorize: true,
      handleExceptions: true,
      humanReadableUnhandledException: true,
      showLevel: true
    })
  ]
});

/* ÎN DEZVOLTARE ADAUGĂ NIVEL DE LOGGING SUPLIMENTAR */
// if (env !== 'development') {
//   logger.add(winston.transports.DailyRotateFile({
//       name:        "Combined logs",
//       filename:    config.logConfig.logFolder + "combined-%DATE%.log",
//       level:       'error', 
//       datePattern: 'YYYY-MM-DD-HH',
//       maxSize:     '20m',
//       maxFiles:    '14d'
//   }))
// } else {
//   logger.add(winston.transports.DailyRotateFile({
//       name:        "Combined logs",
//       filename:    config.logConfig.logFolder + "combined-%DATE%.log",
//       level:       'error', 
//       datePattern: 'YYYY-MM-DD-HH',
//       maxSize:     '20m',
//       maxFiles:    '5d'
//   }))
// }

module.exports = logger;