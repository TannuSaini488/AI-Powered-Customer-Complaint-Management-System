import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { ToastContainer } from "../components/ToastContainer";

export function AppLayout() {
  const { sidebarOpen } = useSelector((state: RootState) => state.ui);
  
  return (
    <div className={`app-shell ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <ToastContainer />
      <Sidebar />
      <div className="main-wrapper">
        <Navbar />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
