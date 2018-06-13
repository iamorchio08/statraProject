const { graphqlAzureFunctions } = require('apollo-server-azure-functions');
const { makeExecutableSchema, addMockFunctionsToSchema } = require('graphql-tools');
const {typeDefs, myCustomScalarType } = require('./typeDefs');
var db = require('../db/lib');

const resolverFunctions = {
  Date : myCustomScalarType,
  Query : {
    getTargets(obj, args, context, info) {
      context.args = args; //to access in sub-resolvers
      context.args.date = new Date().toISOString();      
      return db.getTargetByTargetType(args)
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
      console.log('kpis');
      if(context.args.hasOwnProperty('kpiName')){
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
    }
  },
  Kpi:{
    name(obj,args,context,info){
      console.log('name in KPI',obj);      
      //if(obj.hasOwnProperty('kpi')) return obj.kpi.name
      return 
    },
    results(obj,args,context,info){
      console.log('results',obj);
      let fullName = context.firstName+' '+context.lastName;
      if(context.args.hasOwnProperty('range') && context.args.hasOwnProperty('kpiName')){
        console.log('vengo por range');
        //dado un kpi , obtener los resultados en base al documentType results_tenant_kpiname , range y date
        return db.getResultsBykpiRangeValue(obj,context.args.range,context.args.date)
      }        
      return db.getResultsByKpiAndTarget(obj,fullName);
    }
  },
  TargetType:{    
    name(obj,args,context,info){
      console.log('name field',obj);
      return obj.targetType;
    },
  },
  KpiResult:{
    kpi_value(obj,args,context,info){
      console.log('kpi value',obj.kpi_value);
      /*
      if(context.hasOwnProperty('isTarget')){
        console.log('obj en kpi results',obj);
        return obj.filter(data => data.kpi_target == context.firstName+' '+context.lastName)
      } */     
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


