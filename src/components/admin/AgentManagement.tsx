'use client';

import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField, Select, MenuItem, FormControl, InputLabel, CircularProgress, Alert, Switch, FormControlLabel, SelectChangeEvent, Avatar } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InputAdornment from '@mui/material/InputAdornment';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import type { AgentData } from '@/types/applicationTypes';
import { fetchAgents, createAgent, updateAgent, deleteAgent } from '@/actions/adminActions';
import { uploadAgentIcon } from '@/actions/uploadActions';
import dummyAgentLogo from '@/assets/dummy_agent_logo.png';

const AI_MODELS = [
  // { value: 'gpt-4o', label: 'OpenAI GPT-4o' },
  // { value: 'gpt-o1', label: 'OpenAI GPT-o1' },
  { value: 'claude-4-sonnet', label: 'Anthropic Claude 4 Sonnet' },
  { value: 'claude-3.7-sonnet', label: 'Anthropic Claude 3.7 Sonnet' },
  { value: 'claude-3.5-sonnet', label: 'Anthropic Claude 3.5 Sonnet' },
  // { value: 'gemini-2.5', label: 'Google Gemini 2.5 Pro' }
];

const PHONE_OPTIONS = [
  { value: '+12766639185', label: '+1 276 663 9185' }
];

const AgentManagement: React.FC = () => {
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null);
  const [openCreateDialog, setOpenCreateDialog] = useState<boolean>(false);
  const [openEditDialog, setOpenEditDialog] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [iconError, setIconError] = useState<string | null>(null);
  const [openPromptModal, setOpenPromptModal] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState<boolean>(false);

  const [newAgentData, setNewAgentData] = useState<Partial<Omit<AgentData, '_id'>>>({
    name: '',
    aiModel: 'gpt-4o',
    prompt: '',
    phone: '',
    socialID: '',
    activeStatus: true,
    icon: dummyAgentLogo.src,
  });
  const [searchText, setSearchText] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    const loadAgents = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchAgents();
        setAgents(data);
      } catch {
        setError('Failed to fetch agents.');
      } finally {
        setIsLoading(false);
      }
    };
    loadAgents();
  }, []);

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = filterStatus === 'all' || (filterStatus === 'active' ? agent.activeStatus : !agent.activeStatus);
    return matchesSearch && matchesStatus;
  });

  const validateAgentData = (data: Partial<Omit<AgentData, '_id'>>): boolean => {
    // Name/Model/Prompt
    if (!data.name || !data.aiModel || !data.prompt) {
      setError("Name, AI Model, and Prompt are required.");
      return false;
    }
    // Contact: phone or socialID
    if (!data.phone && !data.socialID) {
      setError("At least one contact method (phone or Facebook Page ID) is required.");
      return false;
    }
    // Phone format validation if provided
    if (data.phone) {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/; // E.164
      if (!phoneRegex.test(data.phone)) {
        setError("Phone number must be valid E.164 format (e.g. +1234567890).");
        return false;
      }
    }
    return true;
  };

  // Icon upload handler
  const handleIconUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setIconError(null);
    const file = event.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const maxSize = 1 * 1024 * 1024; // 1MB
    if (file.size > maxSize) {
      setIconError('Image must be smaller than 1MB.');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setIconError('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
      return;
    }

    setUploadingIcon(true);
    try {
      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', file);

      // Upload to S3 via server action
      const result = await uploadAgentIcon(formData);

      if (result.success && result.url) {
        setNewAgentData(prev => ({ ...prev, icon: result.url }));
      } else {
        setIconError(result.error || 'Failed to upload image.');
      }
    } catch {
      setIconError('Failed to upload image. Please try again.');
    } finally {
      setUploadingIcon(false);
    }
  };

  const handleCreateOpen = () => {
    setNewAgentData({
      name: '',
      aiModel: 'gpt-4o',
      prompt: '',
      phone: '',
      socialID: '',
      activeStatus: true,
      icon: dummyAgentLogo.src,
    });
    setError(null);
    setIconError(null);
    setUploadingIcon(false);
    setOpenCreateDialog(true);
  };

  const handleCreateClose = () => {
    setOpenCreateDialog(false);
    setError(null);
    setIconError(null);
    setUploadingIcon(false);
  };

  const handleCreateSubmit = async () => {
    if (!validateAgentData(newAgentData)) return;
    setIsLoading(true);
    try {
      const created = await createAgent(newAgentData as Omit<AgentData, '_id'>);
      setAgents(prev => [...prev, created]);
      handleCreateClose();
    } catch {
      setError('Failed to create agent.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditOpen = (agent: AgentData) => {
    setSelectedAgent(agent);
    setNewAgentData({
      name: agent.name,
      aiModel: agent.aiModel,
      prompt: agent.prompt,
      phone: agent.phone || '',
      socialID: agent.socialID || '',
      activeStatus: agent.activeStatus !== false, // Default to true if undefined
      icon: agent.icon || dummyAgentLogo.src,
    });
    setError(null);
    setIconError(null);
    setUploadingIcon(false);
    setOpenEditDialog(true);
  };

  const handleEditClose = () => {
    setOpenEditDialog(false);
    setSelectedAgent(null);
    setError(null);
    setIconError(null);
    setUploadingIcon(false);
  };

  const handleEditSubmit = async () => {
    if (!selectedAgent || !validateAgentData(newAgentData)) return;
    setIsLoading(true);
    try {
      const updated = await updateAgent(selectedAgent._id, newAgentData as Partial<Omit<AgentData, '_id'>>);
      if (updated) setAgents(prev => prev.map(a => (a._id === updated._id ? updated : a)));
      handleEditClose();
    } catch {
      setError('Failed to update agent.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOpen = (agent: AgentData) => {
    setSelectedAgent(agent);
    setOpenDeleteDialog(true);
  };

  const handleDeleteClose = () => {
    setOpenDeleteDialog(false);
    setSelectedAgent(null);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAgent) return;
    setIsLoading(true);
    try {
      await deleteAgent(selectedAgent._id);
      setAgents(prev => prev.filter(a => a._id !== selectedAgent._id));
      handleDeleteClose();
    } catch {
      setError('Failed to delete agent.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = event.target;
    if (name) {
      setNewAgentData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const { name, value } = event.target;
    setNewAgentData(prev => ({ ...prev, [name as string]: value }));
  };

  const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewAgentData(prev => ({ ...prev, activeStatus: event.target.checked }));
  };

  const handlePromptModalOpen = () => setOpenPromptModal(true);
  const handlePromptModalClose = () => setOpenPromptModal(false);

  if (isLoading && !agents.length) { // Show spinner only on initial load
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Search by name"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            size="small"
            inputProps={{ 'aria-label': 'Search agents by name' }}
          />
          <TextField
            select
            label="Status"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
            size="small"
            sx={{ minWidth: 120 }}
            inputProps={{ 'aria-label': 'Filter agents by status' }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </TextField>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateOpen} sx={{ backgroundColor: '#253A5C', '&:hover': { backgroundColor: '#1A2B42' } }}>
          Create Agent
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {isLoading && <CircularProgress sx={{ display: 'block', margin: 'auto' }} />}

      {/* Agent Table */}
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650, '& tbody tr:hover': { backgroundColor: '#EDF2F7' } }} aria-label="agents table">
          <TableHead sx={{ backgroundColor: '#E2E8F0' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', color: '#2D3748' }}>Icon</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#2D3748' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#2D3748' }}>AI Model</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#2D3748' }}>Phone</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#2D3748' }}>Facebook Page ID</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#2D3748' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#2D3748' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAgents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body1" sx={{ py: 2, color: '#4A5568', fontStyle: 'italic' }}>
                    No agents found. Create your first agent to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredAgents.map((agent) => (
                <TableRow key={agent._id as string} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell>
                    <Avatar
                      src={agent.icon && !agent.icon.includes('dummy_agent_logo.png') ? agent.icon : dummyAgentLogo.src}
                      alt={agent.name}
                      sx={{ width: 30, height: 30 }}
                    />
                  </TableCell>
                  <TableCell component="th" scope="row">{agent.name}</TableCell>
                  <TableCell>{agent.aiModel}</TableCell>
                  <TableCell>{agent.phone || "—"}</TableCell>
                  <TableCell>{agent.socialID || "—"}</TableCell>
                  <TableCell>
                    <Typography
                      component="span"
                      sx={{
                        color: agent.activeStatus ? 'green' : 'gray',
                        backgroundColor: agent.activeStatus ? 'rgba(0, 128, 0, 0.1)' : 'rgba(128, 128, 128, 0.1)',
                        px: 1,
                        py: 0.5,
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: 'medium'
                      }}
                    >
                      {agent.activeStatus ? "Active" : "Inactive"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton aria-label="edit agent" onClick={() => handleEditOpen(agent)} size="small" sx={{ color: '#3182CE' }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton aria-label="delete agent" onClick={() => handleDeleteOpen(agent)} size="small" sx={{ color: '#E53E3E' }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Agent Dialog */}
      <Dialog open={openCreateDialog} onClose={handleCreateClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#253A5C', color: 'white' }}>Create New Agent</DialogTitle>
        <DialogContent sx={{ p: { xs: 2, md: 4 } }}>
          <div className='flex justify-end items-center w-full py-1'>
            <FormControlLabel
              control={<Switch checked={newAgentData.activeStatus ?? true} onChange={handleSwitchChange} name="activeStatus" />} 
              label="Active"
            />
          </div>
          {/* Upper: Preview & Inputs */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 1 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Box
                sx={{
                  width: 160,
                  height: 160,
                  mx: 'auto',
                  backgroundImage: `url(${newAgentData.icon && !newAgentData.icon.includes('dummy_agent_logo.png') ? newAgentData.icon : dummyAgentLogo.src})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: 2,
                  bgcolor: '#f0f0f0',
                  mb: 1
                }}
              />
              <Box sx={{ mt: 1 }}>
                <Button 
                  variant="outlined" 
                  component="label"
                  disabled={uploadingIcon}
                  startIcon={uploadingIcon ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                  sx={{ 
                    borderColor: uploadingIcon ? '#ccc' : undefined,
                    '&:hover': {
                      borderColor: uploadingIcon ? '#ccc' : '#3182CE',
                      backgroundColor: uploadingIcon ? 'transparent' : '#EBF8FF'
                    }
                  }}
                >
                  {uploadingIcon ? 'Uploading...' : 'Upload Icon'}
                  <input 
                    hidden 
                    accept="image/*" 
                    type="file" 
                    onChange={handleIconUpload}
                    disabled={uploadingIcon}
                  />
                </Button>
                {iconError && <Typography color="error" variant="body2" sx={{ mt: 1 }}>{iconError}</Typography>}
              </Box>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr' }, gap: 1 }}>
              {/* Four inputs (Name, Model, Phone, SocialID) */}
              <TextField label="Name" name="name" value={newAgentData.name || ''} onChange={handleInputChange} fullWidth margin="dense" required />
              <FormControl fullWidth margin="dense">
                <InputLabel id="aiModel-label">AI Model</InputLabel>
                <Select labelId="aiModel-label" name="aiModel" value={newAgentData.aiModel || ''} onChange={handleSelectChange} label="AI Model" required>
                  {AI_MODELS.map(m => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth margin="dense">
                <InputLabel id="phone-label">Phone</InputLabel>
                <Select labelId="phone-label" name="phone" value={newAgentData.phone || ''} onChange={handleSelectChange} label="Phone">
                  <MenuItem value="">Select Phone Number</MenuItem>
                  {PHONE_OPTIONS.map(p => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Facebook Page ID" name="facebookPageID" value={newAgentData.socialID || ''} onChange={handleInputChange} fullWidth margin="none" helperText="Required if Phone is not provided" />
            </Box>
          </Box>
          {/* Lower: Prompt with expand */}
          <Box sx={{ p: 0, pt: 2 }}>
            <TextField
              label="Prompt"
              name="prompt"
              value={newAgentData.prompt || ''}
              onChange={handleInputChange}
              multiline
              rows={4}
              fullWidth
              margin="dense"
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton aria-label="expand prompt" onClick={handlePromptModalOpen} edge="end">
                      <OpenInFullIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCreateClose} sx={{ color: '#718096' }}>Cancel</Button>
          <Button
            onClick={handleCreateSubmit}
            variant="contained"
            sx={{ backgroundColor: '#253A5C', '&:hover': { backgroundColor: '#1A2B42' } }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Agent Dialog */}
      <Dialog open={openEditDialog} onClose={handleEditClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#253A5C', color: 'white' }}>Edit Agent</DialogTitle>
        <DialogContent sx={{ p: { xs: 2, md: 4 } }}>
          <div className='flex justify-end items-center w-full py-1'>
            <FormControlLabel
              control={<Switch checked={newAgentData.activeStatus ?? true} onChange={handleSwitchChange} name="activeStatus" />} 
              label="Active"
            />
          </div>
          {/* Upper: Preview & Inputs */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 1 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Box
                sx={{
                  width: 160,
                  height: 160,
                  mx: 'auto',
                  backgroundImage: `url(${newAgentData.icon && !newAgentData.icon.includes('dummy_agent_logo.png') ? newAgentData.icon : dummyAgentLogo.src})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: 2,
                  bgcolor: '#f0f0f0',
                  mb: 1
                }}
              />
              <Box sx={{ mt: 1 }}>
                <Button 
                  variant="outlined" 
                  component="label"
                  disabled={uploadingIcon}
                  startIcon={uploadingIcon ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                  sx={{ 
                    borderColor: uploadingIcon ? '#ccc' : undefined,
                    '&:hover': {
                      borderColor: uploadingIcon ? '#ccc' : '#3182CE',
                      backgroundColor: uploadingIcon ? 'transparent' : '#EBF8FF'
                    }
                  }}
                >
                  {uploadingIcon ? 'Uploading...' : 'Upload Icon'}
                  <input 
                    hidden 
                    accept="image/*" 
                    type="file" 
                    onChange={handleIconUpload}
                    disabled={uploadingIcon}
                  />
                </Button>
                {iconError && <Typography color="error" variant="body2" sx={{ mt: 1 }}>{iconError}</Typography>}
              </Box>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr' }, gap: 1 }}>
              {/* Four inputs (Name, Model, Phone, SocialID) */}
              <TextField label="Name" name="name" value={newAgentData.name || ''} onChange={handleInputChange} fullWidth margin="dense" required />
              <FormControl fullWidth margin="dense">
                <InputLabel id="edit-aiModel-label">AI Model</InputLabel>
                <Select labelId="edit-aiModel-label" name="aiModel" value={newAgentData.aiModel || ''} onChange={handleSelectChange} label="AI Model" required>
                  {AI_MODELS.map(m => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth margin="dense">
                <InputLabel id="edit-phone-label">Phone</InputLabel>
                <Select labelId="edit-phone-label" name="phone" value={newAgentData.phone || ''} onChange={handleSelectChange} label="Phone">
                  <MenuItem value="">Select Phone Number</MenuItem>
                  {PHONE_OPTIONS.map(p => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Facebook Page ID" name="facebookPageID" value={newAgentData.socialID || ''} onChange={handleInputChange} fullWidth margin="none" helperText="Required if Phone is not provided" />
            </Box>
          </Box>
          {/* Lower: Prompt with expand */}
          <Box sx={{ p: 0, pt: 2 }}>
            <TextField
              label="Prompt"
              name="prompt"
              value={newAgentData.prompt || ''}
              onChange={handleInputChange}
              multiline
              rows={4}
              fullWidth
              margin="dense"
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton aria-label="expand prompt" onClick={handlePromptModalOpen} edge="end">
                      <OpenInFullIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleEditClose} sx={{ color: '#718096' }}>Cancel</Button>
          <Button
            onClick={handleEditSubmit}
            variant="contained"
            sx={{ backgroundColor: '#253A5C', '&:hover': { backgroundColor: '#1A2B42' } }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleDeleteClose} aria-labelledby="delete-agent-title">
        <DialogTitle id="delete-agent-title">Confirm Delete</DialogTitle>
        <DialogContent sx={{ p: { xs: 2, md: 3 } }}>
          <DialogContentText>
            Are you sure you want to delete agent &quot;{selectedAgent?.name}&quot;? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleDeleteClose} sx={{ color: '#718096' }}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            sx={{ backgroundColor: '#E53E3E', '&:hover': { backgroundColor: '#C53030' } }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Prompt Expand Modal */}
      <Dialog open={openPromptModal} onClose={handlePromptModalClose} maxWidth="md" fullWidth>
        <DialogTitle>Edit Prompt</DialogTitle>
        <DialogContent sx={{ p: { xs: 2, md: 4 } }}>
          <TextField
            label="Prompt"
            name="prompt"
            value={newAgentData.prompt || ''}
            onChange={handleInputChange}
            multiline
            rows={24}
            fullWidth
            margin="dense"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePromptModalClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AgentManagement;
