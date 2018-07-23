const validate = require('jsonschema').validate;
const kpiSchema = require('./kpiSchema');
const db = require('../db/libMongo');
module.exports = function (context, req) {
    console.log('start');
    var validation = validateParams(req.body);       
    if(!req.query.test){
        if(validation.ok){            
            createKpi(req.body)
            .then(response=>{
                console.log('response create kpi',response);
                var endpoint = getRealEndpointForKpi(response.id);                
                context.res= {
                    status: 201,
                    body: endpoint
                }                
                return context.done();
            })
            .catch(err=>{
                console.log('error',err);
                context.res ={ 
                    status : 400,
                    statusText : 'Error',
                    body : err
                };                       
                return context.done();
            })                                                    
        }
        else{
            context.res = {
                status : 400,
                statusText : 'Error',
                body: {errors : validation.body}
            }
            return context.done();        
        }          
    }
    else{ //mock
        var endpoint = getEndpointForKpi();                                        
        context.done(null,{res: {statusCode: 201,body : endpoint, status: 'Success created'}});  
    }    
};

function createKpi(params){
    return db.connectDB()
    .then((client)=> {return validateRepeat(client,params.name,params.tenant)})
    .then(client=>{        
        return newKpi(client,params)
    })
    .catch((err)=>{
        console.log('err create kpi',err);
        return Promise.reject(err);
    })    
}

function validateRepeat(client,kpiName,tenant){
    return new Promise((resolve,reject)=>{
        let query = {
            name : kpiName,
            tenant: tenant
        }
        client.collection('definitions').find(query).toArray((err,results)=>{
            if(err) return reject(err);
            if(results.length) return reject({err: "Kpi already exists"})
            resolve(client);
        })
    })
}

function newKpi(client,document) {    
    document.documentType = 'kpi';        
    return new Promise((resolve, reject) => {
        client.collection('definitions').insert(document,{w:1},(err,result)=>{            
            if (err) reject(err)
            else resolve({id : result.insertedIds["0"]})
        })                 
    });
};



const validateParams = (data)=> {        
    var validation = validate(data,kpiSchema);
    var res= {};
    if(validation.errors.length){
        res.ok = false;
        res.errors = validation.errors;
        res.status = 400;
        res.body = validation.errors;
    }
    else{
        res.ok = true;
    }
    return res;
}

const getEndpointForKpi = (id)=>{
    
    var rand = myArray[Math.floor(Math.random() * myArray.length)];
    var endpoint = '/api/kpis/'+rand+'/metadata';
    return endpoint;
}

const getRealEndpointForKpi = (id)=>{
    var endpoint = 'https://statrafndev.azurewebsites.net/api/kpis/'+id+'/metadata';
    return endpoint;
}
