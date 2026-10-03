/*
 * ============================================================================
 * SMART PHARMACY IoT SYSTEM - ESP32 FIRMWARE
 * ============================================================================
 * Board: ESP32 DevKit
 * 
 * Hardware Connections:
 * RC522 RFID Reader (SPI):
 *   - VCC  -> 3.3V (DO NOT USE 5V!)
 *   - GND  -> GND
 *   - RST  -> GPIO 22
 *   - SDA  -> GPIO 5  (SS)
 *   - MOSI -> GPIO 23
 *   - MISO -> GPIO 19
 *   - SCK  -> GPIO 18
 *   - IRQ  -> Not Connected
 * 
 * DHT22 Temperature & Humidity Sensor:
 *   - VCC (+) -> 3.3V
 *   - OUT     -> GPIO 27 (Internal pullup enabled)
 *   - GND (-) -> GND
 * 
 * Libraries:
 *   - MFRC522 by GithubCommunity
 *   - DHT sensor library by Adafruit
 *   - Adafruit Unified Sensor
 *   - ArduinoJson
 * ============================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <DHT.h>
#include <ArduinoJson.h>

// ----------------- CONFIGURATION -----------------
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// FastAPI Backend URL (Replace with your computer's LAN IP)
const char* SERVER_BASE_URL = "http://192.168.1.100:8000";

// ThingSpeak IoT Telemetry Configuration (Optional direct send)
const char* THINGSPEAK_API_KEY = "YOUR_THINGSPEAK_WRITE_KEY";
const bool  SEND_DIRECT_THINGSPEAK = false;

// ----------------- HARDWARE PINS -----------------
#define SS_PIN    5   // RC522 SDA / SS
#define RST_PIN   22  // RC522 RST
#define DHTPIN    27  // DHT22 Data Out
#define DHTTYPE   DHT22

#define STATUS_LED 2  // Onboard blue LED

// ----------------- OBJECT INITIALIZATION ---------
MFRC522 rfid(SS_PIN, RST_PIN);
DHT dht(DHTPIN, DHTTYPE);

// ----------------- TIMERS ------------------------
unsigned long lastSensorReadTime = 0;
const unsigned long SENSOR_INTERVAL = 10000; // Read DHT22 every 10 seconds
unsigned long lastWiFiCheckTime = 0;
const unsigned long WIFI_CHECK_INTERVAL = 10000;

// ----------------- HELPER FUNCTIONS --------------
void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.println("\n[WiFi] Connecting to network: " + String(WIFI_SSID));
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("[WiFi] Connected successfully!");
    Serial.print("[WiFi] ESP32 IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("[WiFi] Signal RSSI: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
    digitalWrite(STATUS_LED, HIGH);
  } else {
    Serial.println("[WiFi] Connection failed! Current Status code: " + String(WiFi.status()));
    digitalWrite(STATUS_LED, LOW);
  }
}

String formatUID(byte *buffer, byte bufferSize) {
  String uidStr = "";
  for (byte i = 0; i < bufferSize; i++) {
    if (buffer[i] < 0x10) uidStr += "0";
    uidStr += String(buffer[i], HEX);
    if (i < bufferSize - 1) uidStr += ":";
  }
  uidStr.toUpperCase();
  return uidStr;
}

void sendSensorData(float temp, float hum) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[Sensor] WiFi disconnected. Skipping upload.");
    return;
  }

  Serial.println("\n[DHT22] Reading -> Temp: " + String(temp, 1) + " C | Humidity: " + String(hum, 1) + " %");

  WiFiClient client;
  HTTPClient http;
  String url = String(SERVER_BASE_URL) + "/api/sensor";
  
  if (!http.begin(client, url)) {
    Serial.println("[HTTP] Unable to connect to host: " + url);
    return;
  }
  http.addHeader("Content-Type", "application/json");

  JsonDocument doc;
  doc["temperature"] = temp;
  doc["humidity"]    = hum;

  String requestBody;
  serializeJson(doc, requestBody);

  int httpCode = http.POST(requestBody);

  if (httpCode == 200) {
    Serial.println("[HTTP 200] >> Sensor telemetry synced to Dashboard & PostgreSQL!");
  } else {
    Serial.print("[HTTP ERROR] Sensor upload status code: ");
    Serial.println(httpCode > 0 ? String(httpCode) : http.errorToString(httpCode));
  }
  http.end();

  if (SEND_DIRECT_THINGSPEAK && String(THINGSPEAK_API_KEY) != "YOUR_THINGSPEAK_WRITE_KEY") {
    WiFiClient tsClient;
    HTTPClient tsHttp;
    String tsUrl = "http://api.thingspeak.com/update?api_key=" + String(THINGSPEAK_API_KEY) +
                   "&field1=" + String(temp, 1) + "&field2=" + String(hum, 1);
    if (tsHttp.begin(tsClient, tsUrl)) {
      tsHttp.GET();
      tsHttp.end();
    }
  }
}

void sendRFIDScan(String uid) {
  Serial.println("\n==================================");
  Serial.println("[RFID] TAG DETECTED: " + uid);
  Serial.println("[RFID] Contacting FastAPI server...");

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[RFID ERROR] WiFi disconnected. Cannot record scan.");
    return;
  }

  // Quick blink for scan feedback
  digitalWrite(STATUS_LED, LOW);
  delay(100);
  digitalWrite(STATUS_LED, HIGH);

  WiFiClient client;
  HTTPClient http;
  String url = String(SERVER_BASE_URL) + "/api/rfid/scan";
  
  if (!http.begin(client, url)) {
    Serial.println("[HTTP] Failed to initiate connection to: " + url);
    return;
  }
  http.addHeader("Content-Type", "application/json");

  JsonDocument doc;
  doc["uid"] = uid;

  String requestBody;
  serializeJson(doc, requestBody);

  int httpCode = http.POST(requestBody);

  if (httpCode == 200) {
    String response = http.getString();
    JsonDocument respDoc;
    DeserializationError error = deserializeJson(respDoc, response);

    if (!error) {
      bool success = respDoc["success"] | false;
      const char* msg = respDoc["message"] | "";

      if (success) {
        Serial.println("\n[SERVER RESPONSE] SALE PROCESSED!");
        Serial.print("Medicine:  ");
        Serial.println(respDoc["medicine"].as<const char*>());
        Serial.print("Batch:     ");
        Serial.println(respDoc["batch"].as<const char*>());
        Serial.print("Remaining: ");
        Serial.println(respDoc["remaining_quantity"].as<int>());
        Serial.println("==================================\n");
      } else {
        if (strcmp(msg, "Unknown RFID tag") == 0) {
          Serial.println("\n[SERVER RESPONSE] UNKNOWN RFID TAG (Assign it first in Dashboard)\n");
        } else if (strcmp(msg, "Medicine out of stock") == 0) {
          Serial.println("\n[SERVER RESPONSE] OUT OF STOCK\n");
        } else {
          Serial.print("\n[SERVER RESPONSE] SCAN REJECTED: ");
          Serial.println(msg);
          Serial.println();
        }
      }
    }
  } else if (httpCode > 0) {
    Serial.print("[HTTP ERROR] Server returned code: ");
    Serial.println(httpCode);
  } else {
    Serial.print("[HTTP ERROR] Connection failed: ");
    Serial.println(http.errorToString(httpCode).c_str());
  }

  http.end();
}

// ----------------- SETUP -------------------------
void setup() {
  Serial.begin(115200);
  delay(1000);

  pinMode(STATUS_LED, OUTPUT);
  digitalWrite(STATUS_LED, LOW);

  Serial.println("\n========================================");
  Serial.println("   SMART PHARMACY IoT SYSTEM - ESP32   ");
  Serial.println("========================================\n");

  // 1. Connect WiFi
  connectWiFi();

  // 2. Initialize DHT22 with internal pullup enabled on GPIO 27
  pinMode(DHTPIN, INPUT_PULLUP);
  dht.begin();
  delay(1000);

  // 3. Test DHT sensor read
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  if (!isnan(t) && !isnan(h)) {
    Serial.println("[DHT22] Initial read successful: " + String(t, 1) + " C, " + String(h, 1) + " %");
    sendSensorData(t, h); // Immediately push initial telemetry on boot
  } else {
    Serial.println("[DHT22 WARNING] Sensor returned NaN. Check GPIO 27 wiring and 3.3V power.");
    // Send a boot handshake to FastAPI anyway to verify network reachability
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("[BOOT] Sending initial baseline test to verify FastAPI server connection...");
      sendSensorData(25.0, 50.0);
    }
  }

  // 4. Initialize RC522 SPI
  SPI.begin(18, 19, 23, 5); // SCK, MISO, MOSI, SS
  rfid.PCD_Init();
  delay(100);

  Serial.println("\n[RC522] RFID Reader initialized on GPIO 5 (SS) / 22 (RST).");
  Serial.println("[STATUS] System is ready and listening for RFID taps...\n");
}

// ----------------- MAIN LOOP ---------------------
void loop() {
  unsigned long currentMillis = millis();

  // 1. WiFi Connection Monitor
  if (currentMillis - lastWiFiCheckTime >= WIFI_CHECK_INTERVAL) {
    lastWiFiCheckTime = currentMillis;
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("[WiFi] Lost connection! Reconnecting...");
      connectWiFi();
    }
  }

  // 2. Read Climate Sensors every 10s
  if (currentMillis - lastSensorReadTime >= SENSOR_INTERVAL) {
    lastSensorReadTime = currentMillis;

    float temperature = dht.readTemperature();
    float humidity    = dht.readHumidity();

    if (!isnan(temperature) && !isnan(humidity)) {
      sendSensorData(temperature, humidity);
    } else {
      Serial.println("[DHT22 WARNING] Reading failed (NaN). Check GPIO 27 connection.");
    }
  }

  // 3. Check for RFID Card Tap
  if (!rfid.PICC_IsNewCardPresent()) {
    delay(50);
    return;
  }

  if (!rfid.PICC_ReadCardSerial()) {
    delay(50);
    return;
  }

  String uid = formatUID(rfid.uid.uidByte, rfid.uid.size);
  sendRFIDScan(uid);

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();

  delay(1500); // Debounce delay
}
