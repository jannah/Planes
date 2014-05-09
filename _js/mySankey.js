var margin = {
	top : 1,
	right : 1,
	bottom : 6,
	left : 1
},
//width = 960 height = 500
width = 960 - margin.left - margin.right, height = 500 - margin.top - margin.bottom;

var formatNumber = d3.format(",.0f"), format = function(d)
{
	return formatNumber(d) + " occupants";
}, format2 = function(d)
{
	return formatNumber(d) + " fatalities";
}, format3 = function(d)
{
	return formatNumber(d) + " survivors";
}, color = d3.scale.category20();

var div = "#sankey";

drawSankey(div, width, height, margin);

//console.log(formatNumber);
function drawSankey(div, width, height, margin)
{
	var svg = d3.select(div).append("svg").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom)
	// .attr("width", width)
	// .attr("height", height)
	.append("g").attr('id', 'sankey-group-1')
	// .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	var sankey = d3.sankey().nodeWidth(15).nodePadding(10).size([width, height]);

	var path = sankey.link();

	var select1 = document.getElementById("select1");
	var select2 = document.getElementById("select2");

	//Drop Down Boxes Code - Once you select a value for Dropdown1, a specific list gets populated in Dropdown2

	select1.onchange = function()
	{
		// Dropdown Box2 change depending on Dropdown Box1
		// empty select2
		while (select2.firstChild) {
			select2.removeChild(select2.firstChild);
		}

		// Append the initial to "Select an option" node
		// Lesson: Important because it threw off my indexes
		var o = document.createElement("option");
		o.value = "select";
		o.text = ">-- select an option --<";
		select2.appendChild(o);

		if (select1.value == "select") {
			return;
		}

		if (select1.selectedIndex == 0) {
			return;
		}

		var select1Index = select1.selectedIndex;
		console.log(select1Index);

		for (var i = 1; i < (select1.options.length); i++) {
			if (i != select1Index) {
				console.log("index not matching");
				var o = document.createElement("option");
				o.value = select1.options[i].value;
				o.text = select1.options[i].text;
				select2.appendChild(o);
			};
		}
	};
	//sid - can create separate function here loadSanky(filename)
	//Read in the CSV file
	d3.csv("_data/sankey_all.csv", function(data)
	{
		console.log('reading data');

		//Create the data sets and render the diagram upon clicking the Submit button
		submit.onclick = function()
		{
			$('#sankey-group-1').empty();

			var dropdown1 = "test";
			var dropdown2 = "test";

			//This function gathers the options chosen from the dropdown boxes to then render the data and graph
			dropdown1 = select1.value.toLowerCase();
			dropdown2 = select2.value.toLowerCase();
			//dropdown3 = select3.value.toLowerCase();

			//set up graph in same style as original example but empty
			planes = {
				"nodes" : [],
				"links" : []
			};

			data.forEach(function(d)
			{
				// console.log("check to see if dropdown1 gets in here")
				planes.nodes.push({
					"name" : d[dropdown1]
				});
				planes.nodes.push({
					"name" : d[dropdown2]
				});
				planes.nodes.push({
					"name" : "survived"
				});
				planes.nodes.push({
					"name" : "died"
				});
				planes.links.push({
					"source" : d[dropdown1],
					"target" : d[dropdown2],
					"value" : +d.total_occupants
				});
				planes.links.push({
					"source" : d[dropdown2],
					"target" : "survived",
					"value" : +d.total_survivors
				});
				planes.links.push({
					"source" : d[dropdown2],
					"target" : "died",
					"value" : +d.total_fatalities
				});
			});

			//console.log(planes.nodes);

			// return only the distinct / unique nodes
			planes.nodes = d3.keys(d3.nest().key(function(d)
			{
				return d.name;
			}).map(planes.nodes));
			//console.log(planes.nodes);

			// loop through each link replacing the text with its index from node
			planes.links.forEach(function(d, i)
			{
				planes.links[i].source = planes.nodes.indexOf(planes.links[i].source);
				planes.links[i].target = planes.nodes.indexOf(planes.links[i].target);
			});

			//now loop through each nodes to make nodes an array of objects
			// rather than an array of strings
			planes.nodes.forEach(function(d, i)
			{
				planes.nodes[i] = {
					"name" : d
				};
			});

			///Drawing the Sankey Diagram
			sankey.nodes(planes.nodes).links(planes.links).layout(32);

			var link = svg.append("g").selectAll(".link").data(planes.links).enter().append("path").attr("class", "link").attr("d", path).style("stroke-width", function(d)
			{
				return Math.max(1, d.dy);
			}).sort(function(a, b)
			{
				return b.dy - a.dy;
			});

			link.append("title").text(function(d)
			{
				if (d.target.name == "survived") {
					return d.source.name + " → " + d.target.name + "\n" + format3(d.value);
				} else if (d.target.name == "died") {
					return d.source.name + " → " + d.target.name + "\n" + format2(d.value);
				} else {
					return d.source.name + " → " + d.target.name + "\n" + format(d.value);
				}
			});

			var node = svg.append("g").selectAll(".node").data(planes.nodes).enter().append("g").attr("class", "node").attr("transform", function(d)
			{
				return "translate(" + d.x + "," + d.y + ")";
			}).call(d3.behavior.drag().origin(function(d)
			{
				return d;
			}).on("dragstart", function()
			{
				this.parentNode.appendChild(this);
			}).on("drag", dragmove));

			node.append("rect").attr("height", function(d)
			{
				return d.dy;
			}).attr("width", sankey.nodeWidth()).style("fill", function(d)
			{
				return d.color = color(d.name.replace(/ .*/, ""));
			}).style("stroke", function(d)
			{
				return d3.rgb(d.color).darker(2);
			}).append("title").text(function(d)
			{
				return d.name + "\n" + format(d.value);
			});

			node.append("text").attr("x", -6).attr("y", function(d)
			{
				return d.dy / 2;
			}).attr("dy", ".35em").attr("text-anchor", "end").attr("transform", null).text(function(d)
			{
				return d.name;
			}).filter(function(d)
			{
				return d.x < width / 2;
			}).attr("x", 6 + sankey.nodeWidth()).attr("text-anchor", "start");

			function dragmove(d)
			{
				d3.select(this).attr("transform", "translate(" + d.x + "," + (d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))) + ")");
				sankey.relayout();
				link.attr("d", path);
			};

		};
	});
}