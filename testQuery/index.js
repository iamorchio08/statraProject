const { graphqlAzureFunctions } = require('apollo-server-azure-functions');
const { makeExecutableSchema, addMockFunctionsToSchema } = require('graphql-tools');
const {typeDefs, myCustomScalarType } = require('./typeDefs');
const limit = 20;
const mongoClient = require('mongodb').MongoClient;
//const uri = "mongodb://localhost:27017/local";
//const uri = 'mongodb+srv://StatraScoreAdmin:rEfccW0Vu4ATWXPr@statrascoretest-ucjts.azure.mongodb.net';
var db = require('../db/libMongo');
var client;
const resolverFunctions = {
  Date : myCustomScalarType,
  Query : {
    getTargets(obj, args, context, info) {
      context.args = args; //to access in sub-resolvers
      //context.args.date = new Date().toISOString();            
      //return db.getTargetByTargetType(args)
      if(args.kpiName.toLowerCase() == 'statscore'){          
        return getDataResultsStatraScore(client,args.tenant,args.targetType,args.range,args.date,args.filter)
        .then(response=>{
          context.statscore_results = response;
          context.isGetTargets = true;
          var strTargets = getStrOfTargetsFullname(response)
          if(strTargets.length)
            return db.getTargetsByFullname(client,strTargets);          
          return [];
        })
      }
      return getDataResults(client,args).then(response=>{        
        context.results_kpis = response;
        var strTargets = getStrOfTargetsFullname(response,true);
        if(strTargets)
          return db.getTargetsByFullname(client,strTargets)
        return [];
      })

    },
    kpis(obj, args, context, info){
      return db.getKpisByTargetType(client,args);
    },
    targetTypes(obj, args, context, info){
      return db.getTargetTypes(args);
    },
    getTarget(obj, args, context, info){
      context.args = args;
      context.isTarget = true;
      return db.getTargetById(client,args);
    },
    getCompany(obj,args,context,info){
      return {name : args.tenant};
    },
    getCategories(obj,args,context,info){
      return db.getCategories();
    }    
  },
  Target: {
    kpis(obj,args,context,info){      
      if(context.args.hasOwnProperty('kpiName')){        
        return db.getKpiByTargetAndKpiname(client,obj,context.args.kpiName) //byIdTarget and kpiName     
      }
      //search by targetID
      return db.getKpiByTarget(client,context.args.targetID);
      
    },
    FirstName(obj,args,context,info){           
        context.FirstName = obj.FirstName.trim();                  
    },
    LastName(obj,args,context,info){            
        context.LastName = obj.LastName.trim()
    },
    statraScoreResults(obj,args,context,info){
      if(context.hasOwnProperty('isGetTargets')){
        var fullName = (obj.FirstName+' '+obj.LastName).toLowerCase(); 
        console.log('fullname',fullName);       
        var data = context.statscore_results.find(data => data._id.targetFullName.toLowerCase() == fullName )      
        console.log('data',data);
        return [data];
      }
      if(args.dateFrom && args.dateTo){
        return db.getStatScoreByTarget(client,obj,args); //is by getTarget
      }      
      return new Error('Date is required')
    },
    id(obj,args,context,info){
        return obj._id;
    }
    /* location(obj){
      //return obj.Location;
    },
    homeDepartment(obj){
      //return obj.HomeDep;
    },
    jobTitle(obj){
      //return obj.JobTitle
    } */
  },
  Kpi:{
    name(obj,args,context,info){                  
      //
    },
    results(obj,args,context,info){      
      let fullName = context.FirstName+' '+context.LastName;      
      
      if(context.args.hasOwnProperty('range') && context.args.hasOwnProperty('kpiName')){        
        //console.log('obj',obj);
        var data =  context.results_kpis.find(data=> data._id.kpi_target.toLowerCase() == obj.targetFullName.toLowerCase() )
        return [data];
        //dado un kpi , obtener los resultados en base al documentType results_tenant_kpiname , range y date
        //return db.getResultsBykpiRangeValue(obj,context.args.range,context.args.date)
      }              
      return db.getResultsByKpiAndTarget(client,obj,fullName,args);
    },
    belongTo(obj,args,context,info){
      
    }
  },
  TargetType:{    
    name(targetType,args,context,info){      
      console.log('targetype',targetType);
      return targetType;
    },
    targets(targetType,args,context,info){      
      return db.getTargetsByTargetType(client,targetType);
    }
  },
  KpiResult:{
    kpi_value(obj,args,context,info){            
      return obj.lastValue;
    }
  },
  TargetResult:{
    targets(results,args,context,info){
    //console.log('results'.results);      
      if(!results.length) return [];     
      if(args.hasOwnProperty('nextCursor')){        
        context.prevCursor = results[results.findIndex(data=> data._id == args.nextCursor)- limit+1]._id;        
        var cursor = args.nextCursor        
        var index = results.findIndex(data => data._id == cursor)+1;
      }
      else if(args.hasOwnProperty('prevCursor')){
        context.nextCursor = results[results.findIndex(data=> data._id == args.prevCursor)+ limit-1 ]._id;
        context.prevCursor = ( typeof results[results.findIndex(data=> data._id == args.prevCursor)- limit ] == 'undefined')? '0' : results[results.findIndex(data=> data._id == args.prevCursor)- limit ]._id;
        var cursor = args.prevCursor;      
        var index = results.findIndex(data => data._id == cursor);          
      }      
      else{ // no recibo cursor ,son los primeros resultados
        cursor = results[results.length-1]._id;
        context.prevCursor = '0';
        var index = 0;
      }      
      if(context.prevCursor == '0' && index > 0){
        var obj = {
          results : results.slice(0,index)
        }
      }
      else{
        var obj = {
          results : results.slice(index, index + limit)      
        }
      }
      //console.log('obj,results',obj.results)

      if(obj.results.length){
        if(args.hasOwnProperty('nextCursor') || Object.keys(args).length == 0){          
          //context.nextCursor = obj.results[obj.results.length-1].id; //next cursor
          //si hay un elemento màs despues del ultimo elemento de obj.results , calculo nextcursor
          var lastId = obj.results[obj.results.length-1]._id; //lastId
          var nextId = results.findIndex(data => data._id == lastId) +1;
          if(typeof results[nextId] == 'undefined') context.nextCursor = '0';
          else
            context.nextCursor = obj.results[obj.results.length-1]._id          
        }
        return obj.results        
      }
      context.nextCursor = '0';
      return [];      
    },
    prevCursor(obj,args,context,info){
      return context.prevCursor;
    },
    nextCursor(obj,args,context,info){
      return context.nextCursor;
    }
  },
  Tenant:{
    statraScore(obj){
      return db.getStatScoreCompany(client)
    },
  }
}

