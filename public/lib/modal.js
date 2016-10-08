"use strict";

Traquer.Modal = function(config){
    if (!(this instanceof Traquer.Modal)) {
        return new Traquer.Modal();
    }

    this.id      = 'traquer_modal_' + Math.random().toString(36).substring(3).substr(0, 8);
    this.traquer = Traquer.getInstance();

    if(config){
      this.closeFn = config.close || function(){};
    }
}

Traquer.Modal.prototype.open = function(title, body){
  var tpl = this.getTpl(),
     list = document.querySelector('.traquer-list'),
     modalContainer = document.createElement('div');

  modalContainer.id = 'modal-container-' + this.id;
  
  tpl = tpl.replace('{id}', this.id)
           .replace('{title}', title)
           .replace('{body}', body);
  
  list.appendChild(modalContainer);
  modalContainer.innerHTML = tpl;

  var currentModal = document.body.querySelector('#' + this.id),
    close = currentModal.querySelector('.close');

  if(close)
    close.addEventListener('click', this.close.bind(this));
}

Traquer.Modal.prototype.close = function(e){
  var currentModal = document.body.querySelector('#' + this.id),
    list           = document.querySelector('.traquer-list'),
    modalContainer = list.querySelector('#modal-container-' + this.id);

  list.removeChild(modalContainer);
  this.closeFn();
}

Traquer.Modal.prototype.getTpl = function(){
  var tpl = [
    '<div class="traquer-modal" id="{id}">',
    ' <div class="traquer-modal-content">',
    '   <div class="modal-header">',
    '     <span class="close">×</span>',
    '     <h2>{title}</h2>',
    '   </div>',
    '   <div class="modal-body">',
    '     {body}',
    '   </div>',
    ' </div>',
    '</div>'
  ].join('');

  return tpl;
}