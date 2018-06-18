var db = require('../db/lib');

module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    if (req.query.formula ) { //recibo query
        let sqlQuery = req.query.formula;
        db.validateQuery(sqlQuery)
        .then(response=>{
            context.res = {
                body : 'Query validated'
            }            
            context.done();
        })
        .catch(err=>{
            console.log('err test' , err['body']);

            context.res = {
                body : err['body'],
                status : err.code
            }
            context.done();
            
        })
    }
    else {
        context.res = {
            body : 'Query Required'
        }
        context.done();
    }
    
};