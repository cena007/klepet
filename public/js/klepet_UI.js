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
    }
  } else {
    sporocilo = filtirirajVulgarneBesede(sporocilo);
    klepetApp.posljiSporocilo(trenutniKanal, sporocilo);
    $('#sporocila').append(divElementEnostavniTekst(sporocilo));
    $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight'));
    
    poisciSlike(sporocilo);
    
    for (var i = 0; i < iZacetek.length; i++) {
      var img = sporocilo.substring(iZacetek[i], iKonec[i]);
      console.log(iZacetek[i] + " | " + iKonec[i] + " | " + iZacetek.length);
      console.log("<img style='with=200px; border=20px' src='" +img+ "'>");
      $('#sporocila').append($('<div></div>').html('<img style="width:200px; padding-left:20px" src="' +img+ '">'));
    }
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
  });
  
  socket.on('kanali', function(kanali) {
    $('#seznam-kanalov').empty();

    for(var kanal in kanali) {
      kanal = kanal.substring(1, kanal.length);
      if (kanal != '') {
        $('#seznam-kanalov').append(divElementEnostavniTekst(kanal));
      }
    }

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
  console.log("function; " +sporocilo);
  console.log("length; " +sporocilo.length);
  for (var i = 0; i < sporocilo.length; i++) {
    
    //// Poisce zacetek: https:// oz http://
    if(sporocilo.charAt(i) == "h"){
      if(sporocilo.charAt(i+1) == "t"){
        if(sporocilo.charAt(i+2) == "t"){
          if(sporocilo.charAt(i+3) == "p"){
            
            if(sporocilo.charAt(i+4) == "s"){
              if(sporocilo.charAt(i+5) == ":"){
                if(sporocilo.charAt(i+6) == "/"){
                  if(sporocilo.charAt(i+7) == "/"){
                    iZacetek[countZacetek] = i;
                    countZacetek += 1;
                    
                    console.log("najdu https:// na " + i);
                  }
                }
              }
            }
            if(sporocilo.charAt(i+4) == ":"){
              if(sporocilo.charAt(i+5) == "/"){
                if(sporocilo.charAt(i+6) == "/"){
                  iZacetek[countZacetek] = i;
                  countZacetek += 1;
                  console.log("countZacetek" + countZacetek);
                  console.log("najdu http:// na " + i);
                }
              }
            }
          }
        }
      }
    }
    
    //// Poisci konec: .jpg oz .png oz .gif
    if(sporocilo.charAt(i) == "."){
      if(sporocilo.charAt(i+1) == "j"){
        if(sporocilo.charAt(i+2) == "p"){
          if(sporocilo.charAt(i+3) == "g"){
            //to do
            iKonec[countKonec] = i+4;
            countKonec += 1;
             
            console.log("najdu .jpg na " + i);
          }
        }
      }
    }
    
    if(sporocilo.charAt(i) == "."){
      if(sporocilo.charAt(i+1) == "p"){
        if(sporocilo.charAt(i+2) == "n"){
          if(sporocilo.charAt(i+3) == "g"){
            //to do
            iKonec[countKonec] = i+4;
            countKonec += 1;
            
            console.log("najdu .png na " + i);
          }
        }
      }
    }
    
    if(sporocilo.charAt(i) == "."){
      if(sporocilo.charAt(i+1) == "g"){
        if(sporocilo.charAt(i+2) == "i"){
          if(sporocilo.charAt(i+3) == "f"){
            //to do
            iKonec[countKonec] = i+4;
            countKonec += 1;
            
            console.log("najdu .gif na " + i);
          }
        }
      }
    }
  }
}