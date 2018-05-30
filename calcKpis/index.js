
const DocumentClient = require('documentdb').DocumentClient;
const host = "https://localhost:8081";                    
const masterKey = "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==";
var OLAPCube, cube;
client = new DocumentClient(host, {masterKey: masterKey},
    {
        DisableSSLVerification :true,
        EnableEndpointDiscovery : false,
        MediaReadMode : "Buffered",
        RequestTimeout : 10000,
        MediaRequestTimeout : 10000,
        PreferredLocations : [],
        RetryOptions: {}
    }
);    
//cube = require('fs').readFileSync('./groupBy/cube.string', 'utf8');
OLAPCube = require('lumenize').OLAPCube;
const dbUrl = 'dbs/statra-db';
const kpisCollection = `${dbUrl}/colls/kpis`;
const ahfCollection = `${dbUrl}/colls/AHF`;
    
module.exports = function (context, req) {
    context.log('http started',req.query);            
    if(req.query && req.query.dataset){        
        let dataset = req.query.dataset;       
        getDatabase(client)
        .then((response)=>{
            context.log('response getDatabase')
            return getCollection(client);
        })
        .then((response)=>{
            context.log('response get collection')
            return getKpisByDataset(dataset,client,context);        
        })
        .then((response)=>{
            context.log('response get kpis');
            return calcKpis(response);            
        })
        .then(response=>{
            context.log('promises kpis',response);
            context.res = {body : 'Kpis calculated'}
            context.done();
        })    
        .catch(err=>{
            context.log('err',err);            
            context.res = {body : 'Error al calcular kpi '+err};
            context.done();
        })
    }
    else{
        context.log('else is type results');
        context.done(null,{res : {body: 'doc type invalid'}});
    }
    
}

/*function calcKpi_(dataset,client){
    return new Promise((resolve,reject)=>{
        getDatabase(client)
        .then(()=>  getCollection(client))
        .then((response)=>{
            console.log('response',response)
            getKpisByDataset(dataset,client)
            .then((response)=>{
                return resolve(response)
            })    
        })
        .catch(err=>{
            return reject(err);
        })
                        
    })    
}
*/
function getDatabase(client){
    return new Promise((resolve,reject)=>{
        client.readDatabase(dbUrl, (err, result) => {
            if (err) {
                if (err.code == HttpStatusCodes.NOTFOUND) {
                    console.log('No existe la db ');
                    reject({err : 'No existe la db'})                    
                } else {
                    reject(err);
                }
            } else {
                console.log('existe la db!!');
                resolve(result);
            }
        });
    })
}

function getCollection(client){
    return new Promise((resolve,reject)=>{
        client.readCollection(kpisCollection, (err, result) => {
            if (err) {
                console.log('collection not found');
                reject({err : 'Collection not found'});                
            } else {
                console.log('existe la collection !');
                resolve(result);
            }
        });
    })
}

function getKpisByDataset(dataset,client){
    var sqlQuery = "SELECT k.name,k.formula, k.unit, k.assignTo.targetType";
      sqlQuery +=  " FROM kpis as k";
      sqlQuery += " JOIN datasets IN k.datasets";
      sqlQuery += " WHERE datasets IN ('"+dataset+"') AND k.tenant = 'ahf' AND k.enable = true ";
        
    return new Promise((resolve,reject)=>{
        client.queryDocuments(
            kpisCollection,
            sqlQuery
        ).toArray((err, results) => {
            console.log('results',results);
            if (err) reject(err)            
            else if (!results) {                
                reject({msg : 'results not found'})
                //reject(res)
                /*for (var queryResult of results) {
                    let resultString = JSON.stringify(queryResult);
                    console.log(`\tQuery returned ${resultString}`);
                }
                console.log();
                resolve(results);*/
            }
            else{
                resolve(results);
            }
        });
    })
}

function calcKpis(kpis,context){
    var promises = kpis.map(kpi => calcKpi(kpi));
    return Promise.all(promises)    
}

function calcKpi(kpiDef){
    //get kpi's formula sql
    var sqlQueryKpi = kpiDef.formula;
    var dimensions = [ // in future it'll be kpiDef.dimensions
        {field: 'kpi_target'},
        {field: 'kpi_value_at'}
    ];
    var metrics = [ // in future it'll be kpiDef.metrics
        {field : 'PID', f: 'count'}
    ];    
    var cubeConfig = {dimensions,metrics};
    cubeConfig.keepTotals = false;                    
    var memo = {cubeConfig : cubeConfig,filterQuery: filterQuery};    
    var sprocLink = collectionLink + '/sprocs/cube';

    return new Promise((resolve,reject)=>{
        //execute formula
        //proces results
        client.executeStoredProcedure(sprocLink, memo, function(err, response) {
            if(err) return reject(err);
            console.log('response',response);                        
            cube = OLAPCube.newFromSavedState(response.savedCube);
            //console.log('properties cube',Object.keys(cube));
            console.log('celss',cube.cells.length);
            resolve(cube.cells);
            //cube = new OLAPCube(config, response.savedCube);
            //console.log('cube',cube.getCells());                                        
        });
        /*client.queryDocuments(ahfCollection, sqlQueryKpi)
        .toArray((err, results) => {
            //console.log('results',results);
            //return resolve(results)
            if (err) reject(err)
            if(results.length){
                var updatedAt = new Date().toISOString();                
                insertResults(kpiDef,results,updatedAt)
                .then(response=>{
                    resolve(response)
                })
                .catch(err=>{
                    reject(err)
                })                
            }
            else
                resolve(true);                        
        });*/
    })    
}

function insertResults(kpiDef,results,isoDate){
    var count = 0;    
    return new Promise((resolve,reject)=>{
        insertDocument(results[count])
    
        function insertDocument(document){
            document.kpiName = kpiDef.name;
            document.unit = kpiDef.unit;
            document.targetType = kpiDef.targetType;
            document.documentType = 'resultsTest22';
            document.updatedAt = isoDate;
            client.createDocument(ahfCollection, document, checkInsert) //(err,created)=>{
            //if(!ok) return reject('request not accepted ');    
            //}) //(err, created) => {    
        
        
          //      if (err) reject(err)
            //    else resolve(created);
        //});
        }
    
        function checkInsert(err,created){
            if(err) return reject(err);
           
            count++;
           
            if(count < results.length){           
               insertDocument(results[count])
            }
            else{
               return resolve(count);
            }
        
        }
    })            
                           
}

 