const mockTargetTypes = require('./api/targetTypes');

module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
    var res = {};
    if (req.query.test){
         res.body = getAllTargetTypes();
         return context.done(null,{res:res});
    }
    
    context.done();
};

const getAllTargetTypes = ()=>{
    return mockTargetTypes;
}