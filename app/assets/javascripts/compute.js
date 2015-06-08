$('canvas.qdraw').ready(function() {

	var theCanvas = $(this);

	var QPoint = function(x, y, label)
	{
		this.x = x;
		this.y = y;
		this.label = label;

		this.draw = function()
		{
			theCanvas.drawArc({
  		strokeStyle: '#000',
  		strokeWidth: 1,
  		draggable: false,
  		fillStyle: 'black',
  		x: x, y: y,
  		radius: 4
			});
		};
	};

	var Quiver = function()
	{
		this.qitems = [];

		this.add = function(qitem) {
			this.qitems.push(qitem);
		};

		this.draw = function() {
			theCanvas.clearCanvas();
			for (ix in this.qitems) {
				this.qitems[ix].draw();
			}
			theCanvas.drawGrid();
		};
	};

	var quiver = new Quiver();

	theCanvas.drawGrid = function() {
		var GRID_SIZE = 20;
		var height = theCanvas.height();
		var width = theCanvas.width();

		var x = GRID_SIZE;
		var y = GRID_SIZE;

		while (x < width || y < height)
		{
			if (x < width)
			{
				theCanvas.drawLine({strokeStyle: '#aaa', strokeWidth: 1, 
					x1: x, y1: 0, x2: x, y2: height});
				x += GRID_SIZE;
			}
			if (y < height)
			{
				theCanvas.drawLine({strokeStyle: '#aaa', strokeWidth: 1, 
					x1: 0, y1: y, x2: width, y2: y});
				y += GRID_SIZE;
			}
		}
	};


	theCanvas.click(function(e){
		var x = e.offsetX;
		var y = e.offsetY;

		var qpoint = new QPoint(x, y, "1");
		quiver.add(qpoint);
		quiver.draw();
		}).mouseover(function(e){
			quiver.draw(e.target);
		}).mousedown(function(e) {
			console.log("mousedown");
			e.preventDefault();
		}).mousemove(function(e) {
			console.log("mousemove");
			e.preventDefault();
		}).drawGrid();
});