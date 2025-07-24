import express from 'express';
import Task from '../models/Task.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user._id })
      .populate('categoryId', 'name color');
    
    // Sort pending tasks by pendingOrder, completed tasks by completedOrder
    const sortedTasks = tasks.sort((a, b) => {
      if (a.completed === b.completed) {
        return a.completed 
          ? (a.completedOrder || 0) - (b.completedOrder || 0)
          : (a.pendingOrder || 0) - (b.pendingOrder || 0);
      }
      return a.completed ? 1 : -1;
    });
    
    res.json(sortedTasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    // New tasks are always pending, so we need the highest pendingOrder
    const highestPendingOrder = await Task.findOne({ 
      userId: req.user._id,
      completed: false 
    })
      .sort({ pendingOrder: -1 })
      .select('pendingOrder');
    
    const newPendingOrder = highestPendingOrder ? highestPendingOrder.pendingOrder + 1 : 0;
    
    const task = new Task({
      title: req.body.title,
      userId: req.user._id,
      pendingOrder: newPendingOrder,
      completedOrder: 0,
      dueDate: req.body.dueDate || null,
      categoryId: req.body.categoryId || null
    });
    const newTask = await task.save();
    await newTask.populate('categoryId', 'name color');
    res.status(201).json(newTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/reorder', auth, async (req, res) => {
  try {
    const { taskId, newOrder: newIndex, isCompleted } = req.body;
    
    // Get tasks filtered by completion status
    const tasks = await Task.find({ 
      userId: req.user._id,
      completed: isCompleted || false
    }).sort(isCompleted ? { completedOrder: 1 } : { pendingOrder: 1 });
    
    const taskIndex = tasks.findIndex(t => t._id.toString() === taskId);
    
    if (taskIndex === -1) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    if (taskIndex === newIndex) {
      const allTasks = await Task.find({ userId: req.user._id })
        .populate('categoryId', 'name color');
      return res.json(allTasks);
    }
    
    // Reorder within the same completion status
    const movedTask = tasks[taskIndex];
    tasks.splice(taskIndex, 1);
    tasks.splice(newIndex, 0, movedTask);
    
    // Update orders based on completion status
    const orderField = isCompleted ? 'completedOrder' : 'pendingOrder';
    const updates = tasks.map((task, index) => ({
      updateOne: {
        filter: { _id: task._id },
        update: { $set: { [orderField]: index } }
      }
    }));
    
    await Task.bulkWrite(updates);
    
    const updatedTasks = await Task.find({ userId: req.user._id })
      .populate('categoryId', 'name color');
    res.json(updatedTasks);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    await task.deleteOne();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    if (req.body.title !== undefined) {
      task.title = req.body.title;
    }
    if (req.body.completed !== undefined && task.completed !== req.body.completed) {
      task.completed = req.body.completed;
      
      // When marking as completed, get highest completedOrder
      if (req.body.completed) {
        const highestCompleted = await Task.findOne({ 
          userId: req.user._id,
          completed: true,
          _id: { $ne: task._id }
        })
          .sort({ completedOrder: -1 })
          .select('completedOrder');
        
        task.completedOrder = highestCompleted ? highestCompleted.completedOrder + 1 : 0;
      } else {
        // When marking as pending, get highest pendingOrder
        const highestPending = await Task.findOne({ 
          userId: req.user._id,
          completed: false,
          _id: { $ne: task._id }
        })
          .sort({ pendingOrder: -1 })
          .select('pendingOrder');
        
        task.pendingOrder = highestPending ? highestPending.pendingOrder + 1 : 0;
      }
    }
    if (req.body.dueDate !== undefined) {
      task.dueDate = req.body.dueDate;
    }
    if (req.body.categoryId !== undefined) {
      task.categoryId = req.body.categoryId;
    }
    
    const updatedTask = await task.save();
    await updatedTask.populate('categoryId', 'name color');
    res.json(updatedTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;