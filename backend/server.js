require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const aiRoutes = require("./routes/aiRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const newsRoutes = require("./routes/newsRoutes");

const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// Cấu hình danh sách các URL được phép truy cập server
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:3000"
].filter(Boolean); // Loại bỏ các giá trị undefined nếu chưa cấu hình biến môi trường

// 1. Cấu hình CORS cho Socket.io
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      // Cho phép nếu không có origin (như Postman/Mobile) hoặc thuộc danh sách allowedOrigins
      if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.includes("onrender.com")) {
        callback(null, true);
      } else {
        callback(new Error("Bị chặn bởi Socket CORS"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true // Bắt buộc nếu frontend có truyền cookie/token authen
  },
});

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("Một thiết bị đã kết nối: " + socket.id);

  socket.on("register_user", (userId) => {
    if (userId) {
      onlineUsers.set(userId, socket.id);
      console.log(
        `Người dùng ${userId} đã đăng ký với socket ID: ${socket.id}`,
      );
    }
  });

  socket.on("disconnect", () => {
    for (let [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        console.log(
          `Người dùng ${userId} đã ngắt kết nối và bị xóa khỏi danh sách online.`,
        );
        break;
      }
    }
  });
});

app.set("io", io);
app.set("onlineUsers", onlineUsers);

// 2. Cấu hình CORS cho Express API (Thay thế cho app.use(cors()) cũ)
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.includes("onrender.com")) {
      callback(null, true);
    } else {
      callback(new Error("Bị chặn bởi Express CORS"));
    }
  },
  credentials: true
}));

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/news", newsRoutes);

app.get("/", (req, res) => {
  res.send("API Running");
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

startServer();