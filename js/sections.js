// Constants to define the size
// and margins of the vis area.
const width = 600;
const height = 600;
const margin = { top: 20, left: 20, bottom: 20, right: 10 };

// Units of incidents
const units = "Incidents";


/**
 * scrollVis - encapsulates
 * all the code for the visualization
 * using reusable charts pattern:
 * http://bost.ocks.org/mike/chart/
 */
var scrollVis = function () {
  // Keep track of which visualization
  // we are on and which was the last
  // index activated. When user scrolls
  // quickly, we want to call all the
  // activate functions that they pass.
  var lastIndex = -1;
  var activeIndex = 0;

  // Sizing for the grid visualization
  var dotRadius = 4;
  var dotSize = dotRadius * 2;
  var dotPad = 2;
  var numPerRow = Math.floor(width / (dotSize + dotPad));
  var gridHeight = height * 0.7;
  var numPerCol = Math.floor(gridHeight / (dotSize + dotPad));
  // legend
  var legendPad = 14;
  var legendOffset = 30;
  var defaultfontSize = null;

  // main svg used for visualization
  var svg = null;

  // d3 selection that will be used
  // for displaying visualizations
  var g = null;
  // top margin of the svg
  var g_top = null;

  // count entries of data
  var countIncidents = 0;

  // We will set the domain when the
  // data is processed.
  // @v4 using new scale names
  var xBarScale = d3.scaleLinear()
    .range([0, width]);

  // The bar chart display is horizontal
  // so we can use an ordinal scale
  // to get width and y locations.
  // @v4 using new scale type
  var yBarScale = d3.scaleBand()
    .paddingInner(0.08)
    .domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,15,16,17,18])
    // .domain(['worried','worse','ptsd','fear','angry','doubted','stressful','suicidal','therapy','anxiety','lost','affected','depression','lonely'])
    .range([0, height - 50], 0.1, 0.1);

  // Color is determined just by the index of the bars
  var barColors = { 0: '#008080', 1: '#399785', 2: '#5AAF8C',3:'#000' };
  // var colorPalette = { 0: '#d7443f', 1: '#272d33', 2: '#697f7f', 3: '#999894', 4: '#ccc8c5' };
  var colorPalette = {
    // all colors
    0: '#D7443F',
    1: '#F97171', 2: '#FFB2B3',
    3: '#56BFB1', 4: '#94E5DB',
    5: '#CCCCCC',
    6: '#DDDDDD',
    7: '#767678',
    'length': 7,
    // main colors
    'emphasis': '#D7443F',
    'primary': '#F97171',
    'background': '#DDDDDD',
    // reported
    'No': '#F97171', 'Yes': '#CCCCCC',
    // perpetrator gender
    'Male': '#56BFB1', 'Female': '#F97171',
    // 'Multiple': '#CCCCCC',
    // institution
    'Research University': '#F97171', 'Other College': '#FFB2B3',
    'Conference & Fieldwork': '#56BFB1',
    // other & unknown
    'Other': '#CCCCCC',
    'Unknown': '#DDDDDD'
  };
  var color = d3.scaleSequential(d3.interpolateGreens);

  // vis title
  var visTitle = null;

  // dot matrix
  var dots = null,
      dotTitles = null;
  // legends selection
  var legends = d3.map(),
      legendBars = d3.map(),
      countTag = null, countTitle = null, countingTag = null, numberTag = null,
      legendScale = d3.scaleLinear();

  // Intro
  var introBlock = null,
      contactBlock = null;

  // The histogram display shows the
  // first 30 minutes of data
  // so the range goes from 0 to 30
  // @v4 using new scale name
  var xHistScale = d3.scaleLinear()
    .domain([0, 30])
    .range([0, width - 20]);

  // @v4 using new scale name
  var yHistScale = d3.scaleLinear()
    .range([height, 0]);

  // The color translation uses this
  // scale to convert the progress
  // through the section into a
  // color value.
  // @v4 using new scale name
  var coughColorScale = d3.scaleLinear()
    .domain([0, 1.0])
    .range(['#008080', 'red']);

  // You could probably get fancy and
  // use just one axis, modifying the
  // scale, but I will use two separate
  // ones to keep things easy.
  // @v4 using new axis name
  var xAxisBar = d3.axisBottom()
    .scale(xBarScale);

  // @v4 using new axis name
  var xAxisHist = d3.axisBottom()
    .scale(xHistScale)
    .tickFormat(function (d) { return d + ' min'; });

  // When scrolling to a new section
  // the activation function for that
  // section is called.
  var activateFunctions = [];
  // If a section has an update function
  // then it is called while scrolling
  // through the section with the current
  // progress through the section.
  var updateFunctions = [];

  // Field to sort for dot matrices
  class fieldToSort {
    constructor(field, IncidentsData, groupFunc = groupBy) {
      var counts = groupFunc(field, IncidentsData);
      this.orderedKeys = d3.values(counts).map(function(d) { return d.key; });
      var newCounts = d3.map();
      counts.forEach(function (d) {
        newCounts.set(d.key, d.value);
      });
      this.counts = newCounts;
      var unkIndex = this.orderedKeys.indexOf("Unknown");
      if (unkIndex > -1) {
        this.orderedKeys.splice(unkIndex, 1);
        this.orderedKeys.push("Unknown");
      }
      this.maxKey = this.orderedKeys[0];
      this.sorted = false;
      this.hasLegend = false;
    }
  }

  // All fields to sort for dot matrices
  var fieldsToSort = d3.map();

  // sankey diagram
  var sankey = d3.sankey()
    .nodeWidth(dotRadius * 6)
    .nodePadding(dotRadius + dotSize)
    .size([width - margin.left - margin.right,
      height - margin.top - margin.bottom]);
  var sankLegend = null;

  var path = sankey.link(dotRadius);

  // set up graph in same style as original example but empty
  var graph = {"nodes" : [], "links" : []};

  /**
   * chart
   *
   * @param selection - the current d3 selection(s)
   *  to draw the visualization in. For this
   *  example, we will be drawing it in #vis
   */
  var chart = function (selection) {
    selection.each(function (rawData) {
      // create svg and give it a width and height
      svg = d3.select(this).selectAll('.scroller').data([incidentsData]);
      var svgE = svg.enter().append('svg').classed('scroller', true);
      // @v4 use merge to combine enter and existing selection
      svg = svg.merge(svgE);

      svg.attr('width', width + margin.left + margin.right);
      svg.attr('height', height + margin.top + margin.bottom);

      svg.append('g');


      // this group element will be used to contain all
      // other elements.
      g = svg.select('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
        .classed('dotbar', true);
      g_top = svg.append('g')
        .attr('transform', 'translate(' + margin.left + ',0)')
        .classed('top-margin', true);

      // perform some preprocessing on raw data
      var incidentsData = getIncidents(rawData);
      // filter to just include filler words
      var fillerWords = getFillerWords(incidentsData);
      // count incidents
      countIncidents = incidentsData.length;

      // get the counts of filler words for the
      // prepare fields to sort
      fieldsToSort.set("gendersclean", new fieldToSort("gendersclean", incidentsData));
      fieldsToSort.set("reported", new fieldToSort("reported", incidentsData));
      fieldsToSort.set("itypewide", new fieldToSort("itypewide", incidentsData));

      // these three fields have legend
      fieldsToSort.get('gendersclean').hasLegend = true;
      fieldsToSort.get('reported').hasLegend = true;
      fieldsToSort.get('itypewide').hasLegend = true;

      var mentalCounts = [{key:'anxiety',value:296},{key:'depression',value: 263},{key:'stressful',value: 189},{key:'angry',value:153},{key:'fear',value:133},{key:'therapy',value:129},{key:'doubted',value:117},{key:'ptsd',value:85},{key:'lost',value:73},{key:'lonely',value:66},{key:'bad',value:59},{key:'shame',value:57},{key:'panic',value:52},{key:'upset',value:39},{key:'wary',value:34},{key:'worried',value:33},{key:'uncomfortable',value:32},{key:'struggle',value:32},{key:'suicide',value:30}]//,{key:'worried',value:'33'},{key:'worried',value:'33'},{key:'worried',value:'33'},{key:'worried',value:'33'},{key:'worried',value:'33'},{key:'worried',value:'33'},{key:'worried',value:'33'},{key:'worried',value:'33'},{key:'worried',value:'33'},{key:'worried',value:'33'},{key:'worried',value:'33'},{key:'worried',value:'33'},{key:'worried',value:'33'},{key:'worried',value:'33'},{key:'worried',value:'33'}]

      // set the bar scale's domain
      // var genderCountMax = d3.max(fieldsToSort.get("gendersclean").counts,function (d) { return d.value; });

      // xBarScale.domain([0, genderCountMax]);
      // TODO: UNUSED
      color.domain([0, d3.max(mentalCounts, function(d) { return d.value; })]);
      // console.log(color)

      var countMax = d3.max(mentalCounts, function (d) { return d.value;});
      xBarScale.domain([0, countMax]);

      // get aggregated histogram data

      var histData = getHistogram(fillerWords);
      // set histogram's domain
      var histMax = d3.max(histData, function (d) { return d.length; });
      yHistScale.domain([0, histMax]);

      // target/perpetrator counts for sankey diagram and nodes
      fieldsToSort.set("targetkeyword", new fieldToSort("targetkeyword", incidentsData, groupTarPerp));
      fieldsToSort.set("perpetkeyword", new fieldToSort("perpetkeyword", incidentsData, groupTarPerp));

      var perpOrder = fieldsToSort.get("perpetkeyword").orderedKeys;
      var targOrder = fieldsToSort.get("targetkeyword").orderedKeys;

      // prepare graph.nodes
      fieldsToSort.get("perpetkeyword").counts.each(function (d, k) {
        graph.nodes.push("p_" + k);
      });
      fieldsToSort.get("targetkeyword").counts.each(function (d, k) {
        graph.nodes.push("t_" + k);
      });


      // sankey diagram
      // target/perpetrator links
      var linkNest = d3.nest()
        .key(function (d) { return d["perpetkeyword"]; })
        .key(function (d) { return d["targetkeyword"] })
        .rollup(function (v) { return v.length; })
        .entries(incidentsData)
        .sort(function (a, b) {
          return perpOrder.indexOf(a.key) - perpOrder.indexOf(b.key); });

      linkNest.forEach(function (d) { d.values.sort(function (a, b) {
          return targOrder.indexOf(a.key) - targOrder.indexOf(b.key); });
      });

      // prepare graph.links
      linkNest.forEach(function (dp, ip) { dp.values.forEach(function (dt, it) {
        graph.links.push({ "source": graph.nodes.indexOf("p_" + dp.key),
          "target": graph.nodes.indexOf("t_" + dt.key),
          "value": dt.value });
      }); });

      // now loop through each nodes to make nodes an array of objects
      // rather than an array of strings
      graph.nodes.forEach(function (d, i) {
        var role = d.substring(0,2);
        var title = d.substring(2);
        var rank = getRank(title, role === 'p_'? perpOrder : targOrder);
        graph.nodes[i] = { 'name': role + rank, 'rank': +rank,
        'title': title };
      });

      // calculate sankey
      sankey
        .nodes(graph.nodes)
        .links(graph.links)
        .layout(0);

      // setupVis(incidentsData, fieldsToSort.get("gendersclean").counts, histData);
      setupVis(incidentsData, mentalCounts, histData);
      

      setupSections();
    });
  };


  /**
   * setupVis - creates initial elements for all
   * sections of the visualization.
   *
   * @param IncidentData - data object for each word.
   * @param mentalCounts - nested data that includes
   *  element for each filler word type.
   * @param histData - binned histogram data
   */
  var setupVis = function (IncidentData, mentalCounts, histData) {
    // axis
    g.append('g')
      .classed('x axis', true)
      .attr('transform', 'translate(0,' + height + ')')
      .call(xAxisBar);
    g.select('.x.axis').style('opacity', 0);

    // count vis title
    visTitle = g.append('g')
      .classed('vis-title', true);
    visTitle.attr('opacity', 0);
    visTitle.append('text')
      .classed('title', true)
      .attr('x', margin.left)
      .attr('y', '1em')
      .style('font-size', "3em")
      .text('Sexual Harassment');

    visTitle.append('text')
      .classed('sub-title emphasis', true)
      .attr('x', margin.left - dotPad)
      .attr('y', 115)
      .style('font-size', "5em")
      .text('in Academia');

    visTitle.append('text')
      .classed('sub-title', true)
      .attr('x', margin.left)
      .attr('y', 160)
      .style('font-size', "1.5em")
      .attr('fill', colorPalette[7])
      .text('A Data Visualization Project');

    // count titles
    countTitle = g.append('text')
      .classed('count-title', true);
    countTitle.attr('x', 150)
      .attr('y', gridHeight + legendPad * 3 + dotSize)
      .style('fill', colorPalette[5])
      .style('font-weight', "700")
      .style('font-size', "2em")
      .text('Reported incidents')
      .attr('opacity', 0);

    countingTag = g.append('text')
      .classed('count-title', true);
    countingTag.attr('x', 150)
      .attr('y', gridHeight + legendPad * 5 + dotSize)
      .style('fill', colorPalette[7])
      .style('font-weight', "normal")
      .style('font-size', "initial")
      .text('and counting ...')
      .attr('opacity', 0);

    numberTag = g.append('text')
      .classed('count-title', true);
    numberTag.attr('x', 0)
      .attr('y', gridHeight + legendPad * 3 + dotSize)
      .style('fill', colorPalette['emphasis'])
      .style('font-weight', "900")
      .style('font-size', "4em")
      .text(0)
      .attr('opacity', 0);

    // intro block
    introBlock = d3.select('#intro');
    contactBlock = d3.select('#contact');

    // dot grid
    // @v4 Using .merge here to ensure
    // new and old data have same attrs applied
    dots = g.selectAll('.dot').data(IncidentData);
    var dotsE = dots.enter()
      .append('circle')
      .classed('dot', true);
    dots = dots.merge(dotsE)
      // .attr('width', dotSize)
      // .attr('height', dotSize)
      .attr('r', dotRadius)
      .attr('fill', '#fff')
      .attr('class', function(d) { return d3.select(this).attr("class")
        + " gender_" + d["gendersclean"].toLowerCase(); })
      .attr('cx', function (d) { return d.x + dotRadius;})
      .attr('cy', function (d) { return d.y + dotRadius;})
      .attr('opacity', 0);
    dotTitles = dots.append('title');

    // dots legends
    legendScale
      .domain([0, countIncidents])
      .range([0, Math.ceil(countIncidents / numPerCol) * (dotSize + dotPad)]);
    var numCols = Math.ceil(countIncidents / numPerCol);
    var gridWidth = numCols * (dotSize + dotPad);

    defaultfontSize = window.getComputedStyle(g.node(), null).fontSize;
    defaultfontSize = +defaultfontSize.substring(0, defaultfontSize.length - 2);
    // console.log(defaultfontSize);

    countTag = g_top.append('text')
      .classed('count-all', true)
      .text("Total: " + countIncidents)
      .attr('x', width - margin.right - dotPad)
      .attr('y', margin.top - dotPad * 2)
      .attr('text-anchor', "end")
      .style('fill', colorPalette['Other'])
      .style('font-weight', "bold")
      .style('font-size', "initial")
      .attr('opacity', 0);

    fieldsToSort.each(function (d, k) {
      if (d.hasLegend) {
        legendBars.set(k, {
            'back': g.append('g').classed('legend-back', true)
              .attr('opacity', 0),
            'bar': g.append('g').classed('legend-bar', true)
              .attr('opacity', 0)
          });
        legends.set(k, g.append('g')
          .classed('legends', true)
          .attr('opacity', 0)
        );
        var countAll = 0,
            anchorStart = true,
            offseted = false,
            itemY = gridHeight + legendPad,
            barX = 0;
        d.orderedKeys.forEach(function (t, i) {
          var itemX = Math.floor(countAll / numPerCol) * (dotSize + dotPad);
          countAll += d.counts.get(t);
          var itemDx = i === d.orderedKeys.length - 1 ? gridWidth - itemX :
            Math.floor(countAll / numPerCol) * (dotSize + dotPad) - itemX;
          var legendBar = legendBars.get(k)['bar'].append('rect')
            .attr('x', itemX)
            .attr('width', itemDx)
            .attr('height', dotSize / 2)
            .style('fill', colorPalette[t])
            .attr('opacity', 0.65);
          barX += legendScale(d.counts.get(t));
          legends.get(k).append('text')
            .classed('legend', true)
            .style('fill', colorPalette[t])
            .style('font-weight', "normal")
            .style('font-size', "1em")
            .call(function (tag) {
              tag.text(t.split(/\s+/)[0]);
              var textWidth = tag.node().getComputedTextLength();
              if (itemX + textWidth > width && offseted) {
                anchorStart = false;
              }
              if (textWidth > itemDx || offseted) {
                itemY += offseted ? legendOffset : 0;
              }
              legendBars.get(k)['back'].append('rect')
                .attr('x', itemX)
                .attr('y', gridHeight + legendPad + 0.5 * dotSize)
                .attr('width', itemDx)
                .attr('height', itemY - gridHeight - legendPad)
                .style('fill', colorPalette[t])
                .attr('opacity', 0.35);
              legendBar.attr('y', itemY + 0.5 * dotSize);
              tag.attr('y', itemY + 3 * dotSize)
                .attr('x', anchorStart ? itemX :
                  itemX + itemDx);
              if (!offseted) {
                legendBars.get(k)['bar'].append('text')
                  .attr('x', itemX)
                  .attr('y', itemY)
                  .style('fill', colorPalette[t])
                  .style('font-weight', "bold")
                  .text(d.counts.get(t));
              }
              if (textWidth > itemDx && !offseted) {
                legendBars.get(k)['bar'].append('text')
                  .attr('x', gridWidth)
                  .attr('y', itemY)
                  .attr('text-anchor', "end")
                  .style('fill', colorPalette['Unknown'])
                  .style('font-weight', "bold")
                  .text(countIncidents - countAll);
                itemY += legendOffset;
                offseted = true;
              }
            })
            .call(wrap, t, itemDx, anchorStart, legendBars.get(k)['bar']);
        })
      }
    });

    // barchart
    // @v4 Using .merge here to ensure
    // new and old data have same attrs applied
    var bars = g.selectAll('.bar').data(mentalCounts);
    var barsE = bars.enter()
      .append('rect')
      .classed('bar', true);
    bars = bars.merge(barsE)
      .attr('x', 0)
      .attr('y', function (d, i) { return yBarScale(i);})
      .attr('fill', colorPalette['emphasis'])//function (d, i) { return
      // barColors[i]; })
      // #######color######
      .attr('width', 0)
      .attr('height', yBarScale.bandwidth());

    var barText = g.selectAll('.bar-text').data(mentalCounts);
    barText.enter()
      .append('text')
      .classed('bar-text', true)
      .text(function (d) { return d.key ; })
      .attr('x', 0)
      .attr('dx', 15)
      .attr('y', function (d, i) { return yBarScale(i);})
      .attr('dy', yBarScale.bandwidth() / 1.2)
      .style('font-size', '15px')
      .attr('fill', 'white')
      .attr('opacity', 0);

    // histogram
    // @v4 Using .merge here to ensure
    // new and old data have same attrs applied
    var hist = g.selectAll('.hist').data(histData);
    var histE = hist.enter().append('rect')
      .classed('hist', true);
    hist = hist.merge(histE).attr('x', function (d) { return xHistScale(d.x0); })
      .attr('y', height)
      .attr('height', 0)
      .attr('width', (xHistScale(histData[0].x1) - xHistScale(histData[0].x0) -
        1 < 0)? 0 : xHistScale(histData[0].x1) - xHistScale(histData[0].x0) - 1)
      .attr('fill', barColors[0])
      .attr('opacity', 0);

    // sankey format variables
    var formatNumber = d3.format(",.0f"),    // zero decimal places
      format = function(d) { return formatNumber(d) + " " + units; },
      // node color scale
      nodeMax = d3.max(graph.nodes, function (d) { return d.value }),
      nodeOpacity = d3.scaleLinear().domain([0, nodeMax/2]).range([0.35, 1]),
      // link stroke-opacity scale
      linkMax = d3.max(graph.links, function (d) { return d.value }),
      linkOpacity = d3.scalePow().exponent(2).domain([0, linkMax]).range([0.05, 0.4]);

    // sankey diagram
    var sank = svg.append('g')
      .classed('sankey', true)
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
      .attr('opacity', 0);

    // sankey diagram legends
    sankLegend = svg.append('g')
      .classed('sank-legend', true)
      .attr('opacity', 0);
    // tags
    sankLegend.append('text')
      .text('PERPETRATOR STATUS')
      .attr('x', margin.right)
      .attr('y', height)
      .attr('text-anchor', "start")
      .style('fill', colorPalette['emphasis'])
      .style('font-weight', 'bold')
      .style('font-size', '1.2em');
    sankLegend.append('text')
      .text('TARGET STATUS')
      .attr('x', width)
      .attr('y', height)
      .attr('text-anchor', "end")
      .style('fill', colorPalette['emphasis'])
      .style('font-weight', 'bold')
      .style('font-size', '1.2em');
    // axis
    sankLegend.append('text')
      .text('Lower Status')
      .attr('x', margin.left + width / 2)
      .attr('y', height * 0.9)
      .attr('text-anchor', "middle")
      .style('fill', colorPalette[3])
      .style('font-weight', "bold");
    sankLegend.append('text')
      .text('Higher Status')
      .attr('x', margin.left + width / 2)
      .attr('y', height * 0.1)
      .attr('text-anchor', "middle")
      .style('fill', colorPalette[3])
      .style('font-weight', "bold");

    // arrowhead
    svg.append('defs').append('marker')
      .attr('id', 'arrowforward')
      .attr('refY', 4)
      .attr('markerWidth', 12)
      .attr('markerHeight', 8)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M 0,0 V 8 L12,4 Z')
      .style('fill', colorPalette[4]);
    svg.append('defs').append('marker')
      .attr('id', 'arrowbackward')
      .attr('refY', 4)
      .attr('markerWidth', 12)
      .attr('markerHeight', 8)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M 12,0 V 8 L0,4 Z')
      .style('fill', colorPalette[4]);
    sankLegend.append('line')
      .attr('marker-end', 'url(#arrowforward) ')
      .attr('marker-start', 'url(#arrowbackward)')
      .attr('x1', margin.left + width / 2).attr('x2', margin.left + width / 2)
      .attr('y2', height * 0.2).attr('y1', height * 0.8)
      .style('stroke', colorPalette[4]);

    // add in the links
    var link = sank.selectAll(".link").append('g').data(graph.links);
    var linkE = link.enter().append("path");
    link = link.merge(linkE).attr("d", path)
      .attr('class', function (d) { return "link " + d.source.name + " " +
      d.target.name })
      .style("stroke-width", function(d) { return Math.max(1, d.dy); })
      .style('stroke-opacity', function (d) { return linkOpacity(d.value); })
      .sort(function(a, b) { return b.dy - a.dy; });

    // add the link titles
    link.append("title")
      .text(function(d) { return "Perpetrator: " + d.source.title +
        "\nTarget: " + d.target.title + "\n" + format(d.value); });

    // add in the nodes
    var node = sank.selectAll(".node").append('g').data(graph.nodes);
    var nodeE = node.enter().append("g")
      .attr("class", "node");
    node = node.merge(nodeE).attr("transform", function(d) {
      return "translate(" + d.x + "," + d.y + ")"; });

    // record node-link element
    var node_link = {};
    node.each(function (d) {
      node_link[d.name] = d3.selectAll('.link.' + d.name);
    });

    // add the rectangles for the nodes
    node.append("rect")
      .attr('class', function (d) { return "node-rect " + d.name })
      .attr("height", function(d) { return d.dy + dotRadius * 2; })
      .attr("width", sankey.nodeWidth())
      .attr("rx", dotRadius)
      .attr("ry", dotRadius)
      .style("fill", colorPalette['emphasis'])
      .style('fill-opacity', function (d) { return nodeOpacity(d.value); })
      .style("stroke", "none")
      .append("title").text(function(d) {
        return d.title + "\n" + format(d.value); });

    node.on('mouseenter',
      function (d) { var n = d3.select(this);
        n.classed('hl', true);
        node_link[d.name].classed('hl', true); })
      .on('mouseout', function (d) {
        var n = d3.select(this);
        n.classed('hl', false);
        node_link[d.name].classed('hl', false);
      });

    // add in the title for the nodes
    node.append("text")
      .attr('class', function (d) { return "node-title " + d.name })
      .attr("x", -6)
      .attr("y", function(d) { return d.dy / 2 + dotRadius; })
      .attr("dy", ".35em")
      .attr("text-anchor", "end")
      .attr("transform", null)
      .text(function(d) { return d.title; })
      .filter(function(d) { return d.x < width / 2; })
      .attr("x", 6 + sankey.nodeWidth())
      .attr("text-anchor", "start");

  };

  /**
   * setupSections - each section is activated
   * by a separate function. Here we associate
   * these functions to the sections based on
   * the section's index.
   *
   */
  var setupSections = function () {
    // activateFunctions are called each
    // time the active section changes
    activateFunctions[0] = showTitle;
    activateFunctions[1] = showIntro;
    activateFunctions[2] = showGrid;
    activateFunctions[3] = highlightReported;
    activateFunctions[4] = highlightGender;
    activateFunctions[5] = highlightInst;
    activateFunctions[6] = showSankey;
    activateFunctions[7] = showMentalImpacts;

    // updateFunctions are called while
    // in a particular section to update
    // the scroll progress in that section.
    // Most sections do not need to be updated
    // for all scrolling and so are set to
    // no-op functions.
    for (var i = 0; i < 8; i++) {
      updateFunctions[i] = function () {};
    }
    updateFunctions[9] = updateCough;
  };

  /**
   * ACTIVATE FUNCTIONS
   *
   * These will be called their
   * section is scrolled to.
   *
   * General pattern is to ensure
   * all content for the current section
   * is transitioned in, while hiding
   * the content for the previous section
   * as well as the next section (as the
   * user may be scrolling up or down).
   *
   */

  /**
   * showTitle - initial title
   *
   * hides: count title
   * (no previous step to hide)
   * shows: intro title
   *
   */
  function showTitle() {
    hideLegend();
    hideAxis();
    hideBars();
    hideSankey();

    dots.transition()
      .duration(300)
      .attr('opacity', 0);

    countTitle.transition()
      .duration(300)
      .attr('opacity', 0);
    countingTag.transition()
      .duration(300)
      .attr('opacity', 0);
    numberTag.transition()
      .duration(300)
      .attr('opacity', 0);

    visTitle.transition()
      .duration(600)
      .attr('opacity', 1.0);

    introBlock.transition()
      .duration(0)
      .style('opacity', 1.0);
    contactBlock.transition()
      .duration(600)
      .style('opacity', 1.0);
  }

  function showIntro() {
    dots.transition()
      .duration(300)
      .attr('opacity', 0);

    countTitle.transition()
      .duration(300)
      .attr('opacity', 0);
    countingTag.transition()
      .duration(300)
      .attr('opacity', 0);
    numberTag.transition()
      .duration(300)
      .attr('opacity', 0);

    visTitle.transition()
      .duration(300)
      .attr('opacity', 0);

    introBlock.transition()
      .duration(1200)
      .delay(1200)
      .style('opacity', 1.0);
    contactBlock.transition()
      .duration(300)
      .style('opacity', 0);
  }

  /**
   * showGrid - dot grid
   *
   * hides: filler count title
   * hides: filler highlight in grid
   * shows: dot grid
   *
   */
  function showGrid() {
    hideLegend();
    hideAxis();
    hideBars();
    hideSankey();

    dotTitles.text("Click to view details");

    introBlock.transition()
      .duration(600)
      .style('opacity', 0)
      .attr('opacity', 0);
    contactBlock.transition()
      .duration(600)
      .style('opacity', 0);

    visTitle.transition()
      .duration(300)
      .attr('opacity', 0);

    countTitle.transition()
      .duration(600)
      .attr('opacity', 1.0);
    countingTag.transition()
      .duration(1000)
      .delay(3000)
      .attr('opacity', 1.0);
    numberTag.transition()
      .duration(600)
      .attr('opacity', 1.0);

    dots.transition()
      .duration(200)
      .attr('opacity', 0);

    dots.transition()
      .duration(600)
      .delay(function (d) {
        return 1 * d.id;
      })
      .attr('opacity', 1.0)
      .attr('fill', colorPalette['primary'])
      .attr('stroke', colorPalette['primary'])
      .attr('stroke-width', 0);

    numberTag.transition('add-number')
      .duration(countIncidents)
      .delay(300)
      .tween("text", function() {
        var node = this;
        var i = d3.interpolate(0, countIncidents),
          prec = (countIncidents + "").split("."),
          round = (prec.length > 1) ? Math.pow(10, prec[1].length) : 1;
        return function(t) {
          node.textContent = Math.round(i(t) * round) / round;
        };
      });

  }

  function hideLegend() {
    legends.each(function (d) {
      d.transition()
        .duration(300)
        .attr('opacity', 0);
    });
    legendBars.each(function (d, i) {
      d['bar'].transition()
        .duration(300)
        .attr('opacity', 0);
      d['back'].transition()
        .duration(300)
        .attr('opacity', 0);
    });
    countTag.transition()
        .duration(300)
        .attr('opacity', 0);
  }

  /**
   * wrap - wrap SVG text tag content into width
   *
   * @param e - element selection
   * @param text - text content
   * @param widthLimit - max width of text tag
   * @param anchorStart - text-anchor of the tag
   * @param bgParent - parent element selection
   */
  function wrap(e, text, widthLimit, anchorStart, bgParent = null) {
    // break up text into words
    var words = text.split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // unit: em
        x = e.attr('x'),
        y = e.attr('y'),
        dy = 0;

    // add background
    var background = bgParent.append('rect')
      .classed('text-back', true)
      .attr('x', x)
      .attr('y', y - defaultfontSize * lineHeight)
      .attr('width', width - x)
      .style('fill', '#ffffff');

    // add tspan with width restrictions
    var tspan = e.text(null).append('tspan')
      .attr('x', x)
      .attr('y', y)
      .attr('dy', dy + "em")
      .attr('text-anchor', anchorStart ? "start" : "end");
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > widthLimit) {
        if (word.length !== 1) {
          if (line.length === 1) lineNumber--;
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = e.append('tspan')
            .attr('x', x).attr('y', y)
            .attr('dy', ++lineNumber * lineHeight + dy + "em")
            .attr('text-anchor', anchorStart ? "start" : "end")
            .text(word);
        }
      }
    }
    background.attr('height', anchorStart ?
      ++lineNumber * (lineHeight) + 0.5 + dy + "em" : 0);

  }

  /**
   * highlightReported - show fillers in grid
   *
   * hides: barchart, text and axis
   * shows: dot grid and highlighted
   *  filler words. also ensures dots
   *  are moved back to their place in the grid
   */
  function highlightReported() {
    var field = "reported";
    var legendDelay = 500;
    var legendBlock = legends.get(field);
    var legendBar = legendBars.get(field)['bar'];
    var legendBack = legendBars.get(field)['back'];
    hideLegend();
    hideAxis();
    hideBars();
    hideSankey();

    dotTitles.text(function (d) {
      return d['reportedwide'] + " (click to view details)";
    });

    countTitle.transition()
      .duration(300)
      .attr('opacity', 0);
    countingTag.transition()
      .duration(300)
      .attr('opacity', 0);
    numberTag.transition()
      .duration(300)
      .attr('opacity', 0);

    g.selectAll('.bar')
      .transition()
      .duration(600)
      .attr('width', 0);

    g.selectAll('.bar-text')
      .transition()
      .duration(0)
      .attr('opacity', 0);

    // Sort by gender
    sortBy(dots, field);

    dots.transition()
      .duration(800)
      .attr('opacity', function (d) { return d[field] === "Unknown" ? 0.3 :
        1.0; })
      .attr('fill', function (d) { return d[field] ===
        fieldsToSort.get(field).maxKey ?
        colorPalette['primary'] : colorPalette['background'];
      })
      .attr('stroke', function (d) { return d[field] ===
        fieldsToSort.get(field).maxKey ?
        colorPalette['primary'] : colorPalette['background'];
      })
      .attr('stroke-width', 0);

    // use named transition to ensure
    // move happens even if other
    // transitions are interrupted.
    if (!fieldsToSort.get(field).sorted) {
      dots.transition('sort-fills')
        .duration(1000)
        .delay(1200)
        .attr('cx', function (d) { return d.x + dotRadius;})
        .attr('cy', function (d) { return d.y + dotRadius;});

      legendDelay = 2000;

      fieldsToSort.each(function (d, i) {
        d.sorted = i === field;
      });
    }

    // show legend
    legendBlock.transition()
      .duration(1000)
      .delay(legendDelay)
      .attr('opacity', 1.0);
    legendBar.transition()
      .duration(1000)
      .delay(legendDelay)
      .attr('opacity', 1.0);
    legendBack.transition()
      .duration(1000)
      .delay(legendDelay)
      .attr('opacity', 1.0);
    countTag.transition()
      .duration(1000)
      .delay(legendDelay)
      .attr('opacity', 1.0);

  }

  /**
   * highlightGender - show fillers in grid
   *
   * hides: barchart, text and axis
   * shows: dot grid and highlighted
   *  filler words. also ensures dots
   *  are moved back to their place in the grid
   */
  function highlightGender() {
    var field = "gendersclean";
    var legendDelay = 500;
    var legendBlock = legends.get(field);
    var legendBar = legendBars.get(field)['bar'];
    var legendBack = legendBars.get(field)['back'];
    hideLegend();
    hideAxis();
    hideBars();
    hideSankey();

    dotTitles.text(function (d) {
      return d['gendersclean'] + " (click to view details)";
    });

    countTitle.transition()
      .duration(300)
      .attr('opacity', 0);
    countingTag.transition()
      .duration(300)
      .attr('opacity', 0);
    numberTag.transition()
      .duration(300)
      .attr('opacity', 0);

    g.selectAll('.bar')
      .transition()
      .duration(600)
      .attr('width', 0);

    g.selectAll('.bar-text')
      .transition()
      .duration(0)
      .attr('opacity', 0);

    // Sort by gender
    sortBy(dots, field);

    dots.transition()
      .duration(800)
      .attr('opacity', function (d) { return d[field] === "Unknown" ? 0.3 :
        1.0; })
      .attr('fill', function (d) { return colorPalette[d[field]]; })
      .attr('stroke', function (d) { return colorPalette[d[field]]; })
      .attr('stroke-width', 0);

    // use named transition to ensure
    // move happens even if other
    // transitions are interrupted.
    if (!fieldsToSort.get(field).sorted) {
      dots.transition('sort-fills')
        .duration(1000)
        .delay(1200)
        .attr('cx', function (d) { return d.x + dotRadius;})
        .attr('cy', function (d) { return d.y + dotRadius;});

      legendDelay = 2000;

      fieldsToSort.each(function (d, i) {
        d.sorted = i === field;
      });
    }

    // show legend
    legendBlock.transition()
      .duration(1000)
      .delay(legendDelay)
      .attr('opacity', 1.0);
    legendBar.transition()
      .duration(1000)
      .delay(legendDelay)
      .attr('opacity', 1.0);
    legendBack.transition()
      .duration(1000)
      .delay(legendDelay)
      .attr('opacity', 1.0);
    countTag.transition()
      .duration(1000)
      .delay(legendDelay)
      .attr('opacity', 1.0);

  }

  /**
   * highlightInst - show fillers in grid
   *
   * hides: barchart, text and axis
   * shows: dot grid and highlighted
   *  filler words. also ensures dots
   *  are moved back to their place in the grid
   */
  function highlightInst() {
    var field = "itypewide";
    var legendDelay = 500;
    var legendBlock = legends.get(field);
    var legendBar = legendBars.get(field)['bar'];
    var legendBack = legendBars.get(field)['back'];
    hideLegend();
    hideAxis();
    hideBars();
    hideSankey();

    dotTitles.text(function (d) {
      return d['itypeclean'] + " (click to view details)";
    });

    countTitle.transition()
      .duration(300)
      .attr('opacity', 0);
    countingTag.transition()
      .duration(300)
      .attr('opacity', 0);
    numberTag.transition()
      .duration(300)
      .attr('opacity', 0);

    // Sort by gender
    sortBy(dots, field);

    dots.transition()
      .duration(800)
      .attr('opacity', function (d) { return d[field] === "Unknown" ? 0.3 :
        1.0; })
      .attr('fill', function (d) { return colorPalette[d[field]]; })
      .attr('stroke', function (d) { return colorPalette[d[field]]; })
      .attr('stroke-width', 0);

    // use named transition to ensure
    // move happens even if other
    // transitions are interrupted.
    if (!fieldsToSort.get(field).sorted) {
      dots.transition('sort-fills')
        .duration(1000)
        .delay(1200)
        .attr('cx', function (d) { return d.x + dotRadius;})
        .attr('cy', function (d) { return d.y + dotRadius;});

      legendDelay = 2000;

      fieldsToSort.each(function (d, i) {
        d.sorted = i === field;
      });
    }

    // show legend
    legendBlock.transition()
      .duration(1000)
      .delay(legendDelay)
      .attr('opacity', 1.0);
    legendBar.transition()
      .duration(1000)
      .delay(legendDelay)
      .attr('opacity', 1.0);
    legendBack.transition()
      .duration(1000)
      .delay(legendDelay)
      .attr('opacity', 1.0);
    countTag.transition()
      .duration(1000)
      .delay(legendDelay)
      .attr('opacity', 1.0);

  }

  /**
   * showMentalImpacts - barchart
   *
   * hides: dot grid
   * hides: histogram
   * shows: barchart
   *
   */
  function showMentalImpacts() {
    // ensure bar axis is set
    showAxis(xAxisBar);
    hideLegend();

    dots.transition()
      .duration(800)
      .attr('opacity', 0);

    g.selectAll('.fill-dot')
      .transition()
      .duration(800)
      .attr('cx', 0)
      .attr('cy', function (d, i) {
        return yBarScale(i % 3) + yBarScale.bandwidth() / 2;
      })
      .transition()
      .duration(0)
      .attr('opacity', 0);

    g.selectAll('.hist')
      .transition()
      .duration(600)
      .attr('height', function () { return 0; })
      .attr('y', function () { return height; })
      .style('opacity', 0);

    g.selectAll('.bar')
      .transition()
      .delay(function (d, i) { return 300 * (i + 1);})
      .duration(600)
      .attr('width', function (d) { return xBarScale(d.value); });

    g.selectAll('.bar-text')
      .transition()
      .duration(600)
      .delay(1200)
      .attr('opacity', 1);
  }

  function showSankey() {
    hideLegend();
    hideAxis();
    hideBars();

    dots.transition()
      .duration(800)
      .attr('opacity', 0);

    var sank = d3.select('.sankey');

    sank.transition()
      .duration(0)
      .style('display', 'block');

    sank.transition('show-sankey')
      .duration(600)
      .attr('opacity', 1.0);
    sankLegend.transition()
      .duration(600)
      .attr('opacity', 1.0);
  }

  function hideSankey() {
    var sank = d3.select('.sankey');

    sank.transition('hide-sankey')
      .duration(600)
      .attr('opacity', 0);
    sankLegend.transition()
      .duration(600)
      .attr('opacity', 0);

    sank.transition()
      .duration(0)
      .delay(800)
      .style('display', 'none');
  }

  function hideBars() {
    g.selectAll('.bar')
      .transition()
      .duration(600)
      .attr('width', 0);

    g.selectAll('.bar-text')
      .transition()
      .duration(100)
      .attr('opacity', 0);
  }

  /**
   * showAxis - helper function to
   * display particular xAxis
   *
   * @param axis - the axis to show
   *  (xAxisHist or xAxisBar)
   */
  function showAxis(axis) {
    hideSankey();
    g.select('.x.axis')
      .call(axis)
      .transition().duration(500)
      .style('opacity', 1);
  }

  /**
   * hideAxis - helper function
   * to hide the axis
   *
   */
  function hideAxis() {
    g.select('.x.axis')
      .transition().duration(500)
      .style('opacity', 0);
  }

  /**
   * UPDATE FUNCTIONS
   *
   * These will be called within a section
   * as the user scrolls through it.
   *
   * We use an immediate transition to
   * update visual elements based on
   * how far the user has scrolled
   *
   */

  /**
   * updateCough - increase/decrease
   * cough text and color
   *
   * @param progress - 0.0 - 1.0 -
   *  how far user has scrolled in section
   */
  function updateCough(progress) {
    g.selectAll('.cough')
      .transition()
      .duration(0)
      .attr('opacity', progress);

    g.selectAll('.hist')
      .transition('cough')
      .duration(0)
      .style('fill', function (d) {
        return (d.x0 >= 14) ? coughColorScale(progress) : '#008080';
      });
  }

  /**
   * DATA FUNCTIONS
   *
   * Used to coerce the data into the
   * formats we need to visualize
   *
   */

  function updateDotPos(d, i) {
    // positioning for dot visual
    // stored here to make it easier
    // to keep track of
    d.row = i % numPerCol;
    d.y = d.row * (dotSize + dotPad);
    d.col = Math.floor(i / numPerCol);
    d.x = d.col * (dotSize + dotPad);
  }

  /**
   * getIncidents - maps raw data to
   * array of data objects. There is
   * one data object for each word in the speach
   * data.
   *
   * This function converts some attributes into
   * numbers and adds attributes used in the visualization
   *
   * @param rawData - data read in from file
   */
  function getIncidents(rawData) {
    d3.shuffle(rawData);
    return rawData.map(function (d, i) {
      d.id = +d.id;
      // target/perpetrator status
      d.targetrank = +d.targetrank;
      d.perpetrank = +d.perpetrank;
      d.fillerNum = 3;
      d.filler = true;
      // time in seconds word was spoken
      d.time = 61;
      // time in minutes word was spoken
      d.min = Math.floor(d.time / 60);

      updateDotPos(d, i);
      return d;
    });
  }

  /**
   * getFillerWords - returns array of
   * only filler words
   *
   * @param data - word data from getIncidents
   */
  function getFillerWords(data) {
    return data.filter(function (d) {return d.filler; });
  }

  /**
   * getHistogram - use d3's histogram layout
   * to generate histogram bins for our word data
   *
   * @param data - word data. we use filler words
   *  from getFillerWords
   */
  function getHistogram(data) {
    // only get words from the first 30 minutes
    var thirtyMins = data.filter(function (d) { return d.min < 30; });
    // bin data into 2 minutes chuncks
    // from 0 - 31 minutes
    // @v4 The d3.histogram() produces a significantly different
    // data structure then the old d3.layout.histogram().
    // Take a look at this block:
    // https://bl.ocks.org/mbostock/3048450
    // to inform how you use it. Its different!
    return d3.histogram()
      .thresholds(xHistScale.ticks(10))
      .value(function (d) { return d.min; })(thirtyMins);
  }

  /**
   * groupBy - group words together
   * using nest. Used to get counts for
   * barcharts.
   *
   * @param keyword
   * @param incidents
   */
  function groupBy(keyword, incidents) {
    return d3.nest()
      .key(function (d) { return d[keyword]; })
      .rollup(function (v) { return v.length; })
      .entries(incidents)
      .sort(function (a, b) {return b.value - a.value;});
  }

  function groupTarPerp(keyword, incidents) {
    var orders = d3.nest()
      .key(function (d) { return d[keyword]; })
      .key(function (d) { return d[keyword.substring(0,6)+"rank"] })
      .rollup(function (v) { return v.length; })
      .entries(incidents)
      .sort(function (a, b) {
        return b.values[0].key - a.values[0].key;});
    var order = [];
    orders.forEach(function (d) { order.push(d.key) });
    return d3.nest()
      .key(function (d) { return d[keyword]; })
      .rollup(function (v) { return v.length; })
      .entries(incidents)
      .sort(function (a, b) {
        return order.indexOf(a.key) - order.indexOf(b.key); });
  }


  function getRank(title, order) {
    return order.length - order.indexOf(title) - 1;
  }
  function getTitle(rank, order) {
    return order[order.length - rank - 1];
  }

  /**
   * sortBy - sort Incidents by key field.
   *
   * @param incidents
   * @param field
   */
  function sortBy(incidents, field) {
    return fieldsToSort.has(field)?
      incidents.sort(function (a, b) { return d3.ascending(
        fieldsToSort.get(field).orderedKeys.indexOf(a[field]),
        fieldsToSort.get(field).orderedKeys.indexOf(b[field]));
      })
      .each(updateDotPos) : incidents;
  }

  /**
   * activate -
   *
   * @param index - index of the activated section
   */
  chart.activate = function (index) {
    activeIndex = index;
    var sign = (activeIndex - lastIndex) < 0 ? -1 : 1;
    var scrolledSections = d3.range(lastIndex + sign, activeIndex + sign, sign);
    scrolledSections.forEach(function (i) {
      activateFunctions[i]();
    });
    lastIndex = activeIndex;
  };

  /**
   * update
   *
   * @param index
   * @param progress
   */
  chart.update = function (index, progress) {
    updateFunctions[index](progress);
  };

  // return chart function
  return chart;
};


/**
 * display - called once data
 * has been loaded.
 * sets up the scroller and
 * displays the visualization.
 *
 * @param data - loaded tsv data
 */
function display(data) {
  // create a new plot and
  // display it
  var plot = scrollVis();
  d3.select('#vis')
    .datum(data)
    .call(plot);

  // setup scroll functionality
  var scroll = scroller()
    .container(d3.select('#graphic'));

  // pass in .step selection as the steps
  scroll(d3.selectAll('.step'));

  // setup event handling
  scroll.on('active', function (index) {
    // highlight current step text
    d3.selectAll('.step')
      .style('opacity', function (d, i) { return i === index ? 1 : 0.1; });

    // activate current section
    plot.activate(index);
  });

  scroll.on('progress', function (index, progress) {
    plot.update(index, progress);
  });
}

// load data and display
d3.tsv('data/data_v_0420_c.tsv', display);
