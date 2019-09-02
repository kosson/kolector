import { userInfo } from "os";

var resursa = {
    idContributor:     'email', // va fi emailul userului -> în spate faci căutarea și popularea.
    langRED:           'ro',
    caleBagIT:         '/repo/12221231dkasda2323131321',
    dimensiune:        '23443MB',
    title:             'Bătălia de la Călugăreni',
    titleI18n:         [{eng:'The Battle of Călugăreni'}, {fra:'Le Battaille du Călugăreni'}],
    creator:           ['ffkdlsfksdjal293jrd3kde'], // acestea sunt id-uri de useri din bază TODO: află id-ul din bază pentru un email.
    licenta:           '',
    arieCurriculara:   'Istorie',
    ariiCurriculare:   [],
    level:             'cl4',
    levelRelated:      [],
    discipline:        ['Istorie'],
    competenteGen:     [{id: 'ist4-1', nume: 'Ceva acolo'}],
    competentaS:       [], // se va completa automa pe id-uri de competențe specifice.
    description:       'Ceva care descrie resursa',
    identifier:        [], // sunt toate etichetele generate din form plus ce mai adaugă userul la final
    coperta:           '', //este un link către imagine care a fost încărcată drept copertă
    bibliografie:      '',
};