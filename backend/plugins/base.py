from abc import ABC, abstractmethod
from typing import Dict, Any, List

class BasePlugin(ABC):
    """
    Abstract Base Class that all future plug-and-play AIOS modules must implement.
    Allows extending system behaviors for space, military, healthcare, or smart city nodes.
    """
    
    @abstractmethod
    def get_metadata(self) -> Dict[str, Any]:
        """Returns plugin identity: name, version, description, required permissions."""
        pass

    @abstractmethod
    def initialize(self, api_context: Any) -> bool:
        """Initializes dependencies and establishes interfaces with the AIOS core host."""
        pass

    @abstractmethod
    def execute_capability(self, method_name: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Trigger a specific domain capability within the plugin container."""
        pass

    @abstractmethod
    def shutdown(self) -> bool:
        """Gracefully release handles, files, and socket connections."""
        pass


class PluginRegistry:
    """Manages active plugin lifecycle registrations and triggers."""
    def __init__(self):
        self._plugins: Dict[str, BasePlugin] = {}

    def register_plugin(self, name: str, plugin: BasePlugin):
        self._plugins[name] = plugin

    def get_plugin(self, name: str) -> BasePlugin:
        return self._plugins.get(name)

    def list_registered_plugins(self) -> List[Dict[str, Any]]:
        return [p.get_metadata() for p in self._plugins.values()]

# Global registry handle
plugin_registry = PluginRegistry()
