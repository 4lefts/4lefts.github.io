new p5(function(p){

	//variables for the canvas and holder (i.e. parent div)
	var holder, holderSize, canvas 

	var synths = []
	var tms =[] //the thue-morse sequence
	var tmsText = '' //the thue-morse sequence as a string

	//note variables
	var root = 60 //A4, 440hz
	var scale = [0, 2, 3, 5, 7, 8, 10, 12]
	var motif = [] // the notes of a riff
	var weighting = [6, 1, 3, 1, 4, 1, 2, 4] //array to hold the chance of choosing each note for the motif
	var tracks = [[], []]
	var hzs = [] // notes as hz
	var note = 0 //note in scale to play

	var isPlaying = false

	//sequencer stuff
	var offset = 0, //the current offset for the sequence track (in array places)
		counters = [0, 0] //place in tm sequence

	var slider, speedSlider

	p.setup = function(){

		//get the parent div for the canvas
		holder = p.select('#sketchContainer')
		
		//get size of parent div, (returns an object)
		var holderSize = holder.size()
		
		//set canvas to with of parent div - makes sketch responsive
		//use holderSize.width for both - make canvas square
		//(holder.height returns height of 100px, unless css size is absolute)
		canvas = p.createCanvas(holderSize.width, holderSize.width)
		p.frameRate(5)
		p.textFont('monospace')
		p.textSize(16)


		synths[0] = new p.Pling()
		synths[1] = new p.Pling()

		tms = thue_morse.compute(7)
		tmsText = tms.join(' ')
		
		noteSlider = new p.Slider(1, p.height - 84, p.width - 3, 40, 36, 72, root, 'root midi note: ')
		speedSlider = new p.Slider(1, p.height - 42, p.width - 3, 40, 4, 11, 5, 'speed: ')

		//initialise motif, hzs and counters
		p.initNotes()

		//bind listener functions to clicking on this canvas element
		//e.g. - canvas.mousePressed(p.somefunction)
		//lots more listed at http://p5js.org/reference/#/p5.Element
		canvas.mousePressed(p.play)
	}

	//responsively resize canvas if window is resized
	p.windowResized = function(){
		holderSize = holder.size()
		p.resizeCanvas(holderSize.width, holderSize.width)
	}

	p.draw = function(){
		if(isPlaying){
			// if(p.frameCount % 2 == 0){ //each sixteenth note
				//play sounds		
				for(var i = 0; i < counters.length; i++){
					if(tms[counters[i]] == 1){
						//play note
						synths[i].trigger(hzs[note], 0.7, (i * 2) - 1)
					}
				}
				note = (note + 1) % hzs.length
				counters[0] = (counters[0] + 1) % tms.length
				counters[1] = (counters[1] + 1) % tms.length
				//set the second counter to an offset when the first counter wraps round 
				if(counters[0] == tms.length - 1){
					offset = (offset + 1) % tms.length
					counters[1] = offset
				}
				//do drawing:
				//get wave arrays from synths for visualisation
				var waves = synths.map(function(elem){
					return elem.waveform()
				})

				//get text strings for visualisation
				var dispText = p.buildDispText()
				var noteText = p.buildNoteText()

				p.background(0)

				//draw waveforms (from 2d array)
				for(var i = 0; i < waves.length; i++){
					p.push()
					p.noFill()
					p.beginShape()
					p.noFill()
					p.stroke(255)
					for(var j = 0; j < waves[i].length; j++){
						var x = (p.map(j, 0, waves[i].length, 0, p.width/2)) + p.width/2 * i
						var y = p.map(waves[i][j], -1, 1, 0, p.height)
						p.vertex(x, y)
					}
					p.endShape()
					p.pop()
				}

				p.drawText(dispText, 16, 180, p.LEFT, 8, 10, p.width, p.height)
				p.drawText(noteText, 72, 200, p.CENTER, 0, p.height * 0.667, p.width, 72)

				noteSlider.render()
				speedSlider.render()
			// }
		} else {
			//just draw black if not playing
			p.background(0)
			noteSlider.render()
			speedSlider.render()
		}
		if(noteSlider.isEditing){
			root = noteSlider.update()
			hzs = p.makeHz(motif, root)
		}
		if(speedSlider.isEditing){
			p.frameRate(speedSlider.update())
		}
	}

	p.play = function(){
		//re-randomise notes and counters when sequncer stops
		if(p.mouseY < p.height - noteSlider.h * 2){
			if(isPlaying){
				p.initNotes()
			}
			isPlaying = !isPlaying
		}
	}

	p.mouseReleased = function(){
		noteSlider.isEditing = false
		speedSlider.isEditing = false
	}

	p.mouseDragged = function(){
		if(p.mouseX > noteSlider.x && p.mouseX < noteSlider.x + noteSlider.w){
			if(p.mouseY > noteSlider.y && p.mouseY < noteSlider.y + noteSlider.h){
				noteSlider.isEditing = true
			} else if(p.mouseY > speedSlider.y && p.mouseY < speedSlider.y + speedSlider.h){
				speedSlider.isEditing = true
			}
		}
	}

	//----------
	//synthesizer
	//----------
	p.Pling = function(){

		this.env = new p5.Env()	
		this.env.setADSR(0.001, 0.333, 0, 0)

		this.osc = new p5.Oscillator()
		this.osc.setType('triangle')
		this.osc.amp(this.env)
		this.osc.start()

		this.del = new p5.Delay()
		this.del.process(this.osc, 0.200, 0.3, 5000)

		this.fft = new p5.FFT(0.9, 512)

		/*arguments are:
		freq (hz),
		amplitude,
		panning (-1 to 1)*/
		this.trigger = function(h, a, p){
			this.osc.freq(h)
			this.osc.pan(p)
			this.env.setRange(a, 0)
			this.env.play(this.osc)
		}

		this.waveform = function(){
			return this.fft.waveform()
		}
	}

	p.Slider = function(_x, _y, _w, _h, _min, _max, _init, _label){
		this.x = _x
		this.y = _y
		this.w = _w
		this.h = _h
		this.min = _min
		this.max = _max
		this.val = Math.floor(_init)
		this.label = _label
		this.isEditing = false

		this.update = function(){
			this.val = p.constrain(p.map(p.mouseX, this.x, this.x + this.w, this.min, this.max), this.min, this.max)
			return this.val
		}

		this.render = function(){
			p.push()
			p.translate(this.x, this.y)
			p.noFill()
			p.stroke(255)
			p.rect(0, 0, this.w, this.h)
			p.noStroke()
			p.fill(127)
			p.rect(2, 2, p.map(this.val, this.min, this.max, 0, this.w - 3), this.h - 3)
			p.noStroke()
			p.fill(255)
			p.textSize(12)
			var label = this.label + String(Math.floor(this.val))
			p.text(label, 5, this.h - 5)
			p.pop()
		}
	}

	//------------------------------------------
	//functions for building arrays of notes etc:
	//------------------------------------------

	//pick a random item from an array based on an array of weightings
	p.weightedRand = function(arr, weightArr){
		//sum the weight array
		var totalWeight = weightArr.reduce(function(prev, elem){ 
			return prev + elem
		})

		var randomNum = Math.floor(p.random(0, totalWeight))
		//keep a total of the weight array we've been through so far
		var currentWeight = 0
		for(var i = 0; i < arr.length; i++){
			currentWeight += weightArr[i]
			if(randomNum <= currentWeight){
				return arr[i]
			}
		}
	}

	p.initNotes = function(){
		motif = p.makeMotif(scale, weighting)
		hzs = p.makeHz(motif, root)
		counters = [0,0]//p.counterRandom(counters)
	}

	p.makeMotif = function(arr, weightArr){
		return arr.map(function(){
			return p.weightedRand(arr, weightArr)
		})
	}

	p.makeHz = function(arr, rootNote){
		return arr.map(function(elem){
			return p.midiToFreq(elem + rootNote)
		})
	}

	//set up a random start point for the counters in the tm sequence	
	p.counterRandom = function(arr){
		var counterSeed = Math.floor(p.random(tms.length))
		return arr.map(function(){
			return counterSeed
		})
	}

	//---------------------------------------------------
	//functions for making strings of text for display etc
	//---------------------------------------------------

	p.buildDispText = function(){
		var ret = tmsText + '\ncounter 0: ' + counters[0] + '\ncounter 1: ' + counters[1]
		return ret
	}

	p.buildNoteText = function(){
		var ret = p.equalLen(hzs[note] * tms[counters[0]], 6)
		ret += '\t'
		ret += p.equalLen(hzs[note] * tms[counters[1]], 6)
		return ret
	}

	//hacky helper function to slice strings to equal length for nicer display
	p.equalLen = function(i, l){
		return (i + '      ').slice(0, l)
	}

	p.drawText = function(txt, sz, grey, jst, x, y, w, h){
		p.push()
		p.noStroke()
		p.fill(grey)
		p.textAlign(jst)
		p.textSize(sz)
		p.text(txt, x, y, w, h)//10, 0, p.width, p.height)
		p.pop()
	}

}, 'sketchContainer')

/*
simple module to compute the thue-morse sequence for n iterations
call thue_morse.compute(n)
seehttps://en.wikipedia.org/wiki/Thue%E2%80%93Morse_sequence

needs to be wrapped this way so that it's a function EXPRESSION
not a function DECLARATION
and it's immmediately evaluated
*/
var thue_morse = (function(){

	//value to start
	var numbers = [0]

	var generate = function(inputNumbers){
		var newNumbers = inputNumbers.map((x) => x ? 0 : 1, [])
		return inputNumbers.concat(newNumbers)
	}

	return {
		compute: function(levels){
			while(levels > 0){
				numbers = generate(numbers)
				levels = levels - 1
			}
			return numbers
		},
	}

}())