var db = require('../db/libMongo');

module.exports = function (context, req) {    
    var query,collName;        
    if ((req.body.query && typeof req.body.query == 'object') && (req.body.collName && typeof req.body.collName == 'string') ){ //recibo query
                
        collName = req.body.collName; 
        query = req.body.query;       
        validateQuery(query,collName)
        .then(response=>{            
            context.res = {
                body : response
            }            
            context.done();
        })
        .catch(err=>{            
            context.res = {
                body : err,
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

function validateQuery(query,collName){
   return db.connectDB()
    .then(()=> db.validateQuery(query,collName))
    .catch(err=>{
        return Promise.reject(err)
    })
}
