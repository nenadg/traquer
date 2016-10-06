"use strict";

Traquer.Storage = function(){
    if (!(this instanceof Traquer.Storage)) {
        return new Traquer.Storage();
    }

    this.traquer = new Traquer();
    this.lzw     = new Traquer.Lzw();

    this.unit    = function(){
        var loc = JSON.stringify(window.location);
        loc = JSON.parse(loc);

        return {
            location : location,
            records  : undefined
        }
    }
}

Traquer.Storage.prototype.save = function(records){
    var unit    = this.unit(),
        name    = 'traquer_' + Math.random().toString(36).substring(3).substr(0, 8);

    unit.records = records;

    var encoded = this.lzw.encode(unit);

    console.log(this.lzw.getHumanReadableLength(encoded));

    localStorage.setItem(name, encoded);
    this.list();
}

Traquer.Storage.prototype.getList = function(){
    var self = this, 
        keys = [], 
        list = [], 
        i;

    for (i in localStorage){
        if(i && i.indexOf('traquer_') > -1)
            keys.push(i);
    }

    for(i in keys){
        if(keys.hasOwnProperty(i)){
            var property = localStorage.getItem(keys[i]);
            property = self.lzw.decode(property);

            if(property.location.href == window.location.href && 
               property.location.pathname == window.location.pathname &&
               property.location.hash == window.location.hash){
                    list.push(property);
            }
        }
    }

    return list;
}

Traquer.Storage.prototype.list = function(){
    var self              = this,
        traquer           = self.traquer,
        events            = traquer.recordedEvents,
        list              = document.querySelector('.traquer-list');

    if(!list){
        list              = document.createElement('div');
        list.className    = 'traquer-list';
        
        document.body.appendChild(list);
    }

    var saved = self.getList(), i, 
        tpl = ['<h3>Saved Cases</h3>', '<div class="inner-list">'];

    for(i in saved){
        if(saved.hasOwnProperty(i)){
            var item       = saved[i],
                similarity = traquer.getSimilarity(item.records);

            var labelTpl = [
                '<label>',
                '<input type="checkbox" name="' + i + '" value="' + i + '" />',
                'Location: ' + item.location.hash + '<br/>',
                'Similarity to current: ' + similarity + '%</label><br />'
            ].join('');

            tpl.push(labelTpl);
        }
    }

    tpl.push('</div>');
   
    tpl = tpl.join('');
   /* var tpl = [
        '<h3>Saved Cases</h3>',
        '<label><input type="checkbox" name="animal" value="Cat" />Cats </label>',
        '<input type="checkbox" name="animal" value="Dog" />Dogs<br />',
        '<input type="checkbox" name="animal" value="Bird" />Birds<br />'

    ].join('');*/

    list.innerHTML = tpl;
}

