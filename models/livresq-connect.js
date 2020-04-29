'use strict';

const REQUEST_MODULE = require('request');
const CRYPTO = require('crypto');

/**
 * Connect to the livresq platform
 */
class LivresqConnect {

    static preparedProjectItems = {};

    /*** Prepare project request
     * @param {string} email - The email from the user that clicks the button / makes to request to connect to Livresq
     * @param {string} firstName - The first name from the user that clicks the button / makes to request to connect to Livresq
     * @param {string} lastName - The last name from the user that clicks the button / makes to request to connect to Livresq
    @returns {string|boolean}
     */
    prepareProjectRequest(email, firstName, lastName) {

        if(LivresqConnect.preparedProjectItems.hasOwnProperty(email)) return LivresqConnect.preparedProjectItems[email];

        const LIVRESQ_TOKEN = process.env.LIVRESQ_TOKEN;
        const LIVRESQ_TOKEN_PLAN = process.env.LIVRESQ_TOKEN_PLAN;
        const LIVRESQ_HOSTNAME = process.env.LIVRESQ_HOSTNAME;
        const LIVRESQ_PATH = process.env.LIVRESQ_PATH;

        if (!LIVRESQ_TOKEN || !LIVRESQ_TOKEN_PLAN || !LIVRESQ_HOSTNAME || !LIVRESQ_PATH) return "";

        const TOKEN = this.generate_public_token(LIVRESQ_TOKEN, email, LIVRESQ_TOKEN_PLAN);

        if (!TOKEN) return "";

        let url = `https://${LIVRESQ_HOSTNAME}/${LIVRESQ_PATH}?from=educred&firstname=${firstName}&lastname=${lastName}&email=${email}&token=${TOKEN}&create-project=true`;
        LivresqConnect.preparedProjectItems[email] = url;
        
        return url;
    }

    /*** [PRIVATE] Generate the public / request token to send to Livresq (in the token query param)
     * @param {string} salt - The Client ID that was given to you from Livresq
     * @param {string} email - The email from the user that clicks the button / makes to request to connect to Livresq
     * @param {string} token - The plan token that was given to you from Livresq
     * @return {string} The token to send to Livresq (in the token query param)
     */
    generate_public_token(salt, email, token) {

        const HASH = CRYPTO.createHash('sha256').update(salt + '-' + email).digest('hex');

        return this.substr_replace(HASH, token, Math.floor(HASH.length / 2), 0);
    }

    /*** [PRIVATE]  Altered PHP version of substr_replace
     * https://github.com/kvz/locutus/blob/master/src/php/strings/substr_replace.js
     * @param {string} str - The string that we operate on
     * @param {string} replace - The string used for replacement
     * @param {string} start - The starting point
     * @param {number} length - The length
     */
    substr_replace(str, replace, start, length) {

        length = length !== undefined ? length : str.length;
        if (length < 0) length = length + str.length - start;

        return `${str.slice(0, start)}${replace.substr(0, length)}${replace.slice(length)}${str.slice(start + length)}`;
    }

}

module.exports = {
    LivresqConnect: LivresqConnect
};