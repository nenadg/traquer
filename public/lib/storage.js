"use strict";

Traquer.Storage = function(){
    if (!(this instanceof Traquer.Storage)) {
        return new Traquer.Storage();
    }

    this.traquer = Traquer.getInstance();
    this.lzw     = new Traquer.Lzw();

    this.unit    = function(){
        var loc = JSON.stringify(window.location);
        loc = JSON.parse(loc);

        return {
            location : loc,
            records  : undefined,
            name     : undefined,
            time     : undefined
        }
    }
}

Traquer.Storage.prototype.save = function(records){
    var unit    = this.unit(),
        name    = 'traquer_' + Math.random().toString(36).substring(3).substr(0, 8);

    unit.records = records;
    unit.name    = name;
    unit.time    = Date.now();

    var encoded = this.lzw.encode(unit);

    console.log(this.lzw.getHumanReadableLength(encoded));

    localStorage.setItem(name, encoded);
    this.hint();
}

Traquer.Storage.prototype.remove = function(name){
    localStorage.removeItem(name);
}

Traquer.Storage.prototype.hint = function(){
    var self              = this,
        traquer           = self.traquer,
        events            = traquer.recordedEvents,
        list              = document.querySelector('.traquer-list'),
        rawList           = self.getRawList()

    if(!list){
        list              = document.createElement('div');
        list.className    = 'traquer-list';
        
        document.body.appendChild(list);
    }

    var tpl = [
        '<h3>You have ' + rawList.length + ' cases for this page</h3>',
        '<p id="traquer-show-storage" class="button green">Manage list</p>',
        '<p id="traquer-import-storage" class="button">Import</p>'
    ].join('');

    if(!rawList.length){
        //document.body.removeChild(list);
        var tpl = [
            '<h3>You have ' + rawList.length + ' cases for this page</h3>',
            '<p id="traquer-import-storage" class="button green">Import</p>'
        ].join('');
    }

    list.innerHTML = tpl;

    var showStorage     = list.querySelector('#traquer-show-storage'),
        importToStorage = list.querySelector('#traquer-import-storage');
        
    showStorage && showStorage.addEventListener('click', function(e){
        self.getModal(rawList);
    });

    importToStorage && importToStorage.addEventListener('click', function(e){
        var upload = document.createElement('input');

        upload.type = 'file';
        upload.style.display = 'none';
        upload.id = 'traquer-import';
        upload.setAttribute('accept', '.json');

        upload.addEventListener("change", function(e){
            var file   = upload.files[0], 
                reader = new FileReader();

            reader.onload = function(e) { 
                var result = e.target.result,
                    unit   = self.lzw.decode(result);

                if(!unit.location && !unit.time && !unit.records && !unit.name){
                    console.log('[e] invalid format.');
                    return;
                }

                var encoded = self.lzw.encode(unit);
                console.log(self.lzw.getHumanReadableLength(encoded));

                localStorage.setItem(unit.name, encoded);
                self.hint();
            }

            reader.readAsText(file);
        });

        e.target.appendChild(upload);
        
        upload = document.querySelector('#traquer-import');

        upload.click();
    });
}

Traquer.Storage.prototype.exportCase = function(encoded){
    var json       = "data:application/json;charset=utf-8," + encoded,
        exportDate = new Date().toDateString().replace(/\s/g, '-');
       
    var link = document.createElement("a");
    link.setAttribute("href", encodeURI(json));
    link.setAttribute("download", "traquer_export_data_" + exportDate + ".json");
    document.body.appendChild(link);

    link.click();
}

Traquer.Storage.prototype.importCase = function(encoded){

}

Traquer.Storage.prototype.serialize = function(form){
    var inputs = [].slice.call(form.querySelectorAll('input')),
        data   = [];
    
    inputs.forEach(function(input) {
        if(input.checked)
            data.push({ name: input.name, time: input.getAttribute('time') });
    });

    data = data.sort(function(a,b){
        return a.time - b.time
    });

    return data;
}

Traquer.Storage.prototype.joinRecords = function(data, rawList){
    var events = [], 
        i;

    for(i in data){
        if(data.hasOwnProperty(i)){
            var name    = data[i].name,
                unit    = rawList.filter(function(c){
                    return c.name == name;
                })[0];

            if(unit){
                var last = events[events.length - 1],
                    time = 0;

                if(last)
                    time = last.time;

                unit.records.forEach(function(record){
                   
                    record.time += time;
                });

                events = events.concat(unit.records);
            }
        }
    }

    return events;
}

Traquer.Storage.prototype.getRawList = function(){
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
          
            if(property.location.host == window.location.host && 
                property.location.port == window.location.port && 
                property.location.hash == window.location.hash &&
                property.location.origin == window.location.origin){
                    list.push(property);
            }
        }
    }

    return list.sort(function(a, b){ return b.time - a.time });
}

