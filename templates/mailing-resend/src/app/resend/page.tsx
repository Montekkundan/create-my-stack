'use client';

import React from 'react';


export default function ResendTestPage() {
  const handleClick = async () => {
    try {
      const response = await fetch('/api/send', {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok) {
        alert('Email sent successfully! Response: ' + JSON.stringify(data));
      } else {
        alert('Failed to send email. Error: ' + JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('An error occurred while sending the email.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Test Resend Email</h1>
      <button type="button" onClick={handleClick} className="cursor-pointer rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">
        Send Test Email
      </button>
    </div>
  );
}
