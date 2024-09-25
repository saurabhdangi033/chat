// src/components/Message.js
import React from 'react';

const Message = ({ content }) => {
  return (
    <div className="message">
      <strong>{content.nickname}: </strong>
      {content.message}
    </div>
  );
};

export default Message;
