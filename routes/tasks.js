const express = require('express');
const router = express.Router();
const Task = require('../models/task');
const User = require('../models/user');

router.get('/', async (req, res) => {
  try {
    let filter = req.query.where ? JSON.parse(req.query.where) : {};
    let query = Task.find(filter);

    if (req.query.sort) query = query.sort(JSON.parse(req.query.sort));
    if (req.query.select) query = query.select(JSON.parse(req.query.select));
    if (req.query.skip) query = query.skip(parseInt(req.query.skip));
    if (req.query.limit) query = query.limit(parseInt(req.query.limit));

    if (req.query.count === 'true') {
      const count = await Task.countDocuments(filter);
      return res.status(200).json({ message: 'OK', data: count });
    }
    const tasks = await query.exec();
    res.status(200).json({ message: 'OK', data: tasks });
  } catch (err) {
    res.status(500).json({ message: 'Server error', data: err });
  }
});

router.get('/:id', async (req, res) => {
  try {
    let query = Task.findById(req.params.id);
    if (req.query.select) query = query.select(JSON.parse(req.query.select));

    const task = await query.exec();
    if (!task) return res.status(404).json({ message: 'Task not found', data: null });
    res.status(200).json({ message: 'OK', data: task });
  } catch (err) {
    res.status(500).json({ message: 'Server error', data: err });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, deadline, description, completed, assignedUser } = req.body;


    const task = new Task({
      name,
      deadline,
      description: description || "",
      completed: completed || false
    });

    if (assignedUser) {
      const user = await User.findById(assignedUser);
      if (!user)
        return res.status(400).json({ message: 'user not found', data: null });
      task.assignedUser = user._id;
      task.assignedUserName = user.name;
      await task.save();
      user.pendingTasks.push(task._id);
      await user.save();
    } else {
      await task.save();
    }
    res.status(201).json({ message: 'Task created', data: task });
  } catch (err) {
    res.status(500).json({ message: 'Server error', data: err });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, deadline, description, completed, assignedUser } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'not found', data: null });
    if (name) task.name = name;
    if (deadline) task.deadline = deadline;
    if (description !== undefined) task.description = description;
    if (completed !== undefined) task.completed = completed;
    if (assignedUser) {
      const user = await User.findById(assignedUser);
      if (task.assignedUser && task.assignedUser.toString() !== assignedUser) {
        await User.updateOne(
          { _id: task.assignedUser },
          { $pull: { pendingTasks: task._id } }
        );
      }

      task.assignedUser = user._id;
      task.assignedUserName = user.name;

      if (!user.pendingTasks.includes(task._id)) user.pendingTasks.push(task._id);
      await user.save();
    }
    await task.save();
    res.status(200).json({ message: 'Task updated', data: task });
  } catch (err) {
    res.status(500).json({ message: 'Server error', data: err });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'not found', data: null });
    if (task.assignedUser) {
      await User.updateOne(
        { _id: task.assignedUser },
        { $pull: { pendingTasks: task._id } }
      );
    }
    await task.deleteOne();
    res.status(204).json({ message: 'deleted', data: null });
  } catch (err) {
    res.status(500).json({ message: 'Server error', data: err });
  }
});

module.exports = router;
