exports.cock2obj = function cock2obj (cookieStr) {
    // Soluție rapidă de la https://stackoverflow.com/questions/5047346/converting-strings-like-document-cookie-to-objects
    return cookieStr.split(/; */).reduce((obj, str) => {
        if (str === "") return obj;
        const eq = str.indexOf('=');
        const key = eq > 0 ? str.slice(0, eq) : str;
        let val = eq > 0 ? str.slice(eq + 1) : null;
        if (val != null) try { val = decodeURIComponent(val); } catch(ex) { e => console.error }
        obj[key] = val;
        return obj;
    }, {});
};