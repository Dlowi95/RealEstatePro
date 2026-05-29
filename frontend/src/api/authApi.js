import axios from "axios";

// Tự động kiểm tra môi trường dựa vào hostname của trình duyệt
const isProduction = window.location.hostname !== "localhost";

const BASE_URL = isProduction 
  ? "https://realestatepro-i7d3.onrender.com" // URL Backend trên Render của bạn
  : "http://localhost:5000";                  // Khi chạy dưới máy local

const API = `${BASE_URL}/api/auth`;

export const saveUserToDB = async (userData) => {
  try {
    const response = await axios.post(`${API}/register`, userData);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi gọi API saveUserToDB:", error.response?.data || error.message);
    // Trả về một object mặc định hoặc null thay vì để crash ứng dụng
    return { success: false, error: error.message };
  }
};