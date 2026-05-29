import { createContext, useContext, useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { getToken, isSignedIn, userId, isLoaded } = useAuth();
  const { user: clerkUser } = useUser();
  const [user, setUser] = useState(null); // thông tin user từ DB của mình
  const [role, setRole] = useState(null); // "user" | "admin"
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) {
      setLoading(true);
      return;
    }

    if (!isSignedIn) {
      setUser(null);
      setRole(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    // Khi Clerk đăng nhập xong → lấy JWT rồi gửi lên backend để đồng bộ user
    const syncUser = async () => {
      try {
        const token = await getToken();
        if (!token) {
          console.warn("[AuthContext] No Clerk token available, skipping sync");
          setLoading(false);
          return;
        }

        const email =
          clerkUser?.primaryEmailAddress?.emailAddress ||
          clerkUser?.emailAddresses?.[0]?.emailAddress ||
          "";
        const fullName =
          clerkUser?.fullName ||
          `${clerkUser?.firstName || ""} ${clerkUser?.lastName || ""}`.trim() ||
          clerkUser?.username ||
          "";
        const avatar = clerkUser?.imageUrl || "";

        const res = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/auth/sync`,
          {
            email,
            fullName,
            avatar,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        console.log("[AuthContext] sync response:", res.data);
        setUser(res.data.user);
        setRole(res.data.user.role);
        console.log("Role set from backend:", res.data.user.role);
      } catch (err) {
        const status = err.response?.status;
        const data = err.response?.data;

        if (status === 401) {
          console.warn("[AuthContext] Backend rejected Clerk token", data);
          setUser(null);
          setRole(null);
          return;
        }

        console.error("[AuthContext] Sync user failed:", data || err.message);
      } finally {
        setLoading(false);
      }
    };

    syncUser();
  }, [isLoaded, isSignedIn, userId, clerkUser, getToken]);

  // Hàm helper: gọi API có kèm JWT tự động
  const authAxios = async () => {
    const token = await getToken();

    if (!token) {
      throw new Error("No Clerk token available");
    }

    return axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL,
      headers: { Authorization: `Bearer ${token}` },
    });
  };

  const isAdmin = role === "admin";

  return (
    <AuthContext.Provider value={{ user, role, loading, isAdmin, authAxios }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
