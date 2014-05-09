/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

$(document).ready(function()
{
	init();
});

var width = 900, height = 500, bh = 0, bw = 0, default_opacity = .5, t = .5, time = 0, duration = 500;
var max_duration = 5000, min_duration = 500, acceleration = 1.2;
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
}, pointsList = [], line = d3.svg.line().x(x).y(y), n = 4, stroke = d3.scale.category20b(), orders = d3.range(2, n + 2), charts = {
}, last = 0, chartCount = 200, weight = 2, wild = 150;
var decade_mode = false, active_decade = 0, decadeMap = {}, active_years = [], countBar = {}, phaseCountBar = {}, countBarH = 80, colors = d3.scale.category20();
//    console.log(points.length);
var splines = {};
var ANIMATE = false;
var countStats = {};
var MAX_SPLINE_H = 100;
var SPLINE_MEASURE = 'count', CHART_MEASURE = 'count';
var timeLineChart;
var worst = {}, weird = {};

function init()
{
	setupInteractions();
	loadPlaneData();
	prepareGroupedPlaneData();
	loadDecades();
	$('#chart-area').show();
	// updateActiveYears(2000, 2009);
	updateActiveYears(1900, 2014);
	initPlaneChart("#plane-curves");

	prepareYearPoints('count', false, curvesW, curvesH);

	// updateSplines(1);

	// initCharts("#plane-curves");
	// loadCharts("#plane-curves", planes);
	//    startTimer();
}

function setupInteractions()
{
	$('.measure-option').on('click', function()
	{

		var self = $(this);
		changeBarMeasure(self.attr('data-measure'));
		self.siblings().removeClass('selected-side-menu-item').addClass('unselected-side-menu-item');
		self.removeClass('unselected-side-menu-item').addClass('selected-side-menu-item');
	});

	$('#play-slider').on('mousedown', function()
	{
		stopAnimation();
	});

	$('#top-menu-tabs ul li').on('click', function()
	{
		var self = $(this);

		var target = self.attr('data-target');
		console.log(target);
		var active_view = $('.active-view').attr('data-target');
		var old_id = $('.active-view').attr('id');
		console.log(old_id)
		$('.selected-top-menu-item').removeClass('selected-top-menu-item').addClass('top-menu-item');
		self.addClass('selected-top-menu-item').removeClass('top-menu-item');
		$('#' + old_id).removeClass('active-view').fadeOut(500);
		$('.view').hide();
		$('#' + target).addClass('active-view').fadeIn(500);

		if (target === 'chart-area')
			$('#sub-menu').fadeIn(500);
		else
			$('#sub-menu').fadeOut(500);

	})
	$('#story-div').on('click', function()
	{
		$(this).fadeOut(500);
	})
}

