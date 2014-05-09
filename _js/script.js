/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

$(document).ready(function()
{
	init();
});

var width = 900, height = 500, bh = 0, bw = 0, default_opacity = .5, t = .5, time = 0, duration = 4000;
var max_duration = 6000, min_duration = 2000, acceleration = 1.2;
var first_year = 2100, current_year = 0, last_year, delta = .01, svg_padding = 5;
var min_r = 2, max_r = 25, padding = 10, margin = {
	top : 20,
	right : 100,
	bottom : 30,
	left : 40
}, points = [], points2 = [], points_file = "_data/points.json", phases = [], phases_file = "_data/phases.json", phaseMap = {
}, flight_natures = {
}, flight_damages = {
}, category_map = {
}, planes = [];
var planes_file = "_data/clean_planes_all.csv", planesByYear = {}, planesByDecade = {}, planesByYearPhase = {}, planeStats = {}, idMap = {}, keyMaps = {}, stats = {};
var num_headers = ["decade", "year", "month", "crew_occupants", "passengers_fatalities", "crew_fatalities", "total_fatalities", "total_occupants_old", "total_occupants", "passengers_occupants", "passengers_occupants_old"], target_color_categories = ['airplane_damage', 'nature', 'make'], circle_color_key = 'airplane_damage', beziers = {
}, pointsList = [], line = d3.svg.line().x(x).y(y).interpolate('cardinal'), n = 4, stroke = d3.scale.category20b(), orders = d3.range(2, n + 2), charts = {
}, last = 0, chartCount = 200, weight = 2, wild = 150;
var decade_mode = false, active_decade = 0, decadeMap = {}, active_years = [], countBar = {}, phaseCountBar = {}, countBarH = 80, colors = d3.scale.category20();
//    console.log(points.length);
var splines = {};
var ANIMATE = false;
var countStats = {};
var MAX_SPLINE_H = 100;

function init()
{
	loadPlaneData();
	prepareGroupedPlaneData();
	loadDecades();
updateActiveYears(2000, 2009);
	initPlaneChart("#plane-curves");
	
	prepareYearPoints('count', 2000, curvesW, curvesH);

	// updateSplines(1);

	// initCharts("#plane-curves");
	// loadCharts("#plane-curves", planes);
	//    startTimer();
}

function loadPlaneData()
{
	points = readJSON(points_file);
	phases = readJSON(phases_file);
	planes = readCSV(planes_file);

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
	// console.log(phaseMap);
	// console.log(phases);
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

	new_phases = [], x0 = 0;
	for (var i = 0, j = phases.length; i < j; i++) {
		if (phases[i].size > 0) {
			phases[i].x = x0;
			x0 += phases[i].size;
			new_phases.push(phases[i]);
		}
	}
	// planesByYear = doNest(planes, "year", "year", true, true);

	// console.log(category_map);
}

