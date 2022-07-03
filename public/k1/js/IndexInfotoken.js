class InfoToken extends HTMLElement {
    constructor () {
        super();
        this.shadow = this.attachShadow({mode: 'open'});
    }
    
    connectedCallback () {
        this.render();
    }

    render () {
        this.shadow.innerHTML = `
        <article class="infotoken">
            <div class="infotoken__head">
                <div class="infotoken__head__cover">
                    <img src="${imgHead}" alt="${imgHeadAltTxt}">
                    <p class="infotoken__head__cover--nr">${infoTknHeadNr}</p>
                </div>
                <div class="infotoken__head__title">
                    <h3>${infoTknHeadTitle}</h3>
                </div>
            </div>
            <div class="infotoken__body">
                ${infoTknBodyTxt}
            </div>
            <div class="infotoken__footer">
                <span class="badge badge-pill badge-secondary">biologie</span>
                <span class="badge badge-pill badge-secondary">video</span>
                <span class="badge badge-pill badge-secondary">colecție</span>
            </div>
        </article>
        `;
    }
}

customElements.define('info-token', InfoToken);