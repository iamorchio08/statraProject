module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
    var params = req.body;
    console.log('params',params);
    if(params.name){
        //create a new ctegory and return the success
        var res = {
            body : 'category'+' '+params.name+' created',
            status: 'success',
            statusCode : 201
        }        
    }
    else{
        var res = {
            body: 'category name is required',
            status : 'error',
            statusCode : 400
        };
        
    }
    context.done(null,{ res : res});
};