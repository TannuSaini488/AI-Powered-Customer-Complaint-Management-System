import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../features/auth/authSlice";
import { toggleSidebar } from "../features/ui/uiSlice";
import { RootState } from "../redux/store";

export function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userName } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button onClick={() => dispatch(toggleSidebar())} className="menu-btn">
          &#9776;
        </button>
      </div>
      <div className="navbar-right">
        {userName && <span className="user-name">Welcome, {userName}</span>}
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>
    </header>
  );
}
