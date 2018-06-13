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

exports.getTargetByTargetType = ({tenant, targetType, kpiName, date})=>{        
    let sqlQuery = "SELECT top 10 * FROM c where c.targetType = '"+targetType+"' AND c.documentType = 'target' ";
    return new Promise((resolve,reject)=>{
        client.queryDocuments(collectionUrl,sqlQuery)
        .toArray((err,results)=>{          
            if(err) return reject(err)
            //var results = results.map(data => {data.kpiName = kpiName; return data })
            resolve(results);
        })
    })
}

//retrieve kpis by targetID  and kpi name,
exports.getKpiByTargetAndKpiname = (target,kpiName)=>{
    //let sqlQuery = "SELECT * FROM c where c.name = '"+kpiName+"' AND ARRAY_CONTAINS(c.assignTo.targets,{'targetID' : '"+target.id+"'}) AND c.enable = true";    
    let targetFullName = target.firstName.trim()+' '+target.lastName.trim();
    let sqlQuery = "SELECT {'targetFullname': '"+targetFullName+"', 'name': c.name } as kpi, c.name, c.tenant from c where c.name = '"+kpiName+"' AND ARRAY_CONTAINS(c.assignTo.targets,{'targetID' : '"+target.id+"'}) AND c.enable = true";
    console.log('sqlquerykpi',sqlQuery);
    return new Promise((resolve,reject)=>{
        client.queryDocuments(defColl,sqlQuery)
        .toArray((err,results)=>{            
            if(err) return reject(err)
            resolve(results)
        })
    })
}

exports.getKpiByTarget = (targetID)=>{
    console.log('target id',targetID);
    let sqlQuery = "SELECT * FROM c where ARRAY_CONTAINS(c.assignTo.targets,{'targetID' : '"+targetID+"'}) AND c.enable = true";    

    return new Promise((resolve,reject)=>{
        client.queryDocuments(defColl,sqlQuery)
        .toArray((err,results)=>{      
            if(err) return reject(err)
            resolve(results)
        })
    })
}

//incluir filtrado con rango de valores y fecha
exports.getResultsBykpiRangeValue = (kpiDef,range,date)=>{    
    kpiDef.kpi.targetFullname = kpiDef.kpi.targetFullname.toLowerCase();
    let nameKpiWithoutSpace = kpiDef.name.replace(/\s/g,"");  
    let docTypeResultKpi = 'results_'+kpiDef.tenant+'_'+nameKpiWithoutSpace;    
    let init = range[0];
    let end = range[1];
    let sqlQuery = "SELECT top 13 * FROM c where c.documentType = '"+docTypeResultKpi+"' AND c.kpi_target = '"+kpiDef.kpi.targetFullname+"' AND (c.kpi_value BETWEEN "+init+" AND "+end+") AND c.kpi_value_at = '"+date+"' ORDER BY c.updatedAt DESC ";
    console.log('sqlquery',sqlQuery);
    return new Promise((resolve,reject)=>{
      client.queryDocuments(collectionUrl,sqlQuery)
      .toArray((err,results)=>{
        if(err) return reject(err)
        resolve(results)
      })
    })
}

exports.getResultsByKpiAndTarget = (kpiDef,targetFullName)=>{
    targetFullName = targetFullName.toLowerCase();
    let nameKpiWithoutSpace = kpiDef.name.replace(/\s/g,"");
    //let docTypeResultKpi = 'results_'+kpiDef.tenant+'_'+nameKpiWithoutSpace;
    let docTypeResultKpi = 'results_kpi_'+kpiDef.tenant;
    console.log('doctyperesultskpi',docTypeResultKpi);
    let sqlQuery = "SELECT top 13 * FROM c where c.documentType = '"+docTypeResultKpi+"' AND c.kpi_target = '"+targetFullName+"' ORDER BY c.kpi_value_at DESC ";
    console.log('query cra',sqlQuery);
    return new Promise((resolve,reject)=>{
        client.queryDocuments(collectionUrl,sqlQuery)
        .toArray((err,results)=>{
            console.log('err',err);
            if(err) return reject(err)
            resolve(results)
        })
    })
}

exports.getKpisByTargetType = ({tenant, targetType, enable, category = '', subcategory = ''})=>{
    let sqlQuery = "SELECT * from c where c.tenant = '"+tenant+"' AND c.assignTo.targetType = '"+targetType+"' AND c.enable = "+enable+" ";
    if(category){
        sqlQuery += "AND c.belongTo.category = '"+category+"' ";
    }
    if(subcategory){
        sqlQuery += "AND ARRAY_CONTAINS(c.belongTo.subCategories, '"+subcategory+"') ";
    }     
    return new Promise((resolve,reject)=>{
        client.queryDocuments(defColl, sqlQuery)
        .toArray((err,results)=>{
            if(err) return reject(err)
            resolve(results)
        })
    })
}

exports.getTargetTypes = ({tenant,targetType = ''})=>{
    let sqlQuery = 'SELECT DISTINCT c.targetType FROM c where c.documentType = "target" ';    
    if(targetType){
        sqlQuery += 'AND c.targetType = "'+targetType+'" ';
    }
    let opt = {partitionKey : 'target'}
    console.log('sql query get targettypes',sqlQuery);
    return new Promise((resolve,reject)=>{
        client.queryDocuments(collectionUrl,sqlQuery,opt)
        .toArray((err,results)=>{
            console.log('ress',results);
            if(err) return reject(err);
            resolve(results)
        })
    })
}

exports.getTargetById = ({tenant, targetID})=>{
    let sqlQuery = "SELECT * from c where c.documentType = 'target' AND c.id = '"+targetID+"' ";
    console.log('query',sqlQuery);
    let opt = {partitionKey : 'target'};
    return new Promise((resolve,reject)=>{
        client.queryDocuments(collectionUrl, sqlQuery,opt)
        .toArray((err,results)=>{
            if(err) return reject(err);
            resolve(results[0]);
        })
    })
}

exports.getKpis = (enable = true)=>{
    let sqlQuery = "SELECT * from c where c.tenant = 'ahf' AND c.enable = "+enable+" ";
    return new Promise((resolve,reject)=>{
        client.queryDocuments(defColl,sqlQuery)
        .toArray((err,results)=>{
            if(err) return reject(err);
            resolve(results);
        })
    })
}