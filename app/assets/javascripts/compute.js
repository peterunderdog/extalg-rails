$('canvas.qdraw').ready(function() {

	var QPoint = function(x, y, label)
	{
		this.x = x;
		this.y = y;
		this.label = label;

		this.draw = function(canvas)
		{
			$(canvas).drawArc({
  		strokeStyle: '#000',
  		strokeWidth: 1,
  		draggable: true,
  		fillStyle: 'black',
  		x: x, y: y,
  		radius: 4
			});
		};
	};

	var Quiver = function()
	{
		this.qitems = [];

		this.drawGrid = function(canvas) {
			var GRID_SIZE = 20;
			var height = $(canvas).height();
			var width = $(canvas).width();

			var x = GRID_SIZE;
			var y = GRID_SIZE;

			while (x < width || y < height)
			{
				if (x < width)
				{
					$(canvas).drawLine({strokeStyle: '#aaa', strokeWidth: 1, 
						x1: x, y1: 0, x2: x, y2: height});
					x += GRID_SIZE;
				}
				if (y < height)
				{
					$(canvas).drawLine({strokeStyle: '#aaa', strokeWidth: 1, 
						x1: 0, y1: y, x2: width, y2: y});
					y += GRID_SIZE;
				}
			}
		};

		this.add = function(qitem) {
			this.qitems.push(qitem);
		};

		this.draw = function(canvas) {
			$(canvas).clearCanvas();
			for (ix in this.qitems) {
				this.qitems[ix].draw(canvas);
			}
			this.drawGrid(canvas);
		};
	}

	var quiver = new Quiver();


	$('canvas.qdraw').click(function(e){
		var x = e.offsetX;
		var y = e.offsetY;

		var qpoint = new QPoint(x, y, "1");
		quiver.add(qpoint);
		quiver.draw(e.target);
		}).mouseover(function(e){
			quiver.draw(e.target);
		}).mousedown(function(e)
		{
			e.preventDefault();
		});


});