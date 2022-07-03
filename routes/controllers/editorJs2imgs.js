function content2onlyImgs(blocuri) {
    let contentImgs = [];
    // console.log("În editorJs2TXT am primit: ", blocuri);
    if (blocuri.length > 0) {
        // Parcurge blocurile întâlnite și extrage prima imagine
        blocuri.map(obj => {
            switch (obj.type) {
                case 'image':
                    obj.data.file.url !== undefined ? obj.data.file.url : '/img/sigmund-TnEe6BdBC2M-unsplash.jpg';
                    obj.data.caption ? obj.data.caption : '';
                    contentImgs.push(`
                            <div class="firstlogimg">
                                <img src="${obj.data.file.url}" alt="${obj.data.caption}"/>
                            </div>`);
                    break;
                default:
                    return '';
            }
        });
    }
    return contentImgs;
}

module.exports = content2onlyImgs;