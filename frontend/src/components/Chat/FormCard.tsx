import React, { useState } from 'react';
import { cn } from '../../utils';
import { Send, FileText } from 'lucide-react';

interface FormField {
    id: string;
    type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number' | 'email' | 'date';
    label: string;
    placeholder?: string;
    required?: boolean;
    options?: { value: string; label: string }[];
    min?: number;
    max?: number;
    default?: any;
    maxLength?: number;
}

interface FormAction {
    id: string;
    label: string;
    type: 'primary' | 'secondary' | 'danger' | 'link';
    action: string;
}

interface FormCardProps {
    id: string;
    content: {
        title: string;
        description?: string;
        fields: FormField[];
        actions: FormAction[];
    };
    onAction?: (action: any) => void;
}

export const FormCard: React.FC<FormCardProps> = ({ id, content, onAction }) => {
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [submitted, setSubmitted] = useState(false);

    // Initialize default values
    React.useEffect(() => {
        const initialData: Record<string, any> = {};
        content.fields.forEach(field => {
            if (field.default !== undefined) {
                initialData[field.id] = field.default;
            }
        });
        setFormData(prev => ({ ...initialData, ...prev }));
    }, [content.fields]);

    const handleChange = (fieldId: string, value: any) => {
        setFormData(prev => ({ ...prev, [fieldId]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        if (onAction) {
            onAction({
                type: 'submit',
                componentId: id,
                action: 'submit_form',
                data: formData
            });
        }
    };

    if (submitted) {
        return (
            <div className="max-w-md w-full my-4 bg-green-50 rounded-xl p-6 border border-green-200">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-100 rounded-full text-green-600">
                        <Send size={18} />
                    </div>
                    <h3 className="font-semibold text-green-800">Form Submitted</h3>
                </div>
                <p className="text-sm text-green-700">
                    Your request has been sent. The agent will process it shortly.
                </p>
                <div className="mt-4 text-xs font-mono text-green-800 bg-green-100/50 p-2 rounded max-h-32 overflow-y-auto">
                    {JSON.stringify(formData, null, 2)}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-md w-full my-4 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50 to-white px-6 py-4 border-b border-indigo-50">
                <div className="flex items-center gap-2 mb-1">
                    <FileText size={18} className="text-indigo-600" />
                    <h3 className="font-semibold text-gray-900">{content.title}</h3>
                </div>
                {content.description && (
                    <p className="text-sm text-gray-500">{content.description}</p>
                )}
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {content.fields.map((field) => (
                    <div key={field.id} className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>

                        {/* Render Input based on type */}
                        {field.type === 'text' || field.type === 'email' || field.type === 'date' ? (
                            <input
                                type={field.type}
                                required={field.required}
                                placeholder={field.placeholder}
                                value={formData[field.id] || ''}
                                onChange={(e) => handleChange(field.id, e.target.value)}
                                min={field.min}
                                max={field.max}
                                maxLength={field.maxLength}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                            />
                        ) : field.type === 'number' ? (
                            <input
                                type="number"
                                required={field.required}
                                placeholder={field.placeholder}
                                value={formData[field.id] || ''}
                                onChange={(e) => handleChange(field.id, Number(e.target.value))}
                                min={field.min}
                                max={field.max}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                            />
                        ) : field.type === 'textarea' ? (
                            <textarea
                                required={field.required}
                                placeholder={field.placeholder}
                                value={formData[field.id] || ''}
                                onChange={(e) => handleChange(field.id, e.target.value)}
                                maxLength={field.maxLength}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm min-h-[80px]"
                            />
                        ) : field.type === 'select' ? (
                            <select
                                required={field.required}
                                value={formData[field.id] || ''}
                                onChange={(e) => handleChange(field.id, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm appearance-none bg-white"
                            >
                                <option value="" disabled>Select an option</option>
                                {field.options?.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        ) : field.type === 'radio' ? (
                            <div className="space-y-2 pt-1">
                                {field.options?.map(opt => (
                                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name={field.id}
                                            value={opt.value}
                                            checked={formData[field.id] === opt.value}
                                            onChange={(e) => handleChange(field.id, e.target.value)}
                                            required={field.required}
                                            className="text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                        />
                                        <span className="text-sm text-gray-700">{opt.label}</span>
                                    </label>
                                ))}
                            </div>
                        ) : null}
                    </div>
                ))}

                <div className="pt-4 flex gap-3 justify-end">
                    {content.actions.map(action => (
                        <button
                            key={action.id}
                            type={action.type === 'primary' ? 'submit' : 'button'}
                            className={cn(
                                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                action.type === 'primary' && "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm",
                                action.type === 'secondary' && "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
                                action.type === 'danger' && "bg-red-50 text-red-600 hover:bg-red-100",
                                action.type === 'link' && "text-indigo-600 hover:underline px-0"
                            )}
                        >
                            {action.label}
                        </button>
                    ))}
                </div>
            </form>
        </div>
    );
};
