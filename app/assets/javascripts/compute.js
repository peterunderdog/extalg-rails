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

		this.snapPoint = function(pt) {
			var roundx = Math.round(pt.x/this.grid_size)*this.grid_size;
			var roundy = Math.round(pt.y/this.grid_size)*this.grid_size;
			return {x: roundx, y: roundy};
		};
	};

	var distance = function(a, b) {
		return Math.sqrt(Math.pow(a.x-b.x, 2) + Math.pow(a.y-b.y, 2));
	};

	var QPoint = function(pt, label)
	{
		this.pt = pt;
		this.label = label;
		this.selected = false;

		this.itemType = function(){return 'point'};
		// distance from point pt
		this.distance = function(pt) {
			return Math.sqrt(Math.pow(this.pt.x-pt.x, 2) + Math.pow(this.pt.y-pt.y, 2));
		};

		this.to_str = function(){
			return "[" + this.label + "(" + this.pt.x + "," + this.pt.y + ")]";
		};

		this.selectedForDelete = function(){
			return this.selected;
		};

		this.draw = function(canvas)
		{
			canvas.drawArc({
  		strokeStyle: '#000',
  		strokeWidth: 1,
  		draggable: false,
  		fillStyle: this.selected ? 'red' : 'black',
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
		this.selected = false;

		this.itemType = function(){return 'arrow'};
		this.selectedForDelete = function(){
			return this.selected || this.start.selectedForDelete() || this.end.selectedForDelete();
		};

		this.norm = function() {
			return distance(this.start.pt, this.end.pt);
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

		// distance from point pt
		this.distance = function(pt) {
			var a = {x: pt.x - this.start.pt.x, y: pt.y - this.start.pt.y};
			var crossProd = -this.v().x*a.y + a.x*this.v().y;
			var dotProd = this.v().x*a.x + this.v().y*a.y;
			if (dotProd > 0 && dotProd < this.norm()*this.norm())
			{
				return Math.abs(crossProd/this.norm());
			}
			else
			{
				return Math.min(distance(a, this.start.pt), distance(a, this.end.pt));
			}
		};

		this.drawStart = function(){
			// add extra offset if arrow will interfere with label
			var arrow_offset = (this.u().y > 0.0 && this.u().x > -0.45 && this.u().x < 0.45) ? 
			12 + this.ARROW_OFFSET : this.ARROW_OFFSET;
			return {x: Math.ceil(this.start.pt.x + this.u().x * arrow_offset), 
				y: Math.ceil(this.start.pt.y + this.u().y * arrow_offset)};
		};

		this.drawEnd = function(){
			// add extra offset if arrow will interfere with label
			var arrow_offset = (this.u().y < 0.0 && this.u().x > -0.45 && this.u().x < 0.45	) ? 
			12 + this.ARROW_OFFSET : this.ARROW_OFFSET;
			return {x: Math.ceil(this.end.pt.x - this.u().x * arrow_offset), 
				y: Math.ceil(this.end.pt.y - this.u().y * arrow_offset)};
		};

		this.to_str = function(){
			return "[" + this.start.label + "-->" + this.end.label + "]";
		};

		this.draw = function(canvas)
		{
			canvas.drawLine({
			  strokeStyle: this.selected ? '#f00' : '#000',
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
		this.undoRedoStack = []
		this.undoRedoPtr = 0;
		this.labelsUsed = [];
		this.labelsAvailable = "123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0".split('');
		this.grid = new Grid(20, 8);
		this.canvas = canvas;
		this.SNAP_TOL = 20;

		// e is hash like {action: 'add', item: qitem}
		this.pushUndo = function(e) {
			// pop items in stack after pointer
			var n = this.undoRedoStack.length - this.undoRedoPtr - 1;
			if (n > 0)
			{
				// should recycle labels of points here
				var rm = this.undoRedoStack.splice(-n, n);
			}
			this.undoRedoStack.push(e);
			this.undoRedoPtr = this.undoRedoStack.length - 1;
		};

		this.doUndo = function() {
			if (this.undoRedoPtr >=0 && this.undoRedoStack.length > 0)
			{
				var u = this.undoRedoStack[this.undoRedoPtr--];
				if (u.action=='add')
				{
					// item would be last one added
					this.qitems.splice(-1,1);
				}
				else if (u.action=='delete')
				{
					this.qitems.push(u.item);
				}
				this.draw();
			}
		};

		this.doRedo = function() {
			if (this.undoRedoPtr < this.undoRedoStack.length - 1)
			{
				var u = this.undoRedoStack[++this.undoRedoPtr];
				if (u.action == 'delete')
				{
					this.qitems.splice(-1,1);
				}
				else if (u.action == 'add')
				{
					this.qitems.push(u.item);
				}
				this.draw();
			}
		};

		this.addItem = function(qitem) {
			this.qitems.push(qitem);
			this.pushUndo({action: 'add', item: qitem});
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
			this.addItem(qpoint);
			return qpoint;
		};

		this.addArrow = function(start, end) {
			var qarrow = new QArrow(start, end);
			this.addItem(qarrow);
			return qarrow;
		};

		this.deleteItem = function(qitem) {
			var idx = this.qitems.indexOf(qitem);
			if (idx > -1)
			{
				this.qitems.splice(idx, 1);
				this.pushUndo({action: 'delete', item: item});
			}
		};

		this.deleteSelectedItems = function() {
			var deleted = false;
			for (var i=this.qitems.length-1; i >= 0; i--)
			{
				if (this.qitems[i].selectedForDelete())
				{
					this.qitems.splice(i,1);
					deleted = true;
				}
			}
			if (deleted)
			{
				this.draw();
			}
		};

		this.itemNearPt = function(pt, arrows) {
			var mindist = this.SNAP_TOL;
			var closest = null;
			for (ix in this.qitems) {
				if (!arrows && this.qitems[ix].itemType()=='arrow')
				{
					continue;
				}
				var dist = this.qitems[ix].distance(pt);
				if (dist < mindist)
				{
					closest = this.qitems[ix];
					mindist = dist;
				}
			}
			return closest;
		};

		this.unselectAll = function(){
			for (ix in this.qitems) {
				this.qitems[ix].selected = false;			}
		};

		this.drawGrid = function(){
			this.grid.draw(this.canvas);
		};
  
		this.draw = function() {
			this.canvas.clearCanvas();
			this.drawGrid();
			for (ix in this.qitems) {
				this.qitems[ix].draw(this.canvas);
			}
		};

		this.drawDrag = function(pt) {
			if (canvas.mode()=='draw')
			{
				this.draw();
				canvas.drawLine({
				  strokeStyle: this.selected ? '#f00' : '#000',
				  strokeWidth: 1,
				  rounded: true,
				  endArrow: true,
				  arrowRadius: 10,
				  arrowAngle: 30,
				  x1: canvas.dragItem.pt.x, y1: canvas.dragItem.pt.y,
				  x2: pt.x, y2: pt.y
				});
			}
			else if (canvas.mode()=="move")
			{
				canvas.dragItem.pt=pt;
				this.draw();
			}
		};
	};

	theCanvas.quiver = new Quiver(theCanvas);
	theCanvas.quiver.drawGrid();
	theCanvas.dragItem = null;

	theCanvas.click(function(e){
			var pt = theCanvas.quiver.grid.snapPoint({x: e.offsetX, y: e.offsetY});
			if (pt != null)
			{
				if (theCanvas.mode()=='draw')
				{
					var item = theCanvas.quiver.itemNearPt(pt);
					if (!item)
					{
						var qpoint = theCanvas.quiver.addPoint(pt);
						theCanvas.quiver.draw();
					}
				}
				else if (theCanvas.mode()=='move')
				{
					var item = theCanvas.quiver.itemNearPt(pt, true);
					var sel = item ? !item.selected : false;
					if (!e.ctrlKey)
					{
						theCanvas.quiver.unselectAll();
					}
					if (item)
					{
						item.selected = sel;
						theCanvas.quiver.draw();
					}
				}
			}
			console.log("click");
		}).mouseover(function(e){
			console.log("mouseover");
		}).mousedown(function(e) {
			var pt = {x: e.offsetX, y: e.offsetY};
			var item = theCanvas.quiver.itemNearPt(pt);
			if (item)
			{	
				theCanvas.dragItem = item;
			}
			console.log("mousedown");
		}).mouseup(function(e){
			var pt = theCanvas.quiver.grid.snapPoint({x: e.offsetX, y: e.offsetY});
			if (theCanvas.dragItem)
			{
				if (pt)
				{
					if (theCanvas.mode()=='draw')
					{
						var qpoint = theCanvas.quiver.itemNearPt(pt);
						if (qpoint==theCanvas.dragItem)
						{
							// draw loop
						}
						else if (!qpoint)
						{
							qpoint = theCanvas.quiver.addPoint(pt);
						}
						theCanvas.quiver.addArrow(theCanvas.dragItem, qpoint);
						theCanvas.quiver.draw();
					}
					else if (theCanvas.mode()=='move')
					{
						theCanvas.dragItem.pt = pt;
						theCanvas.quiver.draw();
					}
				}
			}
			theCanvas.dragItem = null;
			console.log("mouseup");
		}).mousemove(function(e) {
			var pt = {x: e.offsetX, y: e.offsetY};
			if (theCanvas.mode()=='draw')
			{
				var snapPt = theCanvas.quiver.grid.snapPoint(pt);
				var item = theCanvas.quiver.itemNearPt(snapPt);
				theCanvas.quiver.unselectAll();
				if (item)
				{
					item.selected = true;
				}
			}
			if (theCanvas.dragItem)
			{
				theCanvas.quiver.drawDrag(pt);
			}
			else
			{
				theCanvas.quiver.draw();
			}
		});

		var buttons = $("<div/>")
		.append($("<input/>").attr("id", "btn-draw").attr("name", "radio").attr("type", "radio"))
		.append($("<label/>").attr("for", "btn-draw").text("Draw"))
		.append($("<input/>").attr("id", "btn-move").attr("name", "radio").attr("type", "radio"))
		.append($("<label/>").attr("for", "btn-move").text("Select/Move"))
		.append($("<input/>").attr("id", "btn-relations").attr("name", "radio").attr("type", "radio"))
		.append($("<label/>").attr("for", "btn-relations").text("Relations"))
		.append($("<button/>").text("Delete").click(function(){
			if (theCanvas.mode()=='move')
			{
				theCanvas.quiver.deleteSelectedItems();
			}
		}))
		.append($("<button/>").text("Undo").click(function(){
			theCanvas.quiver.doUndo();
		}))
		.append($("<button/>").text("Redo").click(function(){
			theCanvas.quiver.doRedo();
		}));
		theCanvas.after(buttons.buttonset());
		$("#btn-draw").click();

		theCanvas.mode = function(){
			var btn = buttons.find("input[name='radio']:checked");
			if (btn)
			{
				return btn[0].id.replace('btn-', '');
			}
		};
});