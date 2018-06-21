const { GraphQLScalarType }  = require('graphql');
exports.myCustomScalarType = new GraphQLScalarType({
    name: 'Date',
    description: 'Description of my custom scalar type Date',
    serialize(value) {  
        console.log('date')              ;
        return value.toISOString()
    },
    parseValue(value) {                
        return new Date(value)
    },
    parseLiteral(ast) {        
        if (ast.kind === Kind.INT) {
            return parseInt(ast.value, 10); // ast value is always in string format
        }
        return new Date();                
    }
});

exports.typeDefs = `
    scalar Date

    type Tenant {
        name : String!
        statraScore: [StatraScoreResult]
        dataEvents: [DataEvent]
        targetTypes: [TargetType]
        insights: [Insight]
    }

    type StatraScoreResult {
        value : Float
        valueAt : String
    }

    type DataEvent {
        name : String!        
        results: [DataEventsResult]
        goals : Goal
    }

    type Goal {
        min: Int
        max: Int
        direction: String
        value: [Int!]!        
    }

    type TargetType {
        name : String
        targets: [Target]
    }

    type Insight {
        contents : String        
    }
    
    type DataEventsResult {
        value: Int!
        valueAt: Date
        updatedAt: Date
    }

    type Target {
        id: String
        firstName: String
        lastName: String
        jobTitle: String
        homeDepartment: String
        officePhone: String
        location: String
        targetType: TargetType
        statraScoreResults(dateFrom : String, dateTo : String): [StatraScoreResult]
        kpis: [Kpi]
        dataEvents: [DataEvent]        
        tenant: Tenant
        cursor : String
    }

    type Kpi {
        name: String!
        weight: String!        
        dataset: [Dataset]
        results(dateFrom : String, dateTo: String): [KpiResult]
        goals : Goal
        frequency : Frequency
        description : String
        belongTo : BelongTo
        unit : String
        enable : Boolean
        createdAt : Date    
    }
    
    type Dataset {
        name : String
        datasource : Datasource
    }
    
    type Datasource{
        name : String!
        avatar : String
    }
    
    type Frequency{
        value : Int
        label : String
        unit : String
        valueUnit : Int
    }
    
    type BelongTo{
        category : String!
        subCategories : [String]
    }
    
    type KpiResult {
        kpi_value: Int!
        kpi_value_at: String
        updatedAt: Date
        kpi_target: String
        valueRate : Float
    }

    type TargetResult {
        targets(prevCursor: String, nextCursor : String) : [Target]
        nextCursor : String        
        prevCursor : String
    }

    type Query {
        getTargets(tenant: String!, targetType: String!, kpiName: String!,range: [Int!]!, date: String!, filter : String): TargetResult
        getTarget(tenant: String!, targetID: String!): Target
        kpis(tenant: String! , targetType : String, enable: Boolean!, category : String , subcategory : String): [Kpi]
        targetTypes(tenant : String!, targetType: String): [TargetType]
        getCompany(tenant: String!) : Tenant                        
    }
`;
