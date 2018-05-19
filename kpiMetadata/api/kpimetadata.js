const kpiResults = [
    { //definition for new kpi 
        //Categories, groups, scopes, tags, etc...
       belongTo:[{ //(opc)
           categoryId: 1,
           subCategories:['sub1','sub2','sub3']  //array string
       }],

      name: "Speed translation Health Car", //required
      description:"This KPI example, shows the speed translation for emergency health cars...", //opc

      // this frequency could be or not used to filter queryExtract for each KPIElements.
       frequency:{ //opc
           unit:"hour",
           value:1,
           label:"Hourly"
       },

       // each target must be used to filter queryExtract for each KPIElements.
       assignTo:{
            targetTypeId: 1, //int or string
            targetIds:[1,2] //int or string
        },

        KPIElements: [ //required almost one
            {
                name:"Total emergency distance", //required
                unit:"km", //opc
                columnAtFormulaExtract:"distanceKM",// required ,
                goalDirection:"ASC" //required
            },
            {
                name:"Average emergency time",
                unit:"hour",
                columnAtFormulaExtract:"timeHour",// select avg(timeMinutes/60) as TimeHour from ahf.dataset2 where target = ?",
                goalDirection:"DESC",
            }
       ],

       //It is the combination of KPIElements
       formula:` select
                   sum(distanceMeter/1000) as distanceKM,
                   avg(timeMinutes/60) as timeHour,  
                  sum(distanceMeter/1000)/avg(timeMinutes/60) as KPIvalue,
                   now() as updatedDate,
                   formatDate(centralDataSet.dateTimeColumn, 'yyyy-mm-dd-h') as periodEndDate,
                   target as assignedTo
                   FROM (ahf.dataset1 join ahf.dataset2 using (target)) as centralDataSet
                   GROUP BY centralDataSet.target, formatDate(centralDataSet.dateTimeColumn, 'yyyy-mm-dd-h')    
                  `,
       unit:"km/h", //opc
       weight:10, //required
       goals:{ //required
            minValue:0,
            maxValue:80,
            goalDirection:"ASC",
            bad:{
                minValue:0,
                maxValue:20
            },
            fair:{
                minValue:21,
                maxValue:40
            },
            good:{
                minValue:41,
                maxValue:80
            }
        }

    },
    { //definition for new kpi 
        //Categories, groups, scopes, tags, etc...
       belongTo:[{ //(opc)
           categoryId: 1,
           subCategories:['sub1','sub2','sub3']  //array string
       }],

      name: "kpi name example number 2", //required
      description:"This KPI example, shows the example of metadata", //opc

      // this frequency could be or not used to filter queryExtract for each KPIElements.
       frequency:{ //opc
           unit:"week",
           value:1,
           label:"weekly"
       },

       // each target must be used to filter queryExtract for each KPIElements.
       assignTo:{
            targetTypeId: 1, //int or string
            targetIds:[1,2] //int or string
        },

        KPIElements: [ //required almost one
            {
                name:"Total emergency distance", //required
                unit:"km", //opc
                columnAtFormulaExtract:"distanceKM",// required ,
                goalDirection:"ASC" //required
            },
            {
                name:"Average emergency time",
                unit:"hour",
                columnAtFormulaExtract:"timeHour",// select avg(timeMinutes/60) as TimeHour from ahf.dataset2 where target = ?",
                goalDirection:"DESC",
            }
       ],

       //It is the combination of KPIElements
       formula:` sql form example here 329 `,
       unit:"mts", //opc
       weight:15, //required
       goals:{ //required
            minValue:0,
            maxValue:80,
            goalDirection:"ASC",
            bad:{
                minValue:0,
                maxValue:20
            },
            fair:{
                minValue:21,
                maxValue:40
            },
            good:{
                minValue:41,
                maxValue:80
            }
        }

    },
    { //definition for new kpi 
        //Categories, groups, scopes, tags, etc...
       belongTo:[{ //(opc)
           categoryId: 1,
           subCategories:['sub1','sub2','sub3']  //array string
       }],

      name: "kpi example 3", //required
      description:"This KPI example, shows the example metadata", //opc

      // this frequency could be or not used to filter queryExtract for each KPIElements.
       frequency:{ //opc
           unit:"hour",
           value:1,
           label:"Hourly"
       },

       // each target must be used to filter queryExtract for each KPIElements.
       assignTo:{
            targetTypeId: 1, //int or string
            targetIds:[1,2] //int or string
        },

        KPIElements: [ //required almost one
            {
                name:"Total emergency distance", //required
                unit:"km", //opc
                columnAtFormulaExtract:"distanceKM",// required ,
                goalDirection:"ASC" //required
            },
            {
                name:"Average emergency time",
                unit:"hour",
                columnAtFormulaExtract:"timeHour",// select avg(timeMinutes/60) as TimeHour from ahf.dataset2 where target = ?",
                goalDirection:"DESC",
            }
       ],

       //It is the combination of KPIElements
       formula:` sql form here 320239 `,
       unit:"cm", //opc
       weight:10, //required
       goals:{ //required
            minValue:0,
            maxValue:80,
            goalDirection:"ASC",
            bad:{
                minValue:0,
                maxValue:20
            },
            fair:{
                minValue:21,
                maxValue:40
            },
            good:{
                minValue:41,
                maxValue:80
            }
        }

    },
] 
module.exports = kpiResults;   
/*
const kpiResults =[
    { 
        use : 'use1',
        formula : 'sqlform1',
        example : 'example 1',
        datasources : ['dat1','dat2','dat4'],
        frequency : 'weekly',
        weight : '25',    
        tenant : 'AHF',
    },
    { 
        use : 'use2',
        formula : 'sqlform2',
        example : 'example 2',
        datasources : ['dat1','dat2','dat4'],
        frequency : 'hourly',
        weight : '35',    
        tenant : 'AHF',
    },
    { 
        use : 'use3',
        formula : 'sqlform14',
        example : 'example 31',
        datasources : ['dat1','dat2','dat4'],
        frequency : 'weekly',
        weight : '35',    
        tenant : 'AHF',
    }
];
*/