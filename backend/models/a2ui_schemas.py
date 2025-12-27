"""
A2UI JSON schema definitions for IT service management.
These schemas define the structure of UI cards rendered by the frontend.
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Literal
from datetime import datetime


class FormField(BaseModel):
    """Individual form field definition."""
    id: str = Field(..., description="Unique field identifier")
    type: Literal["text", "textarea", "select", "radio", "checkbox", "email", "number", "date", "date_range"] = Field(..., description="Field type")
    label: str = Field(..., description="Field label")
    placeholder: Optional[str] = Field(None, description="Placeholder text")
    required: bool = Field(default=False, description="Whether field is required")
    options: Optional[List[Dict[str, str]]] = Field(None, description="Options for select/radio/checkbox")
    validation: Optional[str] = Field(None, description="Validation regex pattern")
    min: Optional[int] = Field(None, description="Minimum value for number fields")
    max: Optional[int] = Field(None, description="Maximum value for number fields")
    default: Optional[Any] = Field(None, description="Default value")
    maxLength: Optional[int] = Field(None, description="Maximum length for text fields")


class FormAction(BaseModel):
    """Form action button."""
    id: str = Field(..., description="Action identifier")
    label: str = Field(..., description="Button label")
    type: Literal["primary", "secondary", "danger", "link"] = Field(..., description="Button style")
    action: str = Field(default="submit_form", description="Action to perform")


class FormCardContent(BaseModel):
    """Content for FormCard."""
    title: str = Field(..., description="Form title")
    description: Optional[str] = Field(None, description="Form description")
    fields: List[FormField] = Field(..., description="Form fields")
    actions: List[FormAction] = Field(..., description="Form actions")


class FormCard(BaseModel):
    """Dynamic form card for IT service requests."""
    type: Literal["form_card"] = "form_card"
    id: str = Field(..., description="Unique card identifier")
    content: FormCardContent


class TimelineEvent(BaseModel):
    """Timeline event for ticket history."""
    timestamp: str = Field(..., description="Event timestamp")
    status: str = Field(..., description="Status at this point")
    actor: Optional[str] = Field(None, description="Who performed the action")
    message: Optional[str] = Field(None, description="Event message")


class TicketAction(BaseModel):
    """Action available on ticket."""
    id: str = Field(..., description="Action identifier")
    label: str = Field(..., description="Action label")
    type: Literal["primary", "secondary", "danger", "link"] = Field(..., description="Action style")
    url: Optional[str] = Field(None, description="URL for link actions")
    action: Optional[str] = Field(None, description="Action to perform")


class TicketCardContent(BaseModel):
    """Content for TicketCard."""
    ticket_id: str = Field(..., description="Ticket identifier")
    title: str = Field(..., description="Ticket title")
    status: str = Field(..., description="Current status")
    priority: Literal["low", "medium", "high", "critical"] = Field(..., description="Priority level")
    created_at: str = Field(..., description="Creation timestamp")
    created_by: Optional[str] = Field(None, description="Creator")
    assigned_to: Optional[str] = Field(None, description="Assignee")
    estimated_completion: Optional[str] = Field(None, description="Estimated completion time")
    details: Dict[str, Any] = Field(default_factory=dict, description="Ticket details")
    timeline: List[TimelineEvent] = Field(default_factory=list, description="Ticket timeline")
    actions: List[TicketAction] = Field(default_factory=list, description="Available actions")
    style: Optional[Dict[str, str]] = Field(None, description="Styling hints")


class TicketCard(BaseModel):
    """Service ticket display card."""
    type: Literal["ticket_card"] = "ticket_card"
    id: str = Field(..., description="Unique card identifier")
    content: TicketCardContent


class StatusStep(BaseModel):
    """Individual step in status progression."""
    name: str = Field(..., description="Step name")
    status: Literal["pending", "in_progress", "complete", "failed"] = Field(..., description="Step status")
    duration: Optional[str] = Field(None, description="Step duration")


class StatusCardContent(BaseModel):
    """Content for StatusCard."""
    title: str = Field(..., description="Status title")
    status: Literal["pending", "in_progress", "complete", "failed"] = Field(..., description="Overall status")
    progress: Optional[int] = Field(None, description="Progress percentage (0-100)")
    current_step: Optional[str] = Field(None, description="Current step description")
    steps: List[StatusStep] = Field(default_factory=list, description="Status steps")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")
    style: Optional[Dict[str, str]] = Field(None, description="Styling hints")


class StatusCard(BaseModel):
    """Provisioning/deployment progress card."""
    type: Literal["status_card"] = "status_card"
    id: str = Field(..., description="Unique card identifier")
    content: StatusCardContent


class TableData(BaseModel):
    """Table structure."""
    headers: List[str] = Field(..., description="Table headers")
    rows: List[List[str]] = Field(..., description="Table rows")


class TableAction(BaseModel):
    """Action available on table card."""
    id: str = Field(..., description="Action identifier")
    label: str = Field(..., description="Action label")
    type: Literal["primary", "secondary", "danger", "link"] = Field(..., description="Action style")
    url: Optional[str] = Field(None, description="URL for link actions")
    action: Optional[str] = Field(None, description="Action to perform")


class TableCardContent(BaseModel):
    """Content for TableCard."""
    title: str = Field(..., description="Table title")
    message: Optional[str] = Field(None, description="Additional message")
    ticket_reference: Optional[str] = Field(None, description="Related ticket ID")
    table: TableData = Field(..., description="Table data")
    actions: List[TableAction] = Field(default_factory=list, description="Available actions")
    style: Optional[Dict[str, str]] = Field(None, description="Styling hints")


class TableCard(BaseModel):
    """Resource lists and summaries."""
    type: Literal["table_card"] = "table_card"
    id: str = Field(..., description="Unique card identifier")
    content: TableCardContent


class TextCardContent(BaseModel):
    """Content for TextCard."""
    text: str = Field(..., description="Message text")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")


class TextCard(BaseModel):
    """Standard text message card."""
    type: Literal["text_card"] = "text_card"
    id: str = Field(..., description="Unique card identifier")
    content: TextCardContent


class ApprovalAction(BaseModel):
    """Approval action button."""
    id: str = Field(..., description="Action identifier")
    label: str = Field(..., description="Button label")
    type: Literal["success", "danger", "secondary"] = Field(..., description="Action type")
    action: str = Field(..., description="Action to perform")
    requires_comment: bool = Field(default=False, description="Whether comment is required")


class ApprovalCardContent(BaseModel):
    """Content for ApprovalCard."""
    title: str = Field(..., description="Approval title")
    message: str = Field(..., description="Approval message")
    request_details: Dict[str, Any] = Field(..., description="Request details")
    approver: Optional[Dict[str, str]] = Field(None, description="Approver information")
    actions: List[ApprovalAction] = Field(..., description="Approval actions")
    deadline: Optional[str] = Field(None, description="Approval deadline")
    style: Optional[Dict[str, str]] = Field(None, description="Styling hints")


class ApprovalCard(BaseModel):
    """Manager/admin approval workflow card."""
    type: Literal["approval_card"] = "approval_card"
    id: str = Field(..., description="Unique card identifier")
    content: ApprovalCardContent


# Helper function to create cards
def create_vm_provision_form(form_id: str = "vm_form_001") -> FormCard:
    """Create a VM provisioning form card."""
    return FormCard(
        id=form_id,
        content=FormCardContent(
            title="Virtual Machine Provisioning Request",
            description="Fill out the details below to request a new VM",
            fields=[
                FormField(id="vm_name", type="text", label="VM Name", required=True, 
                         placeholder="e.g., prod-web-server-01", validation="^[a-z0-9-]+$"),
                FormField(id="vm_size", type="select", label="VM Size", required=True,
                         options=[
                             {"value": "Standard_B2s", "label": "Standard B2s (2 vCPUs, 4 GB RAM)"},
                             {"value": "Standard_D4s_v3", "label": "Standard D4s v3 (4 vCPUs, 16 GB RAM)"},
                             {"value": "Standard_E8s_v3", "label": "Standard E8s v3 (8 vCPUs, 64 GB RAM)"}
                         ]),
                FormField(id="os_type", type="radio", label="Operating System", required=True,
                         options=[
                             {"value": "ubuntu_22_04", "label": "Ubuntu 22.04 LTS"},
                             {"value": "windows_server_2022", "label": "Windows Server 2022"},
                             {"value": "rhel_9", "label": "Red Hat Enterprise Linux 9"}
                         ]),
                FormField(id="disk_size", type="number", label="Disk Size (GB)", 
                         min=30, max=1024, default=128, required=True),
                FormField(id="environment", type="select", label="Environment", required=True,
                         options=[
                             {"value": "dev", "label": "Development"},
                             {"value": "staging", "label": "Staging"},
                             {"value": "prod", "label": "Production"}
                         ]),
                FormField(id="justification", type="textarea", label="Business Justification",
                         placeholder="Explain why this VM is needed...", required=True, maxLength=500)
            ],
            actions=[
                FormAction(id="submit_vm_request", label="Submit Request", type="primary", action="submit_form"),
                FormAction(id="cancel", label="Cancel", type="secondary", action="cancel")
            ]
        )
    )


def create_ticket_card(ticket_id: str, title: str, status: str, details: Dict[str, Any]) -> TicketCard:
    """Create a ticket card."""
    return TicketCard(
        id=f"ticket_{ticket_id}",
        content=TicketCardContent(
            ticket_id=ticket_id,
            title=title,
            status=status,
            priority="medium",
            created_at=datetime.utcnow().isoformat(),
            details=details,
            timeline=[
                TimelineEvent(
                    timestamp=datetime.utcnow().isoformat(),
                    status="submitted",
                    actor="system",
                    message="Request submitted"
                )
            ],
            actions=[
                TicketAction(id="view_ticket", label="View Full Ticket", type="link", 
                           url=f"/tickets/{ticket_id}")
            ],
            style={"status_color": "#FFA500", "priority_badge": "medium", "icon": "ticket"}
        )
    )
