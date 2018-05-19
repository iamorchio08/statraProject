const mockTargetTypes = require('./api/targetTypes');

module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
    var targetTypeId = context.bindingData.targetTypeId;
    if(req.query.test){
        if(targetTypeId){
            var res = getTargetTypeById(targetTypeId);
           return context.done(null,{res: res});
        }
        var res = { status : 'Error', statusCode : 400, body : 'Target type is required'};
        return context.done(null,{res: res});
    }
    context.done();
};

const getTargetTypeById = (targetTypeId)=>{
    var res = {};
    if(typeof mockTargetTypes[targetTypeId-1] != 'undefined'){
        res.body = mockTargetTypes[targetTypeId-1]
        res.status = 'success';
        res.statusCode = 200;
    }
    else{
        res.body = '';
        res.status = 'Error not found';
        res.statusCode = 404;
    }
    return res;
}