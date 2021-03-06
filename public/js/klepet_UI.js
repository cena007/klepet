function divElementEnostavniTekst(sporocilo) {
  var jeSmesko = sporocilo.indexOf('http://sandbox.lavbic.net/teaching/OIS/gradivo/') > -1;
  if (jeSmesko) {
    sporocilo = sporocilo.replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace('&lt;img', '<img').replace('png\' /&gt;', 'png\' />');
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  } else {
    return $('<div style="font-weight: bold;"></div>').text(sporocilo);
  }
}

function divElementHtmlTekst(sporocilo) {
  return $('<div></div>').html('<i>' + sporocilo + '</i>');
}

function procesirajVnosUporabnika(klepetApp, socket) {
  var sporocilo = $('#poslji-sporocilo').val();

  sporocilo = dodajSmeske(sporocilo);
  var sistemskoSporocilo;

  if (sporocilo.charAt(0) == '/') {
    sistemskoSporocilo = klepetApp.procesirajUkaz(sporocilo);
    if (sistemskoSporocilo) {
      $('#sporocila').append(divElementHtmlTekst(sistemskoSporocilo));
      
      poisciSlike(sporocilo);
      for (var i = 0; i < iZacetek.length && i < iKonec.length; i++) {
        var img = sporocilo.substring(iZacetek[i], iKonec[i]);
        $('#sporocila').append($('<div></div>').html('<img style="width:200px; padding-left:20px" src="' +img+ '">'));
      }
      iZacetek = [];
      iKonec = [];
      
      poisciVideo(sporocilo);
      for (var i = 0; i < iZacetekV.length; i++) {
        var vid = sporocilo.substring(iZacetekV[i], iKonecV[i]);
        $('#sporocila').append($('<div id="video"></div>').html('<iframe width="200px" height="150px" src="https://www.youtube.com/embed/' +vid+ '" allowfullscreen></iframe>'));
      }
      iZacetekV = [];
      iKonecV = [];
    }
  } else {
    sporocilo = filtirirajVulgarneBesede(sporocilo);
    klepetApp.posljiSporocilo(trenutniKanal, sporocilo);
    $('#sporocila').append(divElementEnostavniTekst(sporocilo));
    $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight'));
    
    poisciSlike(sporocilo);

    for (var i = 0; i < iZacetek.length && i < iKonec.length; i++) {
      var img = sporocilo.substring(iZacetek[i], iKonec[i]);
      $('#sporocila').append($('<div></div>').html('<img style="width:200px; padding-left:20px" src="' +img+ '">'));
    }
    iZacetek = [];
    iKonec = [];
    
    poisciVideo(sporocilo);
    for (var i = 0; i < iZacetekV.length; i++) {
      var vid = sporocilo.substring(iZacetekV[i], iKonecV[i]);
      $('#sporocila').append($('<div id="video"></div>').html('<iframe width="200px" height="150px" src="https://www.youtube.com/embed/' +vid+ '" allowfullscreen></iframe>'));
    }
    iZacetekV = [];
    iKonecV = [];
  }

  $('#poslji-sporocilo').val('');
}

var socket = io.connect();
var trenutniVzdevek = "", trenutniKanal = "";

var vulgarneBesede = [];
$.get('/swearWords.txt', function(podatki) {
  vulgarneBesede = podatki.split('\r\n');
});

function filtirirajVulgarneBesede(vhod) {
  for (var i in vulgarneBesede) {
    vhod = vhod.replace(new RegExp('\\b' + vulgarneBesede[i] + '\\b', 'gi'), function() {
      var zamenjava = "";
      for (var j=0; j < vulgarneBesede[i].length; j++)
        zamenjava = zamenjava + "*";
      return zamenjava;
    });
  }
  return vhod;
}

