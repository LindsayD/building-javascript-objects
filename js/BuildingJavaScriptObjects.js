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
	//console.log("window scale = " + scale + " hscale = " + hScale + " wscale = " + wScale);
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
			//console.log('start ' + layerConfig.origCharWidth);
			layerConfig.characterWidth = Math.ceil(layerConfig.characterWidth * (1 + (1 - scale.scale)));
			//console.log('ended up ' + layerConfig.characterWidth);
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

function getSubstepByClass(element, substeps) {
    var substep = 0;

    for (var i=1; i <= substeps;i++) {
        if (element.classList.contains('ss' + i)) {
            //console.log('found ss' + i);
            substep = i;
            break;
        }
    }
    return substep;
}

function initAce(step, fontSize, tabSize) {
	var stepId = step.id;
	var substeps = parseInt(step.getAttribute('data-substeps'));
	var els = $$('#' + stepId + ' .ace');
    var substep = 0;
    var lastSubstep = substep;
    var instCount = 0;

    for (var i= 0,len=els.length; i<len; i++) {
        var el = els[i];
        substep = getSubstepByClass(el.parentElement, substeps);
        instCount = substep != lastSubstep ? 1 : instCount + 1;
        var key = stepId + (substep > 0 ? '_' + substep : '') + ((instCount > -1 && substep > 0) ? '-' + instCount : (len > 1 ? '-' + i : ''));
        //var key = stepId + (len > 1 ? '-' + i : '');

        var editor = AceEditors[key] = ace.edit(el);
        //console.log('initating ace for ' + key  + '   ' + len + ' ' + i);

        editor.setTheme("ace/theme/xcode");
        var session = editor.getSession();
        session.setMode('ace/mode/javascript');
        session.modeName = 'javascript';

        editor.setOptions({ maxLines: 90 });
        el.style.fontSize=fontSize;
        editor.setReadOnly(true);
        editor.setHighlightActiveLine(false);
        if (typeof(tabSize) === "number") session.setTabSize(tabSize);

        AceSessions[key] = session;
        AceMarkers[key] = {};
        AceMarkers[key].ss0 = [];
        if (!isNaN(substeps)) {
            for (var j=1; j<=substeps; j++) AceMarkers[key]['ss' + j] = [];
        }
        lastSubstep = substep;
    }
}

