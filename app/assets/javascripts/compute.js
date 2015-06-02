$('canvas.qdraw').ready(function(){

	var drawGrid = function() {
		var GRID_SIZE = 20;
		var height = $('canvas').height();
		var width = $('canvas').width();

		var x = GRID_SIZE;
		var y = GRID_SIZE;

		while (x < width || y < height)
		{
			if (x < width)
			{
				$('canvas.qdraw').drawLine({strokeStyle: '#aaa', strokeWidth: 1, 
					x1: x, y1: 0, x2: x, y2: height});
				x += GRID_SIZE;
			}
			if (y < height)
			{
				$('canvas.qdraw').drawLine({strokeStyle: '#aaa', strokeWidth: 1, 
					x1: 0, y1: y, x2: width, y2: y});
				y += GRID_SIZE;
			}
		}
	};

	drawGrid();

	$('canvas.qdraw').click(function(e){
		var x = e.offsetX;
		var y = e.offsetY;

		$('canvas.qdraw').drawArc({
  		strokeStyle: '#000',
  		strokeWidth: 1,
  		draggable: true,
  		fillStyle: 'black',
  		x: e.offsetX, y: e.offsetY,
  		radius: 4
		});
	});

});