import React, { useState } from "react";
import axios from "axios";
import './Login.css'; // Assuming you're using a separate CSS file for styling
import Bear from "./Bear";

const Login = ({ setToken, setRole }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isTypingUsername, setIsTypingUsername] = useState(false);
  const [isTypingPassword, setIsTypingPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://127.0.0.1:8000/token", 
        new URLSearchParams({ username, password }), 
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("role", response.data.role);
      setToken(response.data.access_token);
      setRole(response.data.role);
    } catch (err) {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        <Bear isTypingUsername={isTypingUsername} isTypingPassword={isTypingPassword} />
        <h2>Login</h2>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleLogin}>
          <input 
            type="text" 
            placeholder="Username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
            className="input-field"
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            className="input-field"
          />
          <button type="submit" className="login-btn">Login</button>
        </form>
      </div>
    </div>
  );
};

export default Login;

