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
    this.domWatchCounter = 0;

    this.eventNames      = ['mousemove',   'mouseenter',      'mouseleave',      'mouseover',          'mousedown', 
                            'mouseup',     'mouseout',        'click',           'scroll',             'contextmenu', 
                            'wheel',       'focus',           'focusin',         'focusout',           'change', 
                            'input',       'textinput',       'keypress',        'keydown',            'keyup', 
                            'DOMFocusIn',  'DOMFocusOut',     'selectstart',     'selectionchange',    'select',
                            'DOMActivate'];

    var traquerBase = document.querySelector('.traquer-base');
    
    if(!traquerBase){                      
        traquerBase = document.createElement('div');
        traquerBase.className   = 'traquer-base';
        document.body.appendChild(traquerBase);

        window.onerror = function(message, url, lineNumber) {  

            var errorEvent = new Event('traquerfail');
            errorEvent.details = [message, url, lineNumber]
           
            traquerBase.dispatchEvent(errorEvent);
        }

        traquerBase.addEventListener('traquerfail', function(e){
            console.log('[e] Event execution failed.');
            console.log(e);
        });

        traquerBase.addEventListener('traquerwarn', function(e){
            console.warn('[e] Event execution warning.');
            console.log(e);
        });
    }

    Traquer.__instance = this;
}

Traquer.getInstance = function(){
    return this.__instance;
}

