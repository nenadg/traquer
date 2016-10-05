"use strict";

/**
 * EventBase
 *
 **/
Traquer.EventBase = function(traquer) {
    if (!(this instanceof Traquer.EventBase)) {
        return new Traquer.EventBase();
    }

    if(!traquer || !(traquer instanceof Traquer))
        throw new Error('Can\'t instantiate EventBase without Traquer instance!');

    this.traquer = traquer;
}

Traquer.EventBase.prototype = {

    getScrollTarget: function(element){
      
      var target = element;

      while(target != document.body){
        target = target.parentNode;
        var style = window.getComputedStyle(target);

        if(style && style['overflow-y'] == 'auto'){
         
          if(target.scrollHeight > target.clientHeight
            ){

            return target;
          }
        }
      }
      return target;

    },

    shallowCopy: function(evt, raw){
      // copy public properties
      for(var i in raw){
        try {
          evt[i] = raw[i];
        } catch(e){ 
          // cant assigned private property 
        }
      }
      return evt;
    },

    mouseEvents: function(eventInfo, element) {
        var evt = new MouseEvent(eventInfo.type, eventInfo.raw);
        evt = this.shallowCopy(evt, eventInfo.raw);

        //if(eventInfo.type == 'click')
        //    element.focus();
        
        this.traquer.toggleStopPropagation(eventInfo, evt);
        
        element.dispatchEvent(evt);
    },

    wheelEvents: function(eventInfo, element) {
      // find first scrollable parent
      element = this.getScrollTarget(element);

      var evt = new WheelEvent('wheel', eventInfo.raw);
      evt = this.shallowCopy(evt, eventInfo.raw);

      element.scrollLeft += evt.deltaX;
      element.scrollTop += evt.deltaY;

      element.dispatchEvent(evt);
    },

    focusEvents: function(eventInfo, element) {
      var type = (eventInfo.type.indexOf('FocusIn') > -1) ? 'focus' : 'blur',
        either = (eventInfo.type.indexOf('FocusIn') > -1) || (eventInfo.type.indexOf('FocusOut') > -1);

      // dispatch default event first
      if(either){
        var eitherTimeout = setTimeout(function(){
          element.dispatchEvent(new FocusEvent(eventInfo.type, element));
          clearTimeout(eitherTimeout);
        }, 1);
      }
      if(eventInfo.type == 'focusin' || eventInfo.type == 'DOMFocusIn')
        element.focus();

      if(eventInfo.type == 'focusout'|| eventInfo.type == 'DOMFocusOut')
        element.blur();

      /*var evt = new FocusEvent(eventInfo.type, eventInfo.raw);
      evt = this.shallowCopy(evt, eventInfo.raw);*/

      //element.dispatchEvent(evt);
      element.dispatchEvent(new FocusEvent(type, element));
    },

    inputEvents: function(eventInfo, element){
      var inputEvent = (typeof InputEvent != 'undefined') ? InputEvent : Event;
      var evt = new inputEvent(eventInfo.type, eventInfo.raw);
      evt = this.shallowCopy(evt, eventInfo.raw);

      if(document.activeElement != element)
        element = document.activeElement;
    
      element.value = eventInfo.value != undefined ? (eventInfo.value) : '';
      element.dispatchEvent(evt);
    },

    keyEvents: function(eventInfo, element){
      var evt = new KeyboardEvent(eventInfo.type, eventInfo.raw);
      evt = this.shallowCopy(evt, eventInfo.raw);

      if(document.activeElement != element)
        element = document.activeElement;

      if(element.contentEditable && eventInfo.type == 'keypress'
         && eventInfo.raw.which != 9){
        var key = '';
        if(eventInfo.raw.which == 13){
          element.style.whiteSpace = 'pre';
          key = '\r\r\n';
        } else {
          key = String.fromCharCode(eventInfo.raw.which);
        }

        element.textContent += key;
      }

      element.dispatchEvent(evt);
    },

    UIEvents: function(eventInfo, element) {
      var evt = new UIEvent(eventInfo.type, eventInfo.raw);
      element.dispatchEvent(evt);
    },

    selectionEvents: function(eventInfo, element) {
     this.UIEvents(eventInfo, element);
    },

    event: function(eventInfo, element){
      var evt = new Event(eventInfo.type, eventInfo.raw);
      element.dispatchEvent(evt);
    }
}