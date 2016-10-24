"use strict";

Traquer.Lzw = function(){
    if (!(this instanceof Traquer.Lzw)) {
        return new Traquer.Lzw();
    }
}


Traquer.Lzw.prototype.getHumanReadableLength = function(s) {
	var byteLength = this.getByteLength(s);

	var oneKB = 1024,
		 oneMB = oneKB * oneKB,
	 	 oneGB = oneMB * oneKB;

	if (byteLength > oneGB)
		return Math.round(byteLength * 100 / oneGB) / 100 + ' GB';

	if (byteLength > oneMB)
		return Math.round(byteLength * 100 / oneMB) / 100 + ' MB';

	return Math.round(byteLength * 100 / oneKB) / 100 + ' KB';
}

Traquer.Lzw.prototype.getByteLength = function (s) {
	var len = 0;
	for (var i = 0; i < s.length; i++) {
		var code = s.charCodeAt(i);
		if (code <= 0x7f)
			len += 1;
		else if (code <= 0x7ff)
			len += 2;
		else if (code >= 0xd800 && code <= 0xdfff) {
			// Surrogate pair: These take 4 bytes in UTF-8 and 2 chars in UCS-2
			// (Assume next char is the other [valid] half and just skip it)
			len += 4; i++;
		}
		else if (code < 0xffff)
			len += 3;
		else
			len += 4;
	}

	return len;
}

Traquer.Lzw.prototype.encode = function (s) {
	s = JSON.stringify(s);
	var dict = {};
	var data = (s + "").split("");
	var out = [];
	var currChar;
	var phrase = data[0];
	var code = 256;
	for (var i = 1; i < data.length; i++) {
	currChar = data[i];
	if (dict[phrase + currChar] != null) {
	phrase += currChar;
	}
	else {
	out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
	dict[phrase + currChar] = code;
	code++;
	phrase = currChar;
	}
	}
	out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));

	return JSON.stringify(out);
}

Traquer.Lzw.prototype.decode = function (data) {
	data = JSON.parse(data);
	var dict = {};
	var currChar = String.fromCharCode(data[0]);
	var oldPhrase = currChar;
	var out = [currChar];
	var code = 256;
	var phrase;
	for (var i = 1; i < data.length; i++) {

	    var currCode = data[i];
	    if (currCode < 256) {
	        phrase = String.fromCharCode(data[i]);
	    }
	    else {
	        phrase = dict[currCode] ? dict[currCode] : (oldPhrase + currChar);
	    }
	    out += phrase;
	    currChar = phrase[0];
	    dict[code] = oldPhrase + currChar;
	    code++;
	    oldPhrase = phrase;
	}
	
	return JSON.parse(out);
}

if(module && module.exports)
	module.exports = Traquer.Lzw;
