"""
Agent routing logic for directing requests to appropriate handlers.
"""
from typing import Dict, Any, Callable
from models.multimodal import MultimodalRequest
from models.a2ui_schemas import (
    FormCard, TicketCard, StatusCard, TableCard, TextCard,
    create_vm_provision_form, create_ticket_card
)
import uuid


class AgentRouter:
    """Routes requests to appropriate agent handlers based on input type and intent."""
    
    def __init__(self):
        """Initialize the router with handler mappings."""
        self.handlers: Dict[str, Callable] = {
            "vm_provision": self._handle_vm_provision,
            "sap_access": self._handle_sap_access,
            "rbac_access": self._handle_rbac_access,
            "azure_webapp": self._handle_azure_webapp,
            "general": self._handle_general_query
        }
    
    def route_request(self, request: MultimodalRequest) -> Dict[str, Any]:
        """
        Route a request to the appropriate handler.
        
        Args:
            request: Multimodal request object
            
        Returns:
            Dictionary containing A2UI cards
        """
        # Extract text content based on modality
        if request.modality == "text" and request.text_input:
            text = request.text_input.text
        elif request.modality == "voice" and request.voice_input:
            text = request.voice_input.transcript
        else:
            text = ""
        
        # Determine intent from text (simple keyword matching for now)
        intent = self._determine_intent(text.lower())
        
        # Route to appropriate handler
        handler = self.handlers.get(intent, self.handlers["general"])
        return handler(request, text)
    
    def _determine_intent(self, text: str) -> str:
        """
        Determine user intent from text.
        
        Args:
            text: User's text input (lowercased)
            
        Returns:
            Intent identifier
        """
        if any(keyword in text for keyword in ["vm", "virtual machine", "provision", "server"]):
            return "vm_provision"
        elif any(keyword in text for keyword in ["sap", "erp", "finance", "mm", "sd"]):
            return "sap_access"
        elif any(keyword in text for keyword in ["rbac", "role", "access", "permission"]):
            return "rbac_access"
        elif any(keyword in text for keyword in ["webapp", "web app", "azure", "deploy"]):
            return "azure_webapp"
        else:
            return "general"
    
    def _handle_vm_provision(self, request: MultimodalRequest, text: str) -> Dict[str, Any]:
        """Handle VM provisioning requests."""
        # Check if this is a form submission or initial request
        if "submit" in text.lower() or request.metadata.get("form_data"):
            # Create ticket for submitted request
            form_data = request.metadata.get("form_data", {})
            ticket_id = f"REQ-2025-{str(uuid.uuid4())[:5].upper()}"
            
            ticket_card = create_ticket_card(
                ticket_id=ticket_id,
                title="VM Provisioning Request",
                status="pending_approval",
                details=form_data
            )
            
            text_card = TextCard(
                id="response_text",
                content={"text": f"I've created ticket {ticket_id} for your VM provisioning request. It's now pending approval from your manager."}
            )
            
            return {
                "cards": [
                    text_card.model_dump(),
                    ticket_card.model_dump()
                ]
            }
        else:
            # Show VM provisioning form
            form_card = create_vm_provision_form()
            text_card = TextCard(
                id="intro_text",
                content={"text": "I can help you provision a new virtual machine. Please fill out the form below with your requirements."}
            )
            
            return {
                "cards": [
                    text_card.model_dump(),
                    form_card.model_dump()
                ]
            }
    
    def _handle_sap_access(self, request: MultimodalRequest, text: str) -> Dict[str, Any]:
        """Handle SAP access requests."""
        from models.a2ui_schemas import FormCard, FormCardContent, FormField, FormAction
        
        sap_form = FormCard(
            id="sap_access_form",
            content=FormCardContent(
                title="SAP System Access Request",
                description="Request access to SAP modules and transaction codes",
                fields=[
                    FormField(id="sap_system", type="select", label="SAP System", required=True,
                             options=[
                                 {"value": "ERP_PROD", "label": "ERP Production (S4P)"},
                                 {"value": "ERP_QA", "label": "ERP Quality Assurance (S4Q)"},
                                 {"value": "BW_PROD", "label": "BW Production (BWP)"}
                             ]),
                    FormField(id="modules", type="checkbox", label="Access Type", required=True,
                             options=[
                                 {"value": "FI", "label": "Finance (FI)"},
                                 {"value": "CO", "label": "Controlling (CO)"},
                                 {"value": "MM", "label": "Materials Management (MM)"},
                                 {"value": "SD", "label": "Sales & Distribution (SD)"}
                             ]),
                    FormField(id="manager_email", type="email", label="Manager Email (for approval)", 
                             required=True, placeholder="manager@company.com")
                ],
                actions=[
                    FormAction(id="submit_sap", label="Submit for Approval", type="primary")
                ]
            )
        )
        
        text_card = TextCard(
            id="sap_intro",
            content={"text": "I can help you request SAP system access. Please fill out the form below."}
        )
        
        return {
            "cards": [
                text_card.model_dump(),
                sap_form.model_dump()
            ]
        }
    
    def _handle_rbac_access(self, request: MultimodalRequest, text: str) -> Dict[str, Any]:
        """Handle RBAC access requests."""
        from models.a2ui_schemas import FormCard, FormCardContent, FormField, FormAction
        
        rbac_form = FormCard(
            id="rbac_form",
            content=FormCardContent(
                title="Role-Based Access Control Request",
                description="Request access to applications and resources",
                fields=[
                    FormField(id="application", type="select", label="Application/System", required=True,
                             options=[
                                 {"value": "azure_portal", "label": "Azure Portal"},
                                 {"value": "aws_console", "label": "AWS Console"},
                                 {"value": "github_enterprise", "label": "GitHub Enterprise"}
                             ]),
                    FormField(id="role", type="select", label="Role", required=True,
                             options=[
                                 {"value": "reader", "label": "Reader (View Only)"},
                                 {"value": "contributor", "label": "Contributor (Read/Write)"},
                                 {"value": "admin", "label": "Administrator (Full Access)"}
                             ]),
                    FormField(id="justification", type="textarea", label="Business Justification", 
                             required=True, maxLength=300)
                ],
                actions=[
                    FormAction(id="submit_rbac", label="Submit Request", type="primary")
                ]
            )
        )
        
        text_card = TextCard(
            id="rbac_intro",
            content={"text": "I can help you request role-based access. Please specify the application and role you need."}
        )
        
        return {
            "cards": [
                text_card.model_dump(),
                rbac_form.model_dump()
            ]
        }
    
    def _handle_azure_webapp(self, request: MultimodalRequest, text: str) -> Dict[str, Any]:
        """Handle Azure WebApp deployment requests."""
        from models.a2ui_schemas import FormCard, FormCardContent, FormField, FormAction
        
        webapp_form = FormCard(
            id="webapp_form",
            content=FormCardContent(
                title="Azure Web App Deployment",
                description="Deploy a new Azure Web Application",
                fields=[
                    FormField(id="app_name", type="text", label="App Name", required=True,
                             placeholder="my-webapp", validation="^[a-z0-9-]+$"),
                    FormField(id="runtime", type="select", label="Runtime Stack", required=True,
                             options=[
                                 {"value": "node_18", "label": "Node.js 18 LTS"},
                                 {"value": "python_3_11", "label": "Python 3.11"},
                                 {"value": "dotnet_7", "label": ".NET 7"}
                             ]),
                    FormField(id="pricing_tier", type="select", label="Pricing Tier", required=True,
                             options=[
                                 {"value": "F1", "label": "F1 (Free)"},
                                 {"value": "B1", "label": "B1 (Basic)"},
                                 {"value": "S1", "label": "S1 (Standard)"}
                             ])
                ],
                actions=[
                    FormAction(id="deploy_webapp", label="Deploy Application", type="primary")
                ]
            )
        )
        
        text_card = TextCard(
            id="webapp_intro",
            content={"text": "I can help you deploy an Azure Web Application. Please provide the deployment details."}
        )
        
        return {
            "cards": [
                text_card.model_dump(),
                webapp_form.model_dump()
            ]
        }
    
    def _handle_general_query(self, request: MultimodalRequest, text: str) -> Dict[str, Any]:
        """Handle general queries."""
        text_card = TextCard(
            id="general_response",
            content={
                "text": "I can help you with:\n• VM Provisioning\n• SAP Access Requests\n• RBAC Access Management\n• Azure WebApp Deployment\n\nWhat would you like to do?"
            }
        )
        
        return {
            "cards": [text_card.model_dump()]
        }


# Global router instance
router = AgentRouter()
