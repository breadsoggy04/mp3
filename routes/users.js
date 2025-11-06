const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Task = require('../models/task');

router.get('/', async (req, res) => {
  try {
    let filter = req.query.where ? JSON.parse(req.query.where) : {};
    let query = User.find(filter);
    if (req.query.sort) query = query.sort(JSON.parse(req.query.sort));
    if (req.query.select) query = query.select(JSON.parse(req.query.select));
    if (req.query.skip) query = query.skip(parseInt(req.query.skip));
    if (req.query.limit) query = query.limit(parseInt(req.query.limit));
    if (req.query.count === 'true') {
      const count = await User.countDocuments(filter);
      return res.status(200).json({ message: 'OK', data: count });
    }
    const users = await query.exec();
    res.status(200).json({ message: 'OK', data: users });
  } catch (err) {
    res.status(500).json({ message: 'Server error', data: err });
  }
});

router.get('/:id', async (req, res) => {
  try {
    let query = User.findById(req.params.id);
    if (req.query.select) query = query.select(JSON.parse(req.query.select));
    const user = await query.exec();

    if (!user) return res.status(404).json({ message: 'User not found', data: null });
    res.status(200).json({ message: 'OK', data: user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', data: err });
  }
});


router.post('/', async (req, res) => {
  try {
    const { name, email } = req.body;
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: 'already exists', data: null });

    const user = new User({ name, email }); 
    await user.save();
    res.status(201).json({ message: 'User created', data: user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', data: err });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, email, pendingTasks } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found', data: null });
    const existing = await User.findOne({ email, _id: { $ne: user._id } });
    if (existing)
      return res.status(400).json({ message: 'Email already exists', data: null });
    user.name = name;
    user.email = email;
    if (pendingTasks) user.pendingTasks = pendingTasks;
    await user.save();

    res.status(200).json({ message: 'updated', data: user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', data: err });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'not found', data: null });
    await Task.updateMany(
      { assignedUser: user._id },
      { $set: { assignedUser: null, assignedUserName: 'unassigned' } }
    );
    await user.deleteOne();
    res.status(204).json({ message: 'User deleted', data: null });
  } catch (err) {
    res.status(500).json({ message: 'Server error', data: err });
  }
});
module.exports = router;
