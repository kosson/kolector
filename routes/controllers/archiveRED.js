require('dotenv').config();
/* === DEPENDINȚE === */
const path        = require('path');
const fs          = require('fs');
const archiver    = require('archiver');
const moment      = require('moment');
const logger      = require('../../util/logger');
const mongoose    = require('mongoose');
const Resursa     = require('../../models/resursa-red'); // Adu modelul resursei
// HELPERI
let editorJs2HTMLstatic = require('./editorJs2HTMLstatic');
let walk = require('../../util/walk');

/* === DESCĂRCARE ZIP === */
function archiveRED (req, res, next) {
    // console.log(`Parametrii primiti sunt `, req.params);
    // console.log(`Query-ul primit este `, req.query);
    // https://forbeslindesay.github.io/express-route-tester/

    // #1 Generează dinamic o pagină HTML a resursei
    Resursa.findById(req.params.id).populate({path: 'competenteS'}).lean().then(function (resursa) {
        if(resursa != null) {
            // console.log(`Baza cu care generezi pagina web este aici `, resursa.content);
            // #1.1. Generează o pagină web care să facă referință la toate resursele ca fiind locale dar care sunt în subdirul /data
            // adaptează editorJS2HTML.js
            let articlehtml = editorJs2HTMLstatic(resursa.content, resursa.coperta);
    
            let localizat = moment(resursa.date).locale('ro').format('LLL');
            resursa.dataRo = `${localizat}`; // formatarea datei pentru limba română.
    
            let titlurialternative = '';
            if (resursa.titleI18n) {
                let ta = resursa.titleI18n.map((elem) => {
                    let keys = Object.keys(elem), alt;
                    for (alt of keys) {
                        return `<p itemprop="alternativeHeadline"><strong>${alt}</strong>: <em>${elem[alt]}</em></p>`;
                    }
                });
                titlurialternative = ta.join('');
            }
    
            let arricurriculare = '';
            if (resursa.arieCurriculara) {
                let ac = resursa.arieCurriculara.map((elem) => {
                    return `<p itemprop="targetName">${elem}</p>`;
                });
                arricurriculare = ac.join('');
            }
    
            let clase = '';
            if (resursa.level) {
                let cl = resursa.level.map((elem) => {
                    return `<p itemprop="educationalLevel">${elem}</p>`;
                });
                clase = cl.join('');
            }
    
            let discipline = '';
            if (resursa.discipline) {
                let discs = resursa.discipline.map((elem) => {
                    return `<p itemprop="teaches">${elem}</p>`;
                });
                discipline = discs.join('');
            }
    
            let tags = '';
            if (resursa.etichete) {
                let tgs = resursa.etichete.map((elem) => {
                    return `<span itemprop="keywords">${elem}</span>`;
                });
                tags = tgs.join(' ');
            }
    
            let compsG = '';
            if (resursa.competenteGen) {
                let cpgs = resursa.competenteGen.map((elem) => {
                    return `<p itemprop="teaches">${elem}</p>`;
                });
                compsG = cpgs.join('');
            }
            
            let compsS = '';
            if (resursa.competenteS) {
                let cpgss = resursa.competenteGen.map((elem) => {
                    return `<p itemprop="teaches">${elem}</p>`;
                });
                compsS = cpgss.join('');
            }
    
            let activs = '';
            if (resursa.activitati) {
                let acts = resursa.activitati.map((elem) => {
                    return `<p itemprop="teaches">${elem}</p>`;
                });
                activs = acts.join('');
            }
    
            let resgroups = '';
            if (resursa.grupuri) {
                let grps = resursa.grupuri.map((elem) => {
                    return `<li itemprop="educationalRole">${elem}</li>`;
                });
                resgroups = grps.join('');
            }
            
            let maters = '';
            if (resursa.materiale) {
                let mats = resursa.materiale.map((elem) => {
                    return `<p>${elem}</p>`;
                });
                maters = mats.join('');
            }
                    
            let domes = '';
            if (resursa.domeniu) {
                let mats = resursa.domeniu.map((elem) => {
                    return `<p>${elem}</p>`;
                });
                domes = mats.join('');
            }
    
            let fcss = '';
            if (resursa.functii) {
                let fcs = resursa.functii.map((elem) => {
                    return `<p>${elem}</p>`;
                });
                fcss = fcs.join('');
            }
    
            let dems = '';
            if (resursa.demersuri) {
                let dmss = resursa.demersuri.map((elem) => {
                    return `<p>${elem}</p>`;
                });
                dems = dmss.join('');
            }
    
            let invss = '';
            if (resursa.invatarea) {
                let invs = resursa.invatarea.map((elem) => {
                    return `<p>${elem}</p>`;
                });
                invss = invs.join('');
            }
    
            let toolling = '';
            if (resursa.relatedTo) {
                let tlss = resursa.relatedTo.map((elem) => {
                    return `<p>${elem}</p>`;
                });
                toolling = tlss.join('');
            }
    
            let htmlpage = `
                <!DOCTYPE html>
                <html lang="ro-RO">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <meta http-equiv="X-UA-Compatible" content="ie=edge">
                        <title>${req.params.idres}</title>
                        <style>
                            body {
                                display: grid;
                                grid-template-columns: 25% 25% 25% 25%;
                                grid-template-rows: auto;
                                grid-template-areas:
                                    "header header header header" 
                                    "main main main main" 
                                    "footer footer footer footer"
                            }
                            header {
                                grid-area: header;
                            }
                            main {
                                grid-area: main;
                                justify-self: stretch;
                            }
                            footer: {
                                grid-area: footer;
                            }
                        </style>
                    </head>
                    <body itemscope itemtype="https://schema.org/LearningResource">
                        <header>
                            <section>
                                <!-- TITLE -->
                                <h1 itemprop="name">${resursa.title}</h1>
    
                                <!-- DATA CONTRIBUȚIEI -->
                                <p>
                                    <meta itemprop="datePublished" content="${resursa.dataRo}">
                                    ${resursa.dataRo}
                                </p>
    
                                <!-- CREATOR -->
                                <p itemprop="creator">
                                    <i class="fas fa-user-circle"></i><span contenteditable="true">${resursa.autori}</span>
                                </p>
    
                                <!-- TITLURILE ALTERNATIVE -->
                                <div class="titlaltres">
                                    <h5>Titluri alternative</h5>
                                    ${titlurialternative}
                                </div>
                            </section>
                            <section>
                                <!-- ÎNCADRARE -->
                                <div>
                                    <h5><span itemprop="educationalFramework">Arie curriculară</span></h5>
                                    ${arricurriculare}
                                    <h5>Clasa</h5>
                                    ${clase}
                                    <h5>Discipline</h5>
                                    ${discipline}
                                    <h5>Competențe generale</h5>
                                    ${compsG}
                                    <h5>Competențe specifice</h5>
                                    ${compsS}
                                    <h5>Activități</h5>
                                    ${activs}
                                </div>
                            </section>
                            <section>
                                <h5>Descriere</h5>
                                <p itemprop="description" class="lead">${resursa.description}</p>
                                <h5>Cuvinte cheie</h5>
                                ${tags}
                            <section>
                        </header>
                        <main>
                            <aside>
                                <h5>RED-ul necesită competențe digitale de nivelul</h5>
                                ${resursa.abilitati}
                                <h5> RED-ul se adresează în mod direct</h5>
                                <ul itemprop="audience" itemscope itemtype="http://schema.org/EducationalAudience">
                                    ${resgroups}
                                </ul>
                                <h5>Activități de învățare susținute</h5>
                                <p>${resursa.rol}</p>
                                <h5>Materiale necesare redării/interpretării</h5>
                                ${maters}
                                <h5>Domeniul căruia i se adresează resursa</h5>
                                ${domes}
                                <h5>Resursa vizează:</h5>
                                ${fcss}
                                <h5>Tipul de demers / raționament utilizat în realizarea resursei</h5>
                                ${dems}
                                <h5>Modul în care se produce învățarea se face prin</h5>
                                ${invss}
                                <h5>Mijloace / materiale didactice necesare</h5>
                                <p>${resursa.dependinte}</p>
                                <h5>Instrumente folosite în elaborarea RED-ului</h5>
                                ${toolling}
                            </aside>
                            ${articlehtml}
                        </main>
                        <!-- [BIBLIOGRAFIE] -->
                        <section>
                            <div class="bibsrespub">
                                <h5>Bibliografie</h5>
                                <p>${resursa.bibliografie}</p>
                            </div>
                        </section>
                        <footer>
                            <h5>Licența</h5>
                            <p itemprop="license">${resursa.licenta}</p>
                        </footer>
                    </body>
                </html>
            `;
            
            const data = new Uint8Array(Buffer.from(htmlpage));
    
            // #2 Creează dinamic o arhivă cu tot conținutul subdirectorului /data și trimite-o în client
            fs.writeFile(`./repo/${req.query.path}/data/index.html`, data, async (error) => {
                if (error) {
                    console.log(error);
                }
    
                // creează informația necesară răspunsului
                let dazipname= `${req.query.uuid.slice(0, 4)}-${resursa.title.slice(0, 9)}-${localizat}.zip`;
                res.set('Content-Type','application/octet-stream');
                res.set('Content-Disposition',`attachment; filename=${dazipname}`);
    
                let originpath = path.join(`./repo/`, `${req.query.path}/data/`),
                    path2file  = `${originpath}${req.query.uuid.slice(0, 4)}-${resursa.title.slice(0, 9)}-${localizat}.zip`,
                    output     = fs.createWriteStream(path2file),
                    archive    = archiver('zip', { zlib: { level: 9 } });
    
                // https://github.com/archiverjs/node-archiver/issues/402 [archiver.directory doesn't follow symbolic link #402]            
                let paths = await walk(originpath);
                // let gpaths = await globby([`${originpath}**`, '!node_modules']);//ceva nu e în regulă! Nu se împacă cu archiver
    
                paths.forEach((entry) => {
                    archive.file(entry, {name: path.basename(entry)});
                }); 
    
                // Pipe în Writable și constituie arhiva!                   
                // archive.pipe(output);
                archive.pipe(res);
    
                // WARNINGS
                archive.on('warning', function archiveMakingWarning (warning) {
                    console.warn("[sockets.js::'delresid'] Atenție, la arhivare a dat warning", warning);
                });
                // ERRORS
                archive.on('error', function manageErrorOnArchiving (err) {
                    console.error("[sockets.js::'delresid'] La crearea arhivei a apărut eroarea!", err);
                    logger.error(`[sockets.js::'delresid'] În timpul arhivării după ștergere a apărut eroarea ${err.message}`);
                });
    
                output.on('close', function() {
                    res.set('Content-Length', archive.pointer());
                    console.log(archive.pointer() + ' total bytes'); // archiver has been finalized and the output file descriptor has closed.
                });
    
                output.on('end', function() {
                    console.log('Data has been drained');
                });
    
                /* === FINALIZEAZĂ ARHIVAREA === */
                archive.finalize();
    
                // Șterge resursele necesare arhivei cu scopul de a nu polua status-ul git-ului
                res.on('finish', () => {
                    // console.log(`S-a trimis arhiva!!!!`, archive.pointer());
                    
                    // sterge fișierele
                    let exces = [
                        path2file,
                        `${originpath}index.html`
                    ], felem;
                    for (felem of exces) {
                        fs.unlink(felem, (error) => {
                            if (error) {
                                console.log(error);
                                logger.error(error);
                            }
                        });
                    }
                });
            });
        } else {
            throw new Error('Resursa nu a fost găsita');
        }
    }).catch((err) => {
        if (err) {
            console.error(err);
            logger.error(err);
            // rre('mesaje', `Nu pot să afișez resursa. Este posibil să nu mai existe! Eroare: ${err}`);
            res.redirect('/administrator/reds');
        }
    });
};

module.exports = archiveRED;