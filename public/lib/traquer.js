"use strict";

/**
 * Traquer
 *
 **/
var Traquer = function() {
    if (!(this instanceof Traquer)) {
        return new Traquer();
    }

    this.index           = 0;
    this.logging         = false;
    this.recordedEvents  = [];
    this.previousElement = null;

    this.eventNames      = ['mousemove',   'mouseenter',      'mouseleave',      'mouseover',          'mousedown', 
                          'mouseup',     'mouseout',        'click',           'scroll',             'contextmenu', 
                          'wheel',       'focus',           'focusin',         'focusout',           'DOMFocusIn', 
                          'input',       'textinput',       'keypress',        'keydown',            'keyup', 
                          'change',      'DOMFocusOut',     'selectstart',     'selectionchange',    'select',
                          'DOMActivate'];
}

Traquer.prototype = {
    
    isEventObservable: function(evt) {
        if (evt && evt.type)
            return this.eventNames.indexOf(evt.type) > -1;

        return false;
    },

    start: function (log) {
        var self = this;

        self.isRecording = true;
        self.recordingStartTime = new Date().getTime();
        self.recordedEvents = [];
        self.mousePosition = { x: 0, y: 0 };

        var eventNames = self.eventNames || [];
        self.processEventBinded = self.processEvent.bind(self);

        eventNames.forEach(function(eventName) {
            document.body.addEventListener(eventName, self.processEventBinded, false);
        });

        document.addEventListener('mousemove', function(event){
            self.mousePosition.x = event.x;
            self.mousePosition.y = event.y;
        });

        if(log)
            this.logging = true;
    },

    stop: function() {
        var self = this;
        var eventNames = self.eventNames || [];
        if (self.processEventBinded)
            eventNames.forEach(function(eventName) {
                document.body.removeEventListener(eventName, self.processEventBinded, false);
            });

        self.isRecording = false;

        return this.recordedEvents;
    },

    copyEventObject: function(evt) {
        var e = {};

        for (var i in evt) {
            var attributeType = typeof evt[i];
            if (attributeType != 'function' && attributeType != 'object')
                e[i] = evt[i];
        }

        return e;
    },

    processEvent: function(evt) {
        var self = this;

        if (evt.type == 'mousedown')
            self.isMouseDown = true;
        
        if (self.isEventObservable(evt) || self.isMouseDown) {

            var trackingObject = {
                index      : this.index,
                x          : self.mousePosition.x,
                y          : self.mousePosition.y,
                time       : new Date().getTime() - self.recordingStartTime,
                raw        : self.copyEventObject(evt),
                type       : evt.type,
                id         : evt.target.id,
                targetType : evt.target.tagName? evt.target.tagName.toLowerCase(): null,
                value      : evt.target.value || evt.target.text,
                attrs      : (function(){
                    var attributes = [], i;

                    for(i in evt.target.attributes){
                        if(evt.target.attributes.hasOwnProperty(i)){
                            if(evt.target.attributes[i].name !== 'style' && evt.target.attributes[i].value ){

                                // DO NOT match html in tags  (/<.*?[\s\S]*?>[\s\S]*?<\/.*>/g)
                                // DO NOT match urls          (/(http:).*/g
                                // DO NOT collect IDs
                                // DO NOT match data-         (/data-.*/g)

                                var htmlMatch = evt.target.attributes[i].value.match(/<.*?[\s\S]*?>[\s\S]*?<\/.*>/g),
                                    urlMatch  = evt.target.attributes[i].value.match(/(http:).*/g),
                                    dataMatch = evt.target.attributes[i].name.match(/data-.*/g),
                                    idMatch   = evt.target.attributes[i].name == 'id';

                                if(!idMatch && (htmlMatch == null) && (urlMatch == null) && (dataMatch == null)) {
                                    var attribute = evt.target.attributes[i].name + '="' + evt.target.attributes[i].value + '"';
                                    attributes.push(attribute);
                                }

                            } else if(evt.target.attributes[i].name !== 'style'){
                                attributes.push(evt.target.attributes[i].name);
                            }
                        }
                    }

                    return attributes;
                })(),
                classList: (function(){
                    var classes = [], i;

                    for(i in evt.target.classList){
                        if(evt.target.classList.hasOwnProperty(i)){
                            classes.push(evt.target.classList[i]);
                        }
                    }

                    return classes;
                })()
            };

            // don't click your controls
            if(trackingObject.id != 'traquer-playstop'){

                trackingObject.selector = self.createSelector.call(trackingObject);

                // if selector is valid, collect trackingObject
                if(document.querySelectorAll(trackingObject.selector)){

                    delete trackingObject.classList;
                    delete trackingObject.attrs;
                    delete trackingObject.targetType;

                    self.recordedEvents.push(trackingObject);
                    this.index++;

                    if(this.logging)
                        console.log(trackingObject);
                }
            }
        }

        // ... later remove mouseDown condition
        if(evt.type == 'mouseup')
            self.isMouseDown = false;
    },

    createSelector: function(){
        var self = this, selectorString = '';

        selectorString += self.targetType;

        if(self.attrs.length > 0){

            var i;
            for(i in self.attrs){
                if(self.attrs.hasOwnProperty(i)){

                    if(self.attrs[i] === 'value'){
                        selectorString += '[' + self.attrs[i] + '="' + self.value + '"]';
                    } 
                    else if (self.attrs[i] !== undefined)  {
                        var knownSelectors = self.attrs[i].match(/class/g) ||
                                             self.attrs[i].match(/selected/g) ||
                                             self.attrs[i].match(/over/g) ||
                                             self.attrs[i].match(/dirty/g) ||
                                             self.attrs[i].match(/selectable/g);

                        if(!knownSelectors){
                            selectorString += '[' + self.attrs[i] + ']';
                        }
                    }
                }
            }
        }

        if(self.classList.length > 0){

            var i;
            for(i in self.classList){

                if(self.classList.hasOwnProperty(i)){
                    var knownSelectors = self.classList[i].match(/class/g) || 
                                         self.classList[i].match(/selected/g) ||
                                         self.classList[i].match(/over/g) ||
                                         self.classList[i].match(/dirty/g) ||
                                         self.classList[i].match(/selectable/g);

                    if(!knownSelectors){

                        selectorString += '.' + self.classList[i];
                    }
                }
            }
        }

        if(self.id) {
            selectorString += ', ';
            selectorString += '#' + self.id;
        }

        return selectorString;
    },

    eventsScheduler: function() {
        var self = this;

        if (self.eventsInfo && self.eventsEmitted < self.eventsInfo.length) {
            var eventInfo = self.eventsInfo[this.eventsEmitted];
            var previousEventInfo = self.eventsInfo[this.eventsEmitted -1];
            var scheduleTime = previousEventInfo ? eventInfo.time - previousEventInfo.time : eventInfo.time;
            setTimeout(function() {
                self.eventEmitter(eventInfo);
                self.eventsEmitted++;
                self.eventsScheduler();
            }, scheduleTime);
        }
        else {
            self.isPlaying = false;
            self.removeFakeCursor();
        }
    },

    getIntersection: function(firstElement, secondElement) {
        var boundingBoxA = firstElement.getBoundingClientRect();
        var boundingBoxB = secondElement.getBoundingClientRect ? secondElement.getBoundingClientRect() : secondElement;
        var intersecting = false;

        if((boundingBoxA.left <= (boundingBoxB.left + boundingBoxB.width) &&
            (boundingBoxB.left <= (boundingBoxA.left + boundingBoxA.width))) &&
            (boundingBoxA.top <= (boundingBoxB.top + boundingBoxB.height)) &&
            (boundingBoxB.top <= (boundingBoxA.top + boundingBoxA.height )))
                intersecting = true;

        return intersecting;
    },

    getOffset: function( el ) {
        var boundingClientRect = el.getBoundingClientRect(),
            x = boundingClientRect.left,
            y = boundingClientRect.top,
            w = boundingClientRect.width,
            h = boundingClientRect.height;

        return { x: x, y: y, w: w, h: h };
    },

    pointRectangleIntersection: function (p, r) {
        return p.x > r.x1 && p.x < r.x2 && p.y > r.y1 && p.y < r.y2;
    },

    matchChild: function(node, child) {
        var found = false,
            i;

        if(node && node.childNodes)
            for(i in node.childNodes){
                if(node.childNodes.hasOwnProperty(i)){
                    var currentChild = node.childNodes[i];

                    if(currentChild == child){
                        return true;
                    }
                    else
                        this.matchChild(currentChild, child);
                }
            }

        return found;
    },

    play: function(eventsInfo) {
        if (this.isPlaying)
            return;

        this.isPlaying = true;

        this.createFakeCursor();
        this.eventsEmitted = 0;
        this.eventsInfo = eventsInfo;
        this.eventsScheduler();
    },

    eventEmitter: function(eventInfo) {
        var self = this;

        if (eventInfo){
            var selector     = document.querySelector(eventInfo.selector),
                eventElement = selector ? selector : document.elementFromPoint(eventInfo.x, eventInfo.y), // fallback
                fakeCursor   = self.getFakeCursor(),
                events       = new EventBase(self);

            fakeCursor.style.top  = eventInfo.y + 'px';
            fakeCursor.style.left = eventInfo.x + 'px';

            if(!selector){
                console.warn('[f] Cant find element by dinosaurus selector method, probably not there.');
            }

            if(!this.previousElement){
                this.previousElement = eventElement.parentElement;
            }
            else {
                var isChild     = this.matchChild(this.previousElement, eventElement);
                var prevoff     = this.getOffset(this.previousElement);
                var curroff     = this.getOffset(eventElement);
                var box         = { x1: prevoff.x, x2: prevoff.x + prevoff.w, y1: prevoff.y, y2: prevoff.y + prevoff.h };
                var closeOffset = this.pointRectangleIntersection(curroff, box)

                if(closeOffset || isChild){
                    eventInfo.stopPropagationFlag = true;
                }

                this.previousElement = null;
            }

            var eventEmitter;

            switch(eventInfo.type) {
                case 'mousemove':
                case 'mouseenter':
                case 'mouseleave':
                case 'mouseover':
                case 'mousedown':
                case 'mouseup':
                case 'mouseout':
                case 'click':
                case 'contextmenu':
                    events.mouseEvents(eventInfo, eventElement);
                    break;
                case 'wheel':
                    events.wheelEvents(eventInfo, eventElement);
                    break;
                case 'focus':
                case 'focusin':
                case 'focusout':
                case 'DOMFocusIn':
                case 'DOMFocusOut':
                    events.focusEvents(eventInfo, eventElement);
                    break;
                case 'input':
                case 'textinput':
                    events.inputEvents(eventInfo, eventElement);
                    break;
                case 'keypress':
                case 'keydown':
                case 'keyup':
                    events.keyEvents(eventInfo, eventElement);
                    break;
                case 'change':
                    events.empty(eventInfo, eventElement);
                    break;
                case 'selectstart':
                case 'selectionchange':
                    events.focusEvents(eventInfo, eventElement);  // was .selectionEvents
                    break;
                case 'scroll':
                case 'select':
                case 'DOMActivate':
                case 'DOMSubtreeModified':
                case 'DOMCharacterDataModified':
                    events.UIEvents(eventInfo, eventElement);
                    break;
            }
        }
    },

    getFakeCursor: function() {
        return this.fakeCursor || this.createFakeCursor();
    },

    createFakeCursor: function() {
        this.fakeCursor = document.createElement('div');

        this.fakeCursor.style.height       = '10px';
        this.fakeCursor.style.width        = '10px';
        this.fakeCursor.style.background   = 'red';
        this.fakeCursor.style.opacity      = '0.5';
        this.fakeCursor.style.display      = 'block';
        this.fakeCursor.style.position     = 'fixed';
        this.fakeCursor.style.borderRadius = '10px';
        this.fakeCursor.style.zIndex       = '2147483647';

        document.body.appendChild(this.fakeCursor);
    },

    removeFakeCursor: function() {
        if (this.fakeCursor) {
            document.body.removeChild(this.fakeCursor);
            delete this.fakeCursor;
        }
    },

    toggleStopPropagation: function(eventInfo, evt){
        var preventParents = ['mouseover', 'mouseenter', 'mouseleave', 'mouseout'];

        if(eventInfo.stopPropagationFlag && preventParents.indexOf(eventInfo.type) > -1 ){
            evt.stopPropagation();
        }
    }
}