const schema = makeExecutableSchema({ typeDefs: typeDefs ,resolvers : resolverFunctions});

// Add mocks, modifies schema in place
addMockFunctionsToSchema({ 
  schema,
  mocks: {
    Date: () => {
        return new Date()
    },
    Int: ()=>{
      return Math.floor(Math.random() * (1000-1) + 1)
    }
  },
  preserveResolvers : true
 });
 

module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
    db.connectDB()
    .then(()=>{
      graphqlAzureFunctions({ schema })(context, req);
    })
    .catch(err=>{
      return context.done(400,{res: 'Cannot connect'});
    })
    /* if(client == null){
        mongoClient.connect(uri,{useNewUrlParser: true},(err,client_)=>{
            if(err){
              console.log('err',err);
              return context.done(400,{res: 'Cannot connect'});
            } 
            client = client_.db('statrascore_demo');
            
            graphqlAzureFunctions({ schema })(context, req);            
        })
    }
    else{
        graphqlAzureFunctions({ schema })(context, req);            
    } */
    
    
};


function getDataResults(client,{tenant,targetType,kpiName,range,date,filter=''}){  
  return new Promise((resolve,reject)=>{
    return db.getKpiResultsByDateAndRange(client,tenant,kpiName,range,date,filter)
    .then(response=>{
      //console.log('length before filter',response.length);
          
      /* var data = response.filter((elem,index,array) =>{ //remove repeat objects targets
        return index == array.findIndex(data=> data.kpi_target == elem.kpi_target) 
      }); */

      resolve(response);
    })
  })
  
}

function getStrOfTargetsFullname(result_targets, kpi=false){
  var strTargets = '';
  var array_targets = [];
  if(kpi){
    result_targets.forEach((data,index)=>{
      array_targets.push(data._id.kpi_target.toLowerCase())
      /* if(index != result_targets.length-1)
        strTargets += '"'+data.kpi_target+'",'
      else
        strTargets += '"'+data.kpi_target+'"'; */
        
    })
  }
  else{
    result_targets.forEach((data,index)=>{        
        array_targets.push(data._id.targetFullName.toLowerCase());
      /* if(index != result_targets.length-1)
        strTargets += '"'+data._id.targetFullName+'",'
      else
        strTargets += '"'+data._id.targetFullName+'"'; */
    })
  }  
  //console.log('targets',strTargets);
  //return strTargets.toLowerCase();
  return array_targets;
}

function getDataResultsStatraScore(client,tenant,targetType,range,date,filter = ''){
  return new Promise((resolve,reject)=>{
    db.getDataResutlsStatScore(client,tenant,targetType,range,date,filter)
    .then(response=>{
      //console.log('response cra',response)
      
      /* var data = response.filter((elem,index,array) =>{ //remove repeat objects targets
        return index == array.findIndex(data=> data.recipient.targetFullName == elem.recipient.targetFullName) 
      }); */
      resolve(response)
    })
  })
  
}
//select c.kpi_target,c.kpi_value , c.kpi_value_at from c where c.documentType = 'results_kpi_ahf' AND c.kpi_name = 'nombrekpi' AND (c.kpi_value between rango1 and rango2 ) AND c.kpi_value_at = date ORDER BY c.kpi_value_at DESC
//obtengo estos resultados y luego busco los targets asociados a esos resultados
//por cada elemento del array
  //busco