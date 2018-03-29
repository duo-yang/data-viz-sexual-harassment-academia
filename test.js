function gridLayout(points, pointRadius, gridWidth) {
	const pointsPerRow = Math.floor(gridWidth / pointRadius)
	const numRows = points.length / pointsPerRow

	points.forEach((point, i) => {
		point.x = pointRadius * (i % pointsPerRow)
		point.y = pointRadius* Math.floor(i / pointsPerRow)
	})
	return points
}

function draw(){
	//set up canvas
	const ctx = canvas.node().getContext('2d')
	ctx.save()

	//erase what is on the canvas currently
	ctx.clearRect(0,0,width, height)

	//draw each point
	for(let i = 0; i<points.length; i++){
		const point = points[i]
		ctx.fillStyle = 'red'
		ctx.beginPath();
      	ctx.arc(point.x, point.y, pointRadius, 0, 2 * Math.PI, false);
      	ctx.fill()
	}
	ctx.restore()
}
const width = window.innerWidth;
const height = window.innerHeight;
const pointRadius = 4;
// create set of points
const numPoints = 2500
const points = d3.range(numPoints).map(index =>({
	id: index,
	color: 'red'
}))
const pointMargin = 10
//create canvas
const screenScale = window.devicePixelRatio || 1;
const canvas = d3.select('body').append('canvas')
  .attr('width', width * screenScale)
  .attr('height', height * screenScale)
  .style('width', `${width}px`)
  .style('height', `${height}px`)
  .on('click', function () {
    d3.select('.play-control').style('display', '');
    timer.stop();
  });
canvas.node().getContext('2d').scale(screenScale, screenScale);


gridLayout(points, pointRadius+pointMargin,width)
draw()