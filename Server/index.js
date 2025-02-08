const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Groq } = require('groq-sdk');
const dotenv = require('dotenv')
const cors = require('cors');

const app = express();
dotenv.config();
app.use(cors());


const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  }
});


const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

let chatHistory = [];

io.on('connection', (socket) => {
  console.log("client connected");
  socket.emit('history', chatHistory);

  socket.on('message', async (message) => {
    const userMessage = message.toString();
    chatHistory.push({ role: 'user', content: userMessage });

    try {
      const response = await groq.chat.completions.create({
        model: 'mixtral-8x7b-32768',
        messages: chatHistory,
      });

      const aiMessage = response.choices[0].message.content;
      chatHistory.push({ role: 'assistant', content: aiMessage });

      socket.emit('response', aiMessage);
    } catch (error) {
      socket.emit('error', 'Error processing your message.');
    }
  });

  socket.on('disconnect', () => {});
});

server.listen(8080, () => {
  console.log('Server is listening on port 8080');
});
