import json
import logging
import threading
from typing import Any
import paho.mqtt.client as mqtt
from backend.config import settings
from backend.database.connection import SessionLocal
from backend.database.repositories import DeviceRepository
from backend.domain.models import EdgeDeviceModel

logger = logging.getLogger("aios.mqtt")

class MqttTelemetryClient:
    """
    Subscribes to edge fleet channels (Jetson, Pi, drones) to retrieve 
    real-time system status indicators and save telemetry updates.
    """
    def __init__(self):
        self.client = mqtt.Client()
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.thread = None

    def on_connect(self, client, userdata, flags, rc):
        logger.info(f"MQTT Connected with result code {rc}")
        # Subscribe to all edge devices telemetry channel
        self.client.subscribe(f"{settings.MQTT_TOPIC_PREFIX}/+/telemetry")

    def on_message(self, client, userdata, msg):
        try:
            payload = json.loads(msg.payload.decode("utf-8"))
            device_id = msg.topic.split("/")[-2]
            
            # Update device metrics database state
            db = SessionLocal()
            try:
                repo = DeviceRepository(db)
                device = repo.get_by_id(device_id)
                if device:
                    device.cpu = payload.get("cpu", device.cpu)
                    device.ram = payload.get("ram", device.ram)
                    device.battery = payload.get("battery", device.battery)
                    device.storage = payload.get("storage", device.storage)
                    device.temperature = payload.get("temperature", device.temperature)
                    device.status = "Online"
                    device.last_seen = datetime.datetime.utcnow()
                    repo.update(device)
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Failed to process MQTT message payload: {str(e)}")

    def start(self):
        """Starts the MQTT listener in a background worker thread."""
        try:
            self.client.connect(settings.MQTT_BROKER, settings.MQTT_PORT, 60)
            self.thread = threading.Thread(target=self.client.loop_forever, daemon=True)
            self.thread.start()
            logger.info("MQTT Client background listener active.")
        except Exception as e:
            logger.warning(f"Could not connect to MQTT Broker at {settings.MQTT_BROKER}:{settings.MQTT_PORT}. Core edge telemetry offline. Reason: {str(e)}")

mqtt_client = MqttTelemetryClient()
