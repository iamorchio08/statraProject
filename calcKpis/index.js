
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
const ahfCollection = `${dbUrl}/colls/ahf`;
const testCollection = `${dbUrl}/colls/ahf`;
module.exports = function (context, req) {
    //return testRes();
    var dateStart = new Date();
    context.log('http started',req.query);            
    if(req.query && req.query.dataset){        
        let dataset = req.query.dataset;       
        getDatabase(client)
        .then((response)=>{
            
            return getCollection();
        })
        .then((response)=>{
            
            return getKpisByDataset(dataset);        
        })
        .then((response)=>{
            context.log('response get kpis');
            return calcKpis(response,dataset);            
        })
        .then(response=>{            
            //recibo un array de results de los diferentes calculos de kpis
            //response structure = {results,kpiDef}            
            console.log('response from calculo de kpis');
            return processResults(response)                        
        })
        .then(response=>{
            //console.log('response from process results',response[0].length);
            console.log('kpi calculared from',dateStart, 'and end ', new Date());
            context.res = {body :{data: response, msg:'Kpi calculated' }};
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
function getDatabase(){
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

function getCollection(){
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

function getKpisByDataset(dataset){
    
    var sqlQuery = "SELECT k.name,k.formula, k.unit, k.assignTo.targetType, k.tenant, REPLACE(k.name,' ','') as nameConcat, k.goals, k.weight";
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
            }
            else{
                resolve(results);
            }
        });
    })
}

function calcKpis(kpis,dataset){
    var promises = kpis.map(kpi => calcKpi(kpi,dataset));
    return Promise.all(promises)      
}
function _calcKpi(kpiDef,dataset){
    //var query = "select Lower(REPLACE(c.LastModifiedBy, '.', ' ')) as kpi_target , CONCAT(SUBSTRING(c.LastModified,0,13),':59') as kpi_value_at, c.PId from c where c.documentType = 'dataset_appt_completed' ";    
    var query = "select Lower(REPLACE(c.LastModifiedBy, '.', ' ')) as kpi_target , CONCAT(SUBSTRING(c.LastModified,0,13),':59') as kpi_value_at, c.PId from c where c.documentType = 'dataset_appt_completed' ";    
    console.log('query',query);
    var opt = {partitionKey : dataset};
    return new Promise((resolve,reject)=>{
        console.log('start ! !', new Date())
        testQuery(ahfCollection,query,opt);
        function testQuery(ahfCollection,query,opt){
            
            var res = client.queryDocuments(ahfCollection,query,opt);
            if(res.hasMoreResults()){
                console.log('hay results', new Date());

            }            
            res.toArray(checkContinuation)
            
        }
        function checkContinuation(err,results,headers){
            console.log('header',headers);
            if(err && err.code === 429 && headers['x-ms-retry-after-ms']){
                console.log("Retrying after " + headers['x-ms-retry-after-ms']);
                setTimeout(function() {                    
                    testQuery(ahfCollection,query,opt);
                }, headers['x-ms-retry-after-ms']);
            }
            else{
                console.log('results',results.length);
                console.log('end ', new Date())    ;
                resolve(results);
            }
        }                  
        
    })
}

function calcKpi(kpiDef,dataset){
    //get kpi's formula sql , metrics and dimensions
    console.log('calcKpi',kpiDef.name);
    var filterQuery,dimensions,metrics,cubeConfig,memo,sprocLink,sprocLink,dataRes;
    dataRes = [];
    sprocLink = ahfCollection + '/sprocs/cube';    
    filterQuery = kpiDef.formula.queryFilter;
    dimensions  = kpiDef.formula.dimensions;
    metrics = kpiDef.formula.metrics;
    cubeConfig = {dimensions,metrics};    
    cubeConfig.keepTotals = false;                    
    memo = {cubeConfig : cubeConfig,filterQuery: filterQuery};            
    let opts = {partitionKey : dataset, requestContinuation: true, maxItemCount : -1};
    return new Promise((resolve,reject)=>{
        execUntilNotContinuation(sprocLink,memo);
        //execute formula
        //proces results
        function execUntilNotContinuation(sprocLink,memo){            
            client.executeStoredProcedure(sprocLink, memo,opts,checkContinuation) 
                
        }

        //validate if exists continuation token to retrieve more results
        function checkContinuation(err,response,headers){
            
            if(err && err.code === 429 && headers['x-ms-retry-after-ms']){
                console.log("Retrying after " + headers['x-ms-retry-after-ms']);
                console.log('continuation ???',Object.keys(headers));
                console.log('charge',headers['x-ms-request-charge'])
                setTimeout(function() {                    
                    execUntilNotContinuation(sprocLink,memo);
                }, headers['x-ms-retry-after-ms']);
            }
            else if(err && !response){
                return reject(err)
            }
            else{                
                if(response.continuation != null){
                    console.log('continuation');                    
                    execUntilNotContinuation(sprocLink,response)
                }
                else{ //continuation end                                         
                    cube = OLAPCube.newFromSavedState( response.savedCube);
                    //dataRes = dataRes.concat(cube.cells);
                    console.log('end continuation',cube.cells);
                    var res = {results : cube.cells, kpiDef : kpiDef}
                    resolve(res); 
                }                                
            }                                                                    
        }
        
    })    
}

function processResults(response){    
    var promises = response.map(res => processResult(res.results,res.kpiDef))    
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
                delete doc._count;                                
                doc.kpiName = kpiDef.name;
                doc.unit = kpiDef.unit;
                doc.targetType = kpiDef.targetType;                
                doc.documentType = 'results_kpi_'+kpiDef.tenant;
                doc.updatedAt = updatedAt;
                doc.weight = kpiDef.weight;        
                doc.valueTarget = kpiDef.goals.value[2];
                doc.recipient = {"targetFullName" : doc.kpi_target};
                doc.valueRate = ((100 * doc.kpi_value) / kpiDef.goals.max);
                doc['rate_'+kpiDef.weight] = doc.valueRate;                                
                partialArray.push(doc);
                count++;
            }
            else{     
                console.log('999');
                splitArray.push(partialArray);
                partialArray = [];
                count = 0;
            }                
        })
        if(count > 0){
            console.log('quedò data en partial array',count);
            splitArray.push(partialArray);
        }
        console.log('split array length for kpi ', kpiDef.name,' >>>',splitArray.length);
        batchInsert(splitArray)
        .then(response=>{            
            resolve(response)
        })
        .catch(err=>{
            console.log('err from batchInsert',err);
            reject(err)
        })        
    })
    
    
}

