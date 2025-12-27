import { useState } from 'react';
import type { FormCardContent, FormField } from '../../types/a2ui';

interface FormCardProps {
    id: string;
    content: FormCardContent;
    onSubmit?: (formData: Record<string, any>) => void;
}

export default function FormCard({ content, onSubmit }: FormCardProps) {
    const [formData, setFormData] = useState<Record<string, any>>({});

    const handleFieldChange = (fieldId: string, value: any) => {
        setFormData(prev => ({ ...prev, [fieldId]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (onSubmit) {
            onSubmit(formData);
        }
    };

    const renderField = (field: FormField) => {
        const commonProps = {
            id: field.id,
            name: field.id,
            required: field.required,
            className: 'input-field',
        };

        switch (field.type) {
            case 'text':
            case 'email':
            case 'number':
                return (
                    <input
                        {...commonProps}
                        type={field.type}
                        placeholder={field.placeholder}
                        min={field.min}
                        max={field.max}
                        maxLength={field.maxLength}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    />
                );

            case 'textarea':
                return (
                    <textarea
                        {...commonProps}
                        placeholder={field.placeholder}
                        maxLength={field.maxLength}
                        rows={4}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    />
                );

            case 'select':
                return (
                    <select
                        {...commonProps}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    >
                        <option value="">Select...</option>
                        {field.options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                );

            case 'radio':
                return (
                    <div className="space-y-2">
                        {field.options?.map((opt) => (
                            <label key={opt.value} className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    name={field.id}
                                    value={opt.value}
                                    required={field.required}
                                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                    className="text-primary-600 focus:ring-primary-500"
                                />
                                <span>{opt.label}</span>
                            </label>
                        ))}
                    </div>
                );

            case 'checkbox':
                return (
                    <div className="space-y-2">
                        {field.options?.map((opt) => (
                            <label key={opt.value} className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    value={opt.value}
                                    onChange={(e) => {
                                        const currentValues = formData[field.id] || [];
                                        const newValues = e.target.checked
                                            ? [...currentValues, opt.value]
                                            : currentValues.filter((v: string) => v !== opt.value);
                                        handleFieldChange(field.id, newValues);
                                    }}
                                    className="text-primary-600 focus:ring-primary-500 rounded"
                                />
                                <span>{opt.label}</span>
                            </label>
                        ))}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="flex justify-start mb-8 w-full animate-fadeIn">
            <div className="flex gap-4 w-full max-w-2xl items-start">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl flex-shrink-0 flex items-center justify-center shadow-md ring-2 ring-gray-50 mt-1">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden w-full">
                    <div className="bg-gray-50/50 px-8 py-6 border-b border-gray-100">
                        <h3 className="text-xl font-bold text-gray-900 tracking-tight">{content.title}</h3>
                        {content.description && (
                            <p className="text-sm text-gray-500 mt-2 leading-relaxed">{content.description}</p>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        {content.fields.map((field) => (
                            <div key={field.id} className="group">
                                <label htmlFor={field.id} className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-indigo-600 transition-colors">
                                    {field.label}
                                    {field.required && <span className="text-red-500 ml-1" title="Required">*</span>}
                                </label>
                                {renderField(field)}
                            </div>
                        ))}

                        <div className="flex gap-3 pt-6 mt-2 border-t border-gray-50">
                            {content.actions.map((action) => (
                                <button
                                    key={action.id}
                                    type={action.action === 'submit_form' ? 'submit' : 'button'}
                                    className={
                                        action.type === 'primary'
                                            ? 'flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-6 py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0'
                                            : 'px-6 py-3.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm hover:shadow-md'
                                    }
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
