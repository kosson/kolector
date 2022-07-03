import {pubComm, createElement, decodeCharEntities, datasetToObject} from './main.mjs';

var csrfToken = '';

if(document.getElementsByName('_csrf')[0].value) {
    csrfToken = document.getElementsByName('_csrf')[0].value;
}

// var pubComm = io('/redcol', {
//     query: {['_csrf']: csrfToken}
// });

// OBȚINEREA DATELOR
let dataRes = document.querySelector('.resursa').dataset;
let RED = JSON.parse(dataRes.content);

let autoriArr = RED.autori.split(','); // tratez cazul în care ai mai mulți autori delimitați de virgule
let author = '';
if (autoriArr.length >= 1) {
    author = autoriArr[0].trim();
} else {
    author = autori;
}
RED.nameUser = author;
// console.log("[personal-res::profile/:id] Obiectul resursă arată astfel: ", dataRes);

// OBIECTUL RESURSEI
var resObi = {
    id:           dataRes.id, 
    contribuitor: dataRes.contribuitor,
    content:      RED.content,
    uuid:         dataRes.uuid
};

// descarcă resursa ca zip
let zipdownloadbtn = document.getElementById('zipdownload');
zipdownloadbtn.addEventListener('click', (evt) => {
    fetch(`${document.location.origin}${document.location.pathname}/zip?` + new URLSearchParams({
        path: `${resObi.contribuitor}/${resObi.uuid}`,
        uuid: `${resObi.uuid}`
    }).toString()).then((response) => {
        if (response.status != 200) {
            throw new Error("Bad Server Response"); 
        } else {
            downloadFile(response);
        }
        }).catch((error) => {
        console.log(error);
    });
});