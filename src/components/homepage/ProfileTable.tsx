'use client'
import { Profile, Analysis } from "@/types/databaseTypes";
import Avatar from '@mui/material/Avatar';
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
  Chip,
  Button,
  Tooltip // Import Tooltip
} from "@mui/material";
import { useRouter } from 'next/navigation'; // Corrected import for useRouter
import { useState } from "react";
import dummyAgentLogo from '@/assets/dummy_agent_logo.png'; // Import dummy logo
import { AgentWithProfileCount } from "@/actions/fetchHomepageData"; // Import AgentWithProfileCount

// Update ProfileRowData
interface ProfileRowData {
  id: string; // Profile ID
  name: string;
  // profilePic?: string; // Removed profilePic from here as it's not directly displayed in the main row anymore
  country?: string;
  assignedAgent?: {
    id: string;
    name: string;
    icon?: string;
  };
  riskLevel: string; 
  lastActive: string; 
}


type Order = 'asc' | 'desc';
// Update OrderBy to match new ProfileRowData fields
type OrderBy = 'name' | 'id' | 'country' | 'assignedAgent' | 'riskLevel' | 'lastActive';

interface ProfileTableProps {
  profiles: Profile[];
  analyses: Record<string, Analysis | null>;
  userDetails: Record<string, { profilePic?: string, name: string }>; // Kept for potential future use, but not directly for assigned agent display
  agents: AgentWithProfileCount[]; // Added agents prop
}

// Helper function to compare risk levels
function getRiskLevelValue(riskLevel: string): number {
  switch(riskLevel.toUpperCase()) { // Ensure case-insensitivity for comparison
    case "HIGH": return 4;
    case "MEDIUM-HIGH": return 3;
    case "MEDIUM": return 2;
    case "LOW": return 1;
    case "UNKNOWN": return 0; // Added UNKNOWN
    default: return -1; // For any other unexpected values
  }
}

// Sorting function
function getSortedData(data: ProfileRowData[], order: Order, orderBy: OrderBy) {
  return [...data].sort((a, b) => {
    let comparison = 0;
    if (orderBy === 'riskLevel') {
      const aValue = getRiskLevelValue(a.riskLevel);
      const bValue = getRiskLevelValue(b.riskLevel);
      comparison = aValue - bValue;
    } else if (orderBy === 'assignedAgent') {
      const nameA = a.assignedAgent?.name?.toLowerCase() || '';
      const nameB = b.assignedAgent?.name?.toLowerCase() || '';
      comparison = nameA.localeCompare(nameB);
    } else {
      const valA = a[orderBy] as string | number | undefined;
      const valB = b[orderBy] as string | number | undefined;
      if (typeof valA === 'string' && typeof valB === 'string') {
        comparison = valA.toLowerCase().localeCompare(valB.toLowerCase());
      } else if (typeof valA === 'number' && typeof valB === 'number') {
        comparison = valA - valB;
      } else {
        // Fallback for mixed types or other types
        comparison = String(valA).toLowerCase().localeCompare(String(valB).toLowerCase());
      }
    }
    return order === 'desc' ? -comparison : comparison;
  });
}