function loadPlaneData()
{
	points = readJSON(points_file);
	phases = readJSON(phases_file);
	planes = readCSV(planes_file);

	for (var i = 0, j = planes.length; i < j; i++) {
		idMap[planes[i].id] = i;
		if (planes[i].worst_flag != 0)
			worst[planes[i].worst_flag] = i;

		if (planes[i].unusual_flag != 0)
			weird[planes[i].unusual_flag] = i;
	}
	fillList('#worst-list', worst);
	fillList('#weird-list', weird);
	$('.rank-list li').on('click', function(d)
	{
		index = parseInt($(this).attr('data-i'));

		$('#story-div').empty().html(formatPlaneLong(index)).css("visibility", "visible").fadeIn(500).css("top", function()
		{
			return (event.pageY - 60) + "px";
		}).css("left", function()
		{
			return (event.pageX + 30) + "px";
		});
	})

	console.log(worst);
	console.log(weird);
	//    console.log(idMap);
	var cum = 0;
	for (var i = 0, j = phases.length; i < j; i++) {
		cum += phases[i].size;
		phases[i]["cum_size"] = Math.round(cum * 100) / 100;
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
	// for (var i = 0, j = num_headers.length; i < j; i++) {
	//
	// stats[num_headers[i]] = doNest(planes, "All", [num_headers[i]], false, false);
	// }

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

var target_measures = ["total_fatalities", "total_occupants", "total_survivors", "ground_casualties", 'count'];
var target_measures_titles = {
	"total_fatalities" : 'Fatalities',
	"total_occupants" : 'Occupants',
	"total_survivors" : 'Suvivors',
	"ground_casualties" : 'Ground Casualties',
	'count' : '# of Accidents'
};
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
	// console.log(item);
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
			// console.log(planesByDecade[decade]);
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

	// console.log(sum + '\t' + max + '\t' + min);
	// console.log(years);

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
					'y' : (y0 * h) + thicknessActual
				});
				for (var k = 0; k < point_count; k++) {
					var phaseH = new_phases[k];
					// console.log(phaseH.cum_size+"\t"+k)

					if (k === point_count - 1 && Math.round(phaseV.cum_size * 100) === 100) {
						// console.log('last_point');
						y1 = 1 * h;
						y2 = 1 * h;
						x1 = phaseH.cum_size * w;
						x2 = phaseV.cum_size * w - thicknessActual;
					} else if (phaseH.cum_size < phaseV.cum_size) {
						y1 = y0 * h;
						y2 = (y0 + thickness) * h;
						x1 = phaseH.cum_size * w;
						x2 = phaseH.cum_size * w;

					} else if (phaseH.code === phaseV.code) {
						y1 = y0 * h;
						y2 = y0 * h + thicknessActual;
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
					if (k === point_count - 1) {
						pts1.push({
							'x' : x1,
							'y' : y1
						});
						pts2.push({
							'x' : x2,
							'y' : y2
						});
					}
				}

				y0 += thickness;
				planesByYearPhase[year][phaseV.code]['points'] = [pts1, pts2];
			}

		}
	}

	// console.log(planesByYearPhase[year]);
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
	updateActiveYears(active_decade, active_decade + 9);
	prepareYearPoints(SPLINE_MEASURE, decade, curvesW, curvesH);
	decade_mode = true;
	countBar.reset();

	// resetBreziers();

	var data = [], years = planesByDecade[decade].years;
	//    console.log(list);
	for (var i = 0, j = years.length; i < j; i++) {
		//        console.log(list[i]);
		data.push(planes[years[i]]);

	}
	//    console.log(data);

	// loadCharts("#plane-curves", data, decade, decade + 9);
	phaseCountBar.refreshData(active_years);
	timeLineChart.refreshData(active_years);
	updateSliderValue(0);
	//    startAnimation();

}

function changeBarMeasure(measure)
{
	console.log('changing bar measure ' + measure);
	CHART_MEASURE = measure;
	phaseCountBar.changeMeasure(measure);
	timeLineChart.changeMeasure(measure)
}

function changeSplineMeasure(measure)
{

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

	timeLineChart = lineChart('#narratives', 'time-line-chart');
	initGradient(vis);
	vis.append("g").attr("class", "x-axis").attr("transform", "translate(0," + h + ")").call(xAxis);
	drawPhaseLines(vis, w, curvesH);
	// drawYearText(vis, 20, curvesH - 10);

	initSplines(target, "g-splines", w, curvesH, 0, 0, active_years);
	// drawDecadeGroups();
	//vis.append("g").attr("class", "g-curves");
}

