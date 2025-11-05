const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  name: { type: String, required: true },
  deadline: { type: Date, required: true },
  completed: { type: Boolean, default: false },
  assignedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedUserName: String,
  description: { type: String, default: "" },
  dateCreated: { type: Date, default: Date.now }

});

module.exports = mongoose.model('Task', TaskSchema);
