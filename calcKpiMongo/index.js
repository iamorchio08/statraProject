const mongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017/local';
const db = 'local';

mongoClient.connect(url,{useNewUrlParser:true})
    .then(client=>{
                
        /* getKpiByDataset(client)
        .then(response=>{
            client.db().collection('lab_draws').aggregate(test).toArray((err,results)=>{
                //console.log('ressults aggregate',results);
            })
        })         */

    })
    .catch(err=>{
        console.log('err',err);
})

function getKpiByDataset(client,dataset){
    return new Promise((resolve,reject)=>{
        client.db().collection('definitions').find({datasets: ['dataset_lab_test']}).toArray((err,results)=>{
            if(err) return reject(err);
            resolve(results);
        })               
    })
    
}