function initGradient(vis)
{
	for (var i = 0, j = new_phases.length; i < j; i++) {
		var phase = new_phases[i];
		// var gradient = vis.append("svg:defs").append("svg:linearGradient").attr("id", "gradient-" + phase.code).attr({
		// "x1" : "0%",
		// "y1" : "0%",
		// "x2" : "100%",
		// "y2" : "0%",
		// "spreadMethod" : "pad"
		// });
		//
		// gradient.append("svg:stop").attr({
		// "offset" : ((phase.cum_size - phase.size) * 100) + "%",
		// "stop-color" : "#fff",
		// "stop-opacity" : 1
		// });
		//
		// gradient.append("svg:stop").attr({
		// "offset" : (phase.cum_size * 100 + 5) + "%",
		// "stop-color" : "#f00",
		// "stop-opacity" : 1
		// });
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

function initSplines(target, id, w, h, trans_x, trans_y)
{

	var vis = d3.select(target).select('svg').append('g').attr({
		'id' : id
	}).attr("transform", "translate(" + trans_x + "," + trans_y + ")");

	for (var i = 0, j = new_phases.length; i < j; i++) {
		var data = [{
			key : 'phase_code',
			value : new_phases[i]['code']
		}];

		var id2 = 'spline-' + new_phases[i]['code'];
		var spline = splineLine(target, '#' + id, id2, data, i, new_phases[i]['code'], w, h);

		splines[new_phases[i]['code']] = spline;
	}

	// console.log(splines);

}

splineLine = function(target, target_g, id, data, index, phase, year, w, h)
{
	var self = {}, vis = d3.select(target_g), gradient = d3.select('#gradient-' + phase);

	self.draw = function()
	{
		self.initGradient();
		vis.append('path').attr({
			'd' : line,
			'class' : 'curve',
			'id' : id
		}).style({
			'fill' : "url(#gradient-" + phase + ")",
			'stroke' : "url(#gradient-" + phase + ")",
			'opacity' : .9
			// 'stroke-width': '0px'
		});
		id = '#' + id;
		vis = vis.select(id);
		for (var i = 0, j = data.length; i < j; i++) {
			vis.attr('data-' + data[i]['key'], data[i]['value']);
		}
		vis.on('mouseenter', function()
		{

			var me = $(this);

			$("#tooltip").css("visibility", "visible").html(parseTooltipText(me)).css("top", function()
			{
				return (event.pageY - 60) + "px";
			}).css("left", function()
			{
				return (event.pageX + 30) + "px";
			});
			console.log('displaying tooltip');

		}).on('mouseleave', function()
		{
			d3.select("#tooltip").style("visibility", "hidden");
		});
	};
	self.initGradient = function()
	{
		gradient = vis.append("svg:defs").append("svg:linearGradient").attr("id", "gradient-" + phase).attr({
			"x1" : "0%",
			"y1" : "0%",
			"x2" : "100%",
			"y2" : "0%",
			"spreadMethod" : "pad"
		});

		gradient.append("svg:stop").attr({
			// "offset" : ((phase.cum_size - phase.size) * 100) + "%",
			"offset" : "0%",
			"stop-color" : "#fff",
			"stop-opacity" : 1,
			'id' : "gradient-" + phase + "-1"
		});

		gradient.append("svg:stop").attr({
			// "offset" : (phase.cum_size * 100 + 5) + "%",
			"offset" : "100%",
			"stop-color" : "rgba(255,100,100,.5)",
			"stop-opacity" : 1,
			'id' : "gradient-" + phase + "-2"
		});
		gradient = vis.select('#gradient-' + phase);
	};
	self.reset = function(){
		vis.datum([{'x':0,'y':0}]).attr({
				'd' : line,})
	}
	self.update = function(t0, year)
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
			var phc = phases[phaseMap[phase]].cum_size - phases[phaseMap[phase]].size;

			x1 = (phc > t0) ? '100%' : (1 - (t0 - phc)) * 100 + "%";
			gradient.attr('x1', x1);

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
				'd' : line,
				'data-year' : year,
				'data-phase' : phase,
				'data-key' : SPLINE_MEASURE,
				'data-value' : planesByYearPhase[year][phase][SPLINE_MEASURE]
			});
		} else {
			vis.datum([{
				'x' : 0,
				'y' : 0
			}]).attr('d', line);
		}
	};
	self.draw();
	return self;
};
function parseTooltipText(me)
{
	var key = target_measures_titles[me.attr('data-key')];
	var val = me.attr('data-value');
	var year = me.attr('data-year');
	var ph = (me.attr('data-phase')) ? phases[phaseMap[me.attr('data-phase')]].name : "";

	var html = "";
	if (ph)
		html += "<span class='tooltip-key'>" + ph + " </span><br>";
	html += "<span class='tooltip-key'>" + year + " </span><br>";
	html += "<span class='tooltip-key'>" + key + ": </span>";
	html += " <span class='tooltip-value'>" + val + "</span>";
	return html;
}

