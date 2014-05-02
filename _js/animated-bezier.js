$(document).ready(function() {
    initAnimation();
});

var width = 900,
        height = 500, bh = 0, bw = 0,
        t = .5,
        time = 0,
        first_year = 2100,
        current_year = 0,
        delta = .02,
        padding = 10,
        margin = {top: 20, right: 100, bottom: 30, left: 40},
points = [], points_file = "_data/points.json",
        phases = [], phases_file = "_data/phases.json", phaseMap = {};
planes = [], planes_file = "_data/clean_planes.csv",
        planesByYear = {}, idMap = {}, keyMaps = {}, stats = {},
        num_headers = ["year", "month", "crew_occupants", "passengers_fatalities",
            "crew_fatalities", "total_fatalities", "total_occupants_old", "total_occupants",
            "passengers_occupants", "passengers_occupants_old"],
        beziers = [],
        pointsList = [],
        line = d3.svg.line().x(x).y(y),
        n = 4,
        stroke = d3.scale.category20b(),
        orders = d3.range(2, n + 2),
        charts = [], last = 0, chartCount = 200, weight = 2, wild = 100;//    console.log(points.length);


var ANIMATE = false;
function initAnimation() {
    loadPlaneData();
    loadBeziers("#plane-curves", planes);
//    startTimer();
}
function loadPlaneData()
{
    points = readJSON(points_file);
    phases = readJSON(phases_file);
    planes = readCSV(planes_file);
    console.log(phases);
//    console.log()
    var cum = 0;
    for (var i = 0, j = phases.length; i < j; i++)
    {
        cum += phases[i].size;
        phases[i]["cum_size"] = cum;
        phaseMap[phases[i].code] = i;
    }
    console.log(phaseMap);
    for (var k = 0, l = planes.length; k < l; k++)
    {
        for (var i = 0, j = num_headers.length; i < j; i++)
        {
            planes[k][num_headers[i]] = parseInt(planes[k][num_headers[i]]);
        }
        var phase = phases[phaseMap[planes[k].phase_code]];
        if (!phase)
        {
//            console.log(planes[k].phase_code);
            planes[k]["phase_location"] = 0
        }
        else
            planes[k]["phase_location"] = phase.cum_size - phase.size * Math.random();
    }
    for (var i = 0, j = num_headers.length; i < j; i++)
    {

        stats[num_headers[i]] = doNest(planes, "All", num_headers[i]);
    }
//    console.log(stats);
    for (var i = 0, j = data.length; i < j; i++)
    {
        idMap[data[i].id] = i;
    }
    planesByYear = doNest(planes, "year");

//    console.log(phases);
//    console.log(planes);
//    console.log(phases);
}

function doNest(data, key, measure)
{
    if (!key)
        key = "All";
    if (!measure)
        measure = key;

    var nested = d3.nest()
            .key(function(d) {
                return d[key];
            }).sortKeys(d3.ascending)
            .rollup(function(leaves) {
//                console.log(leaves);
                if (leaves)
                {
                    var item = {count: 0, sum: 0, max: 0, min: 0, list: [], indeces: []};
                    item.count = leaves.length;
                    item.sum = d3.sum(leaves, function(d) {
                        return d[measure];
                    });
                    item.max = d3.max(leaves, function(d) {
                        return d[measure];
                    });
                    item.min = d3.min(leaves, function(d) {
                        return d[measure];
                    });
                    for (var i = 0, j = leaves.length; i < j; i++)
                    {
//                        console.log(leaves[i].id)
                        item.list.push(leaves[i].id);
                        item.indeces.push(idMap[leaves[i].id]);
                    }
                    return item;
                }
            })
            .entries(data);
    keyMaps[key] = {};
    for (var i = 0, j = nested.length; i < j; i++)
    {
        keyMaps[key][nested[i].key] = i;

    }
//    console.log(nested);
//    console.log(keyMaps);
    return nested;
}

function getRandom(i)
{
    return Math.floor(Math.random() * 2 * i) - i;
}
function loadBeziers(target, data)
{
    initBezier(target);
    for (var i = 0, l = data.length; i < l; i++)
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

        data[i].points = pts;
        data[i].time = 0;
        first_year = (data[i].year < first_year) ? data[i].year : first_year;
//        console.log(pts);
//        pointsList.push(pts);
        beziers.push([]);
        chart = brezier(data[i], i, target);

        charts.push(chart);

    }
    current_year = first_year;
