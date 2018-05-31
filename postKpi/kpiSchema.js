var KpiSchema = {
    "id" : "kpiSchema",
    "type" : "object",
    "properties":  {
        "name" : { "type" : "string", "minLength": 2, "maxLength": 50 },
        "formula" : {"type" : "object"},        
        "weight" : { "type" : "string" },
        "goals" : {
          "type" : "object",
          "properties" : {
              "min" : {"type" : "number"},
              "max" : {"type" : "number"},
              "direction": {"type" : "string"},
              "value" : {"type" : "array"},
              "marks" : {"type" : "object"}
          }
        }
    },
    "required": ["name","formula","weight","goals"]
};

module.exports = KpiSchema;
/*
var kpiDef =  
  {
    "belongsTo": [
      {
        "category": 'string',
        "subCategories": [
          "string"
        ]
      }
    ],
    "name": "string",
    "description": "string",
    "frequency": {
      "unit": "string",
      "value": number,
      "label": "string",
      "valueUnit" : number
    },
    "assignTo": {
      "targetType": "string",
      "targets": [{}]
    },    
    "formula": {
      queryFilter : 'string',
      dimensions : [{}],
      metrics : [{}]
    },
    "unit": "string",
    "weight": 'string',
    "goals": {
      "min": number,
      "max": number,
      "direction": "string",
      "value" : [1,5,8,15], //example [1,5] [5,8] [8,15]
      "marks" : {}
    },
    "enable" : boolean,
    "datasets" : ['strings'], // nomenclatura :  tenant_nombredataset
    "tennat" : "ahf",
    "documentType" : "kpi"
  }
*/
  