const winston = require('winston');
const { format, createLogger, transports } = require("winston");
const { combine, colorize, timestamp, align, printf, json, errors, cli, simple, prettyPrint, label } = format;
require('winston-daily-rotate-file');

/* 
* CONFIGURAREA TRANSPORTULUI PENTRU ROTAȚIE
* un transport este un dispozitiv de stocare pentru log-uri
* o instanță winston poate avea mai multe transporturi configurate pe diferite niveluri
*/
const transport4errors = new winston.transports.DailyRotateFile({
  name:          "Error logs",
  filename:      `${process.env.APP_NAME}-error-%DATE%.log`,
  dirname:       "./logs",
  label:         "ERROR",
  datePattern:   "YYYY-MM-DD-HH",
  zippedArchive: true,
  maxSize:       "20m",
  maxFiles:      "14d",
  prepend:       true,
  level:         "error"
});

/* 
* FORMATAREA LOGURILOR
* adaugi mai multe formatări pe care le particularizezi în funcție de necesitate
*/
const logFormat = combine(  
  label({ label: process.env.APP_NAME }),
  timestamp({
    format: 'YYYY-MM-DD hh:mm:ss.SSS A'
  }),
  json(),
  // prettyPrint(),
  simple()
);

/* Constituirea obiectului de logging */ 
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'http',
  showLevel: true,
  format: logFormat,
  exitOnError: false,
  defaultMeta: { service: process.env.APP_NAME },
  transports: [
    transport4errors,
    new winston.transports.Console()
  ],
});

/* ÎN DEZVOLTARE ADAUGĂ NIVEL DE LOGGING SUPLIMENTAR */
if (process.env.NODE_ENV !== 'development') {
  logger.add(winston.transports.DailyRotateFile({
      name:        "Combined logs",
      filename:    config.logConfig.logFolder + "combined-%DATE%.log",
      level:       'error', 
      datePattern: 'YYYY-MM-DD-HH',
      maxSize:     '20m',
      maxFiles:    '14d'
  }))
}

module.exports = logger;