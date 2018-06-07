const { GraphQLScalarType }  = require('graphql');
exports.myCustomScalarType = new GraphQLScalarType({
    name: 'Date',
    description: 'Description of my custom scalar type Date',
    serialize(value) {                
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
    }

    type StatraScoreResult {
        statValue : Int
        statValueAt : Date
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
        name : String!
        targets: [Target]
    }

    type DataEventsResult {
        value: Int!
        valueAt: Date
        updatedAt: Date
    }

    type Target {
        firstName: String
        lastName: String
        jobTitle: String
        homeDepartment: String
        officePhone: String
        location: String
        targetType: TargetType
        statraScore: StatraScoreResult
        kpis: [Kpi]
        dataEvents: [DataEvent]        
        tenant: Tenant
    }

    type Kpi {
        name: String!
        weight: Int        
        datasources: [String]
        results: [KpiResult]
    }
    
    type KpiResult {
        kpi_value: Int!
        kpi_value_at: String
        updatedAt: Date
    }

    type Query {
        targetsByTargetType(targetType: String): [Target]
        targets: [Target]
        tenant: Tenant
        targetTypes: [TargetType]
        kpis: [Kpi]         
    }
`;
