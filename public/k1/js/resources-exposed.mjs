let descriptionRefs = document.querySelectorAll('p.unit-description-text');
for (let elemPDescr of descriptionRefs) {
    elemPDescr.innerText = elemPDescr.innerText.substring(0, 200) + ' ...';
}

// hide / unhide evaluation
// let meterList = document.querySelectorAll('.average-rating');

// for (let meterElem of meterList) {
//     meterElem.addEventListener('mouseover', function (evt) {
//         this.style.display = 'none';
//         console.log(hElems);
//     });
// };