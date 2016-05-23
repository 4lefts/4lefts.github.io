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