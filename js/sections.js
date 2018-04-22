// Constants to define the size
// and margins of the vis area.
const width = 600;
const height = 520;
const margin = { top: 0, left: 20, bottom: 40, right: 10 };

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
  var dotRadius = 3;
  var dotSize = dotRadius * 2;
  var dotPad = 2;
  var numPerRow = width / (dotSize + dotPad);

  // main svg used for visualization
  var svg = null;

  // d3 selection that will be used
  // for displaying visualizations
  var g = null;

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
  var color = d3.scaleSequential(d3.interpolateGreens);

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
      this.counts = groupFunc(field, IncidentsData);
      this.orderedKeys = d3.values(this.counts).map(function(d) { return d.key; });
      var unkIndex = this.orderedKeys.indexOf("Unknown");
      if (unkIndex > -1) {
        this.orderedKeys.splice(unkIndex, 1);
        this.orderedKeys.push("Unknown");
      }
      this.maxKey = this.orderedKeys[0];
      this.sorted = false;
    }
  }

  // All fields to sort for dot matrices
  var fieldsToSort = d3.map();

  // sankey diagram
  var sankey = d3.sankey()
    .nodeWidth(50)
    .nodePadding(10)
    .size([width, height]);

  var path = sankey.link();

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
      var svgE = svg.enter().append('svg').attr('class', 'scroller');
      // @v4 use merge to combine enter and existing selection
      svg = svg.merge(svgE);

      svg.attr('width', width + margin.left + margin.right);
      svg.attr('height', height + margin.top + margin.bottom);

      svg.append('g');


      // this group element will be used to contain all
      // other elements.
      g = svg.select('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
      g.attr('class', 'dotbar');

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

      var fillerCounts = [{key:'anxiety',value:296},{key:'depression',value: 263},{key:'stressful',value: 189},{key:'angry',value:153},{key:'fear',value:133},{key:'therapy',value:129},{key:'doubted',value:117},{key:'ptsd',value:85},{key:'lost',value:73},{key:'lonely',value:66},{key:'bad',value:59},{key:'shame',value:57},{key:'panic',value:52},{key:'upset',value:39},{key:'wary',value:34},{key:'worried',value:33},{key:'uncomfortable',value:32},{key:'struggle',value:32},{key:'suicide',value:30}]//,{key:'worried',value:'33'},{key:'worried',value:'33'},{key:'worried',value:'33'},{key:'worried',value:'33'},{key:'worried',value:'33'},{key:'worried',value:'33'},{key:'worried',value:'33'},{key:'worried',value:'33'},{key:'worried',value:'33'},{key:'worried',value:'33'},{key:'worried',value:'33'},{key:'worried',value:'33'},{key:'worried',value:'33'},{key:'worried',value:'33'},{key:'worried',value:'33'}]

      // set the bar scale's domain
      // var genderCountMax = d3.max(fieldsToSort.get("gendersclean").counts,function (d) { return d.value; });

      // xBarScale.domain([0, genderCountMax]);
      color.domain([0, d3.max(fillerCounts, function(d) { return d.value; })]);
      // console.log(color)

      var countMax = d3.max(fillerCounts, function (d) { return d.value;});
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
      fieldsToSort.get("perpetkeyword").counts.forEach(function (d) {
        graph.nodes.push("p_" + d.key);
      });
      fieldsToSort.get("targetkeyword").counts.forEach(function (d) {
        graph.nodes.push("t_" + d.key);
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
      setupVis(incidentsData, fillerCounts, histData);
      

      setupSections();
    });
  };


  /**
   * setupVis - creates initial elements for all
   * sections of the visualization.
   *
   * @param IncidentData - data object for each word.
   * @param fillerCounts - nested data that includes
   *  element for each filler word type.
   * @param histData - binned histogram data
   */
  var setupVis = function (IncidentData, fillerCounts, histData) {
    // axis
    g.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + height + ')')
      .call(xAxisBar);
    g.select('.x.axis').style('opacity', 0);

    // count vis title
    g.append('text')
      .attr('class', 'title vis-title')
      .attr('x', 0)
      .attr('y', height / 3)
      .text('Sexual Harassment');

    g.append('text')
      .attr('class', 'sub-title vis-title highlight')
      .attr('x', 0)
      .attr('y', (height / 3) + (height / 5))
      .text('in Academia');

    g.selectAll('.vis-title')
      .attr('opacity', 0);

    // count filler word count title
    g.append('text')
      .attr('class', 'title count-title highlight')
      .attr('x', 0)
      .attr('y', height / 3)
      .text('' + countIncidents);

    g.append('text')
      .attr('class', 'sub-title count-title')
      .attr('x', 0)
      .attr('y', (height / 3) + (height / 5))
      .text('Reported incidents');

    g.selectAll('.count-title')
      .attr('opacity', 0);

    // dot grid
    // @v4 Using .merge here to ensure
    // new and old data have same attrs applied
    var dots = g.selectAll('.dot').data(IncidentData, function (d) { return d.word; });
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

    // barchart
    // @v4 Using .merge here to ensure
    // new and old data have same attrs applied
    var bars = g.selectAll('.bar').data(fillerCounts);
    var barsE = bars.enter()
      .append('rect')
      .attr('class', 'bar');
    bars = bars.merge(barsE)
      .attr('x', 0)
      .attr('y', function (d, i) { return yBarScale(i);})
      .attr('fill', '#d7443f')//function (d, i) { return barColors[i]; }) #######color######
      .attr('width', 0)
      .attr('height', yBarScale.bandwidth());

    var barText = g.selectAll('.bar-text').data(fillerCounts);
    barText.enter()
      .append('text')
      .attr('class', 'bar-text')
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
      .attr('class', 'hist');
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
      linkOpacity = d3.scaleLinear().domain([0, linkMax]).range([0.05, 0.3]);

    // sankey diagram
    var sank = svg.append('g')
      .attr('class', 'sankey')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
      .attr('opacity', 0);

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

    // add the rectangles for the nodes
    node.append("rect")
      .attr('class', function (d) { return "node-rect " + d.name })
      .attr("height", function(d) { return d.dy; })
      .attr("width", sankey.nodeWidth())
      .style("fill", '#d7443f')
      .style('fill-opacity', function (d) { return nodeOpacity(d.value); })
      .style("stroke", "none")
      .append("title").text(function(d) {
        return d.title + "\n" + format(d.value); });

    node.on('mouseenter',
      function (d) { var n = d3.select(this);
        n.classed('hl', true);
        d3.selectAll('.link.' + d.name).classed('hl', true); })
      .on('mouseout', function (d) {
        var n = d3.select(this);
        n.classed('hl', false);
        d3.selectAll('.link.' + d.name).classed('hl', false);
      });

    // add in the title for the nodes
    node.append("text")
      .attr('class', function (d) { return "node-title " + d.name })
      .attr("x", -6)
      .attr("y", function(d) { return d.dy / 2; })
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
    activateFunctions[1] = showFillerTitle;
    activateFunctions[2] = showGrid;
    activateFunctions[3] = highlightReported;
    activateFunctions[4] = highlightGender;
    activateFunctions[5] = highlightInst;
    activateFunctions[6] = showMentalImpacts;
    activateFunctions[7] = showSankey;

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
    hideAxis();
    hideBars();
    hideSankey();

    g.selectAll('.count-title')
      .transition()
      .duration(0)
      .attr('opacity', 0);

    g.selectAll('.vis-title')
      .transition()
      .duration(600)
      .attr('opacity', 1.0);
  }

  /**
   * showFillerTitle - filler counts
   *
   * hides: intro title
   * hides: dot grid
   * shows: filler count title
   *
   */
  function showFillerTitle() {
    hideAxis();
    hideBars();
    hideSankey();

    g.selectAll('.vis-title')
      .transition()
      .duration(0)
      .attr('opacity', 0);

    g.selectAll('.dot')
      .transition()
      .duration(0)
      .attr('opacity', 0);

    g.selectAll('.count-title')
      .transition()
      .duration(600)
      .attr('opacity', 1.0);
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
    hideAxis();
    hideBars();
    hideSankey();

    g.selectAll('.count-title')
      .transition()
      .duration(0)
      .attr('opacity', 0);

    g.selectAll('.dot')
      .transition()
      .duration(600)
      .delay(function (d) {
        return 5 * d.row;
      })
      .attr('opacity', 1.0)
      .attr('fill', '#d7443f');
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
    hideAxis();
    hideBars();
    hideSankey();

    g.selectAll('.bar')
      .transition()
      .duration(600)
      .attr('width', 0);

    g.selectAll('.bar-text')
      .transition()
      .duration(0)
      .attr('opacity', 0);

    var dots = g.selectAll('.dot');

    dots.transition()
      .duration(800)
      .attr('opacity', function (d) { return d[field] === "Unknown" ? 0.3 :
        1.0; })
      .attr('fill', function (d) { return d[field] ===
        fieldsToSort.get(field).maxKey ? '#d7443f' : '#ddd'; });

    // Sort by gender
    sortBy(dots, field);

    // use named transition to ensure
    // move happens even if other
    // transitions are interrupted.
    if (!fieldsToSort.get(field).sorted) {
      dots.transition('sort-fills')
        .duration(1000)
        .delay(1200)
        .attr('cx', function (d) { return d.x + dotRadius;})
        .attr('cy', function (d) { return d.y + dotRadius;});

      fieldsToSort.each(function (d, i) {
        d.sorted = i === field;
      });
    }
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
    hideAxis();
    hideBars();
    hideSankey();

    g.selectAll('.bar')
      .transition()
      .duration(600)
      .attr('width', 0);

    g.selectAll('.bar-text')
      .transition()
      .duration(0)
      .attr('opacity', 0);

    var dots = g.selectAll('.dot');

    dots.transition()
      .duration(800)
      .attr('opacity', function (d) { return d[field] === "Unknown" ? 0.3 :
        1.0; })
      .attr('fill', function (d) { return d[field] ===
        fieldsToSort.get(field).maxKey ? '#d7443f' : '#ddd'; });

    // Sort by gender
    sortBy(dots, field);

    // use named transition to ensure
    // move happens even if other
    // transitions are interrupted.
    if (!fieldsToSort.get(field).sorted) {
      dots.transition('sort-fills')
        .duration(1000)
        .delay(1200)
        .attr('cx', function (d) { return d.x + dotRadius;})
        .attr('cy', function (d) { return d.y + dotRadius;});

      fieldsToSort.each(function (d, i) {
        d.sorted = i === field;
      });
    }
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
    hideAxis();
    hideBars();
    hideSankey();

    var dots = g.selectAll('.dot');

    dots.transition()
      .duration(800)
      .attr('opacity', function (d) { return d[field] === "Unknown" ? 0.3 :
        1.0; })
      .attr('fill', function (d) { return d[field] ===
        fieldsToSort.get(field).maxKey ? '#d7443f' : '#ddd'; });

    // Sort by gender
    sortBy(dots, field);

    // use named transition to ensure
    // move happens even if other
    // transitions are interrupted.
    if (!fieldsToSort.get(field).sorted) {
      dots.transition('sort-fills')
        .duration(1000)
        .delay(1200)
        .attr('cx', function (d) { return d.x + dotRadius;})
        .attr('cy', function (d) { return d.y + dotRadius;});

      fieldsToSort.each(function (d, i) {
        d.sorted = i === field;
      });
    }
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

    g.selectAll('.dot')
      .transition()
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
    hideAxis();
    hideBars();

    var sank = d3.select('.sankey');

    sank.transition()
      .duration(0)
      .style('display', 'block');

    sank.transition('show-sankey')
      .duration(600)
      .attr('opacity', 1.0);
  }

  function hideSankey() {
    var sank = d3.select('.sankey');

    sank.transition('hide-sankey')
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
    return rawData.map(function (d, i) {
      // target/perpetrator status
      d.targetrank = +d.targetrank;
      d.perpetrank = +d.perpetrank;
      d.fillerNum = 3;
      d.filler = true;
      // time in seconds word was spoken
      d.time = 61;
      // time in minutes word was spoken
      d.min = Math.floor(d.time / 60);

      // positioning for dot visual
      // stored here to make it easier
      // to keep track of.
      d.col = i % numPerRow;
      d.x = d.col * (dotSize + dotPad);
      d.row = Math.floor(i / numPerRow);
      d.y = d.row * (dotSize + dotPad);
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
      .each(function (d, i) {
        // recalculate dot positions
        d.col = i % numPerRow;
        d.x = d.col * (dotSize + dotPad);
        d.row = Math.floor(i / numPerRow);
        d.y = d.row * (dotSize + dotPad);
      }) :
      incidents;
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
