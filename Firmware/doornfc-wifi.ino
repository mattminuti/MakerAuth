/*
 * NFC-controlled door lock
 * Reads card, then visits server 
 */

#include <SPI.h>
#include <MFRC522.h>
#include <ESP8266WiFi.h>
#include <ESP8266WiFiMulti.h>
#include <ESP8266HTTPClient.h>
#include <Adafruit_NeoPixel.h>

#define RST_PIN                 5
#define SS_PIN                  4
#define RELAY_PIN               16
#define PIXEL_PIN               0
#define UNLOCK_TIME_SECONDS     6
#define DEBUG_MODE


const char* AuthServer = "http://manchmakerspace.herokuapp.com";
IPAddress dns(8, 8, 8, 8);
const bool ImmaDoor = 1;
const bool ImmaMachine = 0;
const char* WifiName = "mywifi";
const char* WifiPassword = "wifipassword";
//String WifiName, WifiPassword;


ESP8266WiFiMulti WiFiMulti; //Wifi handler object


//Initialize neopixel strip for status indication
//Using 3 pixels just because it matches a board I already have.
Adafruit_NeoPixel strip = Adafruit_NeoPixel(3, PIXEL_PIN, NEO_GRB + NEO_KHZ400);
void dump_byte_array(byte *buffer, byte bufferSize);
void colorWipe(uint32_t c, uint8_t wait);
void error_blink();

//NFC Stuff
MFRC522 mfrc522(SS_PIN, RST_PIN); //initialize NFC reader
constexpr char hexmap[] = {'0', '1', '2', '3', '4', '5', '6', '7',
                           '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'};
String lastreadcard;
bool supervising = false;
bool machinePoweredUp = false;
bool wificonnected = false;
unsigned long chipId;

void setup() {
  //Set relay as an output right away.
  pinMode(RELAY_PIN, OUTPUT);
  //Set up serial connection to computer for debug.
  Serial.begin(115200);

// TODO: make the board read wifi configuration from a file in the
//       onboard flash file system instead of hardcoding it above.
//       Will make for user-doable in-field config changes
//          (via serial of course).
//  //mount the SPIFFS file system
//  if(SPIFFS.begin()){
//    File f = SPIFFS.open("/wifi.txt", "r");
//    if(!f) {
//      Serial.println("File not found!");
//    }
//    //read line by line
//    String WifiName = f.readStringUntil('\n');
//    String WifiPassword = f.readStringUntil('\n');
//    f.close();
//  }
  
  

#ifdef DEBUG_MODE
    Serial.print(F("Connecting to "));
    Serial.print(WifiName);
    Serial.print(F(" : "));
    Serial.println(WifiPassword);
#endif
  //Connect to the wifi network
  WiFiMulti.addAP(WifiName, WifiPassword);


  //wait a second for connection to be established
  //delay(1000);

  strip.begin(); //init LEDs
  strip.show(); //LEDs off
  colorWipe(strip.Color(0, 0, 0), 50);  // Extra Off just to be sure.
  

  //Load the chip's serial number, so we can identify which controlpad this is.
  chipId = ESP.getChipId();
  Serial.println(chipId);
  
  SPI.begin();      // Init SPI bus
  mfrc522.PCD_Init();   // Init MFRC522
  mfrc522.PCD_DumpVersionToSerial();  // Show details of PCD - MFRC522 Card Reader details
  Serial.println(F("Scan PICC to see UID, type, and data blocks..."));
}  //end setup()



