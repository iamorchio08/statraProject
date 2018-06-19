const avg_obj = {"avg_rate_25%" : 0.1, "avg_rate_50%": 0.2, "avg_rate_75%" : 0.3, "avg_rate_100%" : 0.4 };
var OLAPCube = require('lumenize').OLAPCube;
var db = require('../db/lib');
const dbUrl = 'dbs/statra-db';
const ahfCollection = `${dbUrl}/colls/AHF`;
module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');    
    db.getStatraScore()
    .then((response)=> { return calcStatScore(response) })
    .then((response)=>{ return processResults(response) })
    .then(response=>{ return saveResults(response) })
    .then(response=>{        
        var data = {msg : 'StatScore calculated' }
        context.res = {body : data};
        context.done();
    })
    .catch(err=>{
        context.log('err',err);
        var data = {error : err};
        context.res = {body : data, status: 400};
        context.done();
    });
};

function calcStatScore(statScoreDef){    
    var memo,sprocLink,opts;
    var memo = getCubeConfig(statScoreDef);    
    console.log('memo',memo);
    sprocLink = ahfCollection + '/sprocs/cube';                    
    opts = {partitionKey : 'results_kpi_'+statScoreDef.tenant};
    return new Promise((resolve,reject)=>{
        execUntilNotContinuation(sprocLink,memo);
        //execute formula        
        function execUntilNotContinuation(sprocLink,memo){            
            db.client.executeStoredProcedure(sprocLink, memo,opts,checkContinuation)                 
        }

        //validate if exists continuation token to retrieve more results
        function checkContinuation(err,response,headers){
            if(err && err.code === 429 && headers['x-ms-retry-after-ms']){
                console.log("Retrying after " + headers['x-ms-retry-after-ms']);
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
                    console.log('end continuation',cube.cells.length);                    
                    var res = {results : cube.cells, statScoreDef : statScoreDef}
                    resolve(res); 
                }                                
            }                                                                    
        }        
    })
}

function getCubeConfig(statScoreDef){
    var filterQuery,dimensions,metrics,cubeConfig
    filterQuery = statScoreDef.formula.queryFilter;
    dimensions  = statScoreDef.formula.dimensions;
    metrics = statScoreDef.formula.metrics;
    cubeConfig = {dimensions,metrics};    
    cubeConfig.keepTotals = false;                    
    return {cubeConfig : cubeConfig,filterQuery: filterQuery};
}

function processResults({results,statScoreDef}){
    var obj_result,count,updatedAt,partialArray,splitedArray;
    count = 0;
    updatedAt = new Date().toISOString();
    partialArray = [];
    splitedArray = [];
    return new Promise((resolve,reject)=>{
        results.forEach(data=>{
            obj_result = {};            
            obj_result["avg_rate_25%"] = data["avg_rate_25%"];
            obj_result["avg_rate_50%"] = data["avg_rate_50%"];
            obj_result["avg_rate_75%"] = data["avg_rate_75%"];
            obj_result["avg_rate_100%"] = data["avg_rate_100%"];
            obj_result.updatedAt = updatedAt;
            obj_result.recipient = {"targetFullName" : data.kpi_target};
            obj_result.valueAt = data.kpi_value_at;        
            obj_result.value = ( (obj_result["avg_rate_25%"] * avg_obj["avg_rate_25%"]) + (obj_result["avg_rate_50%"] * avg_obj["avg_rate_50%"]) + (obj_result["avg_rate_75%"] * avg_obj["avg_rate_75%"]) + (obj_result["avg_rate_100%"] * avg_obj["avg_rate_100%"]) )            
            obj_result.documentType = 'results_statscore_'+statScoreDef.tenant;
            partialArray.push(obj_result);
            count++;
            if(count == 1000){
                splitedArray.push(partialArray);
                partialArray = [];
                count = 0;
            }
        })
        if(count > 0){ //rest of documents
            console.log('rest docs',count);
            splitedArray.push(partialArray);
        }
        resolve(splitedArray)
    })    
}

function saveResults(arrayDocs){
    var count = 0;
    var sprocBulkInsert = ahfCollection + '/sprocs/bulkInsert';
    var partitionKeyValue = arrayDocs[0][0].documentType;    
    var opts = {partitionKey : partitionKeyValue};
    return new Promise((resolve,reject)=>{
        insertDocs(arrayDocs[count])

        function insertDocs(docs){
            var objDocs = {data : docs};
            console.log('inserting ..', docs.length, ' docss')            
            db.client.executeStoredProcedure(sprocBulkInsert, objDocs,opts, checkInsert) //(err,results)=>{                
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