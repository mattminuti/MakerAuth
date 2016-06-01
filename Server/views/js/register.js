// register.js ~ Copyright 2016 Manchester Makerspace ~ License MIT

var sock = {                                                   // Handle socket.io connection events
    et: io(),                                                  // start socket.io listener
    cards: 1,                                                  // number unidentified cards swiped this session
    init: function(){                                          // allow chat and go when we have a name
        sock.et.on('register', sock.passCreds);                // recieves real time chat information
        sock.et.on('newbot', sock.newbot);                     // handles registering new accesspoints
    },
    passCreds: function(data){
        $('#monthsField').show();                              // be sure monthsField is showing
        $('input[name="type"]').val('member');                 // indicate this is a different type of form
        $('input[name="cardID"]').val(data.cardID);            // fill cardID to submit
        $('input[name="machine"]').val(data.machine);          // fill machine value to submit TODO show which machine
        // $('#indicator').text("Register Member:" + sock.cards); // indicated ready for submission
        $('#indicator').text("Register Member:" + data.cardID);// indicated ready for submission
        $('#nameField').text("Fullname");
        $('#accountField').text('Member type');
        sock.cards++;                                          // to see and new unidentified card has swiped
    },
    newbot: function(machineID){
        $('#monthsField').hide();                              // hide months feild
        $('input[name="type"]').val('bot');                    // indicate this is a different type of form
        $('input[name="machine"]').val(machineID);             // fill machine value to submit TODO name machine
        $('#indicator').text("Register bot:" + machineID);     // indicated ready for submission
        $('#nameField').text("Name: point of access");
        $('#accountField').text("Type: point of access");
    }
}


$(document).ready(sock.init);
