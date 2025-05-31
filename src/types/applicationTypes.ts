/** Client data interface for the admin panel */
export interface ClientData {
  _id: string;
  username: string;
  userClass: 'client' | 'superuser';
  profilePic?: string;
  agents: string[]; // Array of assigned agent IDs
}

/** Agent data interface for the admin panel */
export interface AgentData {
  _id: string;
  name: string;
  aiModel: string;
  prompt: string;
  phone?: string;
  socialID?: string;
  activeStatus: boolean;
  icon?: string;
}