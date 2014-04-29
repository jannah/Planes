/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


$(document).ready(function() {
    init();
});

var data_file="_data\clean_planes.csv";
function init(){
    
   var data = readCSV(data_file);
   console.log(data)
}