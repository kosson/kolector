# Pași necesari la inițierea bazei de date

## Resursele Educaționale

Indexează câmpul `title` din colecția `resursedus`.
Din consola MongoDB: 
- `use redcolector`
- `show dbs` -> vezi dacă apare colecția între cele existente.
- `db.resursedus.createIndex({title: "text"})`