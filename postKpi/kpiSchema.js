var KpiSchema = {
    "id" : "kpiSchema",
    "type" : "object",
    "properties":  {
        "name" : { "type" : "string", "minLength": 2, "maxLength": 150 },
        "tenant" : {"type" : "string", "minLength": 2},
        "belongTo": {
          "type": "object",
          "properties": {
              "category": {"type": "string", "minLength": 4},
              "subCategories": {"type" : "array", "minItems": 1}
          },
          "required":  ["category","subCategories"]
        },
        "assignTo": {
          "type" : "object",
          "properties": {
              "targetType" : {"type": "string", "minLength" : 2},
              "targets" : {"type" : "array", "minItems": 1}
          },
          "required":  ["targetType","targets"]
        },        
        "formula" : {
          "type" : "object",
          "properties": {
              "query" : {"type": "array", "minItems": 1},
              "collectionName" : {"type": "string", "minLength": 4}
          },
          "required": ["query","collectionName"]
        },
        "weight" : { "type" : "string", "minLength":2 },
        "weightNumber" : {"type" : "integer", "minimum": 1},
        "goals" : {
          "type" : "object",
          "properties" : {
              "min" : {"type" : "number", "minimum": 0},
              "max" : {"type" : "number"},
              "direction": {"type" : "string", "minLength": 1},
              "value" : {"type" : "array", "minItems" : 4},
              "marks" : {"type" : "object"}
          },
          "required": ["min","max","direction","value","marks"]
        },
        "datasets" : {"type": "array", "minItems": 1}
    },
    "required": ["name","tenant","belongTo","assignTo","formula","weight","weightNumber","goals","datasets"]
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
  