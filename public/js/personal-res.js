// TODO: Introdu mecanismul de ștergere
// #1 Ref element
// #2 Trimite un event „delresid” in server::serverul șterge înregistrarea din MongoDB și din Elasticsearch și directorul de pe HDD.
// #3 serverul trimite înapoi pe același eveniment confirmarea că a șters tot și face redirectare către /profile/resurse

// #1
var dataRes = document.querySelector('.resursa').dataset;
// OBIECTUL RESURSEI
var resObi = {
    id: dataRes.id, 
    contribuitor: dataRes.contributor,
    content: JSON.parse(dataRes.content)
};

let imagini = new Set(); // un `Set` cu toate imaginile care au fost introduse în document.
let fisiere = new Set(); // un `Set` cu toate fișierele care au fost introduse în document la un moment dat (înainte de `onchange`).

/* === Integrarea lui EditorJS === https://editorjs.io */
const editorX = new EditorJS({
    data: resObi.content.content,
    onReady: () => {
        console.log('Editor.js e gata de treabă!');
        //TODO: Construiește logica pentru a popula `imagini` și `fisiere` de îndată ce s-au încărcat datele
        resObi.content.content.blocks.map(obj => {
            switch (obj.type) {
                case 'image':
                    imagini.add(obj.data.file.url);
                    break;
                case 'attaches':
                    fisiere.add(obj.data.file.url);
                    break;
            }
        });
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
            class: AttachesTool,
            buttonText: 'Încarcă un fișier',
            config: {
                endpoint: `${location.origin}/repo`
            },
            errorMessage: 'Nu am putut încărca fișierul.'
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
                        //TODO: Detectează dimensiunea fișierului și dă un mesaj în cazul în care depășește anumită valoare (vezi API-ul File)
                        // console.log(file.size);

                        // => construcția obiectul care va fi trimis către server
                        let objRes = {
                            user: RED.idContributor, // este de forma "5e31bbd8f482274f3ef29103" [înainte este email-ul]
                            name: RED.nameUser, // este de forma "Nicu Constantinescu"
                            uuid: RED.uuid,  // dacă deja a fost trimisă o primă resursă, înseamnă că în RED.uuid avem valoare deja. Dacă nu, la prima încărcare, serverul va emite unul înapoi în client
                            resF: file,      // este chiar fișierul: lastModified: 1583135975000  name: "Sandro_Botticelli_083.jpg" size: 2245432 type: "image/jpeg"
                            numR: file.name, // name: "Sandro_Botticelli_083.jpg"
                            type: file.type, // type: "image/jpeg"
                            size: file.size
                        };

                        /**
                         * Funcția are rolul de executor pentru promisiune
                         * @param {Function} resolve `callback-ul care se declanșează la rezolvarea promisiunii
                         * @param {Function} reject `callback-ul declanșat la respingerea promisiunii`
                         */
                        function executor (resolve, reject) {
                            // console.log('Cand încarc un fișier, trimit următorul obiect: ', objRes);
                            
                            // TRIMITE ÎN SERVER
                            pubComm.emit('resursa', objRes); // TRIMITE RESURSA către server. Serverul creează bag-ul și scrie primul fișier!!! [UUID creat!]

                            // RĂSPUNSUL SERVERULUI
                            pubComm.on('resursa', (respObj) => {
                                // în cazul în care pe server nu există nicio resursă, prima va fi creată și se va primi înapoi uuid-ul directorului nou creat
                                if (!RED.uuid) {
                                    RED.uuid = respObj.uuid; // setează și UUID-ul în obiectul RED local
                                }
                                // console.log('În urma încărcării fișierului de imagine am primit de la server: ', respObj);

                                // constituie cale relativă către imagine
                                var urlAll = new URL(`${respObj.file}`);
                                var path = urlAll.pathname;   // de forma "/repo/5e31bbd8f482274f3ef29103/5af78e50-5ebb-11ea-9dcc-f50399016f10/data/628px-European_Union_main_map.svg.png"
                                // obj4EditorJS.file.url = path; // introducerea url-ului nou format în obiectul de răspuns pentru Editor.js
                                
                                // FIXME: !!!!!!!!!!!
                                /* Obiectul necesar lui Editor.js după ce fișierul a fost trimis. 
                                După ce trimiți fișierul, Editor.js se așteaptă ca acesta să fie populat */                            
                                const obj4EditorJS = {
                                    success: respObj.success,
                                    file: {
                                        url: path,
                                        size: respObj.file.size
                                    }
                                };
                                
                                // completarea proprietăților așteptate de EditorJS în cazul succesului.
                                // obj4EditorJS.success = respObj.success; // 1
                                // obj4EditorJS.file.url = respObj.file; // Așa era preluat url-ul de obiectul succes până la 0.5.3
                                

                                // TODO: verifică dacă respectiva cale există sau nu în Set.
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
                        //TODO: Detectează dimensiunea fișierului și dă un mesaj în cazul în care depășește anumită valoare (vezi API-ul File)

                        // Unele URL-uri este posibil să fie HTML encoded
                        url = decodeURIComponent(url); // Dacă nu decode, mușcă pentru fișierele afișate în browser encoded deja... Flying Flamingos!!!
                        
                        /**
                         * Funcția validează răspunsul în funcție de headere și stare
                         * @param {Object} response 
                         */
                        function validateResponse(response) {
                            if (!response.ok) {
                                pubComm.emit('mesaje', `Am încercat să „trag” imaginea de la URL-ul dat, dar: ${response.statusText}`);
                                console.log('Am detectat o eroare: ', response.statusText);
                            }
                            console.log(response); // response.body este deja un ReadableStream
                            return response;
                        }

                        /**
                         * Funcția are rolul de a extrage numele fișierului
                         * @param {String} url Este chiar url-ul în formă string
                         */
                        function fileNameFromUrl(url) {
                            var matches = url.match(/\/([^\/?#]+)[^\/]*$/);
                            if (matches.length > 1) {
                                return matches[1];
                            }
                            return null;
                        }

                        // ADU RESURSA
                        return fetch(url)
                            .then(validateResponse)
                            .then(response => response.blob())
                            .then(response => {
                                // TODO: Detectează dimensiunea și nu permite încărcarea peste o anumită limită.
                                console.log(response);

                                // completează proprietățile necesare pentru a-l face `File` like pe răspunsul care este un Blob.
                                response.lastModifiedDate = new Date();
                                response.name = fileNameFromUrl(decodeURI(url)); // Trebuie decode, altfel te mușcă!
                                // console.log('Fetch-ul adaugă proprietatea response.name cu url-ul după prelucrarea cu fileNameFromUrl(url): ', response.name);

                                // obiectul care va fi trimis către server
                                let objRes = {
                                    user: RED.idContributor,
                                    name: RED.nameUser,
                                    uuid: RED.uuid,
                                    resF: null,
                                    numR: '',
                                    type: '',
                                    size: 0
                                };

                                objRes.resF = response; // introdu fișierul ca blob
                                objRes.numR = response.name; // completează obiectul care va fi trimis serverului cu numele fișierului
                                objRes.type = response.type; // completează cu extensia
                                objRes.size = response.size; // completează cu dimensiunea                            
                                
                                // trimite resursa în server
                                pubComm.emit('resursa', objRes);

                                const promissed = new Promise((resolve, reject) => {                                   
                                    pubComm.on('resursa', (respObj) => {
                                        // obiectul necesar lui Editor.js
                                        let obj4EditorJS = {
                                            success: respObj.success,
                                            file: {
                                                url: respObj.file,
                                                size: response.size
                                            }
                                        };

                                        // cazul primei trimiteri de resursă: setează UUID-ul proaspăt generat! Este cazul în care prima resursă trimisă este un fișier imagine.
                                        if (!RED.uuid) {
                                            RED.uuid = respObj.uuid;
                                        }
                                        // console.log('În cazul paste-ului de imagine, pe canalul resursa am primit următorul obiect: ', respObj);
                                        // obj4EditorJS.success = respObj.success;
                                        // obj4EditorJS.file.url = respObj.file;

                                        // constituie calea către imagine
                                        console.log(respObj.file);
                                        var urlAll = new URL(`${respObj.file}`);
                                        var path = urlAll.pathname;
                                        imagini.add(path); // încarcă url-ul imaginii în array-ul destinat ținerii evidenței acestora                                      
                                        
                                        resolve(obj4EditorJS); // REZOLVĂ PROMISIUNEA
                                        reject(mesaj => {
                                            pubComm.emit('mesaje', mesaj); // CÂND EȘUEAZĂ!
                                        });
                                    });
                                });
                                // returnează promisiunea așteptată de Editor.js
                                return promissed.then((obi) => {
                                    // console.log('Înainte de a returna promisiunea care se rezolvă cu obiectul: ', obi);
                                    return obi;
                                }).catch(error => {
                                    if (error) {
                                        pubComm.emit('mesaje', `Am eșuat cu următoarele detalii: ${error}`);
                                    }
                                });
                            })
                            .catch((error) => {
                                if (error) {
                                    pubComm.emit('mesaje', `Am eșuat cu următoarele detalii: ${error}`);
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
    onchange: () => {
        editorX.save().then((content) => {    
            // verifică dacă proprietatea `content` este populată.
            if (!('content' in resObi)) {
                resObi['content'] = content; // Dacă nu există introduc `content` drept valoare.
            } else if (typeof(RED.content) === 'object' && resObi.content !== null) {
                resObi.content = null; // Dacă există deja, mai întâi setează `content` la `null` 
                resObi.content = content; // și apoi introdu noua valoare.
                
                // === Logică de ștergere de pe HDD a imaginilor care au fost șterse din editor ===
                // Pas 1 Fă un set cu imaginile care au rămas după ultimul `onchange`
                const imgsInEditor = resObi.content.blocks.map((element) => {
                    if (element.type === 'image') {
                        const newUrl = new URL(element.data.file.url);
                        let path = newUrl.pathname;
                        // console.log("Am extras următoarea cale din url: ", path);
                        return path;
                    }
                });
                // console.log("Imaginile care au rămas în editor după ultima modificare: ", imgsInEditor);
                // Pas 2 Compară-le cu cu este în `Set`-ul `images`.
                const toDelete = Array.from(imagini).map((path) => {
                    // Caută în imaginile după ultima modificare
                    if (!imgsInEditor.includes(path)){
                        return path;
                    }
                });
                // console.log("Ce este în toDelete ", toDelete);
                
                if (toDelete.length > 0) {                    
                    toDelete.forEach(function clbk4Eac (path) {
                        if (path) {
                            imagini.delete(path);
                            // extrage numele fișierului din `fileUrl`
                            let fileName = path.split('/').pop();
                            // emite un eveniment de ștergere a fișierului din subdirectorul resursei.                            
                            pubComm.emit('delfile', {
                                uuid: resObi.uuid,
                                idContributor: resObi.idContributor,
                                fileName: fileName
                            });
                            pubComm.on('delfile', (mesagge) => {
                                console.log("Am șters cu următoarele detalii: ", message);
                            });
                        }
                    });
                }
                // === Logică de ștergere de pe HDD a fișierelor care nu mai există în client
                // Pas 1 Adaugă la căile existente în `fișiere` ulimele fișierele adăugate după ultimul `onchange`
                const filesInEditor = resObi.content.blocks.map((element) => {
                    if (element.type === 'attaches') {
                        const newUrl = new URL(decodeURIComponent(element.data.file.url)); // decodează linkul
                        console.log("După folosirea lui decode, ai următorul link: ", newUrl);
                        
                        let path = newUrl.pathname; // extrage calea
                        console.log("Am extras următoarea cale a documentului din url: ", path);
                        fisiere.add(path); // adaugă calea în fisiere. Dacă există deja, nu va fi adăugat.
                        return path;
                    }
                });
                
                // Fă verificările dacă cel puțin un document a fost adăugat
                if(fisiere.size > 0) {
                    let FtoDelete = Array.from(fisiere).map((path) => {
                        // Caută în setul fișierelor după ultima modificare
                        if (!filesInEditor.includes(path)){
                            return path;
                        }
                    });
                    if (FtoDelete.length > 0) {                    
                        FtoDelete.forEach(function clbk4Eac2Del (path) {
                            if (path) {
                                fisiere.delete(path);
                                // extrage numele fișierului din `fileUrl`
                                let fileName = path.split('/').pop();
                                // emite un eveniment de ștergere a fișierului din subdirectorul resursei                                
                                pubComm.emit('delfile', {
                                    uuid: resObi.uuid,
                                    idContributor: resObi.idContributor,
                                    fileName: fileName
                                });
                                pubComm.on('delfile', (messagge) => {
                                    console.log("Am șters cu următoarele detalii ", messagge);
                                });
                            }
                        });
                    }
                }
            }
            // tratează cazul în care userul este validator
            if (insertGal) pickCover(); // formează galeria pentru ca utilizatorul să poată selecta o imagine
        }).catch((e) => {
            console.log(e);
        });
    }
});

// #2
function deleteRes () {
    pubComm.emit('delresid', resObi);
    // console.log('Am trimis obiectul: ', resObi);
    pubComm.on('delresid', (res) => {
        console.log(res);
        window.location = '/profile/resurse/';
    });
}

// #3
var resursa          = document.getElementById(resObi.id);
var validateCheckbox = document.getElementById('valid');
var publicCheckbox   = document.getElementById('public');
validateCheckbox.addEventListener('click', validateResource);
// tratează cazul în care este doar validator
if (publicCheckbox) publicCheckbox.addEventListener('click', setGeneralPublic);

// setează clasele în funcție de starea resursei
if (validateCheckbox.checked) {
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
}

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
}

/**
 * Funcția are rolul de a face vizibil selectorul de arii
 */
function showArii() {
    let ariiSelector = document.querySelector('#arii-curr');
    ariiSelector.hidden ? ariiSelector.hidden = false : ariiSelector.hidden = true;
    // Verifică care arii există deja si pune-le atributul selected în multi selectul care va apărea.
    //# 1 constituie un array al ariilor deja existente
}

function showCompDig() {
    let compdig = document.querySelector('#compdig');
    compdig.hidden ? compdig.hidden = false : compdig.hidden = true;
}

function adaugArie() {
    // Verifică mai întâi dacă nu cumva aria deja există între elementele grafice.
}

/* 
    Obiectul primit `resourceFile` este `objRes` din `personal-res` și are următoarea semnătură:
    {
        user: RED.idContributor, // este de forma "5e31bbd8f482274f3ef29103" [înainte era email-ul]
        name: RED.nameUser,      // este de forma "Nicu Constantinescu"
        uuid: RED.uuid,          // dacă deja a fost trimisă o primă resursă, înseamnă că în `RED.uuid` avem valoare deja. Dacă nu, la prima încărcare, serverul va emite unul înapoi în client
        resF: file,              // este chiar fișierul: lastModified: 1583135975000  name: "Sandro_Botticelli_083.jpg" size: 2245432 type: "image/jpeg"
        numR: file.name,         // name: "Sandro_Botticelli_083.jpg"
        type: file.type,         // type: "image/jpeg"
        size: file.size
    };
*/
            

// Trebuie trimis doar user și uuid pentru a crea o versiune a resursei
/**
 * Funcția generează subdirectorul versiunii în backend.
 */
function activateChangeMode () {
    pubComm.emit('createtempver', {user: resObi.contribuitor, uuid: resObi.id});
}

// Afișează selectorul de imagini - https://codepen.io/kskhr/pen/pRwKjg
/**
 * Funcția este receptor pentru containerele imaginilor timbru
 * Funcția are rolul de a bifa și debifa imaginile din galeria celor expuse selecției.
 */
function clickImgGal () {
    // selectează toate elementele care au clasa `.image-checkbox`
    let elementContainer = document.querySelectorAll('.image-checkbox'); // e o HTMLColection de div-uri care conțin fiecare următorii copii: img, input, svg
    // caută între cei trei copii elementul <input>
    elementContainer.forEach( liveNode => {
        // caută primul element <input type="checkbox">, care este în mod normal și primul care are atributul `checked`
        let inputCollection = liveNode.querySelectorAll('input[type=checkbox]');
        inputCollection.forEach(element => {
            // adaugă-i acestui element clasa `image-checkbox-checked`
            if (element.checked) {
                element.classList.add('image-checkbox-checked');
            } else {
                // altfel, sterge-i clasa `image-checkbox-checked`
                element.classList.remove('image-checkbox-checked');
            }
        });
    });

    this.classList.toggle('image-checkbox-checked');
    var checkbox = this.querySelector('input[type=checkbox]');

    if(checkbox.checked === false) {
        checkbox.checked = true;
    } else {
        checkbox.checked = false;
    }

    if (checkbox.checked === true) {
        this.querySelector('svg').classList.add('d-block');
    } else {
        this.querySelector('svg').classList.add('d-none');
    }

    if(checkbox.checked === true){
        this.querySelector('svg').classList.remove('d-none');
        this.querySelector('svg').classList.toggle('d-block');
    }
}

var insertGal = document.getElementById('imgSelector');
/**
 * Funcția generează toate elementele ce poartă imagini pentru a putea fi bifată cea care devine coperta resursei.
 */
function pickCover () {
    insertGal.innerHTML = '';
    for (let img of imagini) {
        // console.log('imaginea selectată pentru copertă este: ', img);
        
        let container = new createElement('div', '', [`col-xs-4`, `col-sm-3`, `col-md-2`, `nopad`, `text-center`], null).creeazaElem();
        container.addEventListener('click', clickImgGal);
        let imgCheck = new createElement('div', '', [`image-checkbox`], null).creeazaElem();
        //FIXME: trebuie doar căi relative!!!! Repară stringurile care sunt culese în `imagini`.
        
        let imgElem = new createElement('img', '', [`img-responsive`], {src: `${img}`}).creeazaElem();
        let inputElem = new createElement('input', '', [`inputCheckGal`], {type: 'checkbox', value: `${img}`}).creeazaElem();
        let inputI = new createElement('i', '', [`fa`, 'fa-check', 'd-none'], null).creeazaElem();

        imgCheck.appendChild(imgElem);
        imgCheck.appendChild(inputElem);
        imgCheck.appendChild(inputI);
        container.appendChild(imgCheck);
        insertGal.appendChild(container);
    }
    return insertGal;
}