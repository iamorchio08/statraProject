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
exports.client = client;
const dbUrl = 'dbs/statra-db';
const collectionUrl = `${dbUrl}/colls/AHF`;
const defColl = `${dbUrl}/colls/definitions`;

exports.getTargetByTargetType = ({tenant, targetType, kpiName, date,filter})=>{
    if(filter)
        var sqlQuery = "SELECT * FROM c where c.targetType = '"+targetType+"' AND c.documentType = 'target' AND (CONTAINS(concat(LOWER(c.firstName),' ', LOWER(c.lastName)), '"+filter+"') OR CONTAINS(LOWER(c.location), '"+filter+"') ) ORDER BY c.lastName ASC ";          
    else
        var sqlQuery = "SELECT * FROM c where c.targetType = '"+targetType+"' AND c.documentType = 'target' ORDER BY c.lastName ASC ";
            
    let opt = {partitionKey : 'target'}
    return new Promise((resolve,reject)=>{
        client.queryDocuments(collectionUrl,sqlQuery,opt)
        .toArray((err,results)=>{          
            if(err) return reject(err)        
            resolve(results);
        })
    })
}

//retrieve kpis by targetID  and kpi name,
exports.getKpiByTargetAndKpiname = (target,kpiName)=>{
    //let sqlQuery = "SELECT * FROM c where c.name = '"+kpiName+"' AND ARRAY_CONTAINS(c.assignTo.targets,{'targetID' : '"+target.id+"'}) AND c.enable = true";    
    let targetFullName = target.firstName.trim()+' '+target.lastName.trim();
    //let sqlQuery = 'SELECT {"targetFullname": "'+targetFullName+'", "name": c.name } as kpi, c.name, c.tenant from c where c.name = "'+kpiName+'" AND ARRAY_CONTAINS(c.assignTo.targets,{"targetID" : "'+target.id+'"}) AND c.enable = true';
    let sqlQuery = 'SELECT {"targetFullname": "'+targetFullName+'", "name": c.name } as kpi, c.name, c.tenant from c where c.name = "'+kpiName+'" AND c.enable = true';
    //console.log('sqlquerykpi',sqlQuery);
    return new Promise((resolve,reject)=>{
        client.queryDocuments(defColl,sqlQuery)
        .toArray((err,results)=>{
            console.log('err',err);
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
    let docTypeResultKpi = 'results_kpi_'+kpiDef.tenant;    
    let init = range[0];
    let end = range[1];
    let sqlQuery = "SELECT * FROM c where c.documentType = '"+docTypeResultKpi+"' AND c.kpi_target = '"+kpiDef.kpi.targetFullname+"' AND (c.kpi_value BETWEEN "+init+" AND "+end+") AND SUBSTRING(c.kpi_value_at, 0, 10) = '"+date+"' ORDER BY c.updatedAt DESC ";
    console.log('sqlquery',sqlQuery);
    return new Promise((resolve,reject)=>{
      client.queryDocuments(collectionUrl,sqlQuery)
      .toArray((err,results)=>{
        if(err) return reject(err)
        resolve(results)
      })
    })
}

exports.getResultsByKpiAndTarget = (kpiDef,targetFullName,{dateFrom,dateTo})=>{
    targetFullName = targetFullName.toLowerCase();
    let nameKpiWithoutSpace = kpiDef.name.replace(/\s/g,"");    
    let docTypeResultKpi = 'results_kpi_'+kpiDef.tenant;

    let sqlQuery = "SELECT * FROM c where c.documentType = '"+docTypeResultKpi+"' AND LOWER(c.kpi_target) = '"+targetFullName+"' AND (c.kpi_value_at BETWEEN '"+dateFrom+"' AND '"+dateTo+"') ORDER BY c.kpi_value_at DESC ";

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

exports.getTargetsByTargetType = (targetType)=>{
    let sqlQuery = "SELECT * from c where c.documentType = 'target' and c.targetType = '"+targetType+"' ";
    let opt = { partitionKey : 'target'};
    return new Promise((resolve,reject)=>{
        client.queryDocuments(collectionUrl, sqlQuery, opt)
        .toArray((err,results)=>{
            console.log('err',err);
            if(err) return reject(err);
            resolve(results);
        })
    })
    
}

exports.validateQuery = (sqlQuery)=>{    
    return new Promise((resolve,reject)=>{
        let opt = {populateQueryMetrics : true};
       client.queryDocuments(collectionUrl,sqlQuery,opt)
       .toArray((err,results)=>{
           if(err) return reject(err)
           resolve(true)
       })                
    })
}

exports.getStatraScore = ()=>{ //retrieve the statrascore document from definitions coll
    var sqlQuery = 'SELECT * FROM c WHERE c.documentType = "statscore" ';
    return new Promise((resolve,reject)=>{
        
        client.queryDocuments(defColl,sqlQuery).toArray((err,results)=>{
            if(err) return reject(err)

            resolve(results[0]);
        })
    })
}

exports.getStatScoreByTarget = (target,{dateFrom,dateTo})=>{    
    var targetFullName = (target.firstName+' '+target.lastName).toLowerCase();
    var sqlQuery = 'SELECT * FROM c WHERE c.documentType = "results_statscore_AHF" AND LOWER(c.recipient.targetFullName) = "'+targetFullName+'" AND (c.valueAt BETWEEN "'+dateFrom+'" AND "'+dateTo+'") ORDER BY c.valueAt DESC';     
    return new Promise((resolve,reject)=>{
        client.queryDocuments(collectionUrl,sqlQuery).toArray((err,results)=>{
            if(err) return reject(err);

            resolve(results);
        })
    })
}

exports.getKpiByTenantAndNameAndTargetType = (tenant,targetType,kpiName)=>{
    tenant = tenant.toLowerCase();
    targetType = targetType.toLowerCase();
    kpiName = kpiName.toLowerCase();
    sqlQuery = "SELECT * from c where LOWER(c.tenant) = '"+tenant+"' AND LOWER(c.assignTo.targetType) = '"+targetType+"' and LOWER(c.name) = '"+kpiName+"' ";
    return new Promise((resolve,reject)=>{
        client.queryDocuments(defColl,sqlQuery).toArray((err,results)=>{
            if(err) return reject(err)
            resolve(results[0])
        })
    })
}

exports.getTargetsById = (targetIds)=>{
    
    var sqlQuery = 'SELECT * FROM c WHERE c.documentType = "target" AND c.id IN ('+targetIds+') ';
    console.log('sqlquery',sqlQuery);
    var opt = {partitionKey : "target"};
    return new Promise((resolve,reject)=>{
        client.queryDocuments(collectionUrl,sqlQuery,opt).toArray((err,results)=>{
            if(err) return reject(err);
            resolve(results);
        })
    })
}

exports.getTargetsByFullname = (targetsFullname)=>{
    var sqlQuery = 'select * from c where c.documentType = "target" AND LOWER(concat(c.firstName," ", c.lastName)) IN ('+targetsFullname+') ';
    console.log('sqlQuery',sqlQuery);
    var opt = {partitionKey : "target"};
    return new Promise((resolve,reject)=>{
        client.queryDocuments(collectionUrl,sqlQuery,opt).toArray((err,results)=>{
            if(err) return reject(err);
            console.log('results',results);
            resolve(results);
        })
    })
}

exports.getKpiResultsByDateAndRange = (tenant,kpiname,range,date,filter)=>{
    var date = date.split('T')[0];
    console.log('date',date);
    var init = range[0];
    var end = range[1];
    var docType = 'results_kpi_'+tenant;
    if(filter){
        filter = filter.toLowerCase();
        var sqlQuery = 'select distinct c.kpi_target, c.kpi_value, c.kpi_value_at, c.valueRate from c where c.documentType = "'+docType+'" and c.kpiName = "'+kpiname+'" and (c.kpi_value between '+init+' and '+end+') and SUBSTRING(c.kpi_value_at, 0, 10) = "'+date+'" AND CONTAINS(LOWER(c.kpi_target), "'+filter+'") ORDER BY c.kpi_value_at DESC ';
    }
    else
        var sqlQuery = 'select distinct c.kpi_target, c.kpi_value, c.kpi_value_at, c.valueRate from c where c.documentType = "'+docType+'" and c.kpiName = "'+kpiname+'" and (c.kpi_value between '+init+' and '+end+') and SUBSTRING(c.kpi_value_at, 0, 10) = "'+date+'" ORDER BY c.kpi_value_at DESC ';
    var opt = {partitionKey : docType}
    console.log('query',sqlQuery);    
    return new Promise((resolve,reject)=>{
        
        client.queryDocuments(collectionUrl,sqlQuery).toArray((err,results)=>{
            if(err) return reject(err);
            resolve(results);
        })
    })
}

exports.getDataResutlsStatScore = (tenant,targetType,range,date,filter)=>{
    var init = range[0];
    var end = range[1];
    console.log('date',date);
    var docType = 'results_statscore_'+tenant;
    if(filter){
        filter = filter.toLowerCase();
        var sqlQuery = 'select * from c where c.documentType = "'+docType+'" AND (c["value"] BETWEEN '+init+' AND '+end+') AND SUBSTRING(c.valueAt,0,10) = "'+date+'" AND CONTAINS(LOWER(c.recipient.targetFullName), "'+filter+'") ORDER BY c.valueAt DESC ';    
    }        
    else
        var sqlQuery = 'select * from c where c.documentType = "'+docType+'" AND (c["value"] BETWEEN '+init+' AND '+end+') AND SUBSTRING(c.valueAt,0,10) = "'+date+'" ORDER BY c.valueAt DESC ';
    var opt = {partitionKey : docType};
    return new Promise((resolve,reject)=>{
        client.queryDocuments(collectionUrl,sqlQuery,opt).toArray((err,results)=>{
            console.log('err',err);
            if(err) return reject(err);
            resolve(results);
        })
    })
}