function scalePoints(pts, w, h)
{
	for (var i = 0, j = pts.length; i < j; i++) {
		pts[i].x *= w;
		pts[i].y *= h;
	}
	return pts;
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
	// console.log(target_g + " dim: " + w + "\t" + h);
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
	/*
	 self.update2 = function(d1, d2, reset)
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

	 };*/
	self.update = function(year, phase, reset)
	{
		var dur = min_duration;
		// console.log('updating countBar');
		// var sw = (reset) ? w / 2 : survived / total * w, dw = (reset) ? w / 2 : died / total * w;
		survived = 0;
		died = 0;
		if (year) {
			for (var i = 0, j = active_years.length; i < j && active_years[i].year < year; i++) {
				var yr = active_years[i].year;

				died += planesByYear[yr]['total_fatalities'].sum;
				survived += planesByYear[yr]['total_survivors'].sum;

			}
			// console.log(phase);
			if (phase)
				for (var i = 0, j = new_phases.length; i < j; i++) {
					var ph = new_phases[i].code;
					if (planesByYearPhase[year][ph]) {
						// console.log('adding '+ph+'\t'+year)
						died += planesByYearPhase[year][ph]['total_fatalities'].sum;
						survived += planesByYearPhase[year][ph]['total_survivors'].sum;
					}
					if (ph === phase)
						break;
				}
		}

		var prev_total = total;
		total = survived + died;
		// console.log(year + '\t' + phase + '\t' + survived + '\t' + died + '\t' + total + '\t' + prev_total);
		var sw = (total === 0 || reset) ? w / 2 : survived / total * w, dw = (total == 0) ? w / 2 : died / total * w;

		// if (total > 0) {
		if (total !== prev_total) {
			survived_count.style('font-size', '20px').transition().duration(dur).text("" + survived).attr({
				"x" : dw + svg_padding
			}).style('font-size', '15px');

			died_count.style('font-size', '20px').transition().duration(dur).text("" + died).attr({
				"x" : dw - svg_padding
			}).style('font-size', '15px');

			died_bar.transition().duration(dur).attr({
				"width" : dw
			});
			survived_bar.transition().duration(dur).attr({
				"width" : sw,
				"x" : dw
			});
		}
		// }
	};
	self.reset = function()
	{
		survived = 0;
		died = 0;

		self.update(false, false, true);
	};
	self.draw();
	return self;
};

