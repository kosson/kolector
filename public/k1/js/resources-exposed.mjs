let descriptionRefs = document.querySelectorAll('p.unit-description-text');
for (let elemPDescr of descriptionRefs) {
    elemPDescr.innerText = elemPDescr.innerText.substring(0, 200) + ' ...';
}