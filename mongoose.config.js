const mongoose = require('mongoose');
// MONGOOSE - Conectare la MongoDB
mongoose.set('useCreateIndex', true); // Deprecation warning
if(process.env.NODE_ENV !== "test"){
    mongoose.connect(process.env.MONGO_LOCAL_CONN, {useNewUrlParser: true});
};
mongoose.connection.on('error', function () {
    console.warn('Database connection failure');
    process.exit();
});
mongoose.connection.once('open', function () {
    console.log("Database connection succeded");
});

module.exports = mongoose;