const ProfileTable = ({ profiles, analyses, agents }: ProfileTableProps) => {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<OrderBy>('riskLevel');
  const [agentIconErrorStates, setAgentIconErrorStates] = useState<Record<string, boolean>>({});

  const handleAgentIconError = (agentId: string) => {
    setAgentIconErrorStates(prev => ({ ...prev, [agentId]: true }));
  };

  // Transform props into ProfileRowData
  const tableData: ProfileRowData[] = profiles.map(profile => {
    const analysis = profile.id ? analyses[profile.id] : null;
    const assignedAgentId = profile.assignedAgentID?.toString();
    const assignedAgentData = assignedAgentId ? agents.find(agent => agent.id === assignedAgentId) : undefined;
    
    let riskLevel = "UNKNOWN"; // Default to UNKNOWN
    if (analysis) { // Check if analysis exists
      // Simplified risk logic: if analysis.summary.risk exists, use it, otherwise keep UNKNOWN
      // This needs to be adapted to your actual Analysis structure for riskLevel
      if (analysis.completeAnalysis && 
          typeof analysis.completeAnalysis === 'object' && 
          analysis.completeAnalysis !== null &&
          'executiveSummary' in analysis.completeAnalysis &&
          typeof (analysis.completeAnalysis as Record<string, unknown>).executiveSummary === 'object' &&
          (analysis.completeAnalysis as Record<string, unknown>).executiveSummary !== null &&
          'riskLevel' in ((analysis.completeAnalysis as Record<string, unknown>).executiveSummary as Record<string, unknown>)) { 
        riskLevel = String(((analysis.completeAnalysis as Record<string, unknown>).executiveSummary as Record<string, unknown>).riskLevel).toUpperCase();
      } else {
        // Fallback or more complex logic if risk is nested differently or needs calculation
        // For now, if analysis exists but no specific risk field, it remains UNKNOWN
        // You might want to set it to LOW if an analysis exists but has no explicit risk
      }
    } // If no analysis, riskLevel remains UNKNOWN

    return {
      id: profile.id!,
      name: profile.name,
      country: profile.country,
      assignedAgent: assignedAgentData ? { 
        id: assignedAgentData.id,
        name: assignedAgentData.name,
        icon: assignedAgentData.icon 
      } : undefined,
      riskLevel: riskLevel, 
      lastActive: analysis?.lastUpdated ? new Date(analysis.lastUpdated).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A',
    };
  });

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRequestSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const getRiskLevelChip = (riskLevel: string) => {
    let color;
    let textColor = 'white';
    switch(riskLevel.toUpperCase()) {
      case "HIGH": color = "#D45F5F"; break;
      case "MEDIUM-HIGH": color = "#E05A3A"; break;
      case "MEDIUM": color = "#E69244"; break;
      case "LOW": color = "#6DBDAD"; break;
      case "UNKNOWN": color = "#E0E0E0"; textColor = '#757575'; break; // Grey for UNKNOWN
      default: color = "#9E9E9E"; textColor = 'white'; // Default grey for other unexpected values
    }
    
    return (
      <Chip 
        label={riskLevel}
        size="small" 
        sx={{ 
          bgcolor: color,
          color: textColor,
          borderRadius: '16px',
          fontWeight: 'bold',
          fontSize: '0.7rem',
          paddingInline: '12px',
          minWidth: '80px', // Ensure chips have a minimum width
          textTransform: 'uppercase'
        }} 
      />
    );
  };

  const handleViewDetails = (profileId: string) => {
    router.push(`/dashboard/${profileId}`);
  };

  const sortedData = getSortedData(tableData, order, orderBy);
  const paginatedData = rowsPerPage > 0
    ? sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : sortedData;

  return (
    <div className="col-span-2 lg:col-span-4 bg-white shadow-lg rounded-lg p-2 min-h-[300px]">
      <Typography variant="h6" component="h2" sx={{ fontWeight: 600, px: 4, py: 2 }}>
        Profile Overview
      </Typography>
      
      <TableContainer component={Paper} elevation={0}>
        <Table sx={{ minWidth: 750 }} aria-label="profile table"> 
          <TableHead sx={{ backgroundColor: '#f3f4f6' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', py: 1, textAlign: 'center', width: '15%' }}>
                <TableSortLabel
                  active={orderBy === 'name'}
                  direction={orderBy === 'name' ? order : 'asc'}
                  onClick={() => handleRequestSort('name')}
                >
                  Profile Name
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', py: 1, textAlign: 'center', width: '15%' }}> 
                <TableSortLabel
                  active={orderBy === 'id'}
                  direction={orderBy === 'id' ? order : 'asc'}
                  onClick={() => handleRequestSort('id')}
                >
                  Profile ID
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', py: 1, textAlign: 'center', width: '10%' }}>
                <TableSortLabel
                  active={orderBy === 'country'}
                  direction={orderBy === 'country' ? order : 'asc'}
                  onClick={() => handleRequestSort('country')}
                >
                  Country
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', py: 1, textAlign: 'center', width: '15%' }}>
                <TableSortLabel
                  active={orderBy === 'assignedAgent'}
                  direction={orderBy === 'assignedAgent' ? order : 'asc'}
                  onClick={() => handleRequestSort('assignedAgent')}
                >
                  Assigned Agent
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', py: 1, textAlign: 'center', width: '10%' }}>
                <TableSortLabel
                  active={orderBy === 'riskLevel'}
                  direction={orderBy === 'riskLevel' ? order : 'asc'}
                  onClick={() => handleRequestSort('riskLevel')}
                >
                  Risk Level
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', py: 1, textAlign: 'center', width: '15%' }}>
                 <TableSortLabel
                  active={orderBy === 'lastActive'}
                  direction={orderBy === 'lastActive' ? order : 'asc'}
                  onClick={() => handleRequestSort('lastActive')}
                >
                  Last Active
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', py: 1, textAlign: 'center', width: '20%' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ py: 1, textAlign: 'center' }}>
                    {row.name}
                  </TableCell>
                  <TableCell sx={{ py: 1, maxWidth: '150px', textAlign: 'center' }}> 
                    <Tooltip title={row.id} placement="top">
                      <Typography noWrap sx={{ fontSize: '0.875rem' }}>
                        {row.id}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ py: 1, textAlign: 'center' }}>{row.country || 'N/A'}</TableCell>
                  <TableCell sx={{ py: 1, textAlign: 'center' }}> 
                    {row.assignedAgent ? (
                      <Tooltip title={row.assignedAgent.name} placement="top">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}> {/* Centered content */}
                          <Avatar 
                            src={!agentIconErrorStates[row.assignedAgent.id] && row.assignedAgent.icon ? row.assignedAgent.icon : dummyAgentLogo.src}
                            onError={() => row.assignedAgent?.id && handleAgentIconError(row.assignedAgent.id)} 
                            sx={{ width: 32, height: 32, marginRight: 1}} 
                          >
                            { (agentIconErrorStates[row.assignedAgent.id] || !row.assignedAgent.icon) && 
                              row.assignedAgent.name?.charAt(0).toUpperCase() }
                          </Avatar>
                          <Typography noWrap sx={{ fontSize: '0.875rem', display: { xs: 'none', sm: 'block' } }}>
                          </Typography>
                        </div>
                      </Tooltip>
                    ) : 'N/A'}
                  </TableCell>
                  <TableCell sx={{ py: 1, textAlign: 'center' }}>{getRiskLevelChip(row.riskLevel)}</TableCell>
                  <TableCell sx={{ py: 1, textAlign: 'center' }}>{row.lastActive}</TableCell>
                  <TableCell sx={{ py: 1, textAlign: 'center' }}>
                    <Button
                      variant="contained"
                      onClick={() => handleViewDetails(row.id)}
                      sx={{ 
                        bgcolor: '#253A5C',
                        color: 'white',
                        borderRadius: '16px',
                        paddingInline: '18px', // Adjusted padding
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.75rem', // Adjusted font size
                        '&:hover': {
                          bgcolor: '#3E5A8A', // Darker shade for hover
                        }
                      }}
                      size="small"
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}> 
                  No profiles to display.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={tableData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </div>
  );
};

export default ProfileTable;