backgroundPhaseBarChart = function(target, id, w, h, trans_x, trans_y)
{
	var self = {
	}, data = {}, min, max, ids = [], active = false, vis, yScale, xScale, measure;
	var last_used_year, last_t0;
	if (!trans_x)
		trans_x = 0;
	if (!trans_y)
		trans_y = 0;
	self.init = function(msr)
	{
		if (!msr)
			msr = CHART_MEASURE;
		self.refreshData(active_years);
		self.changeMeasure(msr);
		if (!active)
			self.draw();
	};
	self.changeMeasure = function(msr)
	{
		measure = msr;
		d3.select('#phase-chart-bar-title').transition().duration(duration).text(target_measures_titles[measure]);
		yScale = d3.scale.linear().domain([0, max[measure]]).range([0, h]);
		xScale = d3.scale.linear().domain([0, 1]).range([0, w]);
		self.draw();
		self.update(last_used_year);
	};
	self.refreshData = function(years)
	{
		// console.log(year_list);
		ids = [];
		data = {};
		max = {};
		for (var k = 0, l = target_measures.length; k < l; k++) {
			var tm = target_measures[k];
			max[tm] = 0;
			data[tm] = {};
			for (var p = 0, q = new_phases.length; p < q; p++) {
				var phase = new_phases[p].code;
				// console.log(phase);

				data[tm][phase] = {};
				var counter = 0;
				for (var i = 0, j = years.length; i < j; i++) {
					var year = (years[i].year) ? years[i].year : years[i];
					// console.log(planesByYearPhase[year][phase]);
					if (planesByYearPhase[year][phase]) {
						counter += (tm === 'count') ? planesByYearPhase[year][phase][tm] : planesByYearPhase[year][phase][tm]['sum'];
					}
					data[tm][phase][year] = counter;
					if (counter > max[tm])
						max[tm] = counter;

				}
			}
		}
		// console.log(data);
		// console.log(max);

	};
	self.draw = function()
	{

		if (!active) {
			active = true;
			console.log('drawing ' + id);
			vis = d3.selectAll(target).select('svg').append("g").attr({
				'id' : id,
				'class' : "background-bar-chart"
			}).attr("transform", "translate(" + trans_x + "," + trans_y + ")");
			vis.selectAll('rect').data(new_phases).enter().append("rect").attr({
				x : function(d)
				{
					return xScale(d.x);
				},
				y : 0,
				width : function(d)
				{
					return xScale(d.size);
				},
				height : function(d)
				{
					return 0;
				},
				'id' : function(d)
				{
					return 'phase-chart-bar-' + d.code;
				},
				'class' : 'phase-chart-bar'
			});

			vis.selectAll('.phase-chart-bar').on('mouseenter', function()
			{

				var me = $(this);
				$("#tooltip").css("visibility", "visible").html(parseTooltipText(me)).css("top", function()
				{
					return (event.pageY - 30) + "px";
				}).css("left", function()
				{
					return (event.pageX - 30) + "px";
				});
				console.log('displaying tooltip');

			}).on('mouseleave', function()
			{
				d3.select("#tooltip").style("visibility", "hidden");
			});
			vis.append('text').attr({
				'id' : 'phase-chart-bar-title',
				'class' : 'chart-title',
				'x' : w - 20,
				'y' : h - 10,
				'text-anchor' : 'end'
			}).text(target_measures_titles[measure]);
			id = '#' + id;
			vis = vis.select(id);
		}

	};
	self.reset = function()
	{
		for (var i = 0, j = new_phases.length; i < j; i++) {
			var ph =new_phases[i].code;
			key = '#phase-chart-bar-' + ph;
			vis.select(key).transition().duration(dur).attr({
				height : function()
				{
					// console.log(val + "\t" + yScale(val));
					return 0;
				},
				// 'y' : 0,
				'data-value' : val,
				'data-key' : measure,
				// 'data-year' : year,
				'data-phase' : ph
			});

		}
	};
	self.update = function(year, phase, value, reset)
	{
		// if (phase === 'LDG')
		// console.log(phase + '\t' + value);
		dur = min_duration;
		if (!active) {
			self.init();
		}
		if (!year)
			year = last_used_year;
		last_used_year = year;

		// last_phase = phase;
		vis = d3.select(id);

		if (!measure)
			measure = CHART_MEASURE;
		mname = target_measures_titles[measure];
		var toUpdate = [];
		var toReturn = [];
		stopUpdate = false;
		if (phase)
			for (var i = 0, j = new_phases.length; i < j; i++) {
				var ph = new_phases[i].code;
				if (data[measure][ph][year] && !stopUpdate) {
					toUpdate.push(ph);

				}
				if (stopUpdate) {
					toReturn.push(ph);
				}
				if (ph === phase) {
					if (i === j - 1)
						toUpdate.push(ph);
					stopUpdate = true;
				}

			}

		for (var i = 0, j = toUpdate.length; i < j; i++) {
			ph = toUpdate[i];

			key = '#phase-chart-bar-' + ph;
			// console.log(key);
			// val = (value>0)?data[measure][ph][year]:0;
			val = data[measure][ph][year];
			val = (reset) ? 0 : val;
			vis.select(key).transition().duration(dur).attr({
				height : function()
				{
					// console.log(val + "\t" + yScale(val));
					return (val / max[measure]) * h;
				},
				// 'y' : 0,
				'data-value' : val,
				'data-key' : measure,
				'data-year' : year,
				'data-phase' : ph
			});

		}
		var prev_year;
		for (var i = 0, j = active_years.length; i < j; i++) {
			if (i > 0 && year === active_years[i].year) {
				prev_year = active_years[i - 1].year;
				break;
			}
		}
		for (var i = 0, j = toReturn.length; i < j; i++) {
			ph = toReturn[i];

			key = '#phase-chart-bar-' + ph;
			val = data[measure][ph][prev_year];
			vis.select(key).transition().duration(dur).attr({
				height : function()
				{
					// console.log(val + "\t" + yScale(val));
					return (val / max[measure]) * h;
				},
				// 'y' : 0,
				'data-value' : val,
				'data-key' : measure,
				'data-year' : prev_year,
				'data-phase' : ph
			});

		}

	};
	self.init();
	return self;

};
lineChart = function(target, id)
{
	var self = {}, data = [], years = [], vis, xScale, yScale, xAxis, yAxis, lin, max = 0, min_year, max_year, width, height, measure;
	var margin = {
		top : 5,
		right : 5,
		bottom : 20,
		left : 40
	};
	var last_used_year;
	self.draw = function()
	{
		width = parseInt($(target).css("width")) - margin.right - margin.left;
		height = parseInt($(target).css("height")) - margin.top - margin.bottom;
		console.log(width + '\t' + height)
		xScale = d3.scale.linear().range([0, width]);

		yScale = d3.scale.linear().range([height, 0]);

		xAxis = d3.svg.axis().scale(xScale).orient("bottom");

		yAxis = d3.svg.axis().scale(yScale).orient("left");

		lin = d3.svg.line().x(function(d)
		{
			// console.log(d);
			return xScale(d.value);
		}).y(function(d)
		{
			return yScale(d.year);
		});
		vis = d3.select(target).append('svg').attr({
			'id' : id,
			'height' : height + margin.top + margin.bottom,
			'width' : width + margin.left + margin.right
		}).append('g').attr({
			'id' : id + '-g',
			'class' : 'line-chart',
			"transform" : "translate(" + (margin.left - 10) + "," + margin.top + ")"
		});
		vis.append("g").attr({
			"class" : "x-axis",
			'id' : 'line-x-axis',
			"transform" : "translate(0," + height + ")"
		}).call(xAxis);
		vis.append("g").attr({
			"class" : "y-axis",
			'id' : 'line-y-axis'
		}).call(yAxis).append("text").attr("transform", "rotate(-90)").attr({
			"dy" : ".71em"
			// ,'y' : 6
		}).style("text-anchor", "end").text("Year");
		data = [{
			'year' : 0,
			'value' : 0
		}];
		vis.append('g').append("path").datum(data).attr({
			"class" : "line-chart-line",
			"d" : lin,
			'id' : id + '-line'
		});
		vis.append('g').attr('id', 'line-chart-circles');
		id = '#' + id;
	};
	self.changeMeasure = function(msr)
	{
		if (!msr)
			measure = CHART_MEASHRE
		else
			measure = msr;
		self.refreshData(measure);
		self.update(last_used_year, false);

	}
	self.refreshData = function(msr, yrs)
	{
		if (!yrs)
			years = active_years;
		else
			years = yrs;
		if (!msr)
			measure = CHART_MEASURE;
		max = 0;
		for (var i = 0, j = years.length; i < j; i++) {
			var d;
			var year = years[i].year;
			if (measure === 'count')
				d = planesByYear[year][measure];
			else
				d = planesByYear[year][measure].sum;

			max = (d > max) ? d : max;
		}
		console.log('line chart max =' + max);
		min_year = years[0].year;
		max_year = years[years.length - 1].year;
		xScale.domain([0, max]);
		yScale.domain([min_year, max_year]);
		var yrs = []
		for (var i = 0, j = years.length; i < j; i++)
			yrs.push(years[i].year);

		// console.log(yrs);
		yAxis.scale(yScale).ticks(5).tickFormat(d3.format('d')).innerTickSize(-width);
		// .tickValues(yrs)
		xAxis.scale(xScale).ticks(5).innerTickSize(-height);
		d3.select('#line-y-axis').transition().duration(min_duration).call(yAxis);
		d3.select('#line-x-axis').transition().duration(min_duration).call(xAxis);

		$('.line-chart-circle').remove();

	};
	self.reset = function()
	{

	};

	self.update = function(year, reset)
	{
		last_used_year = year;
		// console.log(measure);
		if (reset)
			data = [{
				'year' : 0,
				'value' : 0
			}];
		else {
			data = [];
			for (var i = 0, j = active_years.length; i < j && active_years[i].year <= year; i++) {
				var d;
				var yr = active_years[i].year;
				if (measure === 'count')
					d = planesByYear[yr][measure];
				else
					d = planesByYear[yr][measure].sum;
				data.push({
					'year' : yr,
					'value' : d
				});
			}
			// console.log(data);
		}
		d3.select(id + '-line').datum(data).attr({
			'd' : lin
		});
		d3.selectAll('.line-chart-circle').style('visibility', 'hidden');
		d3.select('#line-chart-circles').selectAll('circle').data(data).enter().append('circle').attr({
			'cx' : function(d)
			{
				return xScale(d.value);
			},
			'cy' : function(d)
			{
				return yScale(d.year);
			},
			'r' : (active_years.length < 11) ? 10 : 2,
			'class' : function(d)
			{
				return 'line-chart-circle line-chart-circle-' + d.year;
			},
			'data-key' : measure,
			'data-year' : function(d)
			{
				// console.log(d);
				return d.year;
			},
			'data-value' : function(d)
			{
				return d.value;
			}
		}).style('visibility', 'visible');
		for (var i = 0, j = active_years.length; i < j && active_years[i].year <= year; i++) {
			var cl = '.line-chart-circle-' + active_years[i].year;
			d3.selectAll(cl).style('visibility', 'visible');
			$(cl).unbind('mouseenter').unbind('mouseleave');
			$(cl).on('mouseenter', function()
			{
				var me = $(this);

				$("#tooltip").css("visibility", "visible").html(parseTooltipText(me)).css("top", function()
				{
					return (event.pageY - 60) + "px";
				}).css("left", function()
				{
					return (event.pageX + 30) + "px";
				});
				// console.log('displaying tooltip');

			}).on('mouseleave', function()
			{
				d3.select("#tooltip").style("visibility", "hidden");
			});

		}

	};
	self.draw();
	self.refreshData();
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

var cycles = 0;

/****************
 *  TIMER
 ******************/

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
		var prev_time = 0;
		d3.timer(function(elapsed)
		{
			var delta_t = (elapsed - last) / duration;
			temp_t += delta_t;
			last = elapsed;
			time += delta_t;
			updateSliderValue(time);
			// if (temp_t >= delta) {
			// // console.log("refresh");
			// temp_t -= delta;
			// time += delta;
			// updateSliderValue(time);
			// }
			if (time - prev_time > 1) {

				duration /= acceleration;
				duration = (duration < min_duration) ? min_duration : duration;
				console.log('accelerating ' + duration + "\t" + time)
				prev_time = time;
			}

			if (time > parseFloat($('#play-slider').attr("max"))) {
				toggleAnimation();
			}
			return !ANIMATE;
		});
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
	$("#play-button").text("\u25BA");
}

