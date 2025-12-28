
/**
 * A2UI v0.9 Schema type definitions
 * Based on A2UI Specification v0.9
 */

export interface SurfaceUpdate {
    components: ComponentDefinition[];
}

export interface ComponentDefinition {
    id: string;
    component: string;
    text?: TextData;
    children?: ChildrenData;
    usageHint?: string;
    [key: string]: any;
}

export interface TextData {
    literalString?: string;
    [key: string]: any;
}

export interface ChildrenData {
    explicitList?: string[];
    [key: string]: any;
}

export interface DataModelUpdate {
    data: any;
}

export interface A2UIEnvelope {
    surfaceUpdate?: SurfaceUpdate;
    dataModelUpdate?: DataModelUpdate;
    metadata?: Record<string, any>;
    [key: string]: any;
}

export interface A2UIResponse {
    surfaceUpdate?: SurfaceUpdate;
    session_id: string;
    timestamp?: string;
    metadata?: Record<string, any>;
    // Legacy support (optional)
    cards?: any[];
}
