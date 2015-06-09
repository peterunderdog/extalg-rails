$('canvas.qdraw').ready(function() {

	var theCanvas = $(this);

	var Grid = function(grid_size, snap_tol) {
		this.grid_size = grid_size;
		this.snap_tol = snap_tol;

		this.draw = function(canvas) {
			var height = canvas.height();
			var width = canvas.width();

			var x = this.grid_size;
			var y = this.grid_size;

			while (x < width || y < height)
			{
				if (x < width)
				{
					canvas.drawLine({strokeStyle: '#aaa', strokeWidth: 1, 
						x1: x, y1: 0, x2: x, y2: height});
					x += this.grid_size;
				}
				if (y < height)
				{
					canvas.drawLine({strokeStyle: '#aaa', strokeWidth: 1, 
						x1: 0, y1: y, x2: width, y2: y});
					y += this.grid_size;
				}
			}
		};

		this.snapPoint = function(x, y) {
			var roundx = Math.round(x/this.grid_size)*this.grid_size;
			var roundy = Math.round(y/this.grid_size)*this.grid_size;
			if (Math.abs(x-roundx) < this.snap_tol && Math.abs(y-roundy) < this.snap_tol)
			{
				return {x: roundx, y: roundy};
			}
			else
			{
				return null;
			}
		};
	};


	var QPoint = function(pt, label)
	{
		this.pt = pt;
		this.label = label;

		this.draw = function(canvas)
		{
			canvas.drawArc({
  		strokeStyle: '#000',
  		strokeWidth: 1,
  		draggable: false,
  		fillStyle: 'black',
  		x: this.pt.x, y: this.pt.y,
  		radius: 4
			});

			canvas.drawText({
			  fillStyle: 'black',
			  strokeStyle: 'black',
			  strokeWidth: 2,
			  x: this.pt.x, y: this.pt.y+14,
			  fontSize: 12,
			  fontFamily: 'Verdana, sans-serif',
			  text: this.label
			});
		};
	};

	var Quiver = function()
	{
		this.qitems = [];
		this.labelsUsed = [];
		this.labelsAvailable = "123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0".split('');
		this.grid = new Grid(20, 8);

		this.add = function(qitem) {
			this.qitems.push(qitem);
		};

		this.getLabel = function() {
			if (this.labelsAvailable.length == 0)
			{
				throw "All out of labels";
			}
			var label = this.labelsAvailable[0];
			this.labelsAvailable.shift();
			this.labelsUsed.unshift(label);
			return label;
		}

		this.addPoint = function(pt) {
			var label = this.getLabel();
			var qpoint = new QPoint(pt, label);
			this.add(qpoint);
		};

		this.deleteItem = function(qitem) {
			var idx = this.qitems.indexOf(qitem);
			if (idx > -1)
			{
				this.qitems.splice(idx, 1);
			}
		};

		this.draw = function(canvas) {
			canvas.clearCanvas();
			this.grid.draw(canvas);
			for (ix in this.qitems) {
				this.qitems[ix].draw(canvas);
			}
		};
	};

	var quiver = new Quiver();
	quiver.grid.draw(theCanvas);

	theCanvas.click(function(e){
		var pt = quiver.grid.snapPoint(e.offsetX, e.offsetY);
		if (pt != null)
		{
			quiver.addPoint(pt);
			quiver.draw(theCanvas);
		}
		}).mouseover(function(e){
			quiver.draw(theCanvas);
		}).mousedown(function(e) {
			console.log("mousedown");
			e.preventDefault();
		}).mousemove(function(e) {
			console.log("mousemove");
			e.preventDefault();
		});
});