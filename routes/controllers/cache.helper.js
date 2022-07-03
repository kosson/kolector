const mongoose = require('mongoose');
const util = require('util');
const redisClient = require('../../redis.config');

// fă o referință către funcția originală
const exec = mongoose.Query.prototype.exec;

// introdu o funcție `cache` chainable, care să indice faptul că un query trebuie cache-at. 
// Acesteia trebuie să-i fi pasată valoarea de identificare a bucket-ului pentru obiectele stocate. Se va chema metoda cu ceva asemănător: `cache({key: req.user.id})`
mongoose.Query.prototype.cache = function toCache (options = {}) {
    this.useCache = true; // pur și simplu indici faptul că trebuie folosit mecanismul de cache-ing.
    // implementarea unui hashkey
    this.hashKey = JSON.stringify(options.key || ''); // hashKey trebuie să fie un număr sau un string. Dacă nu e pasată o cheie, un string gol va fi folosit
    return this; // fă metoda chainable!
};

// rescrie funcția exec. Ține minte că toate query-urile vor fi trecute în cache.
mongoose.Query.prototype.exec = async function newExec () {
    try {
        // dacă nu este solicitat mecanismul de cache-ing, folosește exec-ul nealterat.
        if (!this.useCache) {
            // console.log('Adusă din bază pentru că nu e în cache');
            return exec.apply(this, arguments);
        }

        console.log('Valori din cache!!!');
        
        // Pentru că nu putem modifica obiectul original al query-ului pentru a genera o cheie unică, vom folosi `Object.assign` pentru a constitui unul nou.
        const key = JSON.stringify(Object.assign({}, this.getQuery(), {collection: this.mongooseCollection.name}));

        // vezi dacă există cheia generată în cache deja. Dacă există, returnează valoarea sa imediat.
        // let cacheValue = await redisClient.get(key).then(data => data).catch(error => console.error);
        let client = await redisClient; // mai întâi rezolvă clientul!
        let cacheValue = client.hmget(this.hashKey, key, function clbkHGET (error, rezultat) {
            if (error) console.error;
            // console.log('Rezultatul oferit de cache este ', rezultat);
        });

        if (cacheValue === null) {            
            // nu uita că ceea ce trebuie să returnezi este un document Mongoose. In cazul nostru `this` este un Query, care are modelul referit.
            const dataCache = JSON.parse(cacheValue); // hidratezi modelul cu date. Trebuie făcută diferența dintre un singur obiect sau un array când sunt mai multe
            return Array.isArray(dataCache) 
                    ? dataCache.map (elem => new this.model(JSON.parse(elem)))
                    : new this.model(JSON.parse(cacheValue));
        }
        // dacă nu există, fă interogarea și stochează rezultatul în REDIS.
        const dateDinBaza = await exec.apply(this, arguments); // nu uita că ceea ce este adus din bază sunt documente Mongoose. Acum ai documente.
        
        // introdu datele în Redis
        client.hmset(this.hashKey, key, JSON.stringify(dateDinBaza), function clbkHMSET (error, raspuns) {
            if (error) {console.error};
            // console.log(raspuns); // dacă totul este în regulă, răspunsul este OK.
        }); // Este introdus hash-ul în REDIS.

        // datele sunt returnate clientului pentru randare.
        return dateDinBaza;
    } catch (error) {
        console.log(error);
    }
};

async function utilityFunctions () {
    let client = await redisClient; // mai întâi rezolvă clientul!
    return {
        clear4Id: async function clrId (id) {
            client.del(id);
        },
        clearHash: async function clrHash (hashKey) {
            let client = await redisClient; // mai întâi rezolvă clientul!
            client.hdel(userId, JSON.stringify(hashKey));
        }
    }
} 

module.exports = utilityFunctions;