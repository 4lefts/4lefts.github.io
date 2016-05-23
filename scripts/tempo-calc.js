//returns how many frames is one step of sequencer

/*
bpm/60 seconds = beats per second e.g. 120bpm/60 = 2
framerate/beats per second = frames per beat e.g. 60/2 = 30 frames/beat
note/4 = notes per beat (e.g. 16th/4 = 4 16ths per beat)
and therefore frames per note = fpb/notes per beat
*/

var tempoCalc = (function(){
	
	var bps, fpb, npb, fpn

	var ret = {}

	ret.calc = function(fr, bpm, note){
		bps = bpm/60
		fpb = fr/bps
		npb = note/4
		fpn = Math.floor(fpb/npb)
		return fpn
	}
	
	return ret

}())