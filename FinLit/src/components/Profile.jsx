import { useState, useEffect } from "react";
import "../styles/Profile.css";

const avatarOptions = [
  "/avatars/avatar1.png",
  "/avatars/avatar2.png",
  "/avatars/avatar3.png",
  "/avatars/avatar4.png",
  "/avatars/avatar5.png",
  "/avatars/avatar6.png",
];

function Profile() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({ username: "", avatar: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      setUser(storedUser);
      setFormData({ username: storedUser.username, avatar: storedUser.avatar });
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch("http://localhost:5900/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, username: formData.username, avatar: formData.avatar }),
    });

    const data = await res.json();
    setMessage(data.message);
    localStorage.setItem("user", JSON.stringify(data.user)); // Update local storage
  };

  return (
    <div className="profile-container">
      <h2>Edit Profile</h2>

      {/* Display selected avatar */}
      <div className="avatar-preview">
        <img src={formData.avatar || "/avatars/avatar1.png"} alt="Selected Avatar" width="100" />
      </div>

      <form onSubmit={handleSubmit} className="profile-form">
        <label>Username</label>
        <input 
          type="text" 
          name="username" 
          value={formData.username} 
          onChange={(e) => setFormData({ ...formData, username: e.target.value })} 
          required 
        />

        <h3>Select an Avatar</h3>
        <div className="avatar-selection">
          {avatarOptions.map((avatar, index) => (
            <img 
              key={index} 
              src={avatar} 
              alt={`Avatar ${index + 1}`} 
              width="50" 
              className={formData.avatar === avatar ? "selected-avatar" : ""}
              onClick={() => setFormData({ ...formData, avatar })} 
            />
          ))}
        </div>

        <button type="submit">Save Changes</button>
      </form>

      {message && <p className="message">{message}</p>}
    </div>
  );
}

export default Profile;