void loop() {

  // wait for WiFi connection. Can't do much without it!
  if((WiFiMulti.run() == WL_CONNECTED)) {
    if(wificonnected == false){
      wificonnected = true;
      Serial.println("WiFi now connected.");
    }
    HTTPClient http;
  
    // Look for new cards
    if ( ! mfrc522.PICC_IsNewCardPresent()) {
      return;
    }

    // Select one of the cards, if multiple are present.
    if ( ! mfrc522.PICC_ReadCardSerial()) {
      return;
    }

    // Dump debug info about the card;
    // mfrc522.PICC_DumpToSerial(&(mfrc522.uid));
    Serial.print(F("Read card:"));
    dump_byte_array(mfrc522.uid.uidByte, mfrc522.uid.size);
    Serial.println();

    //Getting the ASCII representation of the card's hex UID.
    String cardId = "";
    for(int i=0;i<mfrc522.uid.size;++i){
      cardId += hexmap[(mfrc522.uid.uidByte[i] & 0xF0) >> 4];
      cardId += hexmap[mfrc522.uid.uidByte[i] & 0x0F];
    }

    String requestUrl = "/";
    requestUrl += chipId;
    requestUrl += "/card=";
    requestUrl += cardId;

    //Check to see if this user is supervising the last user, and if so, modify the URL to track that accordingly.
    if(supervising == true){
      requestUrl += "&super=";
      requestUrl += lastreadcard;
    }

    
#ifdef DEBUG_MODE
    Serial.print(F("Going to connect to http://"));
    Serial.print(AuthServer);
    Serial.println(requestUrl);
#endif
    //http.begin(AuthServer, 443, requestUrl, true, "7a 9c f4 db 40 d3 62 5a 6e 21 bc 5c cc 66 c8 3e a1 45 59 38"); //HTTPS
    http.begin(AuthServer, 3000, requestUrl); //HTTP
  
    // start connection and send HTTP header
    int httpCode = http.GET();
    if(httpCode) {
#ifdef DEBUG_MODE
      // HTTP header has been send and Server response header has been handled
      //Serial.printf("[HTTP] GET... code: %d\n", httpCode);
      Serial.print(F("[HTTP] GET... code: "));
      Serial.println(httpCode);
#endif
      // got response from server
      //responses are make, supervisor, and denied.
      if(httpCode == 200) {
        String payload = http.getString();
        Serial.println(payload);
        if(payload == "supervisor"){
          //umm i'll need to check with someone i trust first
          supervising = true;
          lastreadcard = cardId;
          //Light up to indicate that i'm expecting a supervisory card read.
          colorWipe(strip.Color(0, 0, 255), 50);  // Blue
          //and delay a bit to give opportunity to put the new card in place.
          delay(1000);
        }
        else if(payload == "Make!"){
          //okey-dokey, have fun and make something!
          if(ImmaDoor){
            //unlock the door for some number of seconds, then lock it.
            colorWipe(strip.Color(0, 255, 0), 50);  // Green
            digitalWrite(RELAY_PIN, HIGH);
            delay(UNLOCK_TIME_SECONDS*1000);
            digitalWrite(RELAY_PIN, LOW);
            colorWipe(strip.Color(0, 0, 0), 50);  // Off
          }
          else if(ImmaMachine){
            if(machinePoweredUp == false){
              //power up the machine
              colorWipe(strip.Color(0, 255, 0), 50);  // Green
              digitalWrite(RELAY_PIN, HIGH);
              //now delay for a while so that we don't spam the relays
              delay(10000); //10 seconds sounds about right.
            }
            else if(machinePoweredUp == true){
              //shutdown -h now
              colorWipe(strip.Color(0, 0, 0), 50);  // Off
              digitalWrite(RELAY_PIN, LOW);
            }
          }
          else { //got "Make!" but i'm not a door or machine.
            //uhhh i'll just ignore that...
          }
        }
        else { //got a payload that's not one of the others.
          //show error
          Serial.println("Got unexpected payload.");
          error_blink();
        }
      }
      else if(httpCode == 404){
        //404 not found! onoz!
        Serial.println("Got 404 not found!");
        error_blink();
      }
      else {
        //got something else entirely
        Serial.println("Got something icky!");
        error_blink();
      }
    }
    else {
      Serial.print(F("[HTTP] GET... failed, no connection or no HTTP server\n"));
    }
  }
  else {
    Serial.println(F("WiFi not connected, retrying in 10 seconds."));
    delay(10000);
    wificonnected = false;
  }
}


/**
 * Helper routine to dump a byte array as hex values to Serial.
 */
void dump_byte_array(byte *buffer, byte bufferSize) {
    for (byte i = 0; i < bufferSize; i++) {
        Serial.print(buffer[i] < 0x10 ? " 0" : " ");
        Serial.print(buffer[i], HEX);
    }
}


//Fun color helper functions follow.

// Fill the dots one after the other with a color
void colorWipe(uint32_t c, uint8_t wait) {
  for(uint16_t i=0; i<strip.numPixels(); i++) {
    strip.setPixelColor(i, c);
    strip.show();
    delay(wait);
  }
}


//red light blink for error, discarding supervisory stuff.
void error_blink(){
  supervising = false;
  for(int i=0; i<5;i++){
    colorWipe(strip.Color(255, 0, 0), 50);  // Red
    delay(100);
    colorWipe(strip.Color(0, 0, 0), 50);  // Off
    delay(100);
  }
}

// Input a value 0 to 255 to get a color value.
// The colours are a transition r - g - b - back to r.
uint32_t Wheel(byte WheelPos) {
  WheelPos = 255 - WheelPos;
  if(WheelPos < 85) {
    return strip.Color(255 - WheelPos * 3, 0, WheelPos * 3);
  }
  if(WheelPos < 170) {
    WheelPos -= 85;
    return strip.Color(0, WheelPos * 3, 255 - WheelPos * 3);
  }
  WheelPos -= 170;
  return strip.Color(WheelPos * 3, 255 - WheelPos * 3, 0);
}



// Slightly different, this makes the rainbow equally distributed throughout
void rainbowCycle(uint8_t wait) {
  uint16_t i, j;

  for(j=0; j<256*5; j++) { // 5 cycles of all colors on wheel
    for(i=0; i< strip.numPixels(); i++) {
      strip.setPixelColor(i, Wheel(((i * 256 / strip.numPixels()) + j) & 255));
    }
    strip.show();
    delay(wait);
  }
}





