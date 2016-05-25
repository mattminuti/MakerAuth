var express = require('express');
var app = express();


// respond with "hello world" when a GET request is made to the homepage
/*
app.get('/', function(req, res) {
  console.log('sending hello world');
  res.send('hello world');
});
*/


/*
 * General URL structure:
 * /machineid/card [?supervising=]
 *
 * machineid is the esp8266 unique serial number associated with the machine in the database
 *  this is stored so we can perform access control on each piece of equipment
 *  basically ends up being a query like

 SELECT authorized FROM machinetable NATURAL JOIN cards where cardid = thiscardid;

 and in the case of supervising, it's the same thing, but looking for full auth.

table machines:
machineID | userID | authorized

table cards:
userID | cardID

 * 
 */
app.get('/:machine/:card', function (req, res) {
  var machineID = req.params.machine,
      cardID = req.params.card,
      opts = req.query;
  console.log('machineID: '+machineID);
  console.log('cardID: '+cardID);
  console.log('supervising: '+ opts.supervising);

  //TODO
  //here's where we should be asking the server instead of hardcoded stuff. 

  //if(result == 'ok')
  if(cardID == '955CA009'){
    //go for it!
    res.status(200).send('Make!');
    console.log('sending make');
  } 
  else if(cardID == '2E583200'){
    //alright, you can, but i'll need your supervisor first.
    res.status(200).send('Supervisor');
    console.log('sending supervisor');
  }
  else {
    res.status(403).send('No go, bro.');
  }

});


app.get('/*', function(req, res) {
  console.log('got request at' + req.url);
  res.status(404).send('fallback!');
});


app.listen(3000, function () {
  console.log('Makerspace Auth Server listening on port 3000');
});
