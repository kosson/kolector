const mongoose = require('mongoose');
// MONGOOSE - Conectare la MongoDB
mongoose.set('useCreateIndex', true); // Deprecation warning

if (process.env.NODE_ENV !== "test") {
    mongoose.connect(process.env.MONGO_LOCAL_CONN, {
        auth: { "authSource": "admin" },
        user: process.env.MONGO_USER,
        pass: process.env.MONGO_PASSWD,
        useNewUrlParser: true, 
        useUnifiedTopology: true
    });
}
mongoose.connection.on('error', function () {
    console.warn('Conectarea la MongoDB a eșuat!');
    process.exit(1);
});
mongoose.connection.once('open', function () {
    console.log("Conectare la baza de date făcută cu succes");
});

module.exports = mongoose;