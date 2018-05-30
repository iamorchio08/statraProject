const categories = require('./api/categories');
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
const collectionUrl = `${dbUrl}/colls/definitions`;

module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
    if(req.query.test){
        var data = getAllCategories();
        var res = {
            body : data,
            statusCode : 200,
            status : 'success'
        };
        return context.done(null,{res: res});
    }
    else{
        getAll()
        .then(response=>{
            context.res= {
                body : response
            }
            return context.done();
        })
        .catch(err=>{
            context.res = {
                body : err
            }
            return context.done();
        })

    }
    //context.done(null,{res:{body : 'Real Data'}});
};

const getAllCategories = ()=>{
    return categories;
}

const getAll = ()=>{
    let sqlQuery = "select * from c where c.documentType = 'category' ";
    return new Promise((resolve,reject)=>{
        client.queryDocuments(collectionUrl,sqlQuery)
        .toArray((err,results)=>{
            if(err) return reject(err)

            resolve(results);
        })
    })
}