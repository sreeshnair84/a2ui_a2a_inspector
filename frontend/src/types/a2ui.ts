/**
 * A2UI Schema type definitions
 */

export interface A2UICard {
    type: string;
    id: string;
    content: any;
}

export interface FormField {
    id: string;
    type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'email' | 'number' | 'date' | 'date_range';
    label: string;
    placeholder?: string;
    required?: boolean;
    options?: Array<{ value: string; label: string }>;
    validation?: string;
    min?: number;
    max?: number;
    default?: any;
    maxLength?: number;
}

export interface FormAction {
    id: string;
    label: string;
    type: 'primary' | 'secondary' | 'danger' | 'link';
    action?: string;
}

export interface FormCardContent {
    title: string;
    description?: string;
    fields: FormField[];
    actions: FormAction[];
}

export interface TimelineEvent {
    timestamp: string;
    status: string;
    actor?: string;
    message?: string;
}

export interface TicketAction {
    id: string;
    label: string;
    type: 'primary' | 'secondary' | 'danger' | 'link';
    url?: string;
    action?: string;
}

export interface TicketCardContent {
    ticket_id: string;
    title: string;
    status: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    created_at: string;
    created_by?: string;
    assigned_to?: string;
    estimated_completion?: string;
    details: Record<string, any>;
    timeline: TimelineEvent[];
    actions: TicketAction[];
    style?: Record<string, string>;
}

export interface StatusStep {
    name: string;
    status: 'pending' | 'in_progress' | 'complete' | 'failed';
    duration?: string;
}

export interface StatusCardContent {
    title: string;
    status: 'pending' | 'in_progress' | 'complete' | 'failed';
    progress?: number;
    current_step?: string;
    steps: StatusStep[];
    metadata?: Record<string, any>;
    style?: Record<string, string>;
}

export interface TableData {
    headers: string[];
    rows: string[][];
}

export interface TableAction {
    id: string;
    label: string;
    type: 'primary' | 'secondary' | 'danger' | 'link';
    url?: string;
    action?: string;
}

export interface TableCardContent {
    title: string;
    message?: string;
    ticket_reference?: string;
    table: TableData;
    actions: TableAction[];
    style?: Record<string, string>;
}

export interface TextCardContent {
    text: string;
    metadata?: Record<string, any>;
}

export interface A2UIResponse {
    cards: A2UICard[];
    session_id: string;
    timestamp: string;
    metadata?: Record<string, any>;
}