//    console.log(first_year);
//    console.log(charts);
}
function initBezier(target)
{
    var svgw = parseInt($(target).css("width")),
            svgh = parseInt($(target).css("height"));
    bw = svgw;
    bh = svgh / 2;
    var w = bw, h = bh;


    for (var i = 0, j = points.length; i < j; i++)
    {
        points[i].x *= w;
        points[i].y = bh - points[i].y * h;
    }
    var x = d3.scale.ordinal()
            .rangeRoundBands([0, w], .1);
    var y = d3.scale.linear()
            .rangeRound([h, 0]);
    var color = d3.scale.ordinal()
            .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);
    var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");
    var vis = d3.select(target).selectAll("svg")
            .data([points.length]).enter()
            .append("svg")
            .attr("width", svgw + 2 * padding)
            .attr("height", svgh + 2 * padding)
            .append("g")
            .attr("transform", "translate(" + padding + "," + padding + ")")
            .attr("id", target.split("#")[1] + "-top");


    console.log(h + " " + w);
    vis.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + h + ")")
            .call(xAxis);
    var new_phases = [],
            x0 = 0;
    for (var i = 0, j = phases.length; i < j; i++)
    {

        if (phases[i].size > 0) {
            phases[i].x = x0;
            x0 += phases[i].size;
            new_phases.push(phases[i]);
        }
    }
    console.log(new_phases);
    var phase_lines = vis.append("g").attr("class", "g-phases").selectAll(".phase-line")
            .data(new_phases).enter();
    phase_lines.append("line")
            .attr("class", function(d, i) {
                return "phase-line line phase-" + d.name + " phase-" + d.order;
            })
            .attr("x1", function(d, i) {
                return w * d.x;

            })
            .attr("x2", function(d, i) {
                return w * d.x;
            })
            .attr("y1", 0)
            .attr("y2", h);
    phase_lines.append("text")
            .attr("class", function(d, i) {
                return "text phase-text phese-text-" + d.order + " phase-text-" + d.name;
            })
            .text(function(d, i) {
                return d.name;
            })
            .attr("x", function(d, i) {
                return w * (d.x + d.size / 2);
            })
            .attr("y", 20)
            .attr("width", function(d) {
                return w * d.size;
            })
            .attr("text-anchor", "middle");
    vis.append("g").attr("class", "g-curves");

//            .attr()




}
function startTimer()
{
    var last_t = 0, duration = 200;
    t = 0;
    current_year = stats["year"][0].values.min;
//    $('.curve').attr("opacity", 1);
    console.log("starting from " + current_year);

    if (ANIMATE)
    {
        d3.timer(function(elapsed) {
            t = (t + (elapsed - last) / duration) % 1;
//            console.log(t + "\t" + elapsed);

            if (t < last_t)
            {
                var temp_t = t;
                t = 1;
                updateCharts(current_year, t, true);

                t = temp_t;

                time = Math.floor(time);
                current_year++;

                while (!keyMaps["year"][current_year] && current_year < stats["year"][0].values.max)
                {
                    console.log("skipping year " + current_year);
                    time++;
                    current_year++;
                }
                time += t;
            }
            else
                time += t - last_t;
            last_t = t;
//            console.log(t + "\t" + time + "\t" + elapsed);
            last = elapsed;



            if (current_year > stats["year"][0].values.max)
                toggleAnimation();
            else
            {
                $("#year-label").text("" + current_year);
                updateCharts(current_year, t);
            }
            return !ANIMATE;
        });
    }

}

