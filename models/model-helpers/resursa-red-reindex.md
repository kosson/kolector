# Procedura de reindexare

## Verificare indexurilor existente

Petru a vedea numele și detaliile indexurilor care sunt deja create, se aplică următoarea comandă.

```bash
curl -XGET "http://localhost:9200/_cat/indices/*,-.*?v"
```

Creezi indexul și alias-ul de mână din terminal. În directorul curent ai la îndemână JSON-ul de mapare deja preparat.

```bash
curl -XPUT "http://localhost:9200/resurse" -H 'Content-Type: application/json' -d'{    "settings": {        "index" : {            "number_of_shards": 3,             "number_of_replicas": 2         },        "analysis": {            "analyzer": {                "analizor_red": {                    "tokenizer": "standard",                    "filter": [                        "apostrophe",                         "lowercase",                        "trim",                        "stemmer_cu_ro"                    ]                }            },            "filter": {                "stemmer_cu_ro": {                    "type": "stemmer",                    "name": "romanian"                }            }        }    },    "mappings": {        "properties": {            "date":              {"type": "date"},            "idContributor":     {"type":"keyword"},            "emailContrib":      {"type": "keyword"},            "uuid":              {"type": "keyword"},            "autori":            {"type": "text"},            "langRED":           {"type": "keyword"},            "title":             {"type": "text"},            "titleI18n":         {"type": "text"},            "arieCurriculara":   {"type": "text", "fields": {"keyword": {"type": "keyword"}}},            "level":             {"type": "text", "fields": {"keyword": {"type": "keyword"}}},            "discipline":        {"type": "text", "fields": {"keyword": {"type": "keyword"}}},            "disciplinePropuse": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},            "competenteGen":     {"type": "text", "fields": {"keyword": {"type": "keyword"}}},            "grupuri":           {"type": "text", "fields": {"keyword": {"type": "keyword"}}},            "domeniu":           {"type": "text", "fields": {"keyword": {"type": "keyword"}}},            "functii":           {"type": "text", "fields": {"keyword": {"type": "keyword"}}},            "demersuri":         {"type": "text", "fields": {"keyword": {"type": "keyword"}}},            "spatii":            {"type": "text", "fields": {"keyword": {"type": "keyword"}}},            "invatarea":         {"type": "text", "fields": {"keyword": {"type": "keyword"}}},            "description":       {"type": "text"},            "identifier":        {"type": "text", "fields": {"keyword": {"type": "keyword"}}},            "coperta":           {"type": "text", "fields": {"keyword": {"type": "keyword"}}},            "content":           {"type": "text"},            "contorAcces":       {"type": "long"},            "generalPublic":     {"type": "boolean"},            "contorDescarcare":  {"type": "long"},            "etichete":          {"type": "text", "fields": {"keyword": {"type": "keyword"}}},            "utilMie":           {"type": "long"},            "expertCheck":       {"type": "boolean"}        }    },    "aliases": {        "resursedus": {}    }}'

```

În loc de numele puse pentru exemplificare `resurse_test` și alias-ul său `resurse_test_als1`, pune ceea ce ai hotărât să fie în `RES_IDX_ES7` și aliasul la `RES_IDX_ALS`.

Verifică dacă s-a creat indexul și alias-ul

```bash
curl -XGET "http://localhost:9200/_alias/resurse_test_als1"
```

Dacă totul este în regulă, procedează la reindexare folosind scriptul `resursa-red-reindex.js`. Ai putea lansa din client ca administrator un eveniment dedicat din Console. Acesta va avea drept finalitate executarea reindexării?!