var target_measures = ["total_fatalities", "total_occupants", "total_survivors", "ground_casualties"];
function prepareGroupedPlaneData()
{

	planesByYearPhase = d3.nest().key(function(d)
	{
		return parseInt(d.year);
	}).sortKeys(d3.ascending).key(function(d)
	{
		return d.phase_code;
	}).rollup(function(leaves)
	{
		item = {};
		for (var i = 0, j = target_measures.length; i < j; i++) {
			tm = target_measures[i];
			item[tm] = computeStats(leaves, tm);
		}
		return item;
	}).entries(planes);
	planesByYear = d3.nest().key(function(d)
	{
		return parseInt(d.year);
	}).sortKeys(d3.ascending).rollup(function(leaves)
	{
		item = {};
		for (var i = 0, j = target_measures.length; i < j; i++) {
			tm = target_measures[i];
			item[tm] = computeStats(leaves, tm);
		}
		return item;
	}).entries(planes);
	for (var i = 0, j = planesByYearPhase.length; i < j; i++) {
		planesByYearPhase[i].values = flattenNest(planesByYearPhase[i].values);
	}

	planesByYearPhase = flattenNest(planesByYearPhase);
	planesByYear = flattenNest(planesByYear);

	planesByDecade = d3.nest().key(function(d)
	{
		return parseInt(d.decade);
	}).sortKeys(d3.ascending).rollup(function(leaves)
	{
		item = {};
		for (var i = 0, j = target_measures.length; i < j; i++) {
			tm = target_measures[i];
			item[tm] = computeStats(leaves, tm);
		}
		var years = [], decade = parseInt(leaves[0].decade);
		for (var i = 0; i < 10; i++)
			if ( typeof (planesByYear[decade + i]) !== 'undefined')
				years.push(decade + i);
		item['years'] = years;
		return item;
	}).entries(planes);

	planeStats = d3.nest().key(function(d)
	{
		return 'All';
	}).sortKeys(d3.ascending).rollup(function(leaves)
	{
		item = {};
		for (var i = 0, j = target_measures.length; i < j; i++) {
			tm = target_measures[i];
			item[tm] = computeStats(leaves, tm);
		}
		return item;
	}).entries(planes);
	// console.log(planesByYearPhase);

	planesByDecade = flattenNest(planesByDecade);
	planeStats = flattenNest(planeStats);
	planeStats = planeStats['All'];
	// console.log(planesByYearPhase);
	// console.log(planesByYear);
	// console.log(planesByDecade);
	// console.log(planeStats);
}

function flattenNest(data)
{
	var item = {};
	for (var i = 0, j = data.length; i < j; i++) {
		item[data[i].key] = data[i].values;
		if (data[i].values['total_fatalities']) {
			item[data[i].key]["count"] = data[i].values['total_fatalities']['count'];
		} else {

			var count = 0;
			var count_list;
			for (var v in data[i].values) {
				count += data[i].values[v]['count'];
			}
			item[data[i].key]["count"] = count;
		}
	}
	return item;
}

function computeStats(data, tm)
{
	var list = [];
	for (var i = 0, j = data.length; i < j; i++)
		if (data[i].id)
			list.push(data[i].id);

	var item = {
		'count' : data.length,
		'sum' : d3.sum(data, function(d)
		{
			// console.log(d[tm]);
			return d[tm];
		}),
		'max' : d3.max(data, function(d)
		{
			return parseInt(d[tm]);
		}),
		'min' : d3.min(data, function(d)
		{
			return parseInt(d[tm]);
		}),
		'list' : list
	};

	return item;
}

function computeCountStats(dataDict)
{
	var sum, max, min, data = [], tm = 'count';

	for (var d in dataDict) {
		// console.log(dataDict[d]);
		data.push(dataDict[d][tm]);
	}
	// console.log(data);
	var item = {
		'sum' : d3.sum(data, function(d)
		{
			// console.log(d[tm]);
			return d;
		}),
		'max' : d3.max(data, function(d)
		{
			return parseInt(d);
		}),
		'min' : d3.min(data, function(d)
		{
			return parseInt(d);
		})
	};
	console.log(item);
	return item;
}

