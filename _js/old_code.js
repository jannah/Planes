/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


function loadBeziersRandom(target) {
    initBezier(target);
    for (var i = 0; i < chartCount; i++)
    {
        var pts = [];
        for (var j = 0, k = points.length; j < k; j++)
        {
            var pt = {x: points[j].x, y: points[j].y};
            if (j === 0 || j === points.length - 1)
            {
//                pt.y += i * weight;
//                pt.x=pt.x;
            }
            else
            {
                pt.x += getRandom(wild);
                pt.y += getRandom(wild);
                if (pt.y > bh)
                    pt.y = bh - 10;
            }
            pts.push(pt);
        }
//        console.log(pts);
        pointsList.push(pts);
        chart = brezier(pts, i, target);
        beziers.push([]);
        charts.push(chart);
}
current_year = first_year;
console.log(charts);
        