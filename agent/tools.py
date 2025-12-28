import uuid
import json
import random
from datetime import datetime

def vm_provisioning(cpu_cores: int, ram_gb: int, os_type: str):
    """
    Provision a virtual machine with specified resources.
    """
    req_id = f"REQ-{uuid.uuid4().hex[:8].upper()}"
    trace_id = f"TRC-{uuid.uuid4().hex[:12].upper()}"
    
    response = {
        "status": "acknowledged",
        "message": "VM provisioning request received and scheduled.",
        "request_id": req_id,
        "trace_id": trace_id,
        "timestamp": datetime.now().isoformat(),
        "details": {
            "resource_type": "Virtual Machine",
            "specs": {
                "cpu": f"{cpu_cores} vCPU",
                "ram": f"{ram_gb} GB",
                "os": os_type
            }
        }
    }
    return json.dumps(response, indent=2)

def sap_access_request(system_id: str, module: str, access_type: str):
    """
    Request access to an SAP system module.
    """
    req_id = f"REQ-{uuid.uuid4().hex[:8].upper()}"
    trace_id = f"TRC-{uuid.uuid4().hex[:12].upper()}"
    
    response = {
        "status": "acknowledged",
        "message": "SAP Access request submitted for approval",
        "request_id": req_id,
        "trace_id": trace_id,
        "timestamp": datetime.now().isoformat(),
        "details": {
             "system": system_id,
             "module": module,
             "access_level": access_type
        }
    }
    return json.dumps(response, indent=2)

def check_ticket_status(ticket_id: str):
    """
    Check the status of a support ticket.
    """
    statuses = ["Pending Approval", "Provisioning", "Completed", "Rejected"]
    
    response = {
        "ticket_id": ticket_id,
        "status": random.choice(statuses),
        "last_updated": datetime.now().isoformat()
    }
    return json.dumps(response, indent=2)

def create_web_app(app_name: str, runtime: str, region: str):
    """
    Create a new Azure Web App.
    """
    req_id = f"REQ-{uuid.uuid4().hex[:8].upper()}"
    trace_id = f"TRC-{uuid.uuid4().hex[:12].upper()}"
    
    response = {
        "status": "acknowledged",
        "message": "Web App creation initiated.",
        "request_id": req_id,
        "trace_id": trace_id,
        "timestamp": datetime.now().isoformat(),
        "details": {
            "resource_type": "Azure Web App",
            "name": app_name,
            "runtime": runtime,
            "region": region,
            "url": f"https://{app_name.lower().replace(' ', '-')}.azurewebsites.net"
        }
    }
    return json.dumps(response, indent=2)

def request_rbac_access(user_email: str, role: str, scope: str):
    """
    Request RBAC access for a user.
    """
    req_id = f"REQ-{uuid.uuid4().hex[:8].upper()}"
    trace_id = f"TRC-{uuid.uuid4().hex[:12].upper()}"
    
    response = {
        "status": "acknowledged",
        "message": "RBAC Access request submitted for approval",
        "request_id": req_id,
        "trace_id": trace_id,
        "timestamp": datetime.now().isoformat(),
        "details": {
             "user": user_email,
             "role": role,
             "scope": scope
        }
    }
    return json.dumps(response, indent=2)

    return json.dumps(response, indent=2)

# --- Validation Tools ---

def validate_vm_provisioning(cpu_cores: int, ram_gb: int, os_type: str):
    """
    Validate VM quota and specs before provisioning.
    """
    # Dummy logic: Fail if > 32 cores
    status = "valid"
    message = "Quota available. Configuration valid."
    if cpu_cores > 32:
        status = "invalid"
        message = "Quota exceeded: Max 32 vAPUs allowed."
        
    response = {
        "validation_status": status,
        "message": message,
        "checked_at": datetime.now().isoformat()
    }
    return json.dumps(response, indent=2)

def validate_web_app_creation(app_name: str, runtime: str, region: str):
    """
    Check if Web App name is available and region is valid.
    """
    # Dummy logic: Fail if name is "taken"
    status = "valid"
    message = f"App name '{app_name}' is available."
    if app_name.lower() == "test":
        status = "invalid"
        message = f"App name '{app_name}' is already taken."
        
    response = {
        "validation_status": status,
        "message": message,
        "availability": "Available" if status == "valid" else "Taken"
    }
    return json.dumps(response, indent=2)

