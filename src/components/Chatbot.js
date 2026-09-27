import React from 'react';
import './Chatbot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className={`chatbot-container ${isOpen ? 'open' : ''}`}>
      <button className="chatbot-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? '✕' : '💬'} {}
      </button>
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">Chat with us</div>
          <div className="chatbot-messages">
            {}
            <p>Hello! How can I help you today?</p>
          </div>
          <div className="chatbot-input-area">
            <input type="text" placeholder="Type your message..." />
            <button>Send</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;


