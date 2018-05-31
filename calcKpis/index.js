
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
const kpisCollection = `${dbUrl}/colls/definitions`;
const ahfCollection = `${dbUrl}/colls/AHF`;
const testCollection = `${dbUrl}/colls/ahf`;
module.exports = function (context, req) {
    //return testRes();
    
    context.log('http started',req.query);            
    if(req.query && req.query.dataset){        
        let dataset = req.query.dataset;       
        getDatabase(client)
        .then((response)=>{
            
            return getCollection(client);
        })
        .then((response)=>{
            
            return getKpisByDataset(dataset,client,context);        
        })
        .then((response)=>{
            context.log('response get kpis');
            return calcKpis(response);            
        })
        .then(response=>{
            context.done();
            //recibo un array de results de los diferentes calculos de kpis
            //response structure = {results,kpiDef}
            //context.log('promises kpis',response);
            console.log('response from calculo de kpis');
            return processResults(response)
            //context.res = {body : 'Kpis calculated'}
            //context.done();
        })
        .then(response=>{
            console.log('response from process results',response[0].length);
            context.res = {body : response[0]};
            context.done();
        })    
        .catch(err=>{
            console.log('err',err);            
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
    
    var sqlQuery = "SELECT k.name,k.formula, k.unit, k.assignTo.targetType, k.tenant, REPLACE(k.name,' ','') as nameConcat";
      sqlQuery +=  " FROM kpis as k";
      sqlQuery += " JOIN datasets IN k.datasets";
      sqlQuery += " WHERE k.documentType = 'kpi' AND datasets IN ('"+dataset+"') AND k.enable = true ";
        
    return new Promise((resolve,reject)=>{
        client.queryDocuments(
            kpisCollection,
            sqlQuery
        ).toArray((err, results) => {
            
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

function calcKpis(kpis){
    var promises = kpis.map(kpi => calcKpi(kpi));
    return Promise.all(promises)    
}

function calcKpi(kpiDef){
    //get kpi's formula sql
    var filterQuery,dimensions,metris,cubeConfig,memo,sprocLink,sprocLink;
    sprocLink = ahfCollection + '/sprocs/cube';    
    filterQuery = kpiDef.formula.queryFilter;
    dimensions  = kpiDef.formula.dimensions;
    metrics = kpiDef.formula.metrics;
    cubeConfig = {dimensions,metrics};    
    cubeConfig.keepTotals = false;                    
    memo = {cubeConfig : cubeConfig,filterQuery: filterQuery};            
    
    return new Promise((resolve,reject)=>{
        insertUntilNotContinuation(sprocLink,memo);
        //execute formula
        //proces results
        function insertUntilNotContinuation(sprocLink,memo){
            client.executeStoredProcedure(sprocLink, memo,checkContinuation) //, function(err, response) {
                //if(err) return reject(err);
                //console.log('group by store procedure executed');
                //console.log('lresponse keys',Object.keys(response));
                //console.log('response saved cube keys',Object.keys(response.savedCube));            
                
                //console.log('properties cube',Object.keys(cube));

                //cube = OLAPCube.newFromSavedState( response.savedCube);
                //console.log('results[0]',cube.cells[0]);
                //var res = {results : cube.cells, kpiDef : kpiDef}
                //resolve(res); 
                //cube = new OLAPCube(config, response.savedCube);
                //console.log('cube',cube.getCells());                                        
            //});        
        }

        function checkContinuation(err,response){
            if(err) reject(err)
            //console.log('response',response.Response);
            console.log('properties',Object.keys(response));
                        
            if(response.continuation != null){
                cube = OLAPCube.newFromSavedState( response.savedCube);
                console.log('results',cube.cells.length);
                console.log('continuation',response.continuation);
                //insertUntilNotContinuation(sprocLink,response)
            }
            else{
                resolve('ok');
                cube = OLAPCube.newFromSavedState( response.savedCube);
                console.log('results',cube.cells.length);
                console.log('not continuation');
            }
        }
        
    })    
}

function processResults(response){
    var promises = response.map(res => processResult(res.results,res.kpiDef))
    console.log('promises length',promises.length);
    return Promise.all(promises);
}

function processResult(results,kpiDef){
    var splitArray = []  //array of arrays , where each item contain batchData
    var updatedAt = new Date().toISOString();
    var count = 0;
    var partialArray = [];
    return new Promise((resolve,reject)=>{
        results.forEach(doc =>{
            // assign the missing properties 
            if(count < 999){                
                doc.kpiName = kpiDef.name;
                doc.unit = kpiDef.unit;
                doc.targetType = kpiDef.targetType;
                doc.documentType = 'results_'+kpiDef.tenant+'_'+kpiDef.nameConcat;
                doc.updatedAt = updatedAt;        
                partialArray.push(doc);
                count++;
            }
            else{
                console.log('llegue a 1000');
                splitArray.push(partialArray);
                partialArray = [];
                count = 0;
            }                
        })
        if(count > 0){
            console.log('quedò data en partial array',count);
            splitArray.push(partialArray);
        }
        console.log('split array length',splitArray.length);
        batchInsert(splitArray)
        .then(response=>{            
            resolve(response)
        })
        .catch(err=>{
            console.log('err from batchInsert',err);
            reject(err)
        })
        //resolve(splitArray);
    })
    
    
}

function batchInsert(arrayDocs){
    var count = 0;
    var sprocBulkInsert = testCollection + '/sprocs/bulkInsert';
    
    return new Promise((resolve,reject)=>{
        insertDocs(arrayDocs[count])

        function insertDocs(docs){
            var objDocs = {data : docs};
            console.log('inserting ..', docs.length, ' docss')            
            client.executeStoredProcedure(sprocBulkInsert, objDocs, checkInsert) //(err,results)=>{                
        }

        function checkInsert(err,response){
            console.log('response insert',response);
            if(err) return reject(err)
            count++;
            if(count < arrayDocs.length){
                insertDocs(arrayDocs[count])
            }
            else{
                resolve(count) // deberia retornar la cantidad total acumulada
            }
        }
    })
}

function testRes(){
    var sql ='SELECT * FROM c where c.kpiName = "Kpi real data query" ';
    client.queryDocuments(testCollection,sql)
    .toArray((err,results)=>{
        console.log('results length',results.length);
    })
}
/*
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
*/
/*
var dimensions = [ // in future it'll be kpiDef.dimensions
        {field: 'kpi_target'},
        {field: 'kpi_value_at'}
    ];
var metrics = [ // in future it'll be kpiDef.metrics
    {field : 'PID', f: 'count'}
];
*/    