$(document).ready(function() {
  var klepetApp = new Klepet(socket);

  socket.on('vzdevekSpremembaOdgovor', function(rezultat) {
    var sporocilo;
    if (rezultat.uspesno) {
      trenutniVzdevek = rezultat.vzdevek;
      $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
      sporocilo = 'Prijavljen si kot ' + rezultat.vzdevek + '.';
    } else {
      sporocilo = rezultat.sporocilo;
    }
    $('#sporocila').append(divElementHtmlTekst(sporocilo));
  });

  socket.on('pridruzitevOdgovor', function(rezultat) {
    trenutniKanal = rezultat.kanal;
    $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
    $('#sporocila').append(divElementHtmlTekst('Sprememba kanala.'));
  });

  socket.on('sporocilo', function (sporocilo) {
    var novElement = divElementEnostavniTekst(sporocilo.besedilo);
    $('#sporocila').append(novElement);
    console.log("poslal sporocilo: " + sporocilo.besedilo);
    
    poisciSlike(sporocilo.besedilo);
    for (var i = 0; i < iZacetek.length && i < iKonec.length; i++) {
      var img = sporocilo.besedilo.substring(iZacetek[i], iKonec[i]);
      $('#sporocila').append($('<div></div>').html('<img style="width:200px; padding-left:20px" src="' +img+ '">'));
    }
    iZacetek = [];
    iKonec = [];
    
    poisciVideo(sporocilo.besedilo);
    for (var i = 0; i < iZacetekV.length; i++) {
      var vid = sporocilo.besedilo.substring(iZacetekV[i], iKonecV[i]);
      $('#sporocila').append($('<div id="video"></div>').html('<iframe width="200px" height="150px" src="https://www.youtube.com/embed/' +vid+ '" allowfullscreen></iframe>'));
    }
    iZacetekV = [];
    iKonecV = [];
    
  });
  
  socket.on('kanali', function(kanali) {
    $('#seznam-kanalov').empty();

    for(var kanal in kanali) {
      kanal = kanal.substring(1, kanal.length);
      if (kanal != '') {
        $('#seznam-kanalov').append(divElementEnostavniTekst(kanal));
      }
    }
    
  socket.on('dregljaj', function(dregljaj) {
    if(dregljaj.dregljaj){
      console.log("Dregljaj izvede: " + dregljaj.dregljaj);
      $('#vsebina').jrumble();
      $('#vsebina').trigger('startRumble');
      setTimeout(function(){ $('#vsebina').trigger('stopRumble'); }, 1500);
    }
  });

    $('#seznam-kanalov div').click(function() {
      klepetApp.procesirajUkaz('/pridruzitev ' + $(this).text());
      $('#poslji-sporocilo').focus();
    });
  });

  socket.on('uporabniki', function(uporabniki) {
    $('#seznam-uporabnikov').empty();
    for (var i=0; i < uporabniki.length; i++) {
      $('#seznam-uporabnikov').append(divElementEnostavniTekst(uporabniki[i]));
    }
    
    $('#seznam-uporabnikov div').click(function() {
       $('#poslji-sporocilo').val('/zasebno "' + $(this).text() + '" ');
       $('#poslji-sporocilo').focus();
    });
  });

  setInterval(function() {
    socket.emit('kanali');
    socket.emit('uporabniki', {kanal: trenutniKanal});
  }, 1000);

  $('#poslji-sporocilo').focus();

  $('#poslji-obrazec').submit(function() {
    procesirajVnosUporabnika(klepetApp, socket);
    return false;
  });
  
  
});

function dodajSmeske(vhodnoBesedilo) {
  var preslikovalnaTabela = {
    ";)": "wink.png",
    ":)": "smiley.png",
    "(y)": "like.png",
    ":*": "kiss.png",
    ":(": "sad.png"
  }
  for (var smesko in preslikovalnaTabela) {
    vhodnoBesedilo = vhodnoBesedilo.replace(smesko,
      "<img src='http://sandbox.lavbic.net/teaching/OIS/gradivo/" +
      preslikovalnaTabela[smesko] + "' />");
  }
  return vhodnoBesedilo;
}

var iZacetek = [];
var iKonec = [];

function poisciSlike(sporocilo){
  var countZacetek = 0;
  var countKonec = 0;
  
  for (var i = 0; i < sporocilo.length; i++) {
    var sub = sporocilo.substring(i);
    if(sub.startsWith("http://") || sub.startsWith("https://")){
      iZacetek[countZacetek] = i;
      countZacetek += 1;
    }
    if(sub.startsWith(".jpg") || sub.startsWith(".png") || sub.startsWith(".gif")){
      iKonec[countKonec] = i+4;
      countKonec += 1;
    }
  }
}

var iZacetekV = [];
var iKonecV = [];

function poisciVideo(sporocilo){
   var countZacetek = 0;
   var countKonec = 0;
   
   for (var i = 0; i < sporocilo.length; i++) {
     var sub = sporocilo.substring(i);
     if(sub.startsWith("https://www.youtube.com/watch?v=")){
       iZacetekV[countZacetek] = i+32;
       countZacetek += 1;
       
       for(var j = i; j < sporocilo.length; j++){
         if(sporocilo.charAt(j) == " "){
            iKonecV[countKonec] = j;
            countKonec += 1;
      }
    }
  }
}}