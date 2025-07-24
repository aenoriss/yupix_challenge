import OpenAI from 'openai'
import Task from '../models/Task.js'
import Category from '../models/Category.js'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export const askKai = async (req, res) => {
  try {
    const { question } = req.body
    const userId = req.user._id

    const tasks = await Task.find({ user: userId }).populate('categoryId')
    const categories = await Category.find({ user: userId })

    const systemPrompt = `You are Kai, a helpful AI assistant for a todo application. You help users manage their tasks efficiently.
    
Current user's tasks: ${JSON.stringify(tasks.map(t => ({
      title: t.title,
      completed: t.completed,
      dueDate: t.dueDate,
      category: t.categoryId?.name
    })))}

Available categories: ${categories.map(c => c.name).join(', ')}

Provide helpful, concise responses about task management, productivity tips, or answer questions about the user's tasks.`

    const completion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question }
      ],
      model: 'gpt-4-turbo-preview',
      temperature: 0.7,
      max_tokens: 300
    })

    res.json({
      success: true,
      response: completion.choices[0].message.content
    })
  } catch (error) {
    console.error('AI Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to process AI request'
    })
  }
}

export const processVoiceCommand = async (req, res) => {
  try {
    const { audioData } = req.body
    const userId = req.user._id

    const mockTranscription = "Show me my pending tasks"
    
    const tasks = await Task.find({ user: userId }).populate('categoryId')
    const pendingTasks = tasks.filter(t => !t.completed)
    
    let action = 'answer'
    let response = ''
    
    if (mockTranscription.toLowerCase().includes('pending') || mockTranscription.toLowerCase().includes('todo')) {
      action = 'list_tasks'
      response = `You have ${pendingTasks.length} pending tasks${pendingTasks.length > 0 ? ': ' + pendingTasks.slice(0, 3).map(t => t.title).join(', ') : '.'}`
    } else if (mockTranscription.toLowerCase().includes('create') || mockTranscription.toLowerCase().includes('add')) {
      action = 'create_task'
      response = 'Task creation via voice is coming soon! For now, please use the text input.'
    } else {
      response = `I heard: "${mockTranscription}". Voice commands are currently in beta. You can ask about your pending tasks or I can help you via text.`
    }

    res.json({
      success: true,
      transcription: mockTranscription,
      action,
      response
    })
  } catch (error) {
    console.error('Voice processing error:', error)
    res.status(500).json({
      success: false,
      message: 'Voice processing is currently in beta. Please try text input instead.'
    })
  }
}