function prepareYearPoints(measure, decade, w, h)
{
	var sum, max, min, years = [];
	if (!measure)
		measure = 'count';

	if (decade) {
		if (measure == 'count') {
			decades = {};
			console.log(planesByDecade[decade]);
			years = planesByDecade[decade]['years'];
			for (var i = 0, j = years.length; i < j; i++) {
				var year = planesByDecade[decade]['years'][i];
				decades[year] = planesByYear[year];
			}
			countStats = computeCountStats(decades);
			sum = countStats['sum'];
			max = countStats['max'];
			min = countStats['min'];
		} else {
			sum = planesByDecade[decade][measure].sum;
			max = planesByDecade[decade][measure].max;
			min = planesByDecade[decade][measure].min;
		}
	} else {

		for (var y in planesByYear) {
			years.push(y);
		}
		if (measure == 'count') {
			countStats = computeCountStats(planesByYear);
			sum = countStats['sum'];
			max = countStats['max'];
			min = countStats['min'];
		} else {
			sum = planeStats[measure].sum;
			max = planeStats[measure].max;
			max = planeStats[measure].min;
		}
	}

	console.log(sum + '\t' + max + '\t' + min);
	console.log(years);

	for (var i = 0, j = years.length; i < j; i++) {
		var year = years[i], y0 = .2, plane = planesByYearPhase[year];
		// console.log(plane);

		var point_count = new_phases.length;
		for (var p = new_phases.length - 1; p >= 0; p--) {
			var phaseV = new_phases[p], phaseStats = plane[phaseV.code], pts1 = [], pts2 = [];
			// console.log(phaseStats);
			if (phaseStats) {
				thickness = phaseStats[measure] / max / 2;
				thicknessActual = thickness * h;
				pts1.push({
					'x' : 0,
					'y' : y0 * h
				});

				pts2.push({
					'x' : 0,
					'y' : (y0 + thickness) * h
				});
				for (var k = 0; k < point_count; k++) {
					var phaseH = new_phases[k];
					// console.log(phaseH.cum_size+"\t"+k)

					if (k === point_count - 1 && Math.round(phaseV.cum_size * 100) === 100) {
						console.log('last_point');
						y1 = 1 * h;
						y2 = (1 + thickness) * h;
						x1 = phaseH.cum_size * w;
						x2 = phaseH.cum_size * w;
					} else if (phaseH.cum_size < phaseV.cum_size) {
						y1 = y0 * h;
						y2 = (y0 + thickness) * h;
						x1 = phaseH.cum_size * w;
						x2 = phaseH.cum_size * w;

					} else if (phaseH.code === phaseV.code) {
						// y1 = y0;
						// y2 = y0 + thickness;
						// x1 = phaseH.cum_size;
						// x2 = phaseH.cum_size;
						// pts1.push({
						// 'x' : x1,
						// 'y' : y1
						// });
						// pts2.push({
						// 'x' : x2,
						// 'y' : y2
						// });
						y1 = y0 * h;
						y2 = (y0 + thickness) * h;
						x1 = phaseH.cum_size * w;
						x2 = phaseH.cum_size * w - thicknessActual / 2;

					} else {
						y1 = h;
						y2 = h;
						x1 = phaseV.cum_size * w;
						x2 = phaseV.cum_size * w - thicknessActual;

					}
					pts1.push({
						'x' : x1,
						'y' : y1
					});
					pts2.push({
						'x' : x2,
						'y' : y2
					});

				}
				y0 += thickness;
				planesByYearPhase[year][phaseV.code]['points'] = [pts1, pts2];
			}

		}
	}

	console.log(planesByYearPhase[year]);
}