function startAnimation()
{
	ANIMATE = true;
	console.log("starting animation");
	$("#play-button").text("\u2016");
	startTimer();
}

function updateCharts(year, comp, updateCounter)
{
	var year_list = [];
	var to = 0, tf = 0, ts = 0;
	for (var i = 0, j = active_years.length; i < j && active_years[i].year <= year; i++) {
		year_list.push(active_years[i].year);
		to += planesByYear[year]['total_occupants'];
		tf += planesByYear[year]['total_fatalities'];
		ts += planesByYear[year]['total_survivors'];

	}
	updateSplines(comp, year);
	// if (updateCounter)
	// countBar.update(year);
	phaseCountBar.update(false, false, 0, true);

}

function updateSplines(t0, year)
{
	for (var i in splines) {
		// console.log(s);
		splines[i].update(t0, year);
	}
}
function resetSplines()
{
		for (var i in splines) {
		// console.log(s);
		splines[i].reset();
	}
}
/**********************
 *  SLIDER
 *******************/
function getSliderValue()
{
	return parseFloat($('#play-slider').val());
}

var prev_active_phase;
function updateSliderValue(value)
{
	if (value || value === 0)
		$('#play-slider').val(value);
	else
		value = $('#play-slider').val();
	time = value;

	var year_index = parseInt(Math.floor(value));
	if (active_years[year_index]) {
		cyear = active_years[year_index].year;
		var sub_time = Math.floor(time % 1 * 100);
		sub_time = (sub_time < 10) ? "0" + sub_time : sub_time;
		$('#slider-label').html(cyear + ".<span class='small-text'>" + sub_time + "</span>");
		$("#year-text").text("" + cyear);
		for (var i = 0, j = active_years.length; i < j; i++) {
			var year = active_years[i].year;
			var v = (i < year_index) ? 1 : (i === year_index) ? value % 1 : 0;

			if (v !== active_years[i].t) {
				updateCharts(year, v, true);
				active_years[i].t = v;
			}
		}
		var t0 = time % 1, active_phase;
		if (value > 0) {
			for (var i = 0, j = new_phases.length; i < j; i++) {
				var phase = new_phases[i];
				if (phase.cum_size - phase.size < t0)
					active_phase = phase.code;
				else
					break;

			}
		}
		if (value === 0) {
			phaseCountBar.reset();
			resetSplines();
			
		}

		if (active_phase !== prev_active_phase || current_year !== cyear) {
			phaseCountBar.update(cyear, active_phase, value);
			countBar.update(cyear, active_phase, false);
		}
		var temp;
		if (current_year === cyear)
			prev_active_phase = active_phase;
		else {
			prev_active_phase = temp;
			timeLineChart.update(cyear);
		}
		current_year = cyear;

	}
	//
	// if (year_index < active_years.length) {
	// var year = active_years[year_index].year;
	// if (year !== current_year) {
	//
	// current_year = year;
	// phaseCountBar.update(year);
	// $("#year-text").text("" + year);
	// }
	// }
}

