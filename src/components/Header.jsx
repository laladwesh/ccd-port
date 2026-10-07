import { PORTFOLIO } from "../hubs";

const Header = ({ hub }) => (
  <header className="site-header">
    <div className="site-header-inner">
      <a href={PORTFOLIO}>&larr; avinashgupta.in</a>
      <span className="hub-name">{hub.name}</span>
    </div>
  </header>
);

export default Header;
