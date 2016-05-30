### Todo list

Save anything thing labled (optimization) for after MVP ~ minimal viable product

System design decisions:

- [ ] when or how machines will "close" access (suggestion: if member checks in, they are responsible to check out)
- [ ] What is most practical way to register users (suggestion: android app)
- [ ] what protocol should be ultimately used for Machine to Machine (mqtt, websockets, curl) (optimization)
- [ ] what database to ultimately use (mongo, mysql, ldap) (optimization)

Access point Firmware / Arduino code:

- [ ] Read wifi configuration from SPIFFS file (optimization)
- [ ] Read config for what server to talk to from SPIFFS file (optimization)
- [ ] Maybe read how long to be open for from file? Or from server response?
- [ ] bcrypt hash cardID? (is this possible on esp8266?)  
- [ ] test using websockets or mqtt for access point to access server communication (optimization)
- [ ] remove serial debuging messages (optimization)
- [ ] use setTimeout instead of delay (optimization) https://github.com/PaulBeaudet/ravebot2000/blob/master/timer.ino

Access Server code:

- [x] catch an access attempt
- [x] handle an access attepmt
- [x] schema for data storage
- [x] handle registration a card to the database
- [x] handle access attempt against database entry
- [ ] handle access attempt against hashed card ID (case of smartphones that data should be private to user in DB)
- [ ] handle admin access againts hashed password

Interface / Client side: ( cordova has an nfc plug-in that would make card registration much easier in future)

- [x] admin: add access
- [ ] admin: revoke access
- [ ] admin: show activity (optimization)
- [ ] put up an actual barier to admin page
- [ ] cordova admin app (optimization)

Physical Access point / Hardware:

- [ ] Update board to use better microUSB plug
- [ ] Maybe change LED header to one of the plugs used on the liquidpixels bezel cable, since those worked well.


---

### Basic Design (Backlog)

Idea is to have a system for access control that is affordable to deploy across entry ways and tooling systems (requiring training)

Plan to hit a design requirment MVP before getting too excited about specific tools, protocols, databases, ect.

First version will be no good, honestly there is some reinvention of the wheel going on here, anyhow. This is has been built before, open source with the exact same tool sets and equipment. This is for a makerspace, we will probably re-build this thing (software wise) 5 times just because we can. Everybody get their turn using their favorite tools if they have time. Right now we just need it to work ASAP 

Design requirments (minimal / highest priority features)

 - Card access to building
 - Power failure tolerant (up to 4 hours)
 - On site administration
 - automatic expiration and renewal facilities
 - simple registration/revoke process

Design suggestions

 - Card access to training required equipment
 - Extended power failure tolerance
 - Off site administration
 - access logs
 - nfc smartphone acccess
 - slack intergration
 - dedicated administration app (android: add cards/devices, recieve push updates)
 - Door greeter that shows membership status and renewal reminders

###MVP

just to get started!

- [x] node to esp communication is REST
- [ ] registration will be done by passing a socket event to admin client of an invalid nfc entry, admin will manually enter member data 
- [ ] members will be registered in mongo
- [ ] we will only install on one door
- [ ] server will be in the wild (heroku to test from home, raspi on-site when operational)
