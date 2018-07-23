const ObjectId = require('mongodb').ObjectID;
const mongoClient = require('mongodb').MongoClient;
const uri = "mongodb://localhost:27017/local";
var client;
exports.connectDB = ()=>{
    return new Promise((resolve,reject)=>{
        if(client == null){
            mongoClient.connect(uri,{useNewUrlParser: true},(err,client_)=>{
                if(err) return reject(err)                                  
                //client = client_.db('statrascore_demo');            
                client = client_.db();                
                return resolve(client);
            })
        }
        else{
            resolve(client);
        }
        
    })        
}
exports.getTargetByTargetType = ({tenant, targetType, kpiName, date,filter})=>{
    if(filter)
        var sqlQuery = "SELECT * FROM c where c.targetType = '"+targetType+"' AND c.documentType = 'target' AND (CONTAINS(concat(LOWER(c.firstName),' ', LOWER(c.lastName)), '"+filter+"') OR CONTAINS(LOWER(c.location), '"+filter+"') ) ORDER BY c.lastName ASC ";          
    else
        var sqlQuery = "SELECT * FROM c where c.targetType = '"+targetType+"' AND c.documentType = 'target' ORDER BY c.lastName ASC ";
    
        /* [
            {
                $project: {
                    targetFullName : {$toLower:{
                        $concat: ["$FirstName",' ', "$LastName" ]
                    }},
                    targetType : 1,
                    documentType : 1,
                    Location : {$toLower: "$Location"},
                    LastName : 1
                    
                }
            },
            { //only when filter is present
                $match: {
                    Location : {$regex: "aid"},
                    targetFullName : {$regex: "u"}
                }
            },
            {
                $sort: {
                    LastName : 1
                }
            }
        ]     */
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
exports.getKpiByTargetAndKpiname = (client,target,kpiName)=>{
    //let sqlQuery = "SELECT * FROM c where c.name = '"+kpiName+"' AND ARRAY_CONTAINS(c.assignTo.targets,{'targetID' : '"+target.id+"'}) AND c.enable = true";    
    let targetFullName = target.FirstName.trim()+' '+target.LastName.trim();
    //let sqlQuery = 'SELECT {"targetFullname": "'+targetFullName+'", "name": c.name } as kpi, c.name, c.tenant from c where c.name = "'+kpiName+'" AND ARRAY_CONTAINS(c.assignTo.targets,{"targetID" : "'+target.id+'"}) AND c.enable = true';
    //let sqlQuery = 'SELECT {"targetFullname": "'+targetFullName+'", "name": c.name } as kpi, c.name, c.tenant from c where c.name = "'+kpiName+'" AND c.enable = true';
    let query = [
        {
            $project: {
                targetFullName : targetFullName,
                name: 1,
                tenant: 1,
                enable : 1
            }
        },
        {
            $match:{
                name : kpiName,
                enable: true
            }
        }
    ]
    //console.log('sqlquerykpi',sqlQuery);
    return new Promise((resolve,reject)=>{
        client.collection('definitions').aggregate(query)
        .toArray((err,results)=>{
            console.log('err',err);
            if(err) return reject(err)
            resolve(results)
        })
    })
}

exports.getKpiByTarget = (client,targetID)=>{
    console.log('target id',targetID);
    //let sqlQuery = "SELECT * FROM c where ARRAY_CONTAINS(c.assignTo.targets,{'targetID' : '"+targetID+"'}) AND c.enable = true";    
    let query = {
        "assignTo.targets" :  {$eq : targetID},
        enable: true
    }
    return new Promise((resolve,reject)=>{
        client.collection('definitions').find(query,{sort: [['weightNumber','desc']]})
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
    /* [ //aggregate
        {
            $project: {
                kpi_value_at : {$substr: [ "$kpi_value_at", 0, 10]},
                kpi_target : 1,
                kpi_value : 1
            }
        },
        {
            $match: {
                kpi_target : 'aieta johnson',
                $and: [{kpi_value: {$gte: 1}},{kpi_value: {$lte: 2}}],
                kpi_value_at : '2017-01-04'
            }
        },
        {
            $sort: {
                updatedAt : -1     
            }
            
        }
    ] */
    console.log('sqlquery',sqlQuery);
    return new Promise((resolve,reject)=>{
      client.queryDocuments(collectionUrl,sqlQuery)
      .toArray((err,results)=>{
        if(err) return reject(err)
        resolve(results)
      })
    })
}

exports.getResultsByKpiAndTarget = (client,kpiDef,targetFullName,{dateFrom,dateTo})=>{
    targetFullName = targetFullName.toLowerCase();
    let nameKpiWithoutSpace = kpiDef.name.replace(/\s/g,"");    
    let docTypeResultKpi = 'results_kpi_'+kpiDef.tenant;
    console.log('results kpi fullname',targetFullName);
    //let sqlQuery = "SELECT * FROM c where c.documentType = '"+docTypeResultKpi+"' AND LOWER(c.kpi_target) = '"+targetFullName+"' AND (c.kpi_value_at BETWEEN '"+dateFrom+"' AND '"+dateTo+"') ORDER BY c.kpi_value_at DESC "';
    
    let query = {
        kpiName: kpiDef.name,
        kpi_target : targetFullName,
        $and: [
            {
                kpi_value_at: {$gte: dateFrom}
            },
            {
                kpi_value_at : {$lte: dateTo}
            }
        ],

        
    }
    return new Promise((resolve,reject)=>{
        client.collection('kpi_results').find(query,{sort: [['kpi_value_at','desc']]})
        .toArray((err,results)=>{
            console.log('err',err);
            if(err) return reject(err)
            resolve(results)
        })
    })
}

exports.getKpisByTargetType = (client,{tenant, targetType, enable, category = '', subcategory = ''})=>{
    //let sqlQuery = "SELECT * from c where c.tenant = '"+tenant+"' AND c.assignTo.targetType = '"+targetType+"' AND c.enable = "+enable+" ";
    var query;
    if(category){
        //sqlQuery += "AND c.belongTo.category = '"+category+"' ";
        query = {
            tenant: tenant,
            documentType: 'kpi',
            "assignTo.targetType": targetType,
            enable : true,
            "belongTo.category" : category,            
        }     

    }
    else if(subcategory){
        //sqlQuery += "AND ARRAY_CONTAINS(c.belongTo.subCategories, '"+subcategory+"') ";
        query = { 
            tenant: tenant,
            documentType: 'kpi',
            "assignTo.targetType": targetType,
            enable : true,            
            "belongTo.subCategories": {$in: [subcategory]}
        }     
    }
    else{
        query = { 
            tenant: tenant,
            documentType: 'kpi',
            "assignTo.targetType": targetType,
            enable : true            
        }     
    }
    
    return new Promise((resolve,reject)=>{
        client.collection('definitions').find(query)
        .toArray((err,results)=>{
            if(err) return reject(err)
            console.log('results kpis by target type',results);
            resolve(results)
        })
    })
}

exports.getTargetTypes = ({tenant,targetType = ''})=>{
    //let sqlQuery = 'SELECT DISTINCT c.targetType FROM c where c.documentType = "target" ';    
    var query;
    if(targetType){
        //sqlQuery += 'AND c.targetType = "'+targetType+'" ';
        query = {
            documentType : 'target',
            targetType : targetType
        }
    }
    else{
        query = {
            documentType : 'target'
        }
    }
    
    
    return new Promise((resolve,reject)=>{
        client.collection('ahf_targets').distinct("targetType",query,(err,results)=>{
            if(err) return reject(err);            
            resolve(results)
        })
        
    })
}

exports.getTargetById = (client,{tenant, targetID})=>{
    let sqlQuery = "SELECT * from c where c.documentType = 'target' AND c.id = '"+targetID+"' ";
    console.log('target d',targetID);
    
    let query = {_id: new ObjectId(targetID)}
    //5b4e50941be42e028c424ae6
    return new Promise((resolve,reject)=>{
        client.collection("ahf_targets").findOne(query)
        .then(result=>{            
            console.log('then response',result);
            resolve(result);
        })
        .catch(err=>{
            reject(err)
        })
    })
}

exports.getKpis = (enable = true)=>{
    let sqlQuery = "SELECT * from c where c.tenant = 'ahf' AND c.enable = "+enable+" ";
    /* { //find
        enable : true,
        tenant : 'AHF'
    } */
    return new Promise((resolve,reject)=>{
        client.queryDocuments(defColl,sqlQuery)
        .toArray((err,results)=>{
            if(err) return reject(err);
            resolve(results);
        })
    })
}

exports.getTargetsByTargetType = (client,targetType)=>{
    //let sqlQuery = "SELECT * from c where c.documentType = 'target' and c.targetType = '"+targetType+"' ";
    let query = {
        documentType : 'target',
        targetType: targetType
    }

    return new Promise((resolve,reject)=>{
        client.collection('ahf_targets').find(query)
        .toArray((err,results)=>{
            console.log('err',err);
            if(err) return reject(err);
            resolve(results);
        })
    })
    
}

exports.validateQuery = (query,collName)=>{       
    query.push({"$limit": 1})    
    return new Promise((resolve,reject)=>{        
       client.collection(collName).aggregate(query).toArray((err,results)=>{           
            if(err) return reject(err)
            let msg = 'Query Validated ';
            if(!results.length){
                msg += 'without results'
            }
            resolve(msg);
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

exports.getStatScoreByTarget = (client,target,{dateFrom,dateTo})=>{    
    var targetFullName = (target.FirstName+' '+target.LastName).toLowerCase();
    console.log('target full name',targetFullName)
    var sqlQuery = 'SELECT * FROM c WHERE c.documentType = "results_statscore_AHF" AND LOWER(c.recipient.targetFullName) = "'+targetFullName+'" AND (c.valueAt BETWEEN "'+dateFrom+'" AND "'+dateTo+'") ORDER BY c.valueAt DESC';     
    var query = [
        {
            $project: {
                valueAt : {$substr: [ "$valueAt", 0, 10 ]},
                targetFullName : 1,
                value: 1
            }
        },
        {
            $match: {
                $and: [
                    {targetFullName : targetFullName},{valueAt: {$gte: dateFrom}},{valueAt: {$lte: dateTo}}
                ]
            },
            
        },
        {
            $sort: {
                valueAt : -1
            }
        }
    ]
    return new Promise((resolve,reject)=>{
        client.collection('statscore_results').aggregate(query).toArray((err,results)=>{
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
    /* [ //aggregate
        {
            $project: {
                tenant : {$toLower: "$tenant"},
                targetType: {$toLower: "$assignTo.targetType"},
                kpiName : {$toLower: "$name"}
            }
        },
        {
            $match: { //params
                tenant: 'ahf',
                targetType : 'team member',
                kpiName : '# of blood draws lab / team member / hour'
            }
        }
    ] */
    return new Promise((resolve,reject)=>{
        client.queryDocuments(defColl,sqlQuery).toArray((err,results)=>{
            if(err) return reject(err)
            resolve(results[0])
        })
    })
}

exports.getTargetsById = (targetIds)=>{
    
    var sqlQuery = 'SELECT * FROM c WHERE c.documentType = "target" AND c.id IN ('+targetIds+') ';
    /* { //find
        "_id": {$in: [ObjectID("5b4e50941be42e028c424ae6")]}
    } */
    console.log('sqlquery',sqlQuery);
    var opt = {partitionKey : "target"};
    return new Promise((resolve,reject)=>{
        client.queryDocuments(collectionUrl,sqlQuery,opt).toArray((err,results)=>{
            if(err) return reject(err);
            resolve(results);
        })
    })
}

exports.getTargetsByFullname = (client,targetsFullname)=>{
    //var sqlQuery = 'select * from c where c.documentType = "target" AND LOWER(concat(c.firstName," ", c.lastName)) IN ('+targetsFullname+') ';
     var query = [ 
        {
            $project: {
                targetFullName : {
                    $toLower: {
                        $concat: ["$FirstName",' ',"$LastName"]
                    }
                },
                FirstName: 1,
                LastName : 1,
                JobTitle: 1,
                Location: 1,
                HomeDep: 1
            }
        },
        {
            $match: {
                targetFullName : {$in: targetsFullname}
            }
        }
    ]    
    return new Promise((resolve,reject)=>{
        client.collection('ahf_targets').aggregate(query).toArray((err,results)=>{
            if(err) return reject(err);
            console.log('results',results);
            resolve(results);
        })
    })
}

exports.getKpiResultsByDateAndRange = (client,tenant,kpiname,range,date,filter)=>{
    var date = date.split('T')[0];    
    var init = range[0];
    var end = range[1];
    var query;    
    if(filter){
        filter = filter.toLowerCase();        
        query =  [
            {
                $match: {
                    kpi_target : {$regex: filter}, //with filter
                    kpiName: {$eq: kpiname}
                }
            },
            {
                $sort: {
                    "kpi_value_at" : -1
                }
            },
            {
                $group: {
                    _id: {"kpi_target": "$kpi_target"},
                    lastValue : {$first : "$kpi_value"},
                    kpi_value_at: {$first: "$kpi_value_at"}
                }
            },
            {
                $match: {
                    lastValue : {$gte: init, $lte: end}
                }
            },
            {
                $sort:{
                    lastValue : -1
                }
            }
        ]
        //var sqlQuery = 'select distinct c.kpi_target, c.kpi_value, c.kpi_value_at, c.valueRate from c where c.documentType = "'+docType+'" and c.kpiName = "'+kpiname+'" and (c.kpi_value between '+init+' and '+end+') and SUBSTRING(c.kpi_value_at, 0, 10) = "'+date+'" AND CONTAINS(LOWER(c.kpi_target), "'+filter+'") ORDER BY c.kpi_value_at DESC ';
    }
    else{
        query =  [
            {
                $match: {            
                    kpiName: {$eq: kpiname}
                }
            },
            {
                $sort: {
                    "kpi_value_at" : -1
                }
            },
            {
                $group: {
                    _id: {"kpi_target": "$kpi_target"},
                    lastValue : {$first : "$kpi_value"},
                    kpi_value_at: {$first: "$kpi_value_at"}
                }
            },
            {
                $match: {
                    lastValue : {$gte: init, $lte: end}
                }
            },
            {
                $sort:{
                    lastValue : -1
                }
            }
        ]
        /* query = [ 
            {
                $project:{
                    kpi_value_at : {$substr: [ "$kpi_value_at", 0, 10 ]},
                    kpiName : 1,
                    kpi_value: 1
                }
                
            },
            {
                $match: {
                    $and: [
                        {kpiName: kpiname},
                        {kpi_value : {$gte: init}}, {kpi_value: {$lte: end}},
                        //{kpi_value_at : {$eq: date}}
                        //{kpi_target:{ $in:['adriana santos','amanda thomas'] }
                    ] 
                    
                }
                
            },
            {
                $sort: {kpi_value_at : -1}
            }
        ] */
        //var sqlQuery = 'select distinct c.kpi_target, c.kpi_value, c.kpi_value_at, c.valueRate from c where c.documentType = "'+docType+'" and c.kpiName = "'+kpiname+'" and (c.kpi_value between '+init+' and '+end+') and SUBSTRING(c.kpi_value_at, 0, 10) = "'+date+'" ORDER BY c.kpi_value_at DESC ';
    }    
    return new Promise((resolve,reject)=>{
        
        client.collection('kpi_results').aggregate(query).toArray((err,results)=>{
            if(err) return reject(err);
            console.log('results',results);
            resolve(results);
        })
    })
}

exports.getDataResutlsStatScore = (client,tenant,targetType,range,date,filter)=>{
    var init = range[0];
    var end = range[1];        
    var query;        
    if(filter){
        filter = filter.toLowerCase();
        query = [
            {
                $match: { 
                    targetFullName : {$regex: filter}
                }
            },
            {
                $project:{
                    value : 1,
                    targetFullName: 1,
                    monthYear: {$substr: [ "$valueAt", 0, 7 ]},                    
                    valueAt: 1
                }    
            },                
            {
                $sort: {
                    "monthYear" : -1
                }
            },
            {
                $group: {
                    _id: {"targetFullName": "$targetFullName"},
                    lastValue : {$first : "$value"},
                    valueAt: {$first: "$valueAt"}
                }
            },
            {
                $match: {
                    lastValue : {$gte: init, $lte: end}
                }
            },
            {
                $sort:{
                    lastValue : -1
                }
            },
            {
                $project:{
                    value : "$lastValue",
                    valueAt: 1
                }
            }
        ]
        //var sqlQuery = 'select * from c where c.documentType = "'+docType+'" AND (c["value"] BETWEEN '+init+' AND '+end+') AND SUBSTRING(c.valueAt,0,10) = "'+date+'" AND CONTAINS(LOWER(c.recipient.targetFullName), "'+filter+'") ORDER BY c.valueAt DESC ';    
    }        
    else{
        //var sqlQuery = 'select * from c where c.documentType = "'+docType+'" AND (c["value"] BETWEEN '+init+' AND '+end+') AND SUBSTRING(c.valueAt,0,10) = "'+date+'" ORDER BY c.valueAt DESC ';            
        query = [            
            {
                $project:{
                    value : 1,
                    targetFullName: 1,
                    monthYear: {$substr: [ "$valueAt", 0, 7 ]},                    
                    valueAt: 1
                }    
            },                
            {
                $sort: {
                    "monthYear" : -1
                }
            },
            {
                $group: {
                    _id: {"targetFullName": "$targetFullName"},
                    lastValue : {$first : "$value"},
                    valueAt: {$first: "$valueAt"}
                }
            },            
            {
                $match: {
                    lastValue : {$gte: init, $lte: end}
                }
            },            
            {
                $sort:{
                    lastValue : -1
                }
            },
            {
                $project:{
                    value : "$lastValue",
                    valueAt: 1
                }
            }
        ]
    }           
    console.log('client',JSON.stringify(query));
    return new Promise((resolve,reject)=>{         
        client.collection('statscore_results').aggregate(query).toArray((err,results)=>{
            console.log('err',err);
            if(err) return reject(err);
            console.log('results',results);
            resolve(results);
        })
    })
}
exports.getStatScoreCompany = (client)=>{
    /* let sqlQuery = `SELECT top 10 * FROM c 
                    WHERE c.documentType = 'results_statscore_company_AHF' 
                    ORDER BY c.valueAt DESC `;      */
    let query = {
        documentType : 'results_statscore_company_AHF'
    }
    return new Promise((resolve,reject)=>{
        client.collection('statscore_results').find(query,{sort: [['valueAt','desc']]}).limit(10).toArray((err,results)=>{
            if(err) return reject(err);

            resolve(results);
        })
    })
}
exports.getCategories = ()=>{
    let query = {
        documentType : 'category'        
    }
    return new Promise((resolve,reject)=>{
        client.collection('definitions').find(query).toArray((err,results)=>{
            if(err) return reject(err);
            resolve(results)
        })
    })
    
}