// read in the data
list_of_emotions = ['abusive','affected','angry','anxiety','bad','blamed','depression','disorder','doubted','fear','lonely','lost','panic','ptsd','sad','shame','stressful','struggling','sufferring','suicidal','therapy','uncomfortable','unsafe','upset','vulnerable','wary','worried','worse']
var categoryScale = d3.scaleOrdinal().domain(list_of_emotions).range([list_of_emotions.length]);
var svg = d3.select('#fifth').append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", 
          "translate(" + margin.left + "," + margin.top + ")");
d3.csv("emotion_count.csv", function(data) {
  // format the data
  data.forEach(function(d) {
    d.count =+ d.count;
  });

  // Scale the range of the data in the domains
  x.domain(data.map(function(d) { return d.word; }));
  y.domain([0, d3.max(data, function(d) { return d.count; })]);

  // append the rectangles for the bar chart
  svg.selectAll(".bar")
      .data(data)
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return x(d.word); })
      .attr("width", x.bandwidth())
      .attr("y", function(d) { return y(d.count); })
      .attr("height", function(d) { return height - y(d.count); });

  // append the dots
  dots = svg.selectAll('.bar')
            .enter().append('circle')
            .attr("cx", function(d,i) {return xScale(d.x); })
            .attr("cy", function(d,i) { return yScale(d.y); })
         
  // add the x Axis
  svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .attr("padding","10")
      .call(d3.axisBottom(x).ticks(10))
      .selectAll("text")
        .attr("transform", "rotate(-65)")
        .style("text-anchor", "end")
            .attr("dx", "-0.5em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)");
  // add the y Axis
  svg.append("g")
      .call(d3.axisLeft(y));
});

