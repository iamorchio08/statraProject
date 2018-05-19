const KpiTemplatesResults = [
    { //definition for new kpi template
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
    },
    { //definition for new kpi template
        //Categories, groups, scopes, tags, etc...
        belongTo:[{ //(opc)
            categoryId: 1,
            subCategories:['sub1','sub2','sub3']  //array string
        }],

        name: "kpi template example 393", //required
        description:"This is an example of kpi template 393", //opc

        // this frequency could be or not used to filter queryExtract for each KPIElements.
        frequency:{ //opc
            unit:"day",
            value:1,
            label:"day"
        },
                   
        KPIElements: [ //required almost one
            {
                name:"kpi element example 23", //required
                unit:"mts", //opc
                columnAtFormulaExtract:"example column",// required ,
                goalDirection:"ASC" //required
            },
            {
                name:"kpi element example 345",
                unit:"hour",
                columnAtFormulaExtract:"example column2",// select avg(timeMinutes/60) as TimeHour from ahf.dataset2 where target = ?",
                goalDirection:"DESC",
            }
        ],
    
        //It is the combination of KPIElements
        formula:` SQL formula example `,
        unit:"unit example", //opc           
    },
    { //definition for new kpi template
        //Categories, groups, scopes, tags, etc...
        belongTo:[{ //(opc)
            categoryId: 1,
            subCategories:['sub1','sub2','sub3']  //array string
        }],

        name: "other name of kpi template example", //required
        description:"This is an  other template kpi example.", //opc

        // this frequency could be or not used to filter queryExtract for each KPIElements.
        frequency:{ //opc
            unit:"hour",
            value:1,
            label:"Hourly"
        },
                   
        KPIElements: [ //required almost one
            {
                name:"Kpi element example 39", //required
                unit:"km", //opc
                columnAtFormulaExtract:"columnexample",// required ,
                goalDirection:"ASC" //required
            }            
        ],
    
        //It is the combination of KPIElements
        formula:` SQL formula example here! `,
        unit:"unit example ", //opc           
    }
];

module.exports = KpiTemplatesResults;