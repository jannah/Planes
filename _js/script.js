/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


$(document).ready(function() {
    init();
});
var data_file = "_data/clean_planes.csv";
var quant_list = ["id", "month", "year", "total_fatalities",
    "total_occupants", "passengers_occupants", "crew_occupants",
    "passengers_fatalities", "crew_fatalities"];

var data = [];
function init()
{
    data = loadData(data_file);
}

function loadData(filename)
{
    var data = readCSV(filename);
    for (var i = 0, j = data.length; i < j; i++)
    {
        for (var k in quant_list)
        {
            var key = quant_list[k];
            data[i][key] = parseInt(data[i][key]);
        }
        data[i]["date"] = new Date(data[i]["date"]);
    }

    return data;
}


function drawCurve(id)
{
    
}