// TODO: Introdu mecanismul de ștergere
// #1 Ref element
// #2 Trimite un event „delresid” in server::serverul șterge înregistrarea din MongoDB și din Elasticsearch și directorul de pe HDD.
// #3 serverul trimite înapoi pe același eveniment confirmarea că a șters tot și face redirectare către /profile/resurse

// #1
var RED = document.querySelector('.resursa');
var dataRes = RED.dataset;
var resObi = {
    id: dataRes.id, 
    contribuitor: dataRes.contributor,
    content: JSON.parse(dataRes.content)
};

/* === Integrarea lui EditorJS === https://editorjs.io */
const editorX = new EditorJS({
    data: resObi.content.content,
    onReady: () => {
        console.log('Editor.js e gata de treabă!');
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
    }
});

// #2
function deleteRes () {
    pubComm.emit('delresid', resObi);
    // console.log('Am trimis obiectul: ', resObi);
    pubComm.on('deldir', (res) => {
        // alert(res);
        if (res) {
            window.location = '/profile/resurse/';
        }
    });
}

// #3
var resursa = document.getElementById(resObi.id);
var validateCheckbox = document.getElementById('valid');
var publicCheckbox = document.getElementById('public');
validateCheckbox.addEventListener('click', validateResource);
publicCheckbox.addEventListener('click', setGeneralPublic);

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

