/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/*
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
     */
    
    
    
/*
 function startTimer2()
 {
 var last_t = 0, skip_count;
 duration = max_duration;
 t = 0;
 console.log(stats["year"]);
 var slider_value_list = [];
 if (decade_mode)
 {
 //        duration = 1000;
 skip_count = 0;
 current_year = active_decade;
 while (typeof (planesByYear[keyMaps["year"][current_year]]) === 'undefined')
 {
 console.log('skipping ' + current_year);
 current_year++;
 }
 last_year = active_decade + 9;
 }
 else
 {
 current_year = stats["year"][0].values.year.min;
 last_year = stats["year"][0].values.year.max;
 }
 for (var i = current_year; i < last_year; i++)
 slider_value_list.push(i);
 setSliderValues(slider_value_list, delta);
 updateSliderValue(0);
 console.log("starting from " + current_year);
 //    var active_years = [];
 //    var year_count = 5;
 //    for (var i = 0; i < year_count; i++)
 //        active_years.push(current_year + i);
 if (ANIMATE)
 {
 //        d3.timer.flush();
 d3.timer(function(elapsed, i)
 {
 console.log(i);
 t = (t + (elapsed - last) / duration) % 1;
 if (t < last_t)
 {
 duration = (duration < min_duration) ? min_duration : duration / 1.2;
 var temp_t = t;
 t = 1;
 if (skip_count > 0)
 {
 skip_count--;
 duration = max_duration;
 }
 else {
 updateCharts(current_year, t, true, true);
 if (current_year < last_year)
 {
 current_year++;
 while (!keyMaps["year"][current_year] && current_year < stats["year"][0].values.year.max)
 {
 time++;
 current_year++;
 }
 }
 else
 {
 stopAnimation();
 }
 }
 t = 0;
 
 }
 else
 time += t - last_t;
 updateSliderValue(time);
 
 last_t = t;
 last = elapsed;
 
 if (skip_count > 0)
 {
 }
 else if (current_year <= last_year)
 {
 $("#year-text").text("" + current_year);
 updateCharts(current_year, t);
 } else
 {
 toggleAnimation();
 }
 return !ANIMATE;
 }, 10, Date.now());
 }
 }*/   