const { graphiqlAzureFunctions } = require('apollo-server-azure-functions');

module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    let query = `
        {
            rands {
                id
                rand
            }
        }
    `;

    // End point points to the path to the GraphQL API function
    graphiqlAzureFunctions({endpointURL: 'http://localhost:7071/api/testQuery', query })(
        context,
        req,
    );
};