def validate_rbac_request(user_email: str, role: str):
    """
    Verify user exists in directory and role is applicable.
    """
    response = {
        "validation_status": "valid",
        "message": f"User '{user_email}' found in Active Directory. Role '{role}' is valid for assignment.",
        "directory_id": f"DIR-{uuid.uuid4().hex[:6]}"
    }
    return json.dumps(response, indent=2)

def validate_sap_request(system_id: str, module: str):
    """
    Check if SAP system is online and module exists.
    """
    response = {
        "validation_status": "valid",
        "message": f"System '{system_id}' is Online. Module '{module}' is active.",
        "system_status": "OK"
    }
    return json.dumps(response, indent=2)


available_functions = {
    "vm_provisioning": vm_provisioning,
    "sap_access_request": sap_access_request,
    "check_ticket_status": check_ticket_status,
    "create_web_app": create_web_app,
    "request_rbac_access": request_rbac_access,
    # Validation tools
    "validate_vm_provisioning": validate_vm_provisioning,
    "validate_web_app_creation": validate_web_app_creation,
    "validate_rbac_request": validate_rbac_request,
    "validate_sap_request": validate_sap_request
}

tools_schema = [
    # --- VALIDATION TOOLS ---
    {
        "type": "function",
        "function": {
            "name": "validate_vm_provisioning",
            "description": "Validate resources before VM creation",
            "parameters": {
                "type": "object",
                "properties": {
                    "cpu_cores": {"type": "integer"},
                    "ram_gb": {"type": "integer"},
                    "os_type": {"type": "string"}
                },
                "required": ["cpu_cores", "ram_gb", "os_type"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "validate_web_app_creation",
            "description": "Check availability for Web App",
            "parameters": {
                "type": "object",
                "properties": {
                    "app_name": {"type": "string"},
                    "runtime": {"type": "string"},
                    "region": {"type": "string"}
                },
                "required": ["app_name", "runtime", "region"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "validate_rbac_request",
            "description": "Validate user and role for RBAC",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_email": {"type": "string"},
                    "role": {"type": "string"}
                },
                "required": ["user_email", "role"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "validate_sap_request",
            "description": "Validate SAP System status",
            "parameters": {
                "type": "object",
                "properties": {
                    "system_id": {"type": "string"},
                    "module": {"type": "string"}
                },
                "required": ["system_id", "module"]
            }
        }
    },
    # --- ACTION TOOLS ---
    {
        "type": "function",
        "function": {
            "name": "vm_provisioning",
            "description": "Provision a virtual machine (Call validate_vm_provisioning FIRST)",
            "parameters": {
                "type": "object",
                "properties": {
                    "cpu_cores": {"type": "integer", "description": "Number of CPU cores"},
                    "ram_gb": {"type": "integer", "description": "RAM in GB"},
                    "os_type": {"type": "string", "enum": ["windows", "linux", "ubuntu"], "description": "Operating System"}
                },
                "required": ["cpu_cores", "ram_gb", "os_type"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "sap_access_request",
            "description": "Request SAP system access (Call validate_sap_request FIRST)",
            "parameters": {
                "type": "object",
                "properties": {
                    "system_id": {"type": "string", "description": "SAP System ID (e.g., P01, Q01)"},
                    "module": {"type": "string", "description": "SAP Module (FI, CO, MM, SD)"},
                    "access_type": {"type": "string", "enum": ["read", "write", "admin"]}
                },
                "required": ["system_id", "module", "access_type"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "check_ticket_status",
            "description": "Check status of IT ticket",
            "parameters": {
                "type": "object",
                "properties": {
                    "ticket_id": {"type": "string"}
                },
                "required": ["ticket_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_web_app",
            "description": "Create a new Web Application (Call validate_web_app_creation FIRST)",
            "parameters": {
                "type": "object",
                "properties": {
                    "app_name": {"type": "string", "description": "Name of the web app"},
                    "runtime": {"type": "string", "description": "Runtime stack (e.g., Node.js 18, Python 3.9, .NET 6)"},
                    "region": {"type": "string", "enum": ["East US", "West Europe", "Southeast Asia"], "description": "Cloud Region"}
                },
                "required": ["app_name", "runtime", "region"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "request_rbac_access",
            "description": "Request RBAC Role Assignment (Call validate_rbac_request FIRST)",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_email": {"type": "string", "description": "User's email address"},
                    "role": {"type": "string", "enum": ["Contributor", "Reader", "Owner", "User Access Administrator"], "description": "Azure Role"},
                    "scope": {"type": "string", "description": "Resource scope (e.g., /subscriptions/123...)"}
                },
                "required": ["user_email", "role", "scope"]
            }
        }
    }
]
