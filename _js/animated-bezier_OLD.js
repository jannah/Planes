$(document).ready(function()
{
	initAnimation();
});

var width = 900, height = 500, bh = 0, bw = 0, default_opacity = .5, t = .5, time = 0, duration = 4000;
var max_duration = 6000, min_duration = 2000, acceleration = 1.2;
var first_year = 2100, current_year = 0, last_year, delta = .01, svg_padding = 5;
var min_r = 2, max_r = 25, padding = 10, margin = {
	top : 20,
	right : 100,
	bottom : 30,
	left : 40
}, points = [], points_file = "_data/points.json", phases = [], phases_file = "_data/phases.json", phaseMap = {
}, flight_natures = {
}, flight_damages = {
}, category_map = {
}, planes = [];
var planes_file = "_data/clean_planes_all.csv",
// var               planes_file = "_data/test.csv",

planesByYear = {
}, planesByDecade = {
};
idMap = {
}, keyMaps = {
}, stats = {
}, num_headers = ["decade", "year", "month", "crew_occupants", "passengers_fatalities", "crew_fatalities", "total_fatalities", "total_occupants_old", "total_occupants", "passengers_occupants", "passengers_occupants_old"], target_color_categories = ['airplane_damage', 'nature', 'make'], circle_color_key = 'airplane_damage', beziers = {
}, pointsList = [], line = d3.svg.line().x(x).y(y), n = 4, stroke = d3.scale.category20b(), orders = d3.range(2, n + 2), charts = {
}, last = 0, chartCount = 200, weight = 2, wild = 150;
var decade_mode = false, active_decade = 0, decadeMap = {}, active_years = [], countBar = {}, phaseCountBar = {}, countBarH = 80, colors = d3.scale.category20();
//    console.log(points.length);

var ANIMATE = false;
function initAnimation()
{
	loadPlaneData();
	loadDecades();
	initCharts("#plane-curves");
	loadCharts("#plane-curves", planes);
	//    startTimer();
}

function loadPlaneData()
{
	points = readJSON(points_file);
	phases = readJSON(phases_file);
	planes = readCSV(planes_file);
	//    console.log(phases);
	//    console.log()
	for (var i = 0, j = planes.length; i < j; i++) {
		idMap[planes[i].id] = i;
	}
	//    console.log(idMap);
	var cum = 0;
	for (var i = 0, j = phases.length; i < j; i++) {
		cum += phases[i].size;
		phases[i]["cum_size"] = cum;
		phaseMap[phases[i].code] = i;
	}
	console.log(phaseMap);
	console.log(phases);
	var counters = {
	};
	for (var k = 0, l = planes.length; k < l; k++) {
		for (var m = 0, n = target_color_categories.length; m < n; m++) {
			var category = target_color_categories[m];
			if (!counters[category])
				counters[category] = 0;
			if (!category_map[category])
				category_map[category] = {
				};
			if (!category_map[category][planes[k][category]]) {
				category_map[category][planes[k][category]] = {
					count : 1,
					id : counters[category]++
				};
			}
		}
		for (var i = 0, j = num_headers.length; i < j; i++) {
			planes[k][num_headers[i]] = parseInt(planes[k][num_headers[i]]);
			var phase = phases[phaseMap[planes[k].phase_code]];
			if (!phase) {
				//            console.log(planes[k].phase_code);
				planes[k]["phase_location"] = 0;
			} else {
				planes[k]["phase_location"] = phase.cum_size - phase.size + phase.size * Math.random() / 4;
			}
		}
		var phase = phases[phaseMap[planes[k].phase_code]];
		if (!phase) {
			//            console.log(planes[k].phase_code);
			planes[k]["phase_location"] = 0;
		} else {
			planes[k]["phase_location"] = phase.cum_size - phase.size * Math.random();
		}
	}
	for (var i = 0, j = num_headers.length; i < j; i++) {

		stats[num_headers[i]] = doNest(planes, "All", [num_headers[i]], false, false);
	}
	planesByYear = doNest(planes, "year", "year", true, true);

	console.log(category_map);
}

function updateActiveYears(min, max)
{
	active_years = [];
	for (var i = min; i <= max; i++) {

		if ( typeof ((planesByYear[keyMaps["year"][i]])) !== 'undefined') {
			active_years.push({
				year : i,
				t : 0
			});
		}
	}
	setSliderValues(active_years, delta);
	updateSliderValue(0);
	// console.log("Active Years");
	// console.log(active_years);

}

