var w = 800,
        h = 300,
        t = .5,
        delta = .01,
        padding = 10,
        points = [{x: 10, y: 250},
            {x: 200, y: 250},
            {x: 100, y: 120},
            {x: 200, y: 50},
            {x: 300, y: 130},
            {x: 400, y: 130},
            {x: 500, y: 50},
            {x: 600, y: 120},
            {x: 500, y: 250},
            {x: 700, y: 250}],
        bezier = {},
        line = d3.svg.line().x(x).y(y),
        n = 4,
        stroke = d3.scale.category20b(),
        orders = d3.range(2, n + 2);
//    console.log(points.length);
var vis = d3.select("#vis").selectAll("svg")
        .data([points.length]).enter()
        .append("svg")
        .attr("width", w + 2 * padding)
        .attr("height", h + 2 * padding)
        .append("g")
        .attr("transform", "translate(" + padding + "," + padding + ")");

update();

vis.selectAll("circle.control")
        .data(points)
        .enter().append("circle")
        .attr("class", "control")
        .attr("r", 7)
        .attr("cx", x)
        .attr("cy", y)
        .call(d3.behavior.drag()
                .on("dragstart", function(d) {
                    console.log(d.x + "\t" + d.y);
                    this.__origin__ = [d.x, d.y];
                })
                .on("drag", function(d) {
                    d.x = Math.min(w, Math.max(0, this.__origin__[0] += d3.event.dx));
                    d.y = Math.min(h, Math.max(0, this.__origin__[1] += d3.event.dy));
                    bezier = {};
                    update();
                    vis.selectAll("circle.control")
                            .attr("cx", x)
                            .attr("cy", y);
                })
                .on("dragend", function() {
                    delete this.__origin__;
                }));

vis.append("text")
        .attr("class", "t")
        .attr("x", w / 2)
        .attr("y", h)
        .attr("text-anchor", "middle");

vis.selectAll("text.controltext")
        .data(points)
        .enter().append("text")
        .attr("class", "controltext")
        .attr("dx", "10px")
        .attr("dy", ".4em")
        .text(function(d, i) {
            return "P" + i
        });

var last = 0;


function update() {
    var count = 0;
    var max = 0;
    var interpolation = vis.selectAll("g")
            .data(function(d) {
                var levels = getLevels(d, t);
//        console.log(levels);
                for (var i in levels)
                {
                    count += levels[i].length;
                    max = (levels[i].length > max) ? levels[i].length : max;
                }
                return levels;
            });
    interpolation.enter().append("g")
            .style("fill", colour)
            .style("stroke", colour);
//    console.log(max);
    var done_count = 0;
    var circle = interpolation.selectAll("circle")
            .data(Object);
    circle.enter().append("circle")
            .attr("class", function(d, i) {
//                console.log(i + "\t" + done_count);
                done_count++;
                return (done_count === count) ? "point" : "guide";
            })
            .attr("r", 4);
    circle
            .attr("cx", x)
            .attr("cy", y)
            ;

    var path = interpolation.selectAll("path")
            .data(function(d) {
                return [d];
            });

    path.enter().append("path")
            .attr("class", function(d, i) {
                console.log(d.length);
                if (d.length === max)
                    return "line guide-line";
                else
                    return "line";
            })
            .attr("d", line);
    path.attr("d", line);

    var curve = vis.selectAll("path.curve")
            .data(getCurve);
    curve.enter().append("path")
            .attr("class", "curve");
    curve.attr("d", line);

    vis.selectAll("text.controltext")
            .attr("x", x)
            .attr("y", y);
    vis.selectAll("text.t")
            .text("t=" + t.toFixed(2));
}

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

function getLevels(d, t_) {
    if (arguments.length < 2)
        t_ = t;
//    console.log(d);
    var x = [points];
    for (var i = 1; i < d; i++) {
        x.push(interpolate(x[x.length - 1], t_));
    }
//    console.log(x);
    return x;
}

function getCurve(d) {
    var curve = bezier[d];
    if (!curve) {
        curve = bezier[d] = [];
        for (var t_ = 0; t_ <= 1; t_ += delta) {
            var x = getLevels(d, t_);
            curve.push(x[x.length - 1][0]);
        }
    }
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
