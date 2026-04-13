'use client';

import { useState } from 'react';
import { sendNotification, sendNotificationToTopic } from '../lib/firebaseAdmin';

export default function SendNotification() {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    target: 'topic', // 'token' or 'topic'
    token: '',
    topic: 'admin', // Default topic for all admins
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const notification = {
        title: formData.title,
        message: formData.message,
        type: formData.type,
        id: Date.now(),
      };

      let response;
      if (formData.target === 'token') {
        response = await sendNotification(formData.token, notification);
      } else {
        response = await sendNotificationToTopic(formData.topic, notification);
      }

      setResult({ success: true, message: 'Notification sent successfully!' });
      setFormData({
        title: '',
        message: '',
        type: 'info',
        target: 'topic',
        token: '',
        topic: 'admin',
      });
    } catch (error) {
      setResult({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Send Notification</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Notification title"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message
          </label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Notification message"
            rows={3}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target
          </label>
          <select
            value={formData.target}
            onChange={(e) => setFormData({ ...formData, target: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="topic">Topic (All Admins)</option>
            <option value="token">Specific Token</option>
          </select>
        </div>

        {formData.target === 'token' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              FCM Token
            </label>
            <input
              type="text"
              value={formData.token}
              onChange={(e) => setFormData({ ...formData, token: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter FCM token"
              required
            />
          </div>
        )}

        {formData.target === 'topic' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Topic
            </label>
            <input
              type="text"
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter topic name (e.g., admin)"
            />
          </div>
        )}

        {result && (
          <div className={`p-3 rounded-lg ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
            {result.message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full gradient-primary text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Notification'}
        </button>
      </form>
    </div>
  );
}



