'use server'

import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import dbConnect from '@/lib/dbConnect'; // Universal database connection
import { UserModel } from '@/models/databaseSchemas'; // Mongoose model
import bcrypt from 'bcryptjs'; // Added
import { serializeData } from '@/utils/serializeData';

// In production, use environment variables
const JWT_SECRET_KEY = process.env.NEXT_PUBLIC_JWT_SECRET;
const secret = new TextEncoder().encode(JWT_SECRET_KEY);

export async function authenticateUser(username: string, password: string) {
  await dbConnect(); // Connect to the database

  try {
    const user = await UserModel.findOne({ username });

    if (!user || !user.password) {
      // User not found or password not set
      return { success: false, error: "Invalid username or password" };
    }

    // Compare hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (passwordMatch) {
      // Create JWT token using jose
      const token = await new SignJWT({ 
        username: user.username, 
        userId: user._id.toString(), 
        userClass: user.userClass,
        role: user.role // Include role in JWT payload
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d') // Token valid for 7 days
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

      // Serialize to ensure clean data without MongoDB objects
      return await serializeData({ 
        success: true, 
        username: user.username, 
        userId: user._id.toString(), 
        userClass: user.userClass,
        role: user.role // Return role on successful authentication
      });
    } else {
      // Passwords don't match
      return { success: false, error: "Invalid username or password" };
    }
  } catch {
    return { success: false, error: "Authentication failed due to a server error." };
  }
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
    // Extract all necessary fields from the token
    // Serialize to ensure no MongoDB objects cause issues
    return await serializeData({
      username: payload.username as string,
      userId: payload.userId as string,
      userClass: payload.userClass as string,
      role: payload.role as string // Extract role from JWT payload
    });
  } catch {
    // Invalid or expired token
    const cookieStore = await cookies();
    cookieStore.delete('auth_token');
    return null;
  }
}