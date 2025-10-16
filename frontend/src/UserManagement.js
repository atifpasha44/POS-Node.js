import React, { useEffect, useState } from 'react';
import axios from 'axios';

function UserManagement({ onClose }) {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [assignMsg, setAssignMsg] = useState('');

  useEffect(() => {
    axios.get('/api/user-setup', { withCredentials: true })
      .then(res => { if (res.data.success) setUsers(res.data.data); });
    axios.get('/api/user-groups', { withCredentials: true })
      .then(res => { if (res.data.success) setGroups(res.data.data); });
  }, []);

  const handleAssign = async () => {
    setAssignMsg('');
    if (!selectedUser || !selectedGroup) {
      setAssignMsg('Select user and group');
      return;
    }
    try {
      const res = await axios.post('/api/user-groups/assign', { userId: selectedUser, groupId: selectedGroup }, { withCredentials: true });
      if (res.data.success) setAssignMsg('User assigned to group!');
      else setAssignMsg(res.data.message || 'Failed to assign');
    } catch {
      setAssignMsg('Failed to assign');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>User Management</h2>
        <div>
          <h3>Users</h3>
          <ul>
            {users.map(u => (
              <li key={u.id}>{u.name} ({u.email}) - {u.role}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>User Groups</h3>
          <ul>
            {groups.map(g => (
              <li key={g.id}>{g.name}</li>
            ))}
          </ul>
        </div>
        <div style={{ marginTop: '20px' }}>
          <h3>Assign User to Group</h3>
          <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
            <option value="">Select User</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)} style={{ marginLeft: '10px' }}>
            <option value="">Select Group</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <button onClick={handleAssign} className="save-btn" style={{ marginLeft: '10px' }}>Assign</button>
          {assignMsg && <div style={{ marginTop: '10px', color: assignMsg.includes('assign') ? 'red' : 'green' }}>{assignMsg}</div>}
        </div>
        <button onClick={onClose} className="close-btn" style={{ marginTop: '20px' }}>Close</button>
      </div>
    </div>
  );
}

export default UserManagement;
