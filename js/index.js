'use strict';
const electron = require('electron');
const ipc = electron.ipcRenderer;
const remote = electron.remote;
const Menu = remote.Menu;
const MenuItem = remote.MenuItem;
const fs = require('fs');
const utils = require('../js/utilities')
const config = require('../config');
const $ = require('../js/jquery');

let load_videos = false;
let shuffle_files = false;

$(document).ready(function() {
  chooseSplash();    
});

$('#add_directories').on('click', function(e) {
  ipc.send('open-directories-dialog');
});

$(document).on('keydown', function(e) {

  if (e.keyCode === 37) return prevImage(e)
  if (e.keyCode === 39) return nextImage(e)
  if (e.keyCode === 46) return deleteImage(e) 
});

function nextImage(e) {
  // Show next image

  utils.debugLog('next.');
  ipc.send('get-next');
}

function prevImage(e) {
  // Show previous image

  utils.debugLog('previous.');
  ipc.send('get-prev');
}

function deleteImage(e) {
  utils.debugLog('delete');
  
  var yes_no = confirm('Are you sure you want to delete the image?');
  if (yes_no === true) {
    ipc.send('delete-file');
  }
  
}

function chooseSplash(e) {  
  
  var random = Math.floor((Math.random() * config.number_of_splash_imgs) + 1);
  utils.debugLog('update-splash-image: ' + random);  
  $('#splash-div').css('background-image', 'url(./images/splash-' + random + '.jpg)');
}

ipc.on('update-display-image', function(e, filename) {

  var adjusted_path = encodeURI(filename.replace(/\\/g, '/')).replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/\'/g, '\\\'').replace(/\#/g, '%23');
  utils.debugLog('update-display-image: ' + adjusted_path);  
  
  $('#splash-div').addClass('hidden');
  $('#splash-div').css('background-image', 'none');
  
  $('#video-div').addClass('hidden');      
  $('#video-player').attr('src', '');    
  
  
  
  $('#display-div').remove();
  $('#loading-div').after('<div id="display-div" class="display-image"></div>');  
  
  if ( utils.isVideo(filename) ) {
    $('#video-div').removeClass('hidden');
    $('#video-player').attr('src', adjusted_path);    
  } else {          
    $('#display-div').removeClass('hidden');    
    $('#display-div').css('background-image', 'url(file://' + adjusted_path + ')');
  }

});


ipc.on('get-files', function(e, opened_directories) {
  utils.debugLog('get-files');

  $('#loading-div').removeClass('hidden');
  $('#splash-div').addClass('hidden');
  $('#display-div').addClass('hidden');

  load_videos = $('#include_video').is(':checked');
  shuffle_files = $('#shuffle_files').is(':checked');

  utils.getFiles(opened_directories, load_videos, function(files) {

    $('#loading-div').addClass('hidden');

    if (shuffle_files) {
      utils.shuffle(files);  
    }

    utils.debugLog(files);
   	ipc.send('load-files', files);

  });
});


var appmenu_template = [
  {
    label: 'photo-slap',
    submenu: [
      {
        label: 'add directories',
        accelerator: 'Command+O',
        click: function() { ipc.send('open-directories-dialog'); }
      },
      {
        label: 'shuffle',
        accelerator: 'Command+R',
        click: function() { ipc.send('shuffle-files'); }
      },
      {
        type: 'separator'
      },
      {
        label: 'quit',
        accelerator: 'Command+Q',
        click: function() { ipc.send('close'); }
      }
    ]
  },
  {
    label: 'help',
    submenu: [
      {
        label: 'about photo-slap',
        click: function() { ipc.send('open-url-in-external', 'https://github.com/eddysant/photo-slap'); }
      },
      {
        label: 'report issue',
        click: function() { ipc.send('open-url-in-external', 'https://github.com/eddysant/photo-slap/issues'); }
      }
    ]
  }
];

var appmenu = Menu.buildFromTemplate(appmenu_template);
Menu.setApplicationMenu(appmenu);

