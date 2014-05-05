/* === Utils ==== */
var $ = function ( selector, context ) {
        context = context || document;
        return context.querySelector(selector);
};

// `arraify` takes an array-like object and turns it into real Array
// to make all the Array.prototype goodness available.
var arrayify = function ( a ) {
	return [].slice.call( a );
};

// `$$` return an array of elements for given CSS `selector` in the `context` of
// the given element or whole document.
var $$ = function ( selector, context ) {
	context = context || document;
	return arrayify( context.querySelectorAll(selector) );
}

var computeWindowScale = function ( config ) {
	var hScale = window.innerHeight / 768,
		wScale = window.innerWidth / 1024,
		scale = hScale > wScale ? wScale : hScale;
	
	if (scale > 1) {
		scale = 1;
	}
	
	if (scale < 0) {
		scale = 0;
	}
	console.log("window scale = " + scale + " hscale = " + hScale + " wscale = " + wScale);
	return { scale: scale, hScale: hScale, wScale: wScale };
};

/* === ACE Editor stuff ==== */
//var editor = ace.edit($('.ace'));
//editor.setTheme("ace/theme/clouds");
//editor.setOptions({ maxLines:24 });

var Range = ace.require('ace/range').Range;
var Marker = ace.require('ace/layer/marker').Marker;
var Selection = ace.require('ace/selection').Selection;

var AceEditors = {};
var AceSessions = {};
var AceMarkers = {};

function clearMarkers(session, markers) {
	if (typeof(markers) === 'undefined') return;
	while (markers.length > 0) {
		session.removeMarker(markers.shift());
	}
}

function renderMarker16px(stringBuilder, range, left, top, layerConfig) {
	/*
	if (!layerConfig.adjusted) {
		console.log('start ' + layerConfig.characterWidth);
		layerConfig.characterWidth *= 1.25;
		layerConfig.adjusted = true;
		console.log('ended up ' + layerConfig.characterWidth);
	}*/
	renderMarker(stringBuilder, range, left, top, layerConfig, this.clazz);
}
function renderMarker12px(stringBuilder, range, left, top, layerConfig) {
	/*
	//console.log('14 from ' + layerConfig.characterWidth);
	layerConfig.characterWidth *= 1.25; */
	renderMarker(stringBuilder, range, left, top, layerConfig, this.clazz);
}
function renderMarker(stringBuilder, range, left, top, layerConfig) {
	if (!layerConfig.origCharWidth) {
		layerConfig.origCharWidth = layerConfig.characterWidth;
		
		var scale = computeWindowScale();
		if (scale.scale < 1) {
			console.log('start ' + layerConfig.origCharWidth);
			layerConfig.characterWidth = Math.ceil(layerConfig.characterWidth * (1 + (1 - scale.scale)));
			console.log('ended up ' + layerConfig.characterWidth);
		}
	}
	
	drawSingleLineMarker(
		stringBuilder, 
		range,
		this.clazz,
		layerConfig, 
		0.5, 
		top
	);
}

function drawSingleLineMarker (stringBuilder, range, clazz, config, extraLength, top) {
	var height = config.lineHeight;
	//console.log('in row ' + range.start.row + ' from ' + range.start.column + ' to ' + range.end.column);
	var width = (range.end.column + (extraLength || 0) - range.start.column) * config.characterWidth;

	top = (range.start.row - config.firstRowScreen) * config.lineHeight;
	var left =  (range.start.column * config.characterWidth); //this.$padding;

	stringBuilder.push(
		"<div class='", clazz, "' style='",
		"height:", height, "px;",
		"width:", width, "px;",
		"top:", top, "px;",
		"left:", left,"px;'></div>"
	);
};