//receive an array of batch documents to insert with store procedure
//grouped by 
function batchInsert(arrayDocs){
    var count = 0;
    var sprocBulkInsert = ahfCollection + '/sprocs/bulkInsert';
    var partitionKeyValue = arrayDocs[0][0].documentType    
    var opts = {partitionKey : partitionKeyValue};
    return new Promise((resolve,reject)=>{
        insertDocs(arrayDocs[count])

        function insertDocs(docs){
            var objDocs = {data : docs};
            console.log('inserting ..', docs.length, ' docss')            
            client.executeStoredProcedure(sprocBulkInsert, objDocs,opts, checkInsert) //(err,results)=>{                
        }

        function checkInsert(err,response,headers){
            if(err && err.code === 429 && headers['x-ms-retry-after-ms']){
                console.log("Retrying after " + headers['x-ms-retry-after-ms']);
                setTimeout(function() {
                    insertDocs(arrayDocs[count]);
                }, headers['x-ms-retry-after-ms']);
            }
            else if(err){                
                console.log('headers err',headers);                    
                return reject(err)
            }
            else{
                console.log('docs inserted');            
                count++;
                if(count < arrayDocs.length){
                    insertDocs(arrayDocs[count])
                }
                else{
                    resolve(count) // deberia retornar la cantidad total acumulada
                }
            }   
                
                        
        }
    })
}

function testRes(){
    var sql ='SELECT * FROM c where c.documentType = "results_ahf_Kpirealdataquerytest" ';
    var opt = {partitionKey : '/results_ahf_Kpirealdataquerytest'}
    client.queryDocuments(ahfCollection,sql,opt)
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