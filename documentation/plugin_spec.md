# AIOS Plugin Onboarding & Integration Specifications

This guide details how third-party vendors, researchers, and enterprise developers can build plug-and-play capabilities for AIOS without editing core runtime code.

---

## 1. Defining a Plugin

Every plugin must inherit from `BasePlugin` located in `backend/plugins/base.py` and implement the following life-cycle endpoints:

```python
from typing import Dict, Any
from backend.plugins.base import BasePlugin, plugin_registry

class CustomSpaceModulePlugin(BasePlugin):
    def get_metadata(self) -> Dict[str, Any]:
        return {
            "name": "SatelliteTelemetryPatrol",
            "version": "v1.0.0",
            "description": "Orchestrates satellite attitude solvers and communications channels.",
            "category": "Space Systems"
        }

    def initialize(self, api_context: Any) -> bool:
        # Load credentials, initialize ports
        return True

    def execute_capability(self, method_name: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        if method_name == "calculate_orbit":
            # Orbit math solver here...
            return {"orbit_aligned": True, "altitude_km": 420.5}
        return {"error": "Method not resolved."}

    def shutdown(self) -> bool:
        # Release assets gracefully
        return True

# Register on import
plugin_registry.register_plugin("space_patrol", CustomSpaceModulePlugin())
```

---

## 2. Onboarding Workflow

To install and verify a new custom plug-in:
1. **Source Code Placement**: Place your python file inside `backend/plugins/`.
2. **Registration Import**: Add your import statement to `backend/main.py` under the plug-in section:
   ```python
   import backend.plugins.custom_space_plugin
   ```
3. **Validation Verification**: Query the FastAPI endpoints:
   - `GET http://localhost:8000/api/plugins` (future custom endpoint) to verify registration details.
   - Run capability execution loops dynamically inside agent scripts using the plugin registry helper.
