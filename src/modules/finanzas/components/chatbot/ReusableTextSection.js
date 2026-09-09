import React from 'react';

const ReusableTextSection = ({ 
  title, 
  content, 
  type = 'info', // 'info', 'success', 'warning', 'error', 'highlight'
  className = "",
  showIcon = true 
}) => {
  if (!content) return null;

  const getTypeClasses = () => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-green-50 border-green-200',
          icon: 'text-green-400',
          title: 'text-green-900',
          content: 'text-green-800'
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200',
          icon: 'text-yellow-400',
          title: 'text-yellow-900',
          content: 'text-yellow-800'
        };
      case 'error':
        return {
          container: 'bg-red-50 border-red-200',
          icon: 'text-red-400',
          title: 'text-red-900',
          content: 'text-red-800'
        };
      case 'highlight':
        return {
          container: 'bg-purple-50 border-purple-200',
          icon: 'text-purple-400',
          title: 'text-purple-900',
          content: 'text-purple-800'
        };
      default:
        return {
          container: 'bg-blue-50 border-blue-200',
          icon: 'text-blue-400',
          title: 'text-blue-900',
          content: 'text-blue-800'
        };
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'highlight':
        return (
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const typeClasses = getTypeClasses();

  const formatContent = (text) => {
    if (!text) return null;
    
    // Dividir el texto en líneas
    const lines = text.split('\n');
    
    return (
      <div className="space-y-3">
        {lines.map((line, index) => {
          // Línea vacía
          if (!line.trim()) {
            return <div key={index} className="h-2"></div>;
          }
          
          // Títulos con **texto:**
          if (line.includes(':**')) {
            const parts = line.split(':**');
            return (
              <div key={index} className="border-l-4 border-current pl-4 py-2 bg-white bg-opacity-50 rounded-r-lg">
                <h4 className="font-bold text-lg">
                  {parts[0].replace(/\*\*/g, '')}:
                </h4>
                {parts[1] && (
                  <p className="mt-1">{parts[1].trim()}</p>
                )}
              </div>
            );
          }
          
          // Elementos de lista que empiezan con *
          if (line.trim().startsWith('*')) {
            const content = line.replace(/^\s*\*\s*/, '');
            // Manejar texto con negritas **texto**
            const formattedContent = content.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <strong key={i} className="font-bold">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              return part;
            });
            
            return (
              <div key={index} className="flex items-start space-x-3 py-1">
                <div className="w-2 h-2 bg-current rounded-full mt-2 flex-shrink-0 opacity-60"></div>
                <div className="leading-relaxed">{formattedContent}</div>
              </div>
            );
          }
          
          // Texto normal con formato de negritas
          const formattedContent = line.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={i} className="font-bold">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          });
          
          return (
            <p key={index} className="leading-relaxed">
              {formattedContent}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`rounded-lg border p-6 ${typeClasses.container} ${className}`}>
      <div className="flex">
        {showIcon && (
          <div className="flex-shrink-0">
            <div className={typeClasses.icon}>
              {getIcon()}
            </div>
          </div>
        )}
        <div className={showIcon ? 'ml-3' : ''}>
          {title && (
            <h3 className={`text-lg font-medium mb-3 ${typeClasses.title}`}>
              {title}
            </h3>
          )}
          <div className={typeClasses.content}>
            {typeof content === 'string' ? formatContent(content) : content}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReusableTextSection;
