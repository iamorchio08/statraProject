const kpiResults = require('./api/kpiresults');

module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
    var kpiId = parseInt(context.bindingData.id);
    var useMockedData = context.bindingData.test;
    
    if(!kpiId) return context.done(null,{ status: 400, body : 'Kpi required' })
    
    if(useMockedData){
        var res = getKpiById(kpiId);        
        context.done(null,{ res: res });        
    }
    


   
    context.done();
};

var getKpiById = (id)=> {
    var res = {};
    if(typeof kpiResults[id] == 'undefined'){
        res.body = 'Result for kpi: '+ id + 'is empty';
        res.status = 400 
    }
    else{
        res.body = kpiResults[id]
    }
    return res;
    

}
