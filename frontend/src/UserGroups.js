import React, { useState } from 'react';
import axios from 'axios';

function UserGroups({ onClose, onGroupAdded }) {
  const [groupName, setGroupName] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!groupName.trim()) {
      setError('Group name required');
      return;
    }
    try {
      const res = await axios.post('http://localhost:5000/api/groups', { name: groupName }, { withCredentials: true });
      if (res.data.success) {
        setSuccess('Group created: ' + groupName);
        setGroupName('');
        if (onGroupAdded) onGroupAdded();
      } else {
        setError(res.data.message || 'Failed to create group');
      }
    } catch (err) {
      setError('Failed to create group');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Create User Group</h2>
        <form onSubmit={handleSubmit}>
          <label>Group Name:</label>
          <input value={groupName} onChange={e => setGroupName(e.target.value)} required />
          <div style={{ marginTop: '15px' }}>
            <button type="submit" className="save-btn">Create Group</button>
            <button type="button" className="close-btn" onClick={onClose}>Close</button>
          </div>
          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}
        </form>
      </div>
    </div>
  );
}

export default UserGroups;
