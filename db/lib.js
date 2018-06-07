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
const defColl = `${dbUrl}/colls/definitions`;

exports.getTargetByTargetType = (targetType)=>{    
    let sqlQuery = "SELECT top 10 * FROM c where c.targetType = '"+targetType+"' AND c.documentType = 'target' ";
    return new Promise((resolve,reject)=>{
        client.queryDocuments(collectionUrl,sqlQuery)
        .toArray((err,results)=>{          
            if(err) return reject(err)
  
            resolve(results);
        })
    })
}
  
exports.getKpiByTargetType = (targetType)=>{    
    let sqlQuery = "SELECT * FROM c where c.assignTo.targetType = '"+targetType+"' ";
    return new Promise((resolve,reject)=>{
        client.queryDocuments(defColl,sqlQuery)
        .toArray((err,results)=>{      
        if(err) return reject(err)
        resolve(results)
        })
    })
}
  
exports.getResultsBykpi = (kpiDef)=>{
    let nameKpiWithoutSpace = kpiDef.name.replace(/\s/g,"");  
    let docTypeResultKpi = 'results_'+kpiDef.tenant+'_'+nameKpiWithoutSpace;    
    let sqlQuery = "SELECT top 13 * FROM c where c.documentType = '"+docTypeResultKpi+"' ";
    return new Promise((resolve,reject)=>{
      client.queryDocuments(collectionUrl,sqlQuery)
      .toArray((err,results)=>{
        if(err) return reject(err)
        resolve(results)
      })
    })
}