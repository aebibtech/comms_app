// src/components/Home.js
import React from 'react';

const Home = () => {
  return (
    <div style={styles.container}>
      <h1>Welcome to Communications App</h1>
      <p>Start by registering or logging in!</p>
    </div>
  );
};

const styles = {
  container: {
    textAlign: 'center',
    padding: '2rem',
  },
  button: {
    display: 'inline-block',
    margin: '10px',
    padding: '10px',
    backgroundColor: '#007bff',
    color: 'white',
    borderRadius: '4px',
    textDecoration: 'none',
  },
};

export default Home;
