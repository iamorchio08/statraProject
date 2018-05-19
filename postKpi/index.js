const myArray =[1,2,3,4];
module.exports = function (context, req) {
    context.log('JavaScript HTTP function for create a kpi.');
    var params = req.body;
    var ok = validateParams(params);
    console.log('context',context);
    
    if(ok){
        //insert kpi definition into master collection of kpis
        //return response with kpi definition
        //params.id = 1; //simulate generated id after kpi is inserted into collection
        var endpoint = getEndpointForKpi();
        context.done(null,{res: {statusCode: 201,body : endpoint, status: 'Success created'}});
    }
       
    
};

const validateParams = (data)=> {
    //validate params of new kpi 
    return true;
}

const getEndpointForKpi = ()=>{
    
    var rand = myArray[Math.floor(Math.random() * myArray.length)];
    var endpoint = '/api/kpis/'+rand+'/metadata';
    return endpoint;
}
