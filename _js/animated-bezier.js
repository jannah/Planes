$(document).ready(function()
{
	initAnimation();
});

function initCharts(target)
{
	var svgw = parseInt($(target).css("width")), svgh = parseInt($(target).css("height"));
	bw = svgw;
	bh = svgh;
	var w = bw, h = bh;
	for (var i = 0, j = points.length; i < j; i++) {
		points[i].x *= w;
		points[i].y = bh - points[i].y * h;
		points[i]['total_survivors'] = points[i]['total_occupants'] - points[i]['total_fatalities'];
	}
	var x = d3.scale.ordinal().rangeRoundBands([0, w], .1);
	var y = d3.scale.linear().rangeRound([h, 0]);
	var color = d3.scale.ordinal().range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);
	var xAxis = d3.svg.axis().scale(x).orient("bottom");
	var vis = d3.select(target).selectAll("svg").data([points.length]).enter().append("svg").attr("width", svgw).attr("height", svgh).append("g")
	//            .attr("transform", "translate(" + (padding) + "," + (padding) + ")")
	.attr("id", target.split("#")[1] + "-top").append("g").attr("id", "breziers-group");
	//            .attr("transform", "translate(" + 0 + "," + 0 + ")");
	countBar = stackedBar("#counter-chart", "count-stacked-bar");

	phaseCountBar = backgroundPhaseBarChart(target, "phase-bar-count", w, h);

	vis.append("g").attr("class", "x axis").attr("transform", "translate(0," + h + ")").call(xAxis);
	var new_phases = [], x0 = 0;
	for (var i = 0, j = phases.length; i < j; i++) {
		if (phases[i].size > 0) {
			phases[i].x = x0;
			x0 += phases[i].size;
			new_phases.push(phases[i]);
		}
	}
	//    console.log(new_phases);
	var phase_lines = vis.append("g").attr("class", "g-phases").selectAll(".phase-line").data(new_phases).enter();
	phase_lines.append("line").attr("class", function(d, i)
	{
		return "phase-line line phase-" + d.name + " phase-" + d.order;
	}).attr("x1", function(d, i)
	{
		return w * d.x;
	}).attr("x2", function(d, i)
	{
		return w * d.x;
	}).attr("y1", 0).attr("y2", h);
	phase_lines.append("text").attr("class", function(d, i)
	{
		return "text phase-text phese-text-" + d.order + " phase-text-" + d.name;
	}).text(function(d, i)
	{
		return d.name;
	}).attr("x", function(d, i)
	{
		return w * (d.x + d.size / 2);
	}).attr("y", 20).attr("width", function(d)
	{
		return w * d.size;
	}).attr("text-anchor", "middle");

	vis.append("g").attr("class", "g-year").append("text").attr({
		"id" : "year-text",
		"text-anchor" : "middle",
		"y" : h - 20,
		"x" : w / 2
	});

	vis.append("g").attr("class", "g-curves");
	drawDecadeGroups();

}

function loadCharts(target, data, min_year, max_year)
{
	if (!min_year)
		min_year = stats["year"][0].values.year.min;
	if (!max_year)
		max_year = stats["year"][0].values.year.max;
	//    charts = {};
	//    beziers = {};
	//    preparePoints(target, data);

	prepareStraightPoints(target, data);
	updateActiveYears(min_year, max_year);
	phaseCountBar.init("count");
	first_year = stats["year"][0].values.year.min;
	//    console.log(beziers);
	current_year = first_year;
}

function prepareStraightPoints(target, data)
{
	var max = d3.max(data, function(d)
	{
		return (d.total_occupants) ? d.total_occupants : 0;
	}), min = 0;
	delta = 0.025;
	var w = bw - padding, h = bh - padding;
	console.log(min + "\t" + max);
	for (var i = 0, l = data.length; i < l; i++) {

		var phase = phases[phaseMap[data[i].phase_code]], survivors = data[i].total_occupants - data[i].total_fatalities;
		try {

			//            planes[idMap[data[i].id]].phase_location = phase.cum_size - phase.size + phase.size * Math.random() / 2;
			var pts = [], pl = planes[idMap[data[i].id]].phase_location, start = (max - min === 0) ? .5 : 1 - (data[i].total_occupants - min) / (max - min), end = (max - min === 0) ? .5 : 1 - (survivors - min) / (max - min), mid = (start + end) / 2;
			;

			//        console.log(pl+"\t"+temp1+"\t"+temp2+"\t"+temp3+"\t"+temp4);
			//        console.log(start+"\t"+mid+"\t"+end);

			pts.push({
				x : 0,
				y : start * h
			});
			for (var j = .1; j < pl; j += .1) {
				pts.push({
					x : j * w,
					y : start * h
				});
			}
			pts.push({
				x : pl * w,
				y : start * h
			});

			var rem = 20 - Math.ceil(pl * 20);
			if (survivors === 0 && data[i].total_occupants > 0) {
				var v = (Math.ceil(pl * 20) / 20 + Math.random() * .1) * w;
				v = (v > w) ? w : v;
				pts.push({
					x : v,
					y : h + padding
				});
			} else {

				for (var j = rem; j > 0; j--) {
					var temp = (j / (rem + 1) * (start - end) + end) * h;
					//                pts.push({x: (10-j)*w/10, y: temp});
					pts.push({
						x : (.9 + (20 - j) / 200) * w,
						y : temp
					});

				}
				//            pts.push({x: temp1 * w, y: start * h});
				//            pts.push({x: temp2 * w, y: start * h});
				//            pts.push({x: temp3 * w, y: start * h});
				//            pts.push({x: temp4 * w, y: start * h});
				pts.push({
					x : w,
					y : end * h
				});
				pts.push({
					x : w,
					y : end * h
				});
			}
			data[i].points = pts;
			data[i].r = 10;
			data[i].time = 0;

			beziers[data[i].id] = [];
			var chart = brezier(data[i].id, target);
			charts[data[i].id] = chart;
		} catch (e) {
			console.log(data[i]);
			console.log(phase);
			console.log(e);
		}
	}
	//    console.log(data);
}

