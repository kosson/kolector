const winston         = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

/* CONFIGURARE WINSTON */
var config = {
  "port": 3001,
  "logConfig": {
      "logFolder": ".//logs//"
  }
};
var env = process.env.NODE_ENV;
var levels = {
  product: 1,
  error: 1,
  warn: 3,
  info: 4,
  debug: 5
};
var colors = {
  product: 'magenta',
  error:   'red',
  warning: 'yellow',
  info:    'green',
  debug:   'blue',
};

const errorFilter = winston.format( (info, opts) => {
  return info.level == 'error' ? info : false;
});

/* FORMATAREA LOGURILOR */
const logFormat = winston.format.combine(
  errorFilter(),
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'DD-MM-YYYY HH:mm:ss'
  }),
  winston.format.align(),
  winston.format.printf(info => `[${info.timestamp}] [${info.level}] [${info.label}]: ${info.message}`)
);

/* CONFIGURAREA TRANSPORTULUI */
const transport = new DailyRotateFile({
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

/* ÎN CAZ DE SERVICII EXTERNE */
// transport.on("rotate", function (oldFilename, newFilename) {
  // apel către servicii online precum s3 sau alt cloud
// });

const logger = winston.createLogger({
  levels: levels,
  format: logFormat,
  transports: [
    transport,
    new winston.transports.Console({level: "info"}),
    new winston.transports.Console({level: "warn"})
  ]
});

winston.addColors(colors);

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