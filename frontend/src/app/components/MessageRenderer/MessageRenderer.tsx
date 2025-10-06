// components/MessageRenderer.tsx
import React from 'react';

interface MessageRendererProps {
  content: string;
  isBot?: boolean;
}

export const MessageRenderer: React.FC<MessageRendererProps> = ({ content, isBot = false }) => {
  
  const formatMessage = (text: string): JSX.Element[] => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    
    lines.forEach((line, index) => {
      const parts: (string | JSX.Element)[] = [];
      let lastIndex = 0;
      
      // Expresión regular para encontrar texto en **negrita**
      const boldRegex = /\*\*(.*?)\*\*/g;
      let match;
      
      while ((match = boldRegex.exec(line)) !== null) {
        // Agregar texto antes del bold
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }
        
        // Agregar texto en bold
        parts.push(
          <strong key={`bold-${index}-${match.index}`} className="font-bold text-gray-900">
            {match[1]}
          </strong>
        );
        
        lastIndex = match.index + match[0].length;
      }
      
      // Agregar el resto del texto
      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }
      
      // Si no hay partes procesadas, usar la línea original
      if (parts.length === 0) {
        parts.push(line);
      }
      
      // Determinar el tipo de línea y aplicar estilos
      const trimmedLine = line.trim();
      
      // Título principal (con emojis al inicio)
      if (trimmedLine.match(/^[🎓📊📖🏫💪🎯⚠️✨🏆⭐]/)) {
        elements.push(
          <div key={`line-${index}`} className="text-base font-bold text-white mb-2 mt-1">
            {parts}
          </div>
        );
      }
      // Subtítulos (comienzan con emojis de categoría)
      else if (trimmedLine.match(/^[📚📈🏠👥📝💡]/)) {
        elements.push(
          <div key={`line-${index}`} className="text-sm font-semibold text-gray-100 mb-1.5 mt-2">
            {parts}
          </div>
        );
      }
      // Items de lista (comienzan con •)
      else if (trimmedLine.startsWith('•')) {
        const indent = line.search(/\S/); // Detectar indentación
        const marginLeft = indent > 0 ? `${indent * 0.3}rem` : '0';
        
        elements.push(
          <div key={`line-${index}`} className="text-sm text-gray-200 mb-0.5 leading-relaxed" style={{ marginLeft }}>
            {parts}
          </div>
        );
      }
      // Items numerados
      else if (trimmedLine.match(/^\d+\./)) {
        elements.push(
          <div key={`line-${index}`} className="text-sm text-gray-200 mb-1.5 ml-3">
            {parts}
          </div>
        );
      }
      // Líneas con indentación (detalles de materias)
      else if (line.startsWith('   ') || line.startsWith('      ')) {
        const indent = line.search(/\S/);
        const marginLeft = `${indent * 0.2}rem`;
        
        elements.push(
          <div key={`line-${index}`} className="text-sm text-gray-300 mb-0.5 leading-snug" style={{ marginLeft }}>
            {parts}
          </div>
        );
      }
      // Separadores
      else if (trimmedLine === '---') {
        elements.push(
          <hr key={`line-${index}`} className="my-3 border-gray-600 opacity-30" />
        );
      }
      // Líneas vacías
      else if (trimmedLine === '') {
        elements.push(<div key={`line-${index}`} className="h-1" />);
      }
      // Texto normal
      else {
        elements.push(
          <div key={`line-${index}`} className="text-sm text-gray-200 mb-0.5 leading-relaxed">
            {parts}
          </div>
        );
      }
    });
    
    return elements;
  };
  
  return (
    <div className="message-content">
      {formatMessage(content)}
    </div>
  );
};

export default MessageRenderer;