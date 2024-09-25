// src/MessageList.js
import React from 'react';

const MessageList = ({ messages }) => {
  return (
    <div>
      <h3>Messages:</h3>
      <ul>
        {messages.map((msg, index) => (
          <li key={index}>
            <strong>{msg.nickname}</strong>: {msg.message} <em>({msg.timestamp})</em>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MessageList;
