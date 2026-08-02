import { NavLink } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../redux/store";
import { setSidebarOpen } from "../features/ui/uiSlice";

export function Sidebar() {
  const { sidebarOpen } = useSelector((state: RootState) => state.ui);
  const dispatch = useDispatch();

  if (!sidebarOpen) return null;

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">AI</span>
        <div>
          <strong>AIVOA QMS</strong>
          <small>Complaint Module</small>
        </div>
        <button onClick={() => dispatch(setSidebarOpen(false))} className="close-btn" style={{ marginLeft: "auto" }}>
          &times;
        </button>
      </div>
      <nav className="nav-list">
        <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "active" : "")}>
          Dashboard
        </NavLink>
        <NavLink to="/complaints" end className={({ isActive }) => (isActive ? "active" : "")}>
          Complaint History
        </NavLink>
        <NavLink to="/complaints/new" className={({ isActive }) => (isActive ? "active" : "")}>
          New Complaint
        </NavLink>
      </nav>
    </aside>
  );
}
