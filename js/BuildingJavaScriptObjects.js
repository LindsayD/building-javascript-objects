var $ = function ( selector, context ) {
        context = context || document;
        return context.querySelector(selector);
};

var editor = ace.edit($('.ace'));
editor.setTheme("ace/theme/clouds");

var Range = ace.require('ace/range').Range;
var Marker = ace.require('ace/layer/marker').Marker;
var Selection = ace.require('ace/selection').Selection;

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

impress(undefined, Steps).init();