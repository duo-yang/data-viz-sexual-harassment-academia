// read in the data

// list_of_emotions = ['abusive','affected','angry','anxiety','bad','blamed','depression','disorder','doubted','fear','lonely','lost','panic','ptsd','sad','shame','stressful','struggling','sufferring','suicidal','therapy','uncomfortable','unsafe','upset','vulnerable','wary','worried','worse']
// var categoryScale = d3.scaleOrdinal().domain(list_of_emotions).range([list_of_emotions.length]);
// var svg = d3.select('#fifth').append("svg")
//     .attr("width", width + margin.left + margin.right)
//     .attr("height", height + margin.top + margin.bottom)
//   .append("g")
//     .attr("transform", 
//           "translate(" + margin.left + "," + margin.top + ")");


d3.csv("emotion_count.csv", function(data) {
  // format the data
  //sort bars based on value
        console.log(data)
        data = data.sort(function (a, b) {
            return d3.ascending(a.count, b.count);
        })

        //set up svg using margin conventions - we'll need plenty of room on the left for labels
        var margin = {
            top: 15,
            right: 25,
            bottom: 15,
            left: 60
        };

        var width = 960 - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom;

        var svg = d3.select("#fifth").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        x.domain([0, d3.max(data, function(d) { return d.count; })]);
        // var x = d3.scaleLinear()
        //     .range([0, width])
        //     .domain([0, d3.max(data, function (d) {
        //         return d.count;
        //     })]);
        y.domain(data.map(function(d) { return y.word; }));
        // var y = d3.scaleOrdinal()
        //     .range([height, 0])
        //     // .padding(0.1)
        //     .domain(data.map(function (d) {
        //         return d.word;
        //     }));

        //make y axis to show bar names
        // var yAxis = d3.svg.axis()
        //     .scale(y)
        //     //no tick marks
        //     .tickSize(0)
        //     .orient("left");
        // var gy = svg.append("g")
        //     .attr("class", "y axis")
        //     .call(yAxis)
        // Add the y Axis
        svg.append("g")
            .call(d3.axisLeft(y))

        var bars = svg.selectAll(".bar")
            .data(data)
            .enter()
            .append("g")

        //append rects
        bars.append("rect")
            .attr("class", "bar")
            .attr("y", function (d) {
                return y(d.word);
            })
            .attr("height", y.bandwidth())
            .attr("x", 0)
            .attr("width", function (d) {
                return x(d.count);
            });

        //add a value label to the right of each bar
        bars.append("text")
            .attr("class", "label")
            //y position of the label is halfway down the bar
            .attr("y", function (d) {
                return y(d.word) + y.bandwidth() / 2 + 4;
            })
            //x position is 3 pixels to the right of the bar
            .attr("x", function (d) {
                return x(d.count) + 3;
            })
            .text(function (d) {
                return d.count;
            });
});