function preparePoints(target, data)
{
	for (var i = 0, l = data.length; i < l; i++) {
		var pts = [];
		for (var j = 0, k = points.length; j < k; j++) {
			var pt = {
				x : points[j].x,
				y : points[j].y
			};

			if (j === 0 || j === points.length - 1) {
				//                pt.y += i * weight;
				//                pt.x=pt.x;
			} else {
				pt.x += getRandom(wild);
				pt.y += getRandom(wild);
				if (pt.y > bh)
					pt.y = bh - 10;
			}
			pts.push(pt);
		}

		data[i].points = pts;
		data[i].time = 0;

		beziers[data[i].id] = [];
		var chart = brezier(data[i].id, target);
		charts[data[i].id] = chart;

	}
}

function drawDecadeGroups()
{
	var gc = d3.selectAll('.g-curves');
	for (var i = 0, j = planesByDecade.length; i < j; i++) {
		var decade = planesByDecade[i].key;
		//        console.log('adding decade ' + decade)
		gc.append("g").attr({
			'id' : 'g-curve-' + decade,
			'class' : 'g-curve-decade'
		});
	}
}

function updateCharts(year, comp, fade, updateCounter)
{
	// console.log(year);
	var year_list = [];
	for (var i = 0, j = active_years.length; i < j && active_years[i].year <= year; i++) {
		year_list.push(active_years[i].year);
	}
	var list = planesByYear[keyMaps["year"][year]].values.list;
	for (var i in list) {
		var chart = charts[list[i]];

		chart.update(comp);
		if (updateCounter) {
			var id = idMap[list[i]], data = planes[id];
			countBar.update(data.total_occupants - data.total_fatalities, data.total_fatalities);

		}
	}
	if (fade) {
		d3.selectAll(".object-year-" + year);
	}
}

function drawBrezier(target, index, completed)
{
	//    console.log('updating '+index);
	var data = planes[index], pts = data.points, decade = data.decade, vis = d3.selectAll(target).selectAll("svg").select("#g-curve-" + decade), interpolation = vis.selectAll(".g-" + index).data(function()
	{
		var levels = getLevels(pts.length, completed, pts);
		return [levels[levels.length - 1]];
	});
	//    console.log(decade);
	interpolation.enter().append("g").classed("g-" + index, true).classed("g-curve", true).attr("data-x", function(d)
	{
		return d.x;
	});
	var circle = interpolation.selectAll(".circle-" + index).data(Object).enter().append("circle").classed("circle-" + index, true).classed("point", true).classed("circle-year-" + data.year, true).classed("object-year-" + data.year, true).classed("object-id-" + index, true).attr({
		"data-id" : index,
		"r" : function(d)
		{
			var key = "total_occupants", scale = doScale(data[key], key);
			//                console.log(d.x);
			return max_r * scale + min_r;
		},
		"cx" : x,
		"cy" : y
	}).style({
		'fill' : function()
		{
			return colors(category_map[circle_color_key][data[circle_color_key]].id);
		}
	});
	var curve1 = vis.selectAll(".g-" + index).selectAll(".curve-before-" + index).data(function(d)
	{
		var c = getCurve(pts.length, index, pts, 0, completed);
		//                    console.log(c);
		return c;
		//                    return getCurve(d, index, pts);
	}).enter().append("path").classed("curve-before-" + index, true).classed("curve", true).classed("curve-before", true).classed("curve-year-" + data.year, true).classed("object-year-" + data.year, true).classed("object-id-" + index, true).attr("data-id", index).attr("d", line);

	var curve2 = vis.selectAll(".g-" + index).selectAll(".curve-after-" + index).data(function(d)
	{
		var c = getCurve(pts.length, index, pts, 0, completed);
		//                    console.log(c);
		return c;
		//                    return getCurve(d, index, pts);
	}).enter().append("path").classed("curve-after-" + index, true).classed("curve", true).classed("curve-after", true).classed("curve-year-" + data.year, true).classed("object-year-" + data.year, true).classed("object-id-" + index, true).attr("data-id", index).attr("d", line);

	$('.object-id-' + index).on('mouseover', function(event)
	{
		var i = $(this).attr('data-id');
		$('#narratives').empty().html(formatPlaneHTML(i));

		//        $("#tooltip")
		//                .css("visibility", "visible")
		//                .html(formatPlaneHTML(i))
		//                .css("top", function() {
		//                    return (event.pageY - 170) + "px";
		//                })
		//                .css("left", function() {
		//                    return (event.pageX - 100) + "px";
		//                });
		//        console.log('displaying tooltip');
	}).on('mouseleave', function(d)
	{
		d3.select("#tooltip").style("visibility", "hidden");
	});

}

