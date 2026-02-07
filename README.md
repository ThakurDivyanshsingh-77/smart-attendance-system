# samrt-attendance

# 🎓 Smart Attendance Management System

A **full-stack Smart Attendance Management System** designed for colleges to manage attendance securely and efficiently using **role-based access**, **session codes**, and **real-time tracking**.

This project is suitable for **BCA / MCA final year projects** and demonstrates real-world implementation of modern web technologies.

---

## 🚀 Features

### 👥 User Roles
- **Admin**
- **Teacher**
- **Student**

---

### 🔐 Authentication & Security
- JWT based authentication
- Role-based authorization (Admin / Teacher / Student)
- Password hashing using bcrypt
- Protected routes (backend + frontend guards)

---

### 🧑‍🏫 Teacher Module
- Secure login
- View assigned subjects (Year / Semester wise)
- Start attendance session
- Auto-generated **4-digit session code**
- Session expiry (default: 10 minutes)
- View live attendance
- End attendance session manually
- View attendance history & statistics

---

### 🧑‍🎓 Student Module
- Secure login
- Select Year, Semester & Subject
- View active attendance sessions
- Enter session code provided by teacher
- Attendance marked instantly
- View personal attendance history

---

### 🧑‍💼 Admin Module
- Add teachers manually
- Manage students
- Assign subjects to teachers
- Monitor overall attendance data

---

## 🛠️ Tech Stack

### Frontend
- Angular
- Angular Material
- RxJS
- Socket.IO (real-time updates)

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Socket.IO

### Tools
- Nodemon
- dotenv
- Postman (API testing)

---

## 📂 Project Structure

```txt
smart-attendance/
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── config/
│   ├── server.js
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/
│   │   │   ├── features/
│   │   │   └── shared/
│   └── environments/
│
└── README.md
