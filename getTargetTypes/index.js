const mockTargetTypes = require('./api/targetTypes');
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
const dbUrl = 'dbs/statra-db';
const collectionUrl = `${dbUrl}/colls/AHF`;

module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
    var res = {};
    if (req.query.test){
         res.body = getAllTargetTypes();
         return context.done(null,{res:res});
    }
    else{ //real data
        getTargetTypes()
        .then(response=>{
            context.res=  {
                body : response
            };
            context.done();
        })
        .catch(err=>{
            context.res={
                body: err,
                status : 400
            };
            context.done();
        })
    }        
};

const getAllTargetTypes = ()=>{
    return mockTargetTypes;
}

const getTargetTypes = ()=>{ //get all targetTypes 
    var sqlQuery = "SELECT distinct c.targetType FROM c where c.documentType = 'target' ";
    return new Promise((resolve,reject)=>{
        client.queryDocuments(collectionUrl,sqlQuery)
        .toArray((err,results)=>{
            if(err) return reject(err);

            resolve(results);
        })
    })
}