function initAceEditors() {
	var edEls = $$('.ace');
    var sizes = {
        small: '18px',
        smaller: '20px',
        regular: '24px'
    };
	for (var i=0,len=edEls.length; i<len; i++) {
        var el = edEls[i];
        var fontSize = sizes[el.dataset.size];
        if (typeof(fontSize) === 'undefined') fontSize = sizes.regular;
        //console.log('fontSize = ' + fontSize);
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
        this.onSubStepEnter(step, 1);
	},
    onSubStepLeave: function(step, substepIndex) {
        var method = (step.id + 'LeaveSub' + substepIndex).replace('-','');
        if (window[method] !== undefined) window[method](step, substepIndex);
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

function clearMarkersForStep(stepId, substep) {
    substep = substep || 'ss0';
    clearMarkers(AceSessions[stepId], AceMarkers[stepId][substep]);
}

function addMarkersForStep(stepId, substep, ranges, cls) {
    substep = 'ss' + substep || 'ss0';
    cls = cls || 'ace-highlight-line';
    var ms = AceMarkers[stepId][substep];
    var sn = AceSessions[stepId];

    for (var i= 0,len=ranges.length;i<len;i++) {
        var range = ranges[i];
        ms.push(sn.addMarker(new Range(range[0], range[1], range.length > 3 ? range[2]:range[0], range.length > 3 ? range[3]:range[2]), cls, renderMarker));
    }
}

var literalDeletePropsAction = function(step, index, forward) {
    clearMarkersForStep(step.id);

    addMarkersForStep(step.id, 0, [
        [8,0,21]
    ]);
};

var literalObjCreateAction = function(step, index, forward) {
    clearMarkersForStep(step.id);

    addMarkersForStep(step.id, 0, [
        [0,13,30]
    ]);
};

var literalsMoreAction = function(step, index, forward) {
    clearMarkersForStep(step.id + '-0');

    addMarkersForStep(step.id + '-0', 0, [
        [4,19,30],
        [10,19,30]
    ]);
};

var mixinsAction = function(step, index, forward) {
    clearMarkersForStep(step.id + '-1');

    addMarkersForStep(step.id + '-1', 0, [
        [4,4,20]
    ]);
};

var compositionAction = function(step, index, forward) {
    clearMarkersForStep(step.id + '-1');

    addMarkersForStep(step.id + '-1', 0, [
        [5,4,18]
    ]);
};

var compositionResultAction = function(step, index, forward) {
    clearMarkersForStep(step.id);

    addMarkersForStep(step.id, 0, [
        [10,4,30],
        [11,4,29],
        [12,4,27]
    ]);
};

var compositionAPIAction = function(step, index, forward) {
    clearMarkersForStep(step.id);

    addMarkersForStep(step.id, 0, [
        [2,4,24],
        [11,4,31]
    ]);

    addMarkersForStep(step.id, 0, [
        [5,4,20],
        [6,4,17],
        [14,4,22],
        [15,4,20],
        [16,4,17]
    ], 'ace-alt-highlight-line');
};

var importsAction = function(step, index, forward) {
    clearMarkersForStep(step.id);

    addMarkersForStep(step.id, 0, [
        [0,20,46],
        [1,0,23],
        [17,1,18]
    ]);
};

var privateVarsAction = function(step, index, forward) {
    clearMarkersForStep(step.id);

    addMarkersForStep(step.id, 0, [
        [3,4,30],
        [8,12,32]
    ]);
};

var privateVarsGetterAction = function(step, index, forward) {
    clearMarkersForStep(step.id);

    addMarkersForStep(step.id, 0, [
        [8,23,42],
        [9,16,33],
        [10,12,14]
    ]);
};

var privateVarsSetterAction = function(step, index, forward) {
    clearMarkersForStep(step.id);

    addMarkersForStep(step.id, 0, [
        [9,16,41]
    ]);
};

var instanceAction = function(step, index, forward) {
    clearMarkersForStep(step.id);

    addMarkersForStep(step.id, 0, [
        [0,14,17]
    ]);
};

var constructorGotchaAction = function(step, index, forward) {
    clearMarkersForStep(step.id + '_3' + '-1');

    addMarkersForStep(step.id + '_3' + '-1', 3, [
        [1,32,51],
        [7,51,59]
    ]);
};

var prototypeDataAction = function(step, index, forward) {
    clearMarkersForStep(step.id);

    addMarkersForStep(step.id, 0, [
        [7,0,50]
    ]);
};

var prototypeDataSafeAction = function(step, index, forward) {
    clearMarkersForStep(step.id);

    addMarkersForStep(step.id, 0, [
        [7,0,43]
    ]);
};

var prototypeWheneverAction = function(step, index, forward) {
    clearMarkersForStep(step.id + '-1');

    addMarkersForStep(step.id + '-1', 0, [
        [1,0,50]
    ]);
};

var prototypeOverridesAction = function(step, index, forward) {
    clearMarkersForStep(step.id + '-1');

    addMarkersForStep(step.id + '-1', 0, [
        [1,0,50]
    ]);

    addMarkersForStep(step.id + '-1', 0, [
        [7,0,50]
    ], 'ace-alt-highlight-line');
};

var prototypeInheritanceAction = function(step, index, forward) {
    clearMarkersForStep(step.id + '-1');

    addMarkersForStep(step.id + '-1', 0, [
        [7,0,38]
    ]);

    addMarkersForStep(step.id + '-1', 0, [
        [1,14,40]
    ], 'ace-alt-highlight-line');

    addMarkersForStep(step.id + '-1', 0, [
        [2,4,40]
    ], 'ace-other-highlight-line');
};

var prototypeInheritanceDeeperAction = function(step, index, forward) {
    clearMarkersForStep(step.id );

    addMarkersForStep(step.id, 0, [
        [7,0,38]
    ]);

    addMarkersForStep(step.id, 0, [
        [1,14,40]
    ], 'ace-alt-highlight-line');

    addMarkersForStep(step.id, 0, [
        [2,4,40]
    ], 'ace-other-highlight-line');
};

var prototypeInheritanceEvenDeeperAction = function(step, index, forward) {
    clearMarkersForStep(step.id );

    addMarkersForStep(step.id, 0, [
        [7,0,38]
    ]);

    addMarkersForStep(step.id, 0, [
        [1,14,40]
    ], 'ace-alt-highlight-line');

    addMarkersForStep(step.id, 0, [
        [2,4,40]
    ], 'ace-other-highlight-line');
};

var comboAction = function(step, index, forward) {
    clearMarkersForStep('comboCode');
};

var comboLiteralsAction = function(step, index, forward) {
    clearMarkersForStep('comboCode');

    addMarkersForStep('comboCode', 0, [
        [8,8,51],
        [9,8,77],
        [13,8,21]
    ]);
};

var comboExtensionAction = function(step, index, forward) {
    clearMarkersForStep('comboCode');

    addMarkersForStep('comboCode', 0, [
        [23,11,34],
        [40,26,38],
        [54,22,38]
    ]);
};

var comboModuleTopAction = function(step, index, forward) {
    clearMarkersForStep('comboCode');

    addMarkersForStep('comboCode', 0, [
        [0,0,70],
        [23,4,70]
    ]);

    addMarkersForStep('comboCode', 0, [
        [1,4,15],
        [3,4,23],
        [7,4,16],
        [12,4,33],
        [24,21,31]
    ], 'ace-alt-highlight-line');
};

var comboModuleBottomAction = function(step, index, forward) {
    clearMarkersForStep('comboCode');

    addMarkersForStep('comboCode', 0, [
        [72,0,70]
    ]);

    addMarkersForStep('comboCode', 0, [
        [42,20,40],
        [50,19,26]
    ], 'ace-alt-highlight-line');
};

var comboInheritanceTopAction = function(step, index, forward) {
    clearMarkersForStep('comboCode');

    addMarkersForStep('comboCode', 0, [
        [1,4,70],
        [4,8,70],
        [24,8,31]
    ]);
};

var comboInheritanceBottomAction = function(step, index, forward) {
    clearMarkersForStep('comboCode');

    addMarkersForStep('comboCode', 0, [
        [49,8,14],
        [50,19,34],
        [53,8,14]
    ]);
};

var literalVarLeave = literalAddPropsLeave = literalDeletePropsLeave = literalObjCreateLeave =
    literalsMoreLeave = literalsCompactLeave = literalsMoreCompactLeave = literalsEvenMoreLeave =
    literalsExtremeMoreLeave = objectsAsDataLeave  = dataExtensionLeave =
    importsLeave = privateVarsLeave = privateVarsGetterLeave = privateVarsSetterLeave =
    constructorLeave = instanceLeave = prototypeFunctionalityLeave = prototypeDataLeave = prototypeDataSafeLeave =
    prototypeWheneverLeave = prototypeOverridesLeave = prototypeAccessLeave =
    prototypeChaining =  extensionResultLeave = constructorGotchaSub1Leave = prototypeInheritanceEvenDeeperLeave =
function smoothCodeTransfers(step) {
    step.classList.add("last");
    setTimeout(function () {
        step.classList.remove('last');
    }, 1000);
};

constructorGotchaLeaveSub1 = constructorGotchaLeaveSub2 =
prototypeFunctionalityLeaveSub1 = prototypeFunctionalityLeaveSub2 = prototypeFunctionalityLeaveSub3 =
    function smoothCodeSubstepTransfers(step, substep) {
        var elSub = step.querySelector('.ss' + substep);
        elSub.classList.add("last");
        console.log('in substep leave for ' + step.id + ' ' + substep);
        setTimeout(function () {
            elSub.classList.remove('last');
        }, 1000);
    };


