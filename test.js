gender_data = {'male': 2218,
'female' : 132,
'non_binary': 54,
'unsure': 22,
'none': 14}

insti_data = {'Big Ten': 1,
         'Canada': 6,
         'Community College': 1,
         'Conference': 101,
         'Elite Institution/Ivy League': 613,
         'Field': 3,
         'High School': 7,
         'Liberal Arts': 1,
         'Library and Archive': 1,
         'Multiple': 5,
         'Other': 2,
         'Other R1': 949,
         'Other Research Agency': 35,
         'Other Type of School': 276,
         'R1': 29,
         'R2': 167,
         'R3': 1,
         'Regional Teaching College': 81,
         'Small Liberal Arts College': 400,
         'UK': 1,
         'Unknown': 84,
         'nan': 2}
Object.prototype.getKeyByValue = function( value ) {
    for( var prop in this ) {
        if( this.hasOwnProperty( prop ) ) {
             if( this[ prop ] === value )
                 return prop;
        }
    }
}
colors = ['#EE867C','#EC8590','#E487A4','#D48EB7','#BD96C5','#A09ECE','#80A6CF','#5FADCA','#41B2BD','#32B5AB','#3DB695','#55B57D','#6FB366','#8AAF52','#A4A943','#BDA13C','#D39840','#E68D4D']
colors = colors.reverse()
function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
function generate_num(dict){
    l = []
    num_list = []
    name_list = []
    color_list = []

    for(i = 0; i< Object.keys(dict).length; i++){
      l.push(dict[Object.keys(dict)[i]])
    }
    l = l.sort(function(a, b){return a - b})
    console.log(l)
    for(i = 0; i<l.length; i++){
      name_list.push(dict.getKeyByValue(l[i]))
    }
    num_list.push(l[0])
    for(i = 0; i<l.length; i++){
      num_list.push(l[i]+l[i+1])
    }
    num_list.pop()

  //generate color
  for(i = 0; i < l.length; i++){
      color_list.push(getRandomColor())
}
  return [num_list,name_list,color_list]
  }

function gridLayout(points, pointRadius, gridWidth) {
  const pointsPerRow = Math.floor(gridWidth / pointRadius)
  const numRows = points.length / pointsPerRow

  points.forEach((point, i) => {
    point.x = pointRadius * (i % pointsPerRow)
    point.y = pointRadius* Math.floor(i / pointsPerRow)
  })
  return points
}

function draw(canvas, num = [2472], color = ['red']){
  //set up canvas
  const ctx = canvas.node().getContext('2d')
  ctx.save()
  //erase what is on the canvas currently
  ctx.clearRect(0,0,width, height)

  j = 0
  for (let i = 0; i < num.length; i++) {//i = 1,2,3
    while(j < num[i]){ //j = 1-50
      const point = points[j]
      ctx.fillStyle = color[i]
      ctx.beginPath()
          ctx.arc(point.x+5, point.y+5, pointRadius, 0, 2 * Math.PI, false);
          ctx.fill()
          j++;
    }
  }
  ctx.restore()

}
const width = 960;
const height = 700;
const pointRadius = 4;
const color = d3.scaleOrdinal([50])
// bar plot
var margin = {top: 20, right: 20, bottom: 30, left: 40};
// set the ranges
var x = d3.scaleBand()
          .range([0, width])
          .padding(0.1);
var y = d3.scaleLinear()
          .range([height, 0]);

cate_list = ['overview','perpetrator gender','institution','reported or not']
select = d3.select('body')
        .append('select')
        .attr('id','select')
    options = select 
        .selectAll('options')
        .data(cate_list).enter()
        .append('option')
            .text(function(d){return d;})
function changeColor(data,key){

}    
console.log(options)
// create set of points
const numPoints = 2500;
const points = d3.range(numPoints).map(index =>({
  id: index,
  color: 'red'
}));
const pointMargin = 10;

const screenScale = window.devicePixelRatio || 1;
const canvas = d3.select('#first').append('canvas')
  .attr('width', width * screenScale)
  .attr('height', height* screenScale)
  .attr('class','vis')
  .attr('id','fir')
  .style('width', `${width}px`)
  .style('height', `${height}px`)
  .attr('margin',20);

canvas.node().getContext('2d').scale(screenScale, screenScale);
gridLayout(points, pointRadius + pointMargin,width)
draw(canvas)


gender_data = {'male': 2218,
'female' : 132,
'non_binary': 54,
'unsure': 22,
'none': 14}
//second illustration
const canvas2 = d3.select('#second').append('canvas')
  .attr('width', width * screenScale )
  .attr('height', height * screenScale)
  .attr('class','vis')
  .style('width', `${width}px`)
  .style('height', `${height}px`)
  .attr('margin',[20])


canvas2.node().getContext('2d').scale(screenScale, screenScale);
gridLayout(points, pointRadius+pointMargin,width)
draw(canvas2,generate_num(gender_data)[0], ['#ddd','grey','red','blue'])

//third visualization
 
const canvas3 = d3.select('#third').append('canvas')
  .attr('width', width * screenScale )
  .attr('height', height * screenScale)
  .attr('class','vis')
  .style('width', `${width}px`)
  .style('height', `${height}px`)
  .attr('margin',20);

insti = [67, 234,916,1523,2472]
canvas3.node().getContext('2d').scale(screenScale, screenScale);
gridLayout(points, pointRadius+pointMargin,width)
draw(canvas3, num = insti, ['grey','yellow','red','blue','purple'])

//change color
//fourth visualization

const canvas4 = d3.select('#fourth').append('canvas')
  .attr('width', width * screenScale )
  .attr('height', height * screenScale)
  .attr('class','vis')
  .style('width', `${width}px`)
  .style('height', `${height}px`)
  .attr('margin',20)
console.log(canvas2,generate_num(gender_data)[0])
console.log([636,863,963])
canvas4.node().getContext('2d').scale(screenScale, screenScale);
gridLayout(points, pointRadius+pointMargin,width)
draw(canvas4,[636,1499,2472],['red','#bbb','#eee'])


$(document).ready(function() {
  $('#fullpage').fullpage({
    slidesNavigation: true,
  });
});

