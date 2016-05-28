// accessBot.js ~ Copyright 2016 Manchester Makerspace ~ License MIT
/*
 * General URL structure:
 * /machineid/card [?supervising=]
 * machineid is the esp8266 unique serial number associated with the machine in the database
 *  this is stored so we can perform access control on each piece of equipment
 *  basically ends up being a query like
 * SELECT authorized FROM machinetable NATURAL JOIN cards where cardid = thiscardid;
 * and in the case of supervising, it's the same thing, but looking for full auth.
 * table machines:
 * machineID | userID | authorized
 * table cards:
 * userID | cardID
 * ^ Mysql suggestion, Paul knows mongo, mongo is not perfect, it is good enough
 * we will use mongo unless someone makes a pull request before Paul  :-) 
 */
 
var mongo = { // depends on: mongoose
    ose: require('mongoose'),
    init: function(){
        mongo.ose.connect(process.env.MONGODB_URI);                                  // connect to our database
        var Schema = mongo.ose.Schema; var ObjectId = Schema.ObjectId;
        mongo.member = mongo.ose.model('member', new Schema({                         // create user object property
            id: ObjectId,                                                             // unique id of document
            fullname: { type: String, required: '{PATH} is required', unique: true }, // full name of user
            cardID: { type: String, required: '{PATH} is required' },                 // user card id
            accountType: {type: String},                                              // type of account, admin, mod, ect
            accesspoints: [String],                                                   // points of access member (door, machine, ect)
        }));
    }
}

var routes = { // singlton for adressing express route request
    wild: function(req, res){  // when random routes are called
        console.log('got request at' + req.url);
        res.status(404).send('this is not the bot you are looking for');
    },
    auth: function(req, res){  // when two params are provided in route /:machine/:card
        // opts = req.query <- from original code: what options should we expect?
        if(req.params.card === process.env.TESTUSER){
            console.log("Member trying to access " + req.params.machine);
            res.status(200).send("Make!");
        }
        else if(req.params.card === process.env.LESSERUSER){
            console.log("less privilaged trying to access " + req.params.machine);
            res.status(200).send('Supervisor');
        } else {
            console.log('No go, bro! Get of my lawn');
            res.status(403).send('No go, bro.');
        }
    },
    admin: function(req, res){    // when '/admin' is called
        res.send('admin will use this page to register users');
        // response page will have a socket lister on it that we ping on "no go cases" for that credential to be registered
    },
    register: function(req, res){ // default route
        res.send('members will register their cards here')
    }
}

var cookie = {                                                      // depends on client-sessions
    session: require('client-sessions'),                            // mozilla's cookie library
    ingredients: {                                                  // personally I prefer chocolate chips
        cookieName: 'session',                                      // guess we could call this something different
        secret: process.env.SESSION_SECRET,                         // do not track secret in version control
        duration: 365 * 24 * 60 * 60 * 1000,                        // cookie times out in x amount of time
    },
    meWant: function(){return cookie.session(cookie.ingredients);}, // nom nom nom!
    decode: function(content){return cookie.session.util.decode(cookie.ingredients, content);},
}


var serve = {                                                // singlton for server setup
    express: require('express'),                             // server framework library 
    parse: require('body-parser'),                           // JSON parsing library
    theSite: function (){                                    // methode call to serve site
        var app = serve.express();                           // create famework object
        var http = require('http').Server(app);              // http server for express framework
        app.use(require('compression')());                   // gzipping for requested pages
        app.use(serve.parse.json());                         // support JSON-encoded bodies
        app.use(serve.parse.urlencoded({extended: true}));   // support URL-encoded bodies
        app.use(cookie.meWant());                            // support for cookies
        app.use(require('csurf')());                         // Cross site request forgery tokens
        app.use(serve.express.static(__dirname + '/views')); // serve page dependancies (sockets, jquery, bootstrap)
        var router = serve.express.Router();                 // create express router object to add routing events to
        router.get('/', routes.register);                    // registration route
        router.get('/admin', routes.admin);                  // web page control for adminstrative functions
        router.get('/:machine/:card', routes.auth);          // authentication route
        router.get('/*', routes.wild);                       // catches malformed request and logs them
        app.use(router);                                     // get express to user the routes we set
        http.listen(process.env.PORT);                       // listen on specified PORT enviornment variable
    }
}

//mongo.init();    // conect to our mongo server
serve.theSite(); // Initiate site!
