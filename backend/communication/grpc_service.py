import grpc
from concurrent import futures
import time
import logging
from backend.config import settings
from backend.database.connection import SessionLocal
from backend.database.repositories import DeviceRepository
from backend.domain.models import EdgeDeviceModel

logger = logging.getLogger("aios.grpc")

# Simulation of compiled proto structures for developer plug-and-play setup
class TelemetryServicer:
    """
    gRPC Server interface implementing the edge synchronization protocols.
    """
    def SyncTelemetry(self, request, context):
        """
        Receives telemetry payloads via gRPC streaming channels.
        """
        db = SessionLocal()
        try:
            repo = DeviceRepository(db)
            device = repo.get_by_id(request.device_id)
            if device:
                device.cpu = request.cpu
                device.ram = request.ram
                device.temperature = request.temperature
                device.status = "Online"
                repo.update(device)
                return "TelemetrySyncedOK"
            else:
                context.set_code(grpc.StatusCode.NOT_FOUND)
                context.set_details("Device ID not registered.")
                return "DeviceNotFound"
        finally:
            db.close()

def serve_grpc():
    """Starts the RPC server listening on settings.GRPC_PORT."""
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    # In a real environment, we would register the generated servicer:
    # telemetry_pb2_grpc.add_TelemetryServicer_to_server(TelemetryServicer(), server)
    
    server.add_insecure_port(f"[::]:{settings.GRPC_PORT}")
    try:
        server.start()
        logger.info(f"gRPC Server active on port {settings.GRPC_PORT}")
    except Exception as e:
        logger.warning(f"Failed to start gRPC Server: {str(e)}")
