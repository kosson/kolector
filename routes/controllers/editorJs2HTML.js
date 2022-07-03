const moment = require('moment');

function content2html (resursa) {
    let articleHTML = '';
    if (resursa) {
        // generează conținut HTML pentru fiecare dintre blocurile întâlnite
        resursa.blocks.map(obj => {
            switch (obj.type) {
                case 'paragraph':
                    articleHTML += `<div class="ce-block">
                    <div class="ce-block__content">
                        <div class="ce-paragraph cdx-block">
                        <p>${obj.data.text}</p>
                        </div>
                    </div>
                    </div>\n`;
                    break;
                case 'image':
                    obj.data.file.url !== undefined ? obj.data.file.url : '/img/sigmund-TnEe6BdBC2M-unsplash.jpg';
                    obj.data.caption ? obj.data.caption : '';
                    articleHTML += `<div class="ce-block">
                    <div class="ce-block__content">
                        <div class="ce-paragraph cdx-block">
                            <figure class="text-center">
                                <img src="${obj.data.file.url}" alt="${obj.data.caption}" width="300"/>
                                <figcaption>
                                    ${obj.data.caption}
                                </figcaption>
                            </figure>
                        </div>
                    </div>
                    </div>\n`;
                    break;
                case 'header':
                    articleHTML += `<div class="ce-block">
                        <div class="ce-block__content">
                            <div class="ce-paragraph cdx-block">
                                <h${obj.data.level}>${obj.data.text}</h${obj.data.level}>
                            </div>
                        </div>
                    </div>\n`;
                    break;
                case 'raw':
                    articleHTML += `<div class="ce-block">
                        <div class="ce-block__content">
                            <div class="ce-code">
                                <code>${obj.data.html}</code>
                            </div>
                        </div>
                    </div>\n`;
                    break;
                case 'code':
                    articleHTML += `<div class="ce-block">
                    <div class="ce-block__content">
                        <div class="ce-code">
                            <code>${obj.data.code}</code>
                        </div>
                    </div>
                    </div>\n`;
                    break;
                case 'list':
                    if (obj.data.style === 'unordered') {
                        const list = obj.data.items.map(item => {
                            return `<li class="cdx-list__item">${item}</li>`;
                        });                        
                        articleHTML += `<div class="ce-block">
                                <div class="ce-block__content">
                                    <div class="ce-paragraph cdx-block">
                                        <ul class="cdx-list--unordered">${list.join('')}</ul>
                                    </div>
                                </div>
                            </div>\n`;
                    } else {
                        let lss = '';
                        const list = obj.data.items.forEach(item => {
                            lss += `<li class="cdx-list__item">${item}</li>`;
                        });
                        articleHTML += `<div class="ce-block">
                            <div class="ce-block__content">
                                <div class="ce-paragraph cdx-block">
                                    <ol class="cdx-list--ordered">${lss}</ol>
                                </div>
                            </div>
                        </div>\n`;
                    }
                    break;
                case 'delimeter':
                    articleHTML += `<div class="ce-block">
                        <div class="ce-block__content">
                            <div class="ce-delimiter cdx-block"></div>
                        </div>
                    </div>\n`;
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
                                },
                                title: 'Alcatuirea_atomului-1595857287267.zip'
                            }
                        }
                    */
                    // rezolvă cazul în care nu există fișiere atașate
                    if (!obj.data.file) {
                        break;
                    }

                    articleHTML += `<div class="ce-block">
                        <div class="ce-block__content">
                            <a href="${obj.data.file.url}">${obj.data.file.name}</a>
                        </div>
                    </div>\n`;
                    break;
                case 'embed':
                    let ytbLnk = `${obj.data.source}`;
                    let ytbID = ytbLnk.match(/([A-Z])\w+/)[0];
                    // console.log(ytbID);
                    let embYtbLink = `https://www.youtube.com/embed/${ytbID}`;
                    articleHTML += `<div class="ce-block">
                        <div class="ce-block__content">
                            <iframe width="${obj.data.width}" 
                                    height="${obj.data.height}" 
                                    src="${embYtbLink}" 
                                    frameborder="0" 
                                    allow="accelerometer; 
                                    autoplay; 
                                    encrypted-media; 
                                    gyroscope; 
                                    picture-in-picture" 
                                    allowfullscreen>
                            </iframe>
                            </br>
                            <strong>${obj.data.caption}</strong>
                        </div>
                    </div>\n`;
                    break;
                case 'table':
                    articleHTML += `<table class="table table-bordered">`;
                    // tratarea elementului head al tabelului
                    let theadData = obj.data.content.shift();
                    articleHTML += `<thead class="thead-dark"><tr>`;
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
                            articleHTML += `<td class="edjscell">${value}</td>`;
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

module.exports = content2html;