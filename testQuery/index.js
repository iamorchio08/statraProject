const { graphqlAzureFunctions } = require('apollo-server-azure-functions');
const { makeExecutableSchema, addMockFunctionsToSchema } = require('graphql-tools');
const {typeDefs, myCustomScalarType } = require('./typeDefs');
var db = require('../db/lib');
const limit = 10;
const resolverFunctions = {
  Date : myCustomScalarType,
  Query : {
    getTargets(obj, args, context, info) {
      context.args = args; //to access in sub-resolvers
      //context.args.date = new Date().toISOString();            
      //return db.getTargetByTargetType(args)
      if(args.kpiName.toLowerCase() == 'stat score'){
        return getDataResultsStatraScore(args.tenant,args.targetType,args.range,args.date,args.filter)
        .then(response=>{
          context.statscore_results = response;
          context.isGetTargets = true;
          var strTargets = getStrOfTargetsFullname(response)
          if(strTargets)
            return db.getTargetsByFullname(strTargets);          
          return [];
        })
      }
      return getDataResults(args).then(response=>{        
        context.results_kpis = response;
        var strTargets = getStrOfTargetsFullname(response,true);
        if(strTargets)
          return db.getTargetsByFullname(strTargets)
        return [];
      })

    },
    kpis(obj, args, context, info){
      return db.getKpisByTargetType(args);
    },
    targetTypes(obj, args, context, info){
      return db.getTargetTypes(args);
    },
    getTarget(obj, args, context, info){
      context.args = args;
      context.isTarget = true;
      return db.getTargetById(args);
    }    
  },
  Target: {
    kpis(obj,args,context,info){      
      if(context.args.hasOwnProperty('kpiName')){
        console.log('by aca')
        return db.getKpiByTargetAndKpiname(obj,context.args.kpiName) //byIdTarget and kpiName     
      }
      //search by targetID
      return db.getKpiByTarget(context.args.targetID);
      
    },
    firstName(obj,args,context,info){      
      context.firstName = obj.firstName.trim();            
    },
    lastName(obj,args,context,info){      
      context.lastName = obj.lastName.trim();
    },
    statraScoreResults(obj,args,context,info){
      if(context.hasOwnProperty('isGetTargets')){
        var fullName = (obj.firstName+' '+obj.lastName).toLowerCase();              
        var data = context.statscore_results.find(data => data.recipient.targetFullName.toLowerCase() == fullName )      
        return [data];
      }
      if(args.dateFrom && args.dateTo){
        return db.getStatScoreByTarget(obj,args); //is by getTarget
      }      
      return new Error('Date is required')
    }
  },
  Kpi:{
    name(obj,args,context,info){            
      //if(obj.hasOwnProperty('kpi')) return obj.kpi.name
      return 
    },
    results(obj,args,context,info){      
      let fullName = context.firstName+' '+context.lastName;      
      var data =  context.results_kpis.find(data=> data.kpi_target.toLowerCase() == obj.kpi.targetFullname.toLowerCase() )
      return [data];
      if(context.args.hasOwnProperty('range') && context.args.hasOwnProperty('kpiName')){        
        //dado un kpi , obtener los resultados en base al documentType results_tenant_kpiname , range y date
        return db.getResultsBykpiRangeValue(obj,context.args.range,context.args.date)
      }              
      return db.getResultsByKpiAndTarget(obj,fullName,args);
    },
    belongTo(obj,args,context,info){
      
    }
  },
  TargetType:{    
    name({targetType},args,context,info){      
      return targetType;
    },
    targets({targetType},args,context,info){      
      return db.getTargetsByTargetType(targetType);
    }
  },
  KpiResult:{
    kpi_value(obj,args,context,info){
      console.log('kpi value',obj.kpi_value);      
    }
  },
  TargetResult:{
    targets(results,args,context,info){      
      if(!results.length) return [];     
      if(args.hasOwnProperty('nextCursor')){        
        context.prevCursor = results[results.findIndex(data=> data.id == args.nextCursor)- limit+1].id;        
        var cursor = args.nextCursor        
        var index = results.findIndex(data => data.id == cursor)+1;
      }
      else if(args.hasOwnProperty('prevCursor')){
        context.nextCursor = results[results.findIndex(data=> data.id == args.prevCursor)+ limit-1 ].id;
        context.prevCursor = ( typeof results[results.findIndex(data=> data.id == args.prevCursor)- limit ] == 'undefined')? '0' : results[results.findIndex(data=> data.id == args.prevCursor)- limit ].id;
        var cursor = args.prevCursor;      
        var index = results.findIndex(data => data.id == cursor);          
      }      
      else{ // no recibo cursor ,son los primeros resultados
        cursor = results[results.length-1].id;
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
      

      if(obj.results.length){
        if(args.hasOwnProperty('nextCursor') || Object.keys(args).length == 0){          
          //context.nextCursor = obj.results[obj.results.length-1].id; //next cursor
          //si hay un elemento màs despues del ultimo elemento de obj.results , calculo nextcursor
          var lastId = obj.results[obj.results.length-1].id; //lastId
          var nextId = results.findIndex(data => data.id == lastId) +1;
          if(typeof results[nextId] == 'undefined') context.nextCursor = '0';
          else
            context.nextCursor = obj.results[obj.results.length-1].id          
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

/*
const typeDefs = `
  type Random {
    id: Int!
    rand: String
  }

  type Query {
    rands: [Random]
    rand(id: Int!): Random
  }
`;

const rands = [{ id: 1, rand: 'random' }, { id: 2, rand: 'modnar' }];
const resolvers = {
    Query: {
      rands: () => rands,
      rand: (_, { id }) => rands.find(rand => rand.id === id),
    },
  };

/*const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
});
*/

module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
    graphqlAzureFunctions({ schema })(context, req);            
};

/*function getTargetsByKpiNameAndTenant({tenant,targetType,kpiName,range,date}){
  db.getKpiByTenantAndNameAndTargetType(tenant,targetType,kpiName)
  .then(response=>{
      var strIds = '';
      response.assignTo.targets.forEach((data,index)=>{
        if(index != response.assignTo.targets.length-1)
          strIds += '"'+data.targetID+'",'
        else
          strIds += '"'+data.targetID+'"'
      })            
      return db.getTargetsById(strIds);      
  })  
}
*/
function getDataResults({tenant,targetType,kpiName,range,date,filter=''}){
  
  return new Promise((resolve,reject)=>{
    return db.getKpiResultsByDateAndRange(tenant,kpiName,range,date,filter)
    .then(response=>{
      console.log('length before filter',response.length);
          
      var data = response.filter((elem,index,array) =>{ //remove repeat objects targets
        return index == array.findIndex(data=> data.kpi_target == elem.kpi_target) 
      });

      resolve(data);
    })
  })
  
}

function getStrOfTargetsFullname(result_targets, kpi=false){
  var strTargets = '';
  if(kpi){
    result_targets.forEach((data,index)=>{
      if(index != result_targets.length-1)
        strTargets += '"'+data.kpi_target+'",'
      else
        strTargets += '"'+data.kpi_target+'"';
        
    })
  }
  else{
    result_targets.forEach((data,index)=>{
      if(index != result_targets.length-1)
        strTargets += '"'+data.recipient.targetFullName+'",'
      else
        strTargets += '"'+data.recipient.targetFullName+'"';
    })
  }  
  return strTargets.toLowerCase();
}

function getDataResultsStatraScore(tenant,targetType,range,date,filter = ''){
  return new Promise((resolve,reject)=>{
    db.getDataResutlsStatScore(tenant,targetType,range,date,filter)
    .then(response=>{
      console.log('response cra',response.length)
      
      var data = response.filter((elem,index,array) =>{ //remove repeat objects targets
        return index == array.findIndex(data=> data.recipient.targetFullName == elem.recipient.targetFullName) 
      });
      resolve(data)
    })
  })
  
}
//select c.kpi_target,c.kpi_value , c.kpi_value_at from c where c.documentType = 'results_kpi_ahf' AND c.kpi_name = 'nombrekpi' AND (c.kpi_value between rango1 and rango2 ) AND c.kpi_value_at = date ORDER BY c.kpi_value_at DESC
//obtengo estos resultados y luego busco los targets asociados a esos resultados
//por cada elemento del array
  //busco