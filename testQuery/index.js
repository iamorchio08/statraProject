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
      console.log('context',context);
      return db.getTargetByTargetType(args)
    },
    kpis(obj, args, context, info){
      return db.getKpisByTargetType(args);
    }    
  },
  Target: {
    kpis(obj,args,context,info){            
      return db.getKpiByTarget(obj.id,context.args.kpiName) //byIdTarget and kpiName     
    }
  },
  Kpi:{
    name(obj,args,context,info){      
      return;            
    },
    results(obj,args,context,info){      
      //dado un kpi , obtener los resultados en base al documentType results_tenant_kpiname
      return db.getResultsBykpi(obj,context.args.range,context.args.date)
    }
  },
  
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


