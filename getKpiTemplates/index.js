const mockedKpiTemplates = require('./api/kpiTemplates');
module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
    var params = req.body;
    if(req.query.test){ //mocked data
        var res = getKpiTemplates(params);    
        return context.done(null,{res:res});
    }
    context.done(null,{res: {body:'Insert test query parameter'}});
};

const getKpiTemplates = ()=>{
    var res = {
        body : mockedKpiTemplates
    }
    return res;
}