import React, { useState } from 'react';
import axios from 'axios';

function UserSetup({ onClose, onUserAdded }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    tin: '',
    role: 'user',
    profile_img: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await axios.post('http://localhost:5000/api/users', form, { withCredentials: true });
      if (res.data.success) {
        setSuccess('User added successfully!');
        setForm({ name: '', email: '', password: '', tin: '', role: 'user', profile_img: '' });
        if (onUserAdded) onUserAdded();
      } else {
        setError(res.data.message || 'Failed to add user');
      }
    } catch (err) {
      setError('Failed to add user');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Add New User</h2>
        <form onSubmit={handleSubmit}>
          <label>Name:</label>
          <input name="name" value={form.name} onChange={handleChange} required />
          <label>Email:</label>
          <input name="email" value={form.email} onChange={handleChange} required type="email" />
          <label>Password:</label>
          <input name="password" value={form.password} onChange={handleChange} required type="password" />
          <label>TIN:</label>
          <input name="tin" value={form.tin} onChange={handleChange} />
          <label>Role:</label>
          <select name="role" value={form.role} onChange={handleChange}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <label>Profile Image URL:</label>
          <input name="profile_img" value={form.profile_img} onChange={handleChange} />
          <div style={{ marginTop: '15px' }}>
            <button type="submit" className="save-btn">Add User</button>
            <button type="button" className="close-btn" onClick={onClose}>Close</button>
          </div>
          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}
        </form>
      </div>
    </div>
  );
}

export default UserSetup;