Traquer.Storage.prototype.getHTMLList = function(rawList){
     var self              = this,
        traquer            = self.traquer,
        tpl                = [], 
        i;

    for(i in rawList){
        if(rawList.hasOwnProperty(i)){
            var item       = rawList[i],
                similarity = traquer.getSimilarity(item.records),
                disabled   = !isNaN(similarity) ? similarity < 50 : true;

            var labelTpl = [
                '<label>',
                '<input ' + (disabled? 'disabled' : '') + ' type="checkbox" name="' + item.name + '" time="' + item.time + '"/>',
                'Case on <span style="color: #925e8b;">' + item.location.href + '</span>, <br/>',
                ' &bull; DOM similarity to current location <span style="color: #28e;">' + similarity + '%</span>, <br/>',
                ' &bull; Captured event count <span style="color: #28e;">' + item.records.length + '</span>, <br/>',
                ' &bull; Captured time <span style="color: #28e;">' + new Date(item.time) + '</span>.',
                ' <br/>&nbsp;',
                '</label>'
            ].join('');

            tpl.push(labelTpl);
        }
    }

    tpl.push('</form>');

    return tpl.join('');
}

Traquer.Storage.prototype.getButtons = function(){
    var tpl = [
        '<p style="float: right;" id="traquer-storage-run" class="button green">Run selected</p>',
        '<p style="float: right;" id="traquer-storage-delete" class="button red left">Delete selected</p>',
        '<p style="float: right;" id="traquer-storage-heatmap" class="button">Heatmap selected</p>',
        '<p style="float: right;" id="traquer-storage-export" class="button left">Export selected</p>'
    ];

    return tpl.join('');
}

Traquer.Storage.prototype.getModal = function(rawList){
    var self    = this,
        traquer = self.traquer,
        modal   = new Traquer.Modal({ 
                    close: function(){
                        self.hint();
                    }
                });

    var modalBody = ['<h3>Saved Cases</h3>',
                     '<p>Select cases you wish to run.<br/>',
                     'Cases with similarity less than 50% to current DOM tree won\'t be selectable.</p>',
                     '<p style="float:left;" id="traquer-storage-override" class="button">Override similarity restriction</p><p>&nbsp;</p>',
                     '<form style="clear:left;" id="traquer-form" class="inner-list">'].join('');

    var renderedList = self.getHTMLList(rawList),
        modalButtons = self.getButtons(),
        modalHtml    = modalBody + renderedList + modalButtons;

    modal.open.call(modal, 'Manage List', modalHtml);

    var storageRun     = document.querySelector('#traquer-storage-run'),
        storageDelete  = document.querySelector('#traquer-storage-delete'),
        storageHeatmap = document.querySelector('#traquer-storage-heatmap'),
        storageExport  = document.querySelector('#traquer-storage-export'),
        override       = document.querySelector('#traquer-storage-override');

    storageRun.addEventListener('click', function(e){
        var form   = document.querySelector('#' + modal.id + ' form'),
            data   = self.serialize(form),
            events = self.joinRecords(data, rawList);
        
        traquer.recordedEvents = events;
        var controls = Traquer.Controls.getInstance();

        controls.timeline.call(controls);
        controls.player.call(controls);
        modal.close();
    });

    storageDelete.addEventListener('click', function(e){
        var form   = document.querySelector('#' + modal.id + ' form'),
            inputs = [].slice.call(form.querySelectorAll('input')),
            data   = [];
        
        inputs.forEach(function(input) {
            if(input.checked)
                self.remove(input.name);
        });

        var renderedList = self.getHTMLList(self.getRawList());

        form.innerHTML   = renderedList;
    });

    storageHeatmap.addEventListener('click', function(e){
        var heatmap = new Traquer.Heatmap(),
            modalEl = document.querySelector('.traquer-modal');

        if(modalEl && modalEl.parentElement){
            var form   = document.querySelector('#' + modal.id + ' form'),
                data   = self.serialize(form),
                events = self.joinRecords(data, rawList);

            traquer.recordedEvents = events;

            if(!traquer.recordedEvents.length)
                return;

            modalEl.style.cssText = 'opacity: 0.1';
        }

        heatmap.make();
    });

    storageExport.addEventListener('click', function(e){
        var form   = document.querySelector('#' + modal.id + ' form'),
            data   = self.serialize(form),
            events = self.joinRecords(data, rawList);

        var unit    = self.unit(),
            name    = 'traquer_' + Math.random().toString(36).substring(3).substr(0, 8);

        unit.records = events;
        unit.name    = name;
        unit.time    = Date.now();

        var encoded = self.lzw.encode(unit);

        console.log(self.lzw.getHumanReadableLength(encoded));
        self.exportCase(encoded);
    });

    override.addEventListener('click', function(e){
        var form   = document.querySelector('#' + modal.id + ' form'),
            inputs = [].slice.call(form.querySelectorAll('input'));

        inputs.forEach(function(input){
            input.removeAttribute('disabled');
        });

        e.target.parentElement.removeChild(e.target);
    });
}



