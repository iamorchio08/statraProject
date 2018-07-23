var bulk = db.test_results.initializeUnorderedBulkOp();
cursor = db.lab_draws.aggregate([
    {
        $group: {
            _id : {
                kpi_target : {$toLower: "$CONTRIBUTION BY (CREATED BY)"},
                kpi_value_at : {
                    $dateToString: { format: "%Y-%m-%d %H:59", date: {$dateFromString: {dateString : "$DOC DATE"}}} }
                },
                kpi_value: {$sum: 1}
        }
    },
    {
        $project: {
            kpi_value : 1,
            kpi_value_at : "$_id.kpi_value_at",
            _id : 0,
            kpi_target : "$_id.kpi_target",
            kpiName : "Kpi Lab Draws",
            valueTarget: {"$literal": 33},
            valueRate : { $cond: { if: { $gte: [ "$kpi_value", {"$literal": 33} ] }, then: 100, else: {$multiply: [{$literal: 100}, {$divide: ["$kpi_value", {$literal:33 }]}]} }},
            updatedAt : new Date().toISOString()
        
        }
    },
    {
        $sort : {
            kpi_value : -1
        }
    }
]);
while ( cursor.hasNext() ) {
    bulk.insert(cursor.next())    
}
 test = bulk.execute();
 printjson(test);