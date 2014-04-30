$(document).ready(function() {
    initBezier();
});
var w = 800,
        h = 300,
        t = .5,
        delta = .01,
        padding = 10,
        points = [{x: 10, y: 280},
            {x: 200, y: 280},
            {x: 100, y: 200},
            {x: 200, y: 100},
            {x: 300, y: 210},
            {x: 400, y: 210},
            {x: 500, y: 100},
            {x: 600, y: 200},
            {x: 500, y: 280},
            {x: 700, y: 280}],
//        bezier = {},
        beziers = [],
        pointsList = [],
        line = d3.svg.line().x(x).y(y),
        n = 4,
        stroke = d3.scale.category20b(),
        orders = d3.range(2, n + 2),
        vis, charts = [], last = 0, chartCount = 200, weight = 2, wild = 50;
//    console.log(points.length);
function getRandom(i)
{
    return Math.floor(Math.random() * 2 * wild) - wild;
}
function initBezier()
{
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
//            else if (j < points.length / 2)
//            {
////                pt.y -= i * weight;
////                pt.x -= i * weight;
//
//            }
            else {
                pt.x += getRandom();
                pt.y += getRandom();
                if (pt.y > h)
                    pt.y = h-10;
//                pt.y -= i * weight;
//                pt.x += i * weight;
            }
            pts.push(pt);
        }
//        console.log(pts);
        pointsList.push(pts);
        chart = brezier(pts, i);
        beziers.push([]);
        charts.push(chart);

    }
    console.log(charts);
    vis = d3.select("#vis").selectAll("svg")
            .data([points.length]).enter()
            .append("svg")
            .attr("width", w + 2 * padding)
            .attr("height", h + 2 * padding)
            .append("g")
            .attr("transform", "translate(" + padding + "," + padding + ")");
    vis.append("text")
            .attr("class", "t")
            .attr("x", w / 2)
            .attr("y", h)
            .attr("text-anchor", "middle");


}

d3.timer(function(elapsed) {
    t = (t + (elapsed - last) / 5000) % 1;
//    t = 1;
    last = elapsed;
    for (var i in charts)
    {
        chart = charts[i];
        chart.update();
    }
//    update();
});




//d3.chart = d3.chart || {};
brezier = function(data, index) {

    var self = {};
    var pts = data;
//    console.log(pts);
    self.update = function() {
//        console.log("updating "+index);
        var count = 0;
        var max = 0;
//        var vis = d3.select("#vis").select("svg").selectAll("g .g-"+index);
//        console.log(pts);
        var interpolation = vis.selectAll("#g-" + index)
                .data(function(d) {
                    var levels = getLevels(d, t, pts);
//                    return [levels[0], levels[levels.length - 1]];
                    return [levels[levels.length - 1]];
                });
        interpolation.enter().append("g")
                .attr("id", function(d, i) {
                    return "g-" + index;
                })
                .style("fill", colour)
                .style("stroke", colour);
        var done_count = 0;
        var circle = interpolation.selectAll(".circle-" + index)
                .data(Object);
        circle.enter()
                .append("circle")
                .attr("class", function(d, i) {
//                console.log(i + "\t" + done_count);
                    done_count++;
//                    console.log(d);
                    return "circle-" + index + " " + " circle-" + index + "-" + i + " " + ((i === 1) ? "point" : "guide");
                })
                .attr("r", 4);
        circle
                .attr("cx", x)
                .attr("cy", y)
                ;

        var path = interpolation.selectAll("path .path-" + index)
                .data(function(d) {
                    return [d];
                });
        /*
         path.enter().append("path")
         .attr("class", function(d, i) {
         //                console.log(d.length);
         if (d.length === max)
         return "line guide-line path-" + index;
         else
         return "line path-" + index;
         })
         .attr("d", function(d, i) {
         if (d.length === max)
         return line(d);
         });
         path.attr("d", function(d, i) {
         if (d.length === max)
         return line(d);
         });
         */
        var curve = vis.selectAll(".curve-" + index)
                .data(function(d) {
                    return getCurve(d, index);
                });
        curve.enter().append("path")
                .attr("class", "curve curve-" + index);
        curve.attr("d", line);
    };

    return self;
};

function interpolate(d, p) {
    if (arguments.length < 2)
        p = t;
    var r = [];
    for (var i = 1; i < d.length; i++) {
        var d0 = d[i - 1], d1 = d[i];
        r.push({x: d0.x + (d1.x - d0.x) * p, y: d0.y + (d1.y - d0.y) * p});
    }
    return r;
}
//var print_once = true;

function getLevels(d, t_, pts) {
    if (arguments.length < 2)
        t_ = t;
    var x = [pts];
    for (var i = 1; i < d; i++) {
        x.push(interpolate(x[x.length - 1], t_));
    }
    return x;
}

function getCurve(d, i) {

    var curve = beziers[i][d];
    if (!curve) {
        curve = beziers[i][d] = [];
        for (var t_ = 0; t_ <= 1; t_ += delta) {
            var x = getLevels(d, t_, pointsList[i]);
            curve.push(x[x.length - 1][0]);
        }
    }
//    console.log(curve);
    return [curve.slice(0, t / delta + 1)];
}

function x(d) {
    return d.x;
}
function y(d) {
    return d.y;
}
function colour(d, i) {
    stroke(-i);
//    console.log(d);
    return d.length > 1 ? stroke(i) : "red";
}
