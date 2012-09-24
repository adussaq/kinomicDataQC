function doMathSrc(n) {
	var srcE = $('#mathSrc'+n)[0],
		ms = srcE.value.replace(/&([-#.\w]+);|\\([a-z]+)(?: |(?=[^a-z]))/ig,
				function(s, e, m) {
					if (m && (M.macros_[m] || M.macro1s_[m]))	return s;	// e.g. \it or \sc
					var t = '&'+(e || m)+';', res = $('<span>'+t+'</span>').text();
					return res != t ? res : ents_[e || m] || s;
				}),
		h = ms.replace(/</g, '&lt;');
	if (srcE.value != h)	srcE.value = h;	// assignment may clear insertion point
	
	var t;
	try {
		t = M.sToMathE(ms, true);
	} catch(exc) {
		t = String(exc);
	}
	$('#mathTgt'+n).empty().append(t);
}

function checkUnicodeTitle(event) /* if the event's target is a 1 or 2 character string, then
		its unicode code point(s) are made visible */ {
	var e = event.target, t = e.firstChild;
	if (e.nodeType == 1 /* Element */ && t && e.lastChild == t && t.nodeType == 3 /* Text */) {
		var s = t.data, len = s.length;
		if (0 < len && len <= 2) {
			var iToU = function(i) {
					var h = s.charCodeAt(i).toString(16).toUpperCase();
					while (h.length < 4)	h = '0'+h;
					return 'U+'+h;
				}, u = F.fToA(iToU, len).join(' ');
			if (! e.title)	e.title = u;
			else if (e.title.indexOf(u) == -1)	e.title = u+': '+e.title;
		}
	}
}
function insertToSrc2(event) /* if the event's target is a 1 or 2 character string, then
		it is inserted into $('#mathSrc2') */ {
	var e = event.target, t = e.firstChild;
	if (e.nodeType == 1 /* Element */ && t && e.lastChild == t && t.nodeType == 3 /* Text */) {
		var s = t.data, len = s.length;
		if (0 < len && len <= 2) {
			if (s == '\u2044' /* fraction slash */) {
				alert('This buggy "fraction slash" is being replaced by a regular / (U+002F).');
				s = '/';
			} else if (s == '&')	s = '&amp;';
			else if (s == '<')	s = '&lt;';
			else if ($(e).hasClass('no-meta') || $(e).is('.use-backslash *'))	s = '\\'+s;
			else if ($(e).is('.use-sc *'))	s = '\\sc '+s;
			else if ($(e).is('.use-fr *'))	s = '\\fr '+s;
			
			var te = $('#mathSrc2')[0];
			te.value += s;
			te.focus();
			var n = te.value.length;
			if (te.setSelectionRange)	te.setSelectionRange(n, n);
			else if (te.createTextRange) {
				var range = te.createTextRange();
				range.collapse(false);
				range.select();
			}
			
			doMathSrc(2);
		}
	}
}
