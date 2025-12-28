
def vm_provisioning(cpu_cores: int, ram_gb: int, os_type: str):
    """
    Provision a virtual machine with specified resources.
    """
    return f"SUCCESS: VM sent for provisioning. Specs: {cpu_cores}vCPU, {ram_gb}GB RAM, OS: {os_type}. Request ID: VM-{uuid.uuid4()}"

def sap_access_request(system_id: str, module: str, access_type: str):
    """
    Request access to an SAP system module.
    """
    return f"SUCCESS: SAP Access Request created for System: {system_id}, Module: {module}, Level: {access_type}. Ticket: SAP-{uuid.uuid4()}"

def check_ticket_status(ticket_id: str):
    """
    Check the status of a support ticket.
    """
    statuses = ["Pending Approval", "In Progress", "Completed", "Rejected"]
    import random
    return f"Ticket {ticket_id}: {random.choice(statuses)}"

available_functions = {
    "vm_provisioning": vm_provisioning,
    "sap_access_request": sap_access_request,
    "check_ticket_status": check_ticket_status
}

tools_schema = [
    {
        "type": "function",
        "function": {
            "name": "vm_provisioning",
            "description": "Provision a virtual machine",
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
            "description": "Request SAP system access",
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
    }
]
