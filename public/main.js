const socket = io();
const clientsTotal = document.getElementById('client-total');
const messageContainer = document.getElementById('message-container');
const nameInput = document.getElementById('name-input');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const user =  prompt('Enter Your Name');
nameInput.value = user;
const messageTone = new Audio('/messageTone.mp3');
messageTone.load();

// Handle form submission
messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  sendMessage();
});

// Update total clients
socket.on('clients-total', (data) => {
  clientsTotal.innerText = `Total Clients: ${data}`;
});

// Send a message
function sendMessage() {
  if (messageInput.value === '') return;

  const data = {
    name: nameInput.value,
    message: messageInput.value,
    dateTime: new Date(),
  };

  socket.emit('message', data); // Emit the message to the server
  addMessageToUI(true, data); // Add the message to the UI
  messageInput.value = ''; // Clear the input field
}

// Receive chat history
socket.on('chat-history', (messages) => {
  messages.forEach((data) => {
    addMessageToUI(false, data); // Add each message to the UI
  });
});

// Receive a new chat message
socket.on('chat-message', (data) => {
    console.log('Playing audio for new message');
    messageTone.volume = 1.0; // Ensure volume is set
    messageTone.play().catch((err) => {
      console.error('Audio playback error:', err);
    });
    addMessageToUI(false, data);
  });

// Add a message to the UI
function addMessageToUI(isOwnMessage, data) {
  clearFeedback();
  const element = `
      <li class="${isOwnMessage ? 'message-right' : 'message-left'}">
          <p class="message">
            ${data.message}
            <span>${data.name} ● ${moment(data.dateTime).fromNow()}</span>
          </p>
      </li>
  `;

  messageContainer.innerHTML += element;
  scrollToBottom();
}

// Scroll to the bottom of the message container
function scrollToBottom() {
  messageContainer.scrollTo(0, messageContainer.scrollHeight);
}

// Handle typing feedback
messageInput.addEventListener('focus', () => {
  socket.emit('feedback', {
    feedback: `✍️ ${nameInput.value} is typing a message`,
  });
});

messageInput.addEventListener('keypress', () => {
  socket.emit('feedback', {
    feedback: `✍️ ${nameInput.value} is typing a message`,
  });
});

messageInput.addEventListener('blur', () => {
  socket.emit('feedback', {
    feedback: '',
  });
});

// Receive typing feedback
socket.on('feedback', (data) => {
  clearFeedback();
  const element = `
        <li class="message-feedback">
          <p class="feedback" id="feedback">${data.feedback}</p>
        </li>
  `;
  messageContainer.innerHTML += element;
});

// Clear typing feedback
function clearFeedback() {
  document.querySelectorAll('li.message-feedback').forEach((element) => {
    element.parentNode.removeChild(element);
  });
}