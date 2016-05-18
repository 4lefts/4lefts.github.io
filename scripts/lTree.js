//boilerplate example to use for p5js sketches contained in the parent div with id="sketchConatainer"

//this feels to me like a more 'idiomatic' way to instantiate p5.js
//see https://github.com/processing/p5.js/wiki/Instantiation-Cases

new p5(function(p){

	//variables for the canvas and holder (i.e. parent div)
	var holder, holderSize, canvas 
	
	//l-system axiom
	var str = 'A'
	//the array that contains these numbers
	// var numbers = []

	//l-system rules
	var rules = {
		'A': 'AB',
		'B': 'A',
	}
	//how many times to recursively build the string
	var levels = 10
	//array to hold seeds for noise jitter tree
	var jitters = []

	var unit
	var angle = p.PI/4 //basic rotation

	p.setup = function(){

		//get the parent div for the canvas
		//N.B the select() function is part of the p5.dom library
		holder = p.select('#bannerSketchContainer')
		
		//get size of parent div
		var holderSize = holder.size()
		console.log(holderSize)
		
		//set canvas to with of parent div - makes sketch responsive
		//use holderSize.width for both - make canvas square
		//(holder.height returns height of 100px)
		canvas = p.createCanvas(holderSize.width, holderSize.height)

		str = p.lsystem(str, levels)
		jitters = p.makeJitters(str)
	
		//bind listener functions to clicking on this canvas element
		//e.g. - canvas.mousePressed(p.somefunction)
		//lots more listed at http://p5js.org/reference/#/p5.Element
		p.frameRate(30)
		unit = p.width/28
	}

	//responsively resize canvas if window is resized
	p.windowResized = function(){
		holderSize = holder.size()
		p.resizeCanvas(holderSize.width, holderSize.height)
		unit = p.width/28
	}

	p.draw = function(){
		p.background(255)
		p.drawTree(str, 0, p.height * 0.6)
		// p.noLoop()
	}

	p.lsystem = function(theString, l){
		while(true){
			var tempString = ''
			l = l - 1
			if(l < 1){ //i.e. return if l = 0
				return theString
			}
			for(var i = 0; i < theString.length; i++){
				tempString += (rules[theString[i]]) //access rules array by key var
			}
			theString = tempString
		}
	}

	p.makeJitters = function(inputString){
		ret = []
		for(var i = 0; i < inputString.length; i++){
			ret[i] = p.random(10000)
		}
		return ret
	}
	
	p.drawTree = function(inputString, x, y){
		p.push()
		p.ellipseMode(p.CENTER)		
		var isBranching = false
		
		p.translate(x, y)
		p.rotate(-p.HALF_PI)
		for(var i = 0; i < inputString.length; i++){
			if(inputString[i] == 'A'){
				p.noFill()
				p.stroke(119)
				p.strokeWeight(p.map(i, 0, inputString.length, 1, 5))
				var tx = p.noise(jitters[i])
				var ty = p.noise(jitters[i])
				jitters[i] += 0.005
				p.line(0, 0, tx, unit + ty)
				p.translate(tx, unit + ty)
				p.strokeWeight(1)
				p.stroke(119, 127)
				p.fill(50, 150, 30, 30)
				p.ellipse(0, 0, (i * 3) * p.noise(jitters[i]), (i * 3) * p.noise(jitters[i]))
			} else if (inputString[i] == 'B'){
				if(isBranching){
					p.pop()
					p.rotate(-angle * (((i % 2) * 2) - 1) - (p.noise(jitters[i]) * 0.01))
				} else {		
					p.push()
					p.rotate(angle  * (((i % 2) * 2) - 1) + (p.noise(jitters[i]) * p.HALF_PI))
				}
				jitters[i] += 0.01
				isBranching = !isBranching
			}
		}
		p.pop()
	}

}, 'bannerSketchContainer')
