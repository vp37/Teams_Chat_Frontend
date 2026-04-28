import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { FaRegCommentDots, FaCalendarAlt, FaUsers, FaRegBell } from 'react-icons/fa';
import { SiGooglemeet } from "react-icons/si";
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../redux/AuthSlice'; 
import style from '../navbar/Navbar.module.css';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();


  const user = useSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout()); 
    navigate('/login');
  };

  return (
    <>
      {/* Top Navbar */}
      <div className={style.topNavbar}>
        <div className={style.logo}>Teams</div>

        <div className={style.topIcons}>
          {user ? (
            <>
              <span className={style.topLink}>{user.username}</span>
              <button onClick={handleLogout} className={style.topLink}>
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={style.topLink}>Login</NavLink>
              <NavLink to="/signup" className={style.topLink}>Signup</NavLink>
            </>
          )}
        </div>
      </div>

      {/* Left Sidebar */}
      <div className={style.navbarContainer}>
        <div className={style.naviconcontainer}>
          <NavLink to="/chat" className={style.navbarIcon1} title="Chat"
            style={{ color: location.pathname === '/chat' ? '#6264a7' : '#d1d1e0' }}>
            <FaRegCommentDots /><p>Chat</p>
          </NavLink>

          <NavLink to="/meet" className={style.navbarIcon1} title="Meet"
            style={{ color: location.pathname === '/meet' ? '#6264a7' : '#d1d1e0' }}>
            <SiGooglemeet /><p>Meet</p>
          </NavLink>

          <NavLink to="/teams" className={style.navbarIcon1} title="Teams"
            style={{ color: location.pathname === '/teams' ? '#6264a7' : '#d1d1e0' }}>
            <FaUsers /><p>Teams</p>
          </NavLink>

          <NavLink to="/calendar" className={style.navbarIcon1} title="Calendar"
            style={{ color: location.pathname === '/calendar' ? '#6264a7' : '#d1d1e0' }}>
            <FaCalendarAlt /><p>Calendar</p>
          </NavLink>

          <NavLink to="/activity" className={style.navbarIcon1} title="Activity"
            style={{ color: location.pathname === '/activity' ? '#6264a7' : '#d1d1e0' }}>
            <FaRegBell /><p>Activity</p>
          </NavLink>
        </div>
      </div>
    </>
  );
};

export default Navbar;
