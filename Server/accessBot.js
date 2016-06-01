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
        mongo.ose.connect(process.env.MONGODB_URI);                                   // connect to our database
        var Schema = mongo.ose.Schema; var ObjectId = Schema.ObjectId;
        mongo.member = mongo.ose.model('member', new Schema({                         // create user object property
            id: ObjectId,                                                             // unique id of document
            fullname: { type: String, required: '{PATH} is required', unique: true }, // full name of user
            cardID: { type: String, required: '{PATH} is required', unique: true },   // user card id
            accountType: {type: String},                                              // type of account, admin, mod, ect
            accesspoints: [String],                                                   // points of access member (door, machine, ect)
            months: {type: Number},                                                   // amount of time renewed in months
            lastRenewal: {type: Date, default: Date.now},                             // time of renewal
        }));
        mongo.bot = mongo.ose.model('bot', new Schema({
            id: ObjectId,
            machineID: {type: String, required: '{PATH} is required', unique: true},  // unique identifier of point of access
            botName: {type: String, required: '{PATH} is required', unique: true},    // human given name for point of access
            botType: {type: String, required: '{PATH} is required'},                  // type (door, tool, kegerator, ect)
        }));
    },
    auth: function(machine, card, successCallback, failCallback){                     // database calls to authenticate
        mongo.bot.findOne({machineID: machine}, function(error, realBot){             // one call for machine authenticity
            if(error){
                failCallback('finding bot:' + error);
            } else if(realBot){
                mongo.member.findOne({cardID: card}, function(err, member){            // one call for member authenticity
                    if(err){
                        failCallback('finding member:' + error);
                    } else if (member && member.accesspoints.indexOf(machine) > -1){   // TODO breakout in to seperate conditions
                                                                                       // TODO ^ to account for adding access points
                        if(expired.byMonths(member.lastRenewal, member.months)){       // account for possible expiration
                            failCallback('expired');                                   // TODO notify admin of expiration
                        } else {                                                       // TODO notify when expiration is close
                            successCallback(member);                                   // LET THEM IN!!!!
                        }
                    } else {                                                           // if no access or no access to specific machine
                        sockets.io.emit('register', {cardID: card, machine: machine}); // send socket emit to potential admin
                        failCallback('not a member');                                  // given them proper credentials to put in db
                    }
                });
            } else {
                sockets.io.emit('newbot', machine);                                    // signal an interface prompt for registering bots
                failCallback('not a bot');
            }
        });
    }
}

var expired = {                                         // determine member expirations
    byMonths: function(startTime, duration){
        var currentDate = new Date().getTime();         // current millis from 1970
        var startDate = new Date(startTime).getTime();  // registration time millis from 1970 TODO check professional way to address month figure
        var monthsElapsed = (currentDate - startDate) / 1000 / 60 / 60 / 60 / 24 / 30; // figure months elapsed
        console.log('duration:'+ duration + '-months elapsed:' + monthsElapsed);       // DEBUG TODO remove
        if(monthsElapsed > duration){
            return true;
        } else {return false;}
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

var routes = {                 // singlton for adressing express route request: depends on mongo
    wild: function(req, res){  // when random routes are called
        console.log('got request at' + req.url);
        res.status(404).send('this is not the bot you are looking for');
    },
    auth: function(req, res){
        mongo.auth( req.params.machine,                                            // pass machine information
                    req.params.card,                                               // pass card information
                    function(){res.status(200).send('Make!');},                    // success case callback
                    function(msg){res.status(403).send(msg);});                    // fail case callback (custom message reasons)
    },
    signup: function(req, res){                                           // default route
        res.sendFile(__dirname + "/views/register.html");                 // TODO: figure out {csrfToken: req.csrfToken()} w/out jade
    },
    register: function(req, res){                                         // registration post
        if(req.body.type === 'member'){                                   // given a member expect minimal critiria to save a new member
            if(req.body.cardID && req.body.machine && req.body.fullname && req.body.months && req.body.months < 12){
                var member = new mongo.member({                           // create a new member
                    fullname: req.body.fullname,
                    cardID: req.body.cardID,
                    acountType: req.body.accountType,
                    accesspoints: [req.body.machine],
                    months: req.body.months
                });
                member.save(function(error){                              // save method of member scheme: write to mongo!
                    if(error){res.send('fail:' + error);}
                    else{res.send('save success');}
                });
            } else { res.send("did it wrong, reload and try again");}
        } else if (req.body.type === 'bot'){
            if(req.body.machine && req.body.fullname && req.body.accountType){
                var bot = new mongo.bot({
                    machineID: req.body.machine,
                    botName: req.body.fullname,
                    botType: req.body.accountType
                });
                bot.save(function(err){
                    if(err){res.send('fail:' + err );}
                    else{res.send('save succes');}
                });
            } else { res.send("did it wrong, reload and try again");}
        }
    }
}

var cookie = {                                                      // Admin authentication / depends on client-sessions
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
        app.use(cookie.meWant());                            // support for cookies (admin auth)
        // app.use(require('csurf')());                         // Cross site request forgery tokens (admin auth)
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
