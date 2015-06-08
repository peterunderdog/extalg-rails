$('canvas.qdraw').ready(function() {

	var theCanvas = $(this);

	var QPoint = function(pt, label)
	{
		this.pt = pt;
		this.label = label;

		this.draw = function()
		{
			theCanvas.drawArc({
  		strokeStyle: '#000',
  		strokeWidth: 1,
  		draggable: false,
  		fillStyle: 'black',
  		x: this.pt.x, y: this.pt.y,
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
			theCanvas.drawGrid();
			for (ix in this.qitems) {
				this.qitems[ix].draw();
			}
		};
	};

	var quiver = new Quiver();

	theCanvas.GRID_SIZE = 20;
	theCanvas.SNAP_TOL = 8;

	theCanvas.drawGrid = function() {
		var height = theCanvas.height();
		var width = theCanvas.width();

		var x = this.GRID_SIZE;
		var y = this.GRID_SIZE;

		while (x < width || y < height)
		{
			if (x < width)
			{
				theCanvas.drawLine({strokeStyle: '#aaa', strokeWidth: 1, 
					x1: x, y1: 0, x2: x, y2: height});
				x += this.GRID_SIZE;
			}
			if (y < height)
			{
				theCanvas.drawLine({strokeStyle: '#aaa', strokeWidth: 1, 
					x1: 0, y1: y, x2: width, y2: y});
				y += this.GRID_SIZE;
			}
		}
	};

	theCanvas.snapPoint = function(x, y) {
		var roundx = Math.round(x/this.GRID_SIZE)*this.GRID_SIZE;
		var roundy = Math.round(y/this.GRID_SIZE)*this.GRID_SIZE;
		if (Math.abs(x-roundx) < this.SNAP_TOL && Math.abs(y-roundy) < this.SNAP_TOL)
		{
			return {x: roundx, y: roundy};
		}
		else
		{
			return null;
		}
	};

	theCanvas.click(function(e){
		var pt = theCanvas.snapPoint(e.offsetX, e.offsetY);
		if (pt != null)
		{
			var qpoint = new QPoint(pt, "1");
			quiver.add(qpoint);
			quiver.draw();
		}
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