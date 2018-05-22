var KpiSchema = {
    "id" : "kpiSchema",
    "type" : "object",
    "properties":  {
        "name" : { "type" : "string", "minLength": 2, "maxLength": 50 },
        "formula" : {"type" : "string"},
        "kpiElements" : {
            "type" : "array",
            "items" : {"type" : "object"},
            "minItems" : 1
        },
        "weight" : { "type" : "number" , "minimum" : 1},
        "goals" : {
          "type" : "object",
          "properties" : {
              "minValue" : {"type" : "number"},
              "maxValue" : {"type" : "number"},
              "goalDirection": {"type" : "string"},
              "bad": {
                  "type" : "object",
                  "properties" : {
                      "minValue" : {"type" : "number"},
                      "maxValue" : {"type" : "number"}
                  }
              },
              "fair" : {
                  "type" : "object",
                  "properties" : {
                        "minValue" : {"type" : "number"},
                        "maxValue" : {"type" : "number"}
                  }
              },
              "good": {
                  "type" : "object",
                  "properties" : {
                    "minValue" : {"type" : "number"},
                    "maxValue" : {"type" : "number"}
                  }
              }
          }
        }
    },
    "required": ["name","kpiElements","formula","weight","goals"]
};

module.exports = KpiSchema;

/*
// Address, to be embedded on Person
var addressSchema = {
    "id": "/SimpleAddress",
    "type": "object",
    "properties": {
      "lines": {
        "type": "array",
        "items": {"type": "string"}
      },
      "zip": {"type": "string"},
      "city": {"type": "string"},
      "country": {"type": "string"}
    },
    "required": ["country"]
  };
 
  {
    "belongsTo": [
      {
        "categoryId": 0,
        "subCategories": [
          "string"
        ]
      }
    ],
    "name": "string",
    "description": "string",
    "frequency": {
      "unit": "string",
      "value": 0,
      "label": "string"
    },
    "assignTo": {
      "targetTypeId": "string",
      "targetIds": [
        "string"
      ]
    },
    "kpiElements": [
      {
        "name": "string",
        "unit": "string",
        "columnAtFormulaExtract": "string"
      }
    ],
    "formula": "string",
    "unit": "string",
    "weight": 0,
    "goals": {
      "minValue": 0,
      "maxValue": 0,
      "goalDirection": "string",
      "bad": {
        "minValue": 0,
        "maxValue": 0
      },
      "fair": {
        "minValue": 0,
        "maxValue": 0
      },
      "good": {
        "minValue": 0,
        "maxValue": 0
      }
    }
  }

  */