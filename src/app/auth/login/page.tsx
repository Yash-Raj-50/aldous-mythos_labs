'use client'

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Tooltip } from "@mui/material";
import Logo from "../../../assets/New_Aldous_Logo_Blue.png";
import Image from "next/image";

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const success = await login(username, password);
      if (success) {
        router.push('/');
      } else {
        setError('Invalid username or password');
      }
    } catch {
      setError('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#253A5C] text-white min-h-screen w-screen flex items-center justify-center">
      <div className="border flex flex-col md:flex-row items-center justify-center bg-white text-[#253A5C] p-8 md:h-1/2">
        <div className="md:w-[30vw] md:border-r-4 md:border-b-0 border-[#253A5C] h-full flex flex-col items-center justify-center border-b-4">
          <Image 
            src={Logo} 
            alt="Aldous Logo" 
            priority
            className="object-contain h-full w-full"
          />
        </div>
        <div className="md:w-[30vw] p-16 h-full flex flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-bold mb-4">Login to the Console</h1>
          {error && (
            <div className="bg-red-500 text-[#253A5C] p-2 rounded mb-4 text-sm w-full text-center">
              {error}
            </div>
          )}
          <form className="flex flex-col my-4 items-center w-full" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Username"
              className="mb-4 p-2 px-4 rounded border w-full text-[#253A5C]"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="mb-4 p-2 px-4 rounded border w-full text-[#253A5C]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className={`bg-[#253A5C] text-white my-2 p-2 px-4 w-full rounded font-bold ${
                isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-200'
              } transition duration-300`}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <div className="">
            <Tooltip title="Please contact the administrator for password reset" arrow placement="top">
              <span className="text-[#253A5C]/75 hover:text-[#253A5C] transition duration-300 cursor-pointer">
                Forgot Password?
              </span>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;