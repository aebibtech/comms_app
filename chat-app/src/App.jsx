// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Chat from './components/Chat';
import Login from './components/Login';
import Register from './components/Register';
import MailClient from "./components/MailClient";
import EmailList from './components/EmailList';
import ViewEmail from './components/ViewEmail';
import SmsClient from './components/SmsClient';
import SmsInbox from './components/SmsInbox';
import SmsView from './components/SmsView';
import VirtualPhone from './components/VirtualPhone';

const App = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/mail" element={<MailClient />} />
        <Route path="/inbox" element={<EmailList />} />
        <Route path="/view-email/:emailId" element={<ViewEmail />} />
        <Route path="/sms" element={<SmsClient />} />
        <Route path="/smsinbox" element={<SmsInbox />} />
        <Route path="/smsinbox/:sid" element={<SmsView />} />
        <Route path="/virtual-phone" element={<VirtualPhone />} />
      </Routes>
    </Router>
  );
};

export default App;
