const myArray =[1,2,3,4];
module.exports = function (context, req) {
    context.log('JavaScript HTTP function for create a kpi template.');
    var params = req.body;
    var ok = validateParams(params);
        
    if(ok && req.query.test){                
        //params.id = 1; //simulate generated id after kpi is inserted into collection
        var endpoint = getEndpointForKpiTemplate();
        return context.done(null,{res: {statusCode: 201,body : endpoint, status: 'Success created'}});
    }

    context.done(null,{res: {body:'Insert test query parameter'}});               
};

const validateParams = (data)=> {
    //validate params of new kpi 
    return true;
}

const getEndpointForKpiTemplate = ()=>{
    
    var rand = myArray[Math.floor(Math.random() * myArray.length)];
    var endpoint = '/api/kpis/templates/'+rand;
    return endpoint;
}
