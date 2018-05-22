const myArray =[1,2,3,4];
const validate = require('jsonschema').validate;
const kpiSchema = require('./kpiSchema');
const DocumentClient = require('documentdb').DocumentClient;
const host = "https://localhost:8081";                    
const masterKey = "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw=="; 
const client = new DocumentClient(host, 
    {
        masterKey: masterKey
    },
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
//const databaseDefinition = { id: "statra-db" };
//const collectionDefinition = { id: "kpis" };
const dbUrl = 'dbs/statra-db';
const collectionUrl = `${dbUrl}/colls/kpis`;

module.exports = function (context, req) {
    context.log('JavaScript HTTP function for create a kpi.');        
    var validation = validateParams(req.body);
    if(validation.ok){
        getDatabase()
        .then((response)=>{
            console.log('database found',response);
            return getCollection();
        })
        .then(()=> queryCollection(req.body.name))
        .then((response)=>{
            console.log('collection found',response);
            return createKpi(req.body);
        })        
        .then((response)=>{
          console.log('document created',response);
          var endpoint = getRealEndpointForKpi(response.id);                
          context.res= {
              status: 201,
              body: endpoint
          }
          return context.done();
        })
        .catch(err=>{
            console.log('error',err);
            context.res ={ 
                status : 400,
                statusText : 'Error',
                body : err.body
            };                       
            return context.done();         
        })
    }
    else{
        context.res = {
            status : 400,
            statusText : 'Error',
            body: 'Invalid Params'
        }
        return context.done();        
    }          
    //if(ok){
        //insert kpi definition into master collection of kpis              
      //  var endpoint = getEndpointForKpi();                
                
        //context.done(null,{res: {body : context.bindings.outputDocument } });
        //context.done(null,{res: {statusCode: 201,body : endpoint, status: 'Success created'}});
    //}    
};

function getDatabase() {
    console.log(`Getting database`);

    return new Promise((resolve, reject) => {
        client.readDatabase(dbUrl, (err, result) => {
            if (err) {
                if (err.code == HttpStatusCodes.NOTFOUND) {
                    console.log('sse crea la db');
                    client.createDatabase(dbUrl, (err, created) => {
                        if (err) reject(err)
                        else resolve(created);
                    });
                } else {
                    reject(err);
                }
            } else {
                resolve(result);
            }
        });
    });
}

function getCollection() {
    console.log(`Getting collection`);

    return new Promise((resolve, reject) => {
        client.readCollection(collectionUrl, (err, result) => {
            if (err) {
                console.log('collection not found');
                /*
                if (err.code == HttpStatusCodes.NOTFOUND) {
                    client.createCollection(databaseUrl, config.collection, { offerThroughput: 400 }, (err, created) => {
                        if (err) reject(err)
                        else resolve(created);
                    });
                } else {
                    reject(err);
                }
                */
            } else {
                resolve(result);
            }
        });
    });
}

function createKpi(document) {
    //let documentUrl = `${collectionUrl}/docs/${document.id}`;
    console.log(`Creating document`);
    document.enable = true;
    return new Promise((resolve, reject) => {
        client.createDocument(collectionUrl, document, (err, created) => {
            if (err) reject(err)
            else resolve(created);
        });
        /*
        client.readDocument(documentUrl, (err, result) => {
            if (err) {
                if (err.code == HttpStatusCodes.NOTFOUND) {
                    client.createDocument(collectionUrl, document, (err, created) => {
                        if (err) reject(err)
                        else resolve(created);
                    });
                } else {
                    reject(err);
                }
            } else {
                resolve(result);
            }
        });
        */
    });
};

function queryCollection(name) {
    console.log(`Querying collection`);
    var sqlQuery = 'SELECT VALUE r.name FROM root r WHERE r.name = "'+name+'"';
    console.log('sql query',sqlQuery);
    return new Promise((resolve, reject) => {
        client.queryDocuments(
            collectionUrl,
            sqlQuery
        ).toArray((err, results) => {
            console.log('results',results.length);
            if (err) reject(err)            
            else if (results.length) {
                var res = {ok : false, status : 400, body : 'Kpi name must be unique'}
                reject(res)
                /*for (var queryResult of results) {
                    let resultString = JSON.stringify(queryResult);
                    console.log(`\tQuery returned ${resultString}`);
                }
                console.log();
                resolve(results);*/
            }
            else{
                resolve(results.length)
            }
        });
    });
};

const validateParams = (data)=> {
    console.log('validate params ');
    console.log('validate', validate(data,kpiSchema))
    var validation = validate(data,kpiSchema);
    var res= {};
    if(validation.errors.length){
        res.ok = false;
        res.errors = validation.errors;
        res.status = 400;
        res.body = 'Invalid Params';
    }
    else{
        res.ok = true;
    }
    return res;
}

const getEndpointForKpi = (id)=>{
    
    var rand = myArray[Math.floor(Math.random() * myArray.length)];
    var endpoint = '/api/kpis/'+rand+'/metadata';
    return endpoint;
}

const getRealEndpointForKpi = (id)=>{
    var endpoint = 'https://statrafndev.azurewebsites.net/api/kpis/'+id+'/metadata';
    return endpoint;
}
