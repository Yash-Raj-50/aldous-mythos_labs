'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  TablePagination,
  TableSortLabel,
} from "@mui/material";
import { useState } from "react";
import Avatar from '@mui/material/Avatar';
import dummyAgentLogo from '@/assets/dummy_agent_logo.png'; // Import the dummy logo

interface AgentWithProfileCount {
  id: string;
  name: string;
  phone?: string; // Made optional to reflect potential undefined value
  socialID?: string;
  icon?: string;
  activeStatus: boolean; // Kept as boolean as it's defaulted in fetchHomepageData
  profileCount: number;
}

interface AgentTableProps {
  agents: AgentWithProfileCount[];
}

type Order = 'asc' | 'desc';
// Updated AgentOrderBy to reflect new sortable columns
type AgentOrderBy = 'name' | 'profileCount' | 'activeStatus';

function getSortedAgents(data: AgentWithProfileCount[], order: Order, orderBy: AgentOrderBy) {
  return [...data].sort((a, b) => {
    let comparison = 0;
    const valA = a[orderBy];
    const valB = b[orderBy];

    if (orderBy === 'activeStatus') {
      // true (active) comes before false (inactive) for ascending sort
      comparison = valA === valB ? 0 : valA ? -1 : 1;
    } else if (typeof valA === 'number' && typeof valB === 'number') {
      comparison = valA - valB;
    } else if (typeof valA === 'string' && typeof valB === 'string') {
      comparison = valA.localeCompare(valB);
    } else {
      // Fallback for any other types (should not happen with current OrderBy)
      comparison = String(valA).localeCompare(String(valB));
    }
    return order === 'desc' ? -comparison : comparison;
  });
}

const AgentTable: React.FC<AgentTableProps> = ({ agents }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<AgentOrderBy>('name');

  // State to track image loading errors for avatars
  const [imageErrorStates, setImageErrorStates] = useState<Record<string, boolean>>({});

  const handleImageError = (agentId: string) => {
    setImageErrorStates(prev => ({ ...prev, [agentId]: true }));
  };

  const handleRequestSort = (property: AgentOrderBy) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (!agents || agents.length === 0) {
    return (
      <div className="col-span-2 lg:col-span-4 bg-white shadow-lg rounded-lg p-2 min-h-[300px]">
        <Typography variant="h6" component="h2" sx={{ fontWeight: 600, px: 4, py: 2 }}>
          Your Agents
        </Typography>
        <Typography className="text-center text-gray-500 py-4">No agents to display. Contact admin to gain access.</Typography>
      </div>
    );
  }

  const sortedAgents = getSortedAgents(agents, order, orderBy);
  const paginatedAgents = rowsPerPage > 0
    ? sortedAgents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : sortedAgents;

  // console.log("AgentTable agents:", agents); // Helpful for debugging

  return (
    <div className="col-span-2 lg:col-span-4 bg-white shadow-lg rounded-lg p-2 min-h-[300px]">
      <Typography variant="h6" component="h2" sx={{ fontWeight: 600, px: 4, py: 2 }}>
        Your Agents
      </Typography>
      <TableContainer component={Paper} elevation={0}>
        <Table sx={{ minWidth: 650 }} aria-label="agent table">
          <TableHead sx={{ backgroundColor: '#f3f4f6' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', width: '50px' }} align="center"></TableCell> {/* Empty header for Icon */}
              <TableCell sx={{ fontWeight: 'bold' }} align="center">
                <TableSortLabel
                  active={orderBy === 'name'}
                  direction={orderBy === 'name' ? order : 'asc'}
                  onClick={() => handleRequestSort('name')}
                >
                  Agent
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="center">Facebook Page ID</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="center">
                <TableSortLabel
                  active={orderBy === 'profileCount'}
                  direction={orderBy === 'profileCount' ? order : 'asc'}
                  onClick={() => handleRequestSort('profileCount')}
                >
                  Assigned Profiles
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="center">
                <TableSortLabel
                  active={orderBy === 'activeStatus'}
                  direction={orderBy === 'activeStatus' ? order : 'asc'}
                  onClick={() => handleRequestSort('activeStatus')}
                >
                  Active Status
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedAgents.length > 0 ? (
              paginatedAgents.map((agent) => (
                <TableRow key={agent.id} hover>
                  <TableCell sx={{ py: 1, width: '50px' }} align="right"> {/* Icon Cell - Align Right */}
                    <Avatar
                      src={!imageErrorStates[agent.id] && agent.icon ? agent.icon : dummyAgentLogo.src}
                      onError={() => handleImageError(agent.id)}
                      sx={{ width: 32, height: 32, marginLeft: 'auto' }} // Adjusted margin for right alignment
                    >
                      {(imageErrorStates[agent.id] || !agent.icon) && agent.name?.charAt(0).toUpperCase()}
                    </Avatar>
                  </TableCell>
                  <TableCell sx={{ py: 1 }} align="center"> {/* Agent Name Cell */}
                    {agent.name}
                  </TableCell>
                  <TableCell sx={{ py: 1 }} align="center"> {/* Social ID Cell */}
                    {agent.phone || agent.socialID ? (
                      <>
                        {agent.phone && <div>{agent.phone}</div>}
                        {agent.socialID && <div>{agent.socialID}</div>}
                      </>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell sx={{ py: 1 }} align="center">{agent.profileCount}</TableCell>
                  <TableCell sx={{ py: 1 }} align="center"> {/* Active Status Cell */}
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: `2px solid ${agent.activeStatus ? 'green' : 'red'}`,
                      display: 'inline-flex', // Changed from 'flex' to 'inline-flex' for centering in cell
                      justifyContent: 'center',
                      alignItems: 'center',
                      // borderRadius: '4px', // Optional: if you want slightly rounded corners for the outer square
                    }}>
                      <div style={{
                        width: '10px',
                        height: '10px',
                        backgroundColor: agent.activeStatus ? 'green' : 'red',
                        // borderRadius: '2px', // Optional: if you want slightly rounded corners for the inner square
                      }} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}> {/* Updated colSpan to 5 */}
                  No agents found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={agents.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </div>
  );
};

export default AgentTable;
