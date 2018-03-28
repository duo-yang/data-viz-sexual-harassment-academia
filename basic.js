

var points = [];

var width = 960,
    height = 500;

var pointGrid = d3.layout.grid()
  .points()
  .size([960, 360]);

var svg = d3.select("body").append("svg")
  .attr({
    width: width,
    height: height
  })
.append("g")
  .attr("transform", "translate(10,10)");

var tick = setInterval(push, 10);

function update() {
  var point = svg.selectAll(".point")
    .data(pointGrid(points));
  point.enter().append("circle")
    .attr("class", "point")
    .attr("r", 5)
    .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
  point.transition()
    .attr("r", 5)
    .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
  point.exit().transition()
    .attr("r", 5)
    .remove();
}

function push() {
  points.push({});
  update();
  if (points.length > 15) {
    clearInterval(tick);
    tick = setInterval(pop, 500);
  }
}

function pop() {
  points.pop();
  update();
  if (points.length < 2) {
    clearInterval(tick);
    tick = setInterval(push, 500);
  }
}

