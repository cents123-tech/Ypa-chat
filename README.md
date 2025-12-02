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

```bash
# Backend
cd server
npm install
npm run dev

# Frontend
cd client
npm install
npm run dev
