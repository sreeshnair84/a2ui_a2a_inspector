import { A2UICard } from '../types/a2ui';
import TextCard from './cards/TextCard';
import FormCard from './cards/FormCard';
import TicketCard from './cards/TicketCard';
import StatusCard from './cards/StatusCard';
import TableCard from './cards/TableCard';

interface A2UIRendererProps {
    cards: A2UICard[];
    onAction?: (action: string, data: any) => void;
}

/**
 * A2UIRenderer - Renders A2UI JSON schemas into React components
 * 
 * This component is completely agent-agnostic. It only knows about A2UI JSON format.
 */
export default function A2UIRenderer({ cards, onAction }: A2UIRendererProps) {
    const renderCard = (card: A2UICard) => {
        const commonProps = {
            id: card.id,
            content: card.content,
            onSubmit: onAction,
        };

        switch (card.type) {
            case 'text_card':
                return <TextCard key={card.id} {...commonProps} />;

            case 'form_card':
                // FormCard expects (formData) => void, but onAction is generic.
                return <FormCard key={card.id} {...commonProps} onSubmit={(data) => onAction?.('submit_form', data)} />;

            case 'ticket_card':
                return <TicketCard key={card.id} {...commonProps} />;

            case 'status_card':
                return <StatusCard key={card.id} {...commonProps} />;

            case 'table_card':
                return <TableCard key={card.id} {...commonProps} />;

            default:
                console.warn(`Unknown A2UI card type: ${card.type}`);
                return null;
        }
    };

    return (
        <div className="a2ui-container space-y-4">
            {cards.map(card => renderCard(card))}
        </div>
    );
}
