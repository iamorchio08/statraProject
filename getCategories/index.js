const categories = require('./api/categories');
module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
    if(req.query.test){
        var data = getAllCategories();
        var res = {
            body : data,
            statusCode : 200,
            status : 'success'
        };
        return context.done(null,{res: res});
    }
    context.done(null,{res:{body : 'Real Data'}});
};

const getAllCategories = ()=>{
    return categories;
}