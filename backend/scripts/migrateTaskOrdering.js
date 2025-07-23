import mongoose from 'mongoose'
import Task from '../models/Task.js'
import dotenv from 'dotenv'

dotenv.config()

async function migrateTaskOrdering() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yupix-todo')
    console.log('Connected to MongoDB')
    
    // Get all unique users
    const users = await Task.distinct('userId')
    
    for (const userId of users) {
      console.log(`Migrating tasks for user: ${userId}`)
      
      // Get all tasks for this user
      const tasks = await Task.find({ userId }).sort({ order: 1 })
      
      // Separate pending and completed tasks
      const pendingTasks = tasks.filter(t => !t.completed)
      const completedTasks = tasks.filter(t => t.completed)
      
      // Update pending tasks with pendingOrder
      for (let i = 0; i < pendingTasks.length; i++) {
        await Task.updateOne(
          { _id: pendingTasks[i]._id },
          { 
            $set: { 
              pendingOrder: i,
              completedOrder: 0
            }
          }
        )
      }
      
      // Update completed tasks with completedOrder
      for (let i = 0; i < completedTasks.length; i++) {
        await Task.updateOne(
          { _id: completedTasks[i]._id },
          { 
            $set: { 
              completedOrder: i,
              pendingOrder: 0
            }
          }
        )
      }
      
      console.log(`Updated ${pendingTasks.length} pending and ${completedTasks.length} completed tasks`)
    }
    
    console.log('Migration completed successfully')
    process.exit(0)
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

migrateTaskOrdering()