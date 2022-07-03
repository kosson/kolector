function content2para (blocuri) {
    let articleParas = [];
    // console.log("În editorJs2TXT am primit: ", blocuri);
    if (blocuri.length > 0) {
        // generează fragmente text pentru fiecare dintre blocurile întâlnite
        blocuri.map(obj => {
            switch (obj.type) {
                case 'paragraph':
                    articleParas.push(`${obj.data.text}\n`);
                    break;
                default:
                    return '';
            }
        });
    }
    return articleParas;
}

module.exports = content2para;