function updateBrezier(target, index, completed)
{
	//    console.log("drawing " + index);
	var data = planes[index], pts = data.points, vis = d3.selectAll(target).selectAll("svg").select(".g-curves"), interpolation = vis.selectAll(".g-" + index);
	var start1 = 0, end1 = (completed <= data.phase_location) ? completed : data.phase_location, start2 = (completed <= data.phase_location) ? 0 : data.phase_location, end2 = (completed <= data.phase_location) ? 0 : completed;
	//    console.log(start1 + " " + end1 + " " + start2 + " " + end2);
	var levels = getLevels(pts.length, completed, pts), level = levels[levels.length - 1][0], curve_pts1 = getCurve(pts.length, index, pts, start1, end1), curve_pts2 = getCurve(pts.length, index, pts, start2, end2);
	interpolation.selectAll(".circle-" + index).attr("cx", level.x).attr("cy", level.y);
	vis.selectAll(".g-" + index).selectAll(".curve-before-" + index).attr("d", function()
	{
		return line(curve_pts1[0]);
	});
	vis.selectAll(".g-" + index).selectAll(".curve-after-" + index).attr("d", function()
	{
		return line(curve_pts2[0]);
	});

}

function resetBreziers()
{
	$('.g-curves').empty();
	drawDecadeGroups();
}

brezier = function(index, target)
{
	//    console.log("init brez " + index);
	var self = {
	}, ready = false;
	self.update = function(comp)
	{
		if (!ready)
			drawBrezier(target, index, 0);
		ready = true;
		updateBrezier(target, index, comp);

	};
	return self;
};

function interpolate(d, p)
{
	if (arguments.length < 2)
		p = t;
	var r = [];
	for (var i = 1; i < d.length; i++) {
		var d0 = d[i - 1], d1 = d[i];
		r.push({
			x : d0.x + (d1.x - d0.x) * p,
			y : d0.y + (d1.y - d0.y) * p
		});
	}
	return r;
}

function getLevels(d, t_, pts)
{
	if (arguments.length < 2)
		t_ = t;
	var x = [pts];
	for (var i = 1; i < d; i++) {
		x.push(interpolate(x[x.length - 1], t_));
	}
	return x;
}

function getCurve(d, i, pts, start, end)
{

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


function colour(d, i)
{
	stroke(-i);
	//    console.log(d);
	return d.length > 1 ? stroke(i) : "red";
}

function doScale(value, key)
{
	if (value === 0)
		return 0;
	var min = stats[key][0].values[key].min, max = stats[key][0].values[key].max;
	return (value - min) / (max - min);
}

/**************************************************
 * ANIMATION
 **************************************************/
function startTimer()
{
	var last_t = 0;
	duration = max_duration;
	time = getSliderValue();
	if (active_years[Math.floor(time)])
		current_year = active_years[Math.floor(time)].year;
	else
		current_year = active_years[Math.floor(time)].year - 1;
	var temp_t = 0;
	if (ANIMATE) {
		console.log('strating time ' + time);
		console.log("starting from " + current_year);
		//        d3.timer.flush();
		d3.timer(function(elapsed)
		{
			var delta_t = (elapsed - last) / duration;

			temp_t += delta_t;
			// console.log(last + "\t" + elapsed + "\t" + delta_t + "\t" + temp_t);

			last = elapsed;
			if (temp_t >= delta) {
				// console.log("refresh");
				temp_t -= delta;
				time += delta;
				updateSliderValue(time);

			}

			if (time > parseFloat($('#play-slider').attr("max"))) {
				toggleAnimation();
			}
			return !ANIMATE;
		}, 10, Date.now());
	}
}

function toggleAnimation()
{
	// console.log("toggling " + ANIMATE);
	if (ANIMATE)
		stopAnimation();
	else
		startAnimation();
}

function stopAnimation()
{
	ANIMATE = false;
	$("#play-button").val("\u25BA");
	//    d3.timer.flush();
}

function startAnimation()
{
	ANIMATE = true;
	console.log("starting animation");
	$("#play-button").val("\u2016");
	startTimer();
}

function formatPlaneHTML(index)
{
	var html = "", item = planes[index];
	html += "<table>";
	for (var i in item) {
		html += "<tr><td>" + i + "</td><td>" + item[i] + "</td></tr>";
	}
	html += '</table>';
	return html;
}
