import {createElement, pubComm, check4url, decodeCharEntities, datasetToObject} from './main.mjs';
import {AttachesToolPlus} from './uploader.mjs';

var csrfToken = '';

if(document.getElementsByName('_csrf')[0].value) {
    csrfToken = document.getElementsByName('_csrf')[0].value;
}

// var pubComm = io('/redcol', {
//     query: {['_csrf']: csrfToken}
// });

/**
 * Funcția joacă rol de callback și va fi executată de îndată ce DOM-ul este încărcat
 * Acest lucru este necesar pentru a avea acces la dataset-ul care poartă întreaga înregistrare RED
 */
function clbkDOMContentLoaded () {
    // {_id: ObjectId('5e99b09c5cd7cf556c8ed346')} Bizant

    /* === OBIECTUL RESURSA din `data-content` === */
    let data    = document.querySelector('.resursa').dataset;
    let dataRes = JSON.parse(JSON.stringify(data)) || null;
    let content = JSON.parse(data.content) || null; // este înregistrarea din Mongo
    let imagini = new Set(); // un `Set` cu toate imaginile încărcate.
    let fileRes = new Set(); // un `Set` care unifică fișierele, fie imagini, fie atașamente.

    /* === RED === */
    var resObi = {
        id:           dataRes.id, 
        contribuitor: dataRes.contribuitor,
        uuid:         content.uuid,
        content:      content.content,
        etichete:     content.etichete,
        user:         content.idContributor
    };

    // acoperă cazul resurselor care au fost create până la începutul anului 2021
    if (content.uuid === undefined) {
        resObi.uuid = content.identifier[0];
    }

    // Este obiectul de configurare al lui `attaches` din Editor.js
    let attachesCfg = {
        class: AttachesToolPlus,            
        config: {
            endpoint:     `${location.origin}/upload`,
            buttonText:   'Încarcă un fișier',
            errorMessage: 'Nu am putut încărca fișierul.',
            headers:      {'uuid': resObi.uuid}
        }
    };

    /* === AUTORI și AUTORUL PRINCIPAL === */
    let author = '';
    if (dataRes.autori) {
        let autoriArr = resObi.autori.split(','); // tratez cazul în care ai mai mulți autori delimitați de virgule
        if (autoriArr.length >= 1) {
            author = autoriArr[0].trim();
        } else {
            author = autori;
        }
    }
    resObi.author = author;

    /* === resObi.nameUser === */
    resObi.nameUser = author;
    // console.log("[personal-res::profile/:id] Obiectul resursă arată astfel: ", dataRes);

    /* === resObi.versioned === */
    resObi.versioned = false;

    /**
     * Funcția are rolul de a afișa un buton *Actualizează* în cazul în care datele din RED au suferit modificări
     */
    function changed () {
        let btnsave = document.getElementById('saveversion');
        btnsave.classList.remove('btn-primary');
        btnsave.classList.add('btn-warning');
    }

    /* === Integrarea lui EditorJS === https://editorjs.io */
    const editorX = new EditorJS({
        placeholder: '',
        // logLevel: 'VERBOSE', 
        data: resObi.content,
        onReady: () => {
            console.log('Editor.js e gata de treabă!');
            //Construiește logica pentru a popula `imagini` și `fisiere` de îndată ce s-au încărcat datele
            if (resObi.content.blocks) {
                resObi.content.blocks.map(element => {
                    if(element.data.file) {
                        let fileUrl = check4url(element.data.file.url);
                        let pathF = fileUrl.path2file;
                        switch (element.type) {
                            case 'image':
                                // dacă există o cale și este și în setul `imagini`
                                if (pathF !== undefined) {
                                    fileRes.add(pathF); // și încarcă-le în Set-ul `fileRes`
                                    imagini.add(pathF);
                                    return pathF;
                                }
                                break;
                            case 'attaches':
                                if (pathF !== undefined) {
                                    fileRes.add(pathF);
                                    return pathF;
                                }
                                break;
                            default:
                                return;
                        }
                    }
                });
            }
            // console.log("[editorX::onReady] În setul imagini am: ", imagini, ", iar în setul tuturor fișierelor am ", fileRes);
            
            pickCover(); // Încarcă imaginile din resursă în previzualizatorul galeriei.
        },
        holder: 'edi',   
        /* Obiectul tuturor instrumentelor pe care le oferă editorul */ 
        tools: { 
            header: {
                class: Header,
                config: {
                    placeholder: 'Introdu titlul sau subtitlul'
                }
            },
            paragraph: {
                class: Paragraph,
                inlineToolbar: true,
            },
            list: {
                class: List,
                inlineToolbar: true
            },
            table: {
                class: Table,
                inlineToolbar: true
            },
            attaches: {
                class: AttachesToolPlus,            
                config: {
                    endpoint: `${location.origin}/upload`,
                    buttonText: 'Încarcă un fișier',
                    errorMessage: 'Nu am putut încărca fișierul.'
                }
            },
            inlineCode: {
                class: InlineCode,
                shortcut: 'CMD+SHIFT+M',
            },
            embed: {
                class: Embed,
                inlineToolbar: true,
                config: {
                    services: {
                        youtube: true,
                        coub: true,
                        codepen: {
                            regex: /https?:\/\/codepen.io\/([^\/\?\&]*)\/pen\/([^\/\?\&]*)/,
                            embedUrl: 'https://codepen.io/<%= remote_id %>?height=300&theme-id=0&default-tab=css,result&embed-version=2',
                            html: "<iframe height='300' scrolling='no' frameborder='no' allowtransparency='true' allowfullscreen='true' style='width: 100%;'></iframe>",
                            height: 300,
                            width: 600,
                            id: (groups) => groups.join('/embed/')
                        }
                    }
                }
            },
            checklist: {
                class: Checklist,
                inlineToolbar: true,
            },
            image: {
                class: ImageTool,
                config: {
                    /* === providing custom uploading methods === */
                    uploader: {
                        /**
                         * ÎNCARCĂ FIȘIERUL DE PE HARD!!!
                         * @param {File} file - Fișierul încărcat ca prim parametru
                         * @return o promisiune a cărei rezolvare trebuie să fie un obiect având câmpurile specificate de API -> {Promise.<{success, file: {url}}>}
                         */
                        uploadByFile(file){

                            // => construcția obiectul care va fi trimis către server
                            let objRes = {
                                user: resObi.idContributor, // este de forma "5e31bbd8f482274f3ef29103" [înainte era email-ul]
                                name: resObi.author, // este de forma "Nicu Constantinescu"
                                uuid: resObi.uuid,  // dacă deja a fost trimisă o primă resursă, înseamnă că în `RED.uuid` avem valoare deja. Dacă nu, la prima încărcare, serverul va emite unul înapoi în client
                                resF: file,      // este chiar fișierul: lastModified: 1583135975000  name: "Sandro_Botticelli_083.jpg" size: 2245432 type: "image/jpeg"
                                numR: file.name, // name: "Sandro_Botticelli_083.jpg"
                                type: file.type, // type: "image/jpeg"
                                size: file.size
                            };

                            /**
                             * Funcția are rolul de executor pentru promisiune
                             * @param {Function} resolve callback-ul care se declanșează la rezolvarea promisiunii
                             * @param {Function} reject callback-ul declanșat la respingerea promisiunii
                             */
                            function executor (resolve, reject) {
                                // console.log('Cand încarc un fișier, trimit obiectul: ', objRes);
                                
                                // TRIMITE ÎN SERVER
                                pubComm.emit('resursa', objRes); // TRIMITE RESURSA către server. Serverul creează bag-ul și scrie primul fișier!!! [UUID creat!]

                                // RĂSPUNSUL SERVERULUI
                                pubComm.on('resursa', (respObj) => {
                                    // în cazul în care pe server nu există nicio resursă, prima va fi creată și se va primi înapoi uuid-ul directorului nou creat
                                    if (resObi.uuid === '') {
                                        resObi.uuid = respObj.uuid; // setează și UUID-ul în obiectul RED local
                                    }

                                    // constituie cale relativă către imagine
                                    var urlAll = new URL(`${respObj.file}`);
                                    var path = urlAll.pathname; // de forma "/repo/5e31bbd8f482274f3ef29103/5af78e50-5ebb-11ea-9dcc-f50399016f10/data/628px-European_Union_main_map.svg.png"
                                    // obj4EditorJS.file.url = path; // introducerea url-ului nou format în obiectul de răspuns pentru Editor.js

                                    /* Editor.js se așteaptă ca acesta să fie populat după ce fișierul a fost trimis. */                            
                                    const obj4EditorJS = {
                                        success: respObj.success,
                                        file: {
                                            url: path,
                                            size: respObj.file.size
                                        }
                                    };

                                    // Adaugă imaginea încărcată în `Set`-ul `imagini`.
                                    if (!imagini.has(path)) {
                                        imagini.add(path); // încarcă url-ul imaginii în array-ul destinat ținerii evidenței acestora. Necesar alegerii copertei
                                    }

                                    // RESOLVE / REJECT
                                    resolve(obj4EditorJS); // REZOLVĂ PROMISIUNEA
                                    reject(mesaj => {
                                        pubComm.emit('mesaje', `Promisiunea așteptată de Editor.js a fost respinsă; ${mesaj}`); // CÂND EȘUEAZĂ!
                                    });
                                });
                            }
                            // construiește promisiunea
                            var promise = new Promise(executor);
                            // REZOLVĂ PROMISIUNEA!!!                     
                            return promise.then((obi) => {
                                return obi; // returnează rezultatul promisiunii. Este ceea ce are nevoie Editor.js în caz de succes
                            }).catch((error) => {
                                if (error) {
                                    pubComm.emit('mesaje', `Nu am reușit încărcarea fișierului pe server cu detaliile: ${error}`);
                                }
                            });
                        },
                        
                        /**
                         * ÎNCARCĂ CU PASTE LINK SAU DRAG-AND-DROP
                         * @param {String} url - Întreaga adresă către fișierul de imagine
                         * @return o promisiune a cărei rezolvare trebuie să fie un obiect având câmpurile specificate de API -> {Promise.<{success, file: {url}}>}
                         */
                        uploadByUrl(url){
                            // console.log("[uploadByUrl] În uploadByUrl am primit următorul url drept parametru: ", url);

                            decodedURL = decodeURIComponent(url); // Dacă nu faci `decode`, mușcă pentru linkurile HTML encoded cu escape squence pentru caracterele speciale și non latine
                            let urlObj = check4url(decodedURL); // adună toate informațiile despre fișier

                            /**
                             * Funcția validează răspunsul în funcție de headere și stare
                             * @param {Object} response 
                             */
                            function validateResponseAndSend (response) {
                                if (!response.ok) {
                                    // pubComm.emit('mesaje', `Am încercat să „trag” imaginea de la URL-ul dat, dar: ${response.statusText}`);
                                    console.log('[editorX::uploadByUrl::validateResponse] Am încercat să „trag” imaginea de la URL-ul dat, dar: ', response.statusText);
                                }
                                // console.log('[uploadByUrl::validateResponse] fetch a adus: ', response); // response.body este deja un ReadableStream
                                //_ FIXME: Caută să detectezi dimensiunea iar dacă depășește o valoare, încheie aici orice operațiune. Investighează API-ul Editor.js
                                
                                let res = response.blob();

                                // obiectul care va fi trimis către server
                                let objRes = {
                                    user: resObi.idContributor,
                                    name: resObi.author,
                                    uuid: uuid,
                                    resF: res,                   // introdu fișierul ca blob
                                    numR: urlObj.afterLastSlash, // completează obiectul care va fi trimis serverului cu numele fișierului
                                    type: res.type,              // completează cu extensia
                                    size: res.size               // completează cu dimensiunea 
                                };

                                pubComm.emit('resursa', objRes);    // trimite resursa în server (se va emite fără uuid dacă este prima)

                                // promisiune necesară pentru a confirma resursa primită OK!
                                const promissed = new Promise((resolve, reject) => {                                   
                                    pubComm.on('resursa', (respObj) => {
                                        // console.log('[uploadByUrl::pubComm<resursa>)] UUID-ul primit prin obiectul răspuns este: ', respObj.uuid);

                                        let fileLink = new URL(`${respObj.file}`);
                                        let path = fileLink.pathname; // va fi calea către fișier, fără domeniu
                                        
                                        // obiectul necesar lui Editor.js
                                        const obj4EditorJS = {
                                            success:  respObj.success,
                                            file: {
                                                url:  path, // introducerea url-ului nou format în obiectul de răspuns pentru Editor.js
                                                size: respObj.size
                                            }
                                        };

                                        // Adaugă imaginea încărcată în `Set`-ul `fileRes`. Este necesar comparatorului pentru ștergere
                                        imagini.add(path);

                                        resolve(obj4EditorJS); // REZOLVĂ PROMISIUNEA
                                    });
                                });
                                // returnează promisiunea așteptată de Editor.js
                                return promissed.then((obi) => {                                    
                                    return obi;
                                }).catch(error => {
                                    if (error) {
                                        console.error('Promisiunea așteptată de Editor.js a eșuat cu următoarele detalii: ', error);
                                    }
                                });
                            }

                            // ADU RESURSA
                            return fetch(decodedURL)
                                .then(validateResponseAndSend)
                                .catch((error) => {
                                    if (error) {
                                        console.log('Am eșuat cu următoarele detalii: ', error);
                                    }
                                });
                        }
                    },
                    captionPlaceholder: 'Legendă:',
                    buttonContent: 'Selectează fișier',
                    types: 'image/*'
                }
            },
            quote: {
                class: Quote,
                inlineToolbar: true,
                shortcut: 'CMD+SHIFT+O',
                config: {
                    quotePlaceholder: 'Introdu citatul',
                    captionPlaceholder: 'Autorul citatului',
                }
            }
        },
        i18n: {
            messages: {
                // traducerea diferitelor componente ale UI-ului
                ui: {
                    "blockTunes": {
                        "toggler": {
                            "Click to tune": "Apasă pentru a modifica",
                            "or drag to move": "sau trage pentru a muta"
                        },
                    },                
                    "toolbar": {
                        "toolbox": {
                            "Add": "Adaugă"
                        }
                    }
                },
                toolNames: {
                    "Text": "Paragraf",
                    "Attaches": "Încarcă fișiere",
                    "Heading": "Subtitluri",
                    "List": "Listă",
                    "Warning": "Avertizare",
                    "Checklist": "Checklist",
                    "Quote": "Citat",
                    "Code": "Cod",
                    "Delimiter": "Delimitare",
                    "Raw HTML": "HTML pur",
                    "Table": "Tabel",
                    "Link": "Link",
                    "Marker": "Marker",
                    "Bold": "Bold",
                    "Italic": "Italic",
                    "InlineCode": "Cod inclus",
                },
                /**
                 * Section allows to translate Block Tunes
                 */
                blockTunes: {
                    /**
                     * Each subsection is the i18n dictionary that will be passed to the corresponded Block Tune plugin
                     * The name of a plugin should be equal the name you specify in the 'tunes' section for that plugin
                     *
                     * Also, there are few internal block tunes: "delete", "moveUp" and "moveDown"
                     */
                    "delete": {
                        "Delete": "Șterge blocul"
                    },
                    "moveUp": {
                        "Move up": "Mută mai sus"
                    },
                    "moveDown": {
                        "Move down": "Mută mai jos"
                    }
                }      
            }
        },    
        onChange: changeContent
    });

    /**
     * Funcția este listener pentru modificările aduse conținutului din editor -> proprietatea `onChange` a obiectului `editorX`.
     * De fiecare dată când se modifică conținutul, actualizează `resObi.content`.
     * Apelează `check4url()` pentru a verifica dacă este url
     * Apelează `pickCover()` pentru a genera galeria imaginilor care trebuie selectate.
     */
    function changeContent () {
        if (resObi.versioned === false) {
            resObi.versioned = true;
            // console.log('Era false, acum este ', RED.versioned);
            changed(); // activează butonul *Actualizează*
        }

        editorX.save().then((content) => {  
            // console.log(`la salvare am urmatorul continut `, content);
            
            /* === ACTUALIZEAZĂ `resObi.content` cu noua valoare === */
            resObi.content = null;    // Dacă există deja, mai întâi setează `content` la `null` 
            resObi.content = content; // actualizează obiectul `content` la noua stare.

            /* === Logică de ștergere din server a imaginilor și fișierelor care au fost șterse din editor === */
            // PAS 1: constituie array-ul celor rămase
            let contentResArr = resObi.content.blocks.map((element) => {
                // imagini.clear(); // curăță setul imaginilor de cele anterioare pentru că altfel poluezi galeria

                /* 
                * trebuie făcută verificare pentru că la files se consideră eveniment apariția selecției de pe disc
                * și astfel, se introduc elemente vide în `Set`-uri 
                * */
                if(element.data.file) {
                    if (element.data.file.url !== undefined) {
                        let fileUrl = check4url(element.data.file.url);
                        let pathF = fileUrl.path2file;
                        switch (element.type) {
                            case 'image':
                                // dacă există o cale și este și în setul `imagini`
                                if (pathF !== undefined) {
                                    fileRes.add(pathF); // și încarcă-le în Set-ul `fileRes`
                                    return pathF;
                                }                           
                                break;
                            case 'attaches':
                                if (pathF !== undefined) {
                                    fileRes.add(pathF);
                                    return pathF;
                                }
                                break;
                            default:
                                return;
                        }
                    }
                }

                console.log(`Userul care face modificarea este:`, resObi.user);

                switch (element.type) {
                    case 'paragraph':
                        pubComm.emit('redfieldup', {id: resObi.id, fieldname: 'content', content: content, 'user': resObi.user});
                        break;
                    case 'embed':
                        pubComm.emit('redfieldup', {id: resObi.id, fieldname: 'content', content: content, 'user': resObi.user});
                        break;                
                    default:
                        break;
                }
            });

            // Ce se petrece când am un răspuns
            pubComm.on('redfieldup', function clbkShowResponse (data) {
                console.log(data);
            });

            let fileResArr = Array.from(fileRes);
            let differenceArr = fileResArr.filter((elem) => {
                if (!contentResArr.includes(elem)) return elem;
            });

            // PAS 2: compară fiecare înregistrare din `Set` cu cele ale array-ului `contentResArr`
            differenceArr.forEach((fpath) => {
                // dacă ai șters cu succes din `fileRes`, șterge imediat și din `imagini`
                if (fileRes.delete(fpath)) {
                    imagini.delete(fpath);
                    // extrage numele fișierului din `fileUrl`
                    let fileName = fpath.split('/').pop();
                    // emite un eveniment de ștergere a fișierului din subdirectorul resursei.

                    let obi = {
                        uuid: resObi.uuid,
                        idContributor: resObi.contribuitor,
                        content: resObi.content,
                        id: resObi.id,
                        fileName
                    };

                    console.log(`Obiectul trimis pe delfile este `, obi);

                    pubComm.emit('delfile', obi);
                }
            });

            // console.log("Rămâne câte un rest în imagini? ", imagini);
            pickCover(); // formează galeria pentru ca utilizatorul să poată selecta o imagine
        }).catch((e) => {
            console.log(e);
        });
    };

    // Wrapper pentru listenerele de pe contenteditable
    function setChangeListener (div, listener) {
        div.addEventListener("blur", listener);
        div.addEventListener("keyup", listener);
        div.addEventListener("paste", listener);
        div.addEventListener("copy", listener);
        div.addEventListener("cut", listener);
        div.addEventListener("delete", listener);
        div.addEventListener("mouseup", listener);
    };

    // Actualizează informația din titlu
    let titlered = document.getElementById('title');
    setChangeListener(titlered, (evt) => {
        pubComm.emit('redfieldup', {id: resObi.id, fieldname: 'title', content: titlered.innerText, 'user': resObi.user});
    });
    
    // Actualizează informația din descriere
    let descriptionred = document.getElementById('description');
    setChangeListener(descriptionred, (evt) => {
        pubComm.emit('redfieldup', {id: resObi.id, fieldname: 'description', content: descriptionred.innerText, 'user': resObi.user});
    });

    /**
     * Funcția are rolul de a închide bagul după ce toate resursele au fost contribuite.
     * @param {Object} evt Este obiectul eveniment al butonului `#submit` 
     */
    function closeBag (evt) {
        evt.preventDefault();
        // Închide Bag-ul
        pubComm.emit('closeBag', true); // vezi routes.js ->  socket.on('closeBag'...)
        pubComm.on('closeBag', (mesaj) => {
            console.log("Am închis bag-ul cu următoarele detalii: ", mesaj);
        });
    };

    /**
     * Funcția este receptor pentru containerele imaginilor timbru
     * Funcția are rolul de a bifa și debifa imaginile din galeria celor expuse selecției.
     */
    function clickImgGal (evt) {
        // selectează toate elementele care au clasa `.image-checkbox`
        let elementContainer = document.querySelectorAll('.image-checkbox'); // e o HTMLColection de div-uri care conțin fiecare următorii copii: img, input, svg

        elementContainer.forEach( (liveNode) => {
            // verifică dacă copilul img are clasa `image-checkbox-checked` și șterge-o
            let imgelem = liveNode.querySelector('img');
            if (imgelem.classList.contains(`image-checkbox-checked`)) {
                imgelem.classList.toggle(`image-checkbox-checked`);
            }

            // verifică dacă copilul svg are clasa `d-block` și șterge-o
            let svgelem = liveNode.querySelector('svg');
            if (svgelem.classList.contains('d-block')) {
                svgelem.classList.toggle('d-block');
            }

            // caută elementul input și setează-i `checked` la `false`
            let inputCollection = liveNode.querySelector('input[type=checkbox]');
            inputCollection.checked = false;
        });

        // this.classList.toggle('image-checkbox-checked');
        evt.target.classList.toggle('image-checkbox-checked');
        var checkbox = this.querySelector('input[type=checkbox]');
        // console.log(checkbox, checkbox.checked);

        if (checkbox.checked === false) {
            checkbox.checked = true;
            // verifică dacă mai sunt alte elemente input cu checked true
            this.querySelector('svg').classList.toggle('d-block');
        } else {
            this.querySelector('svg').classList.add('d-none');
            this.querySelector('svg').classList.toggle('d-block');
        }
    };

    var insertGal = document.getElementById('imgSelector');

    /**
     * Funcția generează toate elementele ce poartă imagini pentru a putea fi bifată cea care devine coperta resursei.
     */
    function pickCover () {
        insertGal.innerHTML = '';
        let img;
        for (img of imagini) {
            // console.log('imaginea selectată pentru copertă este: ', img);
            
            let container = new createElement('div', '', [`col-xs-4`, `col-sm-3`, `col-md-2`, `nopad`, `text-center`], null).creeazaElem();
            container.addEventListener('click', clickImgGal);
            let imgCheck  = new createElement('div', '', [`image-checkbox`], null).creeazaElem();
            
            let imgElem   = new createElement('img', '', [`img-responsive`], {src: `${img}`}).creeazaElem();
            let inputElem = new createElement('input', '', [`inputCheckGal`], {type: 'checkbox', value: `${img}`}).creeazaElem();
            let inputI    = new createElement('i', '', [`fas`, 'fa-check-circle', 'fa-3x', 'd-none'], null).creeazaElem();

            imgCheck.appendChild(imgElem);
            imgCheck.appendChild(inputElem);
            imgCheck.appendChild(inputI);
            container.appendChild(imgCheck);
            insertGal.appendChild(container);
        }
        return insertGal;
    };

    /**
     * Funcția șterge înregistrările din MongoDB și din Elasticsearch, precum și de pe discul serverului
     */
    function deleteRes () {
        pubComm.emit('delresid', resObi);
        // console.log('Am trimis obiectul::content: ', resObi);
        pubComm.on('delresid', (res) => {
            alert("Am șters: ", res.title);
            if (res) {
                // window.location = '/profile/' + dataRes.id;
                window.location = '/profile/resurse';
            }
        });
    }
    globalThis.deleteRes = deleteRes;

    var resursa          = document.getElementById(resObi.id);
    var validateCheckbox = document.getElementById('valid');
    var publicCheckbox   = document.getElementById('public');

    // verifică dacă există un element cu id-ul `valid`. E posibil să fie cazul unui simplu user
    if (validateCheckbox) {
        validateCheckbox.addEventListener('click', validateResource);
    }

    // tratează cazul în care este doar validator
    if (publicCheckbox) publicCheckbox.addEventListener('click', setGeneralPublic);

    // setează clasele în funcție de starea resursei
    if (validateCheckbox && validateCheckbox.checked) {
        resursa.classList.add('validred');
    } else {
        resursa.classList.add('invalidred');
    }

    /**
     * Funcția are rolul de listener pentru input checkbox-ul pentru validare
     * Modifică documentul în bază, declarându-l valid
     * Input checkbox-ul se formează din rute routes.js la app.get('/profile/resurse/:idres'...
     * @param {Object} evt 
     */
    function validateResource (evt) {
        var queryObj = {_id: dataRes.id};
        // se va trimite valoarea true sau false, depinde ce valoarea are checkbox-ul la bifare sau debifare
        if (validateCheckbox.checked) {
            // verifică dacă există clasa 'invalidred' (resursa pornește nevalidată)
            if (resursa.classList.contains('invalidred')) {
                resursa.classList.replace('invalidred', 'validred');
            }
            queryObj.expertCheck = true;
            pubComm.emit('validateRes', queryObj);
        } else {
            if (resursa.classList.contains('validred')) {
                resursa.classList.replace('validred', 'invalidred');
            }
            queryObj.expertCheck = false;        
            pubComm.emit('validateRes', queryObj);
        }
        pubComm.on('validateRes', (response) => {
            // TODO: modifică backgroundul galben în verde pal
            if (response.expertCheck) {
                console.log('Schimb culoarea background-ului din galben în verde pal');
            } else {
                console.log('Schimb culoarea background-ului din verde pal în galben');
            }
        });
    };

    /**
     * Funcția are rolul de a seta o resursă ca fiind disponibilă publicului
     * @param {Object} evt 
     */
    function setGeneralPublic (evt) {
        var queryObj = {_id: dataRes.id};
        // se va trimite valoarea true sau false, depinde ce valoarea are checkbox-ul la bifare sau debifare
        if (publicCheckbox.checked) {
            queryObj.generalPublic = true;
            pubComm.emit('setPubRes', queryObj);
        } else {
            queryObj.generalPublic = false;        
            pubComm.emit('setPubRes', queryObj);
        }    
        pubComm.on('setPubRes', (response) => {
            // TODO: modifică backgroundul galben în verde pal
            if (response.generalPublic) {
                console.log('Resursa a intrat în zona publică');
            } else {
                console.log('Resursa a fost retrasă din zona publică');
            }
        });
    };

    // Obține informație despre repo-ul git.
    let infobtn = document.getElementById('infoload');
    infobtn.addEventListener('click', (evt) => {
        // console.log(`[personal-res.mjs] Am să aduc informație despre repo`, resObi.contribuitor, content.emailContrib);
        let obi = {path: `${resObi.contribuitor}/${resObi.uuid}`, name: content.autori, email: content.emailContrib, message: ''};
        pubComm.emit('gitstat', obi);
    });

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

    let saveversionbtn = document.getElementById('saveversion');
    saveversionbtn.addEventListener('click', (evt) => {
        console.log(`[personal-res.mjs] Voi salva această versiune`);
    });

    // Procesarea răspunsului privind starea repo-ului de git
    pubComm.on('gitstat', (data) => {
        console.log(`Repo-ul de git are următoarele date `, data);

        /*
            GITGRAPH
        */
        // Get the graph container HTML element.

        const graphContainer = document.getElementById("graph-container");

        if (GitgraphJS !== null) {
            graphContainer.innerHTML = '';

            // Instantiate the graph.
            const gitgraph = GitgraphJS.createGitgraph(graphContainer, {
                orientation: 'vertical-reverse',
                template: GitgraphJS.templateExtend('metro', {
                    colors: ['red', 'blue', 'orange']
                })
            }); // https://www.nicoespeon.com/gitgraph.js/#14
            // https://www.nicoespeon.com/gitgraph.js/stories/?path=//story/gitgraph-js-1-basic-usage--default
            
            const master = gitgraph.branch("master", {
                style: {
                    label: {
                        color: 'green',
                        font: 'italic 10pt serif'
                    }
                }
            });
            let commitpiece;
            for (commitpiece of data) {
                master.commit({
                    subject: commitpiece.message,
                    author: commitpiece.authorName,
                    dotText: '🙀',
                    style: {
                        message: {
                            displayAuthor: true,
                            displayBranch: true,
                            displayHash:   false,
                            font: "normal 10pt Arial",
                            color: 'green'
                        }
                    },
                    // onClick: alert('Bau')
                });
            }
            // https://www.nicoespeon.com/gitgraph.js/stories/?path=/story/gitgraph-js-3-events--on-commit-dot-click
        }
    });

    pubComm.on('delfile', (data) => {
        console.log(data);
    });

    /**
     * Funcția are rolul de a face vizibil selectorul de arii
     */
    function showArii() {
        let ariiSelector = document.querySelector('#arii-curr');
        if (ariiSelector.hidden) {
            ariiSelector.hidden = false;
        } else {
            ariiSelector.hidden = true;
        }
        // Verifică care arii există deja si pune-le atributul selected în multi selectul care va apărea.
        //# 1 constituie un array al ariilor deja existente
    };

    function showCompDig() {
        let compdig = document.querySelector('#compdig');
        if (compdig.hidden) {
            compdig.hidden = false;
        } else {
            compdig.hidden = true;
        }
    };

    function adaugArie() {
        // Verifică mai întâi dacă nu cumva aria deja există între elementele grafice.
    };

    var insertGal = document.getElementById('imgSelector');
    
    /* === ETICHETE === */
    let tagsUnq;

    if (resObi.etichete === 'undefined') {
        resObi.etichete = [];
    } else if (resObi.etichete.length > 0) {
        tagsUnq = new Set(resObi.etichete); // construiește un set cu care să gestionezi etichetele constituite din tot ce a colectat `resObi.etichete`
    } else {
        tagsUnq = new Set();
    }

    // console.log(`Înainte de a porni am următoarele etichete: `, resObi.etichete, `iar setul are `, tagsUnq);

    var newTags = document.getElementById('eticheteRed'); // ref la textarea de introducere a etichetelor
    var tagsElems = document.getElementById('tags');

    // _TODO: creează mecanismul de ștergere - afișare cu bifă de ștergere

    /**
     * Funcția are rolul de a crea un element vizual de tip etichetă
     * doar dacă elementul nu există deja în `tagsUnq`. În contexul funcției
     * Setul are rol de element filtrant
     */
    function createTag (tag) {
        // asigură-te mai întâi că ce a venit din bază este un array
        if (Array.isArray(resObi.etichete)) {
            resObi.etichete.push(tag);
        }

        // apoi creează un element tag pe care-l afișezi
        var spanWrapper = new createElement('h5', `${tag}`, ['tag'], null).creeazaElem();
        var tagIcon = new createElement('span', '', ['fa', 'fa-tag', 'text-warning', 'mr-2'], null).creeazaElem();
        var spanText = new createElement('span', '', ['text-secondary'], null).creeazaElem(`${tag}`);
        var aClose = new createElement('a', '', null, null).creeazaElem();
        var aGlyph = new createElement('i', '', ['remove', 'fa', 'fa-times', 'ml-1'], null).creeazaElem();

        aClose.appendChild(aGlyph);
        spanWrapper.appendChild(tagIcon);
        spanWrapper.appendChild(spanText);
        spanWrapper.appendChild(aClose);
        tagsElems.appendChild(spanWrapper);

        aClose.addEventListener('click', removeTag);

        pubComm.emit('redfieldup', {id: resObi.id, fieldname: 'etichete', content: resObi.etichete});
    };

    /* Rolul funcției este să permită ștergerea de etichete care nu sunt considerate utile sau care au fost introduse greșit */
    function removeTag (evt) {
        evt.preventDefault();
        // console.log(`Obiectul eveniment`, evt, `target este`, evt.target, `iar current este`, evt.currentTarget);
        let targetElem = document.getElementById(evt.currentTarget.parentNode.id);
        // console.log(`Id-ul căutat este`, evt.currentTarget.parentNode.id);
        tagsUnq.delete(evt.currentTarget.parentNode.id);
        tagsElems.removeChild(targetElem);
        // console.log(`După ștergere setul este `, tagsUnq);
    };

    // Adaugă event pentru a detecta Enter in inputul de introducere
    newTags.addEventListener('keypress', (evt) => {
        let charCodeNr = typeof evt.charCode == "number" ? evt.charCode : evt.keyCode;
        let identifier = evt.key || evt.keyIdentifier; // compatibilitate cu Safari
        if (identifier === "Enter" || charCodeNr === 13) {
            let existingValues = newTags.value.split(','), i; // sparge stringul în elemente
            if (existingValues.length > 0) {
                for(i = 0; i < existingValues.length; i++) {
                    let newtag = existingValues[i].trim();
                    tagsUnq.add(newtag); // curăță elementul și introdu-l în Set.
                    createTag(newtag);
                }
            }
            newTags.value = '';
        };
        // console.log(`Setul acum este `, tagsUnq);
    });
}

document.addEventListener("DOMContentLoaded", clbkDOMContentLoaded);