function initAce(step, fontSize, tabSize) {
	var stepId = step.id;
	var substeps = parseInt(step.getAttribute('data-substeps'));
	var els = $$('#' + stepId + ' .ace');

    for (var i= 0,len=els.length; i<len; i++) {
        var key = stepId + (len > 1 ? '-' + i : '');
        var el = els[i];
        var editor = AceEditors[key] = ace.edit(el);

        editor.setTheme("ace/theme/xcode");
        var session = editor.getSession();
        session.setMode('ace/mode/javascript');
        session.modeName = 'javascript';

        editor.setOptions({ maxLines: 60 });
        el.style.fontSize=fontSize;
        editor.setReadOnly(true);
        editor.setHighlightActiveLine(false);
        if (typeof(tabSize) === "number") session.setTabSize(tabSize);

        AceSessions[key] = session;
        AceMarkers[key] = {};
        AceMarkers[key]['ss0'] = [];
        if (!isNaN(substeps)) {
            for (var i=1; i<=substeps; i++) AceMarkers[key]['ss' + i] = [];
        }
    }
}

function initAceEditors() {
	var edEls = $$('.ace');
    var sizes = {
        small: '16px',
        smaller: '20px',
        regular: '24px'
    };
	for (var i=0,len=edEls.length; i<len; i++) {
        var el = edEls[i];
        var fontSize = sizes[el.dataset.size];
        if (typeof(fontSize) === 'undefined') fontSize = sizes.regular;
        console.log('fontSize = ' + fontSize);
		initAce(
			el.parentElement.parentElement,
			fontSize,
			null
		);
	}
}

initAceEditors();

/* === Impress config stuff ==== */

var Steps = {
	onStepEnter: function(step) { 
		var method = step.id + 'Action'.replace('-','');
		if (window[method] !== undefined) window[method](step); 
		this.onSubStepEnter(step, 1, true);
	},
	onSubStepEnter: function(step, substepIndex, forward) { 
		var method = (step.id + 'ActionSub' + substepIndex).replace('-','');
		if (window[method] !== undefined) window[method](step, substepIndex, forward);
	},
	onStepLeave: function(step) {
		var method = step.id + 'Leave'.replace('-','');
		if (window[method] !== undefined) window[method](step); 
	},
	showNotes: window.location.href.indexOf('notes') > -1
};

var imp = impress(undefined, Steps);
imp.init();

/* === Steps stuff ==== */
/*var literals1Action = literals2Action = literals3Action =
function(step, index, forward) {
	initAce(
		step,
		"async3 closure4 module2 module6 module8".indexOf(step.id) > -1 ? '20px' : '24px',
		"module7 module8".indexOf(step.id) > -1 ? 3 : null
	);
	
}
*/
var literals2Action =
function(step, index, forward) {
    clearMarkers(AceSessions.literals2, AceMarkers.literals2.ss0);

    var cls = 'ace-highlight-line';
    var ms = AceMarkers.literals2.ss0;
    var sn = AceSessions.literals2;

    ms.push(sn.addMarker(new Range(0, 25, 0, 35), cls, renderMarker));
    ms.push(sn.addMarker(new Range(3, 3, 23, 18), cls, renderMarker));
};

var literalVarLeave = literalAddPropsLeave = literalDeletePropsLeave = literalObjCreateLeave =
    literalsMoreLeave = literalsCompactLeave = literalsMoreCompactLeave = literalsEvenMoreLeave =
    literalsExtremeMoreLeave = objectsAsDataLeave =mixinsLeave = dataExtensionLeave =
    extensionResultLeave = modulePatternLeave = privateVarsLeave = privateVarsGetterLeave =
    privateVarsSetterLeave =
function(step) {
    step.classList.add("last");
    setTimeout(function () {
        step.classList.remove('last');
    }, 1000);
};

/*
var literalVarAction = literalPropsAction = literals3Action = literals4Action = literals5Action = literals6Action =
function(step) {
    /*var last = $('.last');
    if (last) {
        console.log('in stepEnter ' + step.id + ' left ' + last.id);
        setTimeout(function () {
            last.classList.remove('last');
        }, 1000);
    }
};
 */
