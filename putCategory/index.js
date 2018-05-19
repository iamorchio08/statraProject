const mockedCategories = require('./api/categories');
module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
    var categoryId = context.bindingData.categoryId;
    var params = req.body;
    if(!req.query.test) return context.done(null,{res: {body: 'Insert Test parameter in query'}})

    if(categoryId && params){
        // busco la categoria y si existe le inserto las subcategorias
        var category = getCategoryById(categoryId);
        if(category){
            var res = updateCategory(params,category);
            return context.done(null,{res: res});
        }        
        context.done(null,{res: {status:404,body: 'Category not found'}});
        
    }
    context.done(null,{res: {status:400, body: 'Invalid params'}})
};

const getCategoryById = (id)=>{
    return mockedCategories[id-1];
}

const updateCategory = (params,category)=>{
    var res = {};
    //validar que sea array las subcategorias;    
    category.subCategories = params;
    res.body = category;
    return res;
}