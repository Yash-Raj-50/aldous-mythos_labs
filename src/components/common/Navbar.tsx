'use client';
import { usePathname } from "next/navigation";
import { Button, Select, MenuItem, FormControl, SelectChangeEvent, useMediaQuery, Avatar } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import type { Profile } from "@/types/databaseTypes";
import type { HomepageData } from "@/actions/fetchHomepageData";
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'; // Import an icon for the admin panel

interface NavbarProps {
  data?: {
    lastUpdated: string;
    activeUsers?: number | null;
    conversationCount?: number | null;
  };
  usersList?: Profile[];
  currentUser?: HomepageData['currentUser'];
  onUpdateAnalysis?: () => Promise<void>;
  isUpdating?: boolean;
}

const Navbar = ({ data, usersList = [], currentUser, onUpdateAnalysis, isUpdating = false }: NavbarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const isHomePage = pathname === "/";
  const isDashboard = pathname.startsWith("/dashboard");
  const isAdminPage = pathname === "/admin";
  const profileID = isDashboard ? pathname.split("/")[2] : null;
  const { logout } = useAuth();
  const [selectedUser, setSelectedUser] = useState<string>(profileID || "");
  const isSmallScreen = useMediaQuery('(max-width: 768px)');
  const [profilesForDropdown, setProfilesForDropdown] = useState<Profile[]>(usersList);

  // Helper function to format dates in the navbar
  const formatNavbarDate = (dateString: string | undefined) => {
    if (!dateString || dateString === 'Unknown') return dateString || 'Unknown';
    
    try {
      // If it's already formatted (contains relative time or formatted date), return as is
      if (dateString.includes('ago') || dateString.includes(':')) {
        return dateString;
      }
      
      // Try to parse and format if it's a raw date
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString; // Return original if invalid
      }
      
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // console.log("Navbar currentUser:", currentUser); // Debug log
  // console.log("Current user role:", currentUser?.role); // Debug log for role

  useEffect(() => {
    if (isAdminPage) return; // Do not update profiles dropdown on admin page
    setProfilesForDropdown(usersList);
  }, [usersList, isAdminPage]);

  useEffect(() => {
    if (isAdminPage) return; // Do not update selected user on admin page
    if (profileID) {
      setSelectedUser(profileID);
    } else {
      if (isHomePage && profilesForDropdown.length > 0 && currentUser) {
        // optionally set a default
      } else {
        setSelectedUser("");
      }
    }
  }, [profileID, isHomePage, profilesForDropdown, currentUser, isAdminPage]);

  const handleUserChange = (event: SelectChangeEvent<string>) => {
    const userId = event.target.value;
    setSelectedUser(userId);
    if (userId) {
      router.push(`/dashboard/${userId}`);
    }
  };

  return (
    <div className={`bg-[#253A5C] text-white p-4`}>
      <div className={`max-w-screen-xl mx-auto ${isSmallScreen ? 'flex flex-col' : 'flex justify-between items-center'}`}>
        {/* Left side - Title and dropdown */}
        <div className={`${isSmallScreen ? 'w-full' : 'flex items-center gap-3'}`}>
          <div className={`flex items-center ${isSmallScreen ? 'justify-between mb-3' : ''}`}>
            {(isDashboard || isAdminPage) && ( // Show home button if on dashboard or admin page
              <Link href="/" className="mr-2 hover:bg-white hover:text-[#253A5C] transition-opacity duration-300 border border-white flex items-center rounded p-2">
                <HomeIcon fontSize="small" />
              </Link>
            )}
            <div className="text-xl font-bold whitespace-nowrap">
              {isHomePage && <>Aldous Console</>}
              {isDashboard && <>Aldous Intelligence Dashboard</>}
              {isAdminPage && <>Aldous Admin Panel</>} {/* Title for Admin Page */}
            </div>
          </div>

          {/* User Dropdown and Update Button Group - Don't show on Admin Page for now */}
          {!isAdminPage && (
            <div className={`flex ${isSmallScreen ? 'w-full flex-col' : 'items-center'}`}>
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
                    {isHomePage ? "Select Profile" : (profileID ? `Profile: ${profilesForDropdown.find(p => p.id === profileID)?.name || profileID}` : "Select Profile")}
                  </MenuItem>
                  {profilesForDropdown.map((profile) => (
                    <MenuItem
                      key={profile.id || profile._id?.toString()}
                      value={profile.id || profile._id?.toString()}
                      sx={{ fontSize: '0.875rem' }}
                    >
                      {profile.name} ({profile.country})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Update Analysis Button - Only show on dashboard */}
              {isDashboard && onUpdateAnalysis && (
                <Button
                  variant="outlined"
                  startIcon={<AutorenewIcon />}
                  sx={{
                    color: 'white',
                    borderColor: 'white',
                    marginLeft: isSmallScreen ? 0 : 2,
                    marginBottom: isSmallScreen ? 2 : 0,
                    '&:hover': {
                      backgroundColor: 'white',
                      color: '#253A5C'
                    },
                    '&.Mui-disabled': {
                      color: 'rgba(255, 255, 255, 0.5)',
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    }
                  }}
                  onClick={onUpdateAnalysis}
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Updating...' : 'Update Analysis'}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Right side - User Avatar, Status info and logout button */}
        <div className={`flex ${isSmallScreen ? 'w-full justify-between mt-3' : 'items-center gap-4'}`}>
          
          {!isSmallScreen && !isAdminPage && ( // Hide status info on admin page for now
            <div className="text-xs">
              <div>Last Updated: {formatNavbarDate(data?.lastUpdated)}</div>
              <div>
                {isHomePage && <>Active Profiles: {data?.activeUsers}</>}
                {isDashboard && <>Conversations: {data?.conversationCount}</>}
              </div>
            </div>
          )}

          {/* Admin Panel Button - Conditionally render for superuser */}
          {currentUser?.userClass === 'superuser' && !isAdminPage && !isDashboard && ( // Changed to use userClass
            <Link href="/admin" passHref>
              <Button
                component="span" // Use span to work properly inside Link component
                variant="outlined"
                startIcon={!isSmallScreen ? <AdminPanelSettingsIcon /> : null}
                sx={{
                  color: 'white',
                  borderColor: 'white',
                  padding: isSmallScreen ? '6px 8px' : '6px 12px',
                  minWidth: isSmallScreen ? 'auto' : undefined,
                  '&:hover': {
                    backgroundColor: 'white',
                    color: '#253A5C'
                  },
                  fontWeight: 'bold',
                  marginRight: 1 // Add some margin if not small screen
                }}
              >
                {isSmallScreen ? <AdminPanelSettingsIcon fontSize="small"/> : 'Admin Panel'}
              </Button>
            </Link>
          )}

          <div className="flex items-center gap-2">
            <Avatar 
              src={currentUser?.profilePic} 
              sx={{ width: 32, height: 32, bgcolor: currentUser?.profilePic ? 'transparent' : 'primary.contrastText', color: currentUser?.profilePic ? undefined : '#253A5C', fontSize: '0.875rem'}}
            >
              {!currentUser?.profilePic && currentUser?.username?.charAt(0).toUpperCase()}
            </Avatar>
            {currentUser && !isSmallScreen && <span className="text-sm font-medium">{currentUser.username}</span>}
          </div>

          <Button
            variant="outlined"
            onClick={(e) => {
              e.preventDefault(); // Prevent default behavior
              logout();
            }}
            startIcon={!isSmallScreen ? <LogoutIcon /> : null}
            sx={{
              color: 'white',
              borderColor: 'white',
              padding: isSmallScreen ? '6px 8px' : '6px 12px',
              minWidth: isSmallScreen ? 'auto' : undefined,
              '&:hover': {
                backgroundColor: 'white',
                color: '#253A5C'
              },
              fontWeight: 'bold',
            }}
          >
            {isSmallScreen ? <LogoutIcon fontSize="small"/> : 'Logout'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Navbar;