function doNest(data, key, measure, addList, addIndeces)
{
	if (!key)
		key = "All";
	if (!measure)
		measure = [key];
	if (!measure instanceof Array)
		measure = [measure];
	//    console.log(measure);

	var nested = d3.nest().key(function(d)
	{
		return d[key];
	}).sortKeys(d3.ascending).rollup(function(leaves)
	{
		//                console.log(leaves);
		if (leaves) {

			var item2 = {
				list : [],
				indeces : [],
				measures : []
			};
			for (var i = 0, j = measure.length; i < j; i++) {
				var item = {
					count : 0,
					sum : 0,
					max : 0,
					min : 0
				};
				item.count = leaves.length;
				item.sum = d3.sum(leaves, function(d)
				{
					//                            console.log(d);
					return d[measure[i]];
				});
				item.max = d3.max(leaves, function(d)
				{
					return d[measure[i]];
				});
				item.min = d3.min(leaves, function(d)
				{
					return d[measure[i]];
				});
				item2[measure[i]] = item;
				item2.measures.push(measure[i]);
			}
			for (var i = 0, j = leaves.length; i < j; i++) {
				//                        console.log(leaves[i].id)
				if (addList)
					item2.list.push(parseInt(leaves[i].id));
				if (addIndeces)
					item2.indeces.push(idMap[leaves[i].id]);
			}
			item2["key_name"] = key;
			return item2;
		}
	}).entries(data);
	keyMaps[key] = {
	};
	for (var i = 0, j = nested.length; i < j; i++) {
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

function loadDecades()
{
	var decdiv = $("#decades"), decselect = $("#decades-select");
	planesByDecade = doNest(planes, "decade", ["total_fatalities", "total_occupants"], true, true);
	//    console.log(planesByDecade);
	for (var i = 0, j = planesByDecade.length; i < j; i++) {

		var decade = planesByDecade[i].key, occupants = planesByDecade[i].values.total_occupants.sum;
		var fatalities = planesByDecade[i].values.total_fatalities.sum, survivors = occupants - fatalities;
		var perc_f = (occupants > 0) ? fatalities / occupants : 0;
		var perc_s = (occupants > 0) ? survivors / occupants : 0, tw = parseInt(decselect.css("width")), lw = tw / (j) - (10);
		if (perc_f + perc_s === 0)
			perc_f = perc_s = 0.5;
		decadeMap[decade] = i;
		//        console.log(decade + "\t" + lw + "\t" + tw + "\t" + perc_f + "\t" + perc_s);

		var option_item = '<li id="decade-select-' + decade + '" data-decade="' + decade + '" value="' + decade + '" ' + 'style="width:' + lw + 'px">' + '<table cellspacing="0" cellpadding="0">' + '<tr><td colspan="2" class="decade-span">';
		option_item += ((decade == '1900') ? 'Unkown' : decade + 's') + '</td></tr>' + '<tr><td class="died-span" style="width:' + (perc_f * 100) + '%"></td>' + '<td class="survived-span" style="width:' + (perc_s * 100) + '%"/></td></tr></table>' + '</li>';
		if (decade !== "NaN")
			decselect.append(option_item);
	}

	// var option_item = '<li id="decade-select-' + decade + '" data-decade="' + decade + '" value="' + decade + '" ' + 'style="width:' + lw + 'px">' + '<table cellspacing="0" cellpadding="0">' + '<tr><td colspan="2" class="decade-span">' + decade + 's</td></tr>' + '<tr><td class="died-span" style="width:' + (perc_f * 100) + '%"></td>' + '<td class="survived-span" style="width:' + (perc_s * 100) + '%"/></td></tr></table>' + '</li>';
	// decselect.append(option_item);

	$('#decades-select li').on("click", function(d)
	{
		var self = $(this);
		self.addClass('selected-decade').removeClass('highlighted-decade').siblings("li").removeClass('selected-decade');
		changeDecade(parseInt(self.attr('data-decade')));

		//        $('.object-year')

		//    console.log(self.attr('data-decade'));
	}).on("mouseover", function(d)
	{
		var decade = $(this).attr('data-decade');
		// console.log('highlighting ' + decade);
		if (!$(this).hasClass('selected-decade'))
			$(this).addClass('highlighted-decade');

		d3.selectAll(".g-curve-decade").style('opacity', .1);
		d3.selectAll("#g-curve-" + decade).style('opacity', 1);

	}).on("mouseleave", function(d)
	{
		$(this).removeClass('highlighted-decade');
		d3.selectAll('.g-curve-decade').style('opacity', default_opacity);
	});

}

function changeDecade(decade)
{
	console.log(decade);
	stopAnimation();
	active_decade = parseInt(decade);
	decade_mode = true;
	countBar.reset();
	resetBreziers();

	var data = [], list = planesByDecade[decadeMap[decade]].values.list;
	//    console.log(list);
	for (var i = 0, j = list.length; i < j; i++) {
		//        console.log(list[i]);
		data.push(planes[list[i]]);

	}
	//    console.log(data);

	loadCharts("#plane-curves", data, decade, decade + 9);
	//    startAnimation();

}

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

stackedBar = function(target_g, id)
{
	var self = {
	}, survived = 0, died = 0, total = 0, vis, bars, died_bar, survived_bar, survived_text, died_text, survived_count, died_count, w = parseInt($(target_g).css("width")), h = parseInt($(target_g).css("height"));
	console.log(target_g + " dim: " + w + "\t" + h);
	//    var h, w;
	self.draw = function()
	{
		//        console.log("drawing " + id);

		vis = d3.selectAll(target_g).append("svg");
		vis.append("g").attr("id", id).classed("stacked-bar", true);
		//                .attr("transform", "translate(" + 0 + "," + 0 + ")");
		//        console.log(id);

		bars = vis.selectAll("#" + id);

		survived_bar = bars.append("rect").attr("id", "survived-bar").attr({
			"x" : w / 2,
			"y" : h / 2,
			"width" : w / 2,
			"height" : h / 2
		});
		survived_text = bars.append("text").attr("id", "survivied-text").text("Survived").classed("bar-text", true).attr({
			"x" : w,
			"y" : h / 2 - svg_padding,
			"text-anchor" : "end"
		});
		survived_count = bars.append("text").attr("id", "survived-count").text("0").classed("bar-count", true).attr({
			"x" : w / 2 + svg_padding,
			"y" : h - svg_padding,
			"height" : h / 2 - 2 * svg_padding,
			"text-anchor" : "start"
		});

		died_bar = bars.append("rect").attr("id", "died-bar").attr({
			"x" : 0,
			"y" : h / 2,
			"width" : w / 2,
			"height" : h / 2
		});
		died_text = bars.append("text").attr("id", "died-text").text("Died").classed("bar-text", true).attr({
			"x" : 0,
			"y" : h / 2 - svg_padding,
			"text-anchor" : "start"
		});
		died_count = bars.append("text").attr("id", "died-count").text("0").classed("bar-count", true).attr({
			"x" : w / 2 - svg_padding,
			"y" : h - svg_padding,
			"height" : h / 2 - 2 * svg_padding,
			"text-anchor" : "end"
		});
		var axisScale = d3.scale.linear().domain([0, 100]).range([0, w]);
		var xAxis = d3.svg.axis().scale(axisScale).orient("top")
		//                .ticks(5)
		.tickValues([25, 50, 75]).tickSubdivide(20).tickSize(8, 8, 1).tickFormat(function(d)
		{
			return d + "%";
		});
		bars.append("g").attr("class", "counter-axis").call(xAxis).attr("transform", "translate(" + 0 + "," + (h / 2) + ")");

	};
	self.update = function(d1, d2, reset)
	{
		survived += d1;
		died += d2;
		total = survived + died;

		//        console.log(survived + "\t" + died);
		var sw = (reset) ? w / 2 : survived / total * w, dw = (reset) ? w / 2 : died / total * w;

		if (total > 0 || reset) {
			survived_count.style('font-size', '20px').transition().duration(duration / 2).text("" + survived).attr({
				"x" : dw + svg_padding
			}).style('font-size', '15px');

			died_count.style('font-size', '20px').transition().duration(duration / 2).text("" + died).attr({
				"x" : dw - svg_padding
			}).style('font-size', '15px');

			died_bar.transition().duration(duration / 2).attr({
				"width" : dw
			});
			survived_bar.transition().duration(duration / 2).attr({
				"width" : sw,
				"x" : dw
			});

		}

	};
	self.reset = function()
	{
		survived = 0;
		died = 0;

		self.update(0, 0, true);
	};
	self.draw();
	return self;
};

backgroundPhaseBarChart = function(target, id, w, h)
{
	var self = {
	}, data = [], min, max, ids = [], active = false, vis, yScale, xScale, measure;

	self.init = function(msr)
	{

		measure = msr;
		self.refreshData(active_years);
		// console.log(data);

		// console.log(max);
		if (!active)
			self.draw();
	};
	self.refreshData = function(year_list)
	{
		// console.log(year_list);
		ids = [];
		data = [];
		console.log(year_list);
		for (var i = 0, j = year_list.length; i < j; i++) {

			var year = (year_list[i].year) ? year_list[i].year : year_list[i];
			// console.log(year);
			var list = planesByYear[keyMaps["year"][year]].values.list;
			ids = $.merge(ids, list);
		}
		// console.log(ids);
		data = d3.nest().key(function(d)
		{
			//                    console.log(planes[idMap[d]]);
			return planes[idMap[d]].phase_code;
		}).key(function(d)
		{
			return planes[idMap[d]].year;
		}).sortKeys(d3.ascending).rollup(function(leaves)
		{
			if (measure === "count")
				return leaves.length;
			else
				return d3.sum(leaves, function(d)
				{
					return d[measure];
				});
		}).entries(ids);

		for (var i = 0, j = data.length; i < j; i++) {
			data[i]['sum'] = d3.sum(data[i].values, function(d)
			{
				return d.values;
			});
		}
		max = d3.max(data, function(d)
		{
			console.log(d);
			return d['sum'];
		});
		console.log('max=' + max);
		yScale = d3.scale.linear().domain([0, max]).range([0, h]);
		xScale = d3.scale.linear().domain([0, 1]).range([0, w]);
	};
	self.draw = function()
	{

		if (!active) {
			console.log('drawing ' + id);
			vis = d3.selectAll(target).select('svg').append("g").attr({
				'id' : id,
				'class' : "background-bar-chart"
			});
			vis.selectAll('rect').data(data).enter().append("rect").attr({
				x : function(d)
				{
					// console.log(d);
					var phase_code = d.key;
					var phase = phases[phaseMap[phase_code]];
					// console.log(phase);
					//console.log(phase);
					return xScale(phase.x);

				},
				y : h,
				width : function(d)
				{
					var phase_code = d.key;
					var phase = phases[phaseMap[phase_code]];
					return xScale(phase.size);
				},
				height : function(d)
				{
					return 0;
				},
				'id' : function(d)
				{
					return 'phase-chart-bar-' + d.key;
				},
				'class' : 'phase-chart-bar'
			});
		}
		active = true;
	};
	self.update = function(year)
	{
		if (!active) {
			self.init();
		}
		if (data.length > 0) {

			// console.log(data);
			console.log('updating ' + id);
			for (var i = 0, j = data.length; i < j; i++) {

				var val = 0, key = '#phase-chart-bar-' + data[i].key;
				// console.log(data[i]);
				for (var k = 0, l = data[i].values.length; k < l && data[i].values[k].key <= year; k++)
					val += data[i].values[k].values;
				console.log(val + "\t" + max);
				vis.select(key).transition().duration(duration).attr({
					height : function()
					{
						console.log(val + "\t" + yScale(val));
						return (val / max) * h;
					},
					'y' : h-val / max * h,
					'data-value' : val
				});
			}
		}
		// vis.selectAll('#'+id).data(data).transition().attr({
		// 'height' : function(d)
		// {
		// var val = yScale(d.values);
		// console.log(val);
		// return val;
		// }
		// });

	};
	// self.init("count");
	// self.draw();
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

function x(d)
{
	return d.x;
}

function y(d)
{
	return d.y;
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

function getSliderValue()
{
	return parseFloat($('#play-slider').val());
}

function updateSliderValue(value)
{
	if (value)
		$('#play-slider').val(value);
	else
		value = $('#play-slider').val();
	time = value;
	$('#slider-label').text(value);
	var year_index = parseInt(Math.floor(value));
	for (var i = 0, j = active_years.length; i < j; i++) {
		var year = active_years[i].year;
		var v = (i < year_index) ? 1 : (i === year_index) ? value % 1 : 0;

		if (v !== active_years[i].t) {
			updateCharts(year, v, true, true);
			active_years[i].t = v;
		}
	}
	if (year_index < active_years.length) {
		var year = active_years[year_index].year;
		if (year !== current_year) {

			current_year = year;
			phaseCountBar.update(year);
			$("#year-text").text("" + year);
		}
	}
}

function setSliderValues(values, step)
{
	$('#play-slider').attr({
		min : 0,
		max : values.length,
		step : step
	});
}