Traquer.prototype = {
    
    getId: function(){
        var recordedEvents = this.recordedEvents,
            randomId = 'e_' + Math.random().toString(36).substring(3).substr(0, 8);

        if(recordedEvents && recordedEvents.length){
           
            var same = recordedEvents.filter(function(recordedEvent){
                    if(recordedEvent.tid == randomId)
                        return randomId;
                });
            
            if(same.length)
                randomId = this.getId();
        }

        return randomId;
    },

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
            self.mousePosition.x = event.clientX;
            self.mousePosition.y = event.clientY;
        });

        document.addEventListener('DOMSubtreeModified', self.domWatch);

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

        if(self.playerTarget){
            var stopEvent = new Event('stop');
            self.playerTarget.dispatchEvent(stopEvent);
        }

        document.removeEventListener('DOMSubtreeModified', self.domWatch, false);

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

    createTrackingObject: function(evt){
        var self = this;

        return {
            tid        : self.getId(),
            index      : self.index,
            x          : self.mousePosition.x,
            y          : self.mousePosition.y,
            time       : new Date().getTime() - self.recordingStartTime,
            raw        : self.copyEventObject(evt),
            type       : evt.type,
            id         : evt.target.id,
            targetType : evt.target.tagName? evt.target.tagName.toLowerCase(): null,
            value      : evt.target.value || evt.target.text,
            attrs      :  self.getAttributes(evt.target),
            classList  : self.getClassess(evt.target)
        }
    },

    processEvent: function(evt) {
        var self = this;

        if (evt.type == 'mousedown')
            self.isMouseDown = true;
        
        if (self.isEventObservable(evt) || self.isMouseDown) {

            var trackingObject = self.createTrackingObject(evt);

            // don't click your controls
            if(trackingObject.id != 'traquer-recorder' &&
               trackingObject.id != 'traquer-player' &&
               trackingObject.id != 'traquer-reset'){
                var selector = self.createSelector.call(trackingObject, self),
                    element  = document.querySelector(selector);

                // if selector is valid, collect trackingObject
                if(element){
                    trackingObject.selector = self.createXPathFromElement(element);
                    delete trackingObject.classList;
                    delete trackingObject.attrs;
                    self.domWatchCounter = 0;

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

    eventsScheduler: function() {
        var self = this;

        if (self.eventsInfo && self.eventsEmitted < self.eventsInfo.length) {
            var eventInfo = self.eventsInfo[this.eventsEmitted];
            var previousEventInfo = self.eventsInfo[this.eventsEmitted -1];
            var scheduleTime = previousEventInfo ? eventInfo.time - previousEventInfo.time : eventInfo.time;

            var fireTimeout = setTimeout(function() {
                self.eventEmitter(eventInfo);
                self.eventsEmitted++;
                self.eventsScheduler();
                clearTimeout(fireTimeout);
            }, scheduleTime);
        }
        else {
            self.isPlaying = false;
            self.removeFakeCursor();
        }
    },

    play: function(eventsInfo) {
        if (this.isPlaying)
            return;

        var similarity = this.getSimilarity(eventsInfo);

        if(similarity < 50)
            console.warn('[w] Current scenario is less than 50% similar to page you`re testing (' + similarity + ')');

        this.isPlaying = true;

        this.createFakeCursor();
        this.eventsEmitted = 0;
        this.eventsInfo = eventsInfo;
        this.eventsScheduler();
    },

    domWatch: function(evt){
        var self           = Traquer.getInstance(),
            trackingObject = self.createTrackingObject(evt);

        if(self.domWatchCounter > 100){ // this number is arbitrary; it should relate to number of dom elements
            delete trackingObject.classList;
            delete trackingObject.attrs;

            self.domWatchCounter = 0;
            
            self.recordedEvents.push(trackingObject);
        }
        else
            self.domWatchCounter++;
    },

    eventEmitter: function(eventInfo) {
        var self = this;

        if (eventInfo){
            var eventElement = self.lookupElementByXPath(eventInfo.selector),
                fakeCursor   = self.getFakeCursor(),
                events       = new Traquer.EventBase(self);

            fakeCursor.style.top  = eventInfo.y + 'px';
            fakeCursor.style.left = eventInfo.x + 'px';

            if(!eventElement){
                eventElement = document.elementFromPoint(eventInfo.x, eventInfo.y);
                console.log('');
                console.warn('[f] lookupElementByXPath failed, will use elementFromPoint, details: ');
                console.warn('[|-->] failed     : ', eventInfo.selector);
                console.warn('[|-->] from point : ', self.createXPathFromElement(eventElement));
                
                // check similarity between elementFromPoint and eventInfo.selector
                if(!eventElement){
                    console.error('[f] nothing found.');
                    return;
                }
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
                case 'dblclick':
                case 'contextmenu':
                    events.mouseEvents(eventInfo, eventElement);
                    break;
                case 'wheel':
                    events.wheelEvents(eventInfo, eventElement);
                    break;
                case 'DOMFocusIn':
                case 'DOMFocusOut':
                case 'focusin':
                case 'focus':
                case 'focusout':
                case 'blur':
                    events.focusEvents(eventInfo, eventElement);
                    break;
                case 'beforeinput':
                case 'input':
                case 'textinput':
                    events.inputEvents(eventInfo, eventElement);
                    break;
                case 'keypress':
                case 'keydown':
                case 'keyup':
                case 'nothing':
                    events.keyEvents(eventInfo, eventElement);
                    break;
                case 'change':
                    events.event(eventInfo, eventElement);
                    break;
                case 'selectstart':
                case 'selectionchange':
                    events.focusEvents(eventInfo, eventElement);
                    break;
                case 'scroll':
                case 'select':
                case 'DOMMouseScroll':
                case 'DOMActivate':
                case 'DOMSubtreeModified':
                case 'DOMCharacterDataModified':
                    events.UIEvents(eventInfo, eventElement);
                    break;
            }

            if(self.trackTarget){
                var moveEvent = new CustomEvent('move', { detail: { eventInfo: eventInfo, last: self.recordedEvents[self.recordedEvents.length - 1].time } });
                self.trackTarget.dispatchEvent(moveEvent);
            }
        }

        if(self.recordedEvents.indexOf(eventInfo) == self.recordedEvents.length -1){
            self.stop();
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
        this.fakeCursor.style.border       = '1px solid red';

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
    },

    getAttributes: function(element){
        var attributes = [], i;

        for(i in element.attributes){
            if(element.attributes.hasOwnProperty(i)){
                
                if(element.attributes[i].name !== 'style' && element.attributes[i].value ){

                    // DO NOT match html in tags  (/<.*?[\s\S]*?>[\s\S]*?<\/.*>/g)
                    // DO NOT match urls          (/(http:).*/g
                    // DO NOT collect IDs
                    // DO NOT match data-         (/data-.*/g)

                    var htmlMatch = element.attributes[i].value.match(/<.*?[\s\S]*?>[\s\S]*?<\/.*>/g),
                        urlMatch  = element.attributes[i].value.match(/(http:).*/g),
                        dataMatch = element.attributes[i].name.match(/data-.*/g),
                        idMatch   = element.attributes[i].name == 'id';

                    if(!idMatch && (htmlMatch == null) && (urlMatch == null) && (dataMatch == null)) {
                        var attribute = element.attributes[i].name + '="' + element.attributes[i].value + '"';
                        attributes.push(attribute);
                    }
                }
            }
        }
        return attributes;
    },

    getClassess: function(element){
        var classes = [], i;

        for(i in element.classList){
            if(element.classList.hasOwnProperty(i)){
                classes.push(element.classList[i]);
            }
        }

        return classes;
    },
    
    ignoredAttributes: [
        'selected',
        'over',
        'dirty',
        'href',
        'valign',
        'role',
        'tabindex',
        'over',
        'dirty',
        'selected',
        'focused',
        'focus',
        'active',
        'pressed'
    ],

    matchIgnored: function(attribute){
        var self = this;
       
        return !!self.ignoredAttributes.map(function(p){
            if(attribute.indexOf(p) > -1) 
                return p; 
        }).filter(function(c){
            if(c)
                return c;
        }).length;
    },

    getSelector: function(attrs, classList, value, id){
        var self = this,
            selectorString = '';
        
        if(attrs.length > 0){

            var i;
            for(i in attrs){
                if(attrs.hasOwnProperty(i)){

                    if(attrs[i] === 'value'){
                        selectorString += '[' + attrs[i] + '="' + value + '"]';
                    } 
                    else if (attrs[i] !== undefined) {
                        var ignoredAttribute = self.matchIgnored(attrs[i]);
                                          
                        if(!ignoredAttribute){
                            selectorString += '[' + attrs[i] + ']';
                        }
                    }
                }
            }
        }

        if(classList.length > 0){

            var i;
            for(i in classList){

                if(classList.hasOwnProperty(i)){
                    var ignoredAttribute = self.matchIgnored(classList[i]);
                                          
                    if(!ignoredAttribute){
                        selectorString += '.' + classList[i];
                    }
                }
            }
        }

        if(id) {
            selectorString += '#' + id ;
        }

        return selectorString;
    },

    createSelector: function(traquer){
        var self             = this,
            domTree          = [],
            selectorString   = self.targetType + traquer.getSelector(self.attrs, self.classList, self.value, self.id),
            selectedElements = Array.prototype.slice.call(document.querySelectorAll(selectorString)),
            firstFound       = selectedElements.filter(function(currentElement){ 
                var currentBoundingBox = currentElement.getBoundingClientRect(),
                    motionsBoundingBox = { height: 50, left: traquer.mousePosition.x, top: traquer.mousePosition.y, width: 50 },
                    intersection       = traquer.getIntersection(currentElement, motionsBoundingBox);

                if(intersection)
                    return currentElement;
            })[0];
            

        if(!firstFound){
            return selectorString;
        }

        while(firstFound != document.body ){
            var attributes = traquer.getAttributes(firstFound),
                classes    = traquer.getClassess(firstFound);
               
            if(attributes.length && classes.length){
                domTree.push(traquer.getSelector(attributes, classes, firstFound.value, firstFound.id)); 
            }

            if(firstFound.parentElement)
                firstFound = firstFound.parentNode;  
        }

        if(domTree.length){
            selectorString = domTree.reverse().join(' ');
        }   

        
        return selectorString;
    },

    /**
     * Creates xpath from given element
     * Special thanks to Stijn De Ryck,
     * original source at - 
     * https://stackoverflow.com/questions/2661818/javascript-get-xpath-of-a-node
     */
    createXPathFromElement: function(elm) {
        var self = this,
            allNodes = document.getElementsByTagName('*');

        for (var segs = []; elm && elm.nodeType == 1; elm = elm.parentNode) 
        { 
            if (elm.hasAttribute('id')) { 
                    var uniqueIdCount = 0; 
                    for (var n=0;n < allNodes.length;n++) { 
                        if (allNodes[n].hasAttribute('id') && allNodes[n].id == elm.id) uniqueIdCount++; 
                        if (uniqueIdCount > 1) break; 
                    }; 
                    if ( uniqueIdCount == 1) { 
                        segs.unshift('id("' + elm.getAttribute('id') + '")'); 
                        return segs.join('/'); 
                    } else { 
                        segs.unshift(elm.localName.toLowerCase() + '[@id="' + elm.getAttribute('id') + '"]'); 
                    } 
            } else if (elm.hasAttribute('class')) {
                var classAttr = elm.getAttribute('class');

                if(self.matchIgnored(classAttr)){
                    classAttr = classAttr.split(' ');
                    classAttr = classAttr.filter(function(f){
                        if(!self.matchIgnored(f)){
                            return f;
                        }
                    });

                    classAttr = classAttr.join(' ');
                }
                

                segs.unshift(elm.localName.toLowerCase() + '[@class="' + classAttr + '"]'); 
            } else { 
                for (var i = 1, sib = elm.previousSibling; sib; sib = sib.previousSibling) { 
                    if (sib.localName == elm.localName)  i++; }; 
                    segs.unshift(elm.localName.toLowerCase() + '[' + i + ']'); 
            }; 
        }; 
        return segs.length ? '/' + segs.join('/') : null; 
    },

    lookupElementByXPath: function(path) { 
        var evaluator = new XPathEvaluator(); 
        var result = evaluator.evaluate(path, document.documentElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null); 
        return  result.singleNodeValue; 
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

    /**
     * Checks for similiraty between current and saved DOM tree
     * by checking if saved selectors can find elements in current document.
     * First DOMSubtreeModified event marks the start to ignore matching,
     * the last marks the end; This helps for matching scenarios on 
     * the same page, that have bigger mutation footprint.
     */
    getSimilarity: function(eventsInfo){
        var elements    = 0, 
            percentage  = 0,
            stopMaching = false,
            i;

        for(i in eventsInfo){
            if(eventsInfo.hasOwnProperty(i)){
                var eventInfo = eventsInfo[i],
                    similar = this.lookupElementByXPath(eventInfo.selector);
                
                if(eventInfo.type == 'DOMSubtreeModified')
                    stopMaching = !stopMaching;

                if(stopMaching){
                    elements++;
                    continue;
                }

                if(similar && !stopMaching){
                    var style  = window.getComputedStyle(similar),
                        hidden = /*style.display == 'none' || */style.visibility == 'hidden';

                    if(!hidden)
                        elements++;
                }
            }
        }

        percentage = (elements / eventsInfo.length) * 100;
        
        return Math.round(percentage * 100) / 100;
    },

    //http://blog.stevenlevithan.com/archives/faster-than-innerhtml
    replaceHtml: function(el, html) {
        var oldEl = typeof el === "string" ? document.getElementById(el) : el;
        /*@cc_on // Pure innerHTML is slightly faster in IE
            oldEl.innerHTML = html;
            return oldEl;
        @*/
        //var c = document.createDocumentFragment();
        var newEl = oldEl.cloneNode(false);
        newEl.innerHTML = html;

       // c.appendChild(newEl);

        
        oldEl.parentNode.replaceChild(newEl, oldEl);
        /* Since we just removed the old element from the DOM, return a reference
        to the new element, which can be used to restore variable references. */
        return newEl;
    }
}