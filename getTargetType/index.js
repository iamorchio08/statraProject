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
    var targetType = context.bindingData.targetType;
    
    if(req.query.test){
        if(targetType){
            var res = getTargetTypeById(targetType);
           return context.done(null,{res: res});
        }
        var res = { status : 'Error', statusCode : 400, body : 'Target type is required'};
        return context.done(null,{res: res});
    }
    else{ //real data
        if(targetType){
            getTargetByTargetType(targetType)
            .then(response=>{
                context.res = {
                    body : response
                }
                return context.done();
            })
            .catch(err=>{
                context.res = {
                    body : err,
                    status : 400
                }
                return context.done();
            })
        }
        else{
            context.res = { status : 'Error', statusCode : 400, body : 'Target type is required'};
            return context.done();
        }        
    }    
};

const getTargetTypeById = (targetTypeId)=>{
    var res = {};
    if(typeof mockTargetTypes[targetTypeId-1] != 'undefined'){
        res.body = mockTargetTypes[targetTypeId-1]
        res.status = 'success';
        res.statusCode = 200;
    }
    else{
        res.body = '';
        res.status = 'Error not found';
        res.statusCode = 404;
    }
    return res;
}

const getTargetByTargetType = (targetType)=>{
    let sqlQuery = "SELECT * FROM c where c.targetType = '"+targetType+"' AND c.documentType = 'target' ";
    return new Promise((resolve,reject)=>{
        client.queryDocuments(collectionUrl,sqlQuery)
        .toArray((err,results)=>{
            if(err) return reject(err)

            resolve(results);
        })
    })
}