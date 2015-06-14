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

	var QArrow = function(start, end)
	{
		this.start = start;
		this.end = end;
		this.ARROW_OFFSET = 10;

		this.norm = function() {
			return Math.sqrt(Math.pow(this.end.pt.x - this.start.pt.x, 2) + 
				Math.pow(this.end.pt.y - this.start.pt.y, 2));
		};

		// vector in direction of arrow
		this.v = function(){
			return {x: end.pt.x - start.pt.x, y: end.pt.y - start.pt.y};
		};

		// unit vector in direction of arrow
		this.u = function(){
			return {x: this.v().x/this.norm(), y: this.v().y/this.norm()};
		};

		// unit vector perpendicular to arrow, normalized so x component non-negative
		this.p = function(){
			var xx = this.u().y;
			var yy = this.u().x;

			if (xx < 0.0)
			{
				xx=-xx;
				yy=-yy;
			}
			return {x: xx, y: yy};
		};

		this.drawStart = function(){
			var arrow_offset = (this.u().y > 0.0 && this.u().x > -0.45 && this.u().x < 0.45) ? 
			12 + this.ARROW_OFFSET : this.ARROW_OFFSET;

			console.log(this.u().x);

			return {x: Math.ceil(this.start.pt.x + this.u().x * arrow_offset), 
				y: Math.ceil(this.start.pt.y + this.u().y * arrow_offset)};
		};

		this.drawEnd = function(){
			var arrow_offset = (this.u().y < 0.0 && this.u().x > -0.45 && this.u().x < 0.45	) ? 
			12 + this.ARROW_OFFSET : this.ARROW_OFFSET;
			return {x: Math.ceil(this.end.pt.x - this.u().x * arrow_offset), 
				y: Math.ceil(this.end.pt.y - this.u().y * arrow_offset)};
		};

		this.draw = function(canvas)
		{
			$('canvas').drawLine({
			  strokeStyle: '#000',
			  strokeWidth: 2,
			  rounded: true,
			  endArrow: true,
			  arrowRadius: 10,
			  arrowAngle: 30,
			  x1: this.drawStart().x, y1: this.drawStart().y,
			  x2: this.drawEnd().x, y2: this.drawEnd().y
			});
		};
	};

	var Quiver = function(canvas)
	{
		this.qitems = [];
		this.labelsUsed = [];
		this.labelsAvailable = "123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0".split('');
		this.grid = new Grid(20, 8);
		this.canvas = canvas;

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
			return qpoint;
		};

		this.addArrow = function(start, end) {
			var qarrow = new QArrow(start, end);
			this.add(qarrow);
			return qarrow;
		};

		this.deleteItem = function(qitem) {
			var idx = this.qitems.indexOf(qitem);
			if (idx > -1)
			{
				this.qitems.splice(idx, 1);
			}
		};

		this.draw = function() {
			this.canvas.clearCanvas();
			this.grid.draw(this.canvas);
			for (ix in this.qitems) {
				this.qitems[ix].draw(this.canvas);
			}
		};
	};

	theCanvas.quiver = new Quiver(theCanvas);
	theCanvas.quiver.grid.draw(theCanvas);
	var qlast = null;

	theCanvas.click(function(e){
		var pt = theCanvas.quiver.grid.snapPoint(e.offsetX, e.offsetY);
		if (pt != null)
		{
			var qpoint = theCanvas.quiver.addPoint(pt);
			theCanvas.quiver.draw();
			if (qlast)
			{
				theCanvas.quiver.addArrow(qlast, qpoint);
				theCanvas.quiver.draw();
			}
			qlast = qpoint;
		}
		}).mouseover(function(e){
			console.log("mouseover");
		}).mousedown(function(e) {
			console.log("mousedown");
		}).mouseup(function(e){
			console.log("mouseup");
		}).mousemove(function(e) {
			console.log("mousemove");
		});
});