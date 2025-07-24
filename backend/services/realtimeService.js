import { WebSocketServer } from 'ws'
import { RealtimeClient } from '@openai/realtime-api-beta'
import jwt from 'jsonwebtoken'
import Task from '../models/Task.js'
import Category from '../models/Category.js'

const clients = new Map()

export function setupRealtimeWebSocket(server) {
  const wss = new WebSocketServer({ 
    server,
    path: '/ws/realtime'
  })

  wss.on('connection', async (ws, req) => {
    let userId = null
    let realtimeClient = null
    let currentResponse = ''
    let audioChunks = []

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message)
        
        if (data.type === 'auth') {
          const token = data.token
          if (!token) {
            ws.send(JSON.stringify({ type: 'error', message: 'No token provided' }))
            return
          }

          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
            userId = decoded.userId
            
            realtimeClient = new RealtimeClient({ 
              apiKey: process.env.OPENAI_API_KEY,
              model: 'gpt-4o-realtime-preview'
            })
            
            const tasks = await Task.find({ userId: userId }).populate('categoryId')
            const categories = await Category.find({ user: userId })
            
            const taskContext = tasks.map(t => ({
              title: t.title,
              completed: t.completed,
              dueDate: t.dueDate,
              category: t.categoryId?.name
            }))
            
            const pendingTasks = tasks.filter(t => !t.completed)
            const completedTasks = tasks.filter(t => t.completed)
            
            const sessionConfig = {
              modalities: ['text', 'audio'],
              instructions: `You are Kai, an AI assistant for a todo/task management application. Your ONLY purpose is to help users manage their tasks and be productive.

SYSTEM CONTEXT:
- This is a task management app where users create, complete, and organize tasks
- Users can categorize tasks and set due dates
- Your role is to help with task-related queries ONLY

CURRENT USER DATA:
- Pending tasks (${pendingTasks.length}): ${pendingTasks.map(t => `"${t.title}" (${t.categoryId?.name || 'uncategorized'}${t.dueDate ? ', due ' + new Date(t.dueDate).toLocaleDateString() : ''})`).join(', ') || 'None'}
- Completed tasks (${completedTasks.length}): ${completedTasks.map(t => `"${t.title}"`).join(', ') || 'None'}
- Categories: ${categories.map(c => c.name).join(', ') || 'None created yet'}

INSTRUCTIONS:
1. ONLY discuss topics related to task management, productivity, and the user's tasks
2. If asked about unrelated topics, politely redirect to task management
3. Be concise and helpful
4. You can suggest task prioritization, remind about due dates, celebrate completions
5. You CANNOT create, edit, or delete tasks - only discuss them
6. Keep responses short and focused

Remember: You are Kai, a task management assistant. Stay on topic.`,
              voice: 'alloy',
              input_audio_format: 'pcm16',
              output_audio_format: 'pcm16',
              input_audio_transcription: { 
                model: 'whisper-1' 
              },
              turn_detection: { 
                type: 'none'
              },
              temperature: 0.7
            }

            
            realtimeClient.on('error', (error) => {
              ws.send(JSON.stringify({
                type: 'error',
                message: error.message || 'AI service error'
              }))
            })

            // Handle conversation updates with proper transcript handling
            realtimeClient.on('conversation.updated', ({ item, delta }) => {
              // For user audio transcription
              if (item?.role === 'user') {
                // Handle transcript deltas
                if (delta?.transcript) {
                  console.log('User transcript delta:', delta.transcript)
                  ws.send(JSON.stringify({
                    type: 'user_transcript',
                    data: { transcript: delta.transcript }
                  }))
                }
                
                // Handle completed user audio transcription
                if (item.status === 'completed' && item.content) {
                  // Look for audio content with transcript
                  item.content.forEach(content => {
                    if (content.type === 'input_audio' && content.transcript) {
                      console.log('User audio transcript:', content.transcript)
                      ws.send(JSON.stringify({
                        type: 'user_transcript',
                        data: { transcript: content.transcript }
                      }))
                    }
                  })
                }
              }
              
              // Handle assistant messages
              if (item?.role === 'assistant') {
                if (delta?.transcript || delta?.text) {
                  const deltaText = delta.transcript || delta.text
                  ws.send(JSON.stringify({
                    type: 'response.audio_transcript.delta',
                    data: { delta: deltaText }
                  }))
                }
                
                if (delta?.audio) {
                  ws.send(JSON.stringify({
                    type: 'response.audio.delta',
                    data: { delta: delta.audio }
                  }))
                }
                
                if (item.status === 'completed') {
                  // Find transcript or text in content
                  let completeText = ''
                  if (item.content) {
                    item.content.forEach(content => {
                      if (content.transcript) completeText = content.transcript
                      if (content.text) completeText = content.text
                    })
                  }
                  
                  if (completeText) {
                    ws.send(JSON.stringify({
                      type: 'response.complete',
                      data: { text: completeText }
                    }))
                  }
                  
                  setTimeout(() => {
                    ws.send(JSON.stringify({
                      type: 'response.done',
                      data: {}
                    }))
                  }, 100)
                }
              }
            })
            
            // Handle input audio transcription completed event
            realtimeClient.on('conversation.item.input_audio_transcription.completed', (event) => {
              console.log('User said:', event.transcript)
              ws.send(JSON.stringify({
                type: 'user_transcript',
                data: { transcript: event.transcript }
              }))
            })
            
            realtimeClient.on('input_audio_buffer.speech_started', () => {
              console.log('Speech started detected')
              ws.send(JSON.stringify({
                type: 'speech_started',
                data: {}
              }))
            })
            
            realtimeClient.on('input_audio_buffer.speech_stopped', () => {
              console.log('Speech stopped detected')
              ws.send(JSON.stringify({
                type: 'speech_stopped',
                data: {}
              }))
            })
            
            realtimeClient.on('input_audio_buffer.committed', (event) => {
              console.log('Audio buffer committed:', event)
            })
            
            realtimeClient.on('input_audio_buffer.cleared', () => {
              console.log('Audio buffer cleared')
            })
            
            // Listen for when audio is being processed
            realtimeClient.on('conversation.item.input_audio_transcription.in_progress', (event) => {
              console.log('Transcription in progress:', event)
            })

            realtimeClient.on('response.done', (event) => {
              // Always send done signal to ensure frontend knows response is complete
              ws.send(JSON.stringify({
                type: 'response.done',
                data: {}
              }))
              
              // Reset for next response
              currentResponse = ''
              audioChunks = []
            })
            
            // Handle audio responses
            realtimeClient.on('response.audio.delta', (event) => {
              if (event.delta) {
                audioChunks.push(event.delta)
                console.log('Sending audio delta to client, length:', event.delta.length)
                ws.send(JSON.stringify({
                  type: 'response.audio.delta',
                  data: { delta: event.delta }
                }))
              }
            })
            
            realtimeClient.on('response.audio.done', () => {
              console.log('Audio response complete, total chunks:', audioChunks.length)
              ws.send(JSON.stringify({
                type: 'response.audio.done',
                data: {}
              }))
            })

            realtimeClient.on('response.text.delta', (event) => {
              if (event.delta) {
                currentResponse += event.delta
                ws.send(JSON.stringify({
                  type: 'response.audio_transcript.delta',
                  data: { delta: event.delta }
                }))
              }
            })
            
            // Track when a new response starts
            realtimeClient.on('response.created', () => {
              currentResponse = ''
              audioChunks = []
            })
            
            // Reset when receiving a new user message
            realtimeClient.on('conversation.item.created', (event) => {
              if (event.item?.role === 'user') {
                currentResponse = ''
                audioChunks = []
              }
            })

            let sessionCreated = false
            
            realtimeClient.on('session.created', () => {
              sessionCreated = true
            })

            // Add debug listener for all events
            realtimeClient.on('*', (event) => {
              if (event.type && event.type.includes('transcription')) {
                console.log('Transcription event:', event.type, event)
              }
            })
            
            try {
              await realtimeClient.connect()
              
              // Wait a bit for the connection to stabilize
              await new Promise(resolve => setTimeout(resolve, 500))
              
              // Update session after connection
              const sessionUpdate = await realtimeClient.updateSession(sessionConfig)
              console.log('Session updated:', sessionUpdate)
              
              clients.set(userId, realtimeClient)
              
              // Send auth success after everything is set up
              ws.send(JSON.stringify({ 
                type: 'auth_success', 
                message: 'Connected to Kai' 
              }))
            } catch (connectError) {
              console.error('Failed to connect to OpenAI:', connectError)
              ws.send(JSON.stringify({ 
                type: 'error', 
                message: 'Failed to connect to AI service' 
              }))
            }
          } catch (error) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Invalid token' 
            }))
          }
        } else if (data.type === 'text_message') {
          if (!realtimeClient) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Not connected to AI service'
            }))
            return
          }
          
          try {
            // Get fresh task data before each message
            const tasks = await Task.find({ userId: userId }).populate('categoryId')
            const pendingTasks = tasks.filter(t => !t.completed)
            const completedTasks = tasks.filter(t => t.completed)
            
            // Send message with fresh task context
            const taskContext = `[Current Status: ${pendingTasks.length} pending tasks, ${completedTasks.length} completed tasks]
[Pending: ${pendingTasks.map(t => `"${t.title}"${t.dueDate ? ' (due ' + new Date(t.dueDate).toLocaleDateString() + ')' : ''}`).join(', ') || 'None'}]

User: ${data.text}`
            
            realtimeClient.sendUserMessageContent([
              { type: 'input_text', text: taskContext }
            ])
            
            realtimeClient.createResponse()
          } catch (error) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Failed to send message'
            }))
          }
        } else if (data.type === 'audio_chunk' && realtimeClient) {
          if (!data.audio) {
            console.error('Received audio_chunk without audio data')
            return
          }
          
          // Convert base64 to ArrayBuffer for appendInputAudio
          const binaryString = atob(data.audio)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          
          // appendInputAudio expects ArrayBuffer or Int16Array
          realtimeClient.appendInputAudio(bytes.buffer)
        } else if (data.type === 'create_response' && realtimeClient) {
          console.log('Creating response from recorded audio')
          
          try {
            // Get the current conversation to see if there's a user message
            const items = realtimeClient.conversation.getItems()
            console.log('Current conversation items:', items.map(item => ({
              role: item.role,
              type: item.type,
              content: item.content?.map(c => ({ type: c.type, transcript: c.transcript }))
            })))
            
            // Get fresh task data for context
            const tasks = await Task.find({ userId: userId }).populate('categoryId')
            const pendingTasks = tasks.filter(t => !t.completed)
            const completedTasks = tasks.filter(t => t.completed)
            const categories = await Category.find({ user: userId })
            
            // Check if there's audio in the buffer
            console.log('Input audio buffer length:', realtimeClient.inputAudioBuffer?.byteLength || 0)
            
            // Send an event to commit the audio buffer first
            console.log('Committing audio buffer...')
            realtimeClient.realtime.send('input_audio_buffer.commit');
            
            // Wait a moment for the commit to process
            await new Promise(resolve => setTimeout(resolve, 200))
            
            // Check conversation items again
            const itemsAfterCommit = realtimeClient.conversation.getItems()
            console.log('Items after commit:', itemsAfterCommit.length)
            
            // Add task context message
            const taskContext = `CURRENT USER DATA:
- Pending tasks (${pendingTasks.length}): ${pendingTasks.map(t => `"${t.title}" (${t.categoryId?.name || 'uncategorized'}${t.dueDate ? ', due ' + new Date(t.dueDate).toLocaleDateString() : ''})`).join(', ') || 'None'}
- Completed tasks (${completedTasks.length}): ${completedTasks.map(t => `"${t.title}"`).join(', ') || 'None'}
- Categories: ${categories.map(c => c.name).join(', ') || 'None created yet'}`
            
            // Send the task context as a text message
            realtimeClient.sendUserMessageContent([
              { type: 'input_text', text: taskContext }
            ])
            
            // Then create response
            realtimeClient.createResponse()
          } catch (error) {
            console.error('Error creating audio response:', error)
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Failed to process audio'
            }))
          }
        }
      } catch (error) {
        console.error('WebSocket message processing error:', error)
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Failed to process message: ' + error.message 
        }))
      }
    })

    ws.on('close', () => {
      if (userId && clients.has(userId)) {
        const client = clients.get(userId)
        client.disconnect()
        clients.delete(userId)
      }
    })

    ws.on('error', () => {
      // Handle error silently
    })
  })

  return wss
}