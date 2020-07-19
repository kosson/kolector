const fatete = new Set(); // set pentru selecții de fațete
const primare = document.getElementById('primare');

// La `parent` va fi codul care este precizat în `data-*` de la `Aria/arii curriculare` din HTML - client
// REGULĂ: array-urile disciplinelor nu trebuie să aibă coduri copiate de la array-ul altei discipline (produce ghosturi și orfani pe ecran)
// REGULĂ: pentru a se face colocarea sub-disciplinelor la o disciplină, cele din array trebuie să pornească cu un fragment de caractere identic.
// CLASA 0
const mapCodDisc = new Map();
mapCodDisc.set("0", 
    [
        /* === LIMBĂ ȘI COMUNICARE === */
        {
            parent:           ["lbcom"], 
            nume:             "Comunicare în limba română",
            coduriDiscipline: [
                "lbcomRom0", 
                "lbcomGermana0", 
                "lbcomMaghiara0", 
                "lbcomRroma0", 
                "lbcomSarba0", 
                "lbcomSlovaca0"
            ]            
        },
        {
            parent:           ["lbcom"], 
            nume:             "Comunicare în limba maternă",
            coduriDiscipline: [
                'lbmatBulgara0', 
                'lbmatCeha0', 
                'lbmatCroata0', 
                'lbmatGermana0', 
                'lbmatGerinrom0', 
                'lbmatItaliana0', 
                'lbmatMaghiara0', 
                'lbmatMaginrom0', 
                'lbmatMinlbmag0',
                'lbmatMinlbrom0',
                'lbmatNeogreaca0', 
                'lbmatPolona0', 
                'lbmatRroma0', 
                'lbmatRusa0', 
                'lbmatSarba0', 
                'lbmatSlovaca0', 
                'lbmatSlolbcl0',
                'lbmatTurca0', 
                'lbmatUcraina0',
                'lbmatUcrarom0'
            ]            
        },
        {
            parent:           ["lbcom"], 
            nume:             "Comunicarea în limba modernă",
            coduriDiscipline: ["lbmod0"]            
        },
        /* === MATEMATICĂ ȘI ȘTIINȚE ALE NATURII === */
        {
            parent:           ["matstnat"], 
            nume:             "Matematică și explorarea mediului",
            coduriDiscipline: ["mateMed0"]
        },
        /* === OM ȘI SOCIETATE === */
        {
            parent:           ["omsoc"], 
            nume:             "Religie",
            coduriDiscipline: [
                'relAdv0', 
                'relBapt0', 
                'relEvca0',
                'relCrdev0', 
                'relGrcat0',
                'relOrt0', 
                'relOrtucr0', 
                'relPen0', 
                'relRef0', 
                'relRomcatmg0', 
                'relRomcatro0', 
                'relUnit0',
                'relMus0',
                'relOrtritv0'
            ]
        },
        /* === EDUCAȚIE FIZICĂ, SPORT ȘI SĂNĂTATE === */
        {
            parent:           ["edfizsp"], 
            nume:             "Educație fizică",
            coduriDiscipline: ["fizic0"]         
        },
        /* === EDUCAȚIE FIZICĂ, SPORT ȘI SĂNĂTATE + ARTE === */
        {
            parent:           ["edfizsp", "arte"], 
            nume:             "Muzică și mișcare",
            coduriDiscipline: [
                "muzmi0",
                "muzmiBg0",
                "muzmiCh0",
                "muzmiHr0",
                "muzmiDe0",
                "muzmiDero0",
                "muzmiIt0",
                "muzmiMg0",
                "muzmiMgro0",
                "muzmiGr0",
                "muzmiRr0",
                "muzmiSr0",
                "muzmiSl0",
                "muzmiTr0",
                "muzmiUa0",
                "muzmiUaro0"
            ]
        },
        /* === ARTE + TEHNOLOGII === */
        {
            parent:           ["arte", "teh"], 
            nume:             "Arte vizuale și abilități practice",
            coduriDiscipline: ['artViz0']            
        },
        /* === CONSILIERE ȘI ORIENTARE === */
        {
            parent:           ["consor"], 
            nume:             "Dezvoltare personală",
            coduriDiscipline: ['dezvPers0']            
        },
        /* === CURRICULUM LA DECIZIA ȘCOLII (DISCIPLINE OPȚIONALE) === */
        {
            parent:           ["currsc"], 
            nume:             "Opționale",
            coduriDiscipline: [
                'optEds0',
                'optTra0'
            ]            
        }
    ]
);
mapCodDisc.set("1", 
    [
        /* === LIMBĂ ȘI COMUNICARE === */
        {
            parent:           ["lbcom"], 
            nume:             "Comunicare în limba română",
            coduriDiscipline: [
                "lbcomRom1", 
                "lbcomGermana1", 
                "lbcomMaghiara1", 
                "lbcomRroma1", 
                "lbcomSarba1", 
                "lbcomSlovaca1"
            ]            
        },
        {
            parent:           ["lbcom"], 
            nume:             "Comunicare în limba maternă",
            coduriDiscipline: [
                'lbmatBulgara1', 
                'lbmatCeha1', 
                'lbmatCroata1', 
                'lbmatGermana1', 
                'lbmatGerinrom1', 
                'lbmatItaliana1', 
                'lbmatMaghiara1', 
                'lbmatMaginrom1', 
                'lbmatMinlbmag1',
                'lbmatMinlbrom1',
                'lbmatNeogreaca1', 
                'lbmatPolona1', 
                'lbmatRroma1', 
                'lbmatRusa1', 
                'lbmatSarba1', 
                'lbmatSarbinrom1', 
                'lbmatSlovaca1', 
                'lbmatSlolbcl1',
                'lbmatTurca1', 
                'lbmatUcraina1',
                'lbmatUcrarom1'
            ]            
        },
        {
            parent:           ["lbcom"], 
            nume:             "Comunicarea în limba modernă",
            coduriDiscipline: ["lbmod1"]            
        },
        /* === MATEMATICĂ ȘI ȘTIINȚE ALE NATURII === */
        {
            parent:           ["matstnat"], 
            nume:             "Matematică și explorarea mediului",
            coduriDiscipline: ["mateMed1"]
        },
        /* === OM ȘI SOCIETATE === */
        {
            parent:           ["omsoc"], 
            nume:             "Religie",
            coduriDiscipline: [
                'relAdv1', 
                'relBapt1', 
                'relEvca1',
                'relCrdev1', 
                'relGrcat1',
                'relOrt1', 
                'relOrtucr1', 
                'relPen1', 
                'relRef1', 
                'relRomcatmg1', 
                'relRomcatro1', 
                'relUnit1',
                'relMus1',
                'relOrtritv1'
            ]
        },
        /* === EDUCAȚIE FIZICĂ, SPORT ȘI SĂNĂTATE === */
        {
            parent:           ["edfizsp"], 
            nume:             "Educație fizică",
            coduriDiscipline: ["fizic1"]         
        },
        {
            parent:           ["edfizsp"], 
            nume:             "Educație fizică practică",
            coduriDiscipline: ["fizicp1"]         
        },
        /* === EDUCAȚIE FIZICĂ, SPORT ȘI SĂNĂTATE + ARTE === */
        {
            parent:           ["edfizsp", "arte"], 
            nume:             "Muzică și mișcare",
            coduriDiscipline: [
                "muzmi1",
                "muzmiBg1",
                "muzmiCh1",
                "muzmiHr1",
                "muzmiDe1",
                "muzmiDero1",
                "muzmiIt1",
                "muzmiMg1",
                "muzmiMgro1",
                "muzmiGr1",
                "muzmiRr1",
                "muzmiSr1",
                "muzmiSl1",
                "muzmiTr1",
                "muzmiUa1",
                "muzmiUaro1"
            ]
        },
        /* === ARTE === */
        {
            parent:           ["arte"], 
            nume:             "Educație muzicală specializată",
            coduriDiscipline: ['edmzInstr1', 'edmzTeoafdi1']            
        },
        {
            parent:           ["arte"], 
            nume:             "Educație artistică și abilități practice",
            coduriDiscipline: ['edart1']            
        },
        /* === ARTE + TEHNOLOGII === */
        {
            parent:           ["arte", "teh"], 
            nume:             "Arte vizuale și abilități practice",
            coduriDiscipline: ['artViz1']           
        },
        /* === CONSILIERE ȘI ORIENTARE === */
        {
            parent:           ["consor"], 
            nume:             "Dezvoltare personală",
            coduriDiscipline: ['dezvPers1']            
        },
        /* === CURRICULUM LA DECIZIA ȘCOLII (DISCIPLINE OPȚIONALE) === */
        {
            parent:           ["currsc"], 
            nume:             "Opționale",
            coduriDiscipline: [
                'optEds1', 
                'optTra1'
            ]            
        }
    ]
);
mapCodDisc.set("2", 
    [
        /* === LIMBĂ ȘI COMUNICARE === */
        {
            parent:           ["lbcom"], 
            nume:             "Comunicare în limba română",
            coduriDiscipline: [
                "lbcomRom2", 
                "lbcomGermana2", 
                "lbcomMaghiara2", 
                "lbcomRroma2", 
                "lbcomSarba2", 
                "lbcomSlovaca2"
            ]            
        },
        {
            parent:           ["lbcom"], 
            nume:             "Comunicare în limba maternă",
            coduriDiscipline: [
                'lbmatBulgara2', 
                'lbmatCeha2', 
                'lbmatCroata2', 
                'lbmatGermana2', 
                'lbmatGerinrom2', 
                'lbmatItaliana2', 
                'lbmatMaghiara2', 
                'lbmatMaginrom2', 
                'lbmatMinlbmag2',
                'lbmatMinlbrom2',
                'lbmatNeogreaca2', 
                'lbmatPolona2', 
                'lbmatRroma2', 
                'lbmatRusa2', 
                'lbmatSarba2', 
                'lbmatSarbinrom2', 
                'lbmatSlovaca2', 
                'lbmatSlolbcl2',
                'lbmatTurca2', 
                'lbmatUcraina2',
                'lbmatUcrarom2'
            ]            
        },
        {
            parent:           ["lbcom"], 
            nume:             "Comunicarea în limba modernă",
            coduriDiscipline: ["lbmod2"]            
        },
        /* === MATEMATICĂ ȘI ȘTIINȚE ALE NATURII === */
        {
            parent:           ["matstnat"], 
            nume:             "Matematică și explorarea mediului",
            coduriDiscipline: ['mateMed2']
        },
        {
            parent:           ["matstnat"], 
            nume:             "Științe ale naturii",
            coduriDiscipline: ["stNat2"]         
        },
        /* === OM ȘI SOCIETATE === */
        {
            parent:           ["omsoc"], 
            nume:             "Religie",
            coduriDiscipline: [
                'relAdv2', 
                'relBapt2', 
                'relEvca2',
                'relCrdev2', 
                'relGrcat2',
                'relOrt2', 
                'relOrtucr2', 
                'relPen2', 
                'relRef2', 
                'relRomcatmg2', 
                'relRomcatro2', 
                'relUnit2',
                'relMus2',
                'relOrtritv2'
            ]
        },
        /* === EDUCAȚIE FIZICĂ, SPORT ȘI SĂNĂTATE === */
        {
            parent:           ["edfizsp"], 
            nume:             "Educație fizică",
            coduriDiscipline: ["fizic2"]         
        },
        {
            parent:           ["edfizsp"], 
            nume:             "Pregătire sportivă practică",
            coduriDiscipline: ["fizicp2"]         
        },
        /* === EDUCAȚIE FIZICĂ, SPORT ȘI SĂNĂTATE + ARTE === */
        {
            parent:           ["edfizsp", "arte"], 
            nume:             "Muzică și mișcare",
            coduriDiscipline: [
                "muzmi2",
                "muzmiBg2",
                "muzmiCh2",
                "muzmiHr2",
                "muzmiDe2",
                "muzmiDero2",
                "muzmiIt2",
                "muzmiMg2",
                "muzmiMgro2",
                "muzmiGr2",
                "muzmiRr2",
                "muzmiSr2",
                "muzmiSl2",
                "muzmiTr2",
                "muzmiUa2",
                "muzmiUaro2"
            ]
        },
        /* === ARTE === */
        {
            parent:           ["arte"], 
            nume:             "Educație muzicală specializată",
            coduriDiscipline: ['edmzInstr2', 'edmzTeoafdi2']            
        },
        /* === ARTE + TEHNOLOGII === */
        {
            parent:           ["arte", "teh"], 
            nume:             "Arte vizuale și abilități practice",
            coduriDiscipline: ['artViz2']           
        },
        /* === CONSILIERE ȘI ORIENTARE === */
        {
            parent:           ["consor"], 
            nume:             "Dezvoltare personală",
            coduriDiscipline: ['dezvPers2']            
        },
        /* === CURRICULUM LA DECIZIA ȘCOLII (DISCIPLINE OPȚIONALE) === */
        {
            parent:           ["currsc"], 
            nume:             "Opționale",
            coduriDiscipline: ['optEds2']            
        }
    ]
);
mapCodDisc.set("3", 
    [
        /* === LIMBĂ ȘI COMUNICARE === */
        {
            parent:           ["lbcom"], 
            nume:             "Comunicare în limba română",
            coduriDiscipline: [
                "lbcomRom3", 
                "lbcomGermana3", 
                "lbcomMaghiara3", 
                "lbcomRroma3", 
                "lbcomSarba3", 
                "lbcomSlovaca3",
                "lbcomCeha3"
            ]            
        },
        {
            parent:           ["lbcom"], 
            nume:             "Comunicare în limba maternă",
            coduriDiscipline: [
                'lbmatBulgara3', 
                'lbmatCeha3', 
                'lbmatCroata3', 
                'lbmatGermana3', 
                'lbmatGerinrom3', 
                'lbmatItaliana3', 
                'lbmatMaghiara3', 
                'lbmatMaginrom3', 
                'lbmatNeogreaca3', 
                'lbmatPolona3', 
                'lbmatRroma3', 
                'lbmatRusa3', 
                'lbmatSarba3', 
                'lbmatSlovaca3', 
                'lbmatTurca3', 
                'lbmatUcraina3'
            ]            
        },
        {
            parent:           ["lbcom"], 
            nume:             "Limbă modernă",
            coduriDiscipline: ['lbMod3']            
        },
        /* === MATEMATICĂ ȘI ȘTIINȚE ALE NATURII === */
        {
            parent:           ["matstnat"], 
            nume:             "Matematică",
            coduriDiscipline: ['mateMed3']
        },
        {
            parent:           ["matstnat"], 
            nume:             "Științe ale naturii",
            coduriDiscipline: ["stNat3"]         
        },
        /* === OM ȘI SOCIETATE === */
        {
            parent:           ["omsoc"], 
            nume:             "Educație civică",
            coduriDiscipline: ["edciv3"]         
        },
        {
            parent:           ["omsoc"], 
            nume:             "Religie",
            coduriDiscipline: [
                'relAdv3', 
                'relBapt3', 
                'relEvca3',
                'relCrdev3', 
                'relGrcat3',
                'relOrt3', 
                'relOrtucr3', 
                'relPen3', 
                'relRef3', 
                'relRomcatmg3', 
                'relRomcatro3', 
                'relUnit3',
                'relMus3',
                'relOrtritv3'
            ]
        },
        /* === EDUCAȚIE FIZICĂ, SPORT ȘI SĂNĂTATE === */
        {
            parent:           ["edfizsp"], 
            nume:             "Educație fizică",
            coduriDiscipline: ["fizic3"]         
        },
        {
            parent:           ["edfizsp"], 
            nume:             "Joc și mișcare",
            coduriDiscipline: ["jocmi3"]
        },
        {
            parent:           ["edfizsp"], 
            nume:             "Pregătire sportivă practică",
            coduriDiscipline: ["fizicp3"]         
        },
        /* === EDUCAȚIE FIZICĂ, SPORT ȘI SĂNĂTATE + ARTE === */
        {
            parent:           ["edfizsp", "arte"], 
            nume:             "Muzică și mișcare",
            coduriDiscipline: [
                "muzmi3",
                "muzmiBg3",
                "muzmiCh3",
                "muzmiHr3",
                "muzmiDe3",
                "muzmiDero3",
                "muzmiIt3",
                "muzmiMg3",
                "muzmiMgro3",
                "muzmiGr3",
                "muzmiRr3",
                "muzmiSr3",
                "muzmiSl3",
                "muzmiTr3",
                "muzmiUa3"
            ]
        },
        /* === ARTE + TEHNOLOGII === */
        {
            parent:           ["arte", "teh"], 
            nume:             "Arte vizuale și abilități practice",
            coduriDiscipline: ['artViz3']            
        },
        /* === ARTE === */
        {
            parent:           ["arte"], 
            nume:             "Educație muzicală specializată",
            coduriDiscipline: ['edmzInstr3', 'edmzTeoafdi3']            
        },
        /* === CURRICULUM LA DECIZIA ȘCOLII (DISCIPLINE OPȚIONALE) === */
        {
            cod:              "opt3", 
            parent:           ["currsc"], 
            nume:             "Opționale",
            coduriDiscipline: [
                'optMed3',
                'optEds3'
            ]            
        }
    ]
);
mapCodDisc.set("4", 
    [
        /* === LIMBĂ ȘI COMUNICARE === */
        {
            parent:           ["lbcom"], 
            nume:             "Comunicare în limba română",
            coduriDiscipline: [
                "lbcomRom4", 
                "lbcomGermana4", 
                "lbcomMaghiara4", 
                "lbcomRroma4", 
                "lbcomSarba4", 
                "lbcomSlovaca4",
                "lbcomCeha4"
            ]            
        },
        {
            parent:           ["lbcom"], 
            nume:             "Comunicare în limba maternă",
            coduriDiscipline: [
                'lbmatBulgara4', 
                'lbmatCeha4', 
                'lbmatCroata4', 
                'lbmatGermana4', 
                'lbmatGerinrom4', 
                'lbmatItaliana4', 
                'lbmatMaghiara4', 
                'lbmatMaginrom4', 
                'lbmatNeogreaca4', 
                'lbmatPolona4', 
                'lbmatRroma4', 
                'lbmatRusa4', 
                'lbmatSarba4', 
                'lbmatSlovaca4', 
                'lbmatTurca4', 
                'lbmatUcraina4'
            ]            
        },
        {
            parent:           ["lbcom"], 
            nume:             "Limbă modernă",
            coduriDiscipline: ['lbMod4']            
        },
        /* === MATEMATICĂ ȘI ȘTIINȚE ALE NATURII === */
        {
            parent:           ["matstnat"], 
            nume:             "Matematică",
            coduriDiscipline: ['mateMed4']
        },
        {
            parent:           ["matstnat"], 
            nume:             "Științe ale naturii",
            coduriDiscipline: ["stNat4"]         
        },
        /* === OM ȘI SOCIETATE === */
        {
            parent:           ["omsoc"], 
            nume:             "Educație civică",
            coduriDiscipline: ["edciv4"]         
        },
        {
            parent:           ["omsoc"], 
            nume:             "Geografie",
            coduriDiscipline: ["geo4"]         
        },
        {
            parent:           ["omsoc"], 
            nume:             "Istorie",
            coduriDiscipline: ["ist4"]         
        },
        {
            parent:           ["omsoc"], 
            nume:             "Religie",
            coduriDiscipline: [
                'relAdv4', 
                'relBapt4', 
                'relEvca4',
                'relCrdev4', 
                'relGrcat4',
                'relOrt4', 
                'relOrtucr4', 
                'relPen4', 
                'relRef4', 
                'relRomcatmg4', 
                'relRomcatro4', 
                'relUnit4',
                'relMus4',
                'relOrtritv4'
            ]
        },
        /* === EDUCAȚIE FIZICĂ, SPORT ȘI SĂNĂTATE === */
        {
            parent:           ["edfizsp"], 
            nume:             "Educație fizică",
            coduriDiscipline: ["fizic4"]         
        },
        {
            parent:           ["edfizsp"], 
            nume:             "Joc și mișcare",
            coduriDiscipline: ["jocmi4"]
        },
        {
            parent:           ["edfizsp"], 
            nume:             "Pregătire sportivă practică",
            coduriDiscipline: ["fizicp4"]         
        },
        /* === EDUCAȚIE FIZICĂ, SPORT ȘI SĂNĂTATE + ARTE === */
        {
            parent:           ["edfizsp", "arte"], 
            nume:             "Muzică și mișcare",
            coduriDiscipline: [
                "muzmi4",
                "muzmiBg4",
                "muzmiCh4",
                "muzmiHr4",
                "muzmiDe4",
                "muzmiDero4",
                "muzmiIt4",
                "muzmiMg4",
                "muzmiMgro4",
                "muzmiGr4",
                "muzmiRr4",
                "muzmiSr4",
                "muzmiSl4",
                "muzmiTr4",
                "muzmiUa4"
            ]
        },
        /* === ARTE + TEHNOLOGII === */
        {
            parent:           ["arte", "teh"], 
            nume:             "Arte vizuale și abilități practice",
            coduriDiscipline: ['artViz4']            
        },
        /* === ARTE === */
        {
            parent:           ["arte"], 
            nume:             "Educație muzicală specializată",
            coduriDiscipline: ['edmzInstr4', 'edmzTeoafdi4']            
        },
        {
            parent:           ["arte"], 
            nume:             "Educație artistică specializată",
            coduriDiscipline: ['edarDans4', 'edarRitm4']            
        },
        /* === CURRICULUM LA DECIZIA ȘCOLII (DISCIPLINE OPȚIONALE) === */
        {
            parent:           ["currsc"], 
            nume:             "Opționale",
            coduriDiscipline: [
                'optMed4',
                'optEds4'
            ]            
        }
    ]
);
mapCodDisc.set("5", 
    [
        /* === Limbă și comunicare === */
        {
            parent: ["lbcom"], 
            nume:   "Limba și literatura română",
            coduriDiscipline: [
                'lbcomRom5', 
                'lbcomRomMag5'
            ]            
        },
        {
            parent: ["lbcom"], 
            nume:   "Limba maternă",
            coduriDiscipline: [
                'lbmatBulgara5', 
                'lbmatCeha5', 
                'lbmatCroata5', 
                'lbmatGermana5', 
                'lbmatGeringer5', 
                'lbmatItaliana5', 
                'lbmatMaghiara5', 
                'lbmatMaginmag5', 
                'lbmatNeogreaca5', 
                'lbmatPolona5', 
                'lbmatRroma5', 
                'lbmatRusa5', 
                'lbmatSarba5', 
                'lbmatSlovaca5', 
                'lbmatTurca5', 
                'lbmatUcraina5'
            ]
        },
        {
            parent: ["lbcom"], 
            nume:   "Limba modernă 1",
            coduriDiscipline: [
                'lbmod1Engleza5', 
                'lbmod1EngInt5', 
                'lbmod1Franceza5', 
                'lbmod1FraInt5', 
                'lbmod1Italiana5', 
                'lbmod1ItaInt5', 
                'lbmod1Spaniola5', 
                'lbmod1SpanInt5', 
                'lbmod1Ebraica5', 
                'lbmod1Germana5', 
                'lbmod1GerInt5', 
                'lbmod1Rusa5', 
                'lbmod1RusInt5', 
                'lbmod1Japoneza5', 
                'lbmod1JapInt5'
            ]            
        },
        {
            parent: ["lbcom"], 
            nume:   "Limbă modernă 2",
            coduriDiscipline: [
                'lbmod2Chineza5', 
                'lbmod2Engleza5', 
                'lbmod2Franceza5', 
                'lbmod2Italiana5', 
                'lbmod2Spaniola5', 
                'lbmod2Turca5', 
                'lbmod2Germana5', 
                'lbmod2Japoneza5', 
                'lbmod2Rusa5', 
                'lbmod2Portugheza5'
            ]           
        },
        {
            parent: ["lbcom"], 
            nume:   "Elemente de limbă latină și de cultură romanică",
            coduriDiscipline: [
                'ellatRom5'
            ]           
        },
        {
            parent: ["lbcom"],
            nume:   "Elemente de limbă latină și de cultură romanică",
            coduriDiscipline: ['lbcomEllatRom5']
        },
        /* === Matematică și științe ale naturii === */
        {
            parent: ["matstnat"], 
            nume:   "Matematică",
            coduriDiscipline: ['mat5']
        },
        {
            parent: ["matstnat"], 
            nume:   "Biologie",
            coduriDiscipline: ['bio5']
        },
        /* === Om și societate === */
        {
            parent: ["omsoc"], 
            nume:   "Educație socială", // Gândire critică și drepturile copilului
            coduriDiscipline: ['edusoc5']            
        },
        {
            parent: ["omsoc"], 
            nume:   "Istorie",
            coduriDiscipline: ['ist5']            
        },
        {
            parent: ["omsoc"], 
            nume:   "Geografie",
            coduriDiscipline: ['geo5']            
        },
        {
            parent: ["omsoc"], 
            nume: "Religie",
            coduriDiscipline: [
                'relAdvz5', 
                'relBapt5', 
                'relCrdev5', 
                'relEvca5', 
                'relGrcat5', 
                'relMus5', 
                'relOrt5', 
                'relOrtritv5', 
                'relOrtucr5', 
                'relPen5', 
                'relRef5', 
                'relRefmag5', 
                'relRomcatro5', 
                'relRomcatmg5', 
                'relRomcatlbmg5', 
                'relUnit5'
            ]            
        },
        /* === Arte === */
        {
            parent: ["arte"], 
            nume: "Educație plastică",
            coduriDiscipline: [
                'edpl5'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Educație muzicală",
            coduriDiscipline: [
                'edmuz5',
                'edmuzGer5',
                'edmuzIta5',
                'edmuzMag5',
                'edmuzMagr5',
                'edmuzPol5',
                'edmuzRrm5',
                'edmuzSrb5',
                'edmuzSlv5',
                'edmuzTur5',
                'edmuzUcr5'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Instrument principal",
            coduriDiscipline: [
                'instr5'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Teorie - Solfegiu - Dicteu",
            coduriDiscipline: [
                'tsd5'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Pian complementar/instrument auxiliar",
            coduriDiscipline: [
                'piaux5'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Dans clasic",
            coduriDiscipline: [
                'dansc5'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Ritmică",
            coduriDiscipline: [
                'ritm5'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Desen",
            coduriDiscipline: [
                'desen5'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Pictură",
            coduriDiscipline: [
                'pictr5'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Modelaj",
            coduriDiscipline: [
                'model5'
            ]            
        },
        /* === Educație fizică, sport și sănătate === */
        {
            parent: ["edfizsp5"], 
            nume: "Educație fizică, sport",
            coduriDiscipline: ['fizic5']            
        },
        {
            parent: ["edfizsp5"], 
            nume: "Pregătire sportivă practică",
            coduriDiscipline: [
                'pfizAtl5', 
                'pfizBad5', 
                'pfizBas5', 
                'pfizBab5', 
                'pfizCan5', 
                'pfizDns5', 
                'pfizFot5', 
                'pfizGif5', 
                'pfizGim5', 
                'pfizGir5', 
                'pfizHal5', 
                'pfizHan5', 
                'pfizHok5', 
                'pfizHoi5', 
                'pfizInt5', 
                'pfizJud5', 
                'pfizKca5', 
                'pfizKrt5', 
                'pfizGro5', 
                'pfizLpl5', 
                'pfizOsp5', 
                'pfizPar5', 
                'pfizPav5', 
                'pfizPpa5', 
                'pfizRgb5', 
                'pfizSne5', 
                'pfizSia5', 
                'pfizSap5', 
                'pfizSbi5', 
                'pfizSfd5', 
                'pfizSor5', 
                'pfizSsr5', 
                'pfizScr5', 
                'pfizSfb5', 
                'pfizSae5', 
                'pfizSah5', 
                'pfizTen5', 
                'pfizTem5', 
                'pfizVol5', 
                'pfizYht5'
            ]            
        },
        /* === Tehnologii === */
        {
            parent: ["tech"], 
            nume: "Tehnologii",
            coduriDiscipline: [
                'tecEdtap5', 
                'tecInfo5', 
                'tecEd5'
            ]            
        },
        /* === Consiliere și orientare === */
        {
            parent: ["consor"], 
            nume: "Consiliere și orientare",
            coduriDiscipline: ['consEd5']            
        },
        /* === Curriculum la decizia școlii === */
        {
            parent: "cds", 
            nume: "Curriculum la decizia școlii ",
            coduriDiscipline: [
                'cdsIst5', 
                'cdsLect5', 
                'cdsGrne5', 
                'cdsMicr5', 
                'cdsMatsc5', 
                'cdsEdvit5', 
                'cdsRadlt5',
                'cdsMed5',
                'cdsCiv5',
                'cdsArm5',
                'cdsEco5',
                'cdsFin5',
                'cdsIcu5',
                'cdsEds5',
                'cdsMag5',
                'cdsGrm5',
                'cdsSah5'
            ]            
        }
    ]
);
mapCodDisc.set("6", 
    [        
        /* === Limbă și comunicare === */
        {
            parent: ["lbcom"], 
            nume:   "Limba și literatura română",
            coduriDiscipline: [
                'lbcomRom6', 
                'lbcomRomMag6'
            ]            
        },
        {
            parent: ["lbcom"], 
            nume:   "Limba maternă",
            coduriDiscipline: [
                'lbmatBulgara6', 
                'lbmatCeha6', 
                'lbmatCroata6', 
                'lbmatGermana6', 
                'lbmatGeringer6', 
                'lbmatItaliana6', 
                'lbmatMaghiara6', 
                'lbmatMaginmag6', 
                'lbmatNeogreaca6', 
                'lbmatPolona6', 
                'lbmatRroma6', 
                'lbmatRusa6', 
                'lbmatSarba6', 
                'lbmatSlovaca6', 
                'lbmatTurca6', 
                'lbmatUcraina6'
            ]
        },
        {
            parent: ["lbcom"], 
            nume:   "Limba modernă 1",
            coduriDiscipline: [
                'lbmod1Engleza6', 
                'lbmod1EngInt6', 
                'lbmod1Franceza6', 
                'lbmod1FraInt6', 
                'lbmod1Italiana6', 
                'lbmod1ItaInt6', 
                'lbmod1Spaniola6', 
                'lbmod1SpanInt6', 
                'lbmod1Ebraica6', 
                'lbmod1Germana6', 
                'lbmod1GerInt6', 
                'lbmod1Rusa6', 
                'lbmod1RusInt6', 
                'lbmod1Japoneza6', 
                'lbmod1JapInt6'
            ]            
        },
        {
            parent: ["lbcom"], 
            nume:   "Limbă modernă 2",
            coduriDiscipline: [
                'lbmod2Chineza6', 
                'lbmod2Engleza6', 
                'lbmod2Franceza6', 
                'lbmod2Italiana6', 
                'lbmod2Spaniola6', 
                'lbmod2Turca6', 
                'lbmod2Germana6', 
                'lbmod2Japoneza6', 
                'lbmod2Rusa6', 
                'lbmod2Portugheza6'
            ]           
        },
        {
            parent: ["lbcom"],
            nume:   "Elemente de limbă latină și de cultură romanică",
            coduriDiscipline: ['lbcomEllatRom6']
        },
        /* === Matematică și științe ale naturii === */
        {
            parent: ["matstnat"], 
            nume:   "Matematică",
            coduriDiscipline: ['mat6']
        },
        {
            parent: ["matstnat"], 
            nume:   "Fizică",
            coduriDiscipline: ['fiz6']
        },
        {
            parent: ["matstnat"], 
            nume:   "Biologie",
            coduriDiscipline: ['bio6']
        },
        /* === Om și societate === */
        {
            parent: ["omsoc"], 
            nume:   "Educație socială", // Educație interculturală
            coduriDiscipline: ['edusoc6']            
        },
        {
            parent: ["omsoc"], 
            nume:   "Istorie",
            coduriDiscipline: ['ist6']            
        },
        {
            parent: ["omsoc"], 
            nume:   "Geografie",
            coduriDiscipline: ['geo6']            
        },
        {
            parent: ["omsoc"], 
            nume: "Religie",
            coduriDiscipline: [
                'relAdvz6', 
                'relBapt6', 
                'relCrdev6', 
                'relEvca6', 
                'relGrcat6', 
                'relMus6', 
                'relOrt6', 
                'relOrtritv6', 
                'relOrtucr6', 
                'relPen6', 
                'relRef6', 
                'relRefmag6', 
                'relRomcatro6', 
                'relRomcatmg6', 
                'relRomcatlbmg6', 
                'relUnit6'
            ]            
        },
        /* === Arte === */
        {
            parent: ["arte"], 
            nume: "Educație plastică",
            coduriDiscipline: [
                'edpl6'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Educație muzicală",
            coduriDiscipline: [
                'edmuz6',
                'edmuzGer6',
                'edmuzIta6',
                'edmuzMag6',
                'edmuzMagr6',
                'edmuzPol6',
                'edmuzRrm6',
                'edmuzSrb6',
                'edmuzSlv6',
                'edmuzTur6',
                'edmuzUcr6'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Instrument principal",
            coduriDiscipline: [
                'instr6'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Teorie - Solfegiu - Dicteu",
            coduriDiscipline: [
                'tsd6'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Pian complementar/instrument auxiliar",
            coduriDiscipline: [
                'piaux6'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Dans clasic",
            coduriDiscipline: [
                'dansc6'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Ritmică",
            coduriDiscipline: [
                'ritm6'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Desen",
            coduriDiscipline: [
                'desen6'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Pictură",
            coduriDiscipline: [
                'pictr6'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Modelaj",
            coduriDiscipline: [
                'model6'
            ]            
        },
        /* === Educație fizică, sport și sănătate === */
        {
            parent: ["edfizsp6"], 
            nume: "Educație fizică, sport",
            coduriDiscipline: ['fizic6']            
        },
        {
            parent: ["edfizsp6"], 
            nume: "Pregătire sportivă practică",
            coduriDiscipline: [
                'pfizAtl6', 
                'pfizBad6', 
                'pfizBas6', 
                'pfizBab6', 
                'pfizCan6', 
                'pfizDns6', 
                'pfizFot6', 
                'pfizGif6', 
                'pfizGim6', 
                'pfizGir6', 
                'pfizHal6', 
                'pfizHan6', 
                'pfizHok6', 
                'pfizHoi6', 
                'pfizInt6', 
                'pfizJud6', 
                'pfizKca6', 
                'pfizKrt6', 
                'pfizGro6', 
                'pfizLpl6', 
                'pfizOsp6', 
                'pfizPar6', 
                'pfizPav6', 
                'pfizPpa6', 
                'pfizRgb6', 
                'pfizSne6', 
                'pfizSia6', 
                'pfizSap6', 
                'pfizSbi6', 
                'pfizSfd6', 
                'pfizSor6', 
                'pfizSsr6', 
                'pfizScr6', 
                'pfizSfb6', 
                'pfizSae6', 
                'pfizSah6', 
                'pfizTen6', 
                'pfizTem6', 
                'pfizVol6', 
                'pfizYht6'
            ]            
        },
        /* === Tehnologii === */
        {
            parent: ["tech"], 
            nume: "Tehnologii",
            coduriDiscipline: [
                'tecEdtap6', 
                'tecInfo6', 
                'tecEd6'
            ]            
        },
        /* === Consiliere și orientare === */
        {
            parent: ["consor"], 
            nume: "Consiliere și orientare",
            coduriDiscipline: ['consEd6']            
        },
        /* === Curriculum la decizia școlii === */
        {
            parent: "cds", 
            nume: "Curriculum la decizia școlii ",
            coduriDiscipline: [
                'cdsAba6',
                'cdsMed6',
                'cdsIst6', 
                'cdsLect6', 
                'cdsGrne6', 
                'cdsMicr6', 
                'cdsMatsc6', 
                'cdsEdvit6', 
                'cdsRadlt6',
                'cdsMed6',
                'cdsCiv6',
                'cdsArm6',
                'cdsEco6',
                'cdsGec6',
                'cdsFin6',
                'cdsIcu6',
                'cdsEds6',
                'cdsMag6',
                'cdsGrm6',
                'cdsSah6'
            ]            
        }
    ]
);
mapCodDisc.set("7", 
    [        
        /* === Limbă și comunicare === */
        {
            parent: ["lbcom"], 
            nume:   "Limba și literatura română",
            coduriDiscipline: [
                'lbcomRom7', 
                'lbcomRomMag7'
            ]            
        },
        {
            parent: ["lbcom"], 
            nume:   "Limba maternă",
            coduriDiscipline: [
                'lbmatBulgara7', 
                'lbmatCeha7', 
                'lbmatCroata7', 
                'lbmatGermana7', 
                'lbmatGeringer7', 
                'lbmatItaliana7', 
                'lbmatMaghiara7', 
                'lbmatMaginmag7', 
                'lbmatNeogreaca7', 
                'lbmatPolona7', 
                'lbmatRroma7', 
                'lbmatRusa7', 
                'lbmatSarba7', 
                'lbmatSlovaca7', 
                'lbmatTurca7', 
                'lbmatUcraina7'
            ]
        },
        {
            parent: ["lbcom"], 
            nume:   "Limba modernă 1",
            coduriDiscipline: [
                'lbmod1Engleza7', 
                'lbmod1EngInt7', 
                'lbmod1Franceza7', 
                'lbmod1FraInt7', 
                'lbmod1Italiana7', 
                'lbmod1ItaInt7', 
                'lbmod1Spaniola7', 
                'lbmod1SpanInt7', 
                'lbmod1Ebraica7', 
                'lbmod1Germana7', 
                'lbmod1GerInt7', 
                'lbmod1Rusa7', 
                'lbmod1RusInt7', 
                'lbmod1Japoneza7', 
                'lbmod1JapInt7'
            ]            
        },
        {
            parent: ["lbcom"], 
            nume:   "Limbă modernă 2",
            coduriDiscipline: [
                'lbmod2Chineza7', 
                'lbmod2Engleza7', 
                'lbmod2Franceza7', 
                'lbmod2Italiana7', 
                'lbmod2Spaniola7', 
                'lbmod2Turca7', 
                'lbmod2Germana7', 
                'lbmod2Japoneza7', 
                'lbmod2Rusa7', 
                'lbmod2Portugheza7'
            ]           
        },
        {
            parent: ["lbcom"], 
            nume:   "Elemente de limbă latină și de cultură romanică",
            coduriDiscipline: [
                'ellatRom7'
            ]           
        },
        /* === Matematică și științe ale naturii === */
        {
            parent: ["matstnat"], 
            nume:   "Matematică",
            coduriDiscipline: ['mat7']
        },
        {
            parent: ["matstnat"], 
            nume:   "Fizică",
            coduriDiscipline: ['fiz7']
        },
        {
            parent: ["matstnat"], 
            nume:   "Chimie",
            coduriDiscipline: ['chim7']
        },
        {
            parent: ["matstnat"], 
            nume:   "Biologie",
            coduriDiscipline: ['bio7']
        },
        /* === Om și societate === */
        {
            parent: ["omsoc"], 
            nume:   "Educație socială", // Educație pentru cetățenie democratică
            coduriDiscipline: ['edusoc7']            
        },
        {
            parent: ["omsoc"], 
            nume:   "Istorie",
            coduriDiscipline: ['ist7']            
        },
        {
            parent: ["omsoc"], 
            nume:   "Geografie",
            coduriDiscipline: ['geo7']            
        },
        {
            parent: ["omsoc"], 
            nume: "Religie",
            coduriDiscipline: [
                'relAdvz7', 
                'relBapt7', 
                'relCrdev7', 
                'relEvca7', 
                'relGrcat7', 
                'relMus7', 
                'relOrt7', 
                'relOrtritv7', 
                'relOrtucr7', 
                'relPen7', 
                'relRef7', 
                'relRefmag7', 
                'relRomcatro7', 
                'relRomcatmg7', 
                'relRomcatlbmg7', 
                'relUnit7'
            ]            
        },
        /* === Arte === */
        {
            parent: ["arte"], 
            nume: "Educație plastică",
            coduriDiscipline: [
                'edpl7'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Educație muzicală",
            coduriDiscipline: [
                'edmuz7',
                'edmuzGer7',
                'edmuzIta7',
                'edmuzMag7',
                'edmuzMagr7',
                'edmuzPol7',
                'edmuzRrm7',
                'edmuzSrb7',
                'edmuzSlv7',
                'edmuzTur7',
                'edmuzUcr7'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Instrument principal",
            coduriDiscipline: [
                'instr7'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Teorie - Solfegiu - Dicteu",
            coduriDiscipline: [
                'tsd7'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Pian complementar/instrument auxiliar",
            coduriDiscipline: [
                'piaux7'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Dans clasic",
            coduriDiscipline: [
                'dansc7'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Ritmică",
            coduriDiscipline: [
                'ritm7'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Desen",
            coduriDiscipline: [
                'desen7'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Pictură",
            coduriDiscipline: [
                'pictr7'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Modelaj",
            coduriDiscipline: [
                'model7'
            ]            
        },
        /* === Educație fizică, sport și sănătate === */
        {
            parent: ["edfizsp7"], 
            nume: "Educație fizică, sport",
            coduriDiscipline: ['fizic7']            
        },
        {
            parent: ["edfizsp7"], 
            nume: "Pregătire sportivă practică",
            coduriDiscipline: [
                'pfizAtl7', 
                'pfizBad7', 
                'pfizBas7', 
                'pfizBab7', 
                'pfizCan7', 
                'pfizDns7', 
                'pfizFot7', 
                'pfizGif7', 
                'pfizGim7', 
                'pfizGir7', 
                'pfizHal7', 
                'pfizHan7', 
                'pfizHok7', 
                'pfizHoi7', 
                'pfizInt7', 
                'pfizJud7', 
                'pfizKca7', 
                'pfizKrt7', 
                'pfizGro7', 
                'pfizLpl7', 
                'pfizOsp7', 
                'pfizPar7', 
                'pfizPav7', 
                'pfizPpa7', 
                'pfizRgb7', 
                'pfizSne7', 
                'pfizSia7', 
                'pfizSap7', 
                'pfizSbi7', 
                'pfizSfd7', 
                'pfizSor7', 
                'pfizSsr7', 
                'pfizScr7', 
                'pfizSfb7', 
                'pfizSae7', 
                'pfizSah7', 
                'pfizTen7', 
                'pfizTem7', 
                'pfizVol7', 
                'pfizYht7'
            ]            
        },
        /* === Tehnologii === */
        {
            parent: ["tech"], 
            nume: "Tehnologii",
            coduriDiscipline: [
                'tecEdtap7', 
                'tecInfo7', 
                'tecEd7'
            ]            
        },
        /* === Consiliere și orientare === */
        {
            parent: ["consor"], 
            nume: "Consiliere și orientare",
            coduriDiscipline: ['consEd7']            
        },
        /* === Curriculum la decizia școlii === */
        {
            parent: "cds", 
            nume: "Curriculum la decizia școlii ",
            coduriDiscipline: [
                'cdsIst7', 
                'cdsLect7', 
                'cdsGrne7', 
                'cdsMicr7', 
                'cdsMatsc7', 
                'cdsEdvit7', 
                'cdsRadlt7',
                'cdsMed7',
                'cdsArm7',
                'cdsEco7',
                'cdsGec7',
                'cdsFin7',
                'cdsIcu7',
                'cdsEds7',
                'cdsLat7',
                'cdsMag7'
            ]            
        }
    ]
);
mapCodDisc.set("8", 
    [        
        /* === Limbă și comunicare === */
        {
            parent: ["lbcom"], 
            nume:   "Limba și literatura română",
            coduriDiscipline: [
                'lbcomRom8', 
                'lbcomRomMag8'
            ]            
        },
        {
            parent: ["lbcom"], 
            nume:   "Limba maternă",
            coduriDiscipline: [
                'lbmatBulgara8', 
                'lbmatCeha8', 
                'lbmatCroata8', 
                'lbmatGermana8', 
                'lbmatGeringer8', 
                'lbmatItaliana8', 
                'lbmatMaghiara8', 
                'lbmatMaginmag8', 
                'lbmatNeogreaca8', 
                'lbmatPolona8', 
                'lbmatRroma8', 
                'lbmatRusa8', 
                'lbmatSarba8', 
                'lbmatSlovaca8', 
                'lbmatTurca8', 
                'lbmatUcraina8'
            ]
        },
        {
            parent: ["lbcom"], 
            nume:   "Limba modernă 1",
            coduriDiscipline: [
                'lbmod1Engleza8', 
                'lbmod1EngInt8', 
                'lbmod1Franceza8', 
                'lbmod1FraInt8', 
                'lbmod1Italiana8', 
                'lbmod1ItaInt8', 
                'lbmod1Spaniola8', 
                'lbmod1SpanInt8', 
                'lbmod1Ebraica8', 
                'lbmod1Germana8', 
                'lbmod1GerInt8', 
                'lbmod1Rusa8', 
                'lbmod1RusInt8', 
                'lbmod1Japoneza8', 
                'lbmod1JapInt8'
            ]            
        },
        {
            parent: ["lbcom"], 
            nume:   "Limbă modernă 2",
            coduriDiscipline: [
                'lbmod2Chineza8', 
                'lbmod2Engleza8', 
                'lbmod2Franceza8', 
                'lbmod2Italiana8', 
                'lbmod2Spaniola8', 
                'lbmod2Turca8', 
                'lbmod2Germana8', 
                'lbmod2Japoneza8', 
                'lbmod2Rusa8', 
                'lbmod2Portugheza8'
            ]           
        },
        /* === Matematică și științe ale naturii === */
        {
            parent: ["matstnat"], 
            nume:   "Matematică",
            coduriDiscipline: ['mat8']
        },
        {
            parent: ["matstnat"], 
            nume:   "Fizică",
            coduriDiscipline: ['fiz8']
        },
        {
            parent: ["matstnat"], 
            nume:   "Chimie",
            coduriDiscipline: ['chim8']
        },
        {
            parent: ["matstnat"], 
            nume:   "Biologie",
            coduriDiscipline: ['bio8']
        },
        /* === Om și societate === */
        {
            parent: ["omsoc"], 
            nume:   "Educație socială", // Educație economico-financiară
            coduriDiscipline: ['edusoc8']            
        },
        {
            parent: ["omsoc"], 
            nume:   "Istorie",
            coduriDiscipline: ['ist8']            
        },
        {
            parent: ["omsoc"], 
            nume:   "Geografie",
            coduriDiscipline: ['geo8']            
        },
        {
            parent: ["omsoc"], 
            nume: "Religie",
            coduriDiscipline: [
                'relAdvz8', 
                'relBapt8', 
                'relCrdev8', 
                'relEvca8', 
                'relGrcat8', 
                'relMus8', 
                'relOrt8', 
                'relOrtritv8', 
                'relOrtucr8', 
                'relPen8', 
                'relRef8', 
                'relRefmag8', 
                'relRomcatro8', 
                'relRomcatmg8', 
                'relRomcatlbmg8', 
                'relUnit8'
            ]            
        },
        /* === Arte === */
        {
            parent: ["arte"], 
            nume: "Educație plastică",
            coduriDiscipline: [
                'edpl8'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Educație muzicală",
            coduriDiscipline: [
                'edmuz8',
                'edmuzGer8',
                'edmuzIta8',
                'edmuzMag8',
                'edmuzMagr8',
                'edmuzPol8',
                'edmuzRrm8',
                'edmuzSrb8',
                'edmuzSlv8',
                'edmuzTur8',
                'edmuzUcr8'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Instrument principal",
            coduriDiscipline: [
                'instr8'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Teorie - Solfegiu - Dicteu",
            coduriDiscipline: [
                'tsd8'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Pian complementar/instrument auxiliar",
            coduriDiscipline: [
                'piaux8'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Dans clasic",
            coduriDiscipline: [
                'dansc8'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Ritmică",
            coduriDiscipline: [
                'ritm8'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Desen",
            coduriDiscipline: [
                'desen8'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Pictură",
            coduriDiscipline: [
                'pictr8'
            ]            
        },
        {
            parent: ["arte"], 
            nume: "Modelaj",
            coduriDiscipline: [
                'model8'
            ]            
        },
        /* === Educație fizică, sport și sănătate === */
        {
            parent: ["edfizsp8"], 
            nume: "Educație fizică, sport",
            coduriDiscipline: ['fizic8']            
        },
        {
            parent: ["edfizsp8"], 
            nume: "Pregătire sportivă practică",
            coduriDiscipline: [
                'pfizAtl8', 
                'pfizBad8', 
                'pfizBas8', 
                'pfizBab8', 
                'pfizCan8', 
                'pfizDns8', 
                'pfizFot8', 
                'pfizGif8', 
                'pfizGim8', 
                'pfizGir8', 
                'pfizHal8', 
                'pfizHan8', 
                'pfizHok8', 
                'pfizHoi8', 
                'pfizInt8', 
                'pfizJud8', 
                'pfizKca8', 
                'pfizKrt8', 
                'pfizGro8', 
                'pfizLpl8', 
                'pfizOsp8', 
                'pfizPar8', 
                'pfizPav8', 
                'pfizPpa8', 
                'pfizRgb8', 
                'pfizSne8', 
                'pfizSia8', 
                'pfizSap8', 
                'pfizSbi8', 
                'pfizSfd8', 
                'pfizSor8', 
                'pfizSsr8', 
                'pfizScr8', 
                'pfizSfb8', 
                'pfizSae8', 
                'pfizSah8', 
                'pfizTen8', 
                'pfizTem8', 
                'pfizVol8', 
                'pfizYht8'
            ]            
        },
        /* === Tehnologii === */
        {
            parent: ["tech"], 
            nume: "Tehnologii",
            coduriDiscipline: [
                'tecEdtap8', 
                'tecInfo8', 
                'tecEd8'
            ]            
        },
        /* === Consiliere și orientare === */
        {
            parent: ["consor"], 
            nume: "Consiliere și orientare",
            coduriDiscipline: ['consEd8']            
        },
        /* === Curriculum la decizia școlii === */
        {
            parent: "cds", 
            nume: "Curriculum la decizia școlii ",
            coduriDiscipline: [
                'cdsIst8', 
                'cdsLect8', 
                'cdsGrne8', 
                'cdsMicr8', 
                'cdsMatsc8', 
                'cdsEdvit8', 
                'cdsRadlt8',
                'cdsArm8',
                'cdsFin8',
                'cdsIcu8',
                'cdsEds8',
                'cdsMag8'
            ]            
        }
    ]
);
mapCodDisc.set("a",{
    lbcom:    "Limbă și comunicare",
    matstnat: "Matematică și științe ale naturii",
    omsoc:    "Om și societate",
    edfizsp:  "Educație fizică, sport și sănătate",
    arte:     "Arte",
    teh:      "Tehnologii",
    consor:   "Consiliere și orientare",
    currsc:   "Curriculum la decizia școlii",
});

const coduriA = Object.keys(structA);
const numedeA = Object.values(structA);

const cl0 = document.querySelector('#cl0');
const cl1 = document.querySelector('#cl1');
const cl2 = document.querySelector('#cl2');
const cl3 = document.querySelector('#cl3');
const cl4 = document.querySelector('#cl4');
const cl5 = document.querySelector('#cl5');
const cl6 = document.querySelector('#cl6');
const cl7 = document.querySelector('#cl7');
const cl8 = document.querySelector('#cl8');
const discipline = document.querySelector('#discipline');

let clase = [cl0, cl1, cl2, cl3, cl4, cl5, cl6, cl7, cl8];
// pentru fiecare clasă care primește click generează întreaga structură de date necesară afișării cât mai compacte
clase.forEach(elem => elem.addEventListener('click', structureAriAndDiscs));

/* === Constituirea selectorului pentru disciplină === */
const DISCMAP = new Map(); // colector de structuri {nivel: "5", 5: {art5: [], bio5: []}} generate de `structDiscipline({cl:event.target.value, data});`
// Constituie setul disciplinelor care au fost selectate de utilizator
var disciplineSelectate = new Set(); // selecția disciplinelor
var discSelected = document.querySelector('#disciplineselectate'); // zona de afișare a disciplinelor care au fost selectate

/**
 * Funcția trebuie să încarce disciplinele aferente clasei selectate în selecturi ale ariilor
 * @param {Object} elem este elementul pe care a fost atașat listener-ul
 */
function structureAriAndDiscs (elem) {
    // console.log('Target elem de clasă: ', elem.target);
    discipline.innerHTML = ''; // #1 șterge elementele anterioare

    // #2 creează un obiect din dataset-ul aferent elementului din dropdown-ul claselor
    const clsdata = {...elem.target.dataset}; // constituie un obiect din setul data-*
    // #3 generează o structură consolidată a datelor prin generarea subseturilor disciplinelor.
    const STRUCTURE = structDiscipline({cl:elem.target.id, clsdata}); // event.target.id este id-ul elementului din dropdown-ul claselor:: id="cl5"
    // console.log("Structure este: ",STRUCTURE);
    /* 
        nivel: "0",
        rezultat: {
            0: {
                art0: Array [ {…} ]                ​​​
                dezv0: Array [ {…} ]                ​​​
                fizic0: Array [ {…} ]                ​​​
                lbcom0: Array(6) [ {…}, {…}, {…}, … ]                ​​​
                lbmat0: Array(20) [ {…}, {…}, {…}, … ]                ​​​
                lbmod0: Array [ {…} ]                ​​​
                mate0: Array [ {…} ]                ​​​
                muzmi0: Array(16) [ {…}, {…}, {…}, … ]                ​​​
                opt0: Array [ {…}, {…} ]               
                rel0: Array(14) [ {…}, {…}, {…}, … ]
            }
        }
    */
    
    // Info primare pentru constituire interfață
    let n = STRUCTURE.nivel; // -> 8, de exemplu
    let objSeturi = STRUCTURE.rezultat[n]; //16 seturi -> {art5: [], bio5: []}

    // #4 populează progresiv structura de date
    // dacă în DISCMAP nu există o structură corespondentă celei din STRUCTURE.nivel
    if (!DISCMAP.has(STRUCTURE.nivel)) {
        DISCMAP.set(STRUCTURE.nivel, STRUCTURE.rezultat); // FIXME: Acest `STRUCTURE.rezultat` trebuie să fie remodelat (`model_de_ajuns_la_discipline.json`)
    }; // FIXME: Cred că trebuie refăcută funcția `structDiscipline()`.

    // #5 restructurează obiectul aferent clasei (cheie) din `mapCodDisc`
    // Uneste toate disciplinele care au acelasi părinte
    const ArrayFromMapCodDisc = Array.from(mapCodDisc);



    // const clsTouples = Object.entries(clsdata); // generează un array de array-uri
    // let k, v;
    
    // // rând pe rând sunt create toate elementele achor pentru fiecare disciplină în parte
    // for (let [k, v] of clsTouples) {
    //     // TODO: pentru disciplinele care sunt arondate unei arii, generează un dropdown pentru acea arie cu toate disciplinele

    //     let aelem = new createElement('a', k, ['badge', 'facet', 'mansonry', k], {'href': '#', 'data-text': v, 'data-cod': k}).creeazaElem(v);
    //     aelem.addEventListener('click', highlightf);
    //     discipline.appendChild(aelem);
    // }
}

/**
 * Funcția are rolul de a genera toate elementele vizuale necesare pentru structurarea
 * disciplinelor arondate ariilor curiculare
 * @param {Object} elem este elementul de clasă care a fost selectat din dropdown
 */
function highlightf (elem) {
    // console.log('am fost selectat și am datele', elem.target.dataset, 'Complet sunt: ', elem.target);
    const discData = {...elem.target.dataset}; // generează un obiect din dataset.
    const discTouples = Object.entries(discData); // creează tuple-uri.
    // console.log(discTouples);

    discTouples.forEach(t => {
        //TODO: Creează elemente button care să fie badge-uri
        let belement = new createElement('button', '', ['ba']).creeazaElem();
        switch (t[0]) {
            case 'text':
                // TODO:introduce textul ca text al elementului
                break;
            case 'cod':
                // TODO: extrage cifra pentru a semnaliza din care clasă este
                break;
            default:
                break;
        }
        //TODO: Verifică dacă nu cumva elementul există deja în set
        // if (fatete.has())
    });
}

// === BUTONUL DE SEARCH ===
const searchResIntBtn = document.getElementById('searchResIntBtn'); // butonul de search
let index = searchResIntBtn.dataset.idx; // extrage indexul din atributul data.
searchResIntBtn.addEventListener('click', function clbkSeachBtnResInterne (evt) {
    evt.preventDefault();
    const fragSearch = document.getElementById('fragSearchDocs').value;
    if (fragSearch.length > 250) {
        fragSearch = fragSearch.slice(0, 250);
    }
    // console.log(fragSearch, "pe", index);
    
    // primul pas, curăță de conținut id-ul `primare`
    primare.innerHTML = '';
    pubComm.emit('searchres', {
        index, 
        fragSearch, 
        fields: [
            ["expertCheck", true]
        ]
    }); // emite eveniment în backend
});

/* === afișarea rezultatelor === */
// ref la ancora la care se atașează elementele generate
const containerFoundRes = document.getElementById('primare');
// ref la template de doc găsit
const tmplrec = document.getElementById('searchresult');
pubComm.on('searchres', (documents) => {
    console.log(documents);
    // primul pas, curăță de conținut id-ul `primare`
    primare.innerHTML = '';
    // pentru fiecare element din array-ul rezultatelor generează câte o înregistrare
    for (let doc of documents) {
        // clonează conținutul
        const clonedTmpl = tmplrec.content.cloneNode(true);
        let title = clonedTmpl.querySelector('#restitlelnk')
        title.textContent = doc._source.title;
        title.href=`/resurse/${doc._id}`;
        clonedTmpl.querySelector('#cardtext').textContent = doc._source.description;
        containerFoundRes.appendChild(clonedTmpl);
    }
});

/**
 * Funcția este un helper și are rolul de a face o căutare în `Map`-ul `mapCodDisc` 
 * pentru a extrage numele disciplinei pilon
 * @param {Object} `obidisc` //{nivel: n, cod: obi.codsdisc} 
 */
function extragNumeDisciplina (obidisc) {
    let disciplina;
    mapCodDisc.forEach ((v, k, m) => {
        // caută în clasa specificată de obidisc.nivel, înregistrarea în map de tip Array cu obiecte
        if (obidisc.nivel === k) {
            // pentru setul găsit
            let obi;
            for (obi of v) {  
                // caută în array-ul codurilor disciplinelor arondate unei arii a unui an              
                if (obi.coduriDiscipline.includes(obidisc.cod)) {
                    // dacă am găsit-o, returnează!
                    disciplina = obi.nume;                    
                }
            }
        }
    });
    return disciplina;
};

/**
 * Funcția e listener pentru fiecare checkbox disciplină. Odată selectată disciplina, aceasta va fi afișată într-o zonă de selecție
 * @param {NodeElement} `evt` fiind chiar elementul obiect
 */
function clickPeDisciplina (evt) {
    // face ca butonul de selecție să fie evidențiat doar dacă a fost apăsată vreo disciplină
    if (compSpecPaginator.classList.contains('d-none')) {
        compSpecPaginator.classList.remove('d-none');
    } else {
        compSpecPaginator.classList.add('d-block');
    }

    let e = evt || window.event;
    // DACĂ EXISTĂ CODUL ÎN disciplineSelectate, șterge-l
    if (disciplineSelectate.has(e.dataset.nume) == false) {
        disciplineSelectate.add(e.dataset.nume); // adaugă disciplina în `Set`-ul `disciplineSelectate`
        
        let inputCheckBx      = new createElement('input', '', ['form-check-input'], {type: "checkbox", 'data-nume': e.dataset.nume, autocomplete: "off", value: e.dataset.nume, onclick: ""}).creeazaElem();
        let labelBtn          = new createElement('label', '', ['discbtn','btn', 'btn-sm', e.dataset.nume], {}).creeazaElem(e.value);
        labelBtn.textContent += ` `; //adaugă un spațiu între numar și textul butonului.
        let clasaInfo         = new createElement('span', '', ['badge','badge-light'], {}).creeazaElem(e.dataset.nume.split('').pop());
        labelBtn.appendChild(clasaInfo); // adaugă numărul care indică clasa pentru care a apărut disciplina (vezi bootstrap badges)
        let divBtnGroupToggle = new createElement('div',   '', ['disciplina', 'btn-group-toggle', e.dataset.nume], {"data-toggle": "buttons", onclick: ""}).creeazaElem();           
        
        labelBtn.appendChild(inputCheckBx); // injectează checkbox-ul în label
        divBtnGroupToggle.appendChild(labelBtn); // injectează label-ul în div
        discSelected.appendChild(divBtnGroupToggle); // adaugă div-ul în discselected
    } else {
        disciplineSelectate.delete(e.dataset.nume);
        let elemExistent = document.querySelector(`.${e.dataset.nume}`);
        discSelected.removeChild(elemExistent);
    }
}

/**
 * Funcția are rolul de a întoarce un obiect complex format dintr-un obiect
 * adus ca valoarea a proprietății corespondente clasei din `mapCodDisc` și 
 * obiectul generat din datele extrase din data=* a elementului selectat
 * @param {Object} struct 
 * @param {String} codArie 
 */
function rehashDataStruct (struct, codArie) {
    return struct.reduce((ac, elem, idx, arr) => {
        const numeArie = structA[codArie];
    
        if (Object.keys(ac).length === 0 && ac.constructor === Object) {
            // popularea primului obiect din serie; este necesar pentru a da structura dar și pentru că altfel va fi omis
            if (coduriA.includes(codArie)){
                ac[structA[codArie]] = {
                    clasa: numeArie,
                    cod: codArie,   
                    [elem.nume]: {
                        clasaDisc: elem.nume,
                        discipline: elem.coduriDiscipline.map((x) => {return {[x]: clasaDate[x]}})
                    }    
                };
            }
        } else {
            // console.log(elem)
            if (elem.parent.includes(codArie)) {
                // completarea obiectelor
                ac[numeArie].clasa = structA[codArie];
                ac[numeArie].cod = codArie;
                ac[numeArie][elem.nume] = {
                    clasaDisc: elem.nume,
                    discipline: elem.coduriDiscipline.map((x) => {return {[x]: clasaDate[x]}})
                } || {};
            }
            
        }
        // returnează ac-ul îmbogățit
        return ac;
    }, {});
};

/**
 * Funcția are rolul să structureze sub-disciplinele în raport cu Disciplina mare la care sunt arondate
 * Disciplina va fi codificată extrăgând un fragment din numele care este precizat în valorile setului extras din data=*
 * @param {Object} discs Este un obiect cu toate disciplinele din setul data=* aferent unei clase
 * @returns {Object} Returnează {nivel: <nivel>, rezultat: <Object> }
 */
function structDiscipline (discs = {}) {
    // discs are semnătura `cl: "cl5", data: {artDansc5: "Dans clasic",  artDesen5: "Desen"} }`
    let arrOfarr = Object.entries(discs.clsdata); // transformă înregistrările obiectului în array-uri
    // arrOfarr va avea semnătura `[ "lbcomRom5", "Limba și literatura română" ], [ "lbcomOpt5", "Opțional" ]`
    
    // redu înregistrarea `arrOfarr` la un obiect consolidat de forma lui `obj`:
    let nivelNo;
    // doar dacă obiectul discs este populat, extrage numărul corespondent clasei!
    if (discs.cl) {
        nivelNo = discs.cl.split('').pop(); // scoate numărul aferent clasei!!!
    }

    // obiectul care va fi returnat!!!
    const obj = {
        nivel: nivelNo,
        rezultat: {}
    };

    let claseDisc = new Set(); // constituie un Set cu discipline (are comportament de reducer)

    obj.rezultat = arrOfarr.reduce((ac, elem, idx, arr) => {
        let classNameRegExp = /[a-z]+((\d)?|[A-Z])/gm; // orice caracter mic urmat, fie de un număr, fie de o literă mare. 
        // În cazul acesta unele discipline au fragmentul de cod urmat de cifra clasei, dar alte nu
        // console.log('Fără shift numele clasei de disciplină arată așa: ', elem[0].match(classNameRegExp));
        
        let className = elem[0].match(classNameRegExp).shift(); // Generează numele claselor de discipline, extrăgând din elementul 0 al touple-ului, fragmentul ce corespunde șablonului RegExp

        // în cazul în care la debitarea cu shift rămâi fără numărul clasei, adaugă-l din oficiu la acest pas
        if (className.slice(-1) !== obj.nivel) {
            className += obj.nivel;
        }
        // Adaug în Set numele disciplinei
        claseDisc.add(className);

        // definirea structurii de date când `ac` la început este `undefined`
        if (Object.keys(ac).length === 0 && ac.constructor === Object) {
            // dacă obiectul este gol, introdu prima înregistrare, care dă astfel și structura
            ac[obj.nivel] = {};
            // TODO: Aici caută className.slice(-1) în `mapCodDisc` aferent clasei si construiește înregistrarea
            // dacă className.slice(-1) se află în mapCodDisc.get('0') obține numele ariei și a clasei de discipline
            // let incadrare = incadreaza(className.slice(-1), mapCodDisc.get(obj.nivel))
            /* ->
                {parinti: ["Limbă și comunicare"],  }
            */
            ac[obj.nivel][className.slice(-1)] = [
                {codsdisc: elem[0], nume: elem[1]}
            ];            
        } else {
            // în cazul în care obiectul este deja populat, verifică dacă setul de discipline (`className`) există deja
            if(className in ac[obj.nivel]) {
                ac[obj.nivel][className].push({codsdisc: elem[0], nume: elem[1]}); // dacă există, adaugă disciplina array-ului existent
            } else {
                // dacă nu avem set de discipline pentru `className`-ul descoperit, se va constitui unul și se va introduce prima înregistrare în array
                ac[obj.nivel][className] = className;
                ac[obj.nivel][className] = [
                    {codsdisc: elem[0], nume: elem[1]}
                ]; 
            }
        }
        return ac;
    },{});

    return obj;
}