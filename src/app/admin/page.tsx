'use client';

import React, { useState } from 'react';
import { Container, Typography, Paper, Tabs, Tab, Box } from '@mui/material';
import ClientManagement from '@/components/admin/ClientManagement';
import AgentManagement from '@/components/admin/AgentManagement';

// TabPanel component for rendering tab content
function TabPanel(props: {
  children?: React.ReactNode;
  index: number;
  value: number;
}) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function AdminPage() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: '8px' }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#253A5C', fontWeight: '600' }}>
          Admin Panel
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="admin sections tabs"
            TabIndicatorProps={{ style: { backgroundColor: '#253A5C' } }}
            sx={{
              '& .MuiTab-root': { color: '#253A5C', fontWeight: 'bold' },
              '& .Mui-selected': { color: '#1A2B42' },
            }}
          >
            <Tab label="Manage Clients" id="admin-tab-0" aria-controls="admin-tabpanel-0" />
            <Tab label="Manage Agents" id="admin-tab-1" aria-controls="admin-tabpanel-1" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="h5" component="h2" sx={{ mb: 2, color: '#253A5C' }}>
            Clients
          </Typography>
          <Typography sx={{ color: '#4A5568', mb: 3 }}>
            View, create, edit, and delete clients for the platform and assign agents to them.
          </Typography>
          <ClientManagement />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h5" component="h2" sx={{ mb: 2, color: '#253A5C' }}>
            Agents
          </Typography>
          <Typography sx={{ color: '#4A5568', mb: 3 }}>
            View, create, edit, and delete agents.
          </Typography>
          <AgentManagement />
        </TabPanel>
      </Paper>
    </Container>
  );
}

export default AdminPage;
