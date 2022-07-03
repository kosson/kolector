const moment = require('moment');
const path   = require('path');
const url    = require("url");

/**
 * 
 * @param {String} urlStr 
 * @returns 
 */
const getBasenameFormUrl = (urlStr) => {
    const url = new URL(urlStr)
    return path.basename(url.pathname)
}

/**
 * Funcția preia un obiect specific editor.js pe care îl transformă într-o pagină web statică
 * @param {String} resursa 
 * @param {String} coperta 
 * @returns 
 */
function content2htmlstatic (resursa, coperta) {
    let articleHTML = '';
    if (resursa) {
        // generează conținut HTML pentru fiecare dintre blocurile întâlnite
        resursa.blocks.map(obj => {
            switch (obj.type) {
                case 'paragraph':
                    articleHTML += `<p>${obj.data.text}</p>\n`;
                    break;
                case 'image':
                    let imgref = '';

                    obj.data.file.url !== undefined ? imgref = path.basename(obj.data.file.url) : imgref = path.basename(coperta);
                    obj.data.caption ? obj.data.caption : '';

                    articleHTML += `
                        <figure class="text-center">
                            <img src="${imgref}" alt="${obj.data.caption}"/>
                            <figcaption>
                                ${obj.data.caption}
                            </figcaption>
                        </figure>\n`;
                    break;
                case 'header':
                    articleHTML += `<h${obj.data.level}>${obj.data.text}</h${obj.data.level}>\n`;
                    break;
                case 'raw':
                    articleHTML += `
                        <div class="ce-code">
                            <code>${obj.data.html}</code>
                        </div>\n`;
                    break;
                case 'code':
                    articleHTML += `
                        <div class="ce-code">
                            <code>${obj.data.code}</code>
                        </div>\n`;
                    break;
                case 'list':
                    if (obj.data.style === 'unordered') {
                        const list = obj.data.items.map(item => {
                            return `<li>${item}</li>`;
                        });                        
                        articleHTML += `<ul>${list.join('')}</ul>\n`;
                    } else {
                        let lss = '';
                        obj.data.items.forEach(item => {
                            lss += `<li>${item}</li>`;
                        });
                        articleHTML += `<ol>${lss}</ol>\n`;
                    }
                    break;
                case 'delimeter':
                    articleHTML += `<hr>\n`;
                    break;
                case 'attaches':
                    /*
                        {
                            type: 'attaches',
                            data: {
                                file: {
                                    url: 'http://localhost:8080/repo/5ebaf1ae32061d3fa4b7f0ae/a18d6328-25a6-4e93-8a0b-2f3feb8a74b6/data/Alcatuirea_atomului-1595857287267.zip',
                                    name: 'Alcatuirea_atomului-1595857287267.zip',
                                    extension: 'zip'
                                },s
                                title: 'Alcatuirea_atomului-1595857287267.zip'
                            }
                        }
                    */
                    // rezolvă cazul în care nu există fișiere atașate
                    if (!obj.data.file) {
                        break;
                    }

                    articleHTML += `
                            <a href="${obj.data.file.name}">${obj.data.file.name}</a>\n`;
                    break;
                case 'embed':
                    let ytbLnk = `${obj.data.source}`;
                    let ytbID = ytbLnk.match(/([A-Z])\w+/)[0];
                    // console.log(ytbID);
                    let embYtbLink = `https://www.youtube.com/embed/${ytbID}`;
                    articleHTML += `
                        <div class="">
                            <iframe width="${obj.data.width}" 
                                    height="${obj.data.height}" 
                                    src="${embYtbLink}" 
                                    frameborder="0" 
                                    allow="accelerometer; 
                                           autoplay; 
                                           clipboard-write; 
                                           encrypted-media; 
                                           gyroscope; 
                                           picture-in-picture" 
                                    allowfullscreen>
                            </iframe>
                            </br>
                            <strong>${obj.data.caption}</strong>
                        </div>\n`;
                    break;
                case 'table':
                    articleHTML += `<table>`;
                    // tratarea elementului head al tabelului
                    let theadData = obj.data.content.shift();
                    articleHTML += `<thead><tr>`;
                    theadData.forEach((value) => {
                        articleHTML += `<th scope="col">${value}</th>`;
                    });
                    articleHTML += `<tr scope="row"></thead><tbody>`;
                    // tratarea corpului tabelului
                    obj.data.content.map(item => {
                        // pentru elementele rămase după shift(), creează table rows
                        articleHTML += `<tr>`;
                        // fiecare item este la rândul său un array
                        item.forEach((value) => {
                            articleHTML += `<td>${value}</td>`;
                        });
                        articleHTML += `</tr>`;
                    });
                    articleHTML += `</tbody></table>`;
                    break;
                default:
                    return '';
            }
        });
        resursa.content = articleHTML;
        let localizat = moment(resursa.date).locale('ro').format('LLL');
        resursa.dataRo = `${localizat}`; // formatarea datei pentru limba română.
    }
    return articleHTML;
}

module.exports = content2htmlstatic;