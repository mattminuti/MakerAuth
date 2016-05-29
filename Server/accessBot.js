// accessBot.js ~ Copyright 2016 Manchester Makerspace ~ License MIT
/*
 * General URL structure:
 * /machineid/card [?supervising=]
 * machineid is the esp8266 unique serial number associated with the machine in database
 *  this is stored so we can perform access control on each piece of equipment
 */
 
var mongo = { // depends on: mongoose
    ose: require('mongoose'),
    init: function(){
        mongo.ose.connect(process.env.MONGODB_URI);                                  // connect to our database
        var Schema = mongo.ose.Schema; var ObjectId = Schema.ObjectId;
        mongo.member = mongo.ose.model('member', new Schema({                         // create user object property
            id: ObjectId,                                                             // unique id of document
            fullname: { type: String, required: '{PATH} is required', unique: true }, // full name of user
            cardID: { type: String, required: '{PATH} is required', unique: true },   // user card id
            accountType: {type: String},                                              // type of account, admin, mod, ect
            accesspoints: [String],                                                   // points of access member (door, machine, ect)
        }));
    }
}

var sockets = {
    io: require('socket.io'),
    listen: function(server){
        sockets.io = sockets.io(server);
        sockets.io.on('connection', function(socket){
            console.log(socket.id + " connected");
        });
    }
}

var routes = {                 // singlton for adressing express route request: depends on mongo and sockets 
    wild: function(req, res){  // when random routes are called
        console.log('got request at' + req.url);
        res.status(404).send('this is not the bot you are looking for');
    },
    testAuth: function(req, res){  // when two params are provided in route /:machine/:card]
        if(req.params.card === process.env.TESTUSER){
            console.log("Member trying to access " + req.params.machine);
            res.status(200).send("Make!");
        }
        else if(req.params.card === process.env.LESSERUSER){
            console.log("less privilaged trying to access " + req.params.machine);
            res.status(200).send('Supervisor');
        } else {                                                                    // request authentication rights case
            console.log('No go, bro! Get of my lawn');
            res.status(403).send('No go, bro.');
        }
    },
    auth: function(req, res){
        mongo.member.findOne({cardID: req.params.card}, function(err, member){     // search for this card in db, when found...
            if(member){                                                            // given this card holder is a registered member
                var privilaged = member.accesspoints.indexof(req.prams.machine);   // is this machine in privilage list
                if(privilaged > -1){ res.status(200).send("Make!");}               // yes: grant access
                else {res.status(200).send("rejected");}                           // no:  reject access
            } else {                                                               // No member found case, assume registerering
                sockets.io.emit('register', { cardID: req.params.card,             // send socket emit to potential admin
                                              machine: req.params.machine});       // given them proper credentials to put in db
                res.status(403).send("try again once registered");                 // send potentially temp rejection
            }
        });
    },
    signup: function(req, res){            // default route
        res.sendFile(__dirname + "/views/register.html");     // TODO: figure out {csrfToken: req.csrfToken()} w/out jade
    },
    register: function(req, res){                                     // registration post
        if(req.body.cardID && req.body.machine && req.body.fullname){ // expect minimal critiria to save a new member
            var member = new mongo.member({                           // create a new member
                fullname: req.body.fullname,
                cardID: req.body.cardID,
                acountType: req.body.accountType,
                accesspoints: [req.body.machine]
            });
            member.save(function(error){                              // save method of member scheme: write to mongo!
                if(error){res.send('member failed to save');}
                else{res.send('save success');}
            });
        } else {
            res.send("you did it wrong, reload and try again");
        }
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
        // app.use(require('csurf')());                         // Cross site request forgery tokens
        app.use(serve.express.static(__dirname + '/views')); // serve page dependancies (sockets, jquery, bootstrap)
        var router = serve.express.Router();                 // create express router object to add routing events to
        router.get('/', routes.signup);                      // registration page
        router.post('/', routes.register);                   // registration action
        router.get('/:machine/:card', routes.auth);          // authentication route
        router.get('/*', routes.wild);                       // catches malformed request and logs them
        app.use(router);                                     // get express to user the routes we set
        sockets.listen(http);                                // listen and handle socket connections
        http.listen(process.env.PORT);                       // listen on specified PORT enviornment variable
    }
}

mongo.init();    // conect to our mongo server
serve.theSite(); // Initiate site!
