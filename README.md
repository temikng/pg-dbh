# pg-dbh

PostgreSQL database pool holder

## Connection

```javascript
const pg = require('pg');
const pgDbhInit = require('pg-dbh');
const connect = { /* ... */ };
const params = { /* ... */ };
const dbh = pgDbhInit(pg, connect, params);
```

### - pg

user selected version of 
[pg package](https://github.com/brianc/node-postgres)

### - connect

the connection use 
[node-postgres](https://node-postgres.com/features/connecting#programmatic)
module

### - params

* logger - log function to output sql requests
* onError - handler function for pool on 'error' event

## Use

Full request
```javascript
const rows = await dbh(async (db) => {
    return await db.SelectAll('* FROM users WHERE role=$1', ['user']);
});
```
Short request
```javascript
const rows = await dbh.SelectAll('* FROM users WHERE role=$1', ['user']);
```

## Available functions

> will be soon