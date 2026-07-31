from typing import List
from fastapi import HTTPException, status, Depends
from backend.security.auth import get_current_user_role

# Define Role Hierarchies or Levels
# Lower value means higher privilege
ROLE_HIERARCHY = {
    "Super Admin": 0,
    "Organization Admin": 1,
    "Developer": 2,
    "Operator": 3,
    "Viewer": 4,
    "Guest": 5
}

class RoleRequirement:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: dict = Depends(get_current_user_role)):
        user_role = current_user.get("role", "Guest")
        
        # Check if user's role satisfies any of the allowed roles based on hierarchy
        user_level = ROLE_HIERARCHY.get(user_role, 5)
        
        # Find minimum level allowed
        min_allowed_level = min([ROLE_HIERARCHY.get(role, 5) for role in self.allowed_roles])
        
        if user_level <= min_allowed_level:
            return current_user
            
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Operation not permitted. Required role tier: {self.allowed_roles}. Your role: '{user_role}'"
        )

# Convenience dependency instances
require_super_admin = RoleRequirement(["Super Admin"])
require_org_admin = RoleRequirement(["Super Admin", "Organization Admin"])
require_developer = RoleRequirement(["Super Admin", "Organization Admin", "Developer"])
require_operator = RoleRequirement(["Super Admin", "Organization Admin", "Developer", "Operator"])
require_viewer = RoleRequirement(["Super Admin", "Organization Admin", "Developer", "Operator", "Viewer"])
