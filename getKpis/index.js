var mockKpis = require('./api/mockkpis');
module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
    // could receive category filters
    var params = req.body;    
    if(req.query.test){ //mocked data
        var res = getKpis();    
        return context.done(null,{res:res});
    }
    context.done();
};

const getKpis = ()=>{
    var res = {
        body : mockKpis
    }
    return res;
}