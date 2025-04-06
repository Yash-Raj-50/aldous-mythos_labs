'use server'

import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

// In production, use environment variables
const JWT_SECRET_KEY = process.env.NEXT_PUBLIC_JWT_SECRET || 'aldous-mythos-labs-jwt-secret-key-2023';
const secret = new TextEncoder().encode(JWT_SECRET_KEY);

const default_username = 'mythoslabs';
const default_password = 'mythosdev_1';

export async function authenticateUser(username: string, password: string) {
  // Validate credentials - hardcoded for now
  if (username === default_username && password === default_password) {
    // Create JWT token using jose
    const token = await new SignJWT({ username })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret);
    
    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
      sameSite: 'strict',
    });
    
    return { success: true, username };
  }
  
  return { success: false };
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
  return { success: true };
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  
  if (!token) {
    return null;
  }
  
  try {
    const { payload } = await jwtVerify(token, secret);
    return { username: payload.username as string };
  } catch (error) {
    // Invalid or expired token
    const cookieStore = await cookies();
    cookieStore.delete('auth_token');
    return null;
  }
}