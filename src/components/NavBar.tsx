import { NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="navbar">
      <a className="navbar__brand" href="/">CRUD Demo</a>
      <NavLink to="/" className="navbar__link">Home</NavLink>
      <NavLink to="/items" className="navbar__link">Items</NavLink>
      <NavLink to="/users" className="navbar__link">Users</NavLink>
    </nav>
  );
}