function toggleAnimation()
{
    ANIMATE = !ANIMATE;
    if (ANIMATE)
    {
        startAnimation();
        $("#animate-button").val("stop");
    }
    else
    {
        stopAnimation();
        $("#animate-button").val("start");
    }
}
function stopAnimation() {
    ANIMATE = false;
}
function startAnimation() {
    ANIMATE = true;
    startTimer();
}
function updateCharts(year, comp, fade)
{
//    console.log(year);
    var list = planesByYear[keyMaps["year"][year]].values.indeces;
    for (var i in list)
    {
        var chart = charts[list[i]];
//        console.log(first_year + "\t" + current_year + " " + chart.data.year);
        if (chart.data.year === year)
        {
//            console.log("updating " + chart.data.id+" "+comp);
            chart.update(comp);

//            $(".object-year-" + year).addClass("faded");
        }
        if (fade)
            d3.selectAll(".object-year-" + year)
                    .transition()
                    .duration(1500)
//                    .attr("class", function() {
//                        return $(this).attr("class") + " faded";
//                    })
                    .style("opacity", 0.3);
    }

}
//d3.chart = d3.chart || {};
brezier = function(data, index, target) {

    var self = {}, ready = false,
            pts = data.points,
            vis = d3.selectAll(target).selectAll("svg").select(".g-curves"),
            completed = 0.0, circle, curve1, curve2;

    self.data = data;
    self.completed = function() {
        return completed;
    };
    self.update = function(comp) {

        if (!ready)
        {
            self.draw(0);
        }
        completed = comp;

        var start1 = 0,
                end1 = (completed <= data.phase_location) ? completed : data.phase_location,
                start2 = (completed <= data.phase_location) ? 0 : data.phase_location,
                end2 = (completed <= data.phase_location) ? 0 : completed;

        var levels = getLevels(pts.length, completed, pts),
                level = levels[levels.length - 1][0],
                curve_pts1 = getCurve(pts.length, index, pts, start1, end1),
                curve_pts2 = getCurve(pts.length, index, pts, start2, end2);
        circle.attr("cx", level.x).attr("cy", level.y);
        curve1.attr("d", function() {
            return line(curve_pts1[0]);
        });
        curve2.attr("d", function() {
            return line(curve_pts2[0]);
        });


    };
    self.draw = function(comp) {
        ready = true;
        completed = comp;
//        console.log(completed);

        var interpolation = vis.selectAll(".g-" + index)
                .data(function() {
                    var levels = getLevels(pts.length, completed, pts);
                    return [levels[levels.length - 1]];
                });
//        console.log(interpolation);
        interpolation.enter().append("g")
//                .attr("id", "g-" + index)
                .classed("g-" + index, true)
//                .style("fill", colour)
//                .style("stroke", colour)
                .attr("data-x", function(d) {
//                    console.log(d);
                    return d.x;
                });
//        var done_count = 0;
        circle = interpolation.selectAll(".circle-" + index)
                .data(Object)
                .enter()
                .append("circle")
//                .attr("id", "circle-" + index)
                .classed("circle-" + index, true)
                .classed("point", true)
                .classed("circle-year-" + data.year, true)
                .classed("object-year-" + data.year, true)
                .attr("r", function(d) {
                    var key = "total_occupants",
                            scale = doScale(data[key], key);
//                    console.log(d.x);
                    return 20 * scale + 1;
                })
                .attr("cx", x)
                .attr("cy", y);
        curve1 = vis.selectAll(".g-" + index).selectAll(".curve-before-" + index)
                .data(function(d) {
                    var c = getCurve(pts.length, index, pts, 0, completed);
//                    console.log(c);
                    return c;
//                    return getCurve(d, index, pts);
                })
                .enter().append("path")
                .classed("curve-before" + index, true)
                .classed("curve", true)
                .classed("curve-before", true)
                .classed("curve-year-" + data.year, true)
                .classed("object-year-" + data.year, true)
                .attr("d", line)


        curve2 = vis.selectAll(".g-" + index).selectAll(".curve-after-" + index)
                .data(function(d) {
                    var c = getCurve(pts.length, index, pts, 0, completed);
//                    console.log(c);
                    return c;
//                    return getCurve(d, index, pts);
                })
                .enter().append("path")
                .classed("curve-after-" + index, true)
                .classed("curve", true)
                .classed("curve-after", true)
                .classed("curve-year-" + data.year, true)
                .classed("object-year-" + data.year, true)
                .attr("d", line);
    };
//    self.draw(0);
//    self.update(1);
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

function getCurve(d, i, pts, start, end) {

    var curve = beziers[i][d];
    if (!curve) {
        curve = beziers[i][d] = [];
        for (var t_ = 0; t_ <= 1; t_ += delta) {
            var x = getLevels(d, t_, pts);
            curve.push(x[x.length - 1][0]);
        }
    }
//    console.log(curve);
    if (!start)
        start = 0;
    return [curve.slice(start / delta, end / delta + 1)];
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
function doScale(value, key)
{
    if (value === 0)
        return 0;
    var min = stats[key][0].values.min, max = stats[key][0].values.max;
    return (value - min) / (max - min);
}