'use server';

import dbConnect from '@/lib/dbConnect';
import { UserModel, AgentModel } from '@/models/databaseSchemas';
import bcrypt from 'bcryptjs';
import type { ClientData, AgentData } from '@/types/applicationTypes';
import { serializeData } from '@/utils/serializeData';

// Fetch all clients (clients and superusers)
export async function fetchClients(): Promise<ClientData[]> {
  await dbConnect();
  const raw = await UserModel.find({ userClass: { $in: ['client', 'superuser'] } }).lean();
  const list = await serializeData(raw as Record<string, unknown>[]);
  return list.map(item => ({
    _id: String(item._id),
    username: String(item.username),
    userClass: item.userClass as 'client' | 'superuser',
    profilePic: item.profilePic ? String(item.profilePic) : undefined,
    agents: Array.isArray(item.agents) ? item.agents.map((a: string | import('mongoose').Types.ObjectId) => String(a)) : [],
  }));
}

// Create a client
export async function createClient(data: { username: string; password: string; userClass: string; agents: string[]; profilePic?: string }): Promise<ClientData> {
  await dbConnect();
  const hashed = await bcrypt.hash(data.password, 10);
  const doc = new UserModel({
    username: data.username,
    password: hashed,
    userClass: data.userClass,
    agents: data.agents,
    profilePic: data.profilePic,
  });
  await doc.save();
  const saved = doc.toObject();
  return {
    _id: String(saved._id),
    username: saved.username,
    userClass: saved.userClass,
    profilePic: saved.profilePic,
    agents: Array.isArray(saved.agents) ? (saved.agents as (string | import('mongoose').Types.ObjectId)[]).map(a => a.toString()) : [],
  };
}

// Update a client
export async function updateClient(id: string, data: Partial<{ username: string; password: string; userClass: string; agents: string[]; profilePic?: string }>): Promise<ClientData> {
  await dbConnect();
  const update: Record<string, unknown> = { ...data };
  if (data.password) {
    update.password = await bcrypt.hash(data.password, 10);
  }
  const raw = await UserModel.findByIdAndUpdate(id, update, { new: true }).lean();
  const item = await serializeData([raw] as Record<string, unknown>[]);
  const u = item[0];
  return {
    _id: String(u._id),
    username: String(u.username),
    userClass: u.userClass as 'client' | 'superuser',
    profilePic: u.profilePic ? String(u.profilePic) : undefined,
    agents: Array.isArray(u.agents) ? (u.agents as (string | import('mongoose').Types.ObjectId)[]).map(a => a.toString()) : [],
  };
}

// Delete a client
export async function deleteClient(id: string): Promise<{ success: boolean }> {
  await dbConnect();
  await UserModel.findByIdAndDelete(id);
  return { success: true };
}

// Fetch all agents
export async function fetchAgents(): Promise<AgentData[]> {
  await dbConnect();
  const raw = await AgentModel.find().lean();
  const list = await serializeData(raw as Record<string, unknown>[]);
  return list.map(item => ({
    _id: String(item._id),
    name: String(item.name),
    aiModel: String(item.aiModel),
    prompt: String(item.prompt),
    phone: item.phone ? String(item.phone) : undefined,
    socialID: item.socialID ? String(item.socialID) : undefined,
    activeStatus: Boolean(item.activeStatus),
    icon: item.icon ? String(item.icon) : undefined,
  }));
}

// Create agent
export async function createAgent(data: Omit<AgentData, '_id'>): Promise<AgentData> {
  await dbConnect();
  const doc = new AgentModel({ ...data });
  await doc.save();
  const saved = doc.toObject();
  return {
    _id: String(saved._id),
    name: saved.name,
    aiModel: saved.aiModel,
    prompt: saved.prompt,
    phone: saved.phone,
    socialID: saved.socialID,
    activeStatus: saved.activeStatus,
    icon: saved.icon,
  };
}

// Update agent
export async function updateAgent(id: string, data: Partial<Omit<AgentData, '_id'>>): Promise<AgentData> {
  await dbConnect();
  const raw = await AgentModel.findByIdAndUpdate(id, data, { new: true }).lean();
  const item = await serializeData([raw] as Record<string, unknown>[]);
  const a = item[0];
  return {
    _id: String(a._id),
    name: String(a.name),
    aiModel: String(a.aiModel),
    prompt: String(a.prompt),
    phone: a.phone ? String(a.phone) : undefined,
    socialID: a.socialID ? String(a.socialID) : undefined,
    activeStatus: Boolean(a.activeStatus),
    icon: a.icon ? String(a.icon) : undefined,
  };
}

// Delete agent
export async function deleteAgent(id: string): Promise<{ success: boolean }> {
  await dbConnect();
  await AgentModel.findByIdAndDelete(id);
  return { success: true };
}
