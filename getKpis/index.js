var mockKpis = require('./api/mockkpis');
var db = require('../db/lib');

module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
    // could receive category filters
    var params = req.body;    
    if(req.query.test){ //mocked data
        var res = getKpis();    
        return context.done(null,{res:res});
    }
    else{
        db.getKpis()
        .then(response=>{
            context.res = {
                body : response
            };
            return context.done()
        })
        .catch(err=>{
            context.res ={
                body : err,
                status: 400
            }
            return context.done();
        })        
    }    
};

const getKpis = ()=>{
    var res = {
        body : mockKpis
    }
    return res;
}