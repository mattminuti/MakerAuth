### Todo list

Arduino code:

-   [ ] Read wifi configuration from SPIFFS file
-   [ ] Read config for what server to talk to from SPIFFS file
-   [ ] Maybe read how long to be open for from file? Or from server response?

Server code:

- [x] catch an access attempt
- [ ] handle an access attepmt (server gives esp signal to fire latch, was this done with res.send()?)  
- [ ] schema for data storage
- [ ] handle registration a card to the database
- [ ] handle access attempt against database entry

Client side: ( think mobile first, cordova has an nfc plug-in that would make card registration much easier, long run)

- [ ] manual admin regerstration page (revoke/add access)
- [ ] admin dashboard (show activity: low priority )
- [ ] easy regerstration page (low priority)

Hardware:

-  [ ] Update board to use better microUSB plug
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