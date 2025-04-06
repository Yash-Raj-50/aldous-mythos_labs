'use client';
import { usePathname } from "next/navigation";
import { Button, Select, MenuItem, FormControl, SelectChangeEvent, useMediaQuery } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { fetchUsers } from "@/actions/fetchUsers";
import type { UserListData } from "@/actions/fetchUsers";

interface NavbarProps {
  data: {
    lastlastUpdated: string;
    activeUsers?: number | null;
    conversationCount?: number | null;
  };
  usersList?: UserListData[]; // Optional prop for user list (passed from parent)
}

const Navbar = ({ data, usersList }: NavbarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const isHomePage = pathname === "/";
  const isDashboard = pathname.startsWith("/dashboard");
  const profileID = isDashboard ? pathname.split("/")[2] : null;
  const { logout } = useAuth();
  const [selectedUser, setSelectedUser] = useState<string>(profileID || "");
  const isSmallScreen = useMediaQuery('(max-width: 768px)');
  const [users, setUsers] = useState<UserListData[]>(usersList || []);
  
  // Fetch users if not provided as a prop
  useEffect(() => {
    const loadUsers = async () => {
      if (usersList && usersList.length > 0) {
        setUsers(usersList);
        return;
      }
      
      try {
        const { data } = await fetchUsers();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users for dropdown:", error);
      }
    };
    
    loadUsers();
  }, [usersList]);

  // Update selectedUser when profileID changes
  useEffect(() => {
    if (profileID) {
      setSelectedUser(profileID);
    } else {
      setSelectedUser("");
    }
  }, [profileID]);

  const handleUserChange = (event: SelectChangeEvent<string>) => {
    const userId = event.target.value;
    setSelectedUser(userId);
    if (userId) {
      router.push(`/dashboard/${userId}`);
    }
  };

  // Existing Navbar JSX, but replace people_list.data with users
  return (
    <div className={`bg-[#253A5C] text-white p-4 px-4 md:px-8 ${isSmallScreen ? 'flex flex-col' : 'flex justify-between items-center'}`}>
      {/* Left side - Title and dropdown */}
      <div className={`${isSmallScreen ? 'w-full' : 'flex items-center gap-3'}`}>
        <div className={`flex items-center ${isSmallScreen ? 'justify-between mb-3' : ''}`}>
          {isDashboard && (
            <Link href="/" className="mr-2 hover:bg-white hover:text-[#253A5C] transition-opacity duration-300 border border-white flex items-center rounded p-2">
              <HomeIcon fontSize="small" />
            </Link>
          )}
          <div className="text-xl font-bold whitespace-nowrap">
            {isHomePage && <>Aldous Console</>}
            {isDashboard && <>Aldous Intelligence Dashboard</>}
          </div>
        </div>
        
        {/* User Dropdown */}
        <FormControl 
          size="small" 
          fullWidth={isSmallScreen}
          sx={{ 
            minWidth: 180,
            marginLeft: isSmallScreen ? 0 : 1,
            marginBottom: isSmallScreen ? 2 : 0,
            "& .MuiOutlinedInput-root": {
              color: "white",
              borderColor: "white",
              borderRadius: "4px",
              backgroundColor: "transparent",
              "& fieldset": {
                borderColor: "white",
                borderWidth: "1px",
              },
              "&:hover fieldset": {
                borderColor: "white",
                borderWidth: "1px",
              },
              "&.Mui-focused fieldset": {
                borderColor: "white",
                borderWidth: "1px",
              },
            },
            "& .MuiSelect-icon": {
              color: "white",
            },
            "& .MuiInputBase-input": {
              padding: "6px 14px",
            },
          }}
        >
          <Select
            value={selectedUser}
            onChange={handleUserChange}
            displayEmpty
            IconComponent={KeyboardArrowDownIcon}
            MenuProps={{
              PaperProps: {
                sx: {
                  backgroundColor: 'rgba(37, 58, 92, 0.95)',
                  color: 'white',
                  maxHeight: '300px',
                  '& .MuiMenuItem-root': {
                    '&:hover': {
                      backgroundColor: 'rgba(58, 91, 133, 0.7)',
                    },
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(58, 91, 133, 0.9)',
                      '&:hover': {
                        backgroundColor: 'rgba(58, 91, 133, 0.7)',
                      },
                    },
                  },
                },
              },
            }}
          >
            <MenuItem value="" disabled>
              {isHomePage ? "Select User" : `User #${profileID}`}
            </MenuItem>
            {users.map((person) => (
              <MenuItem 
                key={person.userID} 
                value={person.userID}
                sx={{ fontSize: '0.875rem' }}
              >
                User #{person.userID}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
      
      {/* Right side - Status info and logout button */}
      <div className={`flex ${isSmallScreen ? 'justify-between' : 'items-center gap-8'}`}>
        <div className="text-sm">
          <div>Last Updated: {data.lastlastUpdated}</div>
          <div>
            {isHomePage && <>Active Users: {data.activeUsers}</>}
            {isDashboard && <>Conversations: {data.conversationCount}</>}
          </div>
        </div>
        <Button
          variant="outlined"
          sx={{
            color: 'white',
            borderColor: 'white',
            '&:hover': { 
              backgroundColor: 'white', 
              color: '#253A5C' 
            },
            fontWeight: 'bold',
          }}
          onClick={logout}
        >
          Logout
        </Button>
      </div>
    </div>
  );
};

export default Navbar;