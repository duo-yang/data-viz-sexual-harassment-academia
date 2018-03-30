function gridLayout(points, pointRadius, gridWidth) {
	const pointsPerRow = Math.floor(gridWidth / pointRadius)
	const numRows = points.length / pointsPerRow

	points.forEach((point, i) => {
		point.x = pointRadius * (i % pointsPerRow)
		point.y = pointRadius* Math.floor(i / pointsPerRow)
	})
	return points
}

function draw(canvas,num = 0,color = 'red'){
	//set up canvas
	const ctx = canvas.node().getContext('2d')
	ctx.save()

	//erase what is on the canvas currently
	ctx.clearRect(0,0,width, height)

	//draw each point
	for(let i = 0; i<points.length; i++){
		const point = points[i]
		if (i<num) 
			{ctx.fillStyle = 'grey'}
		else 
			{ctx.fillStyle = 'red'}
		ctx.beginPath();
      	ctx.arc(point.x+5, point.y+5, pointRadius, 0, 2 * Math.PI, false);
      	ctx.fill()
	}
	ctx.restore()
}
const width = 960;
const height = 700;
const pointRadius = 4;

// create set of points
const numPoints = 2500
const points = d3.range(numPoints).map(index =>({id: index,color: 'red'}))
const pointMargin = 10

//create canvas
const screenScale = window.devicePixelRatio || 1;
const canvas = d3.select('#first').append('canvas')
  .attr('width', width * screenScale)
  .attr('height', height* screenScale)
  .attr('class','vis')
  .style('width', `${width}px`)
  .style('height', `${height}px`)
  .attr('margin',20)

canvas.node().getContext('2d').scale(screenScale, screenScale);
gridLayout(points, pointRadius+pointMargin,width)
draw(canvas)

//second illustration
const canvas2 = d3.select('#second').append('canvas')
  .attr('width', width * screenScale )
  .attr('height', height * screenScale)
  .attr('class','vis')
  .style('width', `${width}px`)
  .style('height', `${height}px`)
  .attr('margin',20)

canvas2.node().getContext('2d').scale(screenScale, screenScale);
gridLayout(points, pointRadius+pointMargin,width)
draw(canvas2, num = 2000)

$(document).ready(function() {
	$('#fullpage').fullpage({
		slidesNavigation: true,
	});
	
});

  // .on('click', function () {
  //   // start the animation
  //   animate(layouts[currLayout]);

  //   // remove the play control
  //   d3.select(this).style('display', 'none');
  // });