function setSliderValues(values, step)
{
	$('#play-slider').attr({
		min : 0,
		max : values.length,
		step : step
	});

	$('#player-start').text(values[0].year);
	$('#player-finish').text(values[values.length - 1].year);
}

function fillList(target_list, data_list)
{
	list = $(target_list)
	for (var d in data_list) {
		list.append(formatPlaneShort(data_list[d]))

	}

}

function formatPlaneLong(index)
{
	var plane = planes[index];
	var html = "<table><tr><td><span class='p-head-span'>Date: </span></td><td><span class='p-val-span'>" + plane.date_text + "</span></td></tr>" + "<tr><td><span class='p-head-span'>Operator: </span></td><td><span class='p-val-span'>" + plane.operator + "</span></td></tr>" + "<tr><td><span class='p-head-span'>Type: </span></td><td><span class='p-val-span'>" + plane.type + "</span></td></tr>" + "<tr><td><span class='p-head-span'>Nature: </span></td><td><span class='p-val-span'>" + plane.nature + "</span></td></tr>" + "<tr><td><span class='p-head-span'>Departure: </span></td><td><span class='p-val-span'>" + plane.departure_airport + "</span></td></tr>" + "<tr><td><span class='p-head-span'>Destination: </span></td><td><span class='p-val-span'>" + plane.destination_airport + "</span></td></tr>" + "<tr><td><span class='p-head-span'>Location: </span></td><td><span class='p-val-span'>" + plane.location_full + "</span></td></tr>" + "<tr><td><span class='p-head-span'>Phase: </span></td><td><span class='p-val-span'>" + plane.phase + "<span></td></tr>" + "<tr><td><span class='p-head-span'>Occupants: </span></td><td><span class='p-val-span'>" + plane.total_occupants + ' (' + plane.passengers_occupants + ' Passngers, ' + plane.crew_occupants + ' Crew)' + "<span></td></tr>" + "<tr><td><span class='p-head-span'>Fatalities: </span></td><td><span class='p-val-span'>" + plane.total_fatalities + ' (' + plane.passengers_fatalities + ' Passngers, ' + plane.crew_fatalities + ' Crew)' + "<span></td></tr>" + "<tr><td><span class='p-head-span'>Survivors: </span></td><td><span class='p-val-span'>" + plane.total_survivors + "</span></td></tr>" + "<tr><td><span class='p-head-span'>Ground Casualties: </span></td><td><span class='p-val-span'>" + plane.ground_casualties + "</span></td></tr>" + "<tr><td><span class='p-head-span'>Airplane Damage: </span></td><td><span class='p-val-span'>" + plane.airplane_damage + "</span></td></tr></table>" + "<span class='p-head-span'>Narrative:</span><br><span class='p-val-span'>" + plane.narrative + "</span>";

	return html;

}

function formatPlaneShort(index)
{
	var plane = planes[index];
	var html = "<li data-i='" + index + "'><span class='p-head-span'>" + plane.date_text + ", " + plane.accident_country + "<span><br>" + "<span class='p-head-span'>O:</span><span class='p-val-span'>" + plane.total_occupants + ' (' + plane.passengers_occupants + ' P, ' + plane.crew_occupants + ' C)' + "<span><br>" + "<span class='p-head-span'>F:</span><span class='p-val-span'>" + plane.total_fatalities + ' (' + plane.passengers_fatalities + ' P, ' + plane.crew_fatalities + ' C)' + "<span><br></li>"
	return html;
}
