// register.js ~ Copyright 2016 Manchester Makerspace ~ License MIT

var sock = {                                        // Handle socket.io connection events
    et: io(),                                       // start socket.io listener
    cards: 1,                                       // number unidentified cards swiped this session
    init: function(){                               // allow chat and go when we have a name
        sock.et.on('register', sock.passCreds);     // recieves real time chat information
    },
    passCreds: function(data){
        $('input[name="cardID"]').val(data.cardID);                  // fill cardID to submit
        $('input[name="machine"]').val(data.machine);                // fill machine value to submit TODO show which machine
        $('#cardIndicator').text("unregistered card " + sock.cards); // indicated ready for submission
        sock.cards++;                                                // to see and new unidentified card has swiped
    }
}


$(document).ready(sock.init);
