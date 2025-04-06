'use client'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  TablePagination,
  Typography,
  TableSortLabel,
  Box
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ProfileData {
  userID: string;
  riskLevel: string;
  lastActive: string;
}

type Order = 'asc' | 'desc';
type OrderBy = 'userID' | 'riskLevel' | 'lastActive';

interface ProfileTableProps {
  data: ProfileData[];
}

// Helper function to compare risk levels
function getRiskLevelValue(riskLevel: string): number {
  switch(riskLevel) {
    case "HIGH": return 3;
    case "MEDIUM": return 2;
    case "LOW": return 1;
    default: return 0;
  }
}

// Sorting function
function getSortedData(data: ProfileData[], order: Order, orderBy: OrderBy) {
  return [...data].sort((a, b) => {
    if (orderBy === 'riskLevel') {
      const aValue = getRiskLevelValue(a[orderBy]);
      const bValue = getRiskLevelValue(b[orderBy]);
      return order === 'desc' ? bValue - aValue : aValue - bValue;
    } else {
      // For other columns
      if (b[orderBy] < a[orderBy]) {
        return order === 'asc' ? 1 : -1;
      }
      if (b[orderBy] > a[orderBy]) {
        return order === 'asc' ? -1 : 1;
      }
      return 0;
    }
  });
}

const ProfileTable = ({ data }: ProfileTableProps) => {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<OrderBy>('riskLevel');

  // console.log("ProfileTable data:", data);

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
    switch(riskLevel) {
      case "HIGH":
        color = "#D45F5F"; // High
        break;
      case "MEDIUM":
        color = "#E69244"; // Medium
        break;
      case "LOW":
        color = "#6DBDAD"; // Low
        break;
      default:
        color = "#6b7280"; // gray
    }
    
    return (
      <Chip 
        label={riskLevel} 
        sx={{ 
          bgcolor: color,
          color: 'white',
          borderRadius: '16px',
          fontWeight: 800,
          fontSize: '0.75rem',
          paddingInline: '24px'
        }} 
      />
    );
  };

  const handleViewDetails = (userID: string) => {
    router.push(`/dashboard/${userID}`);
  };

  const sortedData = getSortedData(data, order, orderBy);

  return (
    <div className="col-span-2 lg:col-span-4 bg-white shadow-lg rounded-lg p-2">
      <Typography variant="h6" component="h2" sx={{ fontWeight: 600, px: 4, py: 2 }}>
        Overview
      </Typography>
      
      <TableContainer component={Paper} elevation={0}>
        <Table sx={{ minWidth: 650 }} aria-label="profile table">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f3f4f6' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>USER ID</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>
                <TableSortLabel
                  active={orderBy === 'riskLevel'}
                  direction={orderBy === 'riskLevel' ? order : 'asc'}
                  onClick={() => handleRequestSort('riskLevel')}
                >
                  Risk Level
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Last Active</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(rowsPerPage > 0
              ? sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              : sortedData
            ).map((row) => (
              <TableRow key={row.userID} hover>
                <TableCell>{row.userID}</TableCell>
                <TableCell>{getRiskLevelChip(row.riskLevel)}</TableCell>
                <TableCell>{row.lastActive}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    onClick={() => handleViewDetails(row.userID)}
                    sx={{ 
                      bgcolor: '#253A5C',
                      color: 'white',
                      borderRadius: '16px',
                      paddingInline: '24px',
                      textTransform: 'none',
                      fontWeight: 600,
                      '&:hover': {
                        bgcolor: '#6b7280',
                      }
                    }}
                    size="small"
                  >
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            
            {/* Empty rows to maintain consistent height */}
            {page > 0 && data.length <= page * rowsPerPage && (
              <TableRow style={{ height: 53 }}>
                <TableCell colSpan={4} align="center">No data to display</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={data.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </div>
  );
};

export default ProfileTable;