function updateActiveYears(min, max)
{
	active_years = [];
	for (var i = min; i <= max; i++) {

		if ( typeof ((planesByYear[i])) !== 'undefined') {
			active_years.push({
				year : i,
				t : 0
			});
		}
	}
	setSliderValues(active_years, delta);
	// updateSliderValue(0);
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
	// planesByDecade = doNest(planes, "decade", ["total_fatalities", "total_occupants"], true, true);
	//    console.log(planesByDecade);
	decadeCount = 0;
	for (var decade in planesByDecade)
	decadeCount++;
	var tw = parseInt(decselect.css("width")), lw = tw / (decadeCount) - (10);
	for (var decade in planesByDecade) {

		var occupants = planesByDecade[decade].total_occupants.sum;
		var fatalities = planesByDecade[decade].total_fatalities.sum, survivors = occupants - fatalities;
		var perc_f = (occupants > 0) ? fatalities / occupants : 0;
		var perc_s = (occupants > 0) ? survivors / occupants : 0;
		if (perc_f + perc_s === 0)
			perc_f = perc_s = 0.5;
		// decadeMap[decade] = i;
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

/************
 *  DRAW SVGs
 ************************/
var curvesH = 150;
var curvesW;
function initPlaneChart(target)
{

	var svgw = parseInt($(target).css("width")), svgh = parseInt($(target).css("height"));
	bw = svgw;
	bh = svgh;

	var w = bw, h = bh;
	curvesW = w;
	var x = d3.scale.ordinal().rangeRoundBands([0, w], .1);
	var y = d3.scale.linear().rangeRound([h, 0]);
	var color = d3.scale.ordinal().range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);
	var xAxis = d3.svg.axis().scale(x).orient("bottom");
	var vis = d3.select(target).selectAll("svg").data([points.length]).enter().append("svg").attr("width", svgw).attr("height", svgh).append("g").attr("id", target.split("#")[1] + "-top").append("g").attr("id", "breziers-group");
	//            .attr("transform", "translate(" + 0 + "," + 0 + ")");
	countBar = stackedBar("#counter-chart", "count-stacked-bar");
	phaseCountBar = backgroundPhaseBarChart(target, "phase-bar-count", w, h - curvesH, 0, curvesH);
	initGradient(vis);
	vis.append("g").attr("class", "x axis").attr("transform", "translate(0," + h + ")").call(xAxis);
	drawPhaseLines(vis, w, curvesH);
	drawYearText(vis, w / 2, curvesH - 10);

	initSplines(target, "g-splines", w, curvesH, 0, 0, active_years);
	// drawDecadeGroups();
	//vis.append("g").attr("class", "g-curves");
}

function initGradient(vis)
{
	for (var i = 0, j = new_phases.length; i < j; i++) {
		var phase = new_phases[i];
		var gradient = vis.append("svg:defs").append("svg:linearGradient").attr("id", "gradient-" + phase.code).attr({
			"x1" : "0%",
			"y1" : "0%",
			"x2" : "100%",
			"y2" : "0%",
			"spreadMethod" : "pad"
		});

		gradient.append("svg:stop").attr({
			"offset" : ((phase.cum_size - phase.size) * 100) + "%",
			"stop-color" : "#fff",
			"stop-opacity" : 1
		});

		gradient.append("svg:stop").attr({
			"offset" : (phase.cum_size * 100 + 5) + "%",
			"stop-color" : "#f00",
			"stop-opacity" : 1
		});
	}

}

var new_phases = [];
function drawPhaseLines(vis, w, h, trans_x, trans_y)
{
	if (!trans_x)
		trans_x = 0;
	if (!trans_y)
		trans_y = 0;

	var phase_lines = vis.append("g").attr("class", "g-phases").attr("transform", "translate(" + trans_x + "," + trans_y + ")").selectAll(".phase-line").data(new_phases).enter();
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

}

function drawYearText(vis, xc, yc)
{
	vis.append("g").attr("class", "g-year").append("text").attr({
		"id" : "year-text",
		"text-anchor" : "middle",
		"y" : xc,
		"x" : yc
	});
}

function initSplines(target, id, w, h, trans_x, trans_y, years)
{
// console.log(years);
console.log(new_phases);
	var vis = d3.select(target).select('svg').append('g').attr({
		'id' : id
	}).attr("transform", "translate(" + trans_x + "," + trans_y + ")");
	for (var k = 0, l = years.length; k < l; k++) {
		var year = (years[k].year)? years[k].year: years[k];
		// console.log('init spline '+ year)
		splines[year] = {};
		for (var i = 0, j = new_phases.length; i < j; i++) {
			var data = [{
				key : 'phase_code',
				value : new_phases[i]['code']
			}, {
				key : 'year',
				'value' : year
			}];
			
			var id2 = 'spline-' + new_phases[i]['code'] + '-' + year;
			var spline = splineLine(target, '#' + id, id2, data, i, new_phases[i]['code'], year, w, h);

			splines[year][new_phases[i]['code']] = spline;
		}
	}
	console.log(splines);

}




splineLine = function(target, target_g, id, data, index, phase, year, w, h)
{
	var self = {}, vis = d3.select(target_g);

	self.draw = function()
	{
		vis.append('path').attr({
			'd' : line,
			'class' : 'curve',
			'id' : id
		}).style({
			'fill' : "url(#gradient-" + phase + ")",
			'stroke' : "url(#gradient-" + phase + ")"
		});
		id = '#' + id;
		vis = vis.select(id);
		for (var i = 0, j = data.length; i < j; i++) {
			vis.attr('data-' + data[i]['key'], data[i]['value']);
		}

	};

	self.update = function(t0)
	{
		// console.log();
		if (planesByYearPhase[year][phase]) {
			//TODO: could move to init
			var pts1 = planesByYearPhase[year][phase]['points'][0];
			var pts2 = planesByYearPhase[year][phase]['points'][1];
			// pts1 = scalePoints(pts1, w, h);
			// pts2 = scalePoints(pts2, w, h);

			// console.log(pts1);
			// console.log(pts2);

			vis.datum(function()
			{
				var c = getCurve(0, pts1, 0, t0);
				var c2 = getCurve(0, pts2, 0, t0);
				for (var i = c2[0].length - 1; i >= 0; i--)
					c[0].push(c2[0][i]);
				c[0].push(c[0][0]);
				// console.log(t0);
				return c[0];
			}).attr({
				'd' : line
			});
		}
	};
	self.draw();
	// d3.timer(function(elapsed){
	//
	// })
	// line.interpolate('cardinal');
	return self;
};
function scalePoints(pts, w, h)
{
	for (var i = 0, j = pts.length; i < j; i++) {
		pts[i].x *= w;
		pts[i].y *= h;
	}
	return pts;
}
var cycles = 0;
d3.timer(function(elapsed)
{
	t = (t + (elapsed - last) / 5000) % 1;
	//    t=1
	last = elapsed;
	time+=t;
	cycle = Math.floor(time)%10;
	updateSplines(t, 2000+cycle);

});

function updateSplines(t0, year)
{
	// console.log("splines "+splines.length)
	// console.log(year);
	for (var s in splines[year])
	{
		// console.log(s);
		splines[year][s].update(t0);
	}
}

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

function getCurve(i, pts, start, end)
{
	d = pts.length;
	// var curve = beziers[i][d];
	var curve;
	if (!curve) {
		// curve = beziers[i][d] = [];
		curve = [];
		for (var t_ = 0; t_ <= 1; t_ += delta) {
			var x = getLevels(d, t_, pts);
			curve.push(x[x.length - 1][0]);
		}
	}
	// console.log(curve);
	if (!start)
		start = 0;
	return [curve.slice(start / delta, end / delta + 1)];
}

stackedBar = function(target_g, id)
{
	var self = {
	}, survived = 0, died = 0, total = 0, vis, bars, died_bar, survived_bar, survived_text, died_text, survived_count, died_count;
	var w = parseInt($(target_g).css("width")), h = parseInt($(target_g).css("height"));
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

backgroundPhaseBarChart = function(target, id, w, h, trans_x, trans_y)
{
	var self = {
	}, data = [], min, max, ids = [], active = false, vis, yScale, xScale, measure;
	if (!trans_x)
		trans_x = 0;
	if (!trans_y)
		trans_y = 0;
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
			}).attr("transform", "translate(" + trans_x + "," + trans_y + ")");
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
					'y' : h - val / max * h,
					'data-value' : val
				});
			}
		}

	};
	return self;

};

function x(d)
{
	return d.x;
}

function y(d)
{
	return d.y;
}

/**********************
 *  SLIDER
 *******************/
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
