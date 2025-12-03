# YPA Chat App

Real-time chat application for YPA Enterprise (Goat farming & dairy business).  
Customers talk only to Admin (CEO). Admin controls everything.

## Features
- Register / Login
- Users chat only with Admin 
- Send text, images, videos, audio
- Admin sees all users (online/offline)
- Admin can add or delete users
- Dark/Light mode

## Screens
1. Register → Create account (first user becomes Admin)
2. Login → Enter email & password
3. User Dashboard → Chat with Admin
4. Admin Dashboard → See all users + chat + manage

## Tech
- Frontend: React + Vite
- Backend: Node.js + Express
- Real-time: Socket.io
- Database: MongoDB
- Auth: JWT

## Quick Start
##**start the server**
Navigate to the server folder and type node index.js
After the server starts

Start the frontend'
Navigate to the ypa-chart and type npm run dev
After the code the front end will start at the https//:localhost 5173 in the browser.

**##Registration and Login**
One should register first inorder to login
Login details are the one to be used at the login page.
There should be only one admin registered and logged in 
Users can be many as preferred.

