var kpiMetadata = require('./api/kpimetadata');

module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
    var kpiId = parseInt(context.bindingData.id);
    var isMockedData = context.bindingData.test;
    var res = {};
    if(!kpiId) return context.done(null,{res: { status: 400, body: 'Kpi id is required!' }})
    
    if(isMockedData){
        res = getKpiMetadataById(kpiId);
        console.log('res',res);
        context.done(null,{res: res});
    }
    
};

var getKpiMetadataById = (id)=>{
    let res = {};
    if(typeof kpiMetadata[id] == 'undefined'){
        res.body = 'Metadata for kpi not found ';
        res.status = 400;
    }
    else{
        res.body = kpiMetadata[id];
        res.status = 200;
    }
    return res;
}