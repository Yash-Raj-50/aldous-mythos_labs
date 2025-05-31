'use client';

import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField, Select, MenuItem, FormControl, InputLabel, CircularProgress, Avatar } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import type { ClientData, AgentData } from '@/types/applicationTypes';
import {
  fetchClients, createClient, updateClient, deleteClient, fetchAgents,
} from '@/actions/adminActions';
import dummyAgentLogo from '@/assets/dummy_agent_logo.png';

const ClientManagement: React.FC = () => {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [openCreateDialog, setOpenCreateDialog] = useState<boolean>(false);
  const [openEditDialog, setOpenEditDialog] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [agentOptions, setAgentOptions] = useState<AgentData[]>([]);

  const [newClientData, setNewClientData] = useState<{
    username: string;
    password: string;
    userClass: string;
    agents: string[];
  }>({
    username: '',
    password: '',
    userClass: 'client',
    agents: [],
  });

  const [searchText, setSearchText] = useState('');
  const [filterClass, setFilterClass] = useState<'all' | 'client' | 'superuser'>('all');
  const [agentSearchCreate, setAgentSearchCreate] = useState<string>('');
  const [agentSearchEdit, setAgentSearchEdit] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [clientList, agents] = await Promise.all([
          fetchClients(),
          fetchAgents(),
        ]);
        setClients(clientList);
        setAgentOptions(agents);
      } catch {
        // Error fetching data
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.username.toLowerCase().includes(searchText.toLowerCase());
    const matchesClass = filterClass === 'all' || c.userClass === filterClass;
    return matchesSearch && matchesClass;
  });

  const handleCreateOpen = () => {
    setNewClientData({ username: '', password: '', userClass: 'client', agents: [] });
    setOpenCreateDialog(true);
  };

  const handleCreateClose = () => {
    setOpenCreateDialog(false);
  };

  const handleCreateSubmit = async () => {
    if (!newClientData.username || !newClientData.password) {
      return;
    }
    setIsLoading(true);
    try {
      const created = await createClient(newClientData);
      setClients([...clients, created]);
      handleCreateClose();
    } catch {
      // Error creating client
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditOpen = (client: ClientData) => {
    setSelectedClient(client);
    setNewClientData({
      username: client.username,
      password: '',
      userClass: client.userClass,
      agents: client.agents || [],
    });
    setOpenEditDialog(true);
  };

  const handleEditClose = () => {
    setOpenEditDialog(false);
    setSelectedClient(null);
  };

  const handleEditSubmit = async () => {
    if (!selectedClient || !newClientData.username) {
      return;
    }
    setIsLoading(true);
    try {
      const updateData: Partial<{
        username: string;
        password: string;
        userClass: string;
        agents: string[];
      }> = {
        username: newClientData.username,
        userClass: newClientData.userClass,
        agents: newClientData.agents,
      };
      if (newClientData.password) {
        updateData.password = newClientData.password;
      }
      const updated = await updateClient(selectedClient._id, updateData);
      if (updated) {
        setClients(clients.map(c => (c._id === updated._id ? updated : c)));
      }
      handleEditClose();
    } catch {
      // Silently handle client update errors in UI
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOpen = (client: ClientData) => {
    setSelectedClient(client);
    setOpenDeleteDialog(true);
  };

  const handleDeleteClose = () => {
    setOpenDeleteDialog(false);
    setSelectedClient(null);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedClient) return;
    setIsLoading(true);
    try {
      await deleteClient(selectedClient._id);
      setClients(clients.filter(c => c._id !== selectedClient._id));
      handleDeleteClose();
    } catch {
      // Silently handle client delete errors in UI
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = event.target;
    setNewClientData(prev => ({ ...prev, [name as string]: value }));
  };

  const handleSelectChange = (event: { target: { name?: string; value: unknown } }) => {
    const { name, value } = event.target;
    setNewClientData(prev => ({ ...prev, [name as string]: value }));
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;
    if (source.droppableId === 'unassigned' && destination.droppableId === 'assigned') {
      setNewClientData(prev => ({ ...prev, agents: [...prev.agents, draggableId] }));
    }
    if (source.droppableId === 'assigned' && destination.droppableId === 'unassigned') {
      setNewClientData(prev => ({ ...prev, agents: prev.agents.filter(id => id !== draggableId) }));
    }
  };

  if (isLoading && !clients.length) { // Show spinner only on initial load
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}><CircularProgress /></Box>;
  }

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      {/* Search, Filter & Create */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Search by username"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            size="small"
          />
          <TextField
            select
            label="User Class"
            value={filterClass}
            onChange={e => setFilterClass(e.target.value as 'all' | 'client' | 'superuser')}
            size="small"
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="client">Client</MenuItem>
            <MenuItem value="superuser">Superuser</MenuItem>
          </TextField>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateOpen} sx={{ backgroundColor: '#253A5C', '&:hover': { backgroundColor: '#1A2B42' } }}>
          Create Client
        </Button>
      </Box>

      {/* Clients Table */}
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead sx={{ backgroundColor: '#E2E8F0' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', color: '#2D3748' }}>Username</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#2D3748' }}>User Class</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#2D3748' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  <Typography variant="body1" sx={{ py: 2, color: '#4A5568', fontStyle: 'italic' }}>
                    No clients found. Create your first client to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => (
                <TableRow key={client._id as string} sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: '#EDF2F7' } }}>
                  <TableCell component="th" scope="row">
                    {client.username}
                  </TableCell>
                  <TableCell>{client.userClass}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEditOpen(client)} color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteOpen(client)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Client Dialog */}
      <Dialog open={openCreateDialog} onClose={handleCreateClose} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#253A5C', color: 'white' }}>Create New Client</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, p: { xs: 2, md: 4 }, minHeight: 400 }}>
            {/* Form Fields */}
            <Box sx={{ flex: 1, display: 'grid', gridTemplateRows: 'auto', gap: 2, alignContent: 'start' }}>
              <TextField
                autoFocus
                margin="dense"
                name="username"
                label="Username"
                fullWidth
                variant="outlined"
                value={newClientData.username}
                onChange={handleInputChange}
                sx={{ my: 0 }}
              />
              <TextField
                margin="dense"
                name="password"
                label="Password"
                type="password"
                fullWidth
                variant="outlined"
                value={newClientData.password}
                onChange={handleInputChange}
                sx={{ my: 0 }}
              />
              <FormControl fullWidth>
                <InputLabel id="userClass-label">User Class</InputLabel>
                <Select
                  labelId="userClass-label"
                  name="userClass"
                  value={newClientData.userClass}
                  onChange={handleSelectChange}
                  label="User Class"
                >
                  <MenuItem value="client">Client</MenuItem>
                  <MenuItem value="superuser">Superuser</MenuItem>
                </Select>
              </FormControl>
            </Box>
            {/* Drag & Drop Agents */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, minHeight: 300 }}>
              <TextField placeholder="Search agents" size="small" value={agentSearchCreate} onChange={e => setAgentSearchCreate(e.target.value)} />
              <DragDropContext onDragEnd={onDragEnd}>
                <Box sx={{ display: 'flex', gap: 1, flex: 1, overflow: 'hidden', p: 0 }}>
                  {['unassigned', 'assigned'].map(id => {
                    const list = id === 'unassigned'
                      ? agentOptions.filter(a => !newClientData.agents.includes(a._id) && a.name.toLowerCase().includes(agentSearchCreate.toLowerCase()))
                      : agentOptions.filter(a => newClientData.agents.includes(a._id));
                    const label = id === 'unassigned' ? 'Available' : 'Assigned';
                    return (
                      <Droppable key={id} droppableId={id}>
                        {(provided) => (
                          <Box ref={provided.innerRef} {...provided.droppableProps} sx={{ flex: 1, border: '1px solid #ccc', borderRadius: 1, p: 1, overflowY: 'auto', maxHeight: 300 }}>
                            <Typography variant="subtitle1" sx={{ mb: 1 }}>{label}</Typography>
                            {list.map((agent, idx) => (
                              <Draggable key={agent._id} draggableId={agent._id} index={idx}>
                                {(p) => (
                                  <Box ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps} sx={{ display: 'flex', alignItems: 'center', gap: 1, m: 0.5, p: 1, bgcolor: '#f9f9f9', borderRadius: 1 }}>
                                    <Avatar src={agent.icon && !agent.icon.includes('dummy_agent_logo.png') ? agent.icon : dummyAgentLogo.src} sx={{ width: 32, height: 32 }} />
                                    <Typography noWrap>{agent.name}</Typography>
                                  </Box>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </Box>
                        )}
                      </Droppable>
                    );
                  })}
                </Box>
              </DragDropContext>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCreateClose} sx={{ color: '#4A5568' }}>Cancel</Button>
          <Button onClick={handleCreateSubmit} variant="contained" sx={{ backgroundColor: '#253A5C' }}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={openEditDialog} onClose={handleEditClose} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#253A5C', color: 'white' }}>Edit Client</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, p: { xs: 2, md: 4 }, minHeight: 400 }}>
            {/* Form Fields */}
            <Box sx={{ flex: 1, display: 'grid', gridTemplateRows: 'auto', gap: 2, alignContent: 'start' }}>
              <TextField
                autoFocus
                margin="dense"
                name="username"
                label="Username"
                fullWidth
                variant="outlined"
                value={newClientData.username}
                onChange={handleInputChange}
                sx={{ my: 0 }}
              />
              <TextField
                margin="dense"
                name="password"
                label="New Password (optional)"
                type="password"
                fullWidth
                variant="outlined"
                value={newClientData.password}
                onChange={handleInputChange}
                helperText="Leave blank to keep current password."
                sx={{ my: 0 }}
              />
              <FormControl fullWidth>
                <InputLabel id="edit-userClass-label">User Class</InputLabel>
                <Select
                  labelId="edit-userClass-label"
                  name="userClass"
                  value={newClientData.userClass}
                  onChange={handleSelectChange}
                  label="User Class"
                >
                  <MenuItem value="client">Client</MenuItem>
                  <MenuItem value="superuser">Superuser</MenuItem>
                </Select>
              </FormControl>
            </Box>
            {/* Drag & Drop Agents */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, minHeight: 300 }}>
              <TextField placeholder="Search agents" size="small" value={agentSearchEdit} onChange={e => setAgentSearchEdit(e.target.value)} />
              <DragDropContext onDragEnd={onDragEnd}>
                <Box sx={{ display: 'flex', gap: 1, flex: 1, overflow: 'hidden', p: 0 }}>
                  {['unassigned', 'assigned'].map(id => {
                    const list = id === 'unassigned'
                      ? agentOptions.filter(a => !newClientData.agents.includes(a._id) && a.name.toLowerCase().includes(agentSearchEdit.toLowerCase()))
                      : agentOptions.filter(a => newClientData.agents.includes(a._id));
                    const label = id === 'unassigned' ? 'Available' : 'Assigned';
                    return (
                      <Droppable key={id} droppableId={id}>
                        {(provided) => (
                          <Box ref={provided.innerRef} {...provided.droppableProps} sx={{ flex: 1, border: '1px solid #ccc', borderRadius: 1, p: 1, overflowY: 'auto', maxHeight: 300 }}>
                            <Typography variant="subtitle1" sx={{ mb: 1 }}>{label}</Typography>
                            {list.map((agent, idx) => (
                              <Draggable key={agent._id} draggableId={agent._id} index={idx}>
                                {(p) => (
                                  <Box ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps} sx={{ display: 'flex', alignItems: 'center', gap: 1, m: 0.5, p: 1, bgcolor: '#f9f9f9', borderRadius: 1 }}>
                                    <Avatar src={agent.icon && !agent.icon.includes('dummy_agent_logo.png') ? agent.icon : dummyAgentLogo.src} sx={{ width: 32, height: 32 }} />
                                    <Typography noWrap>{agent.name}</Typography>
                                  </Box>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </Box>
                        )}
                      </Droppable>
                    );
                  })}
                </Box>
              </DragDropContext>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleEditClose} sx={{ color: '#4A5568' }}>Cancel</Button>
          <Button onClick={handleEditSubmit} variant="contained" sx={{ backgroundColor: '#253A5C' }}>Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleDeleteClose}
      >
        <DialogTitle sx={{ color: '#D32F2F' }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete client &quot;{selectedClient?.username}&quot;? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose} sx={{ color: '#4A5568' }}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error" sx={{ backgroundColor: '#D32F2F', '&:hover': { backgroundColor: '#B71C1C' } }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ClientManagement;
