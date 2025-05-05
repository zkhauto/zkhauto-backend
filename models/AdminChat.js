import mongoose from 'mongoose';

const adminChatSchema = new mongoose.Schema({
  sender: {
    type: String,
    required: true,
    enum: ['user', 'admin']
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const AdminChat = mongoose.model('AdminChat', adminChatSchema);

export default AdminChat; 