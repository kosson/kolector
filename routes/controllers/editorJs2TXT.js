function content2text (blocuri) {
    let articleTXT = '';
    // console.log("În editorJs2TXT am primit: ", blocuri);
    if (blocuri.length > 0) {
        // generează fragmente text pentru fiecare dintre blocurile întâlnite
        blocuri.map(obj => {
            switch (obj.type) {
                case 'paragraph':
                    articleTXT += `${obj.data.text}\n`;
                    break;
                case 'header':
                    articleTXT += `${obj.data.text}\n`;
                    break;
                case 'list':
                    if (obj.data.style === 'unordered') {
                        const list = obj.data.items.map(item => {
                            return `${item}\n`;
                        });                        
                        articleTXT += `${list.join('')}\n`;
                    } else {
                        let lss = '';
                        const list = obj.data.items.forEach(item => {
                            lss += `${item}\n`;
                        });
                        articleTXT += `${lss}\n`;
                    }
                    break;
                case 'attaches':
                    articleTXT += `${obj.data.file.name}\n`;
                    break;
                case 'embed':
                    let ytbLnk = `${obj.data.source}`;
                    let ytbID = ytbLnk.match(/([A-Z])\w+/)[0];
                    // console.log(ytbID);
                    let embYtbLink = `https://www.youtube.com/embed/${ytbID}`;
                    articleTXT += `${obj.data.caption}\n`;
                    break;
                case 'table':
                    let theadData = obj.data.content.shift();
                    theadData.forEach((value) => {
                        articleTXT += `${value}\n`;
                    });
                    // tratarea corpului tabelului
                    obj.data.content.map(item => {
                        // pentru elementele rămase după shift(), creează table rows
                        // fiecare item este la rândul său un array
                        item.forEach((value) => {
                            articleTXT += `${value}\n`;
                        });
                    });
                    break;
                default:
                    return '';
            }
        });
    }
    return articleTXT;
}

module.exports = content2text;