const resursaModel = require('../../models/resursa-red');
const moment       = require('moment');

module.exports = (params) => {
    return resursaModel.find({_id: params.idres}).populate({
        path: 'competenteS'
    }).exec().then( (resursa) => {
        if (resursa[0].content) {
            let articleHTML = '';
            resursa[0].content.blocks.map(obj => {
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
                        articleHTML += `<div class="ce-block">
                        <div class="ce-block__content">
                            <div class="ce-paragraph cdx-block">
                                <figure>
                                    <img src="${obj.data.file.url}" alt="${obj.data.caption}" width="300"/>
                                    <figcaption class="text-center">
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
                    default:
                        return '';
                }
            });
            resursa[0].content = articleHTML;
            let localizat = moment(resursa[0].date).locale('ro').format('LLL');
            resursa[0].dataRo = `${localizat}`; // formatarea datei pentru limba română.
        }
        return resursa;
    });
};