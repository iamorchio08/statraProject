get /kpis/templates : 
  req : {category: 'Job Positions', subcategories : ['frontDesk','Sales','Marketing'] }
        //subcategories empty = all
        //categories empty = all
  res : {
      body : [{KPITEMPLATEDEF}],// objetos kpi templates
      statusCode : 200 | 400,
      status : 'success | error '
    }

get /kpis :  //get kpis with or without filters
    req : {category: 'Job Positions', subcategories : ['frontDesk','Sales','Marketing'] }
    res : {
        body : [{KPIDEF}],// objetos kpis
        statusCode : 200 | 400,
        status : 'success | error '
    }

get /categories : //list all categories
    req : //not required,
    res : {
        body : [{categoryObj}] //cateegories string,
        statusCode : 200 | 400,
        status : 'success | error '
    }

get /categories/{IDcategory} : //get subtcategories from a category
    req : 'Job Positions',
    res : {
        body : {categoryObj} ,
        statusCode : 200 | 400,
        status : 'success | error '
    }

post /categories : //create a caategory
    req : 'A category ' //required,
    res : {
        body: {objectCategory},
        statusCode : 201 | 400,
        status : 'success | error '
    }

put /categories/{categoryId} : //update a category
    req : ['sub category1','subcategory2'] //required 
    res :{
        body : {category},
        statusCode : 200 | 400,
        status : 'success | error '
    }

get /targettypes: //list all targettypes
    req : '' //empty,
    res: {
        body : [{targettypesDef}],
        statusCode : 200 | 400,
        status : 'success | error '
    }

get /targettypes/{targettypeId} : //get specific target
    req: targetId,
    res: {
        body :{targettypeDef}, // targettype & collections of objects targets
        statusCode : 200 | 400,
        status : 'success | error '
    }

post /kpis : //create new kpi
    req : {KPIDEF},
    res : {
        body : {endpoint: get/kpis/{idkpicreated} },
        statusCode : 201 | 400,
        status : 'success | error '
    }

KPIDEF: { //definition for new kpi 
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

    }

post /kpis/templates :// create new kpi template
    req : {KPITEMPLATEDEF}
    res : {
        body: //to define
        statusCode : 201 | 400,
        status : 'success | error ' 
    }

KPITEMPLATEDEF: { //definition for new kpi template
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
        }

CategoryObj = {
    name : 'cateegory name',
    id : number,
    subcategories : ['sub1','sub2','sub3'], //array string
}

targettypesDef = {
    name : 'a target type name', //required
    id : number,
    targets : [{variable targets}]
}

swagger: '2.0'
info:
  title: statrafndev.azurewebsites.net
  version: 1.0.0
host: statrafndev.azurewebsites.net
basePath: /
schemes:
  - https
  - http
paths:
  '/api/kpis/{id}/metadata/{test}':
    get:
      summary: get kpi metadata
      operationId: '/api/kpis/{id}/metadata/{test}/get'
      produces:
        - application/json
      consumes:
        - application/json
      parameters:
        - name: id
          in: path
          required: true
          type: integer
        - name: test
          in: path
          required: true
          type: boolean
      description: >-
        Replace with Operation Object
        #http://swagger.io/specification/#operationObject
      responses:
        '200':
          description: Success operation
          schema:
            type: object
            properties:
              body:
                type: object
                properties:
                  use:
                    type: string
                    description: Description of kpi's  metadata
                  formula:
                    type: string
                    description: Formula of Kpi
                  example:
                    type: string
                    description: Example of kpi's use
                  datasources:
                    type: array
                    items:
                      type: string
                    description: Array of datasources
                  frequency:
                    type: string
                    description: Frequency of kpi to calculate query
                  weight:
                    type: integer
                    description: Importance of kpi
                  tenant:
                    type: string
                    description: Tenant which the kpi belongs to
              status:
                type: string
                description: Status text of response
              statusCode:
                type: integer
                description: Status code of response
        '400':
          schema:
            type: object
            properties:
              status:
                type: string
                description: Error menssage of response
          description: Kpi not found
      security:
        - apikeyQuery: []
  '/api/kpis/{id}/{test}':
    get:
      summary: calculates specific kpi
      operationId: '/api/kpis/{id}/{test}/get'
      produces:
        - application/json
      consumes:
        - application/json
      parameters:
        - name: id
          in: path
          required: true
          type: integer
        - name: test
          in: path
          required: true
          type: boolean
      description: >-
        Replace with Operation Object
        #http://swagger.io/specification/#operationObject
      responses:
        '200':
          description: Success operation
          schema:
            type: object
            properties:
              body:
                type: object
                properties:
                  kpi:
                    type: string
                    description: Name of kpi
                  time:
                    type: string
                    description: Kpi's execution time
              status:
                type: string
                description: Operation's description (success or error)
              statusCode:
                type: integer
                description: Operation's status code
                
        '400':
          description: Kpi not found
          schema:
            type: object
            properties:
              status:
                type: string
                description: Operation's description (success or error)
              statusCode:
                type: integer
                description: Operation's status code
      security:
        - apikeyQuery: []
  '/api/kpis':
    post:
      summary: Creates new Kpi
      operationId: /api/kpis/post
      produces:
        - application/json
      consumes:
        - application/json
      parameters:
        - in: body
          name: kpidef
          schema:
            $ref: '#/definitions/KPI'
      description: >-
        Replace with Operation Object
        #http://swagger.io/specification/#operationObject
      responses:
        '201':
          description: Success Kpi created
          schema:
            type: object
            properties:
              body:
                type: string
                description: Endpoint to new kpi
        '401':
          description: Unauthorized
        '403':
          description: Validation Error  
      security:
        - apikeyQuery: []
  '/api/kpis':
    get:
      summary: get All kpis with or without filter
      operationId: getKpis
      produces:
        - application/json
      consumes:
        - application/json
      parameters:
        -in: body
        name: params
        schema:
          type: object
          properties:
            category:
              type: string
            subCategories:
              type: array
              items:
                type: string
      description: >-
        Replace with Operation Object
        #http://swagger.io/specification/#operationObject
      responses:
        '200':
          description: Results found
          schema:
            type: object
            properties:
              body:
                type: array
                items:
                  schema:
                    $ref: "#/definitions/KpiResponse"
              status:
                type: string
              statusCode:
                type: integer
          
      security:
        - apikeyQuery: []
  '/api/kpis/templates':
    get:
      summary : search kpi's templates
      operationId: getKpiTemplates
      produces:
        - application/json
      consumes:
        - application/json
      parameters:
        -in: body
        name: params
        schema:
          type: object
          properties:
            category:
              type: string
            subCategories:
              type: array
              items:
                type: string
      responses:
        '200':
          description: Results found
          schema:
            type: object
            properties:
              body:
                type: array
                items:
                  schema:
                    $ref: "#/definitions/KpiTemplateResponse"
              status:
                type: string
              statusCode:
                type: integer
        '404':
          description: Results not found
      
  
definitions:
  KPI:
    type: object
    required:
      - name
      - kpiElements
      - formula
      - weight
      - goals
    properties:
      belongsTo:
        type: array
        items:
          type: object
          properties:
            categoryId:
              type: integer
            subCategories:
              type: array
              items:
                type: string
      name:
        type: string
      description:
        type: string
      frequency:
        type: object
        properties:
          unit:
            type: string
          value:
            type: integer
          label:
            type: string
      assignTo:
        type: object
        properties:
          targetTypeId:
            type: string
          targetIds:
            type: string
      kpiElements:
        type: array
        items:
          $ref: '#/definitions/KpiElements'
      formula:
        type: string
      unit:
        type: string
      weight:
        type: number
      goals:
        type: object
        properties:
          minValue:
            type: integer
          maxValue:
            type: integer
          goalDirection:
            type: string
          bad:
            type: object
            properties:
              minValue:
                type: integer
              maxValue:
                type: integer
          fair:
            type: object
            properties:
              minValue:
                type: integer
              maxValue:
                type: integer
          good:
            type: object
            properties:
              minValue:
                type: integer
              maxValue:
                type: integer
  KpiElements:
    type: object
    properties:
      name:
        type: string
      unit:
        type: string
      columnAtFormulaExtract:
        type: string
    required:
      - name
      - unit
      - columnAtFormulaExtract
  
  KpiResponse:
    type: object
    properties:
      belongsTo:
        type: array
        items:
          type: object
          properties:
            categoryId:
              type: integer
            subCategories:
              type: array
              items:
                type: string
      name:
        type: string
      description:
        type: string
      frequency:
        type: object
        properties:
          unit:
            type: string
          value:
            type: integer
          label:
            type: string
      assignTo:
        type: object
        properties:
          targetTypeId:
            type: string
          targetIds:
            type: string
      kpiElements:
        type: array
        items:
          $ref: '#/definitions/KpiElements'
      formula:
        type: string
      unit:
        type: string
      weight:
        type: number
      goals:
        type: object
        properties:
          minValue:
            type: integer
          maxValue:
            type: integer
          goalDirection:
            type: string
          bad:
            type: object
            properties:
              minValue:
                type: integer
              maxValue:
                type: integer
          fair:
            type: object
            properties:
              minValue:
                type: integer
              maxValue:
                type: integer
          good:
            type: object
            properties:
              minValue:
                type: integer
              maxValue:
                type: integer
                
  KpiTemplateResponse:
    type: object
    properties:
      belongsTo:
        type: array
        items:
          type: object
          properties:
            categoryId:
              type: integer
            subCategories:
              type: array
              items:
                type: string
      name:
        type: string
      description:
        type: string
      frequency:
        type: object
        properties:
          unit:
            type: string
          value:
            type: integer
          label:
            type: string
      kpiElements:
        type: array
        items:
          $ref: '#/definitions/KpiElements'
      formula:
        type: string
      unit:
        type: string
  
securityDefinitions:
  apikeyQuery:
    type: apiKey
    name: code
    in: query
