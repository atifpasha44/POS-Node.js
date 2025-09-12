import React, { useState } from 'react';
import './ProfileModal.css';


function ProfileModal({ user, onClose, onSave }) {
  const [editUser, setEditUser] = useState(user);
  const [editing, setEditing] = useState(false);
  const isAdmin = user.role === 'admin' || user.isAdmin;

  const handleChange = (e) => {
    setEditUser({ ...editUser, [e.target.name]: e.target.value });
  };

  const handleEdit = () => setEditing(true);
  const handleCancel = () => {
    setEditUser(user);
    setEditing(false);
  };
  const handleSave = () => {
    onSave(editUser);
    setEditing(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>User Profile</h2>
        <div className="profile-details">
          <label>Name:</label>
          {editing ? (
            <input name="name" value={editUser.name} onChange={handleChange} />
          ) : (
            <span>{editUser.name}</span>
          )}
          <label>Email:</label>
          {editing ? (
            <input name="email" value={editUser.email} onChange={handleChange} />
          ) : (
            <span>{editUser.email}</span>
          )}
          <label>TIN:</label>
          {editing ? (
            <input name="tin" value={editUser.tin} onChange={handleChange} />
          ) : (
            <span>{editUser.tin}</span>
          )}
          <label>Role:</label>
          <span>{editUser.role || (editUser.isAdmin ? 'Admin' : 'User')}</span>
        </div>
        <div className="modal-actions">
          {isAdmin && (editing ? (
            <>
              <button onClick={handleSave} className="save-btn">Save</button>
              <button onClick={handleCancel} className="cancel-btn">Cancel</button>
            </>
          ) : (
            <button onClick={handleEdit} className="edit-btn">Edit</button>
          ))}
          <button onClick={onClose} className="close-btn">Close</button>
        </div>
      </div>
    </div>
  );
}

export default ProfileModal;
