import "./App.css";
import { useState, useEffect, FormEvent } from "react";
import axios, { AxiosError } from "axios";
import Chat from "./components/Chat";
import toast, { Toaster } from 'react-hot-toast';

const API_URL = "https://energized-sparkle-7c45b9ab8e.strapiapp.com";

interface User {
  id: number;
  username: string;
  email: string;
}

interface LoginResponse {
  jwt: string;
  user: User;
}

// Simple loader component
const Loader = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#fe5f59]"></div>
  </div>
);

function App() {
  const [isSignUp, setIsSignUp] = useState(true);
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [user, setUser] = useState<User | null>(null);
  const [errors, setErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(true);

  const toggleSignUp = () => {
    setIsSignUp((prev) => !prev);
    setErrors({});
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchUser(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUser = async (token: string) => {
    setIsLoading(true);
    try {
      const response = await axios.get<User>(`${API_URL}/api/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUser(response.data);
    } catch (error) {
      console.error("Error fetching user:", error);
      localStorage.removeItem("token");
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (isSignUp && !username.trim()) {
      newErrors.username = "Username is required";
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Invalid email address";
    }
    if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await axios.post<LoginResponse>(
        `${API_URL}/api/auth/local/register`,
        { username, email, password }
      );
      const token = response.data.jwt;
      localStorage.setItem("token", token);
      setUser(response.data.user);
      toast.success("Sign up successful!");
    } catch (error) {
      console.error("An error occurred:", (error as AxiosError).response);
      toast.error("Sign up failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await axios.post<LoginResponse>(
        `${API_URL}/api/auth/local`,
        { identifier: email, password }
      );
      const token = response.data.jwt;
      localStorage.setItem("token", token);
      setUser(response.data.user);
      toast.success("Login successful!");
    } catch (error) {
      console.error("An error occurred:", (error as AxiosError).response);
      toast.error("Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("token");
    toast.success("Logged out successfully");
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="">
      <Toaster position="top-right" />
      {user ? (
        <div className="">
          <p className="text-3xl font-semibold text-center">Welcome, {user.username}!</p>
          <button className="bg-[#fe5f59] w-fit mx-auto py-2 px-6 rounded-lg font-semibold my-4 text-sm" onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <div className="mt-10">
          {isSignUp ? (
            <div className="flex flex-col shadow-xl bg-[#424242] w-full max-w-[430px] p-4 rounded-xl mx-auto">
              <p className="text-3xl font-semibold my-4">Sign Up</p>
              <form onSubmit={handleSignUp} className="flex flex-col gap-4">
                <div>
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="rounded-lg py-3 px-4 bg-[#565656] w-full"
                  />
                  {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-lg py-3 px-4 bg-[#565656] w-full"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-lg py-3 px-4 bg-[#565656] w-full"
                  />
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                </div>
                <button type="submit" className="bg-[#fe5f59] w-fit mx-auto py-2 px-6 rounded-lg font-semibold">Sign Up</button>
                <p onClick={toggleSignUp} className="cursor-pointer text-gray-300">Already have an account? Log in!</p>
              </form>
            </div>
          ) : (
            <div className="flex flex-col shadow-xl bg-[#424242] w-full max-w-[430px] p-4 rounded-xl mx-auto">
              <p className="text-3xl font-semibold my-4">Login</p>
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div>
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-lg py-3 px-4 bg-[#565656] w-full"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-lg py-3 px-4 bg-[#565656] w-full"
                  />
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                </div>
                <button type="submit" className="bg-[#fe5f59] w-fit mx-auto py-2 px-6 rounded-lg font-semibold">Login</button>
                <p onClick={toggleSignUp} className="cursor-pointer text-gray-300">Don't have an account? Sign Up!</p>
              </form>
            </div>
          )}
        </div>
      )}
      {user && <Chat userId={user?.id || 1} username={user?.username || ""} />}
    </div>
  );
}

export default App;