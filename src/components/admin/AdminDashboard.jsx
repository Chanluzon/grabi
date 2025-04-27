import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  Tooltip,
  Card,
  CardContent,
  Grid,
  useTheme,
  alpha,
  Menu,
  InputAdornment
} from '@mui/material';
import {
  Menu as MenuIcon,
  People as PeopleIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Language as LanguageIcon,
  Translate as TranslateIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelCircleIcon,
  AccessTime as AccessTimeIcon,
  Email as EmailIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  Star as StarIcon,
  Search as SearchIcon,
  LockReset as LockResetIcon
} from '@mui/icons-material';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';
import './AdminDashboard.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend
);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/admin';

const AdminDashboard = () => {
  const theme = useTheme();
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [newUser, setNewUser] = useState({
    email: '',
    password: ''
  });
  const [editForm, setEditForm] = useState({
    userId: '',
    accountType: '',
    email: '',
    status: '',
    language: '',
    translator: ''
  });
  const [contextMenu, setContextMenu] = useState({
    open: false,
    mouseX: null,
    mouseY: null,
    userId: null,
    user: null
  });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedAccountType, setSelectedAccountType] = useState('');
  const [showUsageStats, setShowUsageStats] = useState(false);
  const [usageStats, setUsageStats] = useState({
    totalTranslations: 0,
    averageTranslationsPerUser: 0,
    mostActiveUser: null,
    translationsByLanguage: {},
    dailyLoginUsage: []
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDay, setSelectedDay] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          navigate('/admin/login');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/users`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch users');
        const data = await response.json();
        setUsers(data || {});
        setLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        setLoading(false);
        setSnackbar({
          open: true,
          message: 'Error fetching users: ' + error.message,
          severity: 'error'
        });
      }
    };

    fetchUsers();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Clear the token and redirect to login
      localStorage.removeItem('adminToken');
      navigate('/admin/login');
    } catch (error) {
      console.error('Error logging out:', error);
      setSnackbar({
        open: true,
        message: 'Error logging out: ' + error.message,
        severity: 'error'
      });
    }
  };

  const handleEdit = (userId, user) => {
    setEditingUser(userId);
    setEditForm({
      userId: userId,
      accountType: user.accountType || '',
      email: user.email || '',
      status: user.status || '',
      language: user.language || '',
      translator: user.translator || ''
    });
  };

  const handleSave = async (userId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...editForm,
          lastLoginDate: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }

      setEditingUser(null);
      // Refresh the users list
      const usersResponse = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const usersData = await usersResponse.json();
      setUsers(usersData || {});
      setSnackbar({
        open: true,
        message: 'User updated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating user:', error);
      setSnackbar({
        open: true,
        message: 'Error updating user: ' + error.message,
        severity: 'error'
      });
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete user');
        }

        // Refresh the users list
        const usersResponse = await fetch(`${API_BASE_URL}/users`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const usersData = await usersResponse.json();
        setUsers(usersData || {});
        setSnackbar({
          open: true,
          message: 'User deleted successfully',
          severity: 'success'
        });
      } catch (error) {
        console.error('Error deleting user:', error);
        setSnackbar({
          open: true,
          message: 'Error deleting user: ' + error.message,
          severity: 'error'
        });
      }
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      // Refresh the users list
      const usersResponse = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const usersData = await usersResponse.json();
      setUsers(usersData || {});
      
      // Reset form and hide it
      setNewUser({ email: '', password: '' });
      setShowAddUser(false);
      setSnackbar({
        open: true,
        message: 'User created successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error creating user:', error);
      setSnackbar({
        open: true,
        message: 'Error creating user: ' + error.message,
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getStatusChip = (status) => {
    return status === 'online' ? (
      <Chip 
        icon={<CheckCircleIcon />} 
        label="Online" 
        color="success" 
        size="small" 
      />
    ) : (
      <Chip 
        icon={<CancelCircleIcon />} 
        label="Offline" 
        color="error" 
        size="small" 
      />
    );
  };

  const getAccountTypeChip = (type) => {
    return type === 'premium' ? (
      <Chip 
        label="Premium" 
        color="primary" 
        size="small" 
      />
    ) : (
      <Chip 
        label="Free" 
        color="default" 
        size="small" 
      />
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleContextMenu = (event, userId, user) => {
    event.preventDefault();
    setContextMenu({
      open: true,
      mouseX: event.clientX,
      mouseY: event.clientY,
      userId,
      user
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu({
      open: false,
      mouseX: null,
      mouseY: null,
      userId: null,
      user: null
    });
  };

  const handleContextMenuAction = (action) => {
    const { userId, user } = contextMenu;
    if (action === 'edit') {
      setSelectedUser({ userId, user });
      setSelectedAccountType(user.accountType || 'free');
      setEditModalOpen(true);
    } else if (action === 'delete') {
      handleDelete(userId);
    } else if (action === 'resetPassword') {
      handleResetPassword(user.email);
    }
    handleCloseContextMenu();
  };

  const handleResetPassword = async (email) => {
    try {
      // Use Firebase client SDK to send password reset email
      await sendPasswordResetEmail(auth, email);
      
      setSnackbar({
        open: true,
        message: 'reset password link sent successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error sending password reset email:', error);
      setSnackbar({
        open: true,
        message: 'Error sending password reset email: ' + error.message,
        severity: 'error'
      });
    }
  };

  const handleAccountTypeChange = async (event) => {
    const newAccountType = event.target.value;
    setSelectedAccountType(newAccountType);
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/users/${selectedUser.userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...selectedUser.user,
          accountType: newAccountType
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }

      // Refresh the users list
      const usersResponse = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const usersData = await usersResponse.json();
      setUsers(usersData || {});
      
      setSnackbar({
        open: true,
        message: 'User account type updated successfully',
        severity: 'success'
      });

      // Auto-close the modal after successful update
      handleCloseEditModal();
    } catch (error) {
      console.error('Error updating user:', error);
      setSnackbar({
        open: true,
        message: 'Error updating user: ' + error.message,
        severity: 'error'
      });
    }
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedUser(null);
    setSelectedAccountType('');
  };

  const handleShowUsageStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/usage`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch usage statistics');
      }

      const data = await response.json();
      setUsageStats(data);
      setShowUsageStats(true);
    } catch (error) {
      console.error('Error fetching usage statistics:', error);
      setSnackbar({
        open: true,
        message: 'Error fetching usage statistics: ' + error.message,
        severity: 'error'
      });
    }
  };

  const filteredUsers = Object.entries(users).filter(([_, user]) => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Box className="loading-container">
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" mt={2}>Loading users data...</Typography>
      </Box>
    );
  }

  if (!users || Object.keys(users).length === 0) {
    return (
      <Box className="empty-state-container">
        <Typography variant="h5" gutterBottom>No users found</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => setShowAddUser(true)}
        >
          Add New User
        </Button>
      </Box>
    );
  }

  return (
    <Box className="admin-container">
      <AppBar position="fixed" sx={{ width: '100%' }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={() => setDrawerOpen(!drawerOpen)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Admin Dashboard
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: theme.palette.secondary.main, mr: 2 }}>
              <PersonIcon />
            </Avatar>
            <Button 
              color="inherit" 
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            position: 'fixed',
            top: 64,
            left: 0,
            width: 240,
            height: 'calc(100vh - 64px)',
            boxShadow: '0 0 20px rgba(0, 0, 0, 0.1)',
            border: 'none',
            backgroundColor: theme.palette.background.paper,
            transition: theme.transitions.create('transform', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
        }}
      >
        <Box sx={{ overflow: 'auto', p: 2 }}>
          <List>
            <ListItem 
              button 
              onClick={() => {
                setDrawerOpen(false);
                navigate('/admin');
              }}
            >
              <ListItemIcon>
                <PeopleIcon />
              </ListItemIcon>
              <ListItemText primary="Users" />
            </ListItem>
            <ListItem button onClick={handleShowUsageStats}>
              <ListItemIcon>
                <BarChartIcon />
              </ListItemIcon>
              <ListItemText primary="Usage Statistics" />
            </ListItem>
          </List>
          <Divider />
        </Box>
      </Drawer>

      <Box component="main" className="main-content">
        <Box className="content-wrapper">
          <Box display="flex" alignItems="center" mb={2} gap={2}>
            <Grid container spacing={1} sx={{ flexGrow: 1 }}>
              {[
                { title: 'Total Users', value: Object.keys(users).length, icon: <PeopleIcon />, color: 'primary' },
                { title: 'Premium Users', value: Object.values(users).filter(user => user.accountType === 'premium').length, icon: <CheckCircleIcon />, color: 'success' },
                { title: 'Online Users', value: Object.values(users).filter(user => user.status === 'online').length, icon: <AccessTimeIcon />, color: 'info' },
                { title: 'Languages', value: new Set(Object.values(users).map(user => user.language)).size, icon: <LanguageIcon />, color: 'warning' }
              ].map((stat, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      borderLeft: `4px solid ${theme.palette[stat.color].main}`,
                      borderRadius: 1
                    }}
                  >
                    <CardContent sx={{ p: 1.5 }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                        <Box display="flex" alignItems="center">
                          <Box 
                            sx={{ 
                              backgroundColor: theme.palette[stat.color].light,
                              borderRadius: '50%',
                              p: 1,
                              mr: 1
                            }}
                          >
                            {stat.icon}
                          </Box>
                          <Typography variant="body2" color="textSecondary">
                            {stat.title}
                          </Typography>
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {stat.value}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
              onClick={() => setShowAddUser(true)}
              size="small"
            >
              Add New User
            </Button>
            <TextField
              size="small"
              placeholder="Search by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-field"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <TableContainer 
            component={Paper} 
            className="table-container"
          >
            <Table size="small" stickyHeader>
              <TableHead className="table-header">
                <TableRow>
                  <TableCell>User ID</TableCell>
                  <TableCell>Account Type</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Language</TableCell>
                  <TableCell>Translator</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell>Last Login</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map(([userId, user]) => (
                  <TableRow 
                    key={userId} 
                    hover
                    onContextMenu={(e) => handleContextMenu(e, userId, user)}
                    sx={{ 
                      cursor: 'context-menu',
                      '&:nth-of-type(odd)': {
                        backgroundColor: theme.palette.grey[50]
                      }
                    }}
                  >
                    <TableCell>{userId}</TableCell>
                    <TableCell>
                      {getAccountTypeChip(user.accountType)}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        {user.email}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {getStatusChip(user.status)}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <LanguageIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        {user.language}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <TranslateIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        {user.translator}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <AccessTimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        {formatDate(user.createdAt)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <AccessTimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        {formatDate(user.lastLoginDate)}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                      <Typography variant="body2" color="textSecondary">
                        No users found matching your search
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>

      <Dialog
        open={showAddUser}
        onClose={() => setShowAddUser(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please enter the email and password for the new user.
          </DialogContentText>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              autoFocus
              margin="dense"
              id="email"
              label="Email Address"
              type="email"
              fullWidth
              variant="outlined"
              value={newUser.email}
              onChange={(e) => setNewUser({...newUser, email: e.target.value})}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              id="password"
              label="Password"
              type="password"
              fullWidth
              variant="outlined"
              value={newUser.password}
              onChange={(e) => setNewUser({...newUser, password: e.target.value})}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddUser(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddUser} variant="contained" color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editModalOpen}
        onClose={handleCloseEditModal}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Edit User Account Type</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Account Type</InputLabel>
              <Select
                value={selectedAccountType}
                onChange={handleAccountTypeChange}
                label="Account Type"
                autoFocus
              >
                <MenuItem value="free">Free</MenuItem>
                <MenuItem value="premium">Premium</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditModal}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showUsageStats}
        onClose={() => setShowUsageStats(false)}
        maxWidth="xl"
        fullWidth
        className="usage-stats-dialog"
      >
        <DialogTitle>Daily Login Usage</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Daily Login Trend
                  </Typography>
                  <Box className="chart-container">
                    {usageStats.dailyLoginUsage && usageStats.dailyLoginUsage.length > 0 ? (
                      <Line
                        data={{
                          labels: usageStats.dailyLoginUsage.map(day => 
                            new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })
                          ),
                          datasets: [
                            {
                              label: 'Users Logged In',
                              data: usageStats.dailyLoginUsage.map(day => day.count),
                              borderColor: theme.palette.primary.main,
                              backgroundColor: alpha(theme.palette.primary.main, 0.1),
                              tension: 0.3,
                              fill: true,
                              pointBackgroundColor: theme.palette.primary.main,
                              pointBorderColor: '#fff',
                              pointBorderWidth: 2,
                              pointRadius: 4,
                              pointHoverRadius: 6
                            }
                          ]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'top',
                            },
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  return `${context.dataset.label}: ${context.raw}`;
                                }
                              }
                            }
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: {
                                precision: 0
                              }
                            }
                          }
                        }}
                      />
                    ) : (
                      <Typography variant="body2" color="textSecondary" align="center">
                        No login data available for chart
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    User Login Activity
                  </Typography>
                  <Box className="table-scrollbar">
                    {usageStats.dailyLoginUsage && usageStats.dailyLoginUsage.length > 0 ? (
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Date</TableCell>
                              <TableCell align="right">Count</TableCell>
                              <TableCell>Details</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {usageStats.dailyLoginUsage.map((day, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  {new Date(day.date).toLocaleDateString()}
                                </TableCell>
                                <TableCell align="right">
                                  {day.count}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => {
                                      setSelectedDay(day);
                                      setShowUserDetails(true);
                                    }}
                                  >
                                    View
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography variant="body2" color="textSecondary" align="center">
                        No login data available
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Top Users
                  </Typography>
                  <Box className="table-scrollbar">
                    {usageStats.dailyLoginUsage && usageStats.dailyLoginUsage.length > 0 ? (
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell padding="checkbox">#</TableCell>
                              <TableCell>User</TableCell>
                              <TableCell align="right">Count</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {(() => {
                              const userLoginCounts = {};
                              usageStats.dailyLoginUsage.forEach(day => {
                                day.users.forEach(user => {
                                  if (!userLoginCounts[user.email]) {
                                    userLoginCounts[user.email] = {
                                      email: user.email,
                                      accountType: user.accountType,
                                      count: 0
                                    };
                                  }
                                  userLoginCounts[user.email].count++;
                                });
                              });
                              
                              const rankedUsers = Object.values(userLoginCounts)
                                .sort((a, b) => b.count - a.count);
                              
                              return rankedUsers.slice(0, 10).map((user, index) => (
                                <TableRow 
                                  key={index}
                                  sx={{ 
                                    backgroundColor: index < 3 ? alpha(theme.palette.primary.main, 0.05) : 'inherit'
                                  }}
                                >
                                  <TableCell padding="checkbox">
                                    <Box 
                                      sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 20,
                                        height: 20,
                                        borderRadius: '50%',
                                        backgroundColor: 
                                          index === 0 ? theme.palette.warning.main :
                                          index === 1 ? theme.palette.grey[400] :
                                          index === 2 ? theme.palette.warning.dark :
                                          theme.palette.grey[200],
                                        color: index < 3 ? 'white' : 'inherit',
                                        fontWeight: 'bold',
                                        fontSize: '0.75rem'
                                      }}
                                    >
                                      {index + 1}
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    <Box display="flex" alignItems="center">
                                      <EmailIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary', fontSize: '0.875rem' }} />
                                      <Typography variant="body2" noWrap sx={{ maxWidth: 100 }}>
                                        {user.email}
                                      </Typography>
                                      {user.accountType === 'premium' && (
                                        <Chip 
                                          label="P" 
                                          size="small" 
                                          color="primary" 
                                          sx={{ ml: 0.5, height: 20, fontSize: '0.7rem' }}
                                        />
                                      )}
                                    </Box>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography variant="body2" fontWeight="bold">
                                      {user.count}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              ));
                            })()}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography variant="body2" color="textSecondary" align="center">
                        No login data available for ranking
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUsageStats(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog
        open={showUserDetails}
        onClose={() => setShowUserDetails(false)}
        maxWidth="sm"
        fullWidth
        className="user-details-dialog"
      >
        <DialogTitle>
          Users Logged In on {selectedDay ? new Date(selectedDay.date).toLocaleDateString() : ''}
        </DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Account Type</TableCell>
                  <TableCell>Login Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedDay && selectedDay.users.map((user, index) => (
                  <TableRow key={index}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {getAccountTypeChip(user.accountType)}
                    </TableCell>
                    <TableCell>
                      {new Date(user.loginTime).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUserDetails(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Menu
        open={contextMenu.open}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu.mouseY !== null && contextMenu.mouseX !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
        className="context-menu"
      >
        <MenuItem onClick={() => handleContextMenuAction('edit')}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Account Type</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleContextMenuAction('resetPassword')}>
          <ListItemIcon>
            <LockResetIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Reset Password</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleContextMenuAction('delete')}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete User</ListItemText>
        </MenuItem>
      </Menu>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        